// src/components/precise-acquisition/TemplateManagementSystem.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 模板管理系统界面
 * 
 * 基于TemplateManagementService，提供完整的模板管理功能
 * 包括模板的创建、编辑、分类和应用
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Tag, 
  Drawer, 
  Tree, 
  notification,
  Popconfirm,
  Badge,
  Tooltip,
  Typography,
  Row,
  Col,
  Statistic,
  Empty
} from 'antd';
import { 
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  EyeOutlined,
  FolderOutlined,
  TagOutlined,
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

// 类型和服务导入
import { ProspectingTemplateManagementService } from '../../modules/precise-acquisition/template-management/services/prospecting-template-service';
import { Platform, TaskType } from '../../constants/precise-acquisition-enums';

const { Option } = Select;
const { TextArea } = Input;
const { Text, Paragraph } = Typography;
const { TreeNode } = Tree;

// 使用 ReplyTemplate 从共享类型
import { ReplyTemplate } from '../../modules/precise-acquisition/shared/types/core';

// 表单值类型定义
interface CreateTemplateFormValues {
  template_name: string;
  text: string;
  category?: string;
  channel: Platform | 'all';
  variables?: string[];
}

interface UpdateTemplateFormValues {
  template_name?: string;
  text?: string;
  content?: string;  // 保留用于显示
  category?: string;
  channel?: Platform | 'all';
  platform?: Platform;
  task_type?: TaskType;
  tags?: string[];
  variables?: string[];
  enabled?: boolean;
}

interface CreateCategoryFormValues {
  name: string;
  description?: string;
  parent_id?: string;
}

interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  parent_id?: string;
  children?: TemplateCategory[];
  template_count?: number; // 改为可选
}

interface TemplateStats {
  total_templates: number;
  active_templates: number;
  categories_count: number;
  total_usage: number;
  average_success_rate: number;
}

export const TemplateManagementSystem: React.FC = () => {
  // 状态管理
  const [templates, setTemplates] = useState<ReplyTemplate[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [stats, setStats] = useState<TemplateStats>({
    total_templates: 0,
    active_templates: 0,
    categories_count: 0,
    total_usage: 0,
    average_success_rate: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReplyTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTemplateDetail, setShowTemplateDetail] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReplyTemplate | null>(null);
  const [searchText, setSearchText] = useState('');


  // 表单实例
  const [templateForm] = Form.useForm();
  const [categoryForm] = Form.useForm();

  // 服务实例
  const templateService = new ProspectingTemplateManagementService();

  // 加载模板数据
  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const result = await templateService.getTemplates({
        category: selectedCategory || undefined,
        keyword: searchText || undefined
      });
      setTemplates(result);
      
      // 计算统计数据
      const newStats: TemplateStats = {
        total_templates: result.length,
        active_templates: result.filter(t => t.enabled).length,
        categories_count: categories.length,
        total_usage: 0, // ReplyTemplate 没有 usage_count 字段
        average_success_rate: 0 // ReplyTemplate 没有 success_rate 字段
      };
      setStats(newStats);
    } catch (error) {
      console.error('Failed to load templates:', error);
      notification.error({
        message: '加载模板失败',
        description: error instanceof Error ? error.message : '未知错误'
      });
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchText, categories.length]);

  // 加载分类数据
  const loadCategories = useCallback(async () => {
    try {
      const result = await templateService.getCategories();
      setCategories(result);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  // 初始化加载
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // 创建模板
  const handleCreateTemplate = async (values: CreateTemplateFormValues) => {
    try {
      await templateService.createTemplate({
        template_name: values.template_name,
        text: values.text,
        category: values.category,
        channel: values.channel,
        variables: values.variables || [],
        enabled: true
      });

      notification.success({
        message: '模板创建成功',
        description: `模板 "${values.template_name}" 已创建`
      });
      
      setShowTemplateModal(false);
      templateForm.resetFields();
      loadTemplates();
    } catch (error) {
      notification.error({
        message: '模板创建失败',
        description: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  // 更新模板
  const handleUpdateTemplate = async (values: UpdateTemplateFormValues) => {
    if (!editingTemplate) return;

    try {
      await templateService.updateTemplate(editingTemplate.id, {
        template_name: values.template_name,
        text: values.text || values.content,
        category: values.category,
        channel: values.platform || values.channel,
        variables: values.tags || values.variables,
        enabled: values.enabled
      });

      notification.success({
        message: '模板更新成功',
        description: `模板 "${values.template_name || values.content}" 已更新`
      });
      
      setShowTemplateModal(false);
      setEditingTemplate(null);
      templateForm.resetFields();
      loadTemplates();
    } catch (error) {
      notification.error({
        message: '模板更新失败',
        description: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  // 删除模板
  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await templateService.deleteTemplate(templateId);
      notification.success({
        message: '模板删除成功'
      });
      loadTemplates();
    } catch (error) {
      notification.error({
        message: '模板删除失败',
        description: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  // 复制模板
  const handleDuplicateTemplate = async (template: ReplyTemplate) => {
    try {
      await templateService.createTemplate({
        template_name: `${template.template_name} (副本)`,
        text: template.text,
        category: template.category,
        channel: template.channel,
        variables: template.variables || [],
        enabled: template.enabled
      });

      notification.success({
        message: '模板复制成功'
      });
      loadTemplates();
    } catch (error) {
      notification.error({
        message: '模板复制失败',
        description: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  // 创建分类
  const handleCreateCategory = async (values: CreateCategoryFormValues) => {
    try {
      await templateService.createCategory({
        name: values.name,
        description: values.description,
        parent_id: values.parent_id
      });

      notification.success({
        message: '分类创建成功',
        description: `分类 "${values.name}" 已创建`
      });
      
      setShowCategoryModal(false);
      categoryForm.resetFields();
      loadCategories();
    } catch (error) {
      notification.error({
        message: '分类创建失败',
        description: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  // 编辑模板
  const handleEditTemplate = (template: ReplyTemplate) => {
    setEditingTemplate(template);
    templateForm.setFieldsValue({
      template_name: template.template_name,
      text: template.text,
      category: template.category,
      channel: template.channel,
      variables: template.variables
    });
    setShowTemplateModal(true);
  };

  // 获取平台颜色
  const getPlatformColor = (platform: Platform): string => {
    const colorMap: Record<Platform, string> = {
      [Platform.XIAOHONGSHU]: 'red',
      [Platform.DOUYIN]: 'blue',
      [Platform.OCEANENGINE]: 'purple',
      [Platform.PUBLIC]: 'green'
    };
    return colorMap[platform] || 'default';
  };

  // 获取任务类型颜色
  const getTaskTypeColor = (taskType: TaskType): string => {
    const colorMap: Record<TaskType, string> = {
      [TaskType.FOLLOW]: 'green',
      [TaskType.LIKE]: 'orange',
      [TaskType.COMMENT]: 'purple',
      [TaskType.REPLY]: 'cyan',
      [TaskType.SHARE]: 'blue',
      [TaskType.VIEW]: 'gray'
    };
    return colorMap[taskType] || 'default';
  };

  // 表格列定义
  const columns = [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name: string, record: ReplyTemplate) => (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-xs text-gray-500">ID: {record.id.slice(-8)}</div>
        </div>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => <Tag icon={<FolderOutlined />}>{category}</Tag>
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: Platform) => <Tag color={getPlatformColor(platform)}>{platform}</Tag>
    },
    {
      title: '任务类型',
      dataIndex: 'task_type',
      key: 'task_type',
      render: (taskType: TaskType) => <Tag color={getTaskTypeColor(taskType)}>{taskType}</Tag>
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <div>
          {tags.slice(0, 2).map(tag => (
            <Tag key={tag} icon={<TagOutlined />}>{tag}</Tag>
          ))}
          {tags.length > 2 && <Tag>+{tags.length - 2}</Tag>}
        </div>
      )
    },
    {
      title: '使用次数',
      dataIndex: 'usage_count',
      key: 'usage_count',
      render: (count: number) => <Badge count={count} showZero />
    },
    {
      title: '成功率',
      dataIndex: 'success_rate',
      key: 'success_rate',
      render: (rate: number) => (
        <span className={rate >= 80 ? 'text-green-600' : rate >= 60 ? 'text-orange-600' : 'text-red-600'}>
          {rate}%
        </span>
      )
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: Date) => (
        <span className="text-xs text-gray-500">
          {dayjs(date).format('MM-DD HH:mm')}
        </span>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record: ReplyTemplate) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedTemplate(record);
                setShowTemplateDetail(true);
              }}
            />
          </Tooltip>
          
          <Tooltip title="编辑模板">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditTemplate(record)}
            />
          </Tooltip>
          
          <Tooltip title="复制模板">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleDuplicateTemplate(record)}
            />
          </Tooltip>
          
          <Popconfirm
            title="确定要删除这个模板吗？"
            onConfirm={() => handleDeleteTemplate(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除模板">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 分类树渲染
  const renderCategoryTree = (categoryList: TemplateCategory[]) => {
    return categoryList.map(category => (
      <TreeNode
        key={category.id}
        title={
          <div className="flex justify-between items-center">
            <span>{category.name}</span>
            <Badge count={category.template_count} size="small" />
          </div>
        }
        icon={<FolderOutlined />}
      >
        {category.children && renderCategoryTree(category.children)}
      </TreeNode>
    ));
  };

  return (
    <div className="light-theme-force" style={{ background: 'var(--bg-light-base)', padding: '24px' }}>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">模板管理系统</h2>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingTemplate(null);
                templateForm.resetFields();
                setShowTemplateModal(true);
              }}
            >
              创建模板
            </Button>
            <Button
              icon={<FolderOutlined />}
              onClick={() => setShowCategoryModal(true)}
            >
              创建分类
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadTemplates}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        </div>

        {/* 统计卡片 */}
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card size="small">
              <Statistic title="总模板数" value={stats.total_templates} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic 
                title="启用模板" 
                value={stats.active_templates}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="总使用次数" value={stats.total_usage} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic 
                title="平均成功率" 
                value={stats.average_success_rate} 
                suffix="%" 
                valueStyle={{ 
                  color: stats.average_success_rate >= 80 ? '#52c41a' : '#ff4d4f' 
                }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      <Row gutter={16}>
        <Col span={6}>
          <Card title="分类管理" size="small" className="mb-4">
            <div className="mb-4">
              <Input
                placeholder="搜索分类..."
                prefix={<SearchOutlined />}
                size="small"
              />
            </div>
            
            {categories.length > 0 ? (
              <Tree
                showIcon
                showLine
                onSelect={(selectedKeys) => {
                  setSelectedCategory(selectedKeys[0] as string || null);
                }}
              >
                <TreeNode key="all" title="全部分类" icon={<FolderOutlined />}>
                  {renderCategoryTree(categories)}
                </TreeNode>
              </Tree>
            ) : (
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无分类"
                className="text-center"
              />
            )}
          </Card>
        </Col>

        <Col span={18}>
          <Card>
            <div className="mb-4 flex justify-between items-center">
              <Input
                placeholder="搜索模板..."
                prefix={<SearchOutlined />}
                style={{ width: 300 }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
              
              <Space>
                <Select
                  placeholder="筛选平台"
                  style={{ width: 120 }}
                  allowClear
                >
                  <Option value={Platform.XIAOHONGSHU}>小红书</Option>
                  <Option value={Platform.DOUYIN}>抖音</Option>
                </Select>
                
                <Select
                  placeholder="筛选类型"
                  style={{ width: 120 }}
                  allowClear
                >
                  <Option value={TaskType.FOLLOW}>关注</Option>
                  <Option value={TaskType.LIKE}>点赞</Option>
                  <Option value={TaskType.COMMENT}>评论</Option>
                  <Option value={TaskType.REPLY}>回复</Option>
                </Select>
              </Space>
            </div>

            <Table
              columns={columns}
              dataSource={templates}
              rowKey="id"
              loading={loading}
              size="small"
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 个模板`
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* 创建/编辑模板模态框 */}
      <Modal
        title={editingTemplate ? '编辑模板' : '创建模板'}
        open={showTemplateModal}
        onCancel={() => {
          setShowTemplateModal(false);
          setEditingTemplate(null);
          templateForm.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={templateForm}
          layout="vertical"
          onFinish={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="模板名称"
                rules={[{ required: true, message: '请输入模板名称' }]}
              >
                <Input placeholder="输入模板名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="分类"
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <Select placeholder="选择分类">
                  {categories.map(category => (
                    <Option key={category.id} value={category.name}>
                      {category.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="platform"
                label="平台"
                rules={[{ required: true, message: '请选择平台' }]}
              >
                <Select placeholder="选择平台">
                  <Option value={Platform.XIAOHONGSHU}>小红书</Option>
                  <Option value={Platform.DOUYIN}>抖音</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="task_type"
                label="任务类型"
                rules={[{ required: true, message: '请选择任务类型' }]}
              >
                <Select placeholder="选择任务类型">
                  <Option value={TaskType.FOLLOW}>关注</Option>
                  <Option value={TaskType.LIKE}>点赞</Option>
                  <Option value={TaskType.COMMENT}>评论</Option>
                  <Option value={TaskType.REPLY}>回复</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="tags" label="标签">
            <Select
              mode="tags"
              placeholder="添加标签（回车确认）"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="content"
            label="模板内容"
            rules={[{ required: true, message: '请输入模板内容' }]}
          >
            <TextArea
              rows={8}
              placeholder="输入模板内容，支持变量替换：{用户名}、{时间}等"
              showCount
              maxLength={1000}
            />
          </Form.Item>

          <Form.Item className="mb-0 flex justify-end">
            <Space>
              <Button onClick={() => setShowTemplateModal(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingTemplate ? '更新模板' : '创建模板'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 创建分类模态框 */}
      <Modal
        title="创建分类"
        open={showCategoryModal}
        onCancel={() => {
          setShowCategoryModal(false);
          categoryForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={categoryForm}
          layout="vertical"
          onFinish={handleCreateCategory}
        >
          <Form.Item
            name="name"
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="输入分类名称" />
          </Form.Item>

          <Form.Item name="description" label="分类描述">
            <TextArea rows={3} placeholder="输入分类描述（可选）" />
          </Form.Item>

          <Form.Item name="parent_id" label="父分类">
            <Select placeholder="选择父分类（可选）" allowClear>
              {categories.map(category => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item className="mb-0 flex justify-end">
            <Space>
              <Button onClick={() => setShowCategoryModal(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                创建分类
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 模板详情抽屉 */}
      <Drawer
        title="模板详情"
        placement="right"
        width={600}
        open={showTemplateDetail}
        onClose={() => setShowTemplateDetail(false)}
      >
        {selectedTemplate && (
          <div className="space-y-6">
            <Card title="基本信息" size="small">
              <div className="space-y-3">
                <div>
                  <Text strong>模板名称：</Text>
                  <span>{selectedTemplate.template_name}</span>
                </div>
                <div>
                  <Text strong>分类：</Text>
                  <Tag icon={<FolderOutlined />}>{selectedTemplate.category}</Tag>
                </div>
                <div>
                  <Text strong>平台：</Text>
                  <Tag color={getPlatformColor(selectedTemplate.platform)}>
                    {selectedTemplate.platform}
                  </Tag>
                </div>
                <div>
                  <Text strong>任务类型：</Text>
                  <Tag color={getTaskTypeColor(selectedTemplate.task_type)}>
                    {selectedTemplate.task_type}
                  </Tag>
                </div>
                <div>
                  <Text strong>标签：</Text>
                  <div className="mt-1">
                    {selectedTemplate.tags.map(tag => (
                      <Tag key={tag} icon={<TagOutlined />}>{tag}</Tag>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card title="使用统计" size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic title="使用次数" value={selectedTemplate.usage_count} />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title="成功率" 
                    value={selectedTemplate.success_rate} 
                    suffix="%" 
                    valueStyle={{ 
                      color: selectedTemplate.success_rate >= 80 ? '#52c41a' : '#ff4d4f' 
                    }}
                  />
                </Col>
              </Row>
            </Card>

            <Card title="模板内容" size="small">
              <div className="bg-gray-50 p-4 rounded">
                <Paragraph copyable>{selectedTemplate.content}</Paragraph>
              </div>
            </Card>

            <Card title="创建信息" size="small">
              <div className="space-y-2">
                <div>
                  <Text strong>创建者：</Text>
                  <span>{selectedTemplate.created_by}</span>
                </div>
                <div>
                  <Text strong>创建时间：</Text>
                  <span>{dayjs(selectedTemplate.created_at).format('YYYY-MM-DD HH:mm:ss')}</span>
                </div>
                <div>
                  <Text strong>更新时间：</Text>
                  <span>{dayjs(selectedTemplate.updated_at).format('YYYY-MM-DD HH:mm:ss')}</span>
                </div>
              </div>
            </Card>

            <div className="flex justify-end space-x-2">
              <Button onClick={() => handleEditTemplate(selectedTemplate)}>
                编辑模板
              </Button>
              <Button type="primary" onClick={() => handleDuplicateTemplate(selectedTemplate)}>
                复制模板
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default TemplateManagementSystem;