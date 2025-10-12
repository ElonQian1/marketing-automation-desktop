// src/modules/universal-ui/ui/StepCard.tsx
// module: universal-ui | layer: ui | role: component
// summary: 策略展示和切换卡片组件，支持手动/智能策略切换

import React, { useState, useCallback } from 'react';
import { 
  Card, 
  Switch, 
  Button, 
  Space, 
  Typography, 
  Input, 
  Form,
  Alert,
  Spin,
  Divider,
  Tag,
  Tooltip,
  Row,
  Col
} from 'antd';
import {
  EditOutlined,
  ReloadOutlined,
  ImportOutlined,
  InfoCircleOutlined,
  CodeOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useStepStrategy, useStrategySwitch } from '../hooks/useStepStrategy';
import { SmartVariantBadge } from './partials/SmartVariantBadge';
import type { ManualStrategy } from '../domain/public/selector/StrategyContracts';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

/**
 * 步骤卡片属性接口
 */
export interface StepCardProps {
  /** 卡片标题 */
  title?: string;
  /** 是否显示切换开关 */
  showModeSwitch?: boolean;
  /** 是否可编辑手动策略 */
  editable?: boolean;
  /** 自定义样式类名 */
  className?: string;
  /** 卡片大小 */
  size?: 'small' | 'default';
  /** 额外操作按钮 */
  extra?: React.ReactNode;
}

/**
 * 策略步骤卡片组件
 * 展示当前策略信息并支持手动/智能策略切换
 */
export const StepCard: React.FC<StepCardProps> = ({
  title = "匹配策略",
  showModeSwitch = true,
  editable = true,
  className = '',
  size = 'default',
  extra
}) => {
  const { state, details, utils } = useStepStrategy();
  const { 
    mode, 
    canSwitch, 
    isLoading,
    switchToManual,
    switchToSmart,
    returnToSmart,
    refresh,
    adopt
  } = useStrategySwitch();

  // 编辑状态
  const [isEditing, setIsEditing] = useState(false);
  const [editForm] = Form.useForm();

  // 处理模式切换
  const handleModeSwitch = useCallback(async (checked: boolean) => {
    if (!canSwitch) return;
    
    if (checked) {
      // 切换到智能模式
      await switchToSmart();
    } else {
      // 切换到手动模式
      switchToManual();
    }
  }, [canSwitch, switchToSmart, switchToManual]);

  // 处理返回智能策略
  const handleReturnToSmart = useCallback(async () => {
    await returnToSmart();
  }, [returnToSmart]);

  // 处理刷新智能策略
  const handleRefreshSmart = useCallback(async () => {
    await refresh();
  }, [refresh]);

  // 处理采用为手动
  const handleAdoptAsManual = useCallback(() => {
    adopt();
  }, [adopt]);

  // 处理手动策略编辑
  const handleEditManual = useCallback(() => {
    if (state.current?.kind === 'manual') {
      editForm.setFieldsValue({
        name: state.current.name,
        xpath: state.current.selector.xpath || '',
        css: state.current.selector.css || '',
        notes: state.current.notes || ''
      });
      setIsEditing(true);
    }
  }, [state.current, editForm]);

  // 保存手动策略编辑
  const handleSaveEdit = useCallback(async () => {
    try {
      const values = await editForm.validateFields();
      
      const updatedStrategy: ManualStrategy = {
        kind: 'manual',
        name: values.name,
        type: 'xpath-direct',
        selector: {
          xpath: values.xpath,
          css: values.css
        },
        notes: values.notes,
        createdAt: Date.now()
      };

      // TODO: 调用更新方法
      console.log('保存手动策略:', updatedStrategy);
      setIsEditing(false);
    } catch (error) {
      console.error('保存编辑失败:', error);
    }
  }, [editForm]);

  // 取消编辑
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    editForm.resetFields();
  }, [editForm]);

  // 如果没有元素，显示空状态
  if (!state.element) {
    return (
      <Card 
        title={title}
        className={`light-theme-force ${className}`}
        size={size}
        extra={extra}
      >
        <div style={{ 
          textAlign: 'center', 
          padding: '24px 0',
          color: 'var(--text-3, #94a3b8)'
        }}>
          <InfoCircleOutlined style={{ fontSize: 24, marginBottom: 8 }} />
          <div>请先选择一个元素</div>
        </div>
      </Card>
    );
  }

  // 渲染错误状态
  if (state.error) {
    return (
      <Card 
        title={title}
        className={`light-theme-force ${className}`}
        size={size}
        extra={extra}
      >
        <Alert
          message="策略生成失败"
          description={state.error}
          type="error"
          icon={<ExclamationCircleOutlined />}
          action={
            <Button size="small" onClick={handleRefreshSmart}>
              重试
            </Button>
          }
        />
      </Card>
    );
  }

  // 渲染加载状态
  if (isLoading && !state.current) {
    return (
      <Card 
        title={title}
        className={`light-theme-force ${className}`}
        size={size}
        extra={extra}
      >
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 12, color: 'var(--text-2, #64748b)' }}>
            正在生成策略...
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Text strong>{title}</Text>
              {utils.hasStrategy && (
                <Tag color={mode === 'smart' ? 'blue' : 'green'} icon={
                  mode === 'smart' ? <ThunderboltOutlined /> : <EditOutlined />
                }>
                  {mode === 'smart' ? '智能策略' : '手动策略'}
                </Tag>
              )}
            </Space>
          </Col>
          {showModeSwitch && (
            <Col>
              <Space>
                <Text style={{ fontSize: 12, color: 'var(--text-3, #94a3b8)' }}>
                  手动
                </Text>
                <Switch
                  checked={mode === 'smart'}
                  onChange={handleModeSwitch}
                  disabled={!canSwitch}
                  loading={isLoading}
                  size={size === 'small' ? 'small' : 'default'}
                />
                <Text style={{ fontSize: 12, color: 'var(--text-3, #94a3b8)' }}>
                  智能
                </Text>
              </Space>
            </Col>
          )}
        </Row>
      }
      className={`light-theme-force ${className}`}
      size={size}
      extra={extra}
      loading={isLoading && !!state.current}
    >
      {/* 策略内容区域 */}
      {state.current && details && (
        <div>
          {/* 策略基本信息 */}
          <div style={{ marginBottom: 16 }}>
            <Row gutter={[16, 8]}>
              <Col span={24}>
                <Text strong style={{ fontSize: 14 }}>
                  {details.typeLabel}
                </Text>
                {details.confidence !== undefined && (
                  <Tag 
                    color={getConfidenceColor(details.confidence)}
                    style={{ marginLeft: 8 }}
                  >
                    置信度: {(details.confidence * 100).toFixed(1)}%
                  </Tag>
                )}
              </Col>
              <Col span={24}>
                <Paragraph 
                  style={{ 
                    margin: 0, 
                    color: 'var(--text-2, #64748b)',
                    fontSize: 13
                  }}
                >
                  {details.description}
                </Paragraph>
              </Col>
            </Row>
          </div>

          {/* 智能策略特有信息 */}
          {mode === 'smart' && state.current.kind === 'smart' && (
            <div style={{ marginBottom: 16 }}>
              <SmartVariantBadge 
                strategy={state.current}
                showParams={true}
                showConfidence={false}
                size={size}
              />
            </div>
          )}

          <Divider style={{ margin: '12px 0' }} />

          {/* 选择器信息 */}
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ fontSize: 13, marginBottom: 8, display: 'block' }}>
              <CodeOutlined /> 选择器
            </Text>
            <div style={{ 
              background: 'var(--bg-2, #f8fafc)',
              border: '1px solid var(--border-2, #e2e8f0)',
              borderRadius: 6,
              padding: 12,
              fontSize: 12,
              fontFamily: 'monospace'
            }}>
              {details.selector.xpath && (
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">XPath:</Text><br />
                  <Text code style={{ fontSize: 11 }}>
                    {details.selector.xpath}
                  </Text>
                </div>
              )}
              {details.selector.css && (
                <div>
                  <Text type="secondary">CSS:</Text><br />
                  <Text code style={{ fontSize: 11 }}>
                    {details.selector.css}
                  </Text>
                </div>
              )}
              {!details.selector.xpath && !details.selector.css && (
                <Text type="secondary">无有效选择器</Text>
              )}
            </div>
          </div>

          {/* 操作按钮区域 */}
          <div>
            {mode === 'manual' ? (
              // 手动模式操作
              <Space wrap>
                {editable && (
                  <Button
                    type="default"
                    icon={<EditOutlined />}
                    size={size}
                    onClick={handleEditManual}
                  >
                    编辑
                  </Button>
                )}
                <Button
                  type="primary"
                  icon={<ThunderboltOutlined />}
                  size={size}
                  onClick={handleReturnToSmart}
                  disabled={!canSwitch}
                >
                  返回启用智能策略
                </Button>
              </Space>
            ) : (
              // 智能模式操作
              <Space wrap>
                <Button
                  type="default"
                  icon={<ReloadOutlined />}
                  size={size}
                  onClick={handleRefreshSmart}
                  disabled={!canSwitch}
                  loading={isLoading}
                >
                  刷新智能
                </Button>
                <Button
                  type="default"
                  icon={<ImportOutlined />}
                  size={size}
                  onClick={handleAdoptAsManual}
                  disabled={!canSwitch}
                >
                  采用为手动
                </Button>
              </Space>
            )}
          </div>

          {/* 编辑表单（模态） */}
          {isEditing && (
            <>
              <Divider />
              <Form
                form={editForm}
                layout="vertical"
                onFinish={handleSaveEdit}
              >
                <Form.Item
                  label="策略名称"
                  name="name"
                  rules={[{ required: true, message: '请输入策略名称' }]}
                >
                  <Input placeholder="输入策略名称" />
                </Form.Item>
                
                <Form.Item
                  label="XPath选择器"
                  name="xpath"
                >
                  <TextArea 
                    rows={3}
                    placeholder="输入XPath选择器"
                    style={{ fontFamily: 'monospace', fontSize: 12 }}
                  />
                </Form.Item>
                
                <Form.Item
                  label="CSS选择器"
                  name="css"
                >
                  <TextArea 
                    rows={2}
                    placeholder="输入CSS选择器"
                    style={{ fontFamily: 'monospace', fontSize: 12 }}
                  />
                </Form.Item>
                
                <Form.Item
                  label="备注说明"
                  name="notes"
                >
                  <TextArea 
                    rows={2}
                    placeholder="输入备注说明"
                  />
                </Form.Item>
                
                <Form.Item>
                  <Space>
                    <Button 
                      type="primary" 
                      htmlType="submit"
                      icon={<CheckCircleOutlined />}
                    >
                      保存
                    </Button>
                    <Button onClick={handleCancelEdit}>
                      取消
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </>
          )}
        </div>
      )}
    </Card>
  );
};

/**
 * 根据置信度获取标签颜色
 */
function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'success';
  if (confidence >= 0.6) return 'warning';
  return 'error';
}

export default StepCard;