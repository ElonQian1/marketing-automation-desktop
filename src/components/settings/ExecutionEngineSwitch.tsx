// src/components/settings/ExecutionEngineSwitch.tsx
// module: components | layer: ui | role: 执行引擎切换控件
// summary: 提供运行时切换V1/V2/Shadow执行引擎的UI控件

import React, { useState, useEffect } from 'react';
import { Select, Switch, Button, Card, Space, Typography, Badge, Tooltip, Slider } from 'antd';
import { SettingOutlined, ThunderboltOutlined, ExperimentOutlined, RollbackOutlined } from '@ant-design/icons';
import { engineConfig, type ExecutionEngine, type EngineConfig } from '../../infrastructure/config/ExecutionEngineConfig';

const { Text } = Typography;
const { Option } = Select;

interface ExecutionEngineSwitchProps {
  compact?: boolean; // 紧凑模式，用于页面顶部
  onChange?: (engine: ExecutionEngine) => void;
}

export const ExecutionEngineSwitch: React.FC<ExecutionEngineSwitchProps> = ({
  compact = false,
  onChange,
}) => {
  const [config, setConfig] = useState<EngineConfig>(engineConfig.getConfig());
  const [currentEngine, setCurrentEngine] = useState<ExecutionEngine>(config.defaultEngine);

  useEffect(() => {
    // 监听配置变化
    const unsubscribe = engineConfig.onConfigChange((newConfig) => {
      setConfig(newConfig);
      setCurrentEngine(newConfig.defaultEngine);
    });

    return unsubscribe;
  }, []);

  const handleEngineChange = (engine: ExecutionEngine) => {
    engineConfig.updateConfig({ defaultEngine: engine });
    onChange?.(engine);
  };

  const handleFeatureToggle = (feature: keyof EngineConfig['featureFlags'], enabled: boolean) => {
    engineConfig.updateConfig({
      featureFlags: {
        ...config.featureFlags,
        [feature]: enabled,
      },
    });
  };

  const handleSampleRateChange = (rate: number) => {
    engineConfig.updateConfig({
      featureFlags: {
        ...config.featureFlags,
        shadowSampleRate: rate / 100, // UI显示百分比，内部存储小数
      },
    });
  };

  const handleEmergencyFallback = () => {
    engineConfig.emergencyFallbackToV1();
  };

  const handleReset = () => {
    engineConfig.resetToDefault();
  };

  // 紧凑模式：只显示基本切换
  if (compact) {
    return (
      <Space size="small">
        <Badge 
          status={currentEngine === 'v1' ? 'default' : currentEngine === 'v2' ? 'processing' : 'warning'}
          text={null}
        />
        <Select
          value={currentEngine}
          onChange={handleEngineChange}
          size="small"
          style={{ width: 100 }}
          suffixIcon={<SettingOutlined />}
        >
          <Option value="v1">V1</Option>
          <Option value="v2" disabled={!config.featureFlags.enableV2}>V2</Option>
          <Option value="shadow" disabled={!config.featureFlags.enableShadow}>Shadow</Option>
        </Select>
        {config.featureFlags.forceV1Fallback && (
          <Badge status="error" text="紧急回退" />
        )}
      </Space>
    );
  }

  // 完整模式：详细配置面板
  return (
    <Card 
      title={
        <Space>
          <ThunderboltOutlined />
          执行引擎配置
        </Space>
      }
      size="small"
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        
        {/* 主引擎选择 */}
        <div>
          <Text strong>默认执行引擎:</Text>
          <Select
            value={currentEngine}
            onChange={handleEngineChange}
            style={{ width: '100%', marginTop: 8 }}
            disabled={config.featureFlags.forceV1Fallback}
          >
            <Option value="v1">
              <Space>
                <Badge status="default" />
                V1 (稳定版) - 现有系统
              </Space>
            </Option>
            <Option value="v2" disabled={!config.featureFlags.enableV2}>
              <Space>
                <Badge status="processing" />
                V2 (新动作系统) - 支持动作切换
              </Space>
            </Option>
            <Option value="shadow" disabled={!config.featureFlags.enableShadow}>
              <Space>
                <Badge status="warning" />
                Shadow (影子执行) - V1执行+V2验证
              </Space>
            </Option>
          </Select>
        </div>

        {/* 特性开关 */}
        <div>
          <Text strong>特性开关:</Text>
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text>启用V2系统</Text>
              <Switch 
                checked={config.featureFlags.enableV2}
                onChange={(checked) => handleFeatureToggle('enableV2', checked)}
                size="small"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text>启用影子执行</Text>
              <Switch 
                checked={config.featureFlags.enableShadow}
                onChange={(checked) => handleFeatureToggle('enableShadow', checked)}
                size="small"
              />
            </div>
          </div>
        </div>

        {/* 影子执行采样率 */}
        {config.featureFlags.enableShadow && (
          <div>
            <Text strong>影子执行采样率: {Math.round(config.featureFlags.shadowSampleRate * 100)}%</Text>
            <Tooltip title="控制多少比例的请求会进行影子执行（V1真实执行+V2并行验证）">
              <Slider
                min={0}
                max={100}
                value={Math.round(config.featureFlags.shadowSampleRate * 100)}
                onChange={handleSampleRateChange}
                style={{ marginTop: 8 }}
              />
            </Tooltip>
          </div>
        )}

        {/* 紧急控制 */}
        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12, marginTop: 12 }}>
          <Space>
            <Tooltip title="立即回退到V1引擎，用于紧急情况">
              <Button
                icon={<RollbackOutlined />}
                onClick={handleEmergencyFallback}
                danger
                size="small"
                disabled={config.featureFlags.forceV1Fallback}
              >
                紧急回退
              </Button>
            </Tooltip>
            
            <Tooltip title="重置所有配置为默认值">
              <Button
                icon={<ExperimentOutlined />}
                onClick={handleReset}
                size="small"
              >
                重置配置
              </Button>
            </Tooltip>
          </Space>

          {config.featureFlags.forceV1Fallback && (
            <div style={{ marginTop: 8, padding: 8, background: '#fff2e8', border: '1px solid #ffbb96', borderRadius: 4 }}>
              <Text type="warning" strong>⚠️ 紧急回退模式已激活，所有请求将使用V1引擎</Text>
            </div>
          )}
        </div>

        {/* 当前状态显示 */}
        <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
          <Text code>
            当前引擎: {currentEngine} | 
            V2开关: {config.featureFlags.enableV2 ? '✅' : '❌'} | 
            影子: {config.featureFlags.enableShadow ? '✅' : '❌'} | 
            采样: {Math.round(config.featureFlags.shadowSampleRate * 100)}%
          </Text>
        </div>
      </Space>
    </Card>
  );
};

export default ExecutionEngineSwitch;