// src/components/enhanced-step-card/EnhancedStepCard.tsx
// module: enhanced-step-card | layer: ui | role: 增强步骤卡片
// summary: 集成操作类型选择的步骤卡片组件

import React, { useState, useMemo, useCallback } from 'react';
import { 
  Card, 
  Space, 
  Button, 
  Tag, 
  Row, 
  Col, 
  Collapse, 
  Typography, 
  Divider,
  Tooltip
} from 'antd';
import { 
  PlayCircleOutlined, 
  SettingOutlined, 
  InfoCircleOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useStepCardStore } from '../../store/stepcards';
import type { StepCard } from '../../store/stepcards';
import { 
  ActionSelector, 
  ActionParamsPanel, 
  ActionPreview,
  validateActionParams,
  type ActionType
} from '../action-system';

const { Text } = Typography;

interface EnhancedStepCardProps {
  stepCard: StepCard;
  onExecute?: (stepCard: StepCard, action: ActionType) => void;
  onAnalyze?: (stepCard: StepCard) => void;
  className?: string;
  size?: 'small' | 'default';
  showAnalyzeButton?: boolean;
  showExecuteButton?: boolean;
  disabled?: boolean;
}

export const EnhancedStepCard: React.FC<EnhancedStepCardProps> = ({
  stepCard,
  onExecute,
  onAnalyze,
  className = '',
  size = 'default',
  showAnalyzeButton = true,
  showExecuteButton = true,
  disabled = false
}) => {
  const { updateActionType, getActionType } = useStepCardStore();
  const [showParams, setShowParams] = useState(false);

  // 获取当前操作类型
  const currentAction = useMemo(() => {
    return getActionType(stepCard.id);
  }, [stepCard.id, getActionType, stepCard.updatedAt]);

  // 处理操作类型变更
  const handleActionChange = useCallback((action: ActionType) => {
    updateActionType(stepCard.id, action);
  }, [stepCard.id, updateActionType]);

  // 处理参数变更
  const handleParamsChange = useCallback((params: Record<string, unknown>) => {
    const newAction = {
      ...currentAction,
      params: { ...currentAction.params, ...params }
    };
    updateActionType(stepCard.id, newAction);
  }, [stepCard.id, currentAction, updateActionType]);

  // 处理执行
  const handleExecute = useCallback(() => {
    const validationError = validateActionParams(currentAction);
    if (validationError) {
      // 可以显示错误提示
      console.error('参数验证失败:', validationError);
      return;
    }
    
    onExecute?.(stepCard, currentAction);
  }, [stepCard, currentAction, onExecute]);

  // 处理分析
  const handleAnalyze = useCallback(() => {
    onAnalyze?.(stepCard);
  }, [stepCard, onAnalyze]);

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'success';
      case 'analyzing': return 'processing';
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'blocked': return 'warning';
      default: return 'default';
    }
  };

  // 获取置信度显示
  const confidenceDisplay = useMemo(() => {
    if (stepCard.confidence !== undefined) {
      const percentage = Math.round(stepCard.confidence * 100);
      const color = percentage >= 80 ? 'success' : percentage >= 60 ? 'warning' : 'error';
      return { percentage, color };
    }
    return null;
  }, [stepCard.confidence]);

  return (
    <Card 
      className={`enhanced-step-card light-theme-force ${className}`}
      size={size}
      title={
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Text strong style={{ fontSize: size === 'small' ? 13 : 14 }}>
                步骤 #{stepCard.id.slice(-4)}
              </Text>
              <Tag 
                color={getStatusColor(stepCard.status)}
                style={{ fontSize: size === 'small' ? 11 : 12 }}
              >
                {stepCard.status}
              </Tag>
              {confidenceDisplay && (
                <Tag 
                  color={confidenceDisplay.color}
                  style={{ fontSize: size === 'small' ? 11 : 12 }}
                >
                  {confidenceDisplay.percentage}%
                </Tag>
              )}
            </Space>
          </Col>
          <Col>
            <Space size="small">
              {/* 操作类型选择器 */}
              <ActionSelector
                currentAction={currentAction}
                onChange={handleActionChange}
                disabled={disabled}
                size={size === 'small' ? 'small' : 'middle'}
                showIcon={true}
              />
              
              {/* 参数配置按钮 */}
              {currentAction && (
                <Tooltip title="配置参数">
                  <Button
                    type="text"
                    size={size === 'small' ? 'small' : 'middle'}
                    icon={<SettingOutlined />}
                    onClick={() => setShowParams(!showParams)}
                    disabled={disabled}
                    style={{ 
                      color: showParams ? '#1890ff' : undefined 
                    }}
                  />
                </Tooltip>
              )}
              
              {/* 分析按钮 */}
              {showAnalyzeButton && (
                <Tooltip title="分析元素">
                  <Button
                    type="text"
                    size={size === 'small' ? 'small' : 'middle'}
                    icon={<ThunderboltOutlined />}
                    onClick={handleAnalyze}
                    disabled={disabled || stepCard.status === 'analyzing'}
                    style={{ color: '#fa8c16' }}
                  />
                </Tooltip>
              )}
              
              {/* 执行按钮 */}
              {showExecuteButton && (
                <Button
                  type="primary"
                  size={size === 'small' ? 'small' : 'middle'}
                  icon={stepCard.status === 'completed' ? <CheckCircleOutlined /> : <PlayCircleOutlined />}
                  onClick={handleExecute}
                  disabled={disabled || stepCard.status === 'analyzing'}
                >
                  {stepCard.status === 'completed' ? '已执行' : '执行'}
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      }
      bodyStyle={{ 
        padding: size === 'small' ? '8px 12px' : '12px 16px' 
      }}
    >
      {/* 元素信息 */}
      <div style={{ marginBottom: showParams ? 12 : 0 }}>
        <Space wrap size="small">
          <Text type="secondary" style={{ fontSize: size === 'small' ? 11 : 12 }}>
            <InfoCircleOutlined /> 目标元素:
          </Text>
          {stepCard.elementContext?.text ? (
            <Text 
              code 
              style={{ 
                fontSize: size === 'small' ? 11 : 12,
                maxWidth: 150,
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              title={stepCard.elementContext.text}
            >
              "{stepCard.elementContext.text}"
            </Text>
          ) : (
            <Text code style={{ fontSize: size === 'small' ? 11 : 12 }}>
              {stepCard.elementUid}
            </Text>
          )}
          
          {stepCard.elementContext?.resourceId && (
            <Text type="secondary" style={{ fontSize: size === 'small' ? 10 : 11 }}>
              {stepCard.elementContext.resourceId.split('/').pop()}
            </Text>
          )}
        </Space>
      </div>
      
      {/* 参数配置面板 */}
      <Collapse 
        activeKey={showParams ? ['params'] : []}
        ghost
        size="small"
      >
        <Collapse.Panel key="params" header="" showArrow={false}>
          <ActionParamsPanel
            action={currentAction}
            onChange={handleParamsChange}
            size={size === 'small' ? 'small' : 'middle'}
          />
        </Collapse.Panel>
      </Collapse>
      
      {/* 操作预览 */}
      {currentAction.type !== 'click' && (
        <>
          <Divider style={{ margin: '8px 0' }} />
          <ActionPreview
            action={currentAction}
            elementInfo={{
              text: stepCard.elementContext?.text,
              resourceId: stepCard.elementContext?.resourceId,
              bounds: stepCard.elementContext?.bounds,
            }}
            showValidation={true}
          />
        </>
      )}
      
      {/* 错误信息 */}
      {stepCard.error && (
        <>
          <Divider style={{ margin: '8px 0' }} />
          <Text type="danger" style={{ fontSize: size === 'small' ? 11 : 12 }}>
            错误: {stepCard.error}
          </Text>
        </>
      )}
    </Card>
  );
};

export default EnhancedStepCard;