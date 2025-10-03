import React, { useEffect, useState } from 'react';
import { Card, List, Tag, Space, Button, Popconfirm, Typography, message, Tooltip } from 'antd';
import { FileTextOutlined, DeleteOutlined, ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { listTxtImportRecords, deleteTxtImportRecord, type TxtImportRecordDto } from '../services/txtImportRecordService';

const { Text } = Typography;

interface TxtImportRecordsListProps {
  refresh?: number;
}

/**
 * TXT 文件导入记录展示组件
 * 以文件图标形式展示每个导入的 TXT 文件的统计信息
 */
export const TxtImportRecordsList: React.FC<TxtImportRecordsListProps> = ({ refresh }) => {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<TxtImportRecordDto[]>([]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const result = await listTxtImportRecords({ limit: 100, offset: 0 });
      setRecords(result.records);
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
      bodyStyle={{ padding: '12px' }}
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
              bodyStyle={{ padding: '12px' }}
              actions={[
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
                <Tooltip title={record.file_path}>
                  <Space>
                    <FileTextOutlined style={{ fontSize: '18px', color: '#1890ff' }} />
                    <Text strong ellipsis style={{ maxWidth: '150px' }}>
                      {record.file_name}
                    </Text>
                  </Space>
                </Tooltip>

                {/* 状态标签 */}
                <Tag color={getStatusColor(record.import_status)} icon={getStatusIcon(record.import_status)}>
                  {getStatusText(record.import_status)}
                </Tag>

                {/* 统计信息 */}
                <Space direction="vertical" size={2} style={{ width: '100%' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    总号码: <Text strong>{record.total_numbers}</Text>
                  </Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    成功导入: <Text strong style={{ color: '#52c41a' }}>{record.successful_imports}</Text>
                  </Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    重复号码: <Text strong style={{ color: '#faad14' }}>{record.duplicate_numbers}</Text>
                  </Text>
                  {record.invalid_numbers > 0 && (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      无效号码: <Text strong style={{ color: '#ff4d4f' }}>{record.invalid_numbers}</Text>
                    </Text>
                  )}
                </Space>

                {/* 导入时间 */}
                {record.imported_at && (
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    {new Date(record.imported_at).toLocaleString('zh-CN')}
                  </Text>
                )}

                {/* 错误信息 */}
                {record.error_message && (
                  <Tooltip title={record.error_message}>
                    <Text type="danger" style={{ fontSize: '11px' }} ellipsis>
                      错误: {record.error_message}
                    </Text>
                  </Tooltip>
                )}
              </Space>
            </Card>
          </List.Item>
        )}
      />
    </Card>
  );
};

export default TxtImportRecordsList;
