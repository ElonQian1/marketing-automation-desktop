// src/modules/contact-import/ui/components/TxtImportRecordsList.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React, { useEffect, useState } from 'react';
import { Card, List, Tag, Space, Button, Popconfirm, Typography, App, Tooltip, Modal } from 'antd';
import { FileTextOutlined, DeleteOutlined, ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined, SendOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import { listTxtImportRecords, deleteTxtImportRecord, type TxtImportRecordDto } from '../services/txtImportRecordService';
import { DeviceImportFileSelectorDialog } from './device-import-file-selector-dialog';

const { Text } = Typography;

interface TxtImportRecordsListProps {
  refresh?: number;
}

/**
 * TXT 文件导入记录展示组件
 * 以文件图标形式展示每个导入的 TXT 文件的统计信息
 */
export const TxtImportRecordsList: React.FC<TxtImportRecordsListProps> = ({ refresh }) => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<TxtImportRecordDto[]>([]);
  
  // 导入到设备相关状态
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedFileForImport, setSelectedFileForImport] = useState<string | null>(null);
  const [isReimportMode, setIsReimportMode] = useState(false); // 是否为重新导入模式

  const loadRecords = async () => {
    try {
      setLoading(true);
  const result = await listTxtImportRecords({ limit: 100, offset: 0 });
  setRecords(result.items);
    } catch (error: any) {
      console.error('加载导入记录失败:', error);
      message.error(`加载失败: ${error?.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [refresh]);

  const handleDelete = async (recordId: number, archiveNumbers: boolean) => {
    try {
      await deleteTxtImportRecord(recordId, archiveNumbers);
      message.success(archiveNumbers ? '已删除记录并归档号码' : '已删除记录');
      loadRecords();
    } catch (error: any) {
      message.error(`删除失败: ${error?.message || error}`);
    }
  };

  // 处理导入到设备
  const handleImportToDevice = (record: TxtImportRecordDto) => {
    // 智能判断：如果全是重复号码（没有新增号码），给出提示
    if (record.importedNumbers === 0 && record.duplicateNumbers > 0) {
      Modal.confirm({
        title: '全部号码已导入',
        icon: <ExclamationCircleFilled style={{ color: '#faad14' }} />,
        content: (
          <div>
            <p>此文件的所有 {record.duplicateNumbers} 个号码均已导入到号码池中。</p>
            <p>是否仍要将这些号码重新导入到设备？</p>
            <p style={{ color: '#999', fontSize: '12px', marginTop: 8 }}>
              💡 提示：重新导入会包含所有号码（包括已导入过的）
            </p>
          </div>
        ),
        okText: '重新导入',
        cancelText: '取消',
        onOk: () => {
          setSelectedFileForImport(record.filePath);
          setIsReimportMode(true); // 标记为重新导入模式
          setImportDialogOpen(true);
        },
      });
    } else if (record.importedNumbers === 0 && record.duplicateNumbers === 0) {
      // 没有任何有效号码
      message.warning('此文件没有可导入的号码');
    } else {
      // 有新增号码，直接打开导入对话框（只导入可用号码）
      setSelectedFileForImport(record.filePath);
      setIsReimportMode(false); // 标记为正常导入模式
      setImportDialogOpen(true);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'partial':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case 'failed':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <ExclamationCircleOutlined style={{ color: '#d9d9d9' }} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return '成功';
      case 'partial':
        return '部分成功';
      case 'failed':
        return '失败';
      default:
        return '待处理';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'partial':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Card
      title={
        <Space>
          <FileTextOutlined />
          <span>已导入文件记录</span>
        </Space>
      }
      extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={loadRecords}
          loading={loading}
          size="small"
        >
          刷新
        </Button>
      }
      styles={{ body: { padding: '12px' } }}
    >
      <List
        loading={loading}
        dataSource={records}
        locale={{ emptyText: '暂无导入记录' }}
        grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 4, xxl: 4 }}
        renderItem={(record) => (
          <List.Item>
            <Card
              size="small"
              hoverable
              styles={{ body: { padding: '12px' } }}
              actions={[
                <Tooltip key="import" title="导入到设备">
                  <Button
                    type="link"
                    icon={<SendOutlined />}
                    size="small"
                    onClick={() => handleImportToDevice(record)}
                  >
                    导入到设备
                  </Button>
                </Tooltip>,
                <Popconfirm
                  key="delete"
                  title="删除记录"
                  description="选择删除方式"
                  okText="仅删除记录"
                  cancelText="归档号码后删除"
                  onConfirm={() => handleDelete(record.id, false)}
                  onCancel={() => handleDelete(record.id, true)}
                >
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    size="small"
                  >
                    删除
                  </Button>
                </Popconfirm>
              ]}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {/* 文件名 */}
                <Tooltip title={record.filePath}>
                  <Space>
                    <FileTextOutlined style={{ fontSize: '18px', color: '#1890ff' }} />
                    <Text strong ellipsis style={{ maxWidth: '150px' }}>
                      {record.fileName}
                    </Text>
                  </Space>
                </Tooltip>

                {/* 状态标签 */}
                <Tag color={getStatusColor(record.status)} icon={getStatusIcon(record.status)}>
                  {getStatusText(record.status)}
                </Tag>

                {/* 统计信息 */}
                <Space direction="vertical" size={2} style={{ width: '100%' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    总号码: <Text strong>{record.validNumbers}</Text>
                  </Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    无重复新增号码: <Text strong style={{ color: '#52c41a' }}>{record.importedNumbers}</Text>
                  </Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    重复号码: <Text strong style={{ color: '#faad14' }}>{record.duplicateNumbers}</Text>
                  </Text>
                  {record.invalidNumbers > 0 && (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      无效号码: <Text strong style={{ color: '#ff4d4f' }}>{record.invalidNumbers}</Text>
                    </Text>
                  )}
                </Space>

                {/* 导入时间 */}
                {record.importedAt && (
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    {new Date(record.importedAt).toLocaleString('zh-CN')}
                  </Text>
                )}

                {/* 错误信息 */}
                {record.errorMessage && (
                  <Tooltip title={record.errorMessage}>
                    <Text type="danger" style={{ fontSize: '11px' }} ellipsis>
                      错误: {record.errorMessage}
                    </Text>
                  </Tooltip>
                )}
              </Space>
            </Card>
          </List.Item>
        )}
      />

      {/* 设备导入对话框 */}
      <DeviceImportFileSelectorDialog
        open={importDialogOpen}
        onClose={() => {
          setImportDialogOpen(false);
          setSelectedFileForImport(null);
          setIsReimportMode(false); // 关闭时重置模式
        }}
        onImportSuccess={loadRecords}
        defaultSelectedFiles={selectedFileForImport ? [selectedFileForImport] : []}
        includeImported={isReimportMode} // 传递重新导入模式标志
      />
    </Card>
  );
};

export default TxtImportRecordsList;
