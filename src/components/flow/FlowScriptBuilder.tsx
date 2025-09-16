import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Steps,
  Select,
  message,
  Tooltip,
  Modal,
  Input,
  List,
  Collapse,
} from 'antd';
import {
  PlayCircleOutlined,
  PlusOutlined,
  SaveOutlined,
  BranchesOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  HeartOutlined,
  MessageOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Step } = Steps;
const { Panel } = Collapse;

// 应用流程模板定义
interface FlowTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  steps: FlowStepTemplate[];
}

interface FlowStepTemplate {
  id: string;
  name: string;
  description: string;
  type: 'app_open' | 'navigation' | 'interaction' | 'condition' | 'wait';
  app?: string;
  action?: string;
  nextSteps?: string[]; // 可选的后续步骤ID列表
  xmlCondition?: string; // XML判断条件
  parameters?: Record<string, any>;
}

interface FlowBuilderStep {
  id: string;
  templateId: string;
  name: string;
  description: string;
  order: number;
  parameters: Record<string, any>;
  completed: boolean;
}

// 小红书流程模板
const XIAOHONGSHU_TEMPLATE: FlowTemplate = {
  id: 'xiaohongshu',
  name: '小红书自动化',
  description: '小红书应用相关自动化流程',
  icon: <HeartOutlined style={{ color: '#ff4757' }} />,
  color: '#ff4757',
  steps: [
    {
      id: 'xhs_open_app',
      name: '打开小红书APP',
      description: '启动小红书应用到首页',
      type: 'app_open',
      app: 'com.xingin.xhs',
      nextSteps: ['xhs_open_sidebar', 'xhs_search', 'xhs_browse_home']
    },
    {
      id: 'xhs_open_sidebar',
      name: '打开侧边栏',
      description: '点击左上角头像打开侧边栏菜单',
      type: 'navigation',
      action: 'click_sidebar',
      xmlCondition: 'resource-id="com.xingin.xhs:id/avatar"',
      nextSteps: ['xhs_find_friends', 'xhs_my_profile', 'xhs_settings']
    },
    {
      id: 'xhs_find_friends',
      name: '发现好友',
      description: '点击发现好友功能',
      type: 'interaction',
      action: 'click_find_friends',
      xmlCondition: 'text="发现好友"',
      nextSteps: ['xhs_import_contacts', 'xhs_search_friends']
    },
    {
      id: 'xhs_import_contacts',
      name: '导入通讯录',
      description: '导入手机通讯录联系人',
      type: 'interaction',
      action: 'import_contacts',
      nextSteps: ['xhs_follow_contacts']
    },
    {
      id: 'xhs_follow_contacts',
      name: '关注联系人',
      description: '批量关注导入的联系人',
      type: 'interaction',
      action: 'follow_contacts',
      nextSteps: []
    },
    {
      id: 'xhs_search',
      name: '搜索功能',
      description: '使用搜索功能查找内容',
      type: 'interaction',
      action: 'search',
      nextSteps: ['xhs_search_users', 'xhs_search_content']
    },
    {
      id: 'xhs_search_users',
      name: '搜索用户',
      description: '搜索特定用户',
      type: 'interaction',
      action: 'search_users',
      nextSteps: ['xhs_follow_user']
    },
    {
      id: 'xhs_follow_user',
      name: '关注用户',
      description: '关注搜索到的用户',
      type: 'interaction',
      action: 'follow_user',
      nextSteps: []
    },
    {
      id: 'xhs_browse_home',
      name: '浏览首页',
      description: '浏览首页推荐内容',
      type: 'interaction',
      action: 'browse_home',
      nextSteps: ['xhs_like_posts', 'xhs_comment_posts']
    },
    {
      id: 'xhs_like_posts',
      name: '点赞内容',
      description: '为感兴趣的内容点赞',
      type: 'interaction',
      action: 'like_posts',
      nextSteps: []
    },
    {
      id: 'xhs_comment_posts',
      name: '评论互动',
      description: '对内容进行评论互动',
      type: 'interaction',
      action: 'comment_posts',
      nextSteps: []
    }
  ]
};

// 其他应用模板
const APP_TEMPLATES: FlowTemplate[] = [
  XIAOHONGSHU_TEMPLATE,
  {
    id: 'wechat',
    name: '微信自动化',
    description: '微信应用相关自动化流程',
    icon: <MessageOutlined style={{ color: '#07c160' }} />,
    color: '#07c160',
    steps: [
      {
        id: 'wechat_open_app',
        name: '打开微信APP',
        description: '启动微信应用',
        type: 'app_open',
        app: 'com.tencent.mm',
        nextSteps: ['wechat_contacts', 'wechat_moments']
      },
      {
        id: 'wechat_contacts',
        name: '通讯录',
        description: '打开通讯录页面',
        type: 'navigation',
        action: 'open_contacts',
        nextSteps: ['wechat_add_friend']
      },
      {
        id: 'wechat_add_friend',
        name: '添加好友',
        description: '添加新的微信好友',
        type: 'interaction',
        action: 'add_friend',
        nextSteps: []
      }
    ]
  }
];

/**
 * 流程化脚本构建器
 */
const FlowScriptBuilder: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<FlowTemplate | null>(null);
  const [currentFlow, setCurrentFlow] = useState<FlowBuilderStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [availableNextSteps, setAvailableNextSteps] = useState<FlowStepTemplate[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [flowName, setFlowName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  // 选择应用模板
  const handleSelectTemplate = (template: FlowTemplate) => {
    setSelectedTemplate(template);
    setCurrentFlow([]);
    setCurrentStepIndex(0);
    setAvailableNextSteps(template.steps.filter(step => 
      step.type === 'app_open' || step.id.includes('open_app')
    ));
    message.success(`已选择 ${template.name} 模板`);
  };

  // 添加流程步骤
  const handleAddStep = (stepTemplate: FlowStepTemplate) => {
    const newStep: FlowBuilderStep = {
      id: `${stepTemplate.id}_${Date.now()}`,
      templateId: stepTemplate.id,
      name: stepTemplate.name,
      description: stepTemplate.description,
      order: currentFlow.length,
      parameters: stepTemplate.parameters || {},
      completed: false
    };

    const updatedFlow = [...currentFlow, newStep];
    setCurrentFlow(updatedFlow);
    setCurrentStepIndex(updatedFlow.length - 1);

    // 更新可用的下一步选项
    if (stepTemplate.nextSteps && selectedTemplate) {
      const nextStepTemplates = selectedTemplate.steps.filter(step => 
        stepTemplate.nextSteps?.includes(step.id)
      );
      setAvailableNextSteps(nextStepTemplates);
    } else {
      setAvailableNextSteps([]);
    }

    message.success(`已添加步骤: ${stepTemplate.name}`);
  };

  // 删除步骤
  const handleRemoveStep = (stepIndex: number) => {
    const updatedFlow = currentFlow.filter((_, index) => index !== stepIndex);
    setCurrentFlow(updatedFlow);
    
    if (stepIndex <= currentStepIndex && currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }

    // 重新计算可用的下一步
    if (updatedFlow.length > 0 && selectedTemplate) {
      const lastStep = updatedFlow[updatedFlow.length - 1];
      const lastStepTemplate = selectedTemplate.steps.find(s => s.id === lastStep.templateId);
      if (lastStepTemplate?.nextSteps) {
        const nextStepTemplates = selectedTemplate.steps.filter(step => 
          lastStepTemplate.nextSteps?.includes(step.id)
        );
        setAvailableNextSteps(nextStepTemplates);
      }
    }

    message.success('步骤已删除');
  };

  // 执行流程
  const handleExecuteFlow = async () => {
    if (currentFlow.length === 0) {
      message.warning('请先添加流程步骤');
      return;
    }

    setIsExecuting(true);
    try {
      // 转换为脚本执行格式
      const scriptSteps = currentFlow.map(step => ({
        type: convertFlowStepToScriptType(step.templateId),
        name: `步骤 ${step.id}`,
        parameters: {
          app: getAppFromStepId(step.templateId),
          action: step.templateId,
          ...step.parameters
        }
      }));

      const result = await invoke('execute_automation_script', {
        deviceId: 'emulator-5554',
        steps: scriptSteps,
      });

      console.log('流程执行结果:', result);
      message.success('流程执行完成！查看执行监控了解详细情况');
    } catch (error) {
      console.error('流程执行失败:', error);
      message.error(`流程执行失败: ${error}`);
    } finally {
      setIsExecuting(false);
    }
  };

  // 保存流程
  const handleSaveFlow = () => {
    if (currentFlow.length === 0) {
      message.warning('没有可保存的流程');
      return;
    }
    setShowSaveModal(true);
  };

  const handleConfirmSave = () => {
    if (!flowName.trim()) {
      message.warning('请输入流程名称');
      return;
    }

    // 保存到本地存储
    const savedFlows = JSON.parse(localStorage.getItem('savedFlows') || '[]');
    const newFlow = {
      id: `flow_${Date.now()}`,
      name: flowName,
      template: selectedTemplate?.name,
      steps: currentFlow,
      createdAt: new Date().toISOString()
    };
    
    savedFlows.push(newFlow);
    localStorage.setItem('savedFlows', JSON.stringify(savedFlows));

    setShowSaveModal(false);
    setFlowName('');
    message.success(`流程 "${flowName}" 已保存`);
  };

  // 辅助函数
  const convertFlowStepToScriptType = (stepId: string) => {
    if (stepId.includes('open_app')) return 'open_app';
    if (stepId.includes('click') || stepId.includes('tap')) return 'tap';
    if (stepId.includes('search')) return 'input';
    return 'tap';
  };

  const getAppFromStepId = (stepId: string) => {
    if (stepId.includes('xhs')) return 'com.xingin.xhs';
    if (stepId.includes('wechat')) return 'com.tencent.mm';
    return '';
  };

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
            🎯 流程化脚本构建器
          </Title>
          <Paragraph type="secondary">
            选择应用模板，按步骤构建自动化流程，支持条件判断和智能导航
          </Paragraph>
        </div>

        <Row gutter={24}>
          {/* 左侧：模板选择和步骤构建 */}
          <Col span={16}>
            {/* 应用模板选择 */}
            <Card 
              title="1. 选择应用模板" 
              style={{ marginBottom: 16 }}
              headStyle={{ background: '#f6ffed' }}
            >
              <Row gutter={16}>
                {APP_TEMPLATES.map(template => (
                  <Col span={8} key={template.id}>
                    <Card
                      hoverable
                      size="small"
                      style={{
                        border: selectedTemplate?.id === template.id ? '2px solid #1890ff' : '1px solid #d9d9d9',
                        borderRadius: 8
                      }}
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>
                          {template.icon}
                        </div>
                        <Title level={5} style={{ margin: '8px 0 4px' }}>
                          {template.name}
                        </Title>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {template.description}
                        </Text>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>

            {/* 步骤构建区域 */}
            {selectedTemplate && (
              <Card 
                title="2. 构建流程步骤" 
                style={{ marginBottom: 16 }}
                headStyle={{ background: '#f0f9ff' }}
                extra={
                  <Space>
                    <Button 
                      type="primary" 
                      icon={<SaveOutlined />}
                      onClick={handleSaveFlow}
                      disabled={currentFlow.length === 0}
                    >
                      保存流程
                    </Button>
                    <Button 
                      type="primary" 
                      icon={<PlayCircleOutlined />}
                      onClick={handleExecuteFlow}
                      loading={isExecuting}
                      disabled={currentFlow.length === 0}
                      style={{ background: '#52c41a', borderColor: '#52c41a' }}
                    >
                      执行流程
                    </Button>
                  </Space>
                }
              >
                {/* 当前流程显示 */}
                {currentFlow.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <Title level={5}>当前流程：</Title>
                    <Steps
                      current={currentStepIndex}
                      size="small"
                      direction="vertical"
                      style={{ background: '#fafafa', padding: 16, borderRadius: 8 }}
                    >
                      {currentFlow.map((step, index) => {
                        let stepStatus: 'wait' | 'process' | 'finish' = 'wait';
                        if (step.completed) {
                          stepStatus = 'finish';
                        } else if (index === currentStepIndex) {
                          stepStatus = 'process';
                        }
                        
                        return (
                          <Step
                            key={step.id}
                            title={step.name}
                            description={step.description}
                            status={stepStatus}
                            icon={index < currentStepIndex ? <CheckCircleOutlined /> : undefined}
                          />
                        );
                      })}
                    </Steps>
                  </div>
                )}

                {/* 可选的下一步 */}
                {availableNextSteps.length > 0 && (
                  <div>
                    <Title level={5}>
                      {currentFlow.length === 0 ? '选择第一步：' : '选择下一步：'}
                    </Title>
                    <Row gutter={[16, 16]}>
                      {availableNextSteps.map(stepTemplate => (
                        <Col span={12} key={stepTemplate.id}>
                          <Card
                            hoverable
                            size="small"
                            style={{ height: '100%' }}
                            onClick={() => handleAddStep(stepTemplate)}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ 
                                width: 40, 
                                height: 40, 
                                background: '#e6f7ff', 
                                borderRadius: '50%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center' 
                              }}>
                                <PlusOutlined style={{ color: '#1890ff' }} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <Text strong>{stepTemplate.name}</Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {stepTemplate.description}
                                </Text>
                              </div>
                            </div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}

                {currentFlow.length > 0 && availableNextSteps.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 32, color: '#666' }}>
                    <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
                    <div>
                      <Text>流程构建完成！</Text>
                      <br />
                      <Text type="secondary">您可以保存这个流程或直接执行</Text>
                    </div>
                  </div>
                )}
              </Card>
            )}
          </Col>

          {/* 右侧：流程详情和控制 */}
          <Col span={8}>
            <Card 
              title="流程详情" 
              style={{ marginBottom: 16 }}
              headStyle={{ background: '#fff7e6' }}
            >
              {currentFlow.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: '#999' }}>
                  <BranchesOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                  <div>
                    <Text>请选择模板并开始构建流程</Text>
                  </div>
                </div>
              ) : (
                <List
                  dataSource={currentFlow}
                  renderItem={(step, index) => (
                    <List.Item
                      key={step.id}
                      actions={[
                        <Tooltip key="delete" title="删除步骤">
                          <Button
                            type="text"
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoveStep(index)}
                            danger
                          />
                        </Tooltip>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <div style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: index === currentStepIndex ? '#1890ff' : '#d9d9d9',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 'bold'
                          }}>
                            {index + 1}
                          </div>
                        }
                        title={<Text strong style={{ fontSize: 13 }}>{step.name}</Text>}
                        description={
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {step.description}
                          </Text>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>

            {/* 已保存的流程 */}
            <Card title="已保存的流程" size="small">
              <div style={{ maxHeight: 200, overflow: 'auto' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  保存的流程将在这里显示...
                </Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 保存流程对话框 */}
        <Modal
          title="保存流程"
          open={showSaveModal}
          onOk={handleConfirmSave}
          onCancel={() => setShowSaveModal(false)}
          okText="保存"
          cancelText="取消"
        >
          <div style={{ marginBottom: 16 }}>
            <Text>流程名称：</Text>
            <Input
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              placeholder="请输入流程名称"
              style={{ marginTop: 8 }}
            />
          </div>
          <div>
            <Text type="secondary">
              当前流程包含 {currentFlow.length} 个步骤，使用 {selectedTemplate?.name} 模板
            </Text>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default FlowScriptBuilder;

