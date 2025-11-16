// src/components/universal-ui/strategy-selector/StrategyScoreBadge.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 策略评分徽章组件
 * 显示策略的评分信息和推荐状态
 */

import React, { useState } from 'react';
import { Badge, Tooltip, Spin } from 'antd';
import { StarFilled, ReloadOutlined } from '@ant-design/icons';

export interface StrategyScoreBadgeProps {
  /** 评分 (0-1) */
  score: number;
  /** 是否为推荐策略 */
  isRecommended?: boolean;
  /** 徽章大小 */
  size?: 'small' | 'default';
  /** 自定义类名 */
  className?: string;
  /** 显示详细信息 */
  showDetails?: boolean;
  /** 点击刷新回调 */
  onRefresh?: () => void | Promise<void>;
  /** 是否正在刷新 */
  isRefreshing?: boolean;
}

/**
 * 根据评分获取颜色
 */
const getScoreColor = (score: number): string => {
  if (score >= 0.8) return '#52c41a'; // 绿色
  if (score >= 0.6) return '#faad14'; // 黄色
  if (score >= 0.4) return '#fa8c16'; // 橙色
  return '#f5222d'; // 红色
};

/**
 * 策略评分徽章组件
 */
export const StrategyScoreBadge: React.FC<StrategyScoreBadgeProps> = ({
  score,
  isRecommended = false,
  size = 'default',
  className = '',
  showDetails = true,
  onRefresh,
  isRefreshing = false
}) => {
  const [localRefreshing, setLocalRefreshing] = useState(false);
  const percentage = Math.round(score * 100);
  const color = getScoreColor(score);
  const isSmall = size === 'small';
  const refreshing = isRefreshing || localRefreshing;

  const handleClick = async (e: React.MouseEvent) => {
    if (!onRefresh || refreshing) return;
    e.stopPropagation();
    
    setLocalRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setLocalRefreshing(false);
    }
  };

  const badge = (
    <div 
      className={`inline-flex items-center gap-1 ${className} ${onRefresh ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      onClick={handleClick}
      title={onRefresh ? '点击刷新所有评分' : undefined}
    >
      {/* 推荐星标 */}
      {isRecommended && (
        <StarFilled 
          style={{ 
            color: '#1890ff', 
            fontSize: isSmall ? '10px' : '12px' 
          }} 
        />
      )}
      
      {/* 刷新加载图标 */}
      {refreshing && (
        <Spin size="small" />
      )}
      
      {/* 评分徽章 */}
      <Badge
        count={refreshing ? '🔄' : `${percentage}%`}
        style={{
          backgroundColor: color,
          fontSize: isSmall ? '10px' : '12px',
          height: isSmall ? '16px' : '20px',
          lineHeight: isSmall ? '14px' : '18px',
          minWidth: isSmall ? '24px' : '32px',
          borderRadius: isSmall ? '8px' : '10px',
          opacity: refreshing ? 0.7 : 1
        }}
      />
      
      {/* 刷新图标提示 */}
      {onRefresh && !refreshing && (
        <ReloadOutlined 
          style={{ 
            fontSize: isSmall ? '10px' : '12px',
            color: '#999',
            marginLeft: '-2px'
          }} 
        />
      )}
    </div>
  );

  if (!showDetails) {
    return badge;
  }

  // 带tooltip的详细信息
  const tooltipTitle = (
    <div>
      <div>评分: {percentage}%</div>
      {isRecommended && <div>推荐策略</div>}
      <div>
        评级: {
          score >= 0.8 ? '优秀' :
          score >= 0.6 ? '良好' :
          score >= 0.4 ? '一般' : '较差'
        }
      </div>
      {onRefresh && <div className="mt-1 text-blue-400">💡 点击刷新所有评分</div>}
    </div>
  );

  return (
    <Tooltip title={tooltipTitle} placement="top">
      {badge}
    </Tooltip>
  );
};

export default StrategyScoreBadge;