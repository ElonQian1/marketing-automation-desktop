// src/modules/loop-control/ui/loop-test-button.tsx
// module: loop-control | layer: ui | role: component
// summary: 循环测试按钮 - 用于测试循环执行

import React from 'react';
import { Button, Tooltip, Progress, Space, Typography } from 'antd';
import { 
  PlayCircleOutlined, 
  LoadingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined 
} from '@ant-design/icons';
import type { LoopTestState } from '../application/use-loop-test-execution';

const { Text } = Typography;

export interface LoopTestButtonProps {
  /** 循环ID */
  loopId: string;
  /** 执行状态 */
  state: LoopTestState;
  /** 是否可以开始 */
  canStart: boolean;
  /** 是否可以停止 */
  canStop: boolean;
  /** 开始测试回调 */
  onStart: (loopId: string) => void;
  /** 停止测试回调 */
  onStop: () => void;
  /** 按钮大小 */
  size?: 'small' | 'middle' | 'large';
  /** 是否显示进度条 */
  showProgress?: boolean;
  /** 是否显示文字 */
  showText?: boolean;
}

/**
 * 循环测试按钮组件
 * 
 * 功能：
 * 1. 显示播放/停止按钮
 * 2. 显示执行进度
 * 3. 显示执行状态图标
 * 4. 提供视觉反馈
 * 
 * @example
 * ```tsx
 * <LoopTestButton
 *   loopId="loop_123"
 *   state={state}
 *   canStart={canStart}
 *   canStop={canStop}
 *   onStart={startTest}
 *   onStop={stopTest}
 *   showProgress
 * />
 * ```
 */
export const LoopTestButton: React.FC<LoopTestButtonProps> = ({
  loopId,
  state,
  canStart,
  canStop,
  onStart,
  onStop,
  size = 'small',
  showProgress = false,
  showText = false,
}) => {
  // 根据状态渲染不同的图标和文字
  const renderButton = () => {
    switch (state.status) {
      case 'idle':
        return (
          <Tooltip title="测试循环">
            <Button
              type="text"
              size={size}
              icon={<PlayCircleOutlined />}
              onClick={() => onStart(loopId)}
              disabled={!canStart}
              style={{ color: '#10b981' }}
            >
              {showText && '测试'}
            </Button>
          </Tooltip>
        );

      case 'running':
        return (
          <Tooltip title={`正在执行 (${state.currentIteration}/${state.totalIterations})`}>
            <Button
              type="text"
              size={size}
              icon={<LoadingOutlined />}
              onClick={onStop}
              disabled={!canStop}
              style={{ color: '#3b82f6' }}
            >
              {showText && '停止'}
            </Button>
          </Tooltip>
        );

      case 'completed':
        return (
          <Tooltip title="执行完成">
            <Button
              type="text"
              size={size}
              icon={<CheckCircleOutlined />}
              onClick={() => onStart(loopId)}
              disabled={!canStart}
              style={{ color: '#10b981' }}
            >
              {showText && '完成'}
            </Button>
          </Tooltip>
        );

      case 'error':
        return (
          <Tooltip title={`执行失败：${state.error}`}>
            <Button
              type="text"
              size={size}
              icon={<CloseCircleOutlined />}
              onClick={() => onStart(loopId)}
              disabled={!canStart}
              danger
            >
              {showText && '重试'}
            </Button>
          </Tooltip>
        );

      default:
        return null;
    }
  };

  // 渲染进度条
  const renderProgress = () => {
    if (!showProgress || state.status === 'idle') return null;

    return (
      <Space direction="vertical" size={2} style={{ width: '100%' }}>
        <Progress
          percent={state.progress}
          size="small"
          status={
            state.status === 'error' ? 'exception' :
            state.status === 'completed' ? 'success' :
            'active'
          }
          showInfo={false}
        />
        <Text type="secondary" style={{ fontSize: 11 }}>
          循环 {state.currentIteration}/{state.totalIterations}
          {state.status === 'running' && ` - 步骤 ${state.currentStepIndex + 1}/${state.totalSteps}`}
        </Text>
      </Space>
    );
  };

  return (
    <Space direction="vertical" size={4} style={{ width: showProgress ? 120 : 'auto' }}>
      {renderButton()}
      {renderProgress()}
    </Space>
  );
};

/**
 * 紧凑版循环测试按钮（只有图标）
 */
export const CompactLoopTestButton: React.FC<Omit<LoopTestButtonProps, 'showProgress' | 'showText'>> = (props) => {
  return <LoopTestButton {...props} showProgress={false} showText={false} />;
};

/**
 * 带进度条的循环测试按钮
 */
export const LoopTestButtonWithProgress: React.FC<Omit<LoopTestButtonProps, 'showProgress'>> = (props) => {
  return <LoopTestButton {...props} showProgress />;
};

/**
 * 使用示例：
 * 
 * ```tsx
 * // 在循环卡片中使用
 * import { useLoopTestExecution } from '@loop-control';
 * import { LoopTestButton } from '@loop-control';
 * 
 * function LoopCard({ loopId, steps, deviceId }) {
 *   const {
 *     state,
 *     canStart,
 *     canStop,
 *     startTest,
 *     stopTest,
 *   } = useLoopTestExecution({
 *     steps,
 *     deviceId,
 *     onComplete: (success) => {
 *       if (success) message.success('测试完成');
 *     },
 *   });
 * 
 *   return (
 *     <Card>
 *       <div className="loop-header">
 *         <Text>循环名称</Text>
 *         <LoopTestButton
 *           loopId={loopId}
 *           state={state}
 *           canStart={canStart}
 *           canStop={canStop}
 *           onStart={startTest}
 *           onStop={stopTest}
 *           showProgress
 *         />
 *       </div>
 *     </Card>
 *   );
 * }
 * ```
 */
