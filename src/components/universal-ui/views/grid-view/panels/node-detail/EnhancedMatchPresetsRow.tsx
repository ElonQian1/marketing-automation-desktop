// src/components/universal-ui/views/grid-view/panels/node-detail/EnhancedMatchPresetsRow.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React, { useMemo } from 'react';
import { UiNode } from '../../types';
import styles from '../../GridElementView.module.css';
import { MatchCriteria, MatchStrategy } from './types';
import { PRESET_FIELDS, buildCriteriaFromNode } from './helpers';
import { buildEnhancedMatchingFromElementAndXml } from '../../../../../../pages/SmartScriptBuilderPage/helpers/matchingHelpers';

export interface EnhancedMatchPresetsRowProps {
  node: UiNode | null;
  xmlContent?: string; // 🆕 XML上下文，用于子节点增强
  onApply: (criteria: MatchCriteria) => void;
  onPreviewFields?: (fields: string[]) => void;
  activeStrategy?: MatchStrategy;
}

interface StrategyConfig {
  key: MatchStrategy;
  label: string;
  icon: string;
  description: string;
  color: string;
  scenarios: string[];
}

const STRATEGY_CONFIGS: StrategyConfig[] = [
  {
    key: 'strict',
    label: '🎯 智能推荐',
    icon: '🎯',
    description: '根据元素特征智能选择最佳匹配方式',
    color: 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100',
    scenarios: ['有唯一ID', '结构稳定', '常规操作']
  },
  {
    key: 'standard', 
    label: '🧠 智能增强',
    icon: '🧠',
    description: '使用子节点文本增强匹配，解决父子容器问题',
    color: 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100',
    scenarios: ['按钮文字在子节点', '复杂布局', '嵌套结构']
  },
  {
    key: 'positionless',
    label: '📱 跨设备通用',
    icon: '📱', 
    description: '忽略位置信息，适用于不同分辨率设备',
    color: 'bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100',
    scenarios: ['多设备适配', '分辨率差异', '布局微调']
  },
  {
    key: 'relaxed',
    label: '🔍 容错匹配',
    icon: '🔍',
    description: '降低匹配要求，提高成功率',
    color: 'bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100', 
    scenarios: ['动态内容', '变化较大', '兜底方案']
  },
  {
    key: 'absolute',
    label: '📍 当前设备专用',
    icon: '📍',
    description: '精确匹配，仅适用于相同设备和分辨率',
    color: 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100',
    scenarios: ['录制设备专用', '精确坐标', '临时脚本']
  }
];

// 🚀 新版智能推荐逻辑 - 基于现有增强匹配系统的改进版本
const analyzeElementAndRecommend = (node: UiNode | null, xmlContent?: string): {
  recommendedStrategy: MatchStrategy;
  reason: string;
  confidence: number;
} => {
  if (!node) {
    return { recommendedStrategy: 'standard', reason: '默认推荐', confidence: 0.5 };
  }

  const attrs = node.attrs || {};
  
  // Step 1: 自我可定位性检查 (基于文档6-8的Step 1)
  if (attrs['resource-id']?.trim()) {
    // 检查resource-id的唯一性（简化版本）
    const resourceId = attrs['resource-id'];
    if (!resourceId.includes('android:id/') && resourceId.includes(':id/')) {
      return { 
        recommendedStrategy: 'strict', 
        reason: 'Step 1: 检测到应用特定resource-id，推荐严格匹配', 
        confidence: 0.9 
      };
    }
  }

  // Step 1: content-desc唯一性检查
  if (attrs['content-desc']?.trim()) {
    return { 
      recommendedStrategy: 'strict', 
      reason: 'Step 1: 检测到content-desc，推荐严格匹配', 
      confidence: 0.85 
    };
  }

  // Step 2: 子树锚点查找 (文本元素)
  if (attrs['text']?.trim()) {
    const text = attrs['text'];
    if (text.length < 20 && !text.includes('\n')) {
      return { 
        recommendedStrategy: 'positionless', 
        reason: 'Step 2: 短文本元素，推荐忽略位置匹配', 
        confidence: 0.8 
      };
    }
  }

  // Step 3: 区域限定匹配 (容器元素检查)
  const className = attrs['class'] || '';
  if (className.includes('Layout') || className.includes('Container') || className.includes('View')) {
    return { 
      recommendedStrategy: 'standard', 
      reason: 'Step 3: 容器元素，推荐标准跨设备匹配', 
      confidence: 0.75 
    };
  }

  // Step 6: 兜底策略
  if (attrs['bounds'] && attrs['index']) {
    return { 
      recommendedStrategy: 'absolute', 
      reason: 'Step 6: 兜底策略 - 使用位置和索引的绝对匹配', 
      confidence: 0.6 
    };
  }

  return { 
    recommendedStrategy: 'standard', 
    reason: 'Step 6: 默认标准匹配策略', 
    confidence: 0.5 
  };
};

export const EnhancedMatchPresetsRow: React.FC<EnhancedMatchPresetsRowProps> = ({ 
  node, 
  xmlContent, 
  onApply, 
  onPreviewFields, 
  activeStrategy 
}) => {
  // 🆕 使用同步的智能推荐
  const recommendation = useMemo(() => {
    return analyzeElementAndRecommend(node, xmlContent);
  }, [node, xmlContent]);

  const applyStrategy = async (strategy: MatchStrategy) => {
    if (!node) return;

    let criteria: MatchCriteria;

    // 🆕 智能增强策略：优先使用XML上下文进行子节点增强
    if (strategy === 'standard' && xmlContent && node.attrs) {
      try {
        console.log('🧠 应用智能增强策略，使用XML上下文...');
        const enhanced = buildEnhancedMatchingFromElementAndXml({
          resource_id: node.attrs['resource-id'],
          text: node.attrs['text'],
          content_desc: node.attrs['content-desc'], 
          class_name: node.attrs['class'],
          bounds: node.attrs['bounds']
        }, xmlContent);

        if (enhanced && enhanced.fields.length > 0) {
          criteria = {
            strategy: enhanced.strategy as MatchStrategy,
            fields: enhanced.fields,
            values: enhanced.values
          };
          console.log('✅ 智能增强成功:', criteria);
        } else {
          // 回退到标准预设
          const fields = PRESET_FIELDS[strategy];
          const { values } = buildCriteriaFromNode(node, strategy, fields);
          criteria = { strategy, fields, values };
          console.log('⚠️ 智能增强失败，使用标准预设');
        }
      } catch (error) {
        console.warn('智能增强出错，使用标准预设:', error);
        const fields = PRESET_FIELDS[strategy];
        const { values } = buildCriteriaFromNode(node, strategy, fields);
        criteria = { strategy, fields, values };
      }
    } else {
      // 标准预设逻辑
      const fields = PRESET_FIELDS[strategy];
      const { values } = buildCriteriaFromNode(node, strategy, fields);
      criteria = { strategy, fields, values };
    }

    onPreviewFields?.(criteria.fields);
    onApply(criteria);
  };

  const StrategyButton: React.FC<{ config: StrategyConfig }> = ({ config }) => {
    const isActive = activeStrategy === config.key;
    const isRecommended = recommendation.recommendedStrategy === config.key;
    
    return (
      <div className="relative">
        <button
          className={`
            relative px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200
            ${isActive 
              ? 'bg-blue-600 text-white border-blue-700 shadow-md scale-105' 
              : config.color
            }
            ${isRecommended && !isActive ? 'ring-2 ring-green-400 ring-opacity-50' : ''}
          `}
          title={`${config.description}\n适用场景: ${config.scenarios.join('、')}`}
          onClick={() => applyStrategy(config.key)}
        >
          <span className="mr-1">{config.icon}</span>
          {config.label}
        </button>
        
        {/* 推荐标签 */}
        {isRecommended && !isActive && (
          <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full shadow-sm">
            推荐
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* 智能推荐提示 */}
      {recommendation.confidence > 0.7 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-green-600">🤖</span>
            <span className="text-sm font-medium text-green-800">智能推荐</span>
            <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
              {Math.round(recommendation.confidence * 100)}% 推荐
            </span>
          </div>
          <div className="text-sm text-green-700">{recommendation.reason}</div>
        </div>
      )}

      {/* 策略按钮组 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <span>匹配策略：</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {STRATEGY_CONFIGS.map(config => (
            <StrategyButton key={config.key} config={config} />
          ))}
        </div>
      </div>

      {/* 自定义状态提示 */}
      {activeStrategy === 'custom' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-blue-600">✏️</span>
            <span className="text-sm font-medium text-blue-800">自定义模式</span>
          </div>
          <div className="text-sm text-blue-700 mt-1">
            您已手动调整字段或条件，当前使用自定义匹配策略
          </div>
        </div>
      )}

      {/* 当前状态总览 */}
      <div className="text-xs text-neutral-500 bg-neutral-50 rounded px-2 py-1">
        💡 提示：点击策略按钮自动配置匹配字段，也可在下方手动调整
      </div>
    </div>
  );
};

export default EnhancedMatchPresetsRow;