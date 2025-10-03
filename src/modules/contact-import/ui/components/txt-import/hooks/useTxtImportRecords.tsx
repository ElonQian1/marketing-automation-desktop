import { useCallback, useEffect, useState } from 'react';
import { TxtImportRecordDto, listTxtImportRecords } from '../../../services/txtImportRecordService';

interface PaginationState {
  current: number;
  pageSize: number;
}

export function useTxtImportRecords(visible: boolean) {
  const persistedPageSize = (() => {
    try {
      const v = localStorage.getItem('txtImport.pageSize');
      const n = v ? parseInt(v, 10) : NaN;
      return Number.isFinite(n) && n > 0 ? n : 10;
    } catch {
      return 10;
    }
  })();
  const [records, setRecords] = useState<TxtImportRecordDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [pagination, setPagination] = useState<PaginationState>({ current: 1, pageSize: persistedPageSize });

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const { current, pageSize } = pagination;
      const offset = (current - 1) * pageSize;
      const result = await listTxtImportRecords({ limit: pageSize, offset });
      setRecords(result.items);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize]);

  const handleTableChange = useCallback((newPagination: any) => {
    setPagination({ current: newPagination.current, pageSize: newPagination.pageSize });
    try {
      localStorage.setItem('txtImport.pageSize', String(newPagination.pageSize));
    } catch {}
  }, []);

  useEffect(() => {
    if (visible) {
      loadRecords();
    }
  }, [visible, loadRecords]);

  return {
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
  };
}
