// src/pages/SemanticAnalyzerSettingsPage.tsx
// module: ui | layer: ui | role: page
// summary: 语义分析器配置页面，管理反义词检测设置

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Space,
  Typography,
  Divider,
  Button,
  Switch,
  Radio,
  Table,
  Input,
  Form,
  Modal,
  message,
  Popconfirm,
  Alert,
  Tag,
  Tooltip,
} from 'antd';
import {
  SettingOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  ExperimentOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

// 类型定义
interface AntonymPair {
  id: string;
  word1: string;
  word2: string;
  confidence?: number;
  description?: string;
  enabled: boolean;
}

interface SemanticConfig {
  enabled: boolean;
  textMatchingMode: 'exact' | 'partial';
  antonymPairs: AntonymPair[];
  antonymPenaltyScore: number;
}

/**
 * 语义分析器设置页面组件
 */
export const SemanticAnalyzerSettingsPage: React.FC = () => {
  const [config, setConfig] = useState<SemanticConfig>({
    enabled: true,
    textMatchingMode: 'partial',
    antonymPairs: [
      {
        id: '1',
        word1: '关注',
        word2: '已关注',
        confidence: 0.9,
        description: '防止误点击已关注的用户',
        enabled: true,
      },
      {
        id: '2',
        word1: '登录',
        word2: '退出',
        confidence: 0.8,
        description: '防止登录/退出操作混淆',
        enabled: true,
      },
      {
        id: '3',
        word1: '打开',
        word2: '关闭',
        confidence: 0.7,
        description: '防止开关状态操作混淆',
        enabled: true,
      },
    ],
    antonymPenaltyScore: 0.5,
  });

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPair, setEditingPair] = useState<AntonymPair | null>(null);
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [form] = Form.useForm();

  // 模拟API调用
  useEffect(() => {
    // TODO: 从后端加载配置
    console.log('加载语义分析器配置...');
  }, []);

  // 保存配置
  const saveConfig = async () => {
    try {
      // TODO: 调用后端API保存配置
      console.log('保存配置:', config);
      message.success('配置已保存');
    } catch (error) {
      message.error('保存配置失败');
    }
  };

  // 添加/编辑反义词对
  const handleEditPair = (pair?: AntonymPair) => {
    setEditingPair(pair || null);
    if (pair) {
      form.setFieldsValue(pair);
    } else {
      form.resetFields();
    }
    setEditModalVisible(true);
  };

  // 保存反义词对
  const handleSavePair = async () => {
    try {
      const values = await form.validateFields();
      const newPair: AntonymPair = {
        id: editingPair?.id || Date.now().toString(),
        ...values,
        enabled: values.enabled ?? true,
      };

      if (editingPair) {
        // 编辑现有反义词对
        setConfig(prev => ({
          ...prev,
          antonymPairs: prev.antonymPairs.map(p => 
            p.id === editingPair.id ? newPair : p
          ),
        }));
      } else {
        // 添加新反义词对
        setConfig(prev => ({
          ...prev,
          antonymPairs: [...prev.antonymPairs, newPair],
        }));
      }

      setEditModalVisible(false);
      message.success(editingPair ? '反义词对已更新' : '反义词对已添加');
    } catch (error) {
      // 表单验证失败
    }
  };

  // 删除反义词对
  const handleDeletePair = (id: string) => {
    setConfig(prev => ({
      ...prev,
      antonymPairs: prev.antonymPairs.filter(p => p.id !== id),
    }));
    message.success('反义词对已删除');
  };

  // 切换反义词对启用状态
  const togglePairEnabled = (id: string, enabled: boolean) => {
    setConfig(prev => ({
      ...prev,
      antonymPairs: prev.antonymPairs.map(p => 
        p.id === id ? { ...p, enabled } : p
      ),
    }));
  };

  // 测试反义词检测
  const [testResult, setTestResult] = useState<{
    shouldMatch: boolean;
    hasAntonymConflict: boolean;
    message: string;
  } | null>(null);

  const handleTest = (values: { target: string; candidate: string }) => {
    const { target, candidate } = values;
    
    // 模拟语义分析器测试
    if (!config.enabled) {
      setTestResult({
        shouldMatch: true,
        hasAntonymConflict: false,
        message: '语义分析器已禁用，允许匹配',
      });
      return;
    }

    if (config.textMatchingMode === 'exact') {
      const shouldMatch = target.trim() === candidate.trim();
      setTestResult({
        shouldMatch,
        hasAntonymConflict: false,
        message: shouldMatch ? '绝对匹配：文本完全一致' : '绝对匹配：文本不一致',
      });
      return;
    }

    // 检查反义词冲突
    const enabledPairs = config.antonymPairs.filter(p => p.enabled);
    const conflictPair = enabledPairs.find(p => 
      (p.word1 === target && p.word2 === candidate) ||
      (p.word2 === target && p.word1 === candidate)
    );

    if (conflictPair) {
      setTestResult({
        shouldMatch: false,
        hasAntonymConflict: true,
        message: `检测到反义词冲突：${conflictPair.word1} <-> ${conflictPair.word2}`,
      });
    } else {
      setTestResult({
        shouldMatch: true,
        hasAntonymConflict: false,
        message: '部分匹配：未检测到反义词冲突',
      });
    }
  };

  // 反义词对表格列
  const columns = [
    {
      title: '反义词对',
      key: 'pair',
      render: (record: AntonymPair) => (
        <Space direction="vertical" size="small">
          <Space>
            <Tag color="blue">{record.word1}</Tag>
            <Text type="secondary">↔</Text>
            <Tag color="orange">{record.word2}</Tag>
          </Space>
          {record.description && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.description}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: '置信度',
      dataIndex: 'confidence',
      key: 'confidence',
      width: 100,
      render: (confidence: number) => (
        <Text style={{ color: confidence >= 0.8 ? '#52c41a' : confidence >= 0.6 ? '#faad14' : '#ff4d4f' }}>
          {(confidence * 100).toFixed(0)}%
        </Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 80,
      render: (enabled: boolean, record: AntonymPair) => (
        <Switch
          size="small"
          checked={enabled}
          onChange={(checked) => togglePairEnabled(record.id, checked)}
        />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (record: AntonymPair) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditPair(record)}
          />
          <Popconfirm
            title="确认删除这个反义词对吗？"
            onConfirm={() => handleDeletePair(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              danger
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 页面标题 */}
        <Space>
          <SettingOutlined style={{ fontSize: 24, color: '#1677ff' }} />
          <Title level={2} style={{ margin: 0 }}>
            语义分析器设置
          </Title>
        </Space>

        {/* 功能说明 */}
        <Alert
          type="info"
          showIcon
          message="语义分析器功能说明"
          description={
            <div>
              <p>语义分析器用于防止V3智能执行引擎错误点击反义词按钮，例如误点"已关注"而非"关注"。</p>
              <ul style={{ marginBottom: 0 }}>
                <li><strong>绝对匹配模式</strong>：只有文本完全一致才匹配，不启用反义词检测</li>
                <li><strong>部分匹配模式</strong>：允许包含匹配，同时启用反义词检测防止误操作</li>
              </ul>
            </div>
          }
        />

        <Row gutter={24}>
          {/* 基本设置 */}
          <Col span={12}>
            <Card title="基本设置" size="small">
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <Space>
                    <Text strong>启用语义分析器</Text>
                    <Tooltip title="关闭后将完全禁用反义词检测功能">
                      <InfoCircleOutlined style={{ color: '#999' }} />
                    </Tooltip>
                  </Space>
                  <div style={{ marginTop: 8 }}>
                    <Switch
                      checked={config.enabled}
                      onChange={(enabled) => setConfig(prev => ({ ...prev, enabled }))}
                      checkedChildren="启用"
                      unCheckedChildren="禁用"
                    />
                  </div>
                </div>

                <Divider />

                <div>
                  <Text strong>文本匹配模式</Text>
                  <div style={{ marginTop: 8 }}>
                    <Radio.Group
                      value={config.textMatchingMode}
                      onChange={(e) => setConfig(prev => ({ ...prev, textMatchingMode: e.target.value }))}
                      disabled={!config.enabled}
                    >
                      <Space direction="vertical">
                        <Radio value="exact">
                          绝对匹配 <Text type="secondary">（不启用反义词检测）</Text>
                        </Radio>
                        <Radio value="partial">
                          部分匹配 <Text type="secondary">（启用反义词检测）</Text>
                        </Radio>
                      </Space>
                    </Radio.Group>
                  </div>
                </div>

                <Divider />

                <div>
                  <Text strong>反义词惩罚分数</Text>
                  <div style={{ marginTop: 8 }}>
                    <Input
                      type="number"
                      min={0}
                      max={1}
                      step={0.1}
                      value={config.antonymPenaltyScore}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        antonymPenaltyScore: parseFloat(e.target.value) || 0 
                      }))}
                      disabled={!config.enabled || config.textMatchingMode === 'exact'}
                      style={{ width: 120 }}
                      suffix="分"
                    />
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      检测到反义词时的惩罚分数
                    </Text>
                  </div>
                </div>

                <Divider />

                <Space>
                  <Button type="primary" onClick={saveConfig}>
                    保存配置
                  </Button>
                  <Button onClick={() => setTestModalVisible(true)}>
                    <ExperimentOutlined />
                    测试检测
                  </Button>
                </Space>
              </Space>
            </Card>
          </Col>

          {/* 状态概览 */}
          <Col span={12}>
            <Card title="状态概览" size="small">
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: config.enabled ? '#52c41a' : '#ff4d4f' }}>
                        {config.enabled ? '启用' : '禁用'}
                      </div>
                      <Text type="secondary">检测状态</Text>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1677ff' }}>
                        {config.antonymPairs.filter(p => p.enabled).length}
                      </div>
                      <Text type="secondary">启用的反义词对</Text>
                    </Card>
                  </Col>
                </Row>

                <Card size="small">
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong>当前模式</Text>
                    <Tag color={config.textMatchingMode === 'exact' ? 'blue' : 'green'}>
                      {config.textMatchingMode === 'exact' ? '绝对匹配' : '部分匹配'}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {config.textMatchingMode === 'exact' 
                        ? '要求文本完全一致，不检测反义词'
                        : '允许包含匹配，启用反义词检测'
                      }
                    </Text>
                  </Space>
                </Card>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* 反义词对管理 */}
        <Card 
          title="反义词对管理" 
          size="small"
          extra={
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => handleEditPair()}
              disabled={!config.enabled}
            >
              添加反义词对
            </Button>
          }
        >
          <Table
            columns={columns}
            dataSource={config.antonymPairs}
            rowKey="id"
            size="small"
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showQuickJumper: true,
            }}
          />
        </Card>
      </Space>

      {/* 编辑反义词对模态框 */}
      <Modal
        title={editingPair ? '编辑反义词对' : '添加反义词对'}
        open={editModalVisible}
        onOk={handleSavePair}
        onCancel={() => setEditModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="word1"
            label="第一个词"
            rules={[{ required: true, message: '请输入第一个词' }]}
          >
            <Input placeholder="例如：关注" />
          </Form.Item>
          <Form.Item
            name="word2"
            label="第二个词（反义词）"
            rules={[{ required: true, message: '请输入反义词' }]}
          >
            <Input placeholder="例如：已关注" />
          </Form.Item>
          <Form.Item
            name="confidence"
            label="置信度"
            initialValue={0.8}
            rules={[{ required: true, message: '请输入置信度' }]}
          >
            <Input
              type="number"
              min={0}
              max={1}
              step={0.1}
              suffix="(0-1)"
            />
          </Form.Item>
          <Form.Item name="description" label="描述（可选）">
            <TextArea 
              rows={2} 
              placeholder="描述这个反义词对的用途..."
              maxLength={200}
            />
          </Form.Item>
          <Form.Item name="enabled" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
            <Text style={{ marginLeft: 8 }}>启用这个反义词对</Text>
          </Form.Item>
        </Form>
      </Modal>

      {/* 测试检测模态框 */}
      <Modal
        title="测试反义词检测"
        open={testModalVisible}
        onCancel={() => {
          setTestModalVisible(false);
          setTestResult(null);
        }}
        footer={null}
        width={600}
      >
        <Form layout="vertical" onFinish={handleTest}>
          <Alert
            type="info"
            showIcon
            message="测试说明"
            description="输入目标文本和候选文本，测试语义分析器是否会检测到反义词冲突。"
            style={{ marginBottom: 16 }}
          />
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="target"
                label="目标文本"
                rules={[{ required: true, message: '请输入目标文本' }]}
              >
                <Input placeholder="例如：关注" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="candidate"
                label="候选文本"
                rules={[{ required: true, message: '请输入候选文本' }]}
              >
                <Input placeholder="例如：已关注" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                <ExperimentOutlined />
                开始测试
              </Button>
              <Button onClick={() => setTestResult(null)}>
                清除结果
              </Button>
            </Space>
          </Form.Item>

          {testResult && (
            <Card size="small" style={{ marginTop: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text strong>检测结果</Text>
                  {testResult.shouldMatch ? (
                    <Tag color="success" icon={<CheckCircleOutlined />}>允许匹配</Tag>
                  ) : (
                    <Tag color="error" icon={<CloseCircleOutlined />}>拒绝匹配</Tag>
                  )}
                </div>
                <div>
                  <Text type="secondary">
                    {testResult.message}
                  </Text>
                </div>
                {testResult.hasAntonymConflict && (
                  <Alert
                    type="warning"
                    showIcon
                    message="检测到反义词冲突"
                    description="V3执行引擎将避免点击此候选元素，防止误操作。"
                    size="small"
                  />
                )}
              </Space>
            </Card>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default SemanticAnalyzerSettingsPage;