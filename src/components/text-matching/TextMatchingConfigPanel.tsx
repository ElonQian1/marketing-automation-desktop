// src/components/text-matching/TextMatchingConfigPanel.tsx
// module: ui | layer: ui | role: component  
// summary: 文本匹配配置面板组件，控制绝对匹配vs部分匹配模式

import React, { useState, useEffect } from 'react';
import {
  Card,
  Switch,
  Radio,
  Space,
  Typography,
  Divider,
  Alert,
  Button,
  Tooltip,
  Tag,
  Row,
  Col
} from 'antd';
import {
  SettingOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  SafetyOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

// 文本匹配模式枚举
export type TextMatchingMode = 'exact' | 'partial';

// 配置接口
export interface TextMatchingConfig {
  enabled: boolean;
  mode: TextMatchingMode;
  antonymCheckEnabled: boolean;
  semanticAnalysisEnabled: boolean;
  partialMatchThreshold: number;
}

export interface TextMatchingConfigPanelProps {
  config: TextMatchingConfig;
  onChange: (config: TextMatchingConfig) => void;
  className?: string;
}

export const TextMatchingConfigPanel: React.FC<TextMatchingConfigPanelProps> = ({
  config,
  onChange,
  className
}) => {
  const [localConfig, setLocalConfig] = useState<TextMatchingConfig>(config);

  // 同步外部配置变化
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  // 配置变更处理
  const handleConfigChange = (updates: Partial<TextMatchingConfig>) => {
    const newConfig = { ...localConfig, ...updates };
    
    // 自动调整相关设置
    if (updates.mode === 'exact') {
      // 绝对匹配模式：禁用所有智能功能
      newConfig.antonymCheckEnabled = false;
      newConfig.semanticAnalysisEnabled = false;
    } else if (updates.mode === 'partial') {
      // 部分匹配模式：可以启用智能功能
      newConfig.antonymCheckEnabled = true;
      newConfig.semanticAnalysisEnabled = true;
    }
    
    setLocalConfig(newConfig);
    onChange(newConfig);
  };

  // 渲染状态指示器
  const renderStatusIndicator = (enabled: boolean, label: string) => (
    <div className="status-indicator light-theme-force" style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 12px',
      background: enabled 
        ? 'rgba(16, 185, 129, 0.1)' 
        : 'rgba(156, 163, 175, 0.1)',
      borderRadius: 6,
      fontSize: 12
    }}>
      <span style={{
        color: enabled ? 'var(--success, #10B981)' : 'var(--text-3, #9CA3AF)',
        fontSize: 12
      }}>
        {enabled ? '✓' : '○'}
      </span>
      <span style={{
        color: enabled ? 'var(--success, #10B981)' : 'var(--text-3, #9CA3AF)',
        fontWeight: 500
      }}>
        {enabled ? '已启用' : '已禁用'}
      </span>
      <Text style={{
        color: enabled ? 'var(--success, #10B981)' : 'var(--text-3, #9CA3AF)',
        fontSize: 11
      }}>
        {label}
      </Text>
    </div>
  );

  return (
    <Card 
      className={`light-theme-force ${className || ''}`}
      title={
        <Space>
          <SettingOutlined />
          <span>文本匹配配置</span>
        </Space>
      }
      extra={
        <Tooltip title="控制系统如何匹配UI元素中的文本内容">
          <InfoCircleOutlined style={{ color: 'var(--text-3, #9CA3AF)' }} />
        </Tooltip>
      }
    >
      {/* 主开关 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text strong style={{ color: 'var(--text-1, #1f2937)' }}>
              启用智能文本匹配
            </Text>
            <Switch
              checked={localConfig.enabled}
              onChange={(enabled) => handleConfigChange({ enabled })}
              checkedChildren="开启"
              unCheckedChildren="关闭"
            />
          </Space>
        </Col>
        <Col span={12}>
          {renderStatusIndicator(localConfig.enabled, '智能匹配系统')}
        </Col>
      </Row>

      <Divider />

      {/* 匹配模式选择 */}
      <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
        <Text strong style={{ color: 'var(--text-1, #1f2937)' }}>
          匹配模式选择
        </Text>
        
        <Radio.Group
          value={localConfig.mode}
          onChange={(e) => handleConfigChange({ mode: e.target.value })}
          disabled={!localConfig.enabled}
        >
          <Space direction="vertical">
            <Radio value="exact">
              <Space>
                <SafetyOutlined style={{ color: 'var(--warning, #f59e0b)' }} />
                <span style={{ color: 'var(--text-1, #1f2937)' }}>
                  <strong>绝对匹配模式</strong>
                </span>
                <Tag color="orange">精确</Tag>
              </Space>
            </Radio>
            <div style={{ marginLeft: 24, marginBottom: 8 }}>
              <Text type="secondary" style={{ fontSize: 12, color: 'var(--text-3, #6b7280)' }}>
                文本必须完全匹配，不允许任何模糊匹配或智能推理
              </Text>
            </div>

            <Radio value="partial">
              <Space>
                <ThunderboltOutlined style={{ color: 'var(--primary, #3b82f6)' }} />
                <span style={{ color: 'var(--text-1, #1f2937)' }}>
                  <strong>部分文本匹配模式</strong>
                </span>
                <Tag color="blue">智能</Tag>
              </Space>
            </Radio>
            <div style={{ marginLeft: 24 }}>
              <Text type="secondary" style={{ fontSize: 12, color: 'var(--text-3, #6b7280)' }}>
                启用智能匹配算法，包括反义词检测、语义分析等功能
              </Text>
            </div>
          </Space>
        </Radio.Group>
      </Space>

      {/* 模式说明 */}
      {localConfig.enabled && (
        <Alert
          type={localConfig.mode === 'exact' ? 'warning' : 'info'}
          showIcon
          message={
            localConfig.mode === 'exact' 
              ? '绝对匹配模式：高精度，低容错'
              : '部分匹配模式：智能化，高容错'
          }
          description={
            localConfig.mode === 'exact' 
              ? '只有完全匹配的文本才会被选中，适合对准确性要求极高的场景'
              : '启用智能算法进行文本匹配，能够处理同义词、反义词等复杂情况'
          }
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 智能功能配置 */}
      {localConfig.enabled && localConfig.mode === 'partial' && (
        <>
          <Divider />
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text strong style={{ color: 'var(--text-1, #1f2937)' }}>
              智能功能配置
            </Text>
            
            <Row gutter={16}>
              <Col span={12}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space>
                    <Switch
                      size="small"
                      checked={localConfig.antonymCheckEnabled}
                      onChange={(antonymCheckEnabled) => 
                        handleConfigChange({ antonymCheckEnabled })
                      }
                    />
                    <Text style={{ color: 'var(--text-1, #1f2937)' }}>
                      反义词检测
                    </Text>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 11, color: 'var(--text-3, #6b7280)' }}>
                    检测文本中的反义词对，避免误选
                  </Text>
                </Space>
              </Col>
              <Col span={12}>
                {renderStatusIndicator(localConfig.antonymCheckEnabled, '反义词检测')}
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space>
                    <Switch
                      size="small"
                      checked={localConfig.semanticAnalysisEnabled}
                      onChange={(semanticAnalysisEnabled) => 
                        handleConfigChange({ semanticAnalysisEnabled })
                      }
                    />
                    <Text style={{ color: 'var(--text-1, #1f2937)' }}>
                      语义分析
                    </Text>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 11, color: 'var(--text-3, #6b7280)' }}>
                    分析文本语义，提供更智能的匹配
                  </Text>
                </Space>
              </Col>
              <Col span={12}>
                {renderStatusIndicator(localConfig.semanticAnalysisEnabled, '语义分析')}
              </Col>
            </Row>
          </Space>
        </>
      )}

      {/* 操作按钮 */}
      <Divider />
      <Space>
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={() => {
            // 这里可以添加保存配置的逻辑
            console.log('保存文本匹配配置:', localConfig);
          }}
        >
          保存配置
        </Button>
        <Button
          onClick={() => {
            // 重置为默认配置
            const defaultConfig: TextMatchingConfig = {
              enabled: true,
              mode: 'partial',
              antonymCheckEnabled: true,
              semanticAnalysisEnabled: true,
              partialMatchThreshold: 0.8
            };
            handleConfigChange(defaultConfig);
          }}
        >
          重置默认
        </Button>
      </Space>
    </Card>
  );
};

// 默认配置
export const defaultTextMatchingConfig: TextMatchingConfig = {
  enabled: true,
  mode: 'partial',
  antonymCheckEnabled: true,
  semanticAnalysisEnabled: true,
  partialMatchThreshold: 0.8
};

// Hook for using text matching config
export const useTextMatchingConfig = () => {
  const [config, setConfig] = useState<TextMatchingConfig>(defaultTextMatchingConfig);

  const updateConfig = (updates: Partial<TextMatchingConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const resetConfig = () => {
    setConfig(defaultTextMatchingConfig);
  };

  return {
    config,
    setConfig,
    updateConfig,
    resetConfig
  };
};