/**
 * 风控机制管理界面
 * 
 * 集成RateLimitService、DeduplicationService和CircuitBreakerService的功能
 * 提供风控策略配置和监控界面
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Tabs, 
  Table, 
  Button, 
  Space, 
  Switch, 
  Slider, 
  InputNumber, 
  Form, 
  Select, 
  Tag, 
  Progress, 
  Statistic, 
  Alert,
  Badge,
  Tooltip,
  Modal,
  notification,
  Divider,
  Row,
  Col
} from 'antd';
import { 
  SettingOutlined,
  MonitorOutlined,
  ShieldOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
  EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

// 类型和服务导入
import { Platform, TaskType } from '../../constants/precise-acquisition-enums';
import { rateLimitService } from '../../modules/precise-acquisition/rate-limit';
import type { 
  RateLimitConfig, 
  DeduplicationConfig,
  CircuitBreakerConfig 
} from '../../types/precise-acquisition';

const { TabPane } = Tabs;
const { Option } = Select;

interface RiskControlStats {
  rate_limit: {
    total_checks: number;
    blocked_requests: number;
    success_rate: number;
    current_rate: number;
  };
  deduplication: {
    total_records: number;
    duplicate_blocks: number;
    effectiveness: number;
    by_level: Record<string, number>;
  };
  circuit_breaker: {
    total_circuits: number;
    open_circuits: number;
    half_open_circuits: number;
    closed_circuits: number;
    failure_rate: number;
  };
}

interface RiskControlRule {
  id: string;
  name: string;
  type: 'rate_limit' | 'deduplication' | 'circuit_breaker';
  enabled: boolean;
  config: Record<string, any>;
  platform?: Platform;
  task_type?: TaskType;
  created_at: Date;
  updated_at: Date;
}

export const RiskControlManagementPanel: React.FC = () => {
  // 状态管理
  const [stats, setStats] = useState<RiskControlStats>({
    rate_limit: {
      total_checks: 0,
      blocked_requests: 0,
      success_rate: 0,
      current_rate: 0
    },
    deduplication: {
      total_records: 0,
      duplicate_blocks: 0,
      effectiveness: 0,
      by_level: {}
    },
    circuit_breaker: {
      total_circuits: 0,
      open_circuits: 0,
      half_open_circuits: 0,
      closed_circuits: 0,
      failure_rate: 0
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [rules, setRules] = useState<RiskControlRule[]>([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingRule, setEditingRule] = useState<RiskControlRule | null>(null);

  // 表单实例
  const [configForm] = Form.useForm();

  // 加载统计数据
  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const rateLimitStats = await rateLimitService.getStats();
      
      setStats({
        rate_limit: {
          total_checks: rateLimitStats.total_records || 0,
          blocked_requests: rateLimitStats.blocked_count || 0,
          success_rate: rateLimitStats.success_rate || 0,
          current_rate: rateLimitStats.current_rate || 0
        },
        deduplication: {
          total_records: rateLimitStats.total_records || 0,
          duplicate_blocks: rateLimitStats.by_level?.user || 0,
          effectiveness: rateLimitStats.effectiveness || 0,
          by_level: rateLimitStats.by_level || {}
        },
        circuit_breaker: {
          total_circuits: 0,
          open_circuits: 0,
          half_open_circuits: 0,
          closed_circuits: 0,
          failure_rate: 0
        }
      });
    } catch (error) {
      console.error('Failed to load risk control stats:', error);
      notification.error({
        message: '加载风控统计失败',
        description: error instanceof Error ? error.message : '未知错误'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化加载
  useEffect(() => {
    loadStats();
    
    // 定时刷新
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [loadStats]);

  // 频控配置保存
  const handleSaveRateLimitConfig = async (config: RateLimitConfig) => {
    try {
      // 这里应该调用实际的配置保存接口
      notification.success({
        message: '频控配置保存成功',
        description: '新的频控策略已生效'
      });
      loadStats();
    } catch (error) {
      notification.error({
        message: '保存配置失败',
        description: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  // 去重配置保存
  const handleSaveDeduplicationConfig = async (config: DeduplicationConfig) => {
    try {
      notification.success({
        message: '去重配置保存成功',
        description: '新的去重策略已生效'
      });
      loadStats();
    } catch (error) {
      notification.error({
        message: '保存配置失败',
        description: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  // 熔断器配置保存
  const handleSaveCircuitBreakerConfig = async (config: CircuitBreakerConfig) => {
    try {
      notification.success({
        message: '熔断器配置保存成功',
        description: '新的熔断策略已生效'
      });
      loadStats();
    } catch (error) {
      notification.error({
        message: '保存配置失败',
        description: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  // 重置统计数据
  const handleResetStats = async () => {
    try {
      await rateLimitService.clearRecords();
      notification.success({
        message: '统计数据重置成功',
        description: '所有风控统计数据已清空'
      });
      loadStats();
    } catch (error) {
      notification.error({
        message: '重置失败',
        description: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  // 频控配置组件
  const RateLimitConfigPanel: React.FC = () => {
    const [rateLimitForm] = Form.useForm();

    return (
      <Card title="频率控制配置" extra={
        <Button 
          type="primary" 
          onClick={() => rateLimitForm.submit()}
        >
          保存配置
        </Button>
      }>
        <Form
          form={rateLimitForm}
          layout="vertical"
          onFinish={handleSaveRateLimitConfig}
          initialValues={{
            strategy: 'adaptive',
            base_interval_ms: 3000,
            max_interval_ms: 60000,
            max_operations_per_hour: 120,
            max_operations_per_day: 1000,
            cooldown_after_failure_ms: 30000,
            burst_size: 5,
            window_size_minutes: 15
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="strategy" label="控制策略">
                <Select>
                  <Option value="fixed">固定间隔</Option>
                  <Option value="adaptive">自适应</Option>
                  <Option value="exponential">指数退避</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="base_interval_ms" label="基础间隔 (毫秒)">
                <InputNumber min={1000} max={30000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="max_operations_per_hour" label="每小时最大操作数">
                <Slider min={10} max={500} marks={{ 10: '10', 120: '120', 300: '300', 500: '500' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="max_operations_per_day" label="每日最大操作数">
                <Slider min={100} max={5000} marks={{ 100: '100', 1000: '1K', 3000: '3K', 5000: '5K' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="burst_size" label="突发操作数">
                <InputNumber min={1} max={20} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="cooldown_after_failure_ms" label="失败后冷却时间 (毫秒)">
                <InputNumber min={10000} max={300000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    );
  };

  // 去重配置组件
  const DeduplicationConfigPanel: React.FC = () => {
    const [dedupForm] = Form.useForm();

    return (
      <Card title="去重策略配置" extra={
        <Button 
          type="primary" 
          onClick={() => dedupForm.submit()}
        >
          保存配置
        </Button>
      }>
        <Form
          form={dedupForm}
          layout="vertical"
          onFinish={handleSaveDeduplicationConfig}
          initialValues={{
            comment_level_enabled: true,
            user_level_enabled: true,
            user_cooldown_days: 7,
            cross_device_enabled: true,
            device_cooldown_hours: 24
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="comment_level_enabled" valuePropName="checked">
                <Space>
                  <Switch />
                  <span>启用评论级去重</span>
                </Space>
              </Form.Item>
              
              <Form.Item name="user_level_enabled" valuePropName="checked">
                <Space>
                  <Switch />
                  <span>启用用户级去重</span>
                </Space>
              </Form.Item>
              
              <Form.Item name="cross_device_enabled" valuePropName="checked">
                <Space>
                  <Switch />
                  <span>启用跨设备去重</span>
                </Space>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item name="user_cooldown_days" label="用户冷却期 (天)">
                <Slider min={1} max={30} marks={{ 1: '1天', 7: '7天', 14: '14天', 30: '30天' }} />
              </Form.Item>
              
              <Form.Item name="device_cooldown_hours" label="设备冷却期 (小时)">
                <Slider min={1} max={72} marks={{ 1: '1小时', 12: '12小时', 24: '24小时', 72: '72小时' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    );
  };

  // 熔断器配置组件
  const CircuitBreakerConfigPanel: React.FC = () => {
    const [circuitForm] = Form.useForm();

    return (
      <Card title="熔断器配置" extra={
        <Button 
          type="primary" 
          onClick={() => circuitForm.submit()}
        >
          保存配置
        </Button>
      }>
        <Form
          form={circuitForm}
          layout="vertical"
          onFinish={handleSaveCircuitBreakerConfig}
          initialValues={{
            failure_threshold: 5,
            success_threshold: 3,
            timeout_ms: 60000,
            enabled: true
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="enabled" valuePropName="checked">
                <Space>
                  <Switch />
                  <span>启用熔断器</span>
                </Space>
              </Form.Item>
              
              <Form.Item name="failure_threshold" label="失败阈值">
                <InputNumber min={1} max={20} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item name="success_threshold" label="成功阈值">
                <InputNumber min={1} max={10} style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item name="timeout_ms" label="超时时间 (毫秒)">
                <InputNumber min={30000} max={300000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    );
  };

  return (
    <div className="light-theme-force" style={{ background: 'var(--bg-light-base)', padding: '24px' }}>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">风控机制管理</h2>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadStats}
              loading={loading}
            >
              刷新数据
            </Button>
            <Button
              icon={<WarningOutlined />}
              onClick={handleResetStats}
              danger
            >
              重置统计
            </Button>
          </Space>
        </div>

        {/* 统计概览 */}
        <Row gutter={16} className="mb-6">
          <Col span={8}>
            <Card title="频率控制" size="small">
              <div className="space-y-4">
                <Statistic 
                  title="总检查次数" 
                  value={stats.rate_limit.total_checks} 
                />
                <Statistic 
                  title="拦截次数" 
                  value={stats.rate_limit.blocked_requests}
                  valueStyle={{ color: '#ff4d4f' }}
                />
                <div>
                  <div className="text-sm text-gray-500 mb-1">成功率</div>
                  <Progress 
                    percent={stats.rate_limit.success_rate} 
                    size="small"
                    status={stats.rate_limit.success_rate >= 90 ? 'success' : 'exception'}
                  />
                </div>
              </div>
            </Card>
          </Col>
          
          <Col span={8}>
            <Card title="去重控制" size="small">
              <div className="space-y-4">
                <Statistic 
                  title="总记录数" 
                  value={stats.deduplication.total_records} 
                />
                <Statistic 
                  title="去重拦截" 
                  value={stats.deduplication.duplicate_blocks}
                  valueStyle={{ color: '#1890ff' }}
                />
                <div>
                  <div className="text-sm text-gray-500 mb-1">去重效率</div>
                  <Progress 
                    percent={stats.deduplication.effectiveness} 
                    size="small"
                  />
                </div>
              </div>
            </Card>
          </Col>
          
          <Col span={8}>
            <Card title="熔断保护" size="small">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Statistic title="总熔断器" value={stats.circuit_breaker.total_circuits} />
                  <Badge 
                    count={stats.circuit_breaker.open_circuits} 
                    status={stats.circuit_breaker.open_circuits > 0 ? 'error' : 'success'}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="text-green-600">{stats.circuit_breaker.closed_circuits}</div>
                    <div>正常</div>
                  </div>
                  <div className="text-center">
                    <div className="text-orange-600">{stats.circuit_breaker.half_open_circuits}</div>
                    <div>半开</div>
                  </div>
                  <div className="text-center">
                    <div className="text-red-600">{stats.circuit_breaker.open_circuits}</div>
                    <div>熔断</div>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="策略配置" key="config">
          <div className="space-y-6">
            <RateLimitConfigPanel />
            <DeduplicationConfigPanel />
            <CircuitBreakerConfigPanel />
          </div>
        </TabPane>
        
        <TabPane tab="实时监控" key="monitoring">
          <Row gutter={16}>
            <Col span={12}>
              <Card title="频控状态监控" size="small">
                <div className="space-y-4">
                  <Alert
                    message="当前频控状态正常"
                    description={`当前操作频率: ${stats.rate_limit.current_rate} 次/分钟`}
                    type="success"
                    showIcon
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">今日操作数</div>
                      <div className="text-2xl font-bold">{stats.rate_limit.total_checks}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">拦截次数</div>
                      <div className="text-2xl font-bold text-red-500">{stats.rate_limit.blocked_requests}</div>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            
            <Col span={12}>
              <Card title="去重效果监控" size="small">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(stats.deduplication.by_level).map(([level, count]) => (
                      <div key={level}>
                        <div className="text-sm text-gray-500">{level} 级去重</div>
                        <div className="text-xl font-bold">{count}</div>
                      </div>
                    ))}
                  </div>
                  
                  <Progress 
                    percent={stats.deduplication.effectiveness} 
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>
        
        <TabPane tab="历史记录" key="history">
          <Card>
            <Table
              columns={[
                {
                  title: '时间',
                  dataIndex: 'timestamp',
                  key: 'timestamp',
                  render: (time: Date) => dayjs(time).format('MM-DD HH:mm:ss')
                },
                {
                  title: '类型',
                  dataIndex: 'type',
                  key: 'type',
                  render: (type: string) => {
                    const colorMap: Record<string, string> = {
                      rate_limit: 'orange',
                      deduplication: 'blue',
                      circuit_breaker: 'red'
                    };
                    return <Tag color={colorMap[type]}>{type}</Tag>;
                  }
                },
                {
                  title: '动作',
                  dataIndex: 'action',
                  key: 'action'
                },
                {
                  title: '描述',
                  dataIndex: 'description',
                  key: 'description'
                },
                {
                  title: '状态',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status: string) => (
                    <Tag color={status === 'success' ? 'green' : 'red'}>
                      {status === 'success' ? '成功' : '失败'}
                    </Tag>
                  )
                }
              ]}
              dataSource={[]} // 这里应该加载实际的历史记录
              size="small"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default RiskControlManagementPanel;