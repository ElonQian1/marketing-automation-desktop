/**
 * 查重配置面板
 * 管理查重规则、查看检测日志、配置安全参数
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Switch,
  InputNumber,
  Select,
  Table,
  Tag,
  Space,
  Modal,
  Alert,
  Typography,
  Row,
  Col,
  Statistic,
  Progress,
  Tabs,
  List,
  Badge,
  Tooltip,
  message
} from 'antd';
import {
  SafetyOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SettingOutlined,
  EyeOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ExportOutlined
} from '@ant-design/icons';
import type { 
  DuplicationRule, 
  DuplicationCheck, 
  DuplicationHistory,
  DuplicationEvent,
  DuplicationConfig 
} from './types';
import { DuplicationDetector } from './DuplicationDetector';
import { DuplicationRuleManager } from './DuplicationRuleManager';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface DuplicationConfigPanelProps {
  onRuleChange?: (rules: DuplicationRule[]) => void;
  onConfigChange?: (config: DuplicationConfig) => void;
}

export const DuplicationConfigPanel: React.FC<DuplicationConfigPanelProps> = ({
  onRuleChange,
  onConfigChange
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('rules');
  
  // 状态管理
  const [rules, setRules] = useState<DuplicationRule[]>([]);
  const [recentChecks, setRecentChecks] = useState<DuplicationCheck[]>([]);
  const [history, setHistory] = useState<DuplicationHistory[]>([]);
  const [events, setEvents] = useState<DuplicationEvent[]>([]);
  const [config, setConfig] = useState<DuplicationConfig>({
    globalSettings: {
      enabled: true,
      defaultTimeWindow: 24,
      maxGlobalActionsPerHour: 100,
      emergencyStop: false,
      autoAdjustRules: false,
      learningMode: false,
      platformSync: true
    },
    notifications: {
      onRuleTriggered: true,
      onHighRiskDetected: true,
      notificationMethods: ['popup']
    },
    dataRetention: {
      historyDays: 30,
      logLevel: 'standard',
      exportFormat: 'json'
    }
  });
  
  // 模态框状态
  const [ruleModalVisible, setRuleModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<DuplicationRule | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<DuplicationCheck | null>(null);
  
  // 统计数据
  const [stats, setStats] = useState({
    totalRules: 0,
    activeRules: 0,
    checksToday: 0,
    blockedToday: 0,
    riskLevel: 'low' as 'low' | 'medium' | 'high'
  });

  const ruleManager = new DuplicationRuleManager();
  const detector = new DuplicationDetector();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 加载规则
      const loadedRules = await ruleManager.getAllRules();
      setRules(loadedRules);
      
      // 加载最近检查记录
      const checks = await detector.getChecks(50);
      setRecentChecks(checks);
      
      // 计算统计数据
      const today = new Date().toISOString().split('T')[0];
      const todayChecks = checks.filter(c => c.timestamp.startsWith(today));
      const blockedToday = todayChecks.filter(c => c.result === 'blocked').length;
      
      setStats({
        totalRules: loadedRules.length,
        activeRules: loadedRules.filter(r => r.enabled).length,
        checksToday: todayChecks.length,
        blockedToday,
        riskLevel: blockedToday > 10 ? 'high' : blockedToday > 5 ? 'medium' : 'low'
      });
      
    } catch (error) {
      console.error('加载数据失败:', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 规则管理
  const handleAddRule = () => {
    setEditingRule(null);
    form.resetFields();
    setRuleModalVisible(true);
  };

  const handleEditRule = (rule: DuplicationRule) => {
    setEditingRule(rule);
    form.setFieldsValue(rule);
    setRuleModalVisible(true);
  };

  const handleSaveRule = async (values: any) => {
    try {
      setLoading(true);
      let savedRule: DuplicationRule;
      
      if (editingRule) {
        savedRule = await ruleManager.updateRule(editingRule.id, values);
      } else {
        savedRule = await ruleManager.createRule(values);
      }
      
      await loadData();
      setRuleModalVisible(false);
      message.success(editingRule ? '规则更新成功' : '规则创建成功');
      
      if (onRuleChange) {
        onRuleChange(await ruleManager.getAllRules());
      }
    } catch (error) {
      console.error('保存规则失败:', error);
      message.error('保存规则失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await ruleManager.deleteRule(ruleId);
      await loadData();
      message.success('规则删除成功');
      
      if (onRuleChange) {
        onRuleChange(await ruleManager.getAllRules());
      }
    } catch (error) {
      console.error('删除规则失败:', error);
      message.error('删除规则失败');
    }
  };

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      await ruleManager.updateRule(ruleId, { enabled });
      await loadData();
      message.success(enabled ? '规则已启用' : '规则已禁用');
    } catch (error) {
      console.error('切换规则状态失败:', error);
      message.error('操作失败');
    }
  };

  // 查看检查详情
  const handleViewDetail = (check: DuplicationCheck) => {
    setSelectedCheck(check);
    setDetailModalVisible(true);
  };

  // 表格列定义
  const ruleColumns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: DuplicationRule) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" className="text-xs">{record.description}</Text>
        </div>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'follow' ? 'blue' : type === 'reply' ? 'green' : 'orange'}>
          {type === 'follow' ? '关注' : type === 'reply' ? '回复' : '互动'}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean, record: DuplicationRule) => (
        <Switch
          checked={enabled}
          onChange={(checked) => handleToggleRule(record.id, checked)}
        />
      )
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: number) => (
        <Tag color={priority >= 8 ? 'red' : priority >= 5 ? 'orange' : 'green'}>
          {priority}
        </Tag>
      )
    },
    {
      title: '检测次数',
      key: 'stats',
      render: (_, record: DuplicationRule) => (
        <div className="text-center">
          <div className="text-sm font-medium">{record.stats.totalChecks}</div>
          <div className="text-xs text-gray-500">
            阻止 {record.stats.actionsBlocked}
          </div>
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: DuplicationRule) => (
        <Space>
          <Button 
            type="link" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEditRule(record)}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            size="small" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteRule(record.id)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  const checkColumns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: string) => new Date(timestamp).toLocaleString()
    },
    {
      title: '目标',
      key: 'target',
      render: (_, record: DuplicationCheck) => (
        <div>
          <Text>{record.targetId}</Text>
          <br />
          <Tag>{record.targetType}</Tag>
        </div>
      )
    },
    {
      title: '操作',
      dataIndex: 'actionType',
      key: 'actionType',
      render: (actionType: string) => (
        <Tag color={actionType === 'follow' ? 'blue' : 'green'}>
          {actionType === 'follow' ? '关注' : '回复'}
        </Tag>
      )
    },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      render: (result: string) => {
        const colors = {
          pass: 'green',
          blocked: 'red',
          warning: 'orange',
          delayed: 'blue'
        };
        return <Tag color={colors[result as keyof typeof colors]}>{result}</Tag>;
      }
    },
    {
      title: '设备',
      dataIndex: 'deviceId',
      key: 'deviceId'
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: DuplicationCheck) => (
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
    <div className="space-y-6">
      {/* 头部统计 */}
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃规则"
              value={stats.activeRules}
              suffix={`/ ${stats.totalRules}`}
              prefix={<SafetyOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日检测"
              value={stats.checksToday}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日阻止"
              value={stats.blockedToday}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: stats.blockedToday > 0 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">风险等级</div>
                <Tag 
                  color={stats.riskLevel === 'high' ? 'red' : stats.riskLevel === 'medium' ? 'orange' : 'green'}
                  className="mt-1"
                >
                  {stats.riskLevel === 'high' ? '高风险' : stats.riskLevel === 'medium' ? '中等' : '低风险'}
                </Tag>
              </div>
              <WarningOutlined 
                style={{ 
                  fontSize: 24, 
                  color: stats.riskLevel === 'high' ? '#cf1322' : stats.riskLevel === 'medium' ? '#fa8c16' : '#52c41a' 
                }} 
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* 主要内容 */}
      <Card
        title={
          <div className="flex items-center justify-between">
            <span>
              <SafetyOutlined className="mr-2" />
              查重防护系统
            </span>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={loadData}>
                刷新
              </Button>
              <Button icon={<ExportOutlined />}>
                导出日志
              </Button>
            </Space>
          </div>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={
              <span>
                <SettingOutlined />
                规则管理
              </span>
            } 
            key="rules"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Alert
                  message="查重规则用于防止对同一目标进行重复操作，避免被平台识别为异常行为"
                  type="info"
                  showIcon
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRule}>
                  添加规则
                </Button>
              </div>
              
              <Table
                columns={ruleColumns}
                dataSource={rules}
                rowKey="id"
                loading={loading}
                size="middle"
              />
            </div>
          </TabPane>

          <TabPane 
            tab={
              <span>
                <EyeOutlined />
                检测日志
                {recentChecks.filter(c => c.result === 'blocked').length > 0 && (
                  <Badge 
                    count={recentChecks.filter(c => c.result === 'blocked').length} 
                    style={{ marginLeft: 4 }}
                  />
                )}
              </span>
            } 
            key="logs"
          >
            <Table
              columns={checkColumns}
              dataSource={recentChecks}
              rowKey="id"
              loading={loading}
              size="middle"
              pagination={{ pageSize: 20 }}
            />
          </TabPane>

          <TabPane 
            tab={
              <span>
                <SettingOutlined />
                全局配置
              </span>
            } 
            key="config"
          >
            <Form
              layout="vertical"
              initialValues={config}
              onValuesChange={(_, allValues) => {
                setConfig(allValues);
                if (onConfigChange) {
                  onConfigChange(allValues);
                }
              }}
            >
              <Row gutter={24}>
                <Col span={12}>
                  <Card title="基础设置" size="small">
                    <Form.Item name={['globalSettings', 'enabled']} valuePropName="checked">
                      <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                    </Form.Item>
                    
                    <Form.Item 
                      name={['globalSettings', 'defaultTimeWindow']} 
                      label="默认时间窗口（小时）"
                    >
                      <InputNumber min={1} max={168} />
                    </Form.Item>
                    
                    <Form.Item 
                      name={['globalSettings', 'maxGlobalActionsPerHour']} 
                      label="全局每小时最大操作数"
                    >
                      <InputNumber min={1} max={1000} />
                    </Form.Item>
                  </Card>
                </Col>
                
                <Col span={12}>
                  <Card title="智能功能" size="small">
                    <Form.Item 
                      name={['globalSettings', 'autoAdjustRules']} 
                      valuePropName="checked"
                      label="自动调整规则"
                    >
                      <Switch />
                    </Form.Item>
                    
                    <Form.Item 
                      name={['globalSettings', 'learningMode']} 
                      valuePropName="checked"
                      label="学习模式（记录但不阻止）"
                    >
                      <Switch />
                    </Form.Item>
                    
                    <Form.Item 
                      name={['globalSettings', 'platformSync']} 
                      valuePropName="checked"
                      label="同步平台限制"
                    >
                      <Switch />
                    </Form.Item>
                  </Card>
                </Col>
              </Row>
            </Form>
          </TabPane>
        </Tabs>
      </Card>

      {/* 规则编辑模态框 */}
      <Modal
        title={editingRule ? '编辑规则' : '添加规则'}
        open={ruleModalVisible}
        onCancel={() => setRuleModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveRule}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="规则名称" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="规则类型" rules={[{ required: true }]}>
                <Select>
                  <Option value="follow">关注</Option>
                  <Option value="reply">回复</Option>
                  <Option value="interaction">互动</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item name="description" label="规则描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="priority" label="优先级" rules={[{ required: true }]}>
                <InputNumber min={1} max={10} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name={['timeWindow', 'value']} label="时间窗口值" rules={[{ required: true }]}>
                <InputNumber min={1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name={['timeWindow', 'unit']} label="时间单位" rules={[{ required: true }]}>
                <Select>
                  <Option value="minutes">分钟</Option>
                  <Option value="hours">小时</Option>
                  <Option value="days">天</Option>
                  <Option value="weeks">周</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                name={['conditions', 'maxActionsPerTarget']} 
                label="对同一目标最大操作次数" 
                rules={[{ required: true }]}
              >
                <InputNumber min={1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name={['conditions', 'maxActionsPerTimeWindow']} 
                label="时间窗口内最大操作次数" 
                rules={[{ required: true }]}
              >
                <InputNumber min={1} />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item name={['actions', 'onDuplicationDetected']} label="检测到重复时的操作" rules={[{ required: true }]}>
            <Select>
              <Option value="block">阻止</Option>
              <Option value="warn">警告</Option>
              <Option value="delay">延迟</Option>
              <Option value="log">仅记录</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 检查详情模态框 */}
      <Modal
        title="检查详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedCheck && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Text type="secondary">检查时间:</Text>
                <div>{new Date(selectedCheck.timestamp).toLocaleString()}</div>
              </div>
              <div>
                <Text type="secondary">检查结果:</Text>
                <div>
                  <Tag color={selectedCheck.result === 'pass' ? 'green' : 'red'}>
                    {selectedCheck.result}
                  </Tag>
                </div>
              </div>
              <div>
                <Text type="secondary">目标ID:</Text>
                <div>{selectedCheck.targetId}</div>
              </div>
              <div>
                <Text type="secondary">设备ID:</Text>
                <div>{selectedCheck.deviceId}</div>
              </div>
            </div>
            
            <div>
              <Text type="secondary">检查原因:</Text>
              <div className="mt-1 p-2 bg-gray-50 rounded">{selectedCheck.reason}</div>
            </div>
            
            {selectedCheck.details.previousActions.length > 0 && (
              <div>
                <Text type="secondary">历史操作:</Text>
                <List
                  size="small"
                  dataSource={selectedCheck.details.previousActions}
                  renderItem={(action) => (
                    <List.Item>
                      <div className="flex justify-between w-full">
                        <span>{action.actionType} - {action.targetId}</span>
                        <span className="text-gray-500">
                          {new Date(action.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </List.Item>
                  )}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};