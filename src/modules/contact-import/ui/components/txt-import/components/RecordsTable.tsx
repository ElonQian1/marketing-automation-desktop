import React, { useMemo, useState, useEffect } from 'react';
import { Table, Typography, Space, Tag, Popover, Checkbox, Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import { FileTextOutlined } from '@ant-design/icons';
import { TxtImportRecordDto } from '../../../services/txtImportRecordService';
import { RecordActions } from './RecordActions';

const { Text } = Typography;

interface PaginationLike {
  current: number;
  pageSize: number;
  total: number;
}

interface RecordsTableProps {
  records: TxtImportRecordDto[];
  loading: boolean;
  pagination: PaginationLike;
  selectedRowKeys: React.Key[];
  setSelectedRowKeys: (keys: React.Key[]) => void;
  onChange: (pagination: any) => void;
  onDelete: (record: TxtImportRecordDto) => void;
  onArchive: (record: TxtImportRecordDto) => void;
  onViewError?: (record: TxtImportRecordDto) => void;
}

export const RecordsTable: React.FC<RecordsTableProps> = ({
  records,
  loading,
  pagination,
  selectedRowKeys,
  setSelectedRowKeys,
  onChange,
  onDelete,
  onArchive,
  onViewError,
}) => {
  const allColumns = ['file_name','total_numbers','imported_numbers','duplicate_numbers','status','created_at','actions'] as const;
  type ColKey = typeof allColumns[number];
  const [visibleCols, setVisibleCols] = useState<Record<ColKey, boolean>>(() => {
    try {
      const raw = localStorage.getItem('txtImport.visibleCols');
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      file_name: true,
      total_numbers: true,
      imported_numbers: true,
      duplicate_numbers: true,
      status: true,
      created_at: true,
      actions: true,
    };
  });

  useEffect(() => {
    try { localStorage.setItem('txtImport.visibleCols', JSON.stringify(visibleCols)); } catch {}
  }, [visibleCols]);
  const columns: ColumnsType<TxtImportRecordDto> = useMemo(() => [
    {
      title: '文件名',
      dataIndex: 'file_name',
      key: 'file_name',
      width: 200,
      render: (fileName: string) => (
        <Space>
          <FileTextOutlined style={{ color: 'var(--brand, #6e8bff)' }} />
          <Text ellipsis={{ tooltip: fileName }} style={{ maxWidth: 150 }}>
            {fileName}
          </Text>
        </Space>
      ),
    },
    {
      title: '总数',
      dataIndex: 'total_numbers',
      key: 'total_numbers',
      width: 80,
      align: 'center' as const,
      render: (count: number) => <Text>{count}</Text>,
    },
    {
      title: '成功',
      dataIndex: 'imported_numbers',
      key: 'imported_numbers',
      width: 80,
      align: 'center' as const,
      render: (count: number) => (
        <Text style={{ color: 'var(--success, #10b981)', fontWeight: 'bold' }}>{count}</Text>
      ),
    },
    {
      title: '重复',
      dataIndex: 'duplicate_numbers',
      key: 'duplicate_numbers',
      width: 80,
      align: 'center' as const,
      render: (count: number) => <Text style={{ color: 'var(--warning, #f59e0b)' }}>{count}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center' as const,
      render: (status: string) => {
        const colors: Record<string, string> = {
          success: 'green',
          failed: 'red',
          partial: 'orange',
        };
        const labels: Record<string, string> = {
          success: '成功',
          failed: '失败',
          partial: '部分成功',
        };
        return <Tag color={colors[status] || 'default'}>{labels[status] || status}</Tag>;
      },
    },
    {
      title: '导入时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (time: string) => (
        <Text style={{ fontSize: '12px' }}>{new Date(time).toLocaleString()}</Text>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <RecordActions
          record={record}
          onDelete={onDelete}
          onArchive={onArchive}
          onViewError={onViewError}
        />
      ),
    },
  ], [onDelete, onArchive, onViewError]);

  const filteredColumns = useMemo(() => columns.filter((c) => visibleCols[(c.key as ColKey) ?? 'actions'] !== false), [columns, visibleCols]);

  const defaultVisibleCols: Record<ColKey, boolean> = {
    file_name: true,
    total_numbers: true,
    imported_numbers: true,
    duplicate_numbers: true,
    status: true,
    created_at: true,
    actions: true,
  };

  const visibilityPanel = (
    <div style={{ padding: 8, width: 200 }}>
      {allColumns.map((key) => (
        <div key={key} style={{ marginBottom: 6 }}>
          <Checkbox
            checked={visibleCols[key] !== false}
            onChange={(e) => setVisibleCols((prev) => ({ ...prev, [key]: e.target.checked }))}
            disabled={key === 'actions'}
          >
            {({
              file_name: '文件名',
              total_numbers: '总数',
              imported_numbers: '成功',
              duplicate_numbers: '重复',
              status: '状态',
              created_at: '导入时间',
              actions: '操作',
            } as Record<ColKey, string>)[key]}
          </Checkbox>
        </div>
      ))}
      <div style={{ textAlign: 'right', marginTop: 8 }}>
        <Button size="small" onClick={() => setVisibleCols(defaultVisibleCols)}>重置为默认</Button>
      </div>
    </div>
  );

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    getCheckboxProps: (record: TxtImportRecordDto) => ({ name: record.file_name }),
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <Popover content={visibilityPanel} placement="bottomRight" trigger="click">
          <Button size="small" icon={<SettingOutlined />}>列显示</Button>
        </Popover>
      </div>
      <Table
      rowKey="id"
      columns={columns}
      dataSource={records}
      loading={loading}
      locale={{ emptyText: '暂无导入记录' }}
      rowSelection={rowSelection}
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
      }}
      onChange={onChange}
      size="small"
      scroll={{ y: 400 }}
      />
    </div>
  );
};
