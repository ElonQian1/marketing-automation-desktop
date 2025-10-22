// src/modules/contact-import/ui/components/file-selector.tsx
// module: contact-import | layer: ui | role: 文件选择器组件
// summary: 显示已导入文件列表，支持多选checkbox，显示统计信息

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Table, Checkbox, Spin, Alert, Space, Tag, Typography, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { getImportedFileList, type FileInfoDto } from '../services/contactNumberService';

const { Text } = Typography;

export interface FileSelectorProps {
  /** 选中的文件路径数组 */
  value?: string[];
  /** 选择变化回调 */
  onChange?: (selectedFiles: string[]) => void;
  /** 是否只显示有可用号码的文件 */
  onlyAvailable?: boolean;
  /** 最大可选择数量 */
  maxSelection?: number;
}

/**
 * 文件选择器组件
 * 用于在设备导入时选择要导入的文件
 */
export const ContactFileSelector: React.FC<FileSelectorProps> = ({
  value = [],
  onChange,
  onlyAvailable = false,
  maxSelection,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileList, setFileList] = useState<FileInfoDto[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>(value);
  const [cacheTimestamp, setCacheTimestamp] = useState<number>(0);

  // 缓存有效期：5分钟
  const CACHE_DURATION = 5 * 60 * 1000;

  // 加载文件列表
  useEffect(() => {
    loadFileList();
  }, [onlyAvailable]);

  // 同步外部value
  useEffect(() => {
    setSelectedFiles(value);
  }, [value]);

  const loadFileList = useCallback(async (forceRefresh = false) => {
    // 检查缓存是否有效
    const now = Date.now();
    if (!forceRefresh && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
      console.log('[FileSelector] 使用缓存的文件列表');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const files = await getImportedFileList();
      
      // 过滤：只显示有可用号码的文件
      const filteredFiles = onlyAvailable 
        ? files.filter(f => f.available_count > 0)
        : files;
      
      setFileList(filteredFiles);
      setCacheTimestamp(Date.now());
    } catch (err: any) {
      console.error('加载文件列表失败:', err);
      setError(err?.message || '加载文件列表失败');
    } finally {
      setLoading(false);
    }
  }, [onlyAvailable, cacheTimestamp]);

  // 手动刷新
  const handleRefresh = () => {
    loadFileList(true);
  };

  const handleSelectChange = (filePath: string, checked: boolean) => {
    let newSelection: string[];
    
    if (checked) {
      // 添加选择
      if (maxSelection && selectedFiles.length >= maxSelection) {
        // 达到最大选择数量，替换最后一个
        newSelection = [...selectedFiles.slice(0, maxSelection - 1), filePath];
      } else {
        newSelection = [...selectedFiles, filePath];
      }
    } else {
      // 取消选择
      newSelection = selectedFiles.filter(f => f !== filePath);
    }
    
    setSelectedFiles(newSelection);
    onChange?.(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allFiles = fileList.map(f => f.source_file);
      const newSelection = maxSelection 
        ? allFiles.slice(0, maxSelection)
        : allFiles;
      setSelectedFiles(newSelection);
      onChange?.(newSelection);
    } else {
      setSelectedFiles([]);
      onChange?.([]);
    }
  };

  const columns: ColumnsType<FileInfoDto> = [
    {
      title: (
        <Checkbox
          checked={selectedFiles.length === fileList.length && fileList.length > 0}
          indeterminate={selectedFiles.length > 0 && selectedFiles.length < fileList.length}
          onChange={(e) => handleSelectAll(e.target.checked)}
        />
      ),
      dataIndex: 'selected',
      key: 'selected',
      width: 50,
      render: (_: any, record: FileInfoDto) => (
        <Checkbox
          checked={selectedFiles.includes(record.source_file)}
          onChange={(e) => handleSelectChange(record.source_file, e.target.checked)}
        />
      ),
    },
    {
      title: '文件名',
      dataIndex: 'file_name',
      key: 'file_name',
      ellipsis: true,
      render: (name: string) => (
        <Space>
          <FileTextOutlined style={{ color: '#1890ff' }} />
          <Text ellipsis={{ tooltip: true }} style={{ maxWidth: 300 }}>
            {name}
          </Text>
        </Space>
      ),
    },
    {
      title: '总数',
      dataIndex: 'total_count',
      key: 'total_count',
      width: 80,
      align: 'right',
      render: (count: number) => (
        <Tag color="blue">{count.toLocaleString()}</Tag>
      ),
    },
    {
      title: '可用',
      dataIndex: 'available_count',
      key: 'available_count',
      width: 80,
      align: 'right',
      render: (count: number) => (
        <Tag color="green" icon={<CheckCircleOutlined />}>
          {count.toLocaleString()}
        </Tag>
      ),
    },
    {
      title: '已导入',
      dataIndex: 'imported_count',
      key: 'imported_count',
      width: 90,
      align: 'right',
      render: (count: number) => (
        <Tag color="orange">{count.toLocaleString()}</Tag>
      ),
    },
    {
      title: '最后导入时间',
      dataIndex: 'last_import_at',
      key: 'last_import_at',
      width: 160,
      render: (time: string | null) => (
        time ? (
          <Space size={4}>
            <ClockCircleOutlined style={{ color: '#999' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {new Date(time).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
    },
  ];

  // 计算选中文件的统计信息
  const selectedStats = React.useMemo(() => {
    const selected = fileList.filter(f => selectedFiles.includes(f.source_file));
    return {
      totalCount: selected.reduce((sum, f) => sum + f.total_count, 0),
      availableCount: selected.reduce((sum, f) => sum + f.available_count, 0),
      importedCount: selected.reduce((sum, f) => sum + f.imported_count, 0),
    };
  }, [fileList, selectedFiles]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin size="large" tip="加载文件列表..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="加载失败"
        description={error}
        type="error"
        showIcon
        style={{ marginBottom: 16 }}
      />
    );
  }

  if (fileList.length === 0) {
    return (
      <Alert
        message="暂无文件"
        description={onlyAvailable ? "暂无包含可用号码的文件" : "暂无已导入的文件"}
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
    );
  }

  return (
    <div className="contact-file-selector">
      {/* 工具栏 */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Text type="secondary">
            共 {fileList.length} 个文件
          </Text>
          {cacheTimestamp > 0 && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              (更新于 {new Date(cacheTimestamp).toLocaleTimeString()})
            </Text>
          )}
        </Space>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={handleRefresh}
          loading={loading}
          size="small"
        >
          刷新
        </Button>
      </div>

      {/* 选择统计 */}
      {selectedFiles.length > 0 && (
        <Alert
          message={
            <Space size={16}>
              <Text>
                已选择 <Text strong>{selectedFiles.length}</Text> 个文件
              </Text>
              <Text type="secondary">|</Text>
              <Text>
                总数: <Text strong>{selectedStats.totalCount.toLocaleString()}</Text>
              </Text>
              <Text>
                可用: <Text strong style={{ color: '#52c41a' }}>{selectedStats.availableCount.toLocaleString()}</Text>
              </Text>
              <Text>
                已导入: <Text strong style={{ color: '#fa8c16' }}>{selectedStats.importedCount.toLocaleString()}</Text>
              </Text>
            </Space>
          }
          type="info"
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 文件列表表格 */}
      <Table
        columns={columns}
        dataSource={fileList}
        rowKey="source_file"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 个文件`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        size="small"
        bordered
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
};

export default ContactFileSelector;
