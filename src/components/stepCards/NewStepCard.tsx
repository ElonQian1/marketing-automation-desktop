// src/components/stepCards/NewStepCard.tsx
// module: components | layer: ui | role: 新版步骤卡片
// summary: 集成动作切换系统的完整步骤卡片组件

import React, { useState, useCallback } from 'react';
import { Card, Badge, Space, Typography, Divider, Alert, Progress } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  LoadingOutlined,
  EyeOutlined,
  PlayCircleOutlined 
} from '@ant-design/icons';

import type { 
  ActionType, 
  ExecutionMode, 
  StepCardModel, 
  StepActionParams,
  StepActionCommon,
  StepStatus,
  TapLikeParams,
  SwipeParams,
  TypeParams,
  WaitParams,
  BackParams
} from '../../types/stepActions';
import { 
  getDefaultActionParams, 
  validateActionParams, 
  DEFAULT_ACTION_COMMON 
} from '../../types/stepActions';

import { ActionBar } from './ActionBar';
import { ActionParams } from './ActionParams';
import { useStepCardStateMachine } from '../../hooks/useStepCardStateMachine';

const { Text } = Typography;

export interface NewStepCardProps {
  // 基础信息
  stepId: string;
  stepName: string;
  selectorId: string;
  
  // 可选的初始动作
  initialAction?: ActionType;
  initialCommon?: Partial<StepActionCommon>;
  
  // 事件回调
  onStatusChange?: (status: StepStatus) => void;
  onActionChange?: (action: StepActionParams) => void;
}

export const NewStepCard: React.FC<NewStepCardProps> = ({
  stepId,
  stepName,
  selectorId,
  initialAction = 'tap',
  initialCommon = {},
  onStatusChange,
  onActionChange,
}) => {
  // 动作状态
  const [currentAction, setCurrentAction] = useState<StepActionParams>(
    getDefaultActionParams(initialAction)
  );
  const [commonConfig, setCommonConfig] = useState<StepActionCommon>({
    ...DEFAULT_ACTION_COMMON,
    ...initialCommon,
  });

  // 状态机
  const {
    status,
    lastMatch,
    isLoading,
    runStep,
    reset,
  } = useStepCardStateMachine({
    stepId,
    initialAction: currentAction,
    onMatch: (result) => {
      console.log(`📍 [${stepName}] 匹配结果:`, result);
    },
    onExecute: (success, message) => {
      console.log(`⚡ [${stepName}] 执行结果: ${success ? '成功' : '失败'} - ${message}`);
    },
  });

  // 通知状态变化
  React.useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  // 通知动作变化
  React.useEffect(() => {
    onActionChange?.(currentAction);
  }, [currentAction, onActionChange]);

  // 切换动作类型
  const handleChangeAction = useCallback((actionType: ActionType) => {
    const newAction = getDefaultActionParams(actionType);
    setCurrentAction(newAction);
    reset(); // 重置状态
  }, [reset]);

  // 执行步骤
  const handleRun = useCallback(async (mode: ExecutionMode) => {
    // 校验参数
    const validation = validateActionParams(currentAction);
    if (!validation.valid) {
      console.warn(`❌ 参数校验失败: ${validation.message}`);
      return;
    }

    // 构建步骤模型
    const stepCard: StepCardModel = {
      id: stepId,
      name: stepName,
      selectorId,
      currentAction,
      common: commonConfig,
      status,
      version: '1.0',
    };

    // 执行
    await runStep(mode, stepCard);
  }, [currentAction, commonConfig, stepId, stepName, selectorId, status, runStep]);

  // 更新动作参数
  const handleParamsChange = useCallback((params: Record<string, unknown>) => {
    setCurrentAction(prev => {
      // 根据当前动作类型转换参数
      switch (prev.type) {
        case 'tap':
        case 'doubleTap':
        case 'longPress':
          return { ...prev, params: params as TapLikeParams };
        case 'swipe':
          return { ...prev, params: params as unknown as SwipeParams };
        case 'type':
          return { ...prev, params: params as unknown as TypeParams };
        case 'wait':
          return { ...prev, params: params as unknown as WaitParams };
        case 'back':
          return { ...prev, params: params as BackParams };
        default:
          return prev;
      }
    });
  }, []);

  // 更新通用配置
  const handleCommonChange = useCallback((common: StepActionCommon) => {
    setCommonConfig(common);
  }, []);

  // 状态徽标
  const getStatusBadge = () => {
    switch (status) {
      case 'idle':
        return <Badge status="default" text="待执行" />;
      case 'matching':
        return <Badge status="processing" text="匹配中" />;
      case 'ready':
        return <Badge status="warning" text="就绪" />;
      case 'executing':
        return <Badge status="processing" text="执行中" />;
      case 'verifying':
        return <Badge status="processing" text="验证中" />;
      case 'success':
        return <Badge status="success" text="成功" />;
      case 'failed':
        return <Badge status="error" text="失败" />;
      default:
        return <Badge status="default" text="未知" />;
    }
  };

  // 状态图标
  const getStatusIcon = () => {
    if (isLoading) return <LoadingOutlined spin />;
    if (status === 'success') return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    if (status === 'failed') return <CloseCircleOutlined style={{ color: '#f5222d' }} />;
    if (status === 'ready') return <EyeOutlined style={{ color: '#faad14' }} />;
    return <PlayCircleOutlined style={{ color: '#1890ff' }} />;
  };

  // 匹配结果展示
  const renderMatchResult = () => {
    if (!lastMatch) return null;

    return (
      <Alert
        type={status === 'success' ? 'success' : status === 'failed' ? 'error' : 'info'}
        message={
          <Space>
            <span>匹配结果:</span>
            <Text strong>置信度 {(lastMatch.confidence * 100).toFixed(1)}%</Text>
            <Divider type="vertical" />
            <Text>{lastMatch.summary}</Text>
          </Space>
        }
        style={{ marginBottom: 8 }}
      />
    );
  };

  // 进度条（仅在加载时显示）
  const renderProgress = () => {
    if (!isLoading) return null;

    const getProgressPercent = () => {
      switch (status) {
        case 'matching': return 25;
        case 'executing': return 70;
        case 'verifying': return 90;
        default: return 0;
      }
    };

    return (
      <Progress 
        percent={getProgressPercent()} 
        size="small" 
        status="active"
        format={() => status === 'matching' ? '匹配中' : status === 'executing' ? '执行中' : '验证中'}
        style={{ marginBottom: 8 }}
      />
    );
  };

  return (
    <Card
      size="small"
      title={
        <Space>
          {getStatusIcon()}
          <span>{stepName}</span>
          {getStatusBadge()}
        </Space>
      }
      extra={
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {selectorId}
        </Text>
      }
      className="light-theme-force"
      style={{ marginBottom: 16 }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* 进度条 */}
        {renderProgress()}
        
        {/* 匹配结果 */}
        {renderMatchResult()}
        
        {/* 动作执行栏 */}
        <ActionBar
          action={currentAction.type}
          onChangeAction={handleChangeAction}
          onRun={handleRun}
          loading={isLoading}
          disabled={isLoading}
        />
        
        {/* 动作参数 */}
        <ActionParams
          action={currentAction.type}
          params={currentAction.params as Record<string, unknown>}
          common={commonConfig}
          onParamsChange={handleParamsChange}
          onCommonChange={handleCommonChange}
        />
      </Space>
    </Card>
  );
};