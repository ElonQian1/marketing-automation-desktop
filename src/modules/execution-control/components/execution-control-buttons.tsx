// src/modules/execution-control/components/execution-control-buttons.tsx
// module: execution-control | layer: ui | role: 执行控制按钮组件
// summary: 提供执行和中止按钮组合，支持各种配置选项

import React from 'react';
import { Button, Space, Popconfirm, Tooltip } from 'antd';
import { PlayCircleOutlined, StopOutlined, WarningOutlined } from '@ant-design/icons';
import { useExecutionControl } from '../hooks/use-execution-control';

export interface ExecutionControlButtonsProps {
  /** 执行按钮文本 */
  executeText?: string;
  /** 中止按钮文本 */
  abortText?: string;
  /** 是否禁用执行按钮 */
  disabled?: boolean;
  /** 自定义执行按钮loading状态 */
  loading?: boolean;
  /** 执行回调 */
  onExecute?: () => void | Promise<void>;
  /** 中止确认回调 */
  onAbort?: () => void | Promise<void>;
  /** 是否显示中止确认对话框 */
  confirmAbort?: boolean;
  /** 中止确认提示文本 */
  abortConfirmText?: string;
  /** 按钮尺寸 */
  size?: 'small' | 'middle' | 'large';
  /** 布局方向 */
  direction?: 'horizontal' | 'vertical';
  /** 是否显示为块级按钮 */
  block?: boolean;
}

/**
 * 执行控制按钮组
 * 包含执行和中止按钮，自动管理状态
 */
export const ExecutionControlButtons: React.FC<ExecutionControlButtonsProps> = ({
  executeText = '执行脚本',
  abortText = '中止执行',
  disabled = false,
  loading: customLoading,
  onExecute,
  onAbort,
  confirmAbort = false,
  abortConfirmText = '确定要中止当前执行吗？',
  size = 'middle',
  direction = 'horizontal',
  block = false
}) => {
  const { 
    isExecuting, 
    canAbort, 
    startExecution, 
    finishExecution, 
    abortExecution 
  } = useExecutionControl();

  // 使用自定义loading状态或内部状态
  const isLoading = customLoading !== undefined ? customLoading : isExecuting;

  const handleExecute = async () => {
    if (onExecute) {
      try {
        startExecution();
        console.log('🎬 [执行控制按钮] 开始执行');
        await onExecute();
        console.log('✅ [执行控制按钮] 执行完成');
      } catch (error) {
        console.error('❌ [执行控制按钮] 执行失败:', error);
      } finally {
        finishExecution();
      }
    }
  };

  const handleAbort = async () => {
    try {
      console.log('🛑 [执行控制按钮] 开始中止');
      const result = await abortExecution({
        reason: '用户手动中止'
      });
      
      if (onAbort) {
        await onAbort();
      }
      
      console.log('✅ [执行控制按钮] 中止完成:', result);
    } catch (error) {
      console.error('❌ [执行控制按钮] 中止失败:', error);
    }
  };

  const executeButton = (
    <Button
      type="primary"
      icon={<PlayCircleOutlined />}
      onClick={handleExecute}
      loading={isLoading}
      disabled={disabled || isExecuting}
      size={size}
      block={block}
    >
      {isLoading ? '正在执行...' : executeText}
    </Button>
  );

  const abortButton = canAbort ? (
    confirmAbort ? (
      <Popconfirm
        title="中止执行确认"
        description={abortConfirmText}
        onConfirm={handleAbort}
        okText="确定中止"
        cancelText="取消"
        icon={<WarningOutlined style={{ color: 'red' }} />}
      >
        <Button
          danger
          icon={<StopOutlined />}
          size={size}
          block={block}
        >
          {abortText}
        </Button>
      </Popconfirm>
    ) : (
      <Button
        danger
        icon={<StopOutlined />}
        onClick={handleAbort}
        size={size}
        block={block}
      >
        {abortText}
      </Button>
    )
  ) : null;

  return (
    <Space direction={direction} style={{ width: block ? '100%' : 'auto' }}>
      {executeButton}
      {abortButton}
    </Space>
  );
};

/**
 * 简化版执行控制按钮
 * 只有基本功能，适用于空间受限的场景
 */
export const SimpleExecutionControlButtons: React.FC<{
  onExecute?: () => void | Promise<void>;
  onAbort?: () => void | Promise<void>;
  disabled?: boolean;
}> = ({ onExecute, onAbort, disabled }) => {
  return (
    <ExecutionControlButtons
      executeText="执行"
      abortText="停止"
      onExecute={onExecute}
      onAbort={onAbort}
      disabled={disabled}
      size="small"
      direction="horizontal"
      confirmAbort={false}
    />
  );
};

/**
 * 只有中止按钮的组件
 * 适用于已有执行按钮的场景
 */
export const AbortButton: React.FC<{
  onAbort?: () => void | Promise<void>;
  text?: string;
  size?: 'small' | 'middle' | 'large';
  confirmAbort?: boolean;
}> = ({ 
  onAbort, 
  text = '中止',
  size = 'middle',
  confirmAbort = false 
}) => {
  const { canAbort, abortExecution } = useExecutionControl();

  const handleAbort = async () => {
    try {
      await abortExecution({
        reason: '用户手动中止'
      });
      
      if (onAbort) {
        await onAbort();
      }
    } catch (error) {
      console.error('❌ [中止按钮] 中止失败:', error);
    }
  };

  if (!canAbort) {
    return null;
  }

  if (confirmAbort) {
    return (
      <Popconfirm
        title="确定要中止当前执行吗？"
        onConfirm={handleAbort}
        okText="确定"
        cancelText="取消"
        icon={<WarningOutlined style={{ color: 'red' }} />}
      >
        <Tooltip title="中止当前脚本执行">
          <Button danger icon={<StopOutlined />} size={size}>
            {text}
          </Button>
        </Tooltip>
      </Popconfirm>
    );
  }

  return (
    <Tooltip title="中止当前脚本执行">
      <Button 
        danger 
        icon={<StopOutlined />} 
        onClick={handleAbort}
        size={size}
      >
        {text}
      </Button>
    </Tooltip>
  );
};