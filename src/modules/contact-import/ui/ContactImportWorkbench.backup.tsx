/**
 * 联系人导入工作台主组件 (重构版)
 * Employee D架构 - 单一职责：工作台布局与状态编排
 * 文件大小：≤500行，符合Employee D约束
 * 
 * 职责：
 * - 工作台整体布局（网格/传统）
 * - 状态编排（通过hooks）
 * - 组件组合和数据流
 */

import React, { useMemo, useState } from 'react';
import { 
  Card, Col, Row, Space, Button, Input, Divider, Tag, 
  TableAdapter as Table, 
  PaginationAdapter as Pagination,
  AlertCard as Alert,
  SwitchAdapter as Switch,
  Text
} from '../../../components/adapters';
import { DatabaseOutlined, FileTextOutlined, FolderOpenOutlined, MobileOutlined, FileDoneOutlined, LayoutOutlined } from '@ant-design/icons';
import styles from './ContactImportWorkbench.module.css';
import { GridLayoutWrapper, useGridLayout } from './components/grid-layout';
import BatchPreviewModal from './components/BatchPreviewModal';
import { DeviceAssignmentGrid } from './components/DeviceAssignmentGrid/DeviceAssignmentGrid';
import { findRangeConflicts } from '../utils/assignmentValidation';
import BatchResultModal from './components/BatchResultModal';
import ConflictNavigator from './components/ConflictNavigator';
import { BatchManagerDrawer } from './batch-manager';
import StatsBar from './components/StatsBar';
import { ImportSessionsModal } from './sessions';
import { useSourceFolders } from './hooks/useSourceFolders';
import { SourceFolderAddButton } from './components/SourceFolderAddButton';
import { SourceFoldersList } from './components/SourceFoldersList';
import WorkbenchNumbersActionsBar from './components/WorkbenchNumbersActionsBar';
import { useColumnSettings } from './components/columns/useColumnSettings';
import ColumnSettingsModal from './components/columns/ColumnSettingsModal';
import { useResizableColumns } from '../../../components/universal-ui/table/resizable';
import { useStaticDragFix } from './components/grid-layout/hooks/useStaticDragFix';

// 新的hooks和组件
import { useWorkbenchData } from './hooks/useWorkbenchData';
import { useWorkbenchActions } from './hooks/useWorkbenchActions';
import { getWorkbenchTableColumns, WorkbenchResizableHeader } from './components/WorkbenchTableColumns';
export const ContactImportWorkbench: React.FC = () => {
  // 数据管理hook
  const workbenchData = useWorkbenchData();
  
  // 事件处理hook
  const workbenchActions = useWorkbenchActions({
    onDataRefresh: async () => {
      await workbenchData.loadList();
      await workbenchData.loadStats();
    },
    assignment: workbenchData.assignment,
    onlyUnconsumed: workbenchData.onlyUnconsumed,
    hasItems: Boolean(workbenchData.items.length)
  });
  
  // 网格布局配置
  const [enableGridLayout, setEnableGridLayout] = useState(true);
  const defaultPanels = useMemo(() => [
    {
      i: 'devices-panel',
      x: 0,
      y: 0,
      w: 12,
      h: 8,
      minW: 6,
      minH: 6,
      visible: true,
      title: '设备与VCF',
    },
    {
      i: 'import-panel',
      x: 0,
      y: 8,
      w: 6,
      h: 6,
      minW: 4,
      minH: 4,
      visible: true,
      title: '导入 TXT 到号码池',
    },
    {
      i: 'numbers-panel',
      x: 6,
      y: 8,
      w: 6,
      h: 8,
      minW: 4,
      minH: 6,
      visible: true,
      title: '号码池',
    },
  ], []);
  
  const gridLayout = useGridLayout({ 
    defaultPanels,
    storageKey: 'contact-import-workbench-layout'
  });
  // 🚫 暂时禁用复杂的拖拽修复器，避免循环执行
  // const conflictResolver = useDragConflictResolver({
  //   autoFix: true,
  //   debug: false, // 生产环境关闭调试
  //   priority: 'table-resize' // 优先保护表格列宽拖拽
  // });
  // � 禁用强化拖拽修复器（避免过度修复）
  // const dragFixer = useDragFixer({
  //   enabled: true,
  //   intensity: 'aggressive', // 使用最强修复模式
  //   debug: process.env.NODE_ENV === 'development',
  //   targetTables: [
  //     '[data-testid="workbench-numbers-table"]',
  //     '    //     '[data-component="table-container"]''
  //   ]
  // });
  // � 禁用拖拽防护守卫
  // const dragGuards = useGridDragGuards({
  //   enabled: true,
  //   debug: process.env.NODE_ENV === 'development',
  //   tableSelectors: [
  //     '[data-testid="workbench-numbers-table"]',
  //     '.contact-import-table'
  //   ]
  // });
  // ✅ 使用简单静态修复器（一次性执行，无循环）
  useStaticDragFix({
    enabled: true,
    debug: false
  });
  // 设备
  // 顶部已默认加载设备卡片，不再需要单独“选择设备/刷新设备”控件
  // 号码池列表
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<ContactNumberDto[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [assignment, setAssignment] = useState<Record<string, { industry?: string; idStart?: number; idEnd?: number }>>({});
  const contactImportApp = useMemo(() => ServiceFactory.getContactImportApplicationService(), []);
  // 是否仅使用未消费号码（供下方设备卡片回调与批次生成共用）
  const [onlyUnconsumed, setOnlyUnconsumed] = useState<boolean>(true);
  // 号码池统计
  const [stats, setStats] = useState<ContactNumberStatsDto | null>(null);
  // 持久化的“文件夹路径列表”
  const { folders, addFolder, removeFolder, clearAll, hasItems } = useSourceFolders();
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
      message.error('加载号码池失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);
  useEffect(() => {
    loadList();
  }, [loadList]);
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
  // 列配置（可见性与列宽，带本地持久化）
  const columnDefaults = useMemo(() => ([
    { key: 'seq', title: '序号', defaultVisible: true, defaultWidth: 70 },
    { key: 'id', title: 'ID', defaultVisible: true, defaultWidth: 80 },
    { key: 'phone', title: '号码', defaultVisible: true },
    { key: 'name', title: '姓名', defaultVisible: true, defaultWidth: 180 },
    { key: 'industry', title: '行业分类', defaultVisible: true, defaultWidth: 120 },
    { key: 'status', title: '状态', defaultVisible: true, defaultWidth: 120 },
    { key: 'used', title: '是否已用', defaultVisible: true, defaultWidth: 100 },
    { key: 'imported_device_id', title: '导入设备', defaultVisible: true, defaultWidth: 150 },
    { key: 'source_file', title: '来源', defaultVisible: true },
    { key: 'created_at', title: '创建时间', defaultVisible: true, defaultWidth: 160 },
  ]), []);
  const columnSettings = useColumnSettings('contactImport.numberPool.columns', columnDefaults);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // 导入面板
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
      message.error(`导入失败: ${e}`);
    } finally { setLoading(false); }
  };
  const handleImportFolder = async () => {
    const folder = await selectFolder();
    if (!folder) return;
    setLoading(true);
    try {
      const res = await importNumbersFromFolder(folder);
      message.success(`文件 ${res.total_files}，写入 ${res.inserted}，重复 ${res.duplicates}`);
      loadList();
      loadStats();
    } catch (e) {
      message.error(`导入失败: ${e}`);
    } finally { setLoading(false); }
  };
  const handleImportFromSavedFolders = async () => {
    if (!folders.length) {
      message.info('请先添加至少一个文件夹路径');
      return;
    }
    setLoading(true);
    try {
      const res = await importNumbersFromFolders(folders);
      if (res.success) {
        message.success(`文件 ${res.total_files}，写入 ${res.inserted}，重复 ${res.duplicates}`);
      } else {
        message.error(`部分导入失败：写入 ${res.inserted}，重复 ${res.duplicates}`);
      }
      loadList();
      loadStats();
    } catch (e) {
      message.error(`导入失败: ${e}`);
    } finally { setLoading(false); }
  };
  // 生成并导入VCF
  const selectedItems = useMemo(() => items.filter(i => selectedRowKeys.includes(i.id)), [items, selectedRowKeys]);
  // 顶部快速按钮：提示使用下方设备卡片上的“生成VCF/导入”
  const handleTopLevelImportHint = () => {
    if (selectedItems.length === 0) {
      message.info('请先在右侧“号码池”勾选号码，然后到下方设备卡片上执行“生成VCF/导入”。');
    } else {
      message.info('已选择号码，可在下方任意设备卡片使用“生成VCF/导入”进行操作（支持批量选择设备）。');
    }
    // 可选：自动滚动到设备卡片区域
    const el = document.querySelector('[data-device-card]');
    if (el && 'scrollIntoView' in el) {
      (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };
  // 设备卡片：生成VCF（仅生成文件，不导入）
  const handleGenerateVcfForDevice = useCallback(async (deviceId: string, params: { start?: number; end?: number; industry?: string }) => {
    let { start, end } = params;
    try {
      // 若未设定区间：直接选取“未分类”的100个号码（仅未消费），避免使用连续区间导致误选
      if (typeof start !== 'number' || typeof end !== 'number' || end < start) {
        const unclassified = await fetchUnclassifiedNumbers(100, true);
        if (unclassified.length === 0) {
          message.warning('没有可用的未分类号码');
          return;
        }
        const content = buildVcfFromNumbers(unclassified as any);
        const filePath = `contacts_${deviceId}_auto_100_${Date.now()}.vcf`;
        await VcfImportService.writeVcfFile(filePath, content);
        const ids = unclassified.map(n => n.id).sort((a, b) => a - b);
        const batchId = `vcf_${deviceId}_${ids[0]}_${ids[ids.length - 1]}_${Date.now()}`;
        const { mappingOk } = await registerGeneratedBatch({
          deviceId,
          batchId,
          vcfFilePath: filePath,
          numberIds: ids,
          sourceStartId: ids[0],
          sourceEndId: ids[ids.length - 1],
        });
        message.success(`VCF 文件已生成：${filePath}`);
        if (!mappingOk) {
          message.warning('VCF已生成，但批次映射保存失败（后端未记录）。可稍后在会话面板重试。');
        }
        return;
      }
      // 有明确区间：保持原有按区间生成逻辑
      const batches = await contactImportApp.generateVcfBatches({ [deviceId]: { idStart: start!, idEnd: end!, industry: params.industry } }, { onlyUnconsumed });
      const batch = batches[0];
      const content = buildVcfFromNumbers((batch?.numbers || []) as any);
      const filePath = `contacts_${deviceId}_${start}-${end}.vcf`;
      await VcfImportService.writeVcfFile(filePath, content);
      const batchId = `vcf_${deviceId}_${start}_${end}_${Date.now()}`;
      const numberIds = (batch?.numbers || []).map(n => n.id);
      const { mappingOk } = await registerGeneratedBatch({
        deviceId,
        batchId,
        vcfFilePath: filePath,
        numberIds,
        sourceStartId: start,
        sourceEndId: end,
      });
      message.success(`VCF 文件已生成：${filePath}`);
      if (!mappingOk) {
        message.warning('VCF已生成，但批次映射保存失败（后端未记录）。可稍后在会话面板重试。');
      }
      // 行业可能在生成/导入前设置于 assignment，但号码库行业不变；状态栏无需刷新
    } catch (e) {
      message.error(`生成失败：${e}`);
    }
  }, [contactImportApp, onlyUnconsumed]);
  // 设备卡片：生成并导入到设备（根据脚本键选择实现）
  const handleImportToDeviceFromCard = useCallback(async (deviceId: string, params: { start?: number; end?: number; industry?: string; scriptKey?: string }) => {
    let { start, end, scriptKey } = params;
    try {
      // 若未设定区间：直接选取“未分类”的100个号码（未消费）生成VCF并导入
      if (typeof start !== 'number' || typeof end !== 'number' || end < start) {
        const unclassified = await fetchUnclassifiedNumbers(100, true);
        if (unclassified.length === 0) {
          message.warning('没有可用的未分类号码');
          return;
        }
        const vcfContent = buildVcfFromNumbers(unclassified as any);
        const tempPath = VcfImportService.generateTempVcfPath();
        await VcfImportService.writeVcfFile(tempPath, vcfContent);
        // 批次与映射 + 会话
        const ids = unclassified.map(n => n.id).sort((a, b) => a - b);
        const generatedBatchId = `vcf_${deviceId}_${ids[0]}_${ids[ids.length - 1]}_${Date.now()}`;
        const { mappingOk, sessionId } = await registerGeneratedBatch({
          deviceId,
          batchId: generatedBatchId,
          vcfFilePath: tempPath,
          numberIds: ids,
          sourceStartId: ids[0],
          sourceEndId: ids[ids.length - 1],
        });
        const vcfService = ServiceFactory.getVcfImportApplicationService();
        const outcome = await vcfService.importToDevice(deviceId, tempPath, scriptKey);
        try {
          if (sessionId != null) {
            const status = outcome.success ? 'success' : 'failed';
            await finishImportSessionRecord(sessionId, status as any, outcome.importedCount ?? 0, outcome.failedCount ?? 0, outcome.success ? undefined : outcome.message);
          }
          if (outcome.success) {
            markBatchImportedForDevice(deviceId, generatedBatchId);
          }
        } catch (e) {
          console.warn('完成导入会话记录失败：', e);
        }
        if (outcome.success) {
          message.success(`导入成功：${outcome.importedCount}`);
          if (!mappingOk) {
            message.warning('导入成功，但批次映射保存失败（后端未记录）。');
          }
        } else {
          message.error(outcome.message || '导入失败');
        }
        return;
      }
      // 有明确区间：保持原有逻辑
      const batches = await contactImportApp.generateVcfBatches({ [deviceId]: { idStart: start!, idEnd: end!, industry: params.industry } }, { onlyUnconsumed });
      const batch = batches[0];
      const vcfContent = buildVcfFromNumbers((batch?.numbers || []) as any);
      const tempPath = VcfImportService.generateTempVcfPath();
      await VcfImportService.writeVcfFile(tempPath, vcfContent);
      const generatedBatchId = `vcf_${deviceId}_${start}_${end}_${Date.now()}`;
      const numberIds = (batch?.numbers || []).map(n => n.id);
      const { mappingOk, sessionId } = await registerGeneratedBatch({
        deviceId,
        batchId: generatedBatchId,
        vcfFilePath: tempPath,
        numberIds,
        sourceStartId: start,
        sourceEndId: end,
      });
      const vcfService = ServiceFactory.getVcfImportApplicationService();
      const outcome = await vcfService.importToDevice(deviceId, tempPath, scriptKey);
      try {
        if (sessionId != null) {
          const status = outcome.success ? 'success' : 'failed';
          await finishImportSessionRecord(sessionId, status as any, outcome.importedCount ?? 0, outcome.failedCount ?? 0, outcome.success ? undefined : outcome.message);
        }
        if (outcome.success) {
          markBatchImportedForDevice(deviceId, generatedBatchId);
        }
      } catch (e) {
        console.warn('完成导入会话记录失败：', e);
      }
      if (outcome.success) {
        message.success(`导入成功：${outcome.importedCount}`);
        if (!mappingOk) {
          message.warning('导入成功，但批次映射保存失败（后端未记录）。');
        }
        // 导入不直接修改 used 标记，只有在预览执行批量时才可选标记；此处不刷新 stats
      } else {
        message.error(outcome.message || '导入失败');
      }
    } catch (e) {
      message.error(`导入失败：${e}`);
    }
  }, [contactImportApp, onlyUnconsumed]);
  const columns = useMemo(() => {
    const arr: any[] = [];
    for (const cfg of columnSettings.configs) {
      if (!cfg.visible) continue;
      switch (cfg.key) {
        case 'seq':
          arr.push({ title: cfg.title, width: cfg.width ?? 70, render: (_: any, __: any, index: number) => (page - 1) * pageSize + index + 1 });
          break;
        case 'id':
          arr.push({ title: cfg.title, dataIndex: 'id', width: cfg.width ?? 80 });
          break;
        case 'phone':
          arr.push({ title: cfg.title, dataIndex: 'phone', width: cfg.width });
          break;
        case 'name':
          arr.push({ title: cfg.title, dataIndex: 'name', width: cfg.width ?? 180 });
          break;
        case 'industry':
          arr.push({ title: cfg.title, dataIndex: 'industry', width: cfg.width ?? 120, render: (industry: string | null) => industry ? <Tag color="geekblue">{industry}</Tag> : <Text type="secondary">未分类</Text> });
          break;
        case 'status':
          arr.push({ title: cfg.title, dataIndex: 'status', width: cfg.width ?? 120, render: (status: string | null) => {
            const config = status === 'imported' ? { color: 'success', text: '已导入' } :
                          status === 'vcf_generated' ? { color: 'processing', text: 'VCF已生成' } :
                          status === 'not_imported' ? { color: 'default', text: '未导入' } :
                          { color: 'default', text: '未知' };
            return <Tag color={config.color}>{config.text}</Tag>;
          }});
          break;
        case 'used':
          arr.push({ title: cfg.title, dataIndex: 'used', width: cfg.width ?? 100, render: (used: number | null) => used === 1 ? <Tag color="warning">已使用</Tag> : used === 0 ? <Tag color="default">未使用</Tag> : <Tag color="default">-</Tag> });
          break;
        case 'imported_device_id':
          arr.push({ title: cfg.title, dataIndex: 'imported_device_id', width: cfg.width ?? 150, render: (deviceId: string | null) => deviceId ? <Tag color="blue" icon={<MobileOutlined />}>{deviceId}</Tag> : <Text type="secondary">-</Text> });
          break;
        case 'source_file':
          arr.push({ title: cfg.title, dataIndex: 'source_file', ellipsis: true, width: cfg.width });
          break;
        case 'created_at':
          arr.push({ title: cfg.title, dataIndex: 'created_at', width: cfg.width ?? 160, render: (time: string) => { try { return <Text>{new Date(time).toLocaleString('zh-CN')}</Text>; } catch { return <Text>{time}</Text>; } } });
          break;
        default:
          break;
      }
    }
    return arr;
  }, [columnSettings.configs, page, pageSize]);
  // 列宽拖拽（表头分隔线）集成
  const visibleCfgs = useMemo(() => columnSettings.configs.filter(c => c.visible), [columnSettings.configs]);
  const resizable = useResizableColumns(
    visibleCfgs.map(c => ({ key: c.key, width: (columns as any[]).find(col => (col.dataIndex ?? col.key) === c.key)?.width })),
    { onWidthChange: (key, width) => columnSettings.setWidth(key, width) }
  );
  const components = useMemo(() => ({
    header: {
      cell: (props: any) => {
        const key = props['data-key'] || props['data-col-key'] || props?.column?.dataIndex || props?.column?.key;
        const runtime = resizable.columns.find((c: any) => c.key === key);
        if (!runtime) return <th {...props} />;
        return (
          <ResizableHeaderCell
            {...props}
            width={runtime.width}
            minWidth={runtime.minWidth}
            maxWidth={runtime.maxWidth}
            onResizeStart={runtime.onResizeStart}
          />
        );
      }
    }
  }), [resizable.columns]);
  const hasInvalidRanges = useMemo(() => {
    return Object.values(assignment).some(cfg => {
      if (typeof cfg.idStart === 'number' && typeof cfg.idEnd === 'number') {
        return cfg.idStart > cfg.idEnd;
      }
      return false;
    });
  }, [assignment]);
  const allRangesEmpty = useMemo(() => {
    return Object.values(assignment).every(cfg => (typeof cfg.idStart !== 'number' || typeof cfg.idEnd !== 'number'));
  }, [assignment]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewBatches, setPreviewBatches] = useState<Array<{ deviceId: string; industry?: string; numbers: ContactNumberDto[] }>>([]);
  const [resultOpen, setResultOpen] = useState(false);
  const [lastResult, setLastResult] = useState<null | BatchExecuteResult>(null);
  const rangeConflicts = useMemo(() => {
    return findRangeConflicts(
      Object.fromEntries(Object.entries(assignment).map(([id, a]) => [id, { idStart: a.idStart, idEnd: a.idEnd }]))
    );
  }, [assignment]);
  const conflictDeviceIds = useMemo(() => {
    const s = new Set<string>();
    for (const c of rangeConflicts) { s.add(c.deviceA); s.add(c.deviceB); }
    return Array.from(s);
  }, [rangeConflicts]);
  const conflictPeersByDevice = useMemo(() => {
    const map: Record<string, Array<{ peerId: string; start: number; end: number }>> = {};
    for (const c of rangeConflicts) {
      (map[c.deviceA] ||= []).push({ peerId: c.deviceB, start: c.rangeB.start, end: c.rangeB.end });
      (map[c.deviceB] ||= []).push({ peerId: c.deviceA, start: c.rangeA.start, end: c.rangeA.end });
    }
    return map;
  }, [rangeConflicts]);
  const [currentJumpId, setCurrentJumpId] = useState<string | null>(null);
  const [batchDrawerOpen, setBatchDrawerOpen] = useState(false);
  const [sessionsModal, setSessionsModal] = useState<{ open: boolean; deviceId?: string; status?: 'all' | 'pending' | 'success' | 'failed' }>({ open: false });
  const handleJumpToDevice = useCallback((deviceId: string) => {
    // 兼容旧表格与新栅格卡片的定位
    const el = document.querySelector(`[data-device-card="${deviceId}"]`) || document.querySelector(`[data-row-key="${deviceId}"]`);
    if (el && 'scrollIntoView' in el) {
      (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setCurrentJumpId(deviceId);
  }, []);
  const handleGenerateBatches = async () => {
    try {
      // 生成前：区间冲突校验
      const conflicts = findRangeConflicts(
        Object.fromEntries(Object.entries(assignment).map(([id, a]) => [id, { idStart: a.idStart, idEnd: a.idEnd }]))
      );
      if (conflicts.length > 0) {
        message.error('发现区间冲突，请先修正再生成');
        return;
      }
      const batches = await contactImportApp.generateVcfBatches(assignment, { onlyUnconsumed });
      setPreviewBatches(batches as any);
      setPreviewOpen(true);
    } catch (e) {
      message.error(`生成批次失败：${e}`);
    }
  };
  const handleExecuteFromPreview = async (selectedDeviceIds: string[], options: { markConsumed: boolean }) => {
    try {
      const target = previewBatches.filter(b => selectedDeviceIds.includes(b.deviceId));
      const res = await executeBatches(target as any, options.markConsumed ? {
        markConsumed: async (batchId: string) => {
          // 使用应用层统一入口进行区间消费标记
          await contactImportApp.markConsumed(assignment, batchId);
        },
        perDeviceMaxRetries: 2,
        perDeviceRetryDelayMs: 500,
        interDeviceDelayMs: 150,
      } : {
        perDeviceMaxRetries: 2,
        perDeviceRetryDelayMs: 500,
        interDeviceDelayMs: 150,
      });
      message.success(`导入完成：成功 ${res.successDevices}/${res.totalDevices}`);
      setPreviewOpen(false);
      setLastResult(res);
      setResultOpen(true);
    } catch (e) {
      message.error(`批次导入失败：${e}`);
    }
  };
  // 渲染设备与VCF面板内容
  const renderDevicesPanel = () => (
    <>
      <StatsBar stats={stats} onRefresh={loadStats} />
      {rangeConflicts.length > 0 && (
        <Alert
          type="error"
          showIcon
          className={styles.alertCompact}
          message={`发现 ${rangeConflicts.length} 处区间冲突`}
          description={
            <div>
              {rangeConflicts.slice(0, 5).map((c, i) => (
                <div key={i}>设备 {c.deviceA} [{c.rangeA.start}-{c.rangeA.end}] 与 设备 {c.deviceB} [{c.rangeB.start}-{c.rangeB.end}] 重叠</div>
              ))}
              {rangeConflicts.length > 5 && <div style={{ opacity: 0.7 }}>仅显示前5条</div>}
            </div>
          }
        />
      )}
      <Space wrap>
        <Button type="primary" icon={<FileDoneOutlined />} onClick={handleTopLevelImportHint}>
          将所选号码生成VCF并导入设备（请在下方设备卡片执行）
        </Button>
      </Space>
      <Divider />
      <ConflictNavigator conflictIds={conflictDeviceIds} currentTargetId={currentJumpId} onJump={handleJumpToDevice} />
      <DeviceAssignmentGrid
        value={assignment}
        onChange={setAssignment}
        conflictingDeviceIds={conflictDeviceIds}
        conflictPeersByDevice={conflictPeersByDevice}
        onGenerateVcf={handleGenerateVcfForDevice}
        onImportToDevice={handleImportToDeviceFromCard}
        onOpenSessions={({ deviceId, status }) => setSessionsModal({ open: true, deviceId, status: (status ?? 'all') as any })}
      />
      <div className={styles.batchActionsRow}>
        <Button type="primary" onClick={handleGenerateBatches} disabled={hasInvalidRanges || allRangesEmpty}>
          根据分配生成VCF批次
        </Button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={onlyUnconsumed} onChange={e => setOnlyUnconsumed(e.target.checked)} />
          仅使用未消费号码
        </label>
        {hasInvalidRanges && <Text type="danger">存在非法区间（起始大于结束）</Text>}
        {allRangesEmpty && <Text type="secondary">请为至少一台设备设置有效区间</Text>}
      </div>
    </>
  );
  // 渲染导入面板内容
  const renderImportPanel = () => (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Space wrap style={{ marginBottom: 8 }}>
        <Button onClick={() => setBatchDrawerOpen(true)}>按批次/设备筛选</Button>
      </Space>
      <Text type="secondary">支持单个 TXT 或TXT文件夹，自动提取手机号码并去重入库</Text>
      <Space wrap>
        <Button icon={<FileTextOutlined />} onClick={handleImportTxt}>导入TXT文件</Button>
        <Button icon={<FolderOpenOutlined />} onClick={handleImportFolder}>导入文件夹</Button>
        <SourceFolderAddButton onAdded={addFolder} />
        <Button onClick={handleImportFromSavedFolders} disabled={!hasItems}>从已保存目录导入</Button>
      </Space>
      <SourceFoldersList folders={folders} onRemove={removeFolder} onClearAll={clearAll} />
      <Divider className={styles.dividerTight} />
      <div className={styles.searchBar}>
        <Input.Search
          placeholder="搜索 号码/姓名"
          allowClear
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
          className={styles.searchInput}
        />
        <Button onClick={loadList}>刷新列表</Button>
      </div>
    </Space>
  );
  // 渲染号码池面板内容
  const renderNumbersPanel = () => (
    <>
      <Space wrap style={{ marginBottom: 16 }}>
        <Button size="small" onClick={() => setSettingsOpen(true)}>列设置</Button>
        <Tag color="blue">共 {total} 条</Tag>
      </Space>
      <WorkbenchNumbersActionsBar
        selectedRowKeys={selectedRowKeys as number[]}
        pageItemIds={items.map(i => i.id)}
        onChangeSelected={(keys) => setSelectedRowKeys(keys as any)}
        onArchived={async () => {
          await loadList();
          await loadStats();
        }}
        disabled={loading}
        globalFilter={{ search }}
      />
      <Table
        rowKey="id"
        components={components as any}
        columns={(columns as any[]).map(c => ({
          ...c,
          key: c.key ?? c.dataIndex,
          onHeaderCell: () => ({ 'data-col-key': c.key ?? c.dataIndex }),
        })) as any}
        dataSource={items}
        loading={loading}
        size="middle"
        rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        pagination={false}
        scroll={{ x: true, y: 400 }}
      />
      <div className={styles.tableFooter}>
        <Pagination current={page} pageSize={pageSize} total={total} onChange={(p, ps) => { setPage(p); setPageSize(ps); }} showSizeChanger />
        <Text type="secondary">已选 {selectedRowKeys.length} 条</Text>
      </div>
    </>
  );
  return (
    <div>
      {/* 布局切换控制 */}
      <div 
        style={{ 
          marginBottom: 'var(--space-4)', 
          padding: 'var(--space-2) var(--space-4)', 
          backgroundColor: 'var(--bg-elevated)', 
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-primary)'
        }}
      >
        <Space>
          <LayoutOutlined />
          <Text>布局模式:</Text>
          <Switch 
            checked={enableGridLayout} 
            onChange={setEnableGridLayout}
            checkedChildren="网格布局"
            unCheckedChildren="传统布局"
          />
        </Space>
      </div>
      {enableGridLayout ? (
        <GridLayoutWrapper
          panels={gridLayout.panelConfigs.map(panel => ({
            ...panel,
            icon: panel.i === 'devices-panel' ? <MobileOutlined /> :
                  panel.i === 'import-panel' ? <DatabaseOutlined /> :
                  panel.i === 'numbers-panel' ? <DatabaseOutlined /> :
                  undefined,
            content: panel.i === 'devices-panel' ? renderDevicesPanel() :
                    panel.i === 'import-panel' ? renderImportPanel() :
                    panel.i === 'numbers-panel' ? renderNumbersPanel() :
                    <div>未知面板: {panel.i}</div>
          }))}
          onLayoutChange={gridLayout.handleLayoutChange}
          onPanelVisibilityChange={gridLayout.togglePanelVisibility}
        />
      ) : (
        <Row gutter={[16, 16]}>
          {/* 传统布局 */}
          <Col xs={24}>
            <Card title={<Space><MobileOutlined />设备与VCF</Space>}>
              {renderDevicesPanel()}
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title={<Space><DatabaseOutlined />导入 TXT 到号码池</Space>}>
              {renderImportPanel()}
            </Card>
          </Col>
          <Col xs={24} md={16}>
            <Card title={<Space><DatabaseOutlined />号码池</Space>}>
              {renderNumbersPanel()}
            </Card>
          </Col>
        </Row>
      )}
      {/* 模态框保持不变 */}
      <BatchPreviewModal
        open={previewOpen}
        batches={previewBatches as any}
        onCancel={() => setPreviewOpen(false)}
        onExecute={handleExecuteFromPreview}
      />
      <BatchResultModal
        open={resultOpen}
        result={lastResult}
        onClose={() => setResultOpen(false)}
        assignmentSnapshot={assignment}
        onRetryFailed={async () => {
          if (!lastResult) return;
          const failedIds = lastResult.deviceResults.filter(d => !d.success).map(d => d.deviceId);
          if (failedIds.length === 0) {
            message.info('没有失败的设备需要重试');
            return;
          }
          try {
            const retryBatches = previewBatches.filter(b => failedIds.includes(b.deviceId));
            const res = await executeBatches(retryBatches as any, {
              perDeviceMaxRetries: 2,
              perDeviceRetryDelayMs: 500,
              interDeviceDelayMs: 150,
            });
            setLastResult(res);
            message.success(`重试完成：成功 ${res.successDevices}/${res.totalDevices}`);
          } catch (e) {
            message.error(`重试失败：${e}`);
          }
          // 如果批量执行时选择了标记 consumed，则 stats 中的未导入计数会变化
          loadStats();
        }}
      />
      <BatchManagerDrawer open={batchDrawerOpen} onClose={() => setBatchDrawerOpen(false)} />
      <ImportSessionsModal
        open={sessionsModal.open}
        onClose={() => setSessionsModal({ open: false })}
        deviceId={sessionsModal.deviceId}
        status={sessionsModal.status}
      />
      <ColumnSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        configs={columnSettings.configs}
        onToggle={columnSettings.setVisible}
        onWidthChange={columnSettings.setWidth}
        onReset={columnSettings.reset}
        onReorder={columnSettings.reorder}
      />
    </div>
  );
};
export default ContactImportWorkbench;
