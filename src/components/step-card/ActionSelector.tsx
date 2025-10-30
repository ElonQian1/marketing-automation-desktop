// src/components/step-card/ActionSelector.tsx
// module: ui | layer: components | role: 动作选择器
// summary: 步骤卡片中的动作类型选择组件

import React, { useState } from 'react';
import { Segmented, Space, InputNumber, Input, Select, Dropdown, Button, Switch, Tooltip, Collapse, Modal } from 'antd';
import { PlayCircleOutlined, CaretRightOutlined, EditOutlined, BulbOutlined, DownOutlined } from '@ant-design/icons';
import type { ActionKind, StepAction } from '../../types/smartScript';
import { ExcludeRuleEditor, type ExcludeRule } from '../smart-selection/ExcludeRuleEditor';
import { CandidatePreview } from '../smart-selection/CandidatePreview';
import { ExplanationGenerator } from '../smart-selection/ExplanationGenerator';

const { Panel } = Collapse;

export interface ActionSelectorProps {
  action?: StepAction;
  onChange: (action: StepAction) => void;
  size?: 'small' | 'middle';
}

export const ActionSelector: React.FC<ActionSelectorProps> = ({
  action = { kind: 'tap' },
  onChange,
  size = 'small'
}) => {
  // 🎯 智能操作配置状态
  type ExecutionChain = 'intelligent_chain' | 'single_step' | 'static_strategy';
  type SelectionMode = 'auto' | 'first' | 'last' | 'match-original' | 'random' | 'all';
  
  const [smartConfig, setSmartConfig] = useState({
    executionChain: 'intelligent_chain' as ExecutionChain,
    selectionMode: 'auto' as SelectionMode,
    operationType: 'tap' as ActionKind
  });

  // 🔧 高级规则编辑器状态
  const [advancedExpanded, setAdvancedExpanded] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  const handleKindChange = (kind: ActionKind) => {
    const newAction: StepAction = {
      ...action,
      kind,
      params: getDefaultParamsForKind(kind)
    };
    onChange(newAction);
  };

  const handleParamChange = (key: string, value: unknown) => {
    const newAction: StepAction = {
      ...action,
      params: {
        ...action.params,
        [key]: value
      }
    };
    onChange(newAction);
  };

  const getDefaultParamsForKind = (kind: ActionKind) => {
    switch (kind) {
      case 'tap':
        return { tapOffset: { x: 0.5, y: 0.5 } };
      case 'long_press':
        return { tapOffset: { x: 0.5, y: 0.5 }, durationMs: 2000 };
      case 'double_tap':
        return { tapOffset: { x: 0.5, y: 0.5 }, durationMs: 100 };
      case 'swipe':
        return { 
          swipe: { 
            direction: 'up' as const, 
            distancePx: 200, 
            durationMs: 300 
          } 
        };
      case 'input':
        return { text: '', clearBefore: true };
      case 'wait':
        return { waitMs: 1000 };
      case 'smart_selection':
        return { 
          smartSelection: {
            // 🔥 默认执行链：智能自动链
            executionChain: 'intelligent_chain' as const,
            mode: 'first' as const,
            targetText: '关注',
            minConfidence: 0.8,
            // 🆕 必填字段
            containerXPath: '//android.widget.RecyclerView',  // 默认容器
            i18nAliases: ['关注', '+关注', 'Follow', 'Following'],  // 默认多语言
            plan: [  // 默认回退计划（至少2条）
              {
                id: 'fallback_1',
                strategy: 'region_text_to_parent' as const,
                description: '容器+文本查找可点父元素',
                timeBudgetMs: 200,
                priority: 1
              },
              {
                id: 'fallback_2', 
                strategy: 'absolute_xpath' as const,
                description: '绝对XPath兜底',
                timeBudgetMs: 100,
                priority: 2
              }
            ],
            // 增强批量配置
            batchConfigV2: {
              intervalMs: 2000,
              jitterMs: 500,           // 抖动
              maxPerSession: 10,       // 单次上限
              cooldownMs: 5000,        // 冷却时间
              continueOnError: true,
              showProgress: true,
              refreshPolicy: 'on_mutation' as const,  // UI变化时重新dump
              requeryByFingerprint: true,  // 指纹重查找
              forceLightValidation: true   // 强制轻校验
            }
          }
        };
      default:
        return {};
    }
  };

  const renderParams = () => {
    const { kind, params = {} } = action;

    switch (kind) {
      case 'tap':
      case 'long_press':
      case 'double_tap':
        return (
          <Space size="small">
            <Select
              value={getTapOffsetPreset(params.tapOffset)}
              onChange={(preset) => handleTapOffsetChange(preset, params.tapOffset)}
              size={size}
              style={{ width: 80 }}
              options={[
                { value: 'center', label: '中心' },
                { value: 'tl', label: '左上' },
                { value: 'custom', label: '自定义' }
              ]}
            />
            {kind === 'long_press' && (
              <InputNumber
                value={params.durationMs || 2000}
                onChange={(val) => handleParamChange('durationMs', val)}
                size={size}
                style={{ width: 80 }}
                placeholder="时长"
                addonAfter="ms"
                min={100}
                max={10000}
              />
            )}
          </Space>
        );

      case 'swipe':
        return (
          <Space size="small">
            <Select
              value={params.swipe?.direction || 'up'}
              onChange={(direction) => handleParamChange('swipe', {
                ...params.swipe,
                direction
              })}
              size={size}
              style={{ width: 60 }}
              options={[
                { value: 'up', label: '↑' },
                { value: 'down', label: '↓' },
                { value: 'left', label: '←' },
                { value: 'right', label: '→' }
              ]}
            />
            <InputNumber
              value={params.swipe?.distancePx || 200}
              onChange={(val) => handleParamChange('swipe', {
                ...params.swipe,
                distancePx: val
              })}
              size={size}
              style={{ width: 70 }}
              placeholder="距离"
              addonAfter="px"
              min={50}
              max={1000}
            />
          </Space>
        );

      case 'input':
        return (
          <Input
            value={params.text || ''}
            onChange={(e) => handleParamChange('text', e.target.value)}
            size={size}
            style={{ width: 120 }}
            placeholder="输入文本"
          />
        );

      case 'wait':
        return (
          <InputNumber
            value={params.waitMs || 1000}
            onChange={(val) => handleParamChange('waitMs', val)}
            size={size}
            style={{ width: 80 }}
            placeholder="等待"
            addonAfter="ms"
            min={100}
            max={30000}
          />
        );

      case 'smart_selection':
        return (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {/* 🎯 选择模式 - 5种智能选择策略 */}
            <Space size="small" wrap>
              <Select
                value={params.smartSelection?.mode || 'first'}
                onChange={(mode) => handleParamChange('smartSelection', {
                  ...params.smartSelection,
                  mode
                })}
                size={size}
                style={{ width: 120, fontWeight: 'bold' }}
                placeholder="选择模式"
                options={[
                  { value: 'first', label: '🎯第一个', desc: '选择第一个匹配元素' },
                  { value: 'last', label: '🎯最后一个', desc: '选择最后一个匹配元素' },
                  { value: 'match-original', label: '🔍精确匹配', desc: '基于指纹精确匹配' },
                  { value: 'random', label: '🎲随机选择', desc: '随机选择一个元素' },
                  { value: 'all', label: '📋批量全部', desc: '批量操作所有元素' }
                ]}
                showSearch
                optionFilterProp="label"
              />
              {/* 模式说明 */}
              <span style={{ 
                fontSize: '11px', 
                color: '#666',
                padding: '0 4px'
              }}>
                {(() => {
                  const mode = params.smartSelection?.mode || 'first';
                  const descriptions = {
                    'first': '📌 第一个匹配元素',
                    'last': '📌 最后一个匹配元素', 
                    'match-original': '� 基于指纹精确匹配',
                    'random': '📌 随机选择一个',
                    'all': '� 批量操作全部'
                  };
                  return descriptions[mode as keyof typeof descriptions];
                })()}
              </span>
            </Space>
            
            {/* 基础配置行 */}
            <Space size="small" wrap>
              <Input
                value={params.smartSelection?.targetText || ''}
                onChange={(e) => handleParamChange('smartSelection', {
                  ...params.smartSelection,
                  targetText: e.target.value
                })}
                size={size}
                style={{ width: 80 }}
                placeholder="目标文本"
              />
              <InputNumber
                value={params.smartSelection?.minConfidence || 0.8}
                onChange={(val) => handleParamChange('smartSelection', {
                  ...params.smartSelection,
                  minConfidence: val
                })}
                size={size}
                style={{ width: 60 }}
                placeholder="置信度"
                min={0.1}
                max={1.0}
                step={0.1}
              />
            </Space>
            
            {/* 🆕 必填字段行 */}
            <Space size="small" wrap>
              <Input
                value={params.smartSelection?.containerXPath || ''}
                onChange={(e) => handleParamChange('smartSelection', {
                  ...params.smartSelection,
                  containerXPath: e.target.value
                })}
                size={size}
                style={{ width: 120 }}
                placeholder="容器XPath*"
                status={!params.smartSelection?.containerXPath ? 'error' : ''}
              />
              <Input
                value={params.smartSelection?.i18nAliases?.join('|') || ''}
                onChange={(e) => handleParamChange('smartSelection', {
                  ...params.smartSelection,
                  i18nAliases: e.target.value.split('|').filter(Boolean)
                })}
                size={size}
                style={{ width: 120 }}
                placeholder="多语言别名*"
                status={!params.smartSelection?.i18nAliases?.length ? 'error' : ''}
              />
            </Space>

            {/* 🔥 新功能配置区 */}
            <div style={{
              marginTop: '8px',
              padding: '8px',
              background: 'rgba(110, 139, 255, 0.05)',
              borderRadius: '4px',
              border: '1px dashed rgba(110, 139, 255, 0.3)'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#6E8BFF' }}>
                🔥 高级功能（新）
              </div>
              
              {/* 🆕 自动排除开关 */}
              <Space size="small" wrap style={{ marginBottom: '8px', padding: '6px', background: '#f0f7ff', borderRadius: '4px' }}>
                <span style={{ fontSize: '11px', color: '#1890ff', fontWeight: 600 }}>🤖 自动排除：</span>
                <Switch
                  checked={params.smartSelection?.autoExcludeEnabled !== false}
                  onChange={(checked) => handleParamChange('smartSelection', {
                    ...params.smartSelection,
                    autoExcludeEnabled: checked
                  })}
                  size="small"
                />
                <span style={{ fontSize: '10px', color: '#1890ff' }}>
                  {params.smartSelection?.autoExcludeEnabled !== false ? '✅ 已启用' : '❌ 已关闭'}
                </span>
                <Tooltip title='自动排除"已关注/Following/互相关注"等常见状态，零配置覆盖80%场景'>
                  <span style={{ fontSize: '10px', color: '#999', cursor: 'help' }}>（已关注/Following/互关...）</span>
                </Tooltip>
              </Space>
              
              {/* 手动排除 */}
              <Space size="small" wrap style={{ marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: '#666' }}>🚫 手动排除：</span>
                <Input
                  value={params.smartSelection?.excludeText?.join('|') || ''}
                  onChange={(e) => handleParamChange('smartSelection', {
                    ...params.smartSelection,
                    excludeText: e.target.value.split('|').filter(Boolean)
                  })}
                  size="small"
                  style={{ width: 200 }}
                  placeholder="特殊文案（可选）"
                />
                <span style={{ fontSize: '10px', color: '#999' }}>（补充自定义规则）</span>
              </Space>
              
              {/* 去重开关 */}
              <Space size="small" wrap style={{ marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: '#666' }}>🔄 去重：</span>
                <InputNumber
                  value={params.smartSelection?.dedupeTolerance || 10}
                  onChange={(val) => handleParamChange('smartSelection', {
                    ...params.smartSelection,
                    dedupeTolerance: val
                  })}
                  size="small"
                  style={{ width: 80 }}
                  placeholder="容差"
                  addonAfter="px"
                  min={5}
                  max={50}
                />
                <span style={{ fontSize: '10px', color: '#999' }}>（位置容差）</span>
              </Space>
              
              {/* 轻校验开关 */}
              <Space size="small" wrap>
                <span style={{ fontSize: '11px', color: '#666' }}>✅ 轻校验：</span>
                <Select
                  value={params.smartSelection?.enableLightValidation !== false}
                  onChange={(val) => handleParamChange('smartSelection', {
                    ...params.smartSelection,
                    enableLightValidation: val
                  })}
                  size="small"
                  style={{ width: 80 }}
                  options={[
                    { value: true, label: '开启' },
                    { value: false, label: '关闭' }
                  ]}
                />
                <span style={{ fontSize: '10px', color: '#999' }}>（点击后验证状态变化）</span>
              </Space>
            </div>

            {/* 🎯 智能推荐提示 */}
            <div style={{ 
              fontSize: '12px', 
              color: getModeRecommendationColor(params.smartSelection?.mode),
              padding: '4px 8px',
              background: '#f0f0f0',
              borderRadius: '4px',
              border: '1px solid #d9d9d9'
            }}>
              💡 {getModeRecommendationText(params.smartSelection?.mode)}
            </div>

            {/* 🔧 高级规则编辑器（折叠面板） */}
            <Collapse 
              activeKey={advancedExpanded ? ['1'] : []}
              onChange={(keys) => setAdvancedExpanded(keys.includes('1'))}
              style={{ marginTop: '8px' }}
              size="small"
            >
              <Panel 
                header={
                  <Space size="small">
                    <span style={{ fontSize: '12px', fontWeight: 500 }}>🔧 高级规则编辑器</span>
                    <span style={{ fontSize: '10px', color: '#999' }}>（可视化规则管理 + 预览）</span>
                  </Space>
                }
                key="1"
              >
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {/* 规则编辑器 */}
                  <ExcludeRuleEditor
                    rules={parseExcludeTextToRules(params.smartSelection?.excludeText || '')}
                    onChange={(rules) => {
                      handleParamChange('smartSelection', {
                        ...params.smartSelection,
                        excludeText: formatRulesToExcludeText(rules)
                      });
                    }}
                    onTest={async (rule) => {
                      // TODO: 实现测试功能，调用 Tauri 后端预览
                      console.log('测试规则:', rule);
                      return 0; // 暂时返回 0 个匹配
                    }}
                  />

                  {/* 预览和说明 */}
                  <Space size="small" style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Button 
                      size="small" 
                      type="primary"
                      onClick={() => setPreviewVisible(true)}
                    >
                      📋 预览候选元素
                    </Button>
                    
                    <ExplanationGenerator
                      config={{
                        mode: normalizeMode(params.smartSelection?.mode),
                        autoExcludeEnabled: params.smartSelection?.autoExcludeEnabled !== false,
                        excludeRules: parseExcludeTextToRules(params.smartSelection?.excludeText),
                        dedupeTolerance: params.smartSelection?.dedupeTolerance,
                        enableLightValidation: params.smartSelection?.enableLightValidation !== false
                      }}
                      compact={true}
                    />
                  </Space>

                  {/* 完整说明（可选展开） */}
                  <ExplanationGenerator
                    config={{
                      mode: normalizeMode(params.smartSelection?.mode),
                      autoExcludeEnabled: params.smartSelection?.autoExcludeEnabled !== false,
                      excludeRules: parseExcludeTextToRules(params.smartSelection?.excludeText),
                      dedupeTolerance: params.smartSelection?.dedupeTolerance,
                      enableLightValidation: params.smartSelection?.enableLightValidation !== false
                    }}
                    compact={false}
                  />
                </Space>
              </Panel>
            </Collapse>

            {/* 预览模态框 */}
            <Modal
              title="📋 候选元素预览"
              open={previewVisible}
              onCancel={() => setPreviewVisible(false)}
              width={900}
              footer={null}
            >
              <CandidatePreview
                candidates={[]} // TODO: 从 Tauri 后端获取真实数据
              />
            </Modal>
          </Space>
        );

      default:
        return null;
    }
  };

  const getTapOffsetPreset = (offset?: { x: number; y: number }) => {
    if (!offset) return 'center';
    if (offset.x === 0.5 && offset.y === 0.5) return 'center';
    if (offset.x === 0.1 && offset.y === 0.1) return 'tl';
    return 'custom';
  };

  const handleTapOffsetChange = (preset: string, currentOffset?: { x: number; y: number }) => {
    let newOffset;
    switch (preset) {
      case 'center':
        newOffset = { x: 0.5, y: 0.5 };
        break;
      case 'tl':
        newOffset = { x: 0.1, y: 0.1 };
        break;
      default:
        newOffset = currentOffset || { x: 0.5, y: 0.5 };
        break;
    }
    handleParamChange('tapOffset', newOffset);
  };

  // 🔧 规则转换辅助函数
  const parseExcludeTextToRules = (excludeText: string | string[] | undefined): ExcludeRule[] => {
    if (!excludeText) return [];
    const textArray = Array.isArray(excludeText) ? excludeText : [excludeText];
    
    return textArray.map((text, index) => {
      // 简单解析：假设格式为 "属性:操作:值"
      const parts = text.split(':');
      if (parts.length === 3) {
        return {
          id: `rule-${index}`,
          attr: parts[0] as 'text' | 'content-desc' | 'resource-id' | 'class',
          op: parts[1] as 'equals' | 'contains' | 'regex',
          value: parts[2],
          enabled: true
        };
      }
      // 默认为文本包含
      return {
        id: `rule-${index}`,
        attr: 'text',
        op: 'contains',
        value: text,
        enabled: true
      };
    });
  };

  const formatRulesToExcludeText = (rules: ExcludeRule[]): string[] => {
    return rules
      .filter(r => r.enabled !== false)
      .map(r => `${r.attr}:${r.op}:${r.value}`);
  };

  // 🔄 规范化 mode 类型
  const normalizeMode = (mode?: string): 'manual' | 'auto' | 'first' | 'last' | 'all' => {
    // 将 'match-original' 和 'random' 映射到合法类型
    if (mode === 'match-original') return 'first'; // 匹配原始元素视为 first
    if (mode === 'random') return 'auto'; // 随机模式视为 auto
    if (mode === 'manual' || mode === 'auto' || mode === 'first' || mode === 'last' || mode === 'all') {
      return mode;
    }
    return 'auto'; // 默认 auto
  };



  // � 获取模式推荐文本
  const getModeRecommendationText = (mode?: string) => {
    const modeRecommendations = {
      'first': '⭐ 推荐：稳定可靠的默认选择',
      'match-original': '🔍 精确：需要指纹数据支持', 
      'last': '✅ 可用：选择最后一个匹配元素',
      'random': '⚠️ 谨慎：随机性可能影响稳定性',
      'all': '🚀 批量：高效处理多个元素'
    };
    return modeRecommendations[mode as keyof typeof modeRecommendations] || '选择匹配模式';
  };

  // 🎨 获取模式推荐颜色
  const getModeRecommendationColor = (mode?: string) => {
    const colorMap = {
      'first': '#52c41a',        // 绿色-推荐
      'match-original': '#1890ff', // 蓝色-精确
      'last': '#666666',         // 灰色-普通  
      'random': '#fa8c16',       // 橙色-警告
      'all': '#722ed1'           // 紫色-批量
    };
    return colorMap[mode as keyof typeof colorMap] || '#666666';
  };

  // 🎯 执行链选择菜单
  const getExecutionChainMenu = () => {
    const executionChains = [
      { key: 'intelligent_chain', label: '智能·自动链', icon: '🧠', desc: 'Step1→Step6 动态决策，自动回退兜底' },
      { key: 'single_step', label: '智能·单步', icon: '🎯', desc: '指定某一步强制使用' },
      { 
        key: 'static_strategy', 
        label: '静态策略', 
        icon: '📌', 
        desc: '用户保存/自建的固定策略',
        children: [
          { key: 'structural_matching', label: '结构匹配', icon: '🏗️', desc: '基于元素结构相似度匹配' },
          { key: 'xpath_recovery', label: 'XPath恢复', icon: '🔧', desc: '智能恢复损坏的XPath' },
        ]
      }
    ];

    return {
      items: executionChains.map(chain => {
        const baseItem = {
          key: chain.key,
          label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '200px' }}>
              <span>{chain.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontWeight: smartConfig.executionChain === chain.key ? '600' : '400',
                  color: smartConfig.executionChain === chain.key ? '#6E8BFF' : 'inherit'
                }}>
                  {chain.label}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                  {chain.desc}
                </div>
              </div>
              <span style={{ 
                color: smartConfig.executionChain === chain.key ? '#10B981' : '#64748B' 
              }}>
                {smartConfig.executionChain === chain.key ? '✅' : '○'}
              </span>
            </div>
          ),
          onClick: chain.children ? undefined : () => setSmartConfig(prev => ({ ...prev, executionChain: chain.key as ExecutionChain }))
        };

        // 如果有子菜单
        if (chain.children) {
          return {
            ...baseItem,
            children: chain.children.map(sub => ({
              key: sub.key,
              label: (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '180px' }}>
                  <span>{sub.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div>{sub.label}</div>
                    <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>
                      {sub.desc}
                    </div>
                  </div>
                </div>
              ),
              onClick: () => {
                // TODO: 打开对应的配置模态框
                console.log(`📌 [ActionSelector] 选择静态策略: ${sub.key}`);
              }
            }))
          };
        }

        return baseItem;
      })
    };
  };

  // 🎯 选择模式菜单
  const getSelectionModeMenu = () => {
    const selectionModes = [
      { key: 'auto', label: '智能自适应', icon: '🎯', desc: '1个→精确匹配，多个→批量处理' },
      { key: 'first', label: '第一个', icon: '🎯', desc: '选择第一个匹配元素' },
      { key: 'last', label: '最后一个', icon: '🎯', desc: '选择最后一个匹配元素' },
      { key: 'match-original', label: '精确匹配', icon: '🔍', desc: '基于指纹精确匹配' },
      { key: 'random', label: '随机选择', icon: '🎲', desc: '随机选择一个元素' },
      { key: 'all', label: '批量全部', icon: '📋', desc: '批量操作所有元素' }
    ];

    return {
      items: selectionModes.map(mode => ({
        key: mode.key,
        label: (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '180px' }}>
            <span>{mode.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontWeight: smartConfig.selectionMode === mode.key ? '600' : '400',
                color: smartConfig.selectionMode === mode.key ? '#6E8BFF' : 'inherit'
              }}>
                {mode.label}
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                {mode.desc}
              </div>
            </div>
            <span style={{ 
              color: smartConfig.selectionMode === mode.key ? '#10B981' : 'transparent' 
            }}>
              {smartConfig.selectionMode === mode.key ? '✓' : ''}
            </span>
          </div>
        ),
        onClick: () => {
          // 🎯 关键修复：将选择模式保存到 localStorage，供 StepExecutionGateway 使用
          localStorage.setItem('userSelectionMode', mode.key);
          console.log('🎯 [ActionSelector] 已保存选择模式到 localStorage:', mode.key);
          setSmartConfig(prev => ({ ...prev, selectionMode: mode.key as SelectionMode }));
        }
      }))
    };
  };

  // 🎯 操作方式菜单
  const getOperationTypeMenu = () => {
    const operationTypes = [
      { key: 'tap', label: '点击', icon: '👆', desc: '单次点击操作' },
      { key: 'long_press', label: '长按', icon: '⏸️', desc: '长时间按住操作' },
      { key: 'double_tap', label: '双击', icon: '👆👆', desc: '快速连续两次点击' },
      { key: 'swipe', label: '滑动', icon: '👉', desc: '滑动手势操作' },
      { key: 'input', label: '输入', icon: '⌨️', desc: '文本输入操作' },
      { key: 'wait', label: '等待', icon: '⏳', desc: '等待指定时间' }
    ];

    return {
      items: operationTypes.map(op => ({
        key: op.key,
        label: (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '160px' }}>
            <span>{op.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontWeight: smartConfig.operationType === op.key ? '600' : '400',
                color: smartConfig.operationType === op.key ? '#6E8BFF' : 'inherit'
              }}>
                {op.label}
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                {op.desc}
              </div>
            </div>
            <span style={{ 
              color: smartConfig.operationType === op.key ? '#10B981' : 'transparent' 
            }}>
              {smartConfig.operationType === op.key ? '✓' : ''}
            </span>
          </div>
        ),
        onClick: () => {
          setSmartConfig(prev => ({ ...prev, operationType: op.key as ActionKind }));
          handleKindChange(op.key as ActionKind);
        }
      }))
    };
  };

  return (
    <div>
      {/* 🎯 智能操作配置 - 三个独立按钮 */}
      <div style={{ 
        marginBottom: size === 'small' ? 6 : 8,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '6px',
        width: '100%'
      }}>
        {/* 执行链选择按钮 */}
        <Dropdown 
          menu={getExecutionChainMenu()} 
          trigger={['click']}
          placement="bottomLeft"
        >
          <Button
            size={size}
            style={{
              background: 'rgba(110, 139, 255, 0.1)',
              border: '1px solid rgba(110, 139, 255, 0.3)',
              color: 'rgb(248, 250, 252)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              minWidth: '140px'
            }}
          >
            <span>
              {smartConfig.executionChain === 'intelligent_chain' ? '🧠 智能·自动链' : 
               smartConfig.executionChain === 'single_step' ? '🎯 智能·单步' : 
               '📌 静态策略'}
            </span>
            <span style={{ color: 'rgb(16, 185, 129)', fontSize: '12px' }}>✅</span>
            <DownOutlined style={{ fontSize: '10px' }} />
          </Button>
        </Dropdown>

        {/* 选择模式按钮 */}
        <Dropdown 
          menu={getSelectionModeMenu()} 
          trigger={['click']}
          placement="bottomLeft"
        >
          <Button
            size={size}
            style={{
              background: 'rgba(110, 139, 255, 0.1)',
              border: '1px solid rgba(110, 139, 255, 0.3)',
              color: 'rgb(248, 250, 252)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              minWidth: '120px'
            }}
          >
            <span>
              {smartConfig.selectionMode === 'auto' ? '🎯 智能自适应' :
               smartConfig.selectionMode === 'first' ? '🎯 第一个' :
               smartConfig.selectionMode === 'last' ? '🎯 最后一个' :
               smartConfig.selectionMode === 'match-original' ? '🔍 精确匹配' :
               smartConfig.selectionMode === 'random' ? '🎲 随机选择' :
               smartConfig.selectionMode === 'all' ? '📋 批量全部' :
               '🔍 智能选择'}
            </span>
            {/* 模式特殊标识 */}
            {smartConfig.selectionMode === 'auto' ? (
              <span style={{ 
                color: 'rgb(34, 197, 94)', 
                fontSize: '10px',
                fontWeight: 'bold'
              }}>AUTO</span>
            ) : smartConfig.selectionMode === 'all' ? (
              <span style={{ 
                color: 'rgb(245, 158, 11)', 
                fontSize: '10px',
                fontWeight: 'bold'
              }}>BATCH</span>
            ) : (
              <span style={{ color: 'rgb(16, 185, 129)', fontSize: '12px' }}>✅</span>
            )}
            <DownOutlined style={{ fontSize: '10px' }} />
          </Button>
        </Dropdown>

        {/* 操作方式按钮 */}
        <Dropdown 
          menu={getOperationTypeMenu()} 
          trigger={['click']}
          placement="bottomLeft"
        >
          <Button
            size={size}
            style={{
              background: 'rgba(110, 139, 255, 0.1)',
              border: '1px solid rgba(110, 139, 255, 0.3)',
              color: 'rgb(248, 250, 252)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              minWidth: '100px'
            }}
          >
            <span>
              {smartConfig.operationType === 'tap' ? '👆 点击' :
               smartConfig.operationType === 'long_press' ? '⏸️ 长按' :
               smartConfig.operationType === 'double_tap' ? '👆👆 双击' :
               smartConfig.operationType === 'swipe' ? '👉 滑动' :
               smartConfig.operationType === 'input' ? '⌨️ 输入' :
               '⏳ 等待'}
            </span>
            <span style={{ color: 'rgb(16, 185, 129)', fontSize: '12px' }}>✅</span>
            <DownOutlined style={{ fontSize: '10px' }} />
          </Button>
        </Dropdown>
      </div>

      {/* 动作类型选择器 */}
      <div style={{ marginBottom: size === 'small' ? 4 : 8 }}>
        <Segmented
          value={action.kind}
          onChange={handleKindChange}
          size={size}
          options={[
            {
              label: '点选',
              value: 'tap',
              icon: <CaretRightOutlined />
            },
            {
              label: '长按',
              value: 'long_press',
              icon: <CaretRightOutlined />
            },
            {
              label: '滑动',
              value: 'swipe',
              icon: <PlayCircleOutlined />
            },
            {
              label: '输入',
              value: 'input',
              icon: <EditOutlined />
            },
            {
              label: '等待',
              value: 'wait',
              icon: <PlayCircleOutlined />
            },
            {
              label: '仅查找',
              value: 'find_only',
              icon: <PlayCircleOutlined />
            },
            {
              label: '智能选择',
              value: 'smart_selection',
              icon: <BulbOutlined />
            }
          ]}
        />
      </div>

      {/* 参数配置区 */}
      {action.kind !== 'find_only' && (
        <div>
          {renderParams()}
        </div>
      )}
    </div>
  );
};