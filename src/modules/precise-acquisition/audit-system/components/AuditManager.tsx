// src/modules/precise-acquisition/audit-system/components/AuditManager.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 审计系统管理React组件
 * 
 * 提供审计日志查看、统计分析和系统监控功能
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  DatePicker,
  Select,
  Input,
  Statistic,
  Row,
  Col,
  Progress,
  Alert,
  Typography,
  Divider,
  Popconfirm,
  message,
  Tabs,
  Timeline,
  Descriptions,
  Empty,
  Tooltip
} from 'antd';
import {
  AuditOutlined,
  BarChartOutlined,
  ExportOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EyeOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  SecurityScanOutlined
} from '@ant-design/icons';

import { 
  AuditService, 
  AuditLogEntry, 
  AuditLogLevel, 
  AuditEventType,
  AuditQuery,
  AuditStats
} from '../services/AuditService';
import { Platform, TaskType } from '../../shared/types/core';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Option } = Select;

interface AuditManagerProps {
  onDataUpdated?: () => void;
}

/**
 * 日志级别颜色映射
 */
const getLevelColor = (level: AuditLogLevel): string => {
  switch (level) {
    case AuditLogLevel.DEBUG: return 'default';
    case AuditLogLevel.INFO: return 'blue';
    case AuditLogLevel.WARN: return 'orange';
    case AuditLogLevel.ERROR: return 'red';
    case AuditLogLevel.CRITICAL: return 'magenta';
    default: return 'default';
  }
};

/**
 * 事件类型图标映射
 */
const getEventTypeIcon = (eventType: AuditEventType) => {
  switch (eventType) {
    case AuditEventType.USER_LOGIN:
    case AuditEventType.USER_LOGOUT:
      return <SecurityScanOutlined />;
    case AuditEventType.TASK_CREATE:
    case AuditEventType.TASK_EXECUTE:
    case AuditEventType.TASK_COMPLETE:
      return <CheckCircleOutlined />;
    case AuditEventType.TASK_FAIL:
      return <CloseCircleOutlined />;
    case AuditEventType.PERFORMANCE_SLOW:
      return <ClockCircleOutlined />;
    case AuditEventType.AUTH_FAILURE:
    case AuditEventType.PERMISSION_DENIED:
    case AuditEventType.SUSPICIOUS_ACTIVITY:
      return <WarningOutlined />;
    default:
      return <AuditOutlined />;
  }
};

export const AuditManager: React.FC<AuditManagerProps> = ({ onDataUpdated }) => {
  const [auditService] = useState(() => new AuditService());
  
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  
  // 查询条件
  const [queryForm] = Form.useForm();
  const [query, setQuery] = useState<AuditQuery>({
    limit: 50,
    offset: 0
  });
  
  // 详情弹窗
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentLogEntry, setCurrentLogEntry] = useState<AuditLogEntry | null>(null);
  
  // 导出弹窗
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportForm] = Form.useForm();

  /**
   * 加载审计日志
   */
  const loadLogs = async (newQuery?: AuditQuery) => {
    setLoading(true);
    try {
      const queryToUse = newQuery || query;
      const result = await auditService.queryLogs(queryToUse);
      
      setLogs(result.entries);
      setTotal(result.total);
      
    } catch (error) {
      message.error(`加载审计日志失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 加载统计数据
   */
  const loadStats = async () => {
    try {
      const statsData = await auditService.getStats();
      setStats(statsData);
    } catch (error) {
      message.error(`加载统计数据失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  useEffect(() => {
    loadLogs();
    loadStats();
  }, []);

  /**
   * 处理查询提交
   */
  const handleSearch = async (values: any) => {
    const newQuery: AuditQuery = {
      ...query,
      start_time: values.dateRange?.[0]?.toDate(),
      end_time: values.dateRange?.[1]?.toDate(),
      levels: values.levels,
      event_types: values.event_types,
      user_id: values.user_id || undefined,
      operation: values.operation || undefined,
      platform: values.platform,
      offset: 0
    };
    
    setQuery(newQuery);
    await loadLogs(newQuery);
  };

  /**
   * 重置查询条件
   */
  const handleReset = async () => {
    queryForm.resetFields();
    const newQuery: AuditQuery = {
      limit: 50,
      offset: 0
    };
    setQuery(newQuery);
    await loadLogs(newQuery);
  };

  /**
   * 查看日志详情
   */
  const handleViewDetail = (logEntry: AuditLogEntry) => {
    setCurrentLogEntry(logEntry);
    setDetailModalVisible(true);
  };

  /**
   * 导出日志
   */
  const handleExport = async (values: any) => {
    try {
      setLoading(true);
      
      const exportQuery: AuditQuery = {
        ...query,
        start_time: values.dateRange?.[0]?.toDate(),
        end_time: values.dateRange?.[1]?.toDate(),
        levels: values.levels,
        event_types: values.event_types,
        limit: values.limit || 10000
      };
      
      const filePath = await auditService.exportLogs(exportQuery, values.format);
      
      message.success(`日志导出成功: ${filePath}`);
      setExportModalVisible(false);
      
    } catch (error) {
      message.error(`导出失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 清理过期日志
   */
  const handleCleanup = async () => {
    try {
      setLoading(true);
      const deletedCount = await auditService.cleanupExpiredLogs(90); // 保留90天
      message.success(`清理完成，删除了 ${deletedCount} 条过期日志`);
      await loadLogs();
      await loadStats();
      onDataUpdated?.();
    } catch (error) {
      message.error(`清理失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 分页处理
   */
  const handleTableChange = async (pagination: any) => {
    const newQuery = {
      ...query,
      offset: (pagination.current - 1) * pagination.pageSize,
      limit: pagination.pageSize
    };
    setQuery(newQuery);
    await loadLogs(newQuery);
  };

  /**
   * 日志表格列定义
   */
  const columns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 160,
      render: (timestamp: Date) => (
        <div>
          <div>{timestamp.toLocaleDateString()}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {timestamp.toLocaleTimeString()}
          </Text>
        </div>
      )
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: AuditLogLevel) => (
        <Tag color={getLevelColor(level)}>
          {level.toUpperCase()}
        </Tag>
      )
    },
    {
      title: '事件类型',
      dataIndex: 'event_type',
      key: 'event_type',
      width: 140,
      render: (eventType: AuditEventType) => (
        <Space>
          {getEventTypeIcon(eventType)}
          <Text style={{ fontSize: '12px' }}>
            {eventType.replace(/_/g, ' ').toLowerCase()}
          </Text>
        </Space>
      )
    },
    {
      title: '操作',
      dataIndex: 'operation',
      key: 'operation',
      width: 120,
      render: (operation: string) => (
        <Text code style={{ fontSize: '12px' }}>
          {operation}
        </Text>
      )
    },
    {
      title: '用户',
      dataIndex: 'user_id',
      key: 'user_id',
      width: 100,
      render: (userId?: string) => (
        userId ? (
          <Text style={{ fontSize: '12px' }}>{userId}</Text>
        ) : (
          <Text type="secondary" style={{ fontSize: '12px' }}>系统</Text>
        )
      )
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 80,
      render: (platform?: Platform) => (
        platform ? (
          <Tag color="blue">
            {platform}
          </Tag>
        ) : null
      )
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (message: string) => (
        <Tooltip title={message}>
          <Text style={{ fontSize: '12px' }}>{message}</Text>
        </Tooltip>
      )
    },
    {
      title: '耗时',
      dataIndex: 'duration_ms',
      key: 'duration_ms',
      width: 80,
      render: (duration?: number) => (
        duration ? (
          <Text 
            style={{ 
              fontSize: '12px',
              color: duration > 5000 ? '#ff4d4f' : duration > 1000 ? '#fa8c16' : '#52c41a'
            }}
          >
            {duration}ms
          </Text>
        ) : null
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_: any, record: AuditLogEntry) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          详情
        </Button>
      )
    }
  ];

  return (
    <div className="light-theme-force" style={{ background: 'var(--bg-light-base)' }}>
      <Card 
        title="审计系统" 
        style={{ background: 'var(--bg-light-base)' }}
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => { loadLogs(); loadStats(); }}
              loading={loading}
            >
              刷新
            </Button>
            <Button
              icon={<ExportOutlined />}
              onClick={() => setExportModalVisible(true)}
            >
              导出
            </Button>
            <Popconfirm
              title="确认清理90天前的过期日志？"
              onConfirm={handleCleanup}
              okText="确认"
              cancelText="取消"
            >
              <Button
                icon={<DeleteOutlined />}
                danger
              >
                清理日志
              </Button>
            </Popconfirm>
          </Space>
        }
      >
        <Tabs defaultActiveKey="logs">
          <TabPane tab="日志查询" key="logs" icon={<AuditOutlined />}>
            {/* 查询表单 */}
            <Card size="small" style={{ marginBottom: 16, background: 'var(--bg-light-elevated)' }}>
              <Form
                form={queryForm}
                layout="inline"
                onFinish={handleSearch}
                style={{ marginBottom: 16 }}
              >
                <Form.Item name="dateRange" label="时间范围">
                  <RangePicker showTime />
                </Form.Item>
                
                <Form.Item name="levels" label="日志级别">
                  <Select
                    mode="multiple"
                    placeholder="选择级别"
                    style={{ width: 200 }}
                    allowClear
                  >
                    {Object.values(AuditLogLevel).map(level => (
                      <Option key={level} value={level}>
                        <Tag color={getLevelColor(level)}>
                          {level.toUpperCase()}
                        </Tag>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                
                <Form.Item name="event_types" label="事件类型">
                  <Select
                    mode="multiple"
                    placeholder="选择事件类型"
                    style={{ width: 200 }}
                    allowClear
                  >
                    {Object.values(AuditEventType).map(type => (
                      <Option key={type} value={type}>
                        {type.replace(/_/g, ' ').toLowerCase()}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                
                <Form.Item name="user_id" label="用户ID">
                  <Input placeholder="输入用户ID" style={{ width: 150 }} />
                </Form.Item>
                
                <Form.Item name="operation" label="操作">
                  <Input placeholder="输入操作名称" style={{ width: 150 }} />
                </Form.Item>
                
                <Form.Item name="platform" label="平台">
                  <Select placeholder="选择平台" style={{ width: 120 }} allowClear>
                    {Object.values(Platform).map(platform => (
                      <Option key={platform} value={platform}>
                        {platform}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                
                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      查询
                    </Button>
                    <Button onClick={handleReset}>
                      重置
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>

            {/* 日志表格 */}
            <Table
              columns={columns}
              dataSource={logs}
              rowKey="id"
              size="small"
              loading={loading}
              pagination={{
                current: Math.floor((query.offset || 0) / (query.limit || 50)) + 1,
                pageSize: query.limit || 50,
                total: total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`
              }}
              onChange={handleTableChange}
              scroll={{ x: 1200, y: 600 }}
            />
          </TabPane>

          <TabPane tab="统计分析" key="stats" icon={<BarChartOutlined />}>
            {stats ? (
              <div>
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                  <Col span={6}>
                    <Card size="small" style={{ background: 'var(--bg-light-elevated)' }}>
                      <Statistic
                        title="总日志数"
                        value={stats.total_entries}
                        prefix={<AuditOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" style={{ background: 'var(--bg-light-elevated)' }}>
                      <Statistic
                        title="错误率"
                        value={stats.error_rate}
                        precision={2}
                        suffix="%"
                        valueStyle={{ color: stats.error_rate > 5 ? '#ff4d4f' : '#52c41a' }}
                        prefix={<WarningOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" style={{ background: 'var(--bg-light-elevated)' }}>
                      <Statistic
                        title="平均响应时间"
                        value={stats.avg_response_time_ms}
                        precision={0}
                        suffix="ms"
                        prefix={<ClockCircleOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" style={{ background: 'var(--bg-light-elevated)' }}>
                      <Statistic
                        title="峰值内存使用"
                        value={stats.peak_memory_usage_mb}
                        precision={1}
                        suffix="MB"
                      />
                    </Card>
                  </Col>
                </Row>

                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Card 
                      size="small" 
                      title="各级别日志分布" 
                      style={{ background: 'var(--bg-light-elevated)' }}
                    >
                      <div>
                        {Object.entries(stats.entries_by_level).map(([level, count]) => (
                          <div key={level} style={{ marginBottom: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Tag color={getLevelColor(level as AuditLogLevel)}>
                                {level.toUpperCase()}
                              </Tag>
                              <Text>{count}</Text>
                            </div>
                            <Progress
                              percent={Math.round((count / stats.total_entries) * 100)}
                              size="small"
                              showInfo={false}
                              strokeColor={getLevelColor(level as AuditLogLevel)}
                            />
                          </div>
                        ))}
                      </div>
                    </Card>
                  </Col>
                  
                  <Col span={12}>
                    <Card 
                      size="small" 
                      title="热门操作" 
                      style={{ background: 'var(--bg-light-elevated)' }}
                    >
                      {stats.top_operations.length > 0 ? (
                        <div>
                          {stats.top_operations.slice(0, 5).map((op, index) => (
                            <div key={op.operation} style={{ marginBottom: 12 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text strong>{op.operation}</Text>
                                <Space>
                                  <Text>{op.count}次</Text>
                                  <Tag color={op.error_rate > 5 ? 'red' : 'green'}>
                                    {op.error_rate.toFixed(1)}%
                                  </Tag>
                                </Space>
                              </div>
                              <div style={{ fontSize: '12px', color: '#999' }}>
                                平均耗时: {op.avg_duration_ms.toFixed(0)}ms
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Empty description="暂无数据" />
                      )}
                    </Card>
                  </Col>
                </Row>

                {stats.recent_errors.length > 0 && (
                  <Card 
                    size="small" 
                    title="最近错误" 
                    style={{ marginTop: 16, background: 'var(--bg-light-elevated)' }}
                  >
                    <Timeline>
                      {stats.recent_errors.slice(0, 10).map((error) => (
                        <Timeline.Item
                          key={error.id}
                          color="red"
                          dot={<CloseCircleOutlined />}
                        >
                          <div>
                            <Text strong>{error.operation}</Text>
                            <Text type="secondary" style={{ marginLeft: 8, fontSize: '12px' }}>
                              {error.timestamp.toLocaleString()}
                            </Text>
                          </div>
                          <div style={{ color: '#ff4d4f', fontSize: '12px' }}>
                            {error.error_message}
                          </div>
                        </Timeline.Item>
                      ))}
                    </Timeline>
                  </Card>
                )}
              </div>
            ) : (
              <Empty description="加载统计数据中..." />
            )}
          </TabPane>
        </Tabs>
      </Card>

      {/* 日志详情弹窗 */}
      <Modal
        title="日志详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {currentLogEntry && (
          <div>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="ID" span={2}>
                <Text code>{currentLogEntry.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="时间">
                {currentLogEntry.timestamp.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="级别">
                <Tag color={getLevelColor(currentLogEntry.level)}>
                  {currentLogEntry.level.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="事件类型">
                {currentLogEntry.event_type}
              </Descriptions.Item>
              <Descriptions.Item label="操作">
                <Text code>{currentLogEntry.operation}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="用户ID">
                {currentLogEntry.user_id || '系统'}
              </Descriptions.Item>
              <Descriptions.Item label="设备ID">
                <Text code>{currentLogEntry.device_id}</Text>
              </Descriptions.Item>
              {currentLogEntry.platform && (
                <Descriptions.Item label="平台">
                  <Tag color="blue">{currentLogEntry.platform}</Tag>
                </Descriptions.Item>
              )}
              {currentLogEntry.duration_ms && (
                <Descriptions.Item label="耗时">
                  {currentLogEntry.duration_ms}ms
                </Descriptions.Item>
              )}
              {currentLogEntry.memory_usage_mb && (
                <Descriptions.Item label="内存使用">
                  {currentLogEntry.memory_usage_mb}MB
                </Descriptions.Item>
              )}
              <Descriptions.Item label="消息" span={2}>
                {currentLogEntry.message}
              </Descriptions.Item>
            </Descriptions>

            {currentLogEntry.error_message && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>错误信息</Title>
                <Alert
                  message={currentLogEntry.error_message}
                  type="error"
                  showIcon
                />
              </div>
            )}

            {currentLogEntry.details && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>详细信息</Title>
                <pre 
                  style={{ 
                    background: 'var(--bg-light-secondary)', 
                    padding: 12, 
                    borderRadius: 6,
                    fontSize: '12px',
                    maxHeight: 200,
                    overflow: 'auto',
                    color: 'var(--text-inverse)'
                  }}
                >
                  {JSON.stringify(currentLogEntry.details, null, 2)}
                </pre>
              </div>
            )}

            {currentLogEntry.stack_trace && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>调用栈</Title>
                <pre 
                  style={{ 
                    background: 'var(--bg-light-secondary)', 
                    padding: 12, 
                    borderRadius: 6,
                    fontSize: '11px',
                    maxHeight: 200,
                    overflow: 'auto',
                    color: 'var(--text-inverse)'
                  }}
                >
                  {currentLogEntry.stack_trace}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 导出弹窗 */}
      <Modal
        title="导出审计日志"
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        onOk={() => exportForm.submit()}
        width={500}
        okText="导出"
        cancelText="取消"
      >
        <Form
          form={exportForm}
          layout="vertical"
          onFinish={handleExport}
        >
          <Form.Item name="dateRange" label="时间范围">
            <RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item name="levels" label="日志级别">
            <Select mode="multiple" placeholder="选择级别，留空表示全部">
              {Object.values(AuditLogLevel).map(level => (
                <Option key={level} value={level}>
                  {level.toUpperCase()}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name="event_types" label="事件类型">
            <Select mode="multiple" placeholder="选择事件类型，留空表示全部">
              {Object.values(AuditEventType).map(type => (
                <Option key={type} value={type}>
                  {type.replace(/_/g, ' ').toLowerCase()}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item 
            name="format" 
            label="导出格式" 
            initialValue="json"
            rules={[{ required: true, message: '请选择导出格式' }]}
          >
            <Select>
              <Option value="json">JSON</Option>
              <Option value="csv">CSV</Option>
              <Option value="excel">Excel</Option>
            </Select>
          </Form.Item>
          
          <Form.Item 
            name="limit" 
            label="最大记录数" 
            initialValue={10000}
          >
            <Select>
              <Option value={1000}>1,000</Option>
              <Option value={5000}>5,000</Option>
              <Option value={10000}>10,000</Option>
              <Option value={50000}>50,000</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};