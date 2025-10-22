// src/modules/contact-import/ui/components/number-pool-table/contact-number-tree-table.tsx
// module: contact-import | layer: ui | role: contact-tree-table-component
// summary: 号码池树形表格组件，支持按文件名分组展开显示联系人

import React, { useState, useMemo, useCallback } from 'react';
import { Table, Space, Button, Tag, Typography, Input, message } from 'antd';
import { 
  FolderOutlined, 
  FileTextOutlined, 
  DownloadOutlined, 
  DeleteOutlined,
  FolderOpenOutlined,
  FolderFilled
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { ContactNumberDto } from '../../services/contactNumberService';
import ConfirmPopover from '../../../../../components/universal-ui/common-popover/ConfirmPopover';

const { Text } = Typography;

interface FileGroupNode {
  key: string;
  type: 'file';
  fileName: string;
  filePath: string;
  count: number;
  children?: ContactNumberNode[];
}

interface ContactNumberNode {
  key: string;
  type: 'contact';
  id: number;
  phone: string;
  name: string;
  source_file: string;
  created_at: string;
  status?: string;
  imported_device_id?: string;
  industry?: string;
}

type TreeNode = FileGroupNode | ContactNumberNode;

interface ContactNumberTreeTableProps {
  loading: boolean;
  items: ContactNumberDto[];
  total: number;
  search: string;
  onSearch: (value: string) => void;
  onRefresh: () => void;
}

export const ContactNumberTreeTable: React.FC<ContactNumberTreeTableProps> = ({
  loading,
  items,
  total,
  search,
  onSearch,
  onRefresh,
}) => {
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // 将数据转换为树形结构
  const treeData = useMemo(() => {
    const fileMap = new Map<string, ContactNumberDto[]>();
    
    // 按文件名分组
    items.forEach(item => {
      const fileName = item.source_file;
      if (!fileMap.has(fileName)) {
        fileMap.set(fileName, []);
      }
      fileMap.get(fileName)!.push(item);
    });

    // 构建树形数据
    const tree: TreeNode[] = [];
    fileMap.forEach((contacts, filePath) => {
      const fileName = filePath.split(/[/\\]/).pop() || filePath;
      const fileNode: FileGroupNode = {
        key: `file-${filePath}`,
        type: 'file',
        fileName,
        filePath,
        count: contacts.length,
        children: contacts.map(contact => ({
          key: `contact-${contact.id}`,
          type: 'contact' as const,
          id: contact.id,
          phone: contact.phone,
          name: contact.name,
          source_file: contact.source_file,
          created_at: contact.created_at,
          status: contact.status,
          imported_device_id: contact.imported_device_id,
          industry: contact.industry,
        })),
      };
      tree.push(fileNode);
    });

    return tree;
  }, [items]);

  // 展开/折叠所有
  const handleExpandAll = useCallback(() => {
    const allFileKeys = treeData
      .filter(node => node.type === 'file')
      .map(node => node.key);
    setExpandedKeys(allFileKeys);
  }, [treeData]);

  const handleCollapseAll = useCallback(() => {
    setExpandedKeys([]);
  }, []);

  // 下载文件（导出选中的文件数据）
  const handleDownloadFiles = useCallback(async () => {
    const selectedFiles = selectedRowKeys
      .filter(key => typeof key === 'string' && key.startsWith('file-'))
      .map(key => key.toString().substring(5)); // 移除 'file-' 前缀

    if (selectedFiles.length === 0) {
      message.warning('请先选择要下载的文件');
      return;
    }

    message.info(`准备下载 ${selectedFiles.length} 个文件的数据`);
    // TODO: 实现下载逻辑
  }, [selectedRowKeys]);

  // 删除文件（删除文件下的所有联系人）
  const handleDeleteFiles = useCallback(async () => {
    const selectedFiles = selectedRowKeys
      .filter(key => typeof key === 'string' && key.startsWith('file-'));

    if (selectedFiles.length === 0) {
      message.warning('请先选择要删除的文件');
      return;
    }

    message.info(`准备删除 ${selectedFiles.length} 个文件`);
    // TODO: 实现删除逻辑
    onRefresh();
  }, [selectedRowKeys, onRefresh]);

  const columns: ColumnsType<TreeNode> = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 300,
      render: (_, record) => {
        if (record.type === 'file') {
          const fileRecord = record as FileGroupNode;
          return (
            <Space>
              <FolderFilled style={{ color: '#faad14' }} />
              <Text strong>{fileRecord.fileName}</Text>
              <Tag color="blue">{fileRecord.count} 条</Tag>
            </Space>
          );
        } else {
          const contactRecord = record as ContactNumberNode;
          return (
            <Space>
              <FileTextOutlined style={{ color: '#52c41a' }} />
              <Text>{contactRecord.name || '未命名'}</Text>
            </Space>
          );
        }
      },
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
      render: (_, record) => {
        if (record.type === 'contact') {
          return <Text code>{(record as ContactNumberNode).phone}</Text>;
        }
        return null;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (_, record) => {
        if (record.type === 'contact') {
          const contactRecord = record as ContactNumberNode;
          const status = contactRecord.status;
          if (status === 'imported') {
            return <Tag color="success">已导入</Tag>;
          } else if (status === 'assigned') {
            return <Tag color="processing">已分配</Tag>;
          } else {
            return <Tag>未导入</Tag>;
          }
        }
        return null;
      },
    },
    {
      title: '导入设备',
      dataIndex: 'imported_device_id',
      key: 'imported_device_id',
      width: 150,
      render: (_, record) => {
        if (record.type === 'contact') {
          const deviceId = (record as ContactNumberNode).imported_device_id;
          return deviceId ? <Tag color="purple">{deviceId}</Tag> : <Text type="secondary">-</Text>;
        }
        return null;
      },
    },
    {
      title: '行业',
      dataIndex: 'industry',
      key: 'industry',
      width: 120,
      render: (_, record) => {
        if (record.type === 'contact') {
          const industry = (record as ContactNumberNode).industry;
          return industry ? <Tag>{industry}</Tag> : <Text type="secondary">-</Text>;
        }
        return null;
      },
    },
    {
      title: '导入时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (_, record) => {
        if (record.type === 'file') {
          // 文件节点显示最早的导入时间
          const fileRecord = record as FileGroupNode;
          const firstContact = fileRecord.children?.[0];
          return firstContact ? <Text type="secondary">{firstContact.created_at}</Text> : null;
        } else {
          return <Text type="secondary">{(record as ContactNumberNode).created_at}</Text>;
        }
      },
    },
  ];

  const selectedFileCount = selectedRowKeys.filter(key => 
    typeof key === 'string' && key.startsWith('file-')
  ).length;
  const selectedContactCount = selectedRowKeys.filter(key => 
    typeof key === 'string' && key.startsWith('contact-')
  ).length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 搜索和工具栏 */}
      <div style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Input.Search
            placeholder="搜索号码/姓名"
            allowClear
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            onSearch={onSearch}
            style={{ width: 300 }}
          />
          <Space>
            <Button size="small" icon={<FolderOpenOutlined />} onClick={handleExpandAll}>
              展开全部
            </Button>
            <Button size="small" icon={<FolderOutlined />} onClick={handleCollapseAll}>
              折叠全部
            </Button>
          </Space>
        </Space>
      </div>

      {/* 批量操作按钮 */}
      {(selectedFileCount > 0 || selectedContactCount > 0) && (
        <div
          style={{
            marginBottom: 12,
            padding: '8px 12px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Text type="secondary">
            已选 {selectedFileCount} 个文件, {selectedContactCount} 条联系人
          </Text>
          <Space size="small">
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={handleDownloadFiles}
              disabled={selectedFileCount === 0}
            >
              下载文件
            </Button>
            <ConfirmPopover
              mode="default"
              title="⚠️ 删除确认"
              description={`确认要删除选中的 ${selectedFileCount} 个文件吗？这将删除文件下的所有联系人记录。`}
              okText="确认删除"
              cancelText="取消"
              onConfirm={handleDeleteFiles}
              disabled={selectedFileCount === 0}
            >
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                disabled={selectedFileCount === 0}
              >
                删除文件
              </Button>
            </ConfirmPopover>
          </Space>
        </div>
      )}

      {/* 树形表格 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Table
          columns={columns}
          dataSource={treeData}
          loading={loading}
          size="small"
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            checkStrictly: false,
          }}
          expandable={{
            expandedRowKeys: expandedKeys,
            onExpandedRowsChange: (keys) => setExpandedKeys([...keys]),
          }}
          pagination={false}
          scroll={{ x: 'max-content', y: 'calc(100% - 60px)' }}
        />
      </div>

      {/* 统计信息 */}
      <div
        style={{
          marginTop: 16,
          padding: '8px 0',
          borderTop: '1px solid #f0f0f0',
        }}
      >
        <Text type="secondary">
          共 {treeData.length} 个文件, {total} 条联系人
        </Text>
      </div>
    </div>
  );
};
