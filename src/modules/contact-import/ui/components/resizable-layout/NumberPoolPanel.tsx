// src/modules/contact-import/ui/components/resizable-layout/NumberPoolPanel.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React, { useState } from 'react';
import { Space, Divider, Typography, Button, message } from 'antd';
import { Table, Input, Pagination } from 'antd';
import { InboxOutlined, DeleteOutlined } from '@ant-design/icons';
import ConfirmPopover from '../../../../../components/universal-ui/common-popover/ConfirmPopover';
import { useNumberPoolTable, ColumnConfigPanel } from '../number-pool-table';
import { ContactNumberDto, markContactNumbersAsNotImportedBatch, deleteContactNumbersBatch } from '../../services/contactNumberService';

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
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // 使用号码池表格配置
  const tableConfig = useNumberPoolTable({
    page,
    pageSize,
    devices: [], // 这里可以传入设备信息
  });

  const totalSelected = selectedRowKeys.length;

  // 🔍 调试：检查数据
  React.useEffect(() => {
    if (items.length > 0) {
      console.log('📊 号码池数据示例：', items[0]);
      console.log('  - phone:', items[0]?.phone);
      console.log('  - name:', items[0]?.name);
      console.log('  - source_file:', items[0]?.source_file);
    }
  }, [items]);

  const handleArchive = async () => {
    if (totalSelected === 0) return;
    try {
      setArchiving(true);
      const affected = await markContactNumbersAsNotImportedBatch(selectedRowKeys as number[]);
      message.success(`已重置 ${affected} 条号码状态为"未导入"`);
      onRefresh();
      onSelectedRowKeysChange([]);
    } catch (e) {
      console.error(e);
      const msg = (e as any)?.message || String(e);
      message.error(`重置失败：${msg}`);
    } finally {
      setArchiving(false);
    }
  };

  const handleDelete = async () => {
    if (totalSelected === 0) return;
    try {
      setDeleting(true);
      const affected = await deleteContactNumbersBatch(selectedRowKeys as number[]);
      message.success(`已永久删除 ${affected} 条号码记录`);
      onRefresh();
      onSelectedRowKeysChange([]);
    } catch (e) {
      console.error(e);
      const msg = (e as any)?.message || String(e);
      message.error(`删除失败：${msg}`);
    } finally {
      setDeleting(false);
    }
  };

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

      {/* 批量操作按钮 */}
      {totalSelected > 0 && (
        <div style={{
          marginBottom: 12,
          padding: '8px 12px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <Text type="secondary">已选 {totalSelected} 条</Text>
          <Divider type="vertical" />
          <Space size="small">
            <ConfirmPopover
              mode="default"
              title="确认重置状态"
              description={`将 ${totalSelected} 条号码重置为"未导入"状态？\n\n💡 此操作会保留号码记录，但清除导入历史，使其可重新分配使用。`}
              okText="确认重置"
              cancelText="取消"
              onConfirm={handleArchive}
              disabled={totalSelected === 0}
            >
              <Button
                type="primary"
                size="small"
                icon={<InboxOutlined />}
                loading={archiving}
                disabled={totalSelected === 0}
              >
                重置为未导入
              </Button>
            </ConfirmPopover>
            <ConfirmPopover
              mode="default"
              title="⚠️ 永久删除警告"
              description={
                <div>
                  <p style={{ marginBottom: '8px' }}>
                    确认要<strong style={{ color: 'var(--error)' }}>永久删除</strong> {totalSelected} 条号码记录吗？
                  </p>
                  <p style={{ 
                    fontSize: '12px', 
                    color: 'var(--error)', 
                    background: 'var(--error-bg)',
                    padding: '8px',
                    borderRadius: '4px',
                    marginTop: '8px'
                  }}>
                    ⚠️ 此操作不可恢复！记录将从数据库中彻底删除。
                  </p>
                </div>
              }
              okText="确认删除"
              cancelText="取消"
              onConfirm={handleDelete}
              disabled={totalSelected === 0}
            >
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                loading={deleting}
                disabled={totalSelected === 0}
              >
                永久删除
              </Button>
            </ConfirmPopover>
          </Space>
        </div>
      )}

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