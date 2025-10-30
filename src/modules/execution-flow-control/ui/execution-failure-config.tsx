// src/modules/execution-flow-control/ui/execution-failure-config.tsx
// module: execution-flow-control | layer: ui | role: 失败处理配置组件
// summary: 提供失败处理策略的可视化配置界面，可嵌入到步骤卡片中

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Select, 
  InputNumber, 
  Switch, 
  Space, 
  Popover, 
  Button, 
  Card, 
  Typography, 
  Alert,
  Divider,
  Badge,
  Tooltip
} from 'antd';
import { 
  SettingOutlined, 
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import {
  ExecutionFailureStrategy,
  ExecutionFailureHandlingConfig,
  DEFAULT_FAILURE_HANDLING_CONFIG,
  FAILURE_STRATEGY_DESCRIPTIONS,
  FAILURE_STRATEGY_ICONS,
  ExecutionFlowContext,
  ExecutionFailureHandlingValidator
} from '../domain/failure-handling-strategy';

const { Text, Paragraph } = Typography;
const { Option } = Select;

export interface ExecutionFailureConfigProps {
  /** 当前配置 */
  config: ExecutionFailureHandlingConfig;
  
  /** 配置变更回调 */
  onChange: (config: ExecutionFailureHandlingConfig) => void;
  
  /** 执行上下文（用于验证和步骤选择） */
  context?: ExecutionFlowContext;
  
  /** 紧凑模式 */
  compact?: boolean;
  
  /** 禁用状态 */
  disabled?: boolean;
  
  /** 显示模式 */
  mode?: 'inline' | 'popover' | 'modal';
  
  /** 自定义触发按钮 */
  trigger?: React.ReactNode;
}

/**
 * 失败处理配置组件
 */
export const ExecutionFailureConfig: React.FC<ExecutionFailureConfigProps> = ({
  config: propConfig,
  onChange,
  context,
  compact = false,
  disabled = false,
  mode = 'popover',
  trigger
}) => {
  const [visible, setVisible] = useState(false);

  // 确保 config 有默认值
  const config = propConfig || DEFAULT_FAILURE_HANDLING_CONFIG;

  // 验证当前配置
  const validation = useMemo(() => {
    if (!context) return { valid: true, errors: [], warnings: [] };
    return ExecutionFailureHandlingValidator.validate(config, context);
  }, [config, context]);

  // 策略变更处理
  const handleStrategyChange = useCallback((strategy: ExecutionFailureStrategy) => {
    const newConfig: ExecutionFailureHandlingConfig = {
      ...config,
      strategy,
      // 清除与新策略不相关的配置
      ...(strategy !== ExecutionFailureStrategy.JUMP_TO_STEP && {
        targetStepId: undefined,
        targetStepIndex: undefined,
      }),
      ...(strategy !== ExecutionFailureStrategy.RETRY_CURRENT && {
        retryCount: undefined,
      }),
    };
    onChange(newConfig);
  }, [config, onChange]);

  // 目标步骤变更处理
  const handleTargetStepChange = useCallback((value: string) => {
    if (!context) return;
    
    const targetStep = context.availableSteps.find(step => step.id === value);
    onChange({
      ...config,
      targetStepId: value,
      targetStepIndex: targetStep?.index,
    });
  }, [config, onChange, context]);

  // 重试次数变更处理
  const handleRetryCountChange = useCallback((value: number | null) => {
    onChange({
      ...config,
      retryCount: value || 0,
    });
  }, [config, onChange]);

  // 重试间隔变更处理
  const handleRetryIntervalChange = useCallback((value: number | null) => {
    onChange({
      ...config,
      retryIntervalMs: value || 1000,
    });
  }, [config, onChange]);

  // 详细日志开关处理
  const handleDetailedLoggingChange = useCallback((checked: boolean) => {
    onChange({
      ...config,
      enableDetailedLogging: checked,
    });
  }, [config, onChange]);

  // 获取状态颜色
  const getStatusColor = useCallback(() => {
    if (!validation.valid) return 'error';
    if (validation.warnings.length > 0) return 'warning';
    if (config.strategy !== ExecutionFailureStrategy.STOP_SCRIPT) return 'processing';
    return 'default';
  }, [validation, config.strategy]);

  // 渲染策略选择器
  const renderStrategySelector = () => (
    <div style={{ marginBottom: 16 }}>
      <Text strong style={{ display: 'block', marginBottom: 8 }}>
        失败处理策略
      </Text>
      <Select
        value={config.strategy}
        onChange={handleStrategyChange}
        disabled={disabled}
        style={{ width: '100%' }}
        placeholder="选择失败处理策略"
      >
        {Object.entries(FAILURE_STRATEGY_DESCRIPTIONS).map(([strategy, description]) => (
          <Option key={strategy} value={strategy}>
            <Space>
              <span>{FAILURE_STRATEGY_ICONS[strategy as ExecutionFailureStrategy]}</span>
              <span>{description}</span>
            </Space>
          </Option>
        ))}
      </Select>
    </div>
  );

  // 渲染跳转配置
  const renderJumpConfig = () => {
    if (config.strategy !== ExecutionFailureStrategy.JUMP_TO_STEP) return null;
    
    return (
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          跳转目标步骤
        </Text>
        <Select
          value={config.targetStepId}
          onChange={handleTargetStepChange}
          disabled={disabled}
          style={{ width: '100%' }}
          placeholder="选择目标步骤"
          showSearch
          filterOption={(input, option) =>
            option?.children?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
          }
        >
          {context?.availableSteps.map(step => (
            <Option key={step.id} value={step.id} disabled={!step.enabled}>
              <Space>
                <Text>#{step.index + 1}</Text>
                <Text>{step.name}</Text>
                {!step.enabled && <Text type="secondary">(已禁用)</Text>}
              </Space>
            </Option>
          ))}
        </Select>
      </div>
    );
  };

  // 渲染重试配置
  const renderRetryConfig = () => {
    if (config.strategy !== ExecutionFailureStrategy.RETRY_CURRENT) return null;
    
    return (
      <div style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              重试次数
            </Text>
            <InputNumber
              value={config.retryCount}
              onChange={handleRetryCountChange}
              disabled={disabled}
              min={1}
              max={10}
              style={{ width: '100%' }}
              placeholder="输入重试次数"
            />
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              重试间隔 (毫秒)
            </Text>
            <InputNumber
              value={config.retryIntervalMs}
              onChange={handleRetryIntervalChange}
              disabled={disabled}
              min={100}
              max={10000}
              step={100}
              style={{ width: '100%' }}
              placeholder="输入重试间隔"
            />
          </div>
        </Space>
      </div>
    );
  };

  // 渲染高级选项
  const renderAdvancedOptions = () => (
    <div>
      <Text strong style={{ display: 'block', marginBottom: 8 }}>
        高级选项
      </Text>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text>详细失败日志</Text>
          <Switch
            checked={config.enableDetailedLogging}
            onChange={handleDetailedLoggingChange}
            disabled={disabled}
            size="small"
          />
        </div>
      </Space>
    </div>
  );

  // 渲染验证结果
  const renderValidation = () => {
    if (validation.valid && validation.warnings.length === 0) return null;
    
    return (
      <div style={{ marginTop: 16 }}>
        {validation.errors.length > 0 && (
          <Alert
            type="error"
            icon={<ExclamationCircleOutlined />}
            message="配置错误"
            description={
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            }
            style={{ marginBottom: 8 }}
          />
        )}
        {validation.warnings.length > 0 && (
          <Alert
            type="warning"
            icon={<WarningOutlined />}
            message="配置警告"
            description={
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {validation.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            }
          />
        )}
      </div>
    );
  };

  // 渲染配置内容
  const renderConfigContent = () => (
    <div style={{ width: compact ? 280 : 320 }}>
      <div style={{ marginBottom: 16 }}>
        <Text strong>失败处理配置</Text>
        <Paragraph type="secondary" style={{ fontSize: 12, margin: '4px 0 0' }}>
          配置步骤执行失败时的处理方式
        </Paragraph>
      </div>
      
      <Divider style={{ margin: '12px 0' }} />
      
      {renderStrategySelector()}
      {renderJumpConfig()}
      {renderRetryConfig()}
      {renderAdvancedOptions()}
      {renderValidation()}
    </div>
  );

  // 渲染默认触发按钮
  const renderTrigger = () => {
    if (trigger) return trigger;
    
    const statusColor = getStatusColor();
    const hasConfig = config.strategy !== ExecutionFailureStrategy.STOP_SCRIPT;
    
    return (
      <Tooltip title="配置失败处理策略">
        <Button
          type="text"
          size="small"
          icon={
            <Badge 
              dot={hasConfig} 
              color={statusColor === 'error' ? 'red' : statusColor === 'warning' ? 'orange' : 'blue'}
            >
              <SettingOutlined />
            </Badge>
          }
          disabled={disabled}
        />
      </Tooltip>
    );
  };

  // 内联模式
  if (mode === 'inline') {
    return <Card size="small" className="light-theme-force">{renderConfigContent()}</Card>;
  }

  // 弹出框模式
  return (
    <Popover
      content={renderConfigContent()}
      title={null}
      trigger="click"
      placement="bottomLeft"
      open={visible}
      onOpenChange={setVisible}
      overlayClassName="light-theme-force"
    >
      {renderTrigger()}
    </Popover>
  );
};

/**
 * 简化的失败处理状态指示器
 */
export const ExecutionFailureStatusIndicator: React.FC<{
  config: ExecutionFailureHandlingConfig;
  context?: ExecutionFlowContext;
  size?: 'small' | 'default';
}> = ({ config, context, size = 'small' }) => {
  const validation = useMemo(() => {
    if (!context) return { valid: true, errors: [], warnings: [] };
    return ExecutionFailureHandlingValidator.validate(config, context);
  }, [config, context]);

  const getStatusInfo = () => {
    if (!validation.valid) {
      return { color: 'red', text: '配置错误', icon: '❌' };
    }
    if (validation.warnings.length > 0) {
      return { color: 'orange', text: '配置警告', icon: '⚠️' };
    }
    if (config.strategy === ExecutionFailureStrategy.STOP_SCRIPT) {
      return { color: 'default', text: '默认停止', icon: '🛑' };
    }
    return { color: 'blue', text: '已配置', icon: '✅' };
  };

  const statusInfo = getStatusInfo();
  const strategyIcon = FAILURE_STRATEGY_ICONS[config.strategy];
  const strategyName = FAILURE_STRATEGY_DESCRIPTIONS[config.strategy];

  return (
    <Tooltip title={`失败处理: ${strategyName}`}>
      <Space size={4}>
        <span style={{ fontSize: size === 'small' ? 12 : 14 }}>
          {strategyIcon}
        </span>
        {size === 'default' && (
          <Text style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {strategyName}
          </Text>
        )}
      </Space>
    </Tooltip>
  );
};