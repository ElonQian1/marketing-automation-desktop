// src/modules/contact-import/ui/batch-manager/BatchManagerDrawer.tsx
// module: contact-import | layer: ui | role: module-component
// summary: 模块组件

import React, { useState } from 'react';
import { Drawer, Tabs, Space, Divider } from 'antd';
import FiltersBar from './components/FiltersBar';
import NumbersTable from './components/NumbersTable';
import SessionsTable from './components/SessionsTable';
import ActionsBar from './components/ActionsBar';
import { BulkActionsBar } from './components/bulk-actions';
import { useBatchData } from './hooks/useBatchData';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import type { BatchFilterState } from './types';
import { ContactNumberDto } from '../services/contactNumberService';
import styles from './BatchManagerDrawer.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
}

const BatchManagerDrawer: React.FC<Props> = ({ open, onClose }) => {
  const [filter, setFilter] = useState<BatchFilterState>({ mode: 'all' });
  const [numbersFilters, setNumbersFilters] = useState<{ status?: string | null; industry?: string | null }>({});
  const debouncedSearch = useDebouncedValue(filter.search, 400);
  const effectiveFilter = { ...filter, search: debouncedSearch } as BatchFilterState;
  // 简单分页状态（后续可抽到 hook 内）
  const [numbersPage, setNumbersPage] = useState({ page: 1, pageSize: 50 });
  const [sessionsPage, setSessionsPage] = useState({ page: 1, pageSize: 50 });
  const [lastSessionId, setLastSessionId] = useState<number | undefined>(undefined);
  
  // 批量选择状态（新增）
  const [selectedNumbers, setSelectedNumbers] = useState<ContactNumberDto[]>([]);
  
  const { loading, batches, sessions, numbers, reload } = useBatchData(
    {
      ...effectiveFilter,
      numbersStatus: numbersFilters.status ?? null,
      numbersIndustry: numbersFilters.industry ?? null,
    },
    {
    numbers: { limit: numbersPage.pageSize, offset: (numbersPage.page - 1) * numbersPage.pageSize },
    sessions: { limit: sessionsPage.pageSize, offset: (sessionsPage.page - 1) * sessionsPage.pageSize },
    }
  );

  // 批量操作回调
  const handleSelectionChange = (selectedRows: ContactNumberDto[], selectedRowKeys: React.Key[]) => {
    setSelectedNumbers(selectedRows);
  };

  const handleClearSelection = () => {
    setSelectedNumbers([]);
  };

  const handleArchiveComplete = async () => {
    await reload();
    setSelectedNumbers([]);
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      className={styles.drawer}
      title="按批次/设备筛选号码池"
    >
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        <FiltersBar value={filter} onChange={setFilter} batches={batches} />
        <ActionsBar
          mode={filter.mode as 'all' | 'by-batch' | 'no-batch'}
          batch={filter.batchId ? batches?.items.find(b => b.batch_id === filter.batchId) ?? null : null}
          numbers={numbers}
          onActionDone={async (opts) => {
            if (opts?.lastSessionId) setLastSessionId(opts.lastSessionId);
            await reload();
          }}
        />
        <Divider style={{ margin: '8px 0' }} />
        <Tabs
          items={[
            { key: 'numbers', label: '号码', children: (
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <BulkActionsBar
                  selectedNumbers={selectedNumbers}
                  onClearSelection={handleClearSelection}
                  onArchiveComplete={handleArchiveComplete}
                  loading={loading}
                />
                <NumbersTable
                  data={numbers}
                  loading={loading}
                  pagination={{
                    current: numbersPage.page,
                    pageSize: numbersPage.pageSize,
                    total: numbers?.total || 0,
                    onChange: (page, pageSize) => setNumbersPage({ page, pageSize }),
                  }}
                  onRefresh={reload}
                  controlledFilters={{
                    status: numbersFilters.status ?? null,
                    industry: numbersFilters.industry ?? null,
                    onChange: setNumbersFilters,
                  }}
                  selection={{
                    selectedRows: selectedNumbers,
                    onChange: handleSelectionChange,
                    getCheckboxProps: (record) => ({
                      disabled: loading, // 加载时禁用选择
                    }),
                  }}
                />
              </Space>
            ) },
            { key: 'sessions', label: '导入会话', children: (
              <SessionsTable
                data={sessions}
                loading={loading}
                highlightId={lastSessionId}
                pagination={{
                  current: sessionsPage.page,
                  pageSize: sessionsPage.pageSize,
                  total: sessions?.total || 0,
                  onChange: (page, pageSize) => setSessionsPage({ page, pageSize }),
                }}
                onRefresh={reload}
              />
            ) },
          ]}
        />
      </Space>
    </Drawer>
  );
};

export default BatchManagerDrawer;
