// src/modules/precise-acquisition/rate-control/components/RateControlManager.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 频控和去重管理React组件
 * 
 * 提供频率控制和去重规则的管理界面
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
  InputNumber,
  Select,
  Statistic,
  Row,
  Col,
  Progress,
  Alert,
  Descriptions,
  Typography,
  Divider,
  Popconfirm,
  message,
  Tabs
} from 'antd';
import {
  SettingOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  UserDeleteOutlined,
  SyncOutlined,
  DeleteOutlined,
  ReloadOutlined
} from '@ant-design/icons';

import { Platform, TaskType } from '../../shared/types/core';
import { 
  RateControlService, 
  RateLimitConfig, 
  DeduplicationConfig, 
  RateControlStats,
  RateLimitCheckResult
} from '../services/prospecting-rate-control-service';

const { Title, Text } = Typography;
// TabPane is deprecated, using items instead

interface RateControlManagerProps {
  onConfigUpdated?: () => void;
}

/**
 * 平台颜色映射
 */
const getPlatformColor = (platform: Platform): string => {
  switch (platform) {
    case Platform.DOUYIN: return 'blue';
    case Platform.OCEANENGINE: return 'green';
    case Platform.PUBLIC: return 'orange';
    default: return 'default';
  }
};

/**
 * 任务类型标签
 */
const TaskTypeTag: React.FC<{ type: TaskType }> = ({ type }) => (
  <Tag color={type === TaskType.REPLY ? 'blue' : 'green'}>
    {type === TaskType.REPLY ? '回复' : '关注'}
  </Tag>
);

export const RateControlManager: React.FC<RateControlManagerProps> = ({ onConfigUpdated }) => {
  const [rateControlService] = useState(() => new RateControlService());
  
  const [stats, setStats] = useState<RateControlStats | null>(null);
  const [loading, setLoading] = useState(false);
  
  // 配置弹窗
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<{
    platform: Platform;
    taskType: TaskType;
    config: RateLimitConfig;
  } | null>(null);
  const [configForm] = Form.useForm();
  
  // 去重配置弹窗
  const [dedupConfigModalVisible, setDedupConfigModalVisible] = useState(false);
  const [dedupConfigForm] = Form.useForm();
  
  // 实时频控检查
  const [rateLimitChecks, setRateLimitChecks] = useState<Map<string, RateLimitCheckResult>>(new Map());

  /**
   * 加载统计数据
   */
  const loadStats = async () => {
    setLoading(true);
    try {
      const statsData = await rateControlService.getStats(7);
      setStats(statsData);
      
      // 加载实时频控状态
      await loadRateLimitChecks();
      
    } catch (error) {
      message.error(`加载统计数据失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 加载频控检查状态
   */
  const loadRateLimitChecks = async () => {
    const checks = new Map<string, RateLimitCheckResult>();
    
    const platforms = [Platform.DOUYIN, Platform.OCEANENGINE, Platform.PUBLIC];
    const taskTypes = [TaskType.REPLY, TaskType.FOLLOW];
    
    for (const platform of platforms) {
      for (const taskType of taskTypes) {
        try {
          const result = await rateControlService.checkRateLimit(platform, taskType);
          checks.set(`${platform}_${taskType}`, result);
        } catch (error) {
          console.error(`检查频控失败 ${platform}_${taskType}:`, error);
        }
      }
    }
    
    setRateLimitChecks(checks);
  };

  useEffect(() => {
    loadStats();
    
    // 定期刷新数据
    const interval = setInterval(loadStats, 30000); // 30秒刷新一次
    return () => clearInterval(interval);
  }, []);

  /**
   * 频控配置表格列
   */
  const rateLimitColumns = [
    {
      title: '平台',
      key: 'platform',
      width: 100,
      render: (_: any, record: { platform: Platform; taskType: TaskType }) => (
        <Tag color={getPlatformColor(record.platform)}>
          {record.platform === Platform.DOUYIN && '抖音'}
          {record.platform === Platform.OCEANENGINE && '巨量引擎'}
          {record.platform === Platform.PUBLIC && '公开平台'}
        </Tag>
      )
    },
    {
      title: '操作类型',
      key: 'taskType',
      width: 100,
      render: (_: any, record: { platform: Platform; taskType: TaskType }) => (
        <TaskTypeTag type={record.taskType} />
      )
    },
    {
      title: '当前状态',
      key: 'status',
      width: 120,
      render: (_: any, record: { platform: Platform; taskType: TaskType }) => {
        const check = rateLimitChecks.get(`${record.platform}_${record.taskType}`);
        if (!check) return <Text type="secondary">检查中...</Text>;
        
        return (
          <div>
            <Tag color={check.allowed ? 'success' : 'error'}>
              {check.allowed ? '允许' : '受限'}
            </Tag>
            {!check.allowed && check.retry_after_seconds && (
              <div style={{ fontSize: '12px', color: '#999' }}>
                {Math.ceil(check.retry_after_seconds)}s后可用
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: '使用情况',
      key: 'usage',
      width: 200,
      render: (_: any, record: { platform: Platform; taskType: TaskType }) => {
        const check = rateLimitChecks.get(`${record.platform}_${record.taskType}`);
        if (!check) return null;
        
        const { current_stats } = check;
        
        return (
          <div>
            <div style={{ marginBottom: 4 }}>
              <Text style={{ fontSize: '12px' }}>
                分钟: {current_stats.minute_count} | 小时: {current_stats.hour_count} | 日: {current_stats.day_count}
              </Text>
            </div>
            {current_stats.last_operation_time && (
              <Text type="secondary" style={{ fontSize: '11px' }}>
                最后操作: {new Date(current_stats.last_operation_time).toLocaleTimeString()}
              </Text>
            )}
          </div>
        );
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_: any, record: { platform: Platform; taskType: TaskType }) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => handleEditRateLimit(record.platform, record.taskType)}
          >
            配置
          </Button>
        </Space>
      )
    }
  ];

  /**
   * 生成频控配置数据
   */
  const getRateLimitData = () => {
    const data: { platform: Platform; taskType: TaskType }[] = [];
    const platforms = [Platform.DOUYIN, Platform.OCEANENGINE, Platform.PUBLIC];
    const taskTypes = [TaskType.REPLY, TaskType.FOLLOW];
    
    platforms.forEach(platform => {
      taskTypes.forEach(taskType => {
        data.push({ platform, taskType });
      });
    });
    
    return data;
  };

  /**
   * 编辑频控配置
   */
  const handleEditRateLimit = async (platform: Platform, taskType: TaskType) => {
    // TODO: 从服务获取当前配置，这里使用默认值
    const defaultConfig: RateLimitConfig = {
      platform,
      task_type: taskType,
      max_per_minute: platform === Platform.DOUYIN ? 10 : platform === Platform.OCEANENGINE ? 15 : 3,
      max_per_hour: platform === Platform.DOUYIN ? 200 : platform === Platform.OCEANENGINE ? 300 : 50,
      max_per_day: platform === Platform.DOUYIN ? 1000 : platform === Platform.OCEANENGINE ? 1500 : 200,
      min_interval_seconds: platform === Platform.DOUYIN ? 5 : platform === Platform.OCEANENGINE ? 3 : 15
    };
    
    setCurrentConfig({ platform, taskType, config: defaultConfig });
    setConfigModalVisible(true);
    
    configForm.setFieldsValue({
      max_per_minute: defaultConfig.max_per_minute,
      max_per_hour: defaultConfig.max_per_hour,
      max_per_day: defaultConfig.max_per_day,
      min_interval_seconds: defaultConfig.min_interval_seconds
    });
  };

  /**
   * 保存频控配置
   */
  const handleSaveRateLimit = async (values: any) => {
    if (!currentConfig) return;
    
    try {
      // TODO: 调用服务保存配置
      console.log('保存频控配置:', { ...currentConfig, config: values });
      
      message.success('频控配置已保存');
      setConfigModalVisible(false);
      onConfigUpdated?.();
      await loadStats();
      
    } catch (error) {
      message.error(`保存失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  /**
   * 编辑去重配置
   */
  const handleEditDedupConfig = () => {
    setDedupConfigModalVisible(true);
    
    // TODO: 从服务获取当前配置
    const defaultConfig: DeduplicationConfig = {
      user_dedup_window_days: 7,
      content_dedup_window_days: 3,
      cross_device_sync_interval_minutes: 5,
      content_similarity_threshold: 0.8
    };
    
    dedupConfigForm.setFieldsValue(defaultConfig);
  };

  /**
   * 保存去重配置
   */
  const handleSaveDedupConfig = async (values: DeduplicationConfig) => {
    try {
      // TODO: 调用服务保存配置
      console.log('保存去重配置:', values);
      
      message.success('去重配置已保存');
      setDedupConfigModalVisible(false);
      onConfigUpdated?.();
      
    } catch (error) {
      message.error(`保存失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  /**
   * 清理过期数据
   */
  const handleCleanupData = async () => {
    try {
      setLoading(true);
      await rateControlService.cleanupExpiredData(30);
      message.success('过期数据清理完成');
      await loadStats();
    } catch (error) {
      message.error(`清理失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="light-theme-force" style={{ background: 'var(--bg-light-base)' }}>
      <Card 
        title="频控和去重管理" 
        style={{ background: 'var(--bg-light-base)' }}
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadStats}
              loading={loading}
            >
              刷新
            </Button>
            <Button
              icon={<SettingOutlined />}
              onClick={handleEditDedupConfig}
            >
              去重配置
            </Button>
            <Popconfirm
              title="确认清理30天前的过期数据？"
              onConfirm={handleCleanupData}
              okText="确认"
              cancelText="取消"
            >
              <Button
                icon={<DeleteOutlined />}
                danger
              >
                清理数据
              </Button>
            </Popconfirm>
          </Space>
        }
      >
        <Tabs 
          defaultActiveKey="stats"
          items={[
            {
              key: 'stats',
              label: '统计概览',
              icon: <BarChartOutlined />,
              children: stats && (
                <div>
                  <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col span={6}>
                      <Card size="small" style={{ background: 'var(--bg-light-elevated)' }}>
                        <Statistic
                          title="总操作数"
                          value={stats.total_operations}
                          prefix={<ClockCircleOutlined />}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card size="small" style={{ background: 'var(--bg-light-elevated)' }}>
                        <Statistic
                          title="频控拦截"
                          value={stats.blocked_by_rate_limit}
                          valueStyle={{ color: '#ff4d4f' }}
                          prefix={<ClockCircleOutlined />}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card size="small" style={{ background: 'var(--bg-light-elevated)' }}>
                        <Statistic
                          title="去重拦截"
                          value={stats.blocked_by_deduplication}
                          valueStyle={{ color: '#fa8c16' }}
                          prefix={<UserDeleteOutlined />}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card size="small" style={{ background: 'var(--bg-light-elevated)' }}>
                        <Statistic
                          title="成功率"
                          value={stats.success_rate}
                          precision={1}
                          suffix="%"
                          valueStyle={{ color: '#52c41a' }}
                        />
                      </Card>
                    </Col>
                  </Row>

                  <Card size="small" title="各平台统计" style={{ background: 'var(--bg-light-elevated)' }}>
                    <Row gutter={[16, 16]}>
                      {Object.entries(stats.platform_stats).map(([platform, platformStats]) => (
                        <Col span={8} key={platform}>
                          <div style={{ textAlign: 'center' }}>
                            <Tag color={getPlatformColor(platform as Platform)} style={{ marginBottom: 8 }}>
                              {platform === Platform.DOUYIN && '抖音'}
                              {platform === Platform.OCEANENGINE && '巨量引擎'}
                              {platform === Platform.PUBLIC && '公开平台'}
                            </Tag>
                            <div>
                              <Text strong>操作数: </Text>
                              <Text>{platformStats.operations}</Text>
                            </div>
                            <div>
                              <Text strong>拦截数: </Text>
                              <Text>{platformStats.blocked}</Text>
                            </div>
                            <div>
                              <Text strong>成功率: </Text>
                              <Text>{platformStats.success_rate.toFixed(1)}%</Text>
                            </div>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </Card>
                </div>
              ),
            },
            {
              key: 'rateLimit',
              label: '频控配置',
              icon: <ClockCircleOutlined />,
              children: (
                <Table
                  columns={rateLimitColumns}
                  dataSource={getRateLimitData()}
                  rowKey={(record) => `${record.platform}_${record.taskType}`}
                  size="small"
                  pagination={false}
                  loading={loading}
                />
              ),
            },
            {
              key: 'monitor',
              label: '实时监控',
              icon: <SyncOutlined />,
              children: (
                <div>
                  <Alert
                    message="实时频控监控"
                    description="显示各平台和操作类型的实时频控状态，每30秒自动刷新"
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  
                  <Row gutter={[16, 16]}>
                    {Array.from(rateLimitChecks.entries()).map(([key, check]) => {
                      const [platform, taskType] = key.split('_');
                      
                      return (
                        <Col span={12} key={key}>
                          <Card 
                            size="small" 
                            title={
                              <Space>
                                <Tag color={getPlatformColor(platform as Platform)}>
                                  {platform === Platform.DOUYIN && '抖音'}
                                  {platform === Platform.OCEANENGINE && '巨量引擎'}
                                  {platform === Platform.PUBLIC && '公开平台'}
                                </Tag>
                                <TaskTypeTag type={taskType as TaskType} />
                              </Space>
                            }
                            style={{ background: 'var(--bg-light-elevated)' }}
                          >
                            <div>
                              <div style={{ marginBottom: 8 }}>
                                <Tag color={check.allowed ? 'success' : 'error'}>
                                  {check.allowed ? '✓ 允许操作' : '✗ 操作受限'}
                                </Tag>
                                {!check.allowed && check.retry_after_seconds && (
                                  <Text type="secondary">
                                    ({Math.ceil(check.retry_after_seconds)}s后可用)
                                  </Text>
                                )}
                              </div>
                              
                              {!check.allowed && check.reason && (
                                <Alert
                                  message={check.reason}
                                  type="warning"
                                  showIcon
                                  style={{ marginBottom: 8 }}
                                />
                              )}
                              
                              <Descriptions size="small" column={1}>
                                <Descriptions.Item label="分钟内操作">
                                  {check.current_stats.minute_count}
                                </Descriptions.Item>
                                <Descriptions.Item label="小时内操作">
                                  {check.current_stats.hour_count}
                                </Descriptions.Item>
                                <Descriptions.Item label="今日操作">
                                  {check.current_stats.day_count}
                                </Descriptions.Item>
                                {check.current_stats.last_operation_time && (
                                  <Descriptions.Item label="最后操作">
                                    {new Date(check.current_stats.last_operation_time).toLocaleString()}
                                  </Descriptions.Item>
                                )}
                              </Descriptions>
                            </div>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* 频控配置弹窗 */}
      <Modal
        title={`频控配置 - ${currentConfig ? 
          `${currentConfig.platform === Platform.DOUYIN ? '抖音' : 
             currentConfig.platform === Platform.OCEANENGINE ? '巨量引擎' : '公开平台'} 
           ${currentConfig.taskType === TaskType.REPLY ? '回复' : '关注'}` : ''}`}
        open={configModalVisible}
        onCancel={() => setConfigModalVisible(false)}
        onOk={() => configForm.submit()}
        width={500}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={configForm}
          layout="vertical"
          onFinish={handleSaveRateLimit}
        >
          <Form.Item
            label="每分钟最大操作数"
            name="max_per_minute"
            rules={[{ required: true, message: '请输入每分钟最大操作数' }]}
          >
            <InputNumber min={1} max={100} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            label="每小时最大操作数"
            name="max_per_hour"
            rules={[{ required: true, message: '请输入每小时最大操作数' }]}
          >
            <InputNumber min={1} max={5000} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            label="每日最大操作数"
            name="max_per_day"
            rules={[{ required: true, message: '请输入每日最大操作数' }]}
          >
            <InputNumber min={1} max={50000} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            label="最小操作间隔(秒)"
            name="min_interval_seconds"
            rules={[{ required: true, message: '请输入最小操作间隔' }]}
          >
            <InputNumber min={1} max={300} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 去重配置弹窗 */}
      <Modal
        title="去重配置"
        open={dedupConfigModalVisible}
        onCancel={() => setDedupConfigModalVisible(false)}
        onOk={() => dedupConfigForm.submit()}
        width={500}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={dedupConfigForm}
          layout="vertical"
          onFinish={handleSaveDedupConfig}
        >
          <Form.Item
            label="用户去重窗口期(天)"
            name="user_dedup_window_days"
            rules={[{ required: true, message: '请输入用户去重窗口期' }]}
            help="在此期间内不会对同一用户重复操作"
          >
            <InputNumber min={1} max={30} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            label="内容去重窗口期(天)"
            name="content_dedup_window_days"
            rules={[{ required: true, message: '请输入内容去重窗口期' }]}
            help="在此期间内不会发送相同或相似的内容"
          >
            <InputNumber min={1} max={30} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            label="跨设备同步间隔(分钟)"
            name="cross_device_sync_interval_minutes"
            rules={[{ required: true, message: '请输入跨设备同步间隔' }]}
            help="多设备间操作记录同步的时间间隔"
          >
            <InputNumber min={1} max={60} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            label="内容相似度阈值"
            name="content_similarity_threshold"
            rules={[{ required: true, message: '请输入内容相似度阈值' }]}
            help="0-1之间，数值越大越严格"
          >
            <InputNumber min={0} max={1} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};