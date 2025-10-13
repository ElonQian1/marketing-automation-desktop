// src/modules/contact-import/ui/ContactImportWorkbench.tsx
// module: contact-import | layer: ui | role: module-component
// summary: 模块组件

// modules/contact-import/ui | ContactImportWorkbench.tsx | 联系人导入工作台主组件
// Employee D架构：工作台布局与状态编排，网格/传统布局切换，组件组合和数据流
// 职责：工作台整体布局、状态编排（通过hooks）、组件组合和数据流，≤500行约束

import React, { useMemo, useState } from 'react';
import { 
  Card, Col, Row, Space, Button, Divider, Tag, 
  TableAdapter as Table, 
  PaginationAdapter as Pagination,
  AlertCard as Alert,
  SwitchAdapter as Switch,
  Text,
  Search,
} from '../../../components/adapters';
import { DatabaseOutlined, FileTextOutlined, FolderOpenOutlined, MobileOutlined, FileDoneOutlined, LayoutOutlined, SettingOutlined } from '@ant-design/icons';
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
import { useTableColumns } from '../../../components/universal-ui/table/useTableColumns';
import { AntTableResizableHeader } from '../../../components/universal-ui/table/ResizableHeader';
import ColumnSettingsModal from './components/columns/ColumnSettingsModal';
import { useStaticDragFix } from './components/grid-layout/hooks/useStaticDragFix';
import { TxtImportRecordsList } from './components/TxtImportRecordsList';

// 新的hooks和组件
import { useWorkbenchData } from './hooks/useWorkbenchData';
import { useWorkbenchActions } from './hooks/useWorkbenchActions';
import { getWorkbenchTableColumns, WorkbenchResizableHeader } from './components/WorkbenchTableColumns';

export const ContactImportWorkbench: React.FC = () => {
  // 状态配置辅助函数
  const getStatusConfig = (status: string | null) => {
    switch (status) {
      case 'success': return { color: 'green', text: '成功' };
      case 'failed': return { color: 'red', text: '失败' };
      case 'pending': return { color: 'blue', text: '待导入' };
      default: return { color: 'default', text: '未知' };
    }
  };

  // 刷新计数器，用于触发子组件刷新
  const [refreshCounter, setRefreshCounter] = useState(0);

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
    { i: 'devices-panel', x: 0, y: 0, w: 12, h: 8, minW: 6, minH: 6, visible: true, title: '设备与VCF' },
    { i: 'import-panel', x: 0, y: 8, w: 6, h: 6, minW: 4, minH: 4, visible: true, title: '导入 TXT 到号码池' },
    { i: 'numbers-panel', x: 6, y: 8, w: 6, h: 8, minW: 4, minH: 6, visible: true, title: '号码池' },
  ], []);
  
  const gridLayout = useGridLayout({ 
    defaultPanels,
    storageKey: 'contact-import-workbench-layout'
  });

  // 拖拽修复
  useStaticDragFix({ enabled: true, debug: false });

  // 持久化的文件夹路径
  const { folders, addFolder, removeFolder, clearAll, hasItems } = useSourceFolders();

  // 统一的列管理系统（同时支持拖拽调整和设置界面）
  const tableColumns = useTableColumns({
    configs: [
      { 
        key: 'id', 
        title: 'ID', 
        dataIndex: 'id',
        defaultVisible: true, 
        defaultWidth: 80,
        resizable: true,
      },
      { 
        key: 'phone_number', 
        title: '号码', 
        dataIndex: 'phone_number',
        defaultVisible: true, 
        defaultWidth: 500,
        resizable: true,
        render: (value: string) => <Text copyable>{value}</Text>,
      },
      { 
        key: 'display_name', 
        title: '姓名', 
        dataIndex: 'display_name',
        defaultVisible: true, 
        defaultWidth: 180,
        resizable: true,
      },
      { 
        key: 'industry', 
        title: '行业分类', 
        dataIndex: 'industry',
        defaultVisible: true, 
        defaultWidth: 120,
        resizable: true,
        render: (industry: string | null) => {
          if (!industry) return <Text type="secondary">未分类</Text>;
          return <Tag color="geekblue">{industry}</Tag>;
        },
      },
      { 
        key: 'status', 
        title: '状态', 
        dataIndex: 'status',
        defaultVisible: true, 
        defaultWidth: 120,
        resizable: true,
        render: (status: string | null) => {
          const config = getStatusConfig(status);
          return <Tag color={config.color}>{config.text}</Tag>;
        },
      },
      { 
        key: 'used', 
        title: '状态', 
        dataIndex: 'status',
        defaultVisible: true, 
        defaultWidth: 120,
        resizable: true,
        render: (status: string | null) => {
          switch (status) {
            case 'available': return <Tag color="success">可用</Tag>;
            case 'assigned': return <Tag color="processing">已分配</Tag>;
            case 'imported': return <Tag color="warning">已导入</Tag>;
            case 'archived': return <Tag color="default">已归档</Tag>;
            default: return <Tag color="default">-</Tag>;
          }
        },
      },
      { 
        key: 'imported_device_id', 
        title: '导入设备', 
        dataIndex: 'imported_device_id',
        defaultVisible: true, 
        defaultWidth: 150,
        resizable: true,
        render: (deviceId: string | null) => {
          if (!deviceId) return <Text type="secondary">未导入</Text>;
          return (
            <Space>
              <MobileOutlined style={{ color: '#1890ff' }} />
              <Text>{deviceId}</Text>
            </Space>
          );
        },
      },
      { 
        key: 'created_at', 
        title: '创建时间', 
        dataIndex: 'created_at',
        defaultVisible: true, 
        defaultWidth: 160,
        resizable: true,
        render: (time: string) => {
          if (!time) return '-';
          return new Date(time).toLocaleString('zh-CN');
        },
      },
    ],
    storageKey: 'contact-import-workbench-columns'
  });
  
  // 列设置模态框状态
  const [settingsOpen, setSettingsOpen] = useState(false);

  // 计算冲突
  const rangeConflicts = useMemo(() => 
    findRangeConflicts(workbenchData.assignment), 
    [workbenchData.assignment]
  );

  const hasInvalidRanges = Object.values(workbenchData.assignment).some(
    config => config.idStart && config.idEnd && config.idStart > config.idEnd
  );

  const allRangesEmpty = Object.values(workbenchData.assignment).every(
    config => !config.idStart || !config.idEnd
  );

  const conflictDeviceIds = rangeConflicts.map(c => c.deviceA).concat(
    rangeConflicts.map(c => c.deviceB)
  ).filter((id, index, arr) => arr.indexOf(id) === index);

  // 渲染设备面板内容
  const renderDevicesPanel = () => (
    <>
      <StatsBar stats={workbenchData.stats} onRefresh={workbenchData.loadStats} />
      {rangeConflicts.length > 0 && (
        <Alert
          type="error"
          message="设备ID范围冲突"
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
        <Button type="primary" icon={<FileDoneOutlined />} onClick={workbenchActions.handleTopLevelImportHint}>
          批量导入到设备
        </Button>
      </Space>
      <Divider />
      <ConflictNavigator conflictIds={conflictDeviceIds} currentTargetId={workbenchActions.currentJumpId} onJump={workbenchActions.handleJumpToDevice} />
      <DeviceAssignmentGrid
        value={workbenchData.assignment}
        onChange={workbenchData.setAssignment}
        onGenerateVcf={workbenchActions.handleGenerateVcfForDevice}
        onImportToDevice={workbenchActions.handleImportToDeviceFromCard}
        onOpenSessions={({ deviceId, status }) => workbenchActions.setSessionsModal({ open: true, deviceId, status: (status ?? 'all') as any })}
      />
      <div className={styles.batchActionsRow}>
        <Button type="primary" onClick={workbenchActions.handleGenerateBatches} disabled={hasInvalidRanges || allRangesEmpty}>
          生成批次
        </Button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={workbenchData.onlyUnconsumed} onChange={e => workbenchData.setOnlyUnconsumed(e.target.checked)} />
          仅使用未消费号码
        </label>
        {hasInvalidRanges && <Text type="danger">存在非法区间（起始大于结束）</Text>}
        {allRangesEmpty && <Text type="secondary">请为至少一台设备设置有效区间</Text>}
      </div>
    </>
  );

  // 渲染导入面板内容
  const renderImportPanel = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {/* 导入操作区 */}
      <div>
        <Space wrap style={{ marginBottom: 8 }}>
          <Button onClick={() => workbenchActions.setBatchDrawerOpen(true)}>按批次/设备筛选</Button>
        </Space>
        <Text type="secondary">支持单个 TXT 或TXT文件夹，自动提取手机号码并去重入库</Text>
        <Space wrap style={{ marginTop: 8 }}>
          <Button 
            icon={<FileTextOutlined />} 
            onClick={async () => {
              await workbenchActions.handleImportTxt();
              setRefreshCounter(prev => prev + 1); // 刷新记录列表
            }}
          >
            导入TXT文件
          </Button>
          <Button 
            icon={<FolderOpenOutlined />} 
            onClick={async () => {
              await workbenchActions.handleImportFolder();
              setRefreshCounter(prev => prev + 1); // 刷新记录列表
            }}
          >
            导入文件夹
          </Button>
          <SourceFolderAddButton onAdded={addFolder} />
          <Button 
            onClick={async () => {
              await workbenchActions.handleImportFromSavedFolders();
              setRefreshCounter(prev => prev + 1); // 刷新记录列表
            }} 
            disabled={!hasItems}
          >
            从已保存目录导入
          </Button>
        </Space>
        <SourceFoldersList folders={folders} onRemove={removeFolder} onClearAll={clearAll} />
      </div>

      {/* TXT 导入记录展示 */}
      <TxtImportRecordsList refresh={refreshCounter} />
    </Space>
  );

  // 渲染号码池面板内容  
  const renderNumbersPanel = () => (
    <>
      <Space wrap style={{ marginBottom: 16 }}>
        <Button 
          icon={<SettingOutlined />} 
          onClick={() => setSettingsOpen(true)}
        >
          列设置
        </Button>
        <Tag color="blue">共 {workbenchData.total} 条</Tag>
        <Tag color="green">显示 {tableColumns.visibleCount} / {tableColumns.totalCount} 列</Tag>
      </Space>
      <WorkbenchNumbersActionsBar
        selectedRowKeys={workbenchData.selectedRowKeys as number[]}
        pageItemIds={workbenchData.items.map(i => i.id as number)}
        onChangeSelected={workbenchData.setSelectedRowKeys}
        onArchived={async () => { await workbenchData.loadList(); }}
        disabled={workbenchData.loading}
        globalFilter={{ search: workbenchData.search }}
      />
      <Table
        rowKey="id"
        dataSource={workbenchData.items}
        columns={tableColumns.columns}
        loading={workbenchData.loading}
        pagination={false}
        rowSelection={{
          selectedRowKeys: workbenchData.selectedRowKeys,
          onChange: workbenchData.setSelectedRowKeys,
        }}
        components={{
          header: {
            cell: AntTableResizableHeader,
          },
        }}
        scroll={{ x: true, y: 400 }}
      />
      <div className={styles.tableFooter}>
        <Pagination current={workbenchData.page} pageSize={workbenchData.pageSize} total={workbenchData.total} onChange={(p, ps) => { workbenchData.setPage(p); workbenchData.setPageSize(ps); }} showSizeChanger />
        <Text type="secondary">已选 {workbenchData.selectedRowKeys.length} 条</Text>
      </div>
    </>
  );

  // 主渲染
  return (
    <div>
      {/* 布局切换 */}
      <div
        style={{
          position: 'fixed',
          top: 80,
          right: 16,
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '8px 16px',
          borderRadius: 6,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
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

      {/* 主内容 */}
      {enableGridLayout ? (
        <GridLayoutWrapper
          panels={gridLayout.panelConfigs.map(panel => ({
            ...panel,
            content: panel.i === 'devices-panel' ? renderDevicesPanel() :
                     panel.i === 'import-panel' ? renderImportPanel() :
                     panel.i === 'numbers-panel' ? renderNumbersPanel() :
                     <div>未知面板: {panel.i}</div>,
            icon: panel.i === 'devices-panel' ? <MobileOutlined /> :
                  panel.i === 'import-panel' ? <DatabaseOutlined /> :
                  panel.i === 'numbers-panel' ? <DatabaseOutlined /> :
                  null
          }))}
          onLayoutChange={gridLayout.handleLayoutChange}
          onPanelVisibilityChange={gridLayout.togglePanelVisibility}
        />
      ) : (
        <Row gutter={[16, 16]}>
          {/* 传统布局 */}
          <Col xs={24}>
            <Card title={'设备与VCF'}>
              {renderDevicesPanel()}
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title={'导入 TXT 到号码池'}>
              {renderImportPanel()}
            </Card>
          </Col>
          <Col xs={24} md={16}>
            <Card title={'号码池'}>
              {renderNumbersPanel()}
            </Card>
          </Col>
        </Row>
      )}

      {/* 模态框 */}
      <BatchPreviewModal
        open={workbenchActions.previewOpen}
        batches={workbenchActions.previewBatches}
        onCancel={() => workbenchActions.setPreviewOpen(false)}
        onExecute={workbenchActions.handleExecuteFromPreview}
      />
      <BatchResultModal
        open={workbenchActions.resultOpen}
        result={workbenchActions.lastResult}
        onClose={() => workbenchActions.setResultOpen(false)}
        onRetryFailed={() => {
          // 可在此触发失败项重试逻辑或打开会话
        }}
      />
      <BatchManagerDrawer open={workbenchActions.batchDrawerOpen} onClose={() => workbenchActions.setBatchDrawerOpen(false)} />
      <ImportSessionsModal
        open={workbenchActions.sessionsModal.open}
        onClose={() => workbenchActions.setSessionsModal({ open: false })}
        deviceId={workbenchActions.sessionsModal.deviceId}
        status={workbenchActions.sessionsModal.status}
      />
      <ColumnSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        configs={tableColumns.allColumns.map(col => ({
          key: col.key,
          title: col.title,
          visible: col.visible,
          width: col.width
        }))}
        onToggle={tableColumns.setVisible}
        onWidthChange={tableColumns.setWidth}
        onReorder={(keys) => tableColumns.setOrder && tableColumns.setOrder(keys)}
        onReset={tableColumns.reset}
      />
    </div>
  );
};

export default ContactImportWorkbench;