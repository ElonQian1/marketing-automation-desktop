import React from 'react';
import { Space, Divider, Typography } from 'antd';
import { Table, Input, Pagination } from 'antd';
import { useNumberPoolTable, ColumnConfigPanel } from '../number-pool-table';
import { ContactNumberDto } from '../../services/contactNumberService';

const { Text } = Typography;

interface NumberPoolPanelProps {
  loading: boolean;
  items: ContactNumberDto[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  selectedRowKeys: React.Key[];
  onSearch: (value: string) => void;
  onPageChange: (page: number, pageSize: number) => void;
  onSelectedRowKeysChange: (keys: React.Key[]) => void;
  onRefresh: () => void;
}

export const NumberPoolPanel: React.FC<NumberPoolPanelProps> = ({
  loading,
  items,
  total,
  page,
  pageSize,
  search,
  selectedRowKeys,
  onSearch,
  onPageChange,
  onSelectedRowKeysChange,
  onRefresh,
}) => {
  // 使用号码池表格配置
  const tableConfig = useNumberPoolTable({
    page,
    pageSize,
    devices: [], // 这里可以传入设备信息
  });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 搜索和工具栏 */}
      <div style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Input.Search
            placeholder="搜索 号码/姓名"
            allowClear
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            onSearch={onSearch}
            style={{ width: 250 }}
          />
          <ColumnConfigPanel
            availableColumns={tableConfig.availableColumns}
            visibleColumns={tableConfig.visibleColumns}
            onToggleColumn={tableConfig.toggleColumn}
            onResetColumns={tableConfig.resetColumns}
          />
        </Space>
      </div>

      <Divider style={{ margin: '8px 0' }} />

      {/* 表格 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Table
          rowKey="id"
          columns={tableConfig.columns}
          dataSource={items}
          loading={loading}
          size="small"
          rowSelection={{
            selectedRowKeys,
            onChange: onSelectedRowKeysChange,
          }}
          pagination={false}
          scroll={{ x: 'max-content', y: 'calc(100% - 60px)' }}
        />
      </div>

      {/* 分页和统计 */}
      <div style={{
        marginTop: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
        borderTop: '1px solid #f0f0f0',
      }}>
        <Text type="secondary">
          已选 {selectedRowKeys.length} 条，共 {total} 条数据
        </Text>
        <Pagination
          current={page}
          pageSize={pageSize}
          total={total}
          onChange={onPageChange}
          showSizeChanger
          showQuickJumper
          size="small"
        />
      </div>
    </div>
  );
};