import { useState, useEffect } from "react";
import { message } from "antd";
import {
  TxtImportRecordDto,
  listTxtImportRecords,
  deleteTxtImportRecord,
  bulkDeleteTxtImportRecords,
} from "../../../services/txtImportRecordService";

export interface UseRecordsManagerOptions {
  visible: boolean;
  onDataRefresh?: () => void;
}

export interface UseRecordsManagerReturn {
  // 数据状态
  records: TxtImportRecordDto[];
  loading: boolean;
  total: number;
  
  // 分页状态
  pagination: {
    current: number;
    pageSize: number;
  };
  
  // 选择状态
  selectedRowKeys: React.Key[];
  bulkDeleting: boolean;
  
  // 操作方法
  loadRecords: () => Promise<void>;
  handleTableChange: (newPagination: any) => void;
  handleDeleteRecord: (record: TxtImportRecordDto, archiveNumbers: boolean) => Promise<void>;
  handleBulkDelete: (archiveNumbers: boolean) => Promise<void>;
  setSelectedRowKeys: (keys: React.Key[]) => void;
}

/**
 * TXT导入记录管理逻辑Hook
 * 封装所有数据操作和状态管理逻辑
 */
export const useRecordsManager = ({ 
  visible, 
  onDataRefresh 
}: UseRecordsManagerOptions): UseRecordsManagerReturn => {
  const [records, setRecords] = useState<TxtImportRecordDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // 分页设置
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  // 加载数据
  const loadRecords = async () => {
    try {
      setLoading(true);
      const { current, pageSize } = pagination;
      const offset = (current - 1) * pageSize;
      const result = await listTxtImportRecords({
        limit: pageSize,
        offset,
      });
      setRecords(result.items);
      setTotal(result.total);
    } catch (error) {
      console.error("加载TXT导入记录失败:", error);
      message.error("加载导入记录失败");
    } finally {
      setLoading(false);
    }
  };

  // 监听分页变化
  const handleTableChange = (newPagination: any) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  // 删除单个记录
  const handleDeleteRecord = async (
    record: TxtImportRecordDto,
    archiveNumbers: boolean
  ) => {
    try {
      const result = await deleteTxtImportRecord(record.id, archiveNumbers);
      if (result.success) {
        const actionText = archiveNumbers ? "归档并删除" : "删除";
        const archiveInfo =
          archiveNumbers && result.archivedNumberCount > 0
            ? `，恢复号码 ${result.archivedNumberCount} 个为未导入`
            : "";
        message.success(
          `已${actionText}记录"${record.fileName}"${archiveInfo}`
        );
        await loadRecords();
        onDataRefresh?.();
      } else {
        message.error("删除记录失败");
      }
    } catch (error) {
      console.error("删除记录失败:", error);
      message.error("删除记录失败");
    }
  };

  // 批量删除记录
  const handleBulkDelete = async (archiveNumbers: boolean) => {
    if (selectedRowKeys.length === 0) {
      message.warning("请选择要删除的记录");
      return;
    }

    try {
      setBulkDeleting(true);
      const recordIds = selectedRowKeys
        .map((key) => Number(key))
        .filter((id) => !isNaN(id));
      const result = await bulkDeleteTxtImportRecords(
        recordIds,
        archiveNumbers
      );

      const actionText = archiveNumbers ? "归档并删除" : "删除";
      const archiveInfo =
        archiveNumbers && result.archivedNumberCount > 0
          ? `，恢复号码 ${result.archivedNumberCount} 个为未导入`
          : "";

      if (result.succeeded > 0) {
        message.success(
          `已${actionText} ${result.succeeded} 个记录${archiveInfo}`
        );
      }

      if (result.failed.length > 0) {
        message.error(`${result.failed.length} 个记录删除失败`);
      }

      setSelectedRowKeys([]);
      await loadRecords();
      onDataRefresh?.();
    } catch (error) {
      console.error("批量删除失败:", error);
      message.error("批量删除失败");
    } finally {
      setBulkDeleting(false);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    if (visible) {
      loadRecords();
    }
  }, [visible, pagination.current, pagination.pageSize]);

  return {
    // 数据状态
    records,
    loading,
    total,
    
    // 分页状态
    pagination,
    
    // 选择状态
    selectedRowKeys,
    bulkDeleting,
    
    // 操作方法
    loadRecords,
    handleTableChange,
    handleDeleteRecord,
    handleBulkDelete,
    setSelectedRowKeys,
  };
};