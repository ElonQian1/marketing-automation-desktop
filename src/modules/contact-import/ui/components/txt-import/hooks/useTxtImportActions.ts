import { Modal, Space, Button, message } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { TxtImportRecordDto, bulkDeleteTxtImportRecords, deleteTxtImportRecord } from '../../../services/txtImportRecordService';

interface UseTxtImportActionsParams {
  records: TxtImportRecordDto[];
  selectedRowKeys: React.Key[];
  setSelectedRowKeys: (keys: React.Key[]) => void;
  loadRecords: () => Promise<void> | void;
  onDataRefresh?: () => void;
}

export function useTxtImportActions({
  records,
  selectedRowKeys,
  setSelectedRowKeys,
  loadRecords,
  onDataRefresh,
}: UseTxtImportActionsParams) {
  const handleDeleteRecord = async (record: TxtImportRecordDto, archiveNumbers: boolean) => {
    try {
      const result = await deleteTxtImportRecord(record.id, archiveNumbers);
      if (result.success) {
        const actionText = archiveNumbers ? '归档并删除' : '删除';
        const archiveInfo = archiveNumbers && result.archived_number_count > 0
          ? `，恢复号码 ${result.archived_number_count} 个为未导入`
          : '';
        message.success(`已${actionText}记录"${record.file_name}"${archiveInfo}`);
        await loadRecords();
        onDataRefresh?.();
      } else {
        message.error('删除记录失败');
      }
    } catch (error) {
      console.error('删除记录失败:', error);
      message.error('删除记录失败');
    }
  };

  const performBulkDelete = async (archiveNumbers: boolean, setBulkDeleting?: (b: boolean) => void) => {
    try {
      setBulkDeleting?.(true);
      const recordIds = selectedRowKeys.map((key) => Number(key)).filter((id) => !isNaN(id));
      const result = await bulkDeleteTxtImportRecords(recordIds, archiveNumbers);

      const actionText = archiveNumbers ? '归档并删除' : '删除';
      const archiveInfo = archiveNumbers && result.archivedNumberCount > 0
        ? `，恢复号码 ${result.archivedNumberCount} 个为未导入`
        : '';

      if (result.succeeded > 0) {
        message.success(`已${actionText} ${result.succeeded} 个记录${archiveInfo}`);
      }
      if (result.failed.length > 0) {
        message.error(`${result.failed.length} 个记录删除失败`);
      }

      setSelectedRowKeys([]);
      await loadRecords();
      onDataRefresh?.();
    } catch (error) {
      console.error('批量删除失败:', error);
      message.error('批量删除失败');
    } finally {
      setBulkDeleting?.(false);
    }
  };

  const handleBulkDelete = (archiveNumbers: boolean) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的记录');
      return;
    }

    const recordIds = selectedRowKeys.map((key) => Number(key)).filter((id) => !isNaN(id));
    const selectedRecords = records.filter((r) => recordIds.includes(r.id));

    Modal.confirm({
      title: `批量删除确认`,
      icon: <ExclamationCircleOutlined />,
      content: (
        <div style={{ fontSize: 12, lineHeight: 1.6 }}>
          <p>将删除以下 {selectedRecords.length} 个导入记录：</p>
          <ul style={{ paddingLeft: 18, marginBottom: 12 }}>
            {selectedRecords.slice(0, 5).map((record) => (
              <li key={record.id}>
                {record.file_name} ({record.imported_numbers} 个号码)
              </li>
            ))}
            {selectedRecords.length > 5 && (
              <li>... 另外 {selectedRecords.length - 5} 个记录</li>
            )}
          </ul>
          <p style={{ marginBottom: 0 }}>请选择删除方式：</p>
          <ul style={{ paddingLeft: 18, marginBottom: 0 }}>
            <li>
              <strong>直接删除</strong>：仅移除记录，保留号码当前状态。
            </li>
            <li>
              <strong>号码归档</strong>：将相关号码恢复为未导入并释放批次占用。
            </li>
          </ul>
        </div>
      ),
      okButtonProps: { style: { display: 'none' } },
      cancelButtonProps: { style: { display: 'none' } },
      footer: () => (
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={() => Modal.destroyAll()}>取消</Button>
          <Button
            danger
            onClick={() => {
              Modal.destroyAll();
              performBulkDelete(false);
            }}
          >
            直接删除
          </Button>
          <Button
            type="primary"
            onClick={() => {
              Modal.destroyAll();
              performBulkDelete(true);
            }}
          >
            号码归档后删除
          </Button>
        </Space>
      ),
    });
  };

  return {
    handleDeleteRecord,
    handleBulkDelete,
    performBulkDelete,
  };
}
