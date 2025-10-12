// src/components/DraggableStepCard/components/StrategyControls.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Button, Popover } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { MatchingStrategyTag } from '../../step-card';
import type { MatchStrategy, MatchCriteria } from '../../universal-ui/views/grid-view/panels/node-detail';
import type { UiNode } from '../../universal-ui/views/grid-view/types';
import { StrategyConfigurator } from '../../universal-ui/views/grid-view/panels/node-detail';

/**
 * 🎯 【步骤卡片策略控制器】- Universal UI生成步骤卡片的策略显示和编辑
 * 
 * 📍 功能职责：
 * 1. 显示当前步骤的匹配策略标签（如 "匹配: XPath[1]"）
 * 2. 提供策略编辑按钮，点击弹出策略配置器
 * 3. 处理策略变更并更新步骤参数
 * 
 * 🔧 数据流程：
 * step.parameters.matching.strategy → MatchingStrategyTag → 显示策略标签
 * 用户点击"策略"按钮 → StrategyConfigurator → 修改策略 → onUpdate → 更新步骤参数
 * 
 * 🐛 常见问题排查：
 * 1. 问题：步骤卡片显示"匹配: 标准"而不是正确的策略
 *    解决：检查 step.parameters.matching.strategy 的值是否正确设置
 * 
 * 2. 问题：策略选择器中没有 XPath 策略选项
 *    解决：检查 MatchingStrategySelector.tsx 中的 STRATEGY_LIST 配置
 * 
 * 3. 问题：策略修改后不生效
 *    解决：检查 onUpdate 回调是否正确更新了步骤参数
 */
interface StrategyControlsProps {
  step: {
    id: string;
    parameters?: {
      matching?: {
        strategy?: string;
        fields?: string[];
        values?: Record<string, string>;
        includes?: Record<string, string>;
        excludes?: Record<string, string>;
        matchMode?: Record<string, string>;
        regexIncludes?: Record<string, string>;
        regexExcludes?: Record<string, string>;
      };
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  boundNode: UiNode | null;
  onUpdate: (nextParams: Record<string, unknown>) => void;
}

export const StrategyControls: React.FC<StrategyControlsProps> = ({ step, boundNode, onUpdate }) => {
  const matching = step.parameters?.matching;

  // 🎯 判断策略类型的工具函数
  const getStrategyInfo = (strategy: string | undefined) => {
    if (!strategy) return { type: 'unknown', icon: '❓', color: 'default', label: '未配置' };
    
    const intelligentStrategies = ['self-anchor', 'child-anchor', 'parent-clickable', 'region-scoped', 'neighbor-relative', 'index-fallback'];
    const staticStrategies = ['standard', 'strict', 'relaxed', 'absolute', 'positionless'];
    const xpathStrategies = ['xpath-direct', 'xpath-first-index', 'xpath-all-elements'];
    
    if (intelligentStrategies.includes(strategy)) {
      return { type: 'intelligent', icon: '🧠', color: 'blue', label: '智能策略' };
    } else if (staticStrategies.includes(strategy)) {
      return { type: 'static', icon: '⚙️', color: 'green', label: '静态策略' };
    } else if (xpathStrategies.includes(strategy)) {
      return { type: 'xpath', icon: '🔗', color: 'gold', label: 'XPath策略' };
    } else {
      return { type: 'custom', icon: '🔧', color: 'purple', label: '自定义策略' };
    }
  };

  const strategyInfo = getStrategyInfo(step.parameters?.matching?.strategy);

  // 🔧 【节点数据构建】- 为策略配置器准备节点数据
  // 优先使用 boundNode（来自XML快照），fallback到步骤参数
  const node: UiNode = ((): UiNode => {
    if (boundNode) return boundNode;
    const p = step.parameters || {};
    if (matching?.values) {
      return {
        tag: 'unknown', // 临时标签名
        attrs: {
          'resource-id': (matching.values['resource-id'] as string) || (p.resource_id as string) || '',
          'text': (matching.values['text'] as string) || (p.text as string) || '',
          'content-desc': (matching.values['content-desc'] as string) || (p.content_desc as string) || '',
          'class': (matching.values['class'] as string) || (p.class_name as string) || '',
          'bounds': (matching.values['bounds'] as string) || (p.bounds as string) || '',
          'package': (matching.values['package'] as string) || '',
          'checkable': (matching.values['checkable'] as string) || 'false',
          'clickable': (matching.values['clickable'] as string) || 'false',
          'enabled': (matching.values['enabled'] as string) || 'true',
          'focusable': (matching.values['focusable'] as string) || 'false',
          'scrollable': (matching.values['scrollable'] as string) || 'false',
          // 🆕 添加 index 信息，支持 XPath 索引策略
          'index': (matching.values['index'] as string) || (p.index as string) || '0',
        },
        children: [], // UiNode必需的children属性
      };
    }
    // 如果没有匹配信息，返回一个默认的UiNode
    return {
      tag: 'unknown',
      attrs: {},
      children: [],
    };
  })();

  // 🎯 【匹配条件构建】- 构建当前步骤的匹配条件对象
  // 如果没有匹配配置，默认使用 'standard' 策略
  const criteria: MatchCriteria = (() => {
    if (!matching) {
      return { strategy: 'standard' as MatchStrategy, fields: [], values: {}, includes: {}, excludes: {} } as MatchCriteria;
    }
    return {
      strategy: (matching.strategy || 'standard') as MatchStrategy,
      fields: matching.fields || [],
      values: matching.values || {},
      includes: matching.includes || {},
      excludes: matching.excludes || {},
      ...(matching.matchMode && { matchMode: matching.matchMode }),
      ...(matching.regexIncludes && { regexIncludes: matching.regexIncludes }),
      ...(matching.regexExcludes && { regexExcludes: matching.regexExcludes }),
    } as unknown as MatchCriteria;
  })();

  return (
    <div className="flex items-center gap-1">
      {/* 🏷️ 策略标签显示：显示当前步骤的匹配策略 */}
      <MatchingStrategyTag strategy={step.parameters?.matching?.strategy} small />
      
      {/* 🎯 策略类型指示器 */}
      {step.parameters?.matching?.strategy && (
        <span 
          className="text-xs px-1 rounded" 
          style={{ 
            backgroundColor: `var(--ant-color-${strategyInfo.color}-1, #f0f0f0)`,
            color: `var(--ant-color-${strategyInfo.color}-6, #666)`,
            border: `1px solid var(--ant-color-${strategyInfo.color}-3, #d9d9d9)`
          }}
          title={strategyInfo.label}
        >
          {strategyInfo.icon}
        </span>
      )}
      
      {/* ⚙️ 策略编辑按钮：点击弹出策略配置器 */}
      <Popover
        trigger={["click"]}
        placement="bottomRight"
        styles={{ body: { padding: 8, maxHeight: 440, overflowY: 'auto', width: 420 } }}
        content={
          <div onClick={(e) => e.stopPropagation()} style={{ minWidth: 360 }}>
            {/* 🎯 策略配置器：提供完整的策略选择和字段配置界面 */}
            <StrategyConfigurator
              node={node}
              criteria={criteria}
              onChange={(next) => {
                // 🔄 策略变更处理：合并新的匹配配置到步骤参数
                const prev = step.parameters?.matching || {};
                const nextParams = {
                  ...(step.parameters || {}),
                  matching: {
                    ...prev,
                    ...next,
                  },
                };
                onUpdate(nextParams);
              }}
            />
          </div>
        }
      >
        <Button
          size="small"
          type="default"
          icon={<SettingOutlined />}
          onClick={(e) => e.stopPropagation()}
          title="更改匹配策略"
          style={{ height: 24, padding: '0 8px' }}
        >
          策略
        </Button>
      </Popover>
    </div>
  );
};

export default StrategyControls;
