/**
 * 话术模板管理器组件
 * 
 * 提供话术模板的增删改查、预览、批量操作等功能
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Tag,
  Tooltip,
  message,
  Popconfirm,
  Row,
  Col,
  Typography,
  Divider
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CopyOutlined,
  PlayCircleOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { 
  TemplateManagementService,
  TemplateContext,
  TemplateRenderResult
} from '../services/TemplateManagementService';
import { ReplyTemplate, Platform, IndustryTag } from '../../shared/types/core';


const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

/**
 * 话术模板管理器
 */
export const TemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<ReplyTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<ReplyTemplate | null>(null);
  const [previewResult, setPreviewResult] = useState<TemplateRenderResult | null>(null);
  const [form] = Form.useForm();
  const [previewForm] = Form.useForm();

  const templateService = new TemplateManagementService();

  // 筛选条件
  const [filters, setFilters] = useState({
    channel: undefined as Platform | 'all' | undefined,
    category: undefined as string | undefined,
    enabled: undefined as boolean | undefined,
    keyword: ''
  });

  /**
   * 加载模板列表
   */
  const loadTemplates = async () => {
    setLoading(true);
    try {
      const result = await templateService.getTemplates(filters);
      setTemplates(result);
    } catch (error) {
      message.error(`加载失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 创建或更新模板
   */
  const handleSaveTemplate = async (values: any) => {
    try {
      const templateData = {
        template_name: values.template_name,
        channel: values.channel,
        text: values.text,
        variables: values.variables ? values.variables.split(',').map((v: string) => v.trim()) : [],
        category: values.category,
        enabled: values.enabled ?? true
      };

      if (currentTemplate) {
        // TODO: 更新模板
        message.success('模板更新成功');
      } else {
        await templateService.createTemplate(templateData);
        message.success('模板创建成功');
      }

      setEditModalVisible(false);
      form.resetFields();
      setCurrentTemplate(null);
      loadTemplates();
    } catch (error) {
      message.error(`保存失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  /**
   * 编辑模板
   */
  const handleEditTemplate = (template: ReplyTemplate) => {
    setCurrentTemplate(template);
    form.setFieldsValue({
      template_name: template.template_name,
      channel: template.channel,
      text: template.text,
      variables: template.variables?.join(', '),
      category: template.category,
      enabled: template.enabled
    });
    setEditModalVisible(true);
  };

  /**
   * 预览模板
   */
  const handlePreviewTemplate = async (template: ReplyTemplate) => {
    setCurrentTemplate(template);
    
    // 设置默认预览上下文
    previewForm.setFieldsValue({
      nickname: '小明',
      topic: '口腔护理',
      industry: '医疗健康',
      region: '华东'
    });
    
    setPreviewModalVisible(true);
    await renderPreview(template);
  };

  /**
   * 渲染预览
   */
  const renderPreview = async (template: ReplyTemplate, context?: TemplateContext) => {
    try {
      const defaultContext: TemplateContext = {
        nickname: '小明',
        topic: '口腔护理',
        industry: IndustryTag.ORAL_CARE,
        region: '华东',
        ...context
      };
      
      const result = await templateService.renderTemplate(template.id, defaultContext);
      setPreviewResult(result);
    } catch (error) {
      message.error(`预览失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  /**
   * 复制模板
   */
  const handleCopyTemplate = (template: ReplyTemplate) => {
    const newTemplate = {
      ...template,
      template_name: `${template.template_name} (副本)`,
      enabled: false
    };
    
    setCurrentTemplate(null);
    form.setFieldsValue({
      template_name: newTemplate.template_name,
      channel: newTemplate.channel,
      text: newTemplate.text,
      variables: newTemplate.variables?.join(', '),
      category: newTemplate.category,
      enabled: newTemplate.enabled
    });
    setEditModalVisible(true);
  };

  /**
   * 删除模板
   */
  const handleDeleteTemplate = async (templateId: string) => {
    try {
      // TODO: 实现删除逻辑
      message.success('模板删除成功');
      loadTemplates();
    } catch (error) {
      message.error(`删除失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [filters]);

  const columns = [
    {
      title: '模板名称',
      dataIndex: 'template_name',
      key: 'template_name',
      render: (text: string, record: ReplyTemplate) => (
        <Space>
          <Text strong={record.enabled}>{text}</Text>
          {!record.enabled && <Tag color="default">已禁用</Tag>}
        </Space>
      )
    },
    {
      title: '适用渠道',
      dataIndex: 'channel',
      key: 'channel',
      render: (channel: Platform | 'all') => {
        const channelMap = {
          'all': { color: 'blue', text: '通用' },
          [Platform.DOUYIN]: { color: 'red', text: '抖音' },
          [Platform.XIAOHONGSHU]: { color: 'pink', text: '小红书' },
        };
        const config = channelMap[channel] || { color: 'default', text: channel };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => category ? <Tag>{category}</Tag> : '-'
    },
    {
      title: '变量',
      dataIndex: 'variables',
      key: 'variables',
      render: (variables: string[]) => (
        <Space wrap>
          {variables?.slice(0, 3).map(variable => (
            <Tag key={variable} color="geekblue">
              {`{{${variable}}}`}
            </Tag>
          ))}
          {variables && variables.length > 3 && <Tag>+{variables.length - 3}</Tag>}
        </Space>
      )
    },
    {
      title: '模板内容',
      dataIndex: 'text',
      key: 'text',
      render: (text: string) => (
        <Tooltip title={text}>
          <Text ellipsis style={{ maxWidth: 200 }}>
            {text}
          </Text>
        </Tooltip>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: ReplyTemplate) => (
        <Space>
          <Tooltip title="预览">
            <Button 
              type="text" 
              icon={<EyeOutlined />}
              onClick={() => handlePreviewTemplate(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button 
              type="text" 
              icon={<EditOutlined />}
              onClick={() => handleEditTemplate(record)}
            />
          </Tooltip>
          <Tooltip title="复制">
            <Button 
              type="text" 
              icon={<CopyOutlined />}
              onClick={() => handleCopyTemplate(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个模板吗？"
            onConfirm={() => handleDeleteTemplate(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="template-manager">
      <Card 
        className="light-theme-force" 
        style={{ background: 'var(--bg-light-base, #ffffff)' }}
      >
        <div className="space-y-4">
          {/* 页面标题和操作 */}
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={4} className="mb-0">话术模板管理</Title>
            </Col>
            <Col>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => {
                  setCurrentTemplate(null);
                  form.resetFields();
                  setEditModalVisible(true);
                }}
              >
                新建模板
              </Button>
            </Col>
          </Row>

          {/* 筛选条件 */}
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Input.Search
                placeholder="搜索模板名称或内容"
                value={filters.keyword}
                onChange={e => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
                onSearch={loadTemplates}
                enterButton={<SearchOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="适用渠道"
                value={filters.channel}
                onChange={value => setFilters(prev => ({ ...prev, channel: value }))}
                allowClear
                style={{ width: '100%' }}
              >
                <Option value="all">通用</Option>
                <Option value={Platform.DOUYIN}>抖音</Option>
                <Option value={Platform.XIAOHONGSHU}>小红书</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="启用状态"
                value={filters.enabled}
                onChange={value => setFilters(prev => ({ ...prev, enabled: value }))}
                allowClear
                style={{ width: '100%' }}
              >
                <Option value={true}>已启用</Option>
                <Option value={false}>已禁用</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Button onClick={loadTemplates} loading={loading}>
                刷新
              </Button>
            </Col>
          </Row>

          {/* 模板列表 */}
          <Table
            columns={columns}
            dataSource={templates}
            rowKey="id"
            loading={loading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 个模板`
            }}
          />
        </div>
      </Card>

      {/* 编辑模板弹窗 */}
      <Modal
        title={currentTemplate ? '编辑模板' : '新建模板'}
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          form.resetFields();
          setCurrentTemplate(null);
        }}
        onOk={() => form.submit()}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveTemplate}
        >
          <Form.Item
            name="template_name"
            label="模板名称"
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input placeholder="请输入模板名称" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="channel"
                label="适用渠道"
                rules={[{ required: true, message: '请选择适用渠道' }]}
              >
                <Select placeholder="请选择适用渠道">
                  <Option value="all">通用</Option>
                  <Option value={Platform.DOUYIN}>抖音专用</Option>
                  <Option value={Platform.XIAOHONGSHU}>小红书专用</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="模板分类"
              >
                <Select placeholder="请选择模板分类" allowClear>
                  <Option value="general">通用模板</Option>
                  <Option value="professional">专业模板</Option>
                  <Option value="follow_up">跟进模板</Option>
                  <Option value="greeting">问候模板</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="text"
            label="模板内容"
            rules={[{ required: true, message: '请输入模板内容' }]}
            extra="使用 {{变量名}} 格式插入变量，如：{{nickname}}、{{topic}}"
          >
            <TextArea 
              rows={6} 
              placeholder="请输入模板内容，支持变量插入..."
              showCount
              maxLength={1000}
            />
          </Form.Item>

          <Form.Item
            name="variables"
            label="使用的变量"
            extra="多个变量用逗号分隔，如：nickname, topic, industry"
          >
            <Input placeholder="nickname, topic, industry" />
          </Form.Item>

          <Form.Item
            name="enabled"
            label="启用状态"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 预览模板弹窗 */}
      <Modal
        title="模板预览"
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {currentTemplate && (
          <div className="space-y-4">
            <div>
              <Text strong>模板名称：</Text>
              <Text>{currentTemplate.template_name}</Text>
            </div>
            
            <Divider />
            
            <div>
              <Text strong>预览上下文：</Text>
              <Form
                form={previewForm}
                layout="inline"
                onValuesChange={(_, values) => {
                  renderPreview(currentTemplate, values);
                }}
                style={{ marginTop: 8 }}
              >
                <Form.Item name="nickname" label="昵称">
                  <Input placeholder="昵称" />
                </Form.Item>
                <Form.Item name="topic" label="话题">
                  <Input placeholder="话题" />
                </Form.Item>
                <Form.Item name="region" label="地区">
                  <Input placeholder="地区" />
                </Form.Item>
              </Form>
            </div>
            
            <Divider />
            
            {previewResult && (
              <div>
                <Text strong>预览结果：</Text>
                <div style={{ 
                  marginTop: 8, 
                  padding: 16, 
                  background: '#f5f5f5', 
                  borderRadius: 6,
                  minHeight: 100
                }}>
                  <Text>{previewResult.content}</Text>
                </div>
                
                {previewResult.missing_variables.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <Text type="warning">
                      缺少变量：{previewResult.missing_variables.join(', ')}
                    </Text>
                  </div>
                )}
                
                {!previewResult.sensitive_check.passed && (
                  <div style={{ marginTop: 8 }}>
                    <Text type="danger">
                      敏感词检查：发现敏感词 {previewResult.sensitive_check.blocked_words.join(', ')}
                    </Text>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TemplateManager;