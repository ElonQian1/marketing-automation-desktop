import React from 'react';
import { message } from 'antd';
import { TxtImportRecordDto, bulkDeleteTxtImportRecords, deleteTxtImportRecord } from '../../../services/txtImportRecordService';
import { confirmBulkDeleteDialog } from '../logic/ConfirmBulkDeleteDialog';

interface UseTxtImportActionsParams {
  records: TxtImportRecordDto[];
  selectedRowKeys: React.Key[];
  setSelectedRowKeys: (keys: React.Key[]) => void;
  loadRecords: () => Promise<void> | void;
  onDataRefresh?: () => void;
  setBulkDeleting?: (b: boolean) => void;
}

export function useTxtImportActions({
  records,
  selectedRowKeys,
  setSelectedRowKeys,
  loadRecords,
  onDataRefresh,
  setBulkDeleting,
}: UseTxtImportActionsParams) {
  const handleDeleteRecord = async (record: TxtImportRecordDto, archiveNumbers: boolean) => {
    try {
      const result = await deleteTxtImportRecord(record.id, archiveNumbers);
      if (result.success) {
        const actionText = archiveNumbers ? '归档并删除' : '删除';
        const archiveInfo = archiveNumbers && result.archivedNumberCount > 0
          ? `，恢复号码 ${result.archivedNumberCount} 个为未导入`
          : '';
        message.success(`已${actionText}记录"${record.fileName}"${archiveInfo}`);
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

  const performBulkDelete = async (archiveNumbers: boolean) => {
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

    confirmBulkDeleteDialog(
      selectedRecords,
      () => performBulkDelete(false),
      () => performBulkDelete(true),
    );
  };

  return {
    handleDeleteRecord,
    handleBulkDelete,
    performBulkDelete,
  };
}
