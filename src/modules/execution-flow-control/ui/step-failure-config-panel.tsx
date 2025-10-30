// src/modules/execution-flow-control/ui/step-failure-config-panel.tsx
// module: execution-flow-control | layer: ui | role: 步骤失败配置面板
// summary: 用于步骤卡片的失败处理配置面板，提供完整的失败策略配置界面

import React from 'react';
import { Card, Space, Typography, Divider, Alert } from 'antd';
import {
  ExclamationCircleOutlined,
  SettingOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import {
  ExecutionFailureConfig,
  ExecutionFailureStatusIndicator,
  type ExecutionFailureConfigProps
} from './execution-failure-config';
import {
  ExecutionFailureStrategy,
  DEFAULT_FAILURE_HANDLING_CONFIG,
  type ExecutionFailureHandlingConfig
} from '../domain/failure-handling-strategy';
import type { ExtendedSmartScriptStep } from '../../../types/loopScript';

const { Text, Title } = Typography;

export interface StepFailureConfigPanelProps {
  /** 步骤数据 */
  step: ExtendedSmartScriptStep;
  /** 当前失败处理配置 */
  failureConfig?: ExecutionFailureHandlingConfig;
  /** 所有步骤数据（用于跳转目标选择） */
  allSteps?: ExtendedSmartScriptStep[];
  /** 配置更新回调 */
  onConfigChange?: (config: ExecutionFailureHandlingConfig) => void;
  /** 显示模式 */
  mode?: 'popover' | 'inline' | 'panel';
  /** 是否紧凑显示 */
  compact?: boolean;
  /** 自定义样式类名 */
  className?: string;
  /** 是否显示标题 */
  showTitle?: boolean;
  /** 是否显示状态指示器 */
  showStatusIndicator?: boolean;
  /** 是否禁用编辑 */
  disabled?: boolean;
}

export const StepFailureConfigPanel: React.FC<StepFailureConfigPanelProps> = ({
  step,
  failureConfig: propFailureConfig,
  allSteps,
  onConfigChange,
  mode = 'panel',
  compact = false,
  className,
  showTitle = true,
  showStatusIndicator = true,
  disabled = false
}) => {
  // 确保 failureConfig 有默认值
  const failureConfig = propFailureConfig || DEFAULT_FAILURE_HANDLING_CONFIG;

  // 构建跳转目标选项
  // const jumpTargets = React.useMemo(() => {
  //   if (!allSteps) return [];
  //   
  //   return allSteps
  //     .filter(s => s.id !== step.id) // 排除自己
  //     .sort((a, b) => (a.order || 0) - (b.order || 0))
  //     .map(s => ({
  //       value: s.id,
  //       label: `步骤 ${s.order || '?'}: ${s.name || s.description || 'Unknown'}`,
  //       order: s.order || 0
  //     }));
  // }, [allSteps, step.id]);

  // 配置属性
  const configProps: ExecutionFailureConfigProps = {
    config: failureConfig,
    onChange: onConfigChange,
    mode: mode === 'panel' ? 'inline' : mode, // 将 'panel' 转换为 'inline'
    compact,
    disabled
  };

  // 渲染内容
  const renderContent = () => (
    <Space direction="vertical" size="middle" className="execution-failure-config-panel">
      {showTitle && !compact && (
        <div className="execution-failure-config-panel__header">
          <Space align="center">
            <ExclamationCircleOutlined style={{ color: 'var(--warning)' }} />
            <Title level={5} style={{ margin: 0 }}>
              失败处理配置
            </Title>
            {showStatusIndicator && failureConfig && (
              <ExecutionFailureStatusIndicator
                config={failureConfig}
                size="small"
              />
            )}
          </Space>
        </div>
      )}

      {showTitle && compact && (
        <div className="execution-failure-config-panel__compact-header">
          <Space align="center" size="small">
            <SettingOutlined style={{ fontSize: '12px', color: 'var(--text-3)' }} />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              失败处理
            </Text>
            {showStatusIndicator && failureConfig && (
              <ExecutionFailureStatusIndicator
                config={failureConfig}
                size="small"
              />
            )}
          </Space>
        </div>
      )}

      <ExecutionFailureConfig {...configProps} />

      {!compact && failureConfig && (
        <>
          <Divider style={{ margin: '8px 0' }} />
          <div className="execution-failure-config-panel__info">
            <Alert
              type="info"
              showIcon
              icon={<ThunderboltOutlined />}
              message="策略说明"
              description={getStrategyDescription(failureConfig.strategy)}
              style={{ fontSize: '12px' }}
            />
          </div>
        </>
      )}
    </Space>
  );

  // 面板模式渲染
  if (mode === 'panel') {
    return (
      <Card 
        className={`execution-failure-config-panel-card ${className || ''}`}
        size={compact ? 'small' : 'default'}
        styles={{
          body: { 
            padding: compact ? '12px' : '16px',
            background: 'var(--bg-light-base)'
          }
        }}
      >
        <div className="light-theme-force">
          {renderContent()}
        </div>
      </Card>
    );
  }

  // 行内/弹窗模式直接返回内容
  return (
    <div className={`execution-failure-config-panel ${className || ''}`}>
      {renderContent()}
    </div>
  );
};

// 获取策略描述
function getStrategyDescription(strategy: ExecutionFailureStrategy): string {
  switch (strategy) {
    case ExecutionFailureStrategy.STOP_SCRIPT:
      return '遇到失败时立即停止整个脚本执行，适用于关键步骤。';
    case ExecutionFailureStrategy.CONTINUE_NEXT:
      return '忽略当前步骤失败，继续执行下一步骤，适用于可选步骤。';
    case ExecutionFailureStrategy.JUMP_TO_STEP:
      return '跳转到指定步骤继续执行，适用于错误恢复流程。';
    case ExecutionFailureStrategy.RETRY_CURRENT:
      return '重试当前步骤指定次数，适用于网络等临时问题。';
    case ExecutionFailureStrategy.SKIP_CURRENT:
      return '跳过当前步骤并标记为已跳过，继续下一步。';
    default:
      return '未知策略';
  }
}

export default StepFailureConfigPanel;