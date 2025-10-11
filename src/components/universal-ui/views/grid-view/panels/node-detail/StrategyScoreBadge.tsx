// src/components/universal-ui/views/grid-view/panels/node-detail/StrategyScoreBadge.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';

interface StrategyScoreBadgeProps {
  score: number;
  isRecommended?: boolean;
  size?: 'small' | 'medium';
  showLabel?: boolean;
  className?: string;
}

/**
 * 🎯 策略评分徽章组件
 * 
 * 📍 功能：
 * - 在策略选择器按钮上显示评分徽章
 * - 提供推荐策略的视觉指示
 * - 支持小号和中号两种尺寸
 * 
 * 🎨 设计原则：
 * - 使用紧凑的设计避免干扰主要内容
 * - 颜色编码直观反映评分等级
 * - 支持推荐标识的特殊样式
 */
export const StrategyScoreBadge: React.FC<StrategyScoreBadgeProps> = ({
  score,
  isRecommended = false,
  size = 'small',
  showLabel = false,
  className = ''
}) => {
  const getScoreStyle = (scoreValue: number): string => {
    if (scoreValue >= 0.8) return 'bg-green-500 text-white';
    if (scoreValue >= 0.6) return 'bg-yellow-500 text-white';
    if (scoreValue >= 0.4) return 'bg-orange-500 text-white';
    return 'bg-red-500 text-white';
  };

  const formatScore = (value: number): string => {
    return Math.round(value * 100).toString();
  };

  const sizeClasses = {
    small: 'text-[10px] px-1 py-0.5 min-w-[16px] h-4',
    medium: 'text-xs px-1.5 py-0.5 min-w-[20px] h-5'
  };

  const recommendedClasses = isRecommended 
    ? 'ring-2 ring-blue-400 ring-opacity-70' 
    : '';

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <span 
        className={`
          inline-flex items-center justify-center
          rounded-full font-semibold
          ${getScoreStyle(score)}
          ${sizeClasses[size]}
          ${recommendedClasses}
        `}
        title={`评分: ${formatScore(score)}%${isRecommended ? ' (推荐)' : ''}`}
      >
        {formatScore(score)}
      </span>
      
      {isRecommended && (
        <span 
          className="text-blue-500 text-xs" 
          title="推荐策略"
        >
          ★
        </span>
      )}
      
      {showLabel && (
        <span className="text-xs text-neutral-500">
          {formatScore(score)}%
        </span>
      )}
    </div>
  );
};

export default StrategyScoreBadge;