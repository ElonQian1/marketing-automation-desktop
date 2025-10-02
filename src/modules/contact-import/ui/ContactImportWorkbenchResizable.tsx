import React, { useCallback, useEffect, useMemo, useState } from "react";
import { message } from "antd";
import { selectFolder, selectTxtFile } from "./utils/dialog";
import {
  importNumbersFromFolder,
  importNumbersFromFolders,
  importNumbersFromTxtFile,
  listContactNumbers,
  ContactNumberDto,
} from "./services/contactNumberService";
import { VcfActions } from "./services/vcfActions";
import { VcfImportService } from "../../../services/VcfImportService";
import { buildVcfFromNumbers } from "../utils/vcf";
import { finishImportSessionRecord } from "./services/contactNumberService";
import { fetchUnclassifiedNumbers } from "./services/unclassifiedService";
import { markBatchImportedForDevice } from "./services/deviceBatchBinding";
import BatchPreviewModal from "./components/BatchPreviewModal";
import { executeBatches } from "./services/batchExecutor";
import ServiceFactory from "../../../application/services/ServiceFactory";
import { findRangeConflicts } from "../utils/assignmentValidation";
import BatchResultModal from "./components/BatchResultModal";
import type { BatchExecuteResult } from "./services/batchExecutor";
import { BatchManagerDrawer } from "./batch-manager";
import {
  getContactNumberStats,
  ContactNumberStatsDto,
} from "./services/stats/contactStatsService";
import { ImportSessionsModal } from "./sessions";
import { useSourceFolders } from "./hooks/useSourceFolders";
import { registerGeneratedBatch } from "./services/vcfBatchRegistrationService";
import WorkbenchNumbersActionsBar from "./components/WorkbenchNumbersActionsBar";

// 导入可拖拽布局系统
import {
  LayoutManager,
  DEFAULT_PANELS,
  DeviceAssignmentPanel,
  TxtImportPanel,
  NumberPoolPanel,
} from "./components/resizable-layout";

export const ContactImportWorkbenchResizable: React.FC = () => {
  // 号码池列表状态
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<ContactNumberDto[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // 设备分配状态
  const [assignment, setAssignment] = useState<
    Record<string, { industry?: string; idStart?: number; idEnd?: number }>
  >({});
  const contactImportApp = useMemo(
    () => ServiceFactory.getContactImportApplicationService(),
    []
  );
  const [onlyUnconsumed, setOnlyUnconsumed] = useState<boolean>(true);

  // 统计和UI状态
  const [stats, setStats] = useState<ContactNumberStatsDto | null>(null);
  const { folders, addFolder, removeFolder, clearAll, hasItems } =
    useSourceFolders();

  // 模态框状态
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewBatches, setPreviewBatches] = useState<
    Array<{ deviceId: string; industry?: string; numbers: ContactNumberDto[] }>
  >([]);
  const [resultOpen, setResultOpen] = useState(false);
  const [lastResult, setLastResult] = useState<null | BatchExecuteResult>(null);
  const [batchDrawerOpen, setBatchDrawerOpen] = useState(false);
  const [sessionsModal, setSessionsModal] = useState<{
    open: boolean;
    deviceId?: string;
    status?: string;
  }>({ open: false });
  const [currentJumpId, setCurrentJumpId] = useState<string | null>(null);

  // 加载号码池列表
  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listContactNumbers({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        search: search.trim() || undefined,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (e) {
      console.error(e);
      message.error("加载号码池失败");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  // 加载统计
  const loadStats = useCallback(async () => {
    try {
      const s = await getContactNumberStats();
      setStats(s);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // TXT导入功能
  const handleImportTxt = async () => {
    const file = await selectTxtFile();
    if (!file) return;
    setLoading(true);
    try {
      const res = await importNumbersFromTxtFile(file);
      message.success(`写入 ${res.inserted} 条，重复 ${res.duplicates}`);
      loadList();
      loadStats();
    } catch (e) {
      message.error(`导入失败：${e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImportFolder = async () => {
    const folder = await selectFolder();
    if (!folder) return;
    setLoading(true);
    try {
      const res = await importNumbersFromFolder(folder);
      message.success(`写入 ${res.inserted} 条，重复 ${res.duplicates}`);
      loadList();
      loadStats();
    } catch (e) {
      message.error(`导入失败：${e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImportFromSavedFolders = async () => {
    if (!hasItems) return;
    setLoading(true);
    try {
      const res = await importNumbersFromFolders(folders);
      message.success(`写入 ${res.inserted} 条，重复 ${res.duplicates}`);
      loadList();
      loadStats();
    } catch (e) {
      message.error(`导入失败：${e}`);
    } finally {
      setLoading(false);
    }
  };

  // 其他业务逻辑方法保持不变
  const rangeConflicts = useMemo(() => {
    return findRangeConflicts(
      Object.fromEntries(
        Object.entries(assignment).map(([id, a]) => [
          id,
          { idStart: a.idStart, idEnd: a.idEnd },
        ])
      )
    );
  }, [assignment]);

  const conflictDeviceIds = useMemo(() => {
    const s = new Set<string>();
    for (const c of rangeConflicts) {
      s.add(c.deviceA);
      s.add(c.deviceB);
    }
    return Array.from(s);
  }, [rangeConflicts]);

  const conflictPeersByDevice = useMemo(() => {
    const result: Record<
      string,
      { peerId: string; start: number; end: number }[]
    > = {};
    for (const c of rangeConflicts) {
      if (!result[c.deviceA]) result[c.deviceA] = [];
      if (!result[c.deviceB]) result[c.deviceB] = [];
      result[c.deviceA].push({
        peerId: c.deviceB,
        start: c.rangeB.start,
        end: c.rangeB.end,
      });
      result[c.deviceB].push({
        peerId: c.deviceA,
        start: c.rangeA.start,
        end: c.rangeA.end,
      });
    }
    return result;
  }, [rangeConflicts]);

  const hasInvalidRanges = useMemo(() => {
    return Object.values(assignment).some((cfg) => {
      if (typeof cfg.idStart === "number" && typeof cfg.idEnd === "number") {
        return cfg.idStart > cfg.idEnd;
      }
      return false;
    });
  }, [assignment]);

  const allRangesEmpty = useMemo(() => {
    return Object.values(assignment).every(
      (cfg) => typeof cfg.idStart !== "number" || typeof cfg.idEnd !== "number"
    );
  }, [assignment]);

  // 面板内容配置
  const panelContents = [
    {
      id: "device-assignment",
      content: (
        <DeviceAssignmentPanel
          stats={stats}
          assignment={assignment}
          rangeConflicts={rangeConflicts}
          conflictDeviceIds={conflictDeviceIds}
          conflictPeersByDevice={conflictPeersByDevice}
          currentJumpId={currentJumpId}
          hasInvalidRanges={hasInvalidRanges}
          allRangesEmpty={allRangesEmpty}
          onlyUnconsumed={onlyUnconsumed}
          onRefreshStats={loadStats}
          onAssignmentChange={setAssignment}
          onGenerateVcfForDevice={() => {
            /* TODO */
          }}
          onImportToDevice={() => {
            /* TODO */
          }}
          onOpenSessions={(params) =>
            setSessionsModal({ open: true, ...params })
          }
          onGenerateBatches={() => {
            /* TODO */
          }}
          onTopLevelImportHint={() =>
            message.info("请在下方设备卡片中执行具体操作")
          }
          onJumpToDevice={setCurrentJumpId}
          onUnconsumedChange={setOnlyUnconsumed}
        />
      ),
    },
    {
      id: "txt-import",
      content: (
        <TxtImportPanel
          folders={folders}
          hasItems={hasItems}
          onImportTxt={handleImportTxt}
          onImportFolder={handleImportFolder}
          onAddFolder={addFolder}
          onRemoveFolder={removeFolder}
          onClearAll={clearAll}
          onImportFromSavedFolders={handleImportFromSavedFolders}
          onDataRefresh={() => {
            loadList();
            loadStats();
          }}
        />
      ),
    },
    {
      id: "number-pool",
      content: (
        <NumberPoolPanel
          loading={loading}
          items={items}
          total={total}
          page={page}
          pageSize={pageSize}
          search={search}
          selectedRowKeys={selectedRowKeys}
          onSearch={setSearch}
          onPageChange={(p, ps) => {
            setPage(p);
            setPageSize(ps);
          }}
          onSelectedRowKeysChange={setSelectedRowKeys}
          onRefresh={loadList}
        />
      ),
    },
  ];

  return (
    <>
      <LayoutManager
        defaultPanels={DEFAULT_PANELS}
        panelContents={panelContents}
      />

      {/* 保留原有的模态框 */}
      <BatchPreviewModal
        open={previewOpen}
        batches={previewBatches as any}
        onCancel={() => setPreviewOpen(false)}
        onExecute={async () => {
          /* TODO */
        }}
      />

      <BatchResultModal
        open={resultOpen}
        result={lastResult}
        onClose={() => setResultOpen(false)}
        assignmentSnapshot={assignment}
        onRetryFailed={async () => {
          /* TODO */
        }}
      />

      <ImportSessionsModal
        open={sessionsModal.open}
        deviceId={sessionsModal.deviceId}
        status={sessionsModal.status as any}
        onClose={() => setSessionsModal({ open: false })}
      />

      <BatchManagerDrawer
        open={batchDrawerOpen}
        onClose={() => setBatchDrawerOpen(false)}
      />
    </>
  );
};
