// src/modules/contact-import/ui/components/txt-import/TxtImportRecordsModal.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Modal, Space, Button, Alert, Typography } from 'antd';
import { FileTextOutlined, ReloadOutlined, InboxOutlined } from '@ant-design/icons';
import { TxtImportRecordDto } from '../../services/txtImportRecordService';
import { useTxtImportRecords, useTxtImportActions } from './hooks';
import { RecordsTable, ErrorDetailModal } from './components';
import { DeviceImportFileSelectorDialog } from '../device-import-file-selector-dialog';

const { Text } = Typography;

export interface TxtImportRecordsManagerProps {
  visible: boolean;
  onClose: () => void;
  onDataRefresh?: () => void;
}

export const TxtImportRecordsManager: React.FC<TxtImportRecordsManagerProps> = ({
  visible,
  onClose,
  onDataRefresh,
}) => {
  const [errorModalOpen, setErrorModalOpen] = React.useState(false);
  const [errorRecord, setErrorRecord] = React.useState<TxtImportRecordDto | null>(null);
  
  // 导入到设备相关状态
  const [importDialogOpen, setImportDialogOpen] = React.useState(false);
  const [selectedFileForImport, setSelectedFileForImport] = React.useState<string | null>(null);
  
  const {
    records,
    total,
    loading,
    pagination,
    selectedRowKeys,
    setSelectedRowKeys,
    handleTableChange,
    loadRecords,
    bulkDeleting,
    setBulkDeleting,
  } = useTxtImportRecords(visible);

  const { handleDeleteRecord, handleBulkDelete } = useTxtImportActions({
    records,
    selectedRowKeys,
    setSelectedRowKeys,
    loadRecords,
    onDataRefresh,
    setBulkDeleting,
  });

  // 处理导入到设备按钮点击
  const handleImportToDevice = (record: TxtImportRecordDto) => {
    setSelectedFileForImport(record.filePath);
    setImportDialogOpen(true);
  };

  // 导入成功回调
  const handleImportSuccess = () => {
    loadRecords();
    if (onDataRefresh) {
      onDataRefresh();
    }
  };

  return (
    <Modal
      className="light-theme-force"
      title={
        <Space>
          <FileTextOutlined />
          <span>TXT导入记录管理</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="refresh" icon={<ReloadOutlined />} onClick={loadRecords}>
          刷新
        </Button>,
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* 顶部统计与批量操作 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Text>
              共 {total} 条记录
              {selectedRowKeys.length > 0 && (
                <span style={{ marginLeft: 8, color: 'var(--brand, #6e8bff)' }}>
                  已选择 {selectedRowKeys.length} 条
                </span>
              )}
            </Text>
          </Space>

          <Space>
            <Button size="small" onClick={() => setSelectedRowKeys([])} disabled={selectedRowKeys.length === 0}>
              取消选择
            </Button>
            <Button
              type="primary"
              size="small"
              danger
              loading={bulkDeleting}
              disabled={selectedRowKeys.length === 0}
              onClick={() => handleBulkDelete(false)}
            >
              批量删除
            </Button>
            <Button
              type="primary"
              size="small"
              loading={bulkDeleting}
              disabled={selectedRowKeys.length === 0}
              onClick={() => handleBulkDelete(true)}
              icon={<InboxOutlined />}
            >
              批量归档
            </Button>
          </Space>
        </div>

        {/* 说明信息 */}
        <Alert
          type="info"
          showIcon
          message="导入记录说明"
          description={
            <div style={{ fontSize: '12px' }}>
              <p style={{ marginBottom: 4 }}>
                • <strong>直接删除</strong>：仅移除导入记录，保留号码当前状态
              </p>
              <p style={{ marginBottom: 0 }}>
                • <strong>归档删除</strong>：删除记录同时将相关号码重置为"未导入"状态，释放批次占用
              </p>
            </div>
          }
        />

        {/* 数据表格 */}
        <RecordsTable
          records={records}
          loading={loading}
          pagination={{ ...pagination, total }}
          selectedRowKeys={selectedRowKeys}
          setSelectedRowKeys={setSelectedRowKeys}
          onChange={handleTableChange}
          onDelete={(record: TxtImportRecordDto) => handleDeleteRecord(record, false)}
          onArchive={(record: TxtImportRecordDto) => handleDeleteRecord(record, true)}
          onViewError={(record: TxtImportRecordDto) => {
            setErrorRecord(record);
            setErrorModalOpen(true);
          }}
          onImportToDevice={handleImportToDevice}
        />

        <ErrorDetailModal
          open={errorModalOpen}
          record={errorRecord}
          onClose={() => setErrorModalOpen(false)}
        />
      </Space>

      {/* 设备导入对话框 */}
      <DeviceImportFileSelectorDialog
        open={importDialogOpen}
        onClose={() => {
          setImportDialogOpen(false);
          setSelectedFileForImport(null);
        }}
        onImportSuccess={handleImportSuccess}
        defaultSelectedFiles={selectedFileForImport ? [selectedFileForImport] : []}
      />
    </Modal>
  );
};

export default TxtImportRecordsManager;
