// src/modules/execution-flow-control/ui/components/retry-config-panel.tsx
// module: execution-flow-control | layer: ui | role: 重试配置面板组件
// summary: 配置失败处理中的重试次数和间隔参数

import React, { useState, useEffect } from 'react';
import { 
  InputNumber, 
  Space, 
  Typography, 
  Alert, 
  Progress,
  Descriptions,
  Card
} from 'antd';
import { 
  ClockCircleOutlined, 
  RedoOutlined, 
  InfoCircleOutlined 
} from '@ant-design/icons';

const { Text, Title } = Typography;

export interface RetryConfig {
  /** 重试次数 (1-10) */
  retryCount: number;
  /** 重试间隔毫秒数 (100-10000) */
  retryDelay: number;
}

export interface RetryConfigPanelProps {
  /** 当前重试配置 */
  value?: RetryConfig;
  /** 配置变化回调 */
  onChange: (config: RetryConfig) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 组件大小 */
  size?: 'small' | 'middle' | 'large';
  /** 是否显示详细说明 */
  showDescription?: boolean;
  /** 是否紧凑模式 */
  compact?: boolean;
}

// 🎯 预设配置模板
const RETRY_PRESETS = {
  quick: { retryCount: 2, retryDelay: 500, name: '快速重试', desc: '适用于网络临时问题' },
  standard: { retryCount: 3, retryDelay: 1000, name: '标准重试', desc: '平衡的重试策略' },
  patient: { retryCount: 5, retryDelay: 2000, name: '耐心重试', desc: '适用于复杂操作' },
  persistent: { retryCount: 8, retryDelay: 3000, name: '持续重试', desc: '用于关键步骤' }
};

/**
 * 重试配置面板
 * 
 * 🔄 功能特性：
 * - 重试次数配置 (1-10次)
 * - 重试间隔配置 (100ms-10s)
 * - 预设配置模板
 * - 实时预览总耗时
 * - 智能配置建议
 */
export const RetryConfigPanel: React.FC<RetryConfigPanelProps> = ({
  value = { retryCount: 3, retryDelay: 1000 },
  onChange,
  disabled = false,
  size = 'small',
  showDescription = true,
  compact = false
}) => {
  const [config, setConfig] = useState<RetryConfig>(value);

  // 🔄 同步外部值变化
  useEffect(() => {
    setConfig(value);
  }, [value]);

  // 📝 更新配置
  const updateConfig = (newConfig: Partial<RetryConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    onChange(updatedConfig);
  };

  // 📊 计算总耗时估算
  const calculateTotalTime = () => {
    const totalDelay = config.retryCount * config.retryDelay;
    const executionTime = config.retryCount * 500; // 假设每次执行需要500ms
    return totalDelay + executionTime;
  };

  // 🎯 获取配置建议
  const getConfigAdvice = () => {
    const { retryCount, retryDelay } = config;
    const totalTime = calculateTotalTime();
    
    if (retryCount <= 1) {
      return { type: 'info', message: '重试次数较少，可能错过临时故障恢复' };
    }
    if (retryCount >= 7) {
      return { type: 'warning', message: '重试次数过多，可能导致执行时间过长' };
    }
    if (retryDelay < 300) {
      return { type: 'warning', message: '重试间隔过短，可能无法等待问题恢复' };
    }
    if (retryDelay > 5000) {
      return { type: 'info', message: '重试间隔较长，适合需要较多恢复时间的场景' };
    }
    if (totalTime > 30000) {
      return { type: 'error', message: '总重试时间超过30秒，建议减少重试参数' };
    }
    return { type: 'success', message: '配置合理，平衡了成功率和执行时间' };
  };

  const advice = getConfigAdvice();

  // 🎨 渲染预设按钮
  const renderPresets = () => {
    if (compact) return null;
    
    return (
      <div style={{ marginBottom: 12 }}>
        <Text type="secondary" style={{ fontSize: '12px', marginBottom: 6, display: 'block' }}>
          快速配置：
        </Text>
        <Space size="small" wrap>
          {Object.entries(RETRY_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              type="button"
              onClick={() => updateConfig({ retryCount: preset.retryCount, retryDelay: preset.retryDelay })}
              disabled={disabled}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                background: 
                  config.retryCount === preset.retryCount && config.retryDelay === preset.retryDelay
                    ? '#1890ff' : '#fff',
                color: 
                  config.retryCount === preset.retryCount && config.retryDelay === preset.retryDelay
                    ? '#fff' : '#666',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
              title={preset.desc}
            >
              {preset.name}
            </button>
          ))}
        </Space>
      </div>
    );
  };

  // 🎨 渲染紧凑模式
  if (compact) {
    return (
      <Space size="small" style={{ width: '100%' }}>
        <Space size="small" align="center">
          <RedoOutlined style={{ color: '#1890ff' }} />
          <InputNumber
            value={config.retryCount}
            onChange={(val) => updateConfig({ retryCount: val || 1 })}
            disabled={disabled}
            size={size}
            min={1}
            max={10}
            style={{ width: 60 }}
            controls={false}
          />
          <Text type="secondary" style={{ fontSize: '11px' }}>次</Text>
        </Space>
        
        <Space size="small" align="center">
          <ClockCircleOutlined style={{ color: '#52c41a' }} />
          <InputNumber
            value={config.retryDelay}
            onChange={(val) => updateConfig({ retryDelay: val || 100 })}
            disabled={disabled}
            size={size}
            min={100}
            max={10000}
            step={100}
            style={{ width: 80 }}
            controls={false}
          />
          <Text type="secondary" style={{ fontSize: '11px' }}>ms</Text>
        </Space>
      </Space>
    );
  }

  // 🎨 渲染完整模式
  return (
    <div style={{ width: '100%' }}>
      {renderPresets()}
      
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* 重试次数配置 */}
        <div>
          <Space align="center" style={{ marginBottom: 8 }}>
            <RedoOutlined style={{ color: '#1890ff' }} />
            <Text strong>重试次数</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              (1-10次)
            </Text>
          </Space>
          <InputNumber
            value={config.retryCount}
            onChange={(val) => updateConfig({ retryCount: val || 1 })}
            disabled={disabled}
            size={size}
            min={1}
            max={10}
            style={{ width: '100%' }}
            addonAfter="次"
            placeholder="输入重试次数"
          />
        </div>

        {/* 重试间隔配置 */}
        <div>
          <Space align="center" style={{ marginBottom: 8 }}>
            <ClockCircleOutlined style={{ color: '#52c41a' }} />
            <Text strong>重试间隔</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              (0.1-10秒)
            </Text>
          </Space>
          <InputNumber
            value={config.retryDelay}
            onChange={(val) => updateConfig({ retryDelay: val || 100 })}
            disabled={disabled}
            size={size}
            min={100}
            max={10000}
            step={100}
            style={{ width: '100%' }}
            addonAfter="毫秒"
            placeholder="输入重试间隔"
          />
        </div>

        {/* 📊 执行时间预览 */}
        <Card size="small" style={{ background: '#fafafa' }}>
          <Descriptions size="small" column={1} labelStyle={{ fontSize: '12px' }} contentStyle={{ fontSize: '12px' }}>
            <Descriptions.Item label="预计总耗时">
              <Space>
                <Text strong style={{ color: '#1890ff' }}>
                  {(calculateTotalTime() / 1000).toFixed(1)}秒
                </Text>
                <Progress 
                  percent={Math.min((calculateTotalTime() / 30000) * 100, 100)} 
                  size="small" 
                  style={{ width: 60 }} 
                  showInfo={false}
                  status={calculateTotalTime() > 30000 ? 'exception' : 'normal'}
                />
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="执行次数">
              最多 {config.retryCount + 1} 次 (初始 + {config.retryCount} 次重试)
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 📋 配置建议 */}
        {showDescription && (
          <Alert
            message={advice.message}
            type={advice.type as any}
            icon={<InfoCircleOutlined />}
            showIcon
          />
        )}
      </Space>
    </div>
  );
};