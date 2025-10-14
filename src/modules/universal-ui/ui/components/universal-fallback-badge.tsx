// src/modules/universal-ui/ui/components/universal-fallback-badge.tsx
// module: universal-ui | layer: ui | role: component
// summary: "暂用兜底"徽标组件，标识当前使用的是兜底策略

import React from 'react';
import { Tag, Tooltip } from 'antd';
import { ExclamationCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';

export interface UniversalFallbackBadgeProps {
  /** 是否正在使用兜底策略 */
  isFallbackActive: boolean;
  /** 兜底策略名称 */
  fallbackName?: string;
  /** 是否正在分析中 */
  isAnalyzing?: boolean;
  /** 尺寸 */
  size?: 'small' | 'default';
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
}

/**
 * "暂用兜底"徽标组件
 * 
 * 🎯 用途：
 * - 明确标识当前步骤使用的是兜底策略（如绝对XPath）
 * - 提示用户智能分析完成后可升级
 * - 符合文档7要求：若是兜底显示徽标"暂用兜底"
 * 
 * @example
 * ```tsx
 * <UniversalFallbackBadge 
 *   isFallbackActive={true}
 *   fallbackName="绝对XPath"
 *   isAnalyzing={true}
 * />
 * ```
 */
export const UniversalFallbackBadge: React.FC<UniversalFallbackBadgeProps> = ({
  isFallbackActive,
  fallbackName = '兜底策略',
  isAnalyzing = false,
  size = 'default',
  style,
  className = ''
}) => {
  // 不显示兜底徽标的情况
  if (!isFallbackActive) {
    return null;
  }

  const tooltipContent = isAnalyzing 
    ? `正在使用 ${fallbackName}（智能分析进行中，完成后可升级）`
    : `正在使用 ${fallbackName}（默认策略，可手动触发智能分析）`;

  return (
    <Tooltip title={tooltipContent}>
      <Tag
        icon={<ExclamationCircleOutlined />}
        color="orange"
        className={`light-theme-force ${className}`}
        style={{
          fontSize: size === 'small' ? '11px' : '12px',
          fontWeight: 500,
          cursor: 'help',
          userSelect: 'none',
          ...style
        }}
      >
        暂用兜底
        {isAnalyzing && (
          <ThunderboltOutlined 
            spin 
            style={{ 
              marginLeft: 4, 
              fontSize: size === 'small' ? '10px' : '12px' 
            }} 
          />
        )}
      </Tag>
    </Tooltip>
  );
};

/**
 * 推荐策略徽标（作为对比）
 * 当智能分析完成且已切换到推荐策略时显示
 */
export interface UniversalRecommendedBadgeProps {
  /** 是否为推荐策略 */
  isRecommended: boolean;
  /** 置信度 */
  confidence?: number;
  /** 尺寸 */
  size?: 'small' | 'default';
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
}

export const UniversalRecommendedBadge: React.FC<UniversalRecommendedBadgeProps> = ({
  isRecommended,
  confidence,
  size = 'default',
  style,
  className = ''
}) => {
  if (!isRecommended) {
    return null;
  }

  const isHighConfidence = (confidence || 0) >= 0.82;

  return (
    <Tooltip title={`推荐策略（置信度 ${Math.round((confidence || 0) * 100)}%）`}>
      <Tag
        icon={<ThunderboltOutlined />}
        color={isHighConfidence ? 'success' : 'warning'}
        className={`light-theme-force ${className}`}
        style={{
          fontSize: size === 'small' ? '11px' : '12px',
          fontWeight: 500,
          cursor: 'help',
          userSelect: 'none',
          ...style
        }}
      >
        {isHighConfidence ? '智能推荐' : '可选策略'}
      </Tag>
    </Tooltip>
  );
};

export default UniversalFallbackBadge;
