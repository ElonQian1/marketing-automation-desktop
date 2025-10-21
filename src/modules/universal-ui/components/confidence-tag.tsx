// src/modules/universal-ui/components/confidence-tag.tsx
// module: universal-ui | layer: ui | role: 置信度显示组件
// summary: 显示分析置信度的彩色标签，支持悬停显示证据详情

import React from 'react';
import { Tooltip } from 'antd';
import type { ConfidenceEvidence } from '../types/intelligent-analysis-types';
import { getConfidenceLevel, formatConfidence, generateDetailedEvidenceAnalysis } from '../utils/confidence-utils';

interface ConfidenceTagProps {
  /** 置信度分数 (0-1) */
  confidence: number;
  /** 置信度证据分项（可选，用于显示详情） */
  evidence?: ConfidenceEvidence;
  /** 组件大小 */
  size?: 'small' | 'default' | 'large';
  /** 是否显示文字标签 */
  showLabel?: boolean;
  /** 自定义类名 */
  className?: string;
}

export const ConfidenceTag: React.FC<ConfidenceTagProps> = ({
  confidence,
  evidence,
  size = 'default',
  showLabel = true,
  className = ''
}) => {
  const level = getConfidenceLevel(confidence);
  const percentage = formatConfidence(confidence);
  
  // 根据大小调整样式
  const sizeClasses = {
    small: 'px-1.5 py-0.5 text-xs',
    default: 'px-2 py-1 text-sm',
    large: 'px-3 py-1.5 text-base'
  };
  
  const tagContent = (
    <span 
      className={`
        inline-flex items-center rounded-full font-medium
        ${sizeClasses[size]}
        ${className}
        light-theme-force
      `}
      style={{ 
        backgroundColor: level.color + '20', // 20% 透明度背景
        color: level.color,
        border: `1px solid ${level.color}40` // 40% 透明度边框
      }}
    >
      {showLabel && (
        <span className="mr-1">{level.label}</span>
      )}
      <span className="font-mono">{percentage}</span>
    </span>
  );
  
  // 如果有证据详情，显示 Tooltip
  if (evidence) {
    const { summary, details } = generateDetailedEvidenceAnalysis(evidence);
    
    return (
      <Tooltip 
        title={
          <div className="space-y-2 max-w-xs">
            <div className="font-medium text-white">置信度分析</div>
            <div className="text-xs text-blue-100">{summary}</div>
            <div className="space-y-1">
              {details.map((detail, index) => (
                <div key={index} className="text-xs text-gray-200">
                  {detail}
                </div>
              ))}
            </div>
          </div>
        }
        placement="top"
        styles={{ root: { maxWidth: '300px' } }}
      >
        {tagContent}
      </Tooltip>
    );
  }
  
  return tagContent;
};