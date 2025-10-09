import React from 'react';
import type { MatchStrategy } from './types';
import { StrategyScoreBadge } from './StrategyScoreBadge';

// 临时定义策略评分接口
export interface StrategyScoreInfo {
  score: number;
  isRecommended?: boolean;
}

export interface MatchingStrategySelectorProps {
  value: MatchStrategy;
  onChange: (next: MatchStrategy) => void;
  /** 可选的策略评分信息 */
  strategyScores?: Record<string, StrategyScoreInfo>;
  /** 是否显示评分徽章 */
  showScores?: boolean;
  /** 推荐的策略 */
  recommendedStrategy?: MatchStrategy;
}

/**
 * 🎯 【策略选择器配置】- 如何添加新的策略选项按钮
 * 
 * 这个列表定义了在Universal UI页面查找器和步骤卡片策略配置器中显示的所有策略选项。
 * 
 * 🔧 添加新策略的步骤：
 * 1. ✅ 在这个 STRATEGY_LIST 数组中添加新的策略配置项
 * 2. ✅ 确保 key 值与 MatchStrategy 类型定义一致
 * 3. ✅ 在 MatchingStrategyTag.tsx 中添加对应的显示配置
 * 4. ✅ 在后端实现对应的策略处理逻辑
 * 
 * 🎨 显示优先级：数组中的顺序决定了按钮的显示顺序，XPath策略放在前面以突出显示
 * 
 * 🐛 调试提示：
 * - 如果在步骤卡片的策略选择器中看不到新策略，检查这个列表
 * - 如果策略按钮不工作，检查 onChange 回调是否正确传递到父组件
 */
const STRATEGY_LIST: Array<{ key: MatchStrategy; label: string; tip: string }> = [
  // 🎯 XPath 策略组（优先显示，性能和功能都很强大）
  { key: 'xpath-direct', label: 'XPath直接', tip: '最快匹配：直接通过路径定位，性能最优但设备相关' },
  { key: 'xpath-first-index', label: 'XPath[1]索引', tip: 'XPath 使用[1]索引：匹配第一个符合条件的元素，适用于多个相同元素的场景' },
  { key: 'xpath-all-elements', label: 'XPath全部元素', tip: 'XPath 返回所有元素：获取所有符合条件的同类元素，适用于批量操作' },
  
  // 📐 传统策略组（稳定可靠的经典匹配方式）
  { key: 'absolute',     label: '绝对定位', tip: '含 bounds/index，最精确但跨设备脆弱' },
  { key: 'strict',       label: '严格匹配', tip: '常用语义字段组合，稳定性高' },
  { key: 'relaxed',      label: '宽松匹配', tip: '少数字段或模糊匹配，兼容性好' },
  { key: 'positionless', label: '匹配任意位置', tip: '忽略位置（bounds/index），适应布局调整' },
  { key: 'standard',     label: '标准匹配', tip: '跨设备稳定，仅用语义字段，忽略分辨率/位置' },
  
  // 🔧 特殊策略组（处理特殊情况的策略）
  { key: 'hidden-element-parent', label: '隐藏元素', tip: '隐藏元素父查找：自动遍历父容器找到可点击元素，适用于bounds=[0,0][0,0]的隐藏元素' },
  { key: 'custom',       label: '自定义', tip: '使用下方勾选字段自由组合；与预设不一致时自动切换为自定义' },
];

/**
 * 🎯 匹配策略选择器（模块化子组件）
 * 
 * 📍 使用场景：
 * 1. Universal UI 页面查找器的右侧节点详情面板
 * 2. 步骤卡片的策略配置弹窗（通过 StrategyConfigurator 调用）
 * 
 * 🔧 工作原理：
 * - 受控组件：通过 value / onChange 工作
 * - 仅负责策略切换 UI，不处理具体的匹配逻辑
 * - 策略变更会通过 onChange 回调传递给父组件
 * - 🆕 支持显示策略评分徽章和推荐指示器
 * 
 * 🎨 新功能：
 * - strategyScores: 显示每个策略的评分徽章
 * - showScores: 控制是否显示评分徽章
 * - recommendedStrategy: 突出显示推荐策略
 * 
 * 🐛 故障排除：
 * - 如果策略选择不生效，检查父组件是否正确处理 onChange 回调
 * - 如果新策略不显示，检查上方的 STRATEGY_LIST 配置
 * - 如果策略显示错误，检查传入的 value 参数是否正确
 * - 如果评分徽章不显示，检查 strategyScores 和 showScores 参数
 */
export const MatchingStrategySelector: React.FC<MatchingStrategySelectorProps> = ({ 
  value, 
  onChange, 
  strategyScores = {},
  showScores = false,
  recommendedStrategy
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-neutral-500">匹配策略：</span>
      {STRATEGY_LIST.map((s) => {
        const scoreInfo = strategyScores[s.key];
        const isRecommended = recommendedStrategy === s.key || scoreInfo?.isRecommended;
        const isSelected = value === s.key;
        
        return (
          <div key={s.key} className="relative">
            <button
              className={`px-2 py-1 rounded text-xs border transition-colors flex items-center gap-1 ${
                isSelected 
                  ? 'bg-blue-600 text-white border-blue-700' 
                  : isRecommended 
                    ? 'border-blue-400 text-blue-700 bg-blue-50 hover:bg-blue-100' 
                    : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
              } ${isRecommended ? 'ring-1 ring-blue-300 ring-opacity-50' : ''}`}
              title={`${s.tip}${scoreInfo ? ` (评分: ${Math.round(scoreInfo.score * 100)}%)` : ''}${isRecommended ? ' [推荐]' : ''}`}
              onClick={() => onChange(s.key)}
            >
              <span>{s.label}</span>
              
              {/* 推荐指示器 */}
              {isRecommended && !isSelected && (
                <span className="text-blue-500 text-[10px]">★</span>
              )}
              
              {/* 评分徽章 */}
              {showScores && scoreInfo && (
                <StrategyScoreBadge
                  score={scoreInfo.score}
                  isRecommended={isRecommended}
                  size="small"
                  className="ml-1"
                />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default MatchingStrategySelector;
