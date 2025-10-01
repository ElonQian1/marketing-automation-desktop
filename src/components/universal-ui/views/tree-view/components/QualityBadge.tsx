/**
 * UIElementTree 质量徽章组件
 * 显示元素质量分数和颜色指示器
 */

import React from 'react';
import { Badge, Tooltip, Progress } from 'antd';
import { CheckCircleOutlined, WarningOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { QUALITY_THRESHOLDS } from '../types';
import { getQualityColor } from '../utils/elementUtils';

interface QualityBadgeProps {
  score: number;
  showText?: boolean;
  showProgress?: boolean;
  size?: 'small' | 'default' | 'large';
  className?: string;
}

export const QualityBadge: React.FC<QualityBadgeProps> = ({
  score,
  showText = false,
  showProgress = false,
  size = 'default',
  className = '',
}) => {
  const color = getQualityColor(score);
  
  // 获取质量等级信息
  const getQualityLevel = () => {
    if (score >= QUALITY_THRESHOLDS.HIGH) {
      return {
        level: '高质量',
        icon: <CheckCircleOutlined />,
        status: 'success' as const,
      };
    }
    if (score >= QUALITY_THRESHOLDS.MEDIUM) {
      return {
        level: '中等质量',
        icon: <WarningOutlined />,
        status: 'warning' as const,
      };
    }
    if (score >= QUALITY_THRESHOLDS.LOW) {
      return {
        level: '低质量',
        icon: <WarningOutlined />,
        status: 'warning' as const,
      };
    }
    return {
      level: '极低质量',
      icon: <CloseCircleOutlined />,
      status: 'error' as const,
    };
  };

  const qualityInfo = getQualityLevel();

  const tooltipContent = (
    <div>
      <div className="mb-2">
        <strong>质量评估: {score} 分</strong>
      </div>
      <div className="text-sm">
        <div>等级: {qualityInfo.level}</div>
        <div className="mt-2">评分标准:</div>
        <div className="text-xs mt-1 space-y-1">
          <div>• 有意义文本内容: +30分</div>
          <div>• 有资源ID: +15分</div>
          <div>• 可交互性: +10分</div>
          <div>• 内容描述: +10分</div>
          <div>• 合理尺寸: +5分</div>
        </div>
      </div>
      {showProgress && (
        <div className="mt-3">
          <Progress 
            percent={score} 
            size="small"
            strokeColor={color}
            showInfo={false}
          />
        </div>
      )}
    </div>
  );

  if (showText || showProgress) {
    return (
      <Tooltip title={tooltipContent}>
        <div className={`flex items-center gap-2 ${className}`}>
          {/* 质量圆点 */}
          <div
            className={`rounded-full ${
              size === 'small' ? 'w-2 h-2' : 
              size === 'large' ? 'w-4 h-4' : 'w-3 h-3'
            }`}
            style={{ backgroundColor: color }}
          />
          
          {/* 文本显示 */}
          {showText && (
            <span className={`text-gray-700 ${
              size === 'small' ? 'text-xs' : 
              size === 'large' ? 'text-base' : 'text-sm'
            }`}>
              {score}
            </span>
          )}
          
          {/* 进度条显示 */}
          {showProgress && (
            <Progress 
              percent={score} 
              size="small"
              strokeColor={color}
              showInfo={false}
              className="w-16"
            />
          )}
        </div>
      </Tooltip>
    );
  }

  // 简单徽章模式
  return (
    <Tooltip title={tooltipContent}>
      <Badge
        count={score}
        style={{ 
          backgroundColor: color,
          fontSize: size === 'small' ? '10px' : size === 'large' ? '14px' : '12px'
        }}
        className={className}
      />
    </Tooltip>
  );
};