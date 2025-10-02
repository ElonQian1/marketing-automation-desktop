import React, { useMemo } from 'react';
import { Table, Typography, Space, Tag } from 'antd';
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
}) => {
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
        />
      ),
    },
  ], [onDelete, onArchive]);

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    getCheckboxProps: (record: TxtImportRecordDto) => ({ name: record.file_name }),
  };

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={records}
      loading={loading}
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
  );
};
