// src/components/common/ConfidenceBadge.tsx
// module: shared | layer: ui | role: 统一置信度徽标组件
// summary: 可复用的置信度显示徽标，支持紧凑模式和完整模式

import React from 'react';
import { Tooltip } from 'antd';
import { formatPercent, getConfidenceTier, getTierColor, getTierLabel } from '../../utils/confidence-format';

export interface ConfidenceBadgeProps {
  /** 置信度值 (0-1) */
  value?: number;
  /** 紧凑模式，只显示百分比 */
  compact?: boolean;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 是否显示 Tooltip */
  showTooltip?: boolean;
  /** 自定义 Tooltip 内容 */
  tooltipTitle?: string;
}

export function ConfidenceBadge({ 
  value, 
  compact = false, 
  style = {}, 
  showTooltip = true,
  tooltipTitle 
}: ConfidenceBadgeProps) {
  const tier = getConfidenceTier(value);
  const color = getTierColor(tier);
  const percent = formatPercent(value);
  const label = getTierLabel(tier);
  
  const badgeStyle: React.CSSProperties = {
    border: `1px solid ${color}`,
    color,
    borderRadius: compact ? 6 : 8,
    padding: compact ? '0 6px' : '2px 8px',
    fontSize: compact ? 12 : 13,
    background: 'transparent',
    fontWeight: 500,
    lineHeight: compact ? '20px' : '22px',
    display: 'inline-block',
    whiteSpace: 'nowrap',
    ...style
  };

  const displayText = value == null ? '—' : 
    compact ? percent : `可信度 ${percent}`;
    
  const tooltipText = tooltipTitle || 
    (value == null ? '暂无可信度数据' : `置信度等级：${label}（${percent}）`);

  const badge = (
    <span 
      aria-label="confidence-badge" 
      style={badgeStyle}
      title={showTooltip ? undefined : tooltipText}
    >
      {displayText}
    </span>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <Tooltip title={tooltipText} placement="top">
      {badge}
    </Tooltip>
  );
}