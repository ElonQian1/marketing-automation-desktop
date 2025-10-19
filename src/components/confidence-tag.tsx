// src/components/confidence-tag.tsx
// module: components | layer: ui | role: confidence-display
// summary: 轻量级置信度标签组件，支持颜色编码和详细信息

import React from 'react';
import type { SingleStepScore } from '../modules/universal-ui/types/intelligent-analysis-types';

interface ConfidenceTagProps {
  /** 置信度值 (0-1) */
  value?: number;
  /** 完整的单步评分信息 */
  score?: SingleStepScore;
  /** 标签尺寸 */
  size?: 'small' | 'default' | 'large';
  /** 是否显示文字标签 */
  showLabel?: boolean;
  /** 紧凑模式（用于菜单等狭小空间） */
  compact?: boolean;
  /** 证据数据（用于 tooltip 详情） */
  evidence?: Record<string, number>;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

/**
 * 置信度标签组件
 * 
 * 功能：
 * - 颜色编码：≥85% 绿色，≥60% 琥珀色，<60% 红色
 * - 悬停显示详细信息（来源、时间等）
 * - 支持多种尺寸
 */
export function ConfidenceTag({ 
  value, 
  score, 
  size = 'default', 
  showLabel = true,
  compact = false,
  evidence,
  style 
}: ConfidenceTagProps) {
  const confidence = score?.confidence ?? value;
  
  if (confidence == null) return null;
  
  const pct = Math.round(confidence * 100);
  
  // 颜色编码
  const getColor = () => {
    if (confidence >= 0.85) return '#52c41a'; // 绿色
    if (confidence >= 0.60) return '#faad14'; // 琥珀色
    return '#ff4d4f'; // 红色
  };
  
  const color = getColor();
  
  // 尺寸配置
  const sizeConfig = {
    small: { fontSize: 10, padding: '0 4px', borderRadius: 4 },
    default: { fontSize: 12, padding: '0 6px', borderRadius: 6 },
    large: { fontSize: 14, padding: '2px 8px', borderRadius: 8 },
  };
  
  const sizeStyle = sizeConfig[size];
  
  // Tooltip 内容
  const getTooltipContent = () => {
    if (!score && !evidence) return `智能·单步可信度：${pct}%`;
    
    const parts = [`可信度：${pct}%`];
    
    // 优先使用 evidence（朋友建议的格式）
    const evidenceData = evidence || score?.evidence;
    if (evidenceData) {
      Object.entries(evidenceData).forEach(([key, val]) => {
        const numVal = typeof val === 'number' ? val : 0;
        const displayValue = Math.round(numVal * 100);
        parts.push(`${key}: ${displayValue}%`);
      });
    }
    
    if (score?.source) {
      parts.push(`来源：${score.source}`);
    }
    if (score?.at) {
      const time = new Date(score.at).toLocaleTimeString();
      parts.push(`时间：${time}`);
    }
    
    return parts.join('\n');
  };
  
  const baseStyle: React.CSSProperties = compact
    ? { 
        border: `1px solid ${color}`, 
        color, 
        borderRadius: 6, 
        padding: "0 6px", 
        fontSize: 12, 
        opacity: 0.95,
        display: 'inline-flex',
        alignItems: 'center',
        fontWeight: 500,
        cursor: 'help',
        whiteSpace: 'nowrap',
        ...style,
      }
    : {
        display: 'inline-flex',
        alignItems: 'center',
        border: `1px solid ${color}`,
        color,
        backgroundColor: `${color}10`, // 10% opacity
        fontWeight: 500,
        cursor: 'help',
        whiteSpace: 'nowrap',
        ...sizeStyle,
        ...style,
      };
  
  return (
    <span
      title={getTooltipContent()}
      style={baseStyle}
    >
      {showLabel ? `可信度 ${pct}%` : `${pct}%`}
    </span>
  );
}

export default ConfidenceTag;