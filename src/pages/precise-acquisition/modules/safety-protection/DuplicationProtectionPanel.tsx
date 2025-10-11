// src/pages/precise-acquisition/modules/safety-protection/DuplicationProtectionPanel.tsx
// module: ui | layer: ui | role: page
// summary: 页面组件

/**
 * 查重保护服务
 * 提供跨设备的查重机制，防止重复关注和回复
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Switch,
  InputNumber,
  Select,
  Button,
  Space,
  Row,
  Col,
  Typography,
  Alert,
  Table,
  Tag,
  Modal,
  Tooltip,
  Progress,
  Statistic,
  List,
  Badge,
  Input
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  UserOutlined,
  MessageOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  SettingOutlined,
  SecurityScanOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import type { Device } from '../../../../domain/adb/entities/Device';

const { Title, Text } = Typography;
const { Option } = Select;

export interface DuplicationRule {
  id: string;
  name: string;
  type: 'follow' | 'reply' | 'global';
  enabled: boolean;
  settings: {
    checkWindow: number; // 检查时间窗口（小时）
    maxAttempts: number; // 最大尝试次数
    cooldownPeriod: number; // 冷却期（小时）
    crossDevice: boolean; // 跨设备检查
    strictMode: boolean; // 严格模式
  };
  createdAt: string;
  lastTriggered?: string;
  triggeredCount: number;
}

export interface DuplicationRecord {
  id: string;
  type: 'follow' | 'reply';
  targetId: string; // 目标账号ID或评论ID
  targetName: string;
  deviceId: string;
  deviceName: string;
  timestamp: string;
  action: 'blocked' | 'allowed' | 'warned';
  rule: string;
  details?: string;
}

export interface SafetyMetrics {
  todayBlocked: number;
  weeklyBlocked: number;
  totalProtected: number;
  activeRules: number;
  riskLevel: 'low' | 'medium' | 'high';
  lastUpdate: string;
}

interface DuplicationProtectionPanelProps {
  onlineDevices: Device[];
  onRuleUpdate: (rule: DuplicationRule) => void;
}

export const DuplicationProtectionPanel: React.FC<DuplicationProtectionPanelProps> = ({
  onlineDevices,
  onRuleUpdate
}) => {
  const [form] = Form.useForm();
  const [rules, setRules] = useState<DuplicationRule[]>([]);
  const [records, setRecords] = useState<DuplicationRecord[]>([]);
  const [metrics, setMetrics] = useState<SafetyMetrics | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<DuplicationRule | null>(null);
  const [loading, setLoading] = useState(false);

  // 初始化数据
  useEffect(() => {
    // 模拟默认规则
    const defaultRules: DuplicationRule[] = [
      {
        id: 'rule_follow_24h',
        name: '关注防重复（24小时）',
        type: 'follow',
        enabled: true,
        settings: {
          checkWindow: 24,
          maxAttempts: 1,
          cooldownPeriod: 24,
          crossDevice: true,
          strictMode: true
        },
        createdAt: new Date().toISOString(),
        triggeredCount: 15
      },
      {
        id: 'rule_reply_1h',
        name: '回复防重复（1小时）',
        type: 'reply',
        enabled: true,
        settings: {
          checkWindow: 1,
          maxAttempts: 1,
          cooldownPeriod: 1,
          crossDevice: true,
          strictMode: false
        },
        createdAt: new Date().toISOString(),
        triggeredCount: 8
      },
      {
        id: 'rule_global_safety',
        name: '全局安全保护',
        type: 'global',
        enabled: true,
        settings: {
          checkWindow: 168, // 一周
          maxAttempts: 5,
          cooldownPeriod: 72,
          crossDevice: true,
          strictMode: true
        },
        createdAt: new Date().toISOString(),
        triggeredCount: 3
      }
    ];

    // 模拟查重记录
    const mockRecords: DuplicationRecord[] = [
      {
        id: 'record_1',
        type: 'follow',
        targetId: 'user_123',
        targetName: '行业专家张三',
        deviceId: 'device_1',
        deviceName: '小米13',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        action: 'blocked',
        rule: '关注防重复（24小时）',
        details: '设备已在12小时前关注过该用户'
      },
      {
        id: 'record_2',
        type: 'reply',
        targetId: 'comment_456',
        targetName: '关于产品使用的评论',
        deviceId: 'device_2',
        deviceName: 'iPhone 15',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        action: 'blocked',
        rule: '回复防重复（1小时）',
        details: '其他设备已回复过该评论'
      }
    ];

    // 模拟安全指标
    const mockMetrics: SafetyMetrics = {
      todayBlocked: 12,
      weeklyBlocked: 45,
      totalProtected: 523,
      activeRules: defaultRules.filter(r => r.enabled).length,
      riskLevel: 'low',
      lastUpdate: new Date().toISOString()
    };

    setRules(defaultRules);
    setRecords(mockRecords);
    setMetrics(mockMetrics);
  }, []);

  // 规则表格列定义
  const ruleColumns: ColumnsType<DuplicationRule> = [
    {
      title: '规则名称',
      dataIndex: 'name',
      render: (name, record) => (
        <div>
          <div className="font-medium">{name}</div>
          <Text type="secondary" className="text-xs">
            {record.type === 'follow' ? '关注保护' : 
             record.type === 'reply' ? '回复保护' : '全局保护'}
          </Text>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      render: (enabled, record) => (
        <div className="space-y-1">
          <Tag color={enabled ? 'green' : 'default'}>
            {enabled ? '启用' : '禁用'}
          </Tag>
          <div className="text-xs text-gray-500">
            触发 {record.triggeredCount} 次
          </div>
        </div>
      )
    },
    {
      title: '保护设置',
      key: 'settings',
      render: (_, record) => (
        <div className="text-xs space-y-1">
          <div>检查窗口: {record.settings.checkWindow}小时</div>
          <div>最大尝试: {record.settings.maxAttempts}次</div>
          <div>冷却期: {record.settings.cooldownPeriod}小时</div>
          <div className="flex space-x-1">
            {record.settings.crossDevice && <Tag className="text-xs">跨设备</Tag>}
            {record.settings.strictMode && <Tag className="text-xs">严格模式</Tag>}
          </div>
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Switch
            size="small"
            checked={record.enabled}
            onChange={(checked) => handleToggleRule(record.id, checked)}
          />
          <Button
            size="small"
            onClick={() => handleEditRule(record)}
          >
            编辑
          </Button>
        </Space>
      )
    }
  ];

  // 记录表格列定义
  const recordColumns: ColumnsType<DuplicationRecord> = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      render: (timestamp) => (
        <div className="text-xs">
          {new Date(timestamp).toLocaleString()}
        </div>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      render: (type) => (
        <Tag color={type === 'follow' ? 'blue' : 'green'}>
          {type === 'follow' ? (
            <><UserOutlined /> 关注</>
          ) : (
            <><MessageOutlined /> 回复</>
          )}
        </Tag>
      )
    },
    {
      title: '目标',
      key: 'target',
      render: (_, record) => (
        <div>
          <div className="font-medium text-sm">{record.targetName}</div>
          <Text type="secondary" className="text-xs">
            {record.targetId}
          </Text>
        </div>
      )
    },
    {
      title: '设备',
      dataIndex: 'deviceName',
      render: (deviceName) => (
        <Tag className="text-xs">{deviceName}</Tag>
      )
    },
    {
      title: '动作',
      dataIndex: 'action',
      render: (action) => {
        const actionMap = {
          blocked: { color: 'red', text: '已阻止', icon: <StopOutlined /> },
          allowed: { color: 'green', text: '已允许', icon: <CheckCircleOutlined /> },
          warned: { color: 'orange', text: '已警告', icon: <WarningOutlined /> }
        };
        const config = actionMap[action];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      }
    },
    {
      title: '触发规则',
      dataIndex: 'rule',
      render: (rule) => (
        <Text className="text-xs">{rule}</Text>
      )
    }
  ];

  // 切换规则状态
  const handleToggleRule = (ruleId: string, enabled: boolean) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, enabled } : rule
    ));
  };

  // 编辑规则
  const handleEditRule = (rule: DuplicationRule) => {
    setEditingRule(rule);
    form.setFieldsValue(rule.settings);
    setCreateModalVisible(true);
  };

  // 创建新规则
  const handleCreateRule = async (values: any) => {
    setLoading(true);
    try {
      const newRule: DuplicationRule = {
        id: editingRule?.id || `rule_${Date.now()}`,
        name: values.name,
        type: values.type,
        enabled: true,
        settings: {
          checkWindow: values.checkWindow,
          maxAttempts: values.maxAttempts,
          cooldownPeriod: values.cooldownPeriod,
          crossDevice: values.crossDevice,
          strictMode: values.strictMode
        },
        createdAt: editingRule?.createdAt || new Date().toISOString(),
        triggeredCount: editingRule?.triggeredCount || 0
      };

      if (editingRule) {
        setRules(prev => prev.map(rule => 
          rule.id === editingRule.id ? newRule : rule
        ));
      } else {
        setRules(prev => [...prev, newRule]);
      }

      setCreateModalVisible(false);
      setEditingRule(null);
      form.resetFields();
      onRuleUpdate(newRule);
    } catch (error) {
      console.error('保存规则失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 安全指标概览 */}
      {metrics && (
        <Card title={
          <div className="flex items-center space-x-2">
            <SecurityScanOutlined className="text-green-500" />
            <span>安全保护概览</span>
            <Badge 
              status={metrics.riskLevel === 'low' ? 'success' : 
                     metrics.riskLevel === 'medium' ? 'warning' : 'error'} 
              text={metrics.riskLevel === 'low' ? '安全' : 
                    metrics.riskLevel === 'medium' ? '中等风险' : '高风险'}
            />
          </div>
        }>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="今日阻止"
                value={metrics.todayBlocked}
                valueStyle={{ color: '#cf1322' }}
                prefix={<StopOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="本周阻止"
                value={metrics.weeklyBlocked}
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总计保护"
                value={metrics.totalProtected}
                valueStyle={{ color: '#3f8600' }}
                prefix={<SafetyCertificateOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="活跃规则"
                value={metrics.activeRules}
                valueStyle={{ color: '#1890ff' }}
                prefix={<SettingOutlined />}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 查重规则管理 */}
      <Card 
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <SafetyCertificateOutlined className="text-blue-500" />
              <span>查重规则管理</span>
            </div>
            <Button
              type="primary"
              onClick={() => {
                setEditingRule(null);
                form.resetFields();
                setCreateModalVisible(true);
              }}
            >
              新建规则
            </Button>
          </div>
        }
      >
        <Table
          columns={ruleColumns}
          dataSource={rules}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>

      {/* 查重记录 */}
      <Card 
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ClockCircleOutlined className="text-orange-500" />
              <span>查重记录</span>
            </div>
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => window.location.reload()}
            >
              刷新
            </Button>
          </div>
        }
      >
        <Table
          columns={recordColumns}
          dataSource={records}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showQuickJumper: true
          }}
          size="small"
        />
      </Card>

      {/* 安全提示 */}
      <Alert
        message="查重保护机制说明"
        description={
          <List
            size="small"
            dataSource={[
              '🔒 跨设备查重：防止不同设备对同一目标重复操作',
              '⏰ 时间窗口：在指定时间内检查历史操作记录',
              '🚫 自动阻止：检测到重复操作时自动阻止执行',
              '📊 智能分析：根据操作频率和模式评估风险等级',
              '⚙️ 灵活配置：支持自定义规则和保护策略'
            ]}
            renderItem={item => <List.Item>{item}</List.Item>}
          />
        }
        type="info"
        showIcon
      />

      {/* 规则编辑模态框 */}
      <Modal
        title={editingRule ? '编辑查重规则' : '创建查重规则'}
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          setEditingRule(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateRule}
          initialValues={{
            type: 'follow',
            checkWindow: 24,
            maxAttempts: 1,
            cooldownPeriod: 24,
            crossDevice: true,
            strictMode: false
          }}
        >
          {!editingRule && (
            <>
              <Form.Item
                name="name"
                label="规则名称"
                rules={[{ required: true, message: '请输入规则名称' }]}
              >
                <Input placeholder="输入规则名称" />
              </Form.Item>

              <Form.Item
                name="type"
                label="规则类型"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="follow">关注保护</Option>
                  <Option value="reply">回复保护</Option>
                  <Option value="global">全局保护</Option>
                </Select>
              </Form.Item>
            </>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="checkWindow"
                label="检查时间窗口（小时）"
                tooltip="在此时间内检查历史操作记录"
              >
                <InputNumber min={1} max={168} className="w-full" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="maxAttempts"
                label="最大尝试次数"
                tooltip="在时间窗口内允许的最大操作次数"
              >
                <InputNumber min={1} max={10} className="w-full" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="cooldownPeriod"
                label="冷却期（小时）"
                tooltip="触发规则后的冷却时间"
              >
                <InputNumber min={1} max={168} className="w-full" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <div className="space-y-4">
                <Form.Item name="crossDevice" valuePropName="checked">
                  <Switch />
                  <span className="ml-2">跨设备检查</span>
                  <Tooltip title="检查所有设备的操作历史">
                    <InfoCircleOutlined className="ml-1 text-gray-400" />
                  </Tooltip>
                </Form.Item>

                <Form.Item name="strictMode" valuePropName="checked">
                  <Switch />
                  <span className="ml-2">严格模式</span>
                  <Tooltip title="更严格的查重规则">
                    <InfoCircleOutlined className="ml-1 text-gray-400" />
                  </Tooltip>
                </Form.Item>
              </div>
            </Col>
          </Row>

          <div className="flex justify-end space-x-2">
            <Button onClick={() => {
              setCreateModalVisible(false);
              setEditingRule(null);
              form.resetFields();
            }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {editingRule ? '更新规则' : '创建规则'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};