// src/components/smart-selection/SmartSelectionConfigPanel.tsx
// module: components | layer: ui | role: 智能选择配置面板
// summary: 三条执行链 × 五种选择模式的UI控制面板

import React, { useState } from 'react';
import { Card, Select, Space, Input, InputNumber, Switch, Tooltip, Alert, Badge } from 'antd';
import { BulbOutlined, RocketOutlined, ExperimentOutlined, ThunderboltOutlined } from '@ant-design/icons';
import type { ExecutionChain, SelectionMode } from '../../types/smartSelection';

export interface SmartSelectionConfig {
  executionChain: ExecutionChain;
  selectionMode: SelectionMode;
  containerXPath: string;
  i18nAliases: string[];
  targetText?: string;
  minConfidence?: number;
  batchConfig?: {
    maxPerSession: number;
    intervalMs: number;
    jitterMs: number;
  };
}

export interface SmartSelectionConfigPanelProps {
  config: SmartSelectionConfig;
  onChange: (config: SmartSelectionConfig) => void;
  size?: 'small' | 'middle';
}

export const SmartSelectionConfigPanel: React.FC<SmartSelectionConfigPanelProps> = ({
  config,
  onChange,
  size = 'middle'
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 执行链选项配置
  const executionChainOptions = [
    {
      value: 'intelligent_chain',
      label: (
        <Space>
          <RocketOutlined style={{ color: '#1890ff' }} />
          智能自动链
          <Badge count="推荐" size="small" style={{ backgroundColor: '#52c41a' }} />
        </Space>
      ),
      description: '语义分析 + 自动化流程，最稳定可靠'
    },
    {
      value: 'single_step', 
      label: (
        <Space>
          <ExperimentOutlined style={{ color: '#fa8c16' }} />
          智能单步
        </Space>
      ),
      description: '调试验证 + 精确控制，适合测试'
    },
    {
      value: 'static_strategy',
      label: (
        <Space>
          <ThunderboltOutlined style={{ color: '#722ed1' }} />
          静态策略
        </Space>
      ),
      description: '高性能静态XPath，适合高频操作'
    }
  ];

  // 选择模式选项（根据执行链动态推荐）
  const getSelectionModeOptions = (chain: ExecutionChain) => {
    const baseOptions = [
      {
        value: 'first',
        label: '第一个',
        recommended: chain === 'single_step' || chain === 'static_strategy'
      },
      {
        value: 'last', 
        label: '最后一个',
        recommended: false
      },
      {
        value: 'match_original',
        label: '精确匹配',
        recommended: chain === 'intelligent_chain',
        requiresFingerprint: true
      },
      {
        value: 'random',
        label: '随机选择', 
        recommended: false
      },
      {
        value: 'all',
        label: '批量全部',
        recommended: chain === 'intelligent_chain',
        isBatch: true
      }
    ];

    return baseOptions.map(option => ({
      ...option,
      label: (
        <Space>
          {option.label}
          {option.recommended && <Badge count="推荐" size="small" style={{ backgroundColor: '#52c41a' }} />}
          {option.requiresFingerprint && <Badge count="需指纹" size="small" style={{ backgroundColor: '#fa8c16' }} />}
          {option.isBatch && <Badge count="批量" size="small" style={{ backgroundColor: '#1890ff' }} />}
        </Space>
      ),
      disabled: option.requiresFingerprint && !config.fingerprint
    }));
  };

  // 获取组合推荐说明
  const getCombinationRecommendation = (chain: ExecutionChain, mode: SelectionMode) => {
    const recommendations = {
      'intelligent_chain': {
        'match_original': { level: 'excellent', text: '🔥 最佳组合：稳定可靠，支持指纹匹配' },
        'all': { level: 'excellent', text: '🚀 批量首选：一次dump高效处理' },
        'first': { level: 'good', text: '✅ 稳妥选择：语义分析后取首个' },
        'last': { level: 'good', text: '✅ 适用：语义分析后取末个' },
        'random': { level: 'warning', text: '⚠️ 少用：随机性可能影响稳定性' }
      },
      'single_step': {
        'first': { level: 'excellent', text: '⭐ 默认推荐：调试验证的最佳选择' },
        'match_original': { level: 'good', text: '✅ 有指纹时可用：精确重现' },
        'last': { level: 'normal', text: '✅ 可用：调试时查看末尾元素' },
        'random': { level: 'normal', text: '✅ 测试用：验证随机性' },
        'all': { level: 'warning', text: '⚠️ 调试慎用：批量操作影响测试' }
      },
      'static_strategy': {
        'first': { level: 'excellent', text: '⭐ 默认推荐：高性能直接取首个' },
        'all': { level: 'good', text: '✅ 高频批量：配合轻校验使用' },
        'match_original': { level: 'warning', text: '⚠️ 有指纹才建议：否则别用' },
        'last': { level: 'normal', text: '✅ 可用：静态获取末尾' },
        'random': { level: 'normal', text: '✅ 可用：简单随机选择' }
      }
    };

    return recommendations[chain]?.[mode.type] || { level: 'normal', text: '✅ 可用组合' };
  };

  const handleChainChange = (chain: ExecutionChain) => {
    // 智能切换推荐模式
    let recommendedMode: SelectionMode;
    switch (chain) {
      case 'intelligent_chain':
        recommendedMode = config.fingerprint 
          ? { type: 'match_original', min_confidence: 0.8, fallback_to_first: true }
          : { type: 'first' };
        break;
      case 'single_step':
      case 'static_strategy':
      default:
        recommendedMode = { type: 'first' };
        break;
    }

    onChange({
      ...config,
      executionChain: chain,
      selectionMode: recommendedMode
    });
  };

  const handleModeChange = (modeType: string) => {
    let newMode: SelectionMode;
    
    switch (modeType) {
      case 'match_original':
        newMode = {
          type: 'match_original',
          min_confidence: config.selectionMode.min_confidence || 0.8,
          fallback_to_first: true
        };
        break;
      case 'random':
        newMode = {
          type: 'random', 
          seed: Date.now(),
          ensure_stable_sort: true
        };
        break;
      case 'all':
        newMode = {
          type: 'all',
          batch_config: config.batchConfig || {
            maxPerSession: 10,
            intervalMs: 2000,
            jitterMs: 500
          }
        };
        break;
      case 'first':
      case 'last':
      default:
        newMode = { type: modeType as 'first' | 'last' };
        break;
    }

    onChange({
      ...config,
      selectionMode: newMode
    });
  };

  const recommendation = getCombinationRecommendation(config.executionChain, config.selectionMode);

  return (
    <div className="light-theme-force">
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        
        {/* 核心配置区 */}
        <Card 
          title={<Space><BulbOutlined />智能选择配置</Space>} 
          size={size}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            
            {/* 执行链选择 */}
            <div>
              <label style={{ fontWeight: 500, marginBottom: 4, display: 'block' }}>
                执行链类型
              </label>
              <Select
                value={config.executionChain}
                onChange={handleChainChange}
                style={{ width: '100%' }}
                size={size}
                options={executionChainOptions}
              />
            </div>

            {/* 选择模式 */}
            <div>
              <label style={{ fontWeight: 500, marginBottom: 4, display: 'block' }}>
                选择模式
              </label>
              <Select
                value={config.selectionMode.type}
                onChange={handleModeChange}
                style={{ width: '100%' }}
                size={size}
                options={getSelectionModeOptions(config.executionChain)}
              />
            </div>

            {/* 组合推荐提示 */}
            <Alert
              message={recommendation.text}
              type={
                recommendation.level === 'excellent' ? 'success' :
                recommendation.level === 'good' ? 'info' :
                recommendation.level === 'warning' ? 'warning' : 'info'
              }
              showIcon
              size="small"
            />

            {/* 必填参数 */}
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input
                placeholder="容器XPath（必填）*"
                value={config.containerXPath}
                onChange={(e) => onChange({...config, containerXPath: e.target.value})}
                status={!config.containerXPath ? 'error' : ''}
                size={size}
              />
              <Input
                placeholder="多语言别名（用|分隔）*"
                value={config.i18nAliases.join('|')}
                onChange={(e) => onChange({
                  ...config, 
                  i18nAliases: e.target.value.split('|').filter(Boolean)
                })}
                status={!config.i18nAliases.length ? 'error' : ''}
                size={size}
              />
            </Space>

          </Space>
        </Card>

        {/* 模式特定参数 */}
        {config.selectionMode.type === 'match_original' && (
          <Card title="精确匹配参数" size={size}>
            <Space>
              <Tooltip title="匹配置信度阈值">
                <InputNumber
                  placeholder="置信度"
                  value={config.selectionMode.min_confidence}
                  onChange={(val) => onChange({
                    ...config,
                    selectionMode: {
                      ...config.selectionMode,
                      min_confidence: val || 0.8
                    }
                  })}
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  size={size}
                />
              </Tooltip>
              <Switch
                checked={config.selectionMode.fallback_to_first}
                onChange={(checked) => onChange({
                  ...config,
                  selectionMode: {
                    ...config.selectionMode,
                    fallback_to_first: checked
                  }
                })}
                checkedChildren="失败降级"
                unCheckedChildren="严格匹配"
                size={size}
              />
            </Space>
          </Card>
        )}

        {config.selectionMode.type === 'all' && (
          <Card title="批量执行配置" size={size}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <InputNumber
                  placeholder="单次上限"
                  value={config.batchConfig?.maxPerSession}
                  onChange={(val) => onChange({
                    ...config,
                    batchConfig: {
                      ...config.batchConfig!,
                      maxPerSession: val || 10
                    }
                  })}
                  min={1}
                  max={100}
                  size={size}
                />
                <InputNumber
                  placeholder="间隔(ms)"
                  value={config.batchConfig?.intervalMs}
                  onChange={(val) => onChange({
                    ...config,
                    batchConfig: {
                      ...config.batchConfig!,
                      intervalMs: val || 2000
                    }
                  })}
                  min={500}
                  max={10000}
                  size={size}
                />
                <InputNumber
                  placeholder="抖动(ms)"
                  value={config.batchConfig?.jitterMs}
                  onChange={(val) => onChange({
                    ...config,
                    batchConfig: {
                      ...config.batchConfig!,
                      jitterMs: val || 500
                    }
                  })}
                  min={0}
                  max={2000}
                  size={size}
                />
              </Space>
            </Space>
          </Card>
        )}

        {/* 高级选项 */}
        <Card 
          title={
            <Space>
              高级选项
              <Switch
                size="small"
                checked={showAdvanced}
                onChange={setShowAdvanced}
                checkedChildren="显示"
                unCheckedChildren="隐藏"
              />
            </Space>
          }
          size={size}
          style={{ display: showAdvanced ? 'block' : 'none' }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input
              placeholder="目标文本（可选）"
              value={config.targetText}
              onChange={(e) => onChange({...config, targetText: e.target.value})}
              size={size}
            />
            <InputNumber
              placeholder="最低置信度"
              value={config.minConfidence}
              onChange={(val) => onChange({...config, minConfidence: val})}
              min={0.1}
              max={1.0}
              step={0.1}
              size={size}
            />
          </Space>
        </Card>

      </Space>
    </div>
  );
};