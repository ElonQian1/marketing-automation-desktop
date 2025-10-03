import React, { useMemo, useState, useEffect } from 'react';
import { Table, Typography, Space, Tag, Popover, Checkbox, Button, message } from 'antd';
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
  const allColumns = ['fileName','validNumbers','importedNumbers','duplicateNumbers','status','createdAt','actions'] as const;
  type ColKey = typeof allColumns[number];
  const [visibleCols, setVisibleCols] = useState<Record<ColKey, boolean>>(() => {
    try {
      const raw = localStorage.getItem('txtImport.visibleCols');
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      fileName: true,
      validNumbers: true,
      importedNumbers: true,
      duplicateNumbers: true,
      status: true,
      createdAt: true,
      actions: true,
    };
  });

  useEffect(() => {
    try { localStorage.setItem('txtImport.visibleCols', JSON.stringify(visibleCols)); } catch {}
  }, [visibleCols]);

  const [titleMap, setTitleMap] = useState<Record<ColKey, string>>(() => {
    try {
      const raw = localStorage.getItem('txtImport.titleMap');
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      fileName: '文件名',
      validNumbers: '总数',
      importedNumbers: '成功',
      duplicateNumbers: '重复',
      status: '状态',
      createdAt: '导入时间',
      actions: '操作',
    };
  });

  useEffect(() => {
    try { localStorage.setItem('txtImport.titleMap', JSON.stringify(titleMap)); } catch {}
  }, [titleMap]);
  const columns: ColumnsType<TxtImportRecordDto> = useMemo(() => [
    {
      title: titleMap.fileName,
      dataIndex: 'fileName',
      key: 'fileName',
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
      title: titleMap.validNumbers,
      dataIndex: 'validNumbers',
      key: 'validNumbers',
      width: 80,
      align: 'center' as const,
      render: (count: number) => <Text>{count}</Text>,
    },
    {
      title: titleMap.importedNumbers,
      dataIndex: 'importedNumbers',
      key: 'importedNumbers',
      width: 80,
      align: 'center' as const,
      render: (count: number) => (
        <Text style={{ color: 'var(--success, #10b981)', fontWeight: 'bold' }}>{count}</Text>
      ),
    },
    {
      title: titleMap.duplicateNumbers,
      dataIndex: 'duplicateNumbers',
      key: 'duplicate_numbers',
      width: 80,
      align: 'center' as const,
      render: (count: number) => <Text style={{ color: 'var(--warning, #f59e0b)' }}>{count}</Text>,
    },
    {
      title: titleMap.status,
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
      title: titleMap.createdAt,
      dataIndex: 'createdAt',
      key: 'created_at',
      width: 160,
      render: (time: string) => (
        <Text style={{ fontSize: '12px' }}>{new Date(time).toLocaleString()}</Text>
      ),
    },
    {
      title: titleMap.actions,
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
  ], [onDelete, onArchive, onViewError, titleMap]);

  const filteredColumns = useMemo(() => columns.filter((c) => visibleCols[(c.key as ColKey) ?? 'actions'] !== false), [columns, visibleCols]);

  const defaultVisibleCols: Record<ColKey, boolean> = {
    fileName: true,
    validNumbers: true,
    importedNumbers: true,
    duplicateNumbers: true,
    status: true,
    createdAt: true,
    actions: true,
  };

  const visibilityPanel = (
    <div style={{ padding: 8, width: 240 }}>
      {allColumns.map((key) => (
        <div key={key} style={{ marginBottom: 6 }}>
          <Checkbox
            checked={visibleCols[key] !== false}
            onChange={(e) => setVisibleCols((prev) => ({ ...prev, [key]: e.target.checked }))}
            disabled={key === 'actions'}
          >
            {titleMap[key]}
          </Checkbox>
          <div style={{ marginTop: 4 }}>
            <input
              style={{ width: '100%', fontSize: 12, padding: '2px 6px' }}
              value={titleMap[key]}
              onChange={(e) => setTitleMap((prev) => ({ ...prev, [key]: e.target.value }))}
            />
          </div>
        </div>
      ))}
      <div style={{ textAlign: 'right', marginTop: 8 }}>
        <Space>
          <Button size="small" onClick={() => { setVisibleCols(defaultVisibleCols); setTitleMap({
            fileName: '文件名', validNumbers: '总数', importedNumbers: '成功', duplicateNumbers: '重复', status: '状态', createdAt: '导入时间', actions: '操作'
          }); }}>重置为默认</Button>
          <Button size="small" type="primary" onClick={() => {
            try {
              localStorage.setItem('txtImport.visibleCols', JSON.stringify(visibleCols));
              localStorage.setItem('txtImport.titleMap', JSON.stringify(titleMap));
              // 立即持久化（useEffect 也会覆盖），此处仅是显式“保存偏好”入口
              message.success('偏好已保存');
            } catch {
              message.error('保存失败');
            }
          }}>保存偏好</Button>
        </Space>
      </div>
    </div>
  );

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    getCheckboxProps: (record: TxtImportRecordDto) => ({ name: record.fileName }),
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
