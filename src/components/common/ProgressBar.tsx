// src/components/common/ProgressBar.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Progress, Typography } from 'antd';

const { Text } = Typography;

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
  barColor?: string;
  style?: React.CSSProperties;
}

/**
 * 进度条组件 - 使用原生 Ant Design Progress
 * 统一的任务进度显示UI
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  label,
  showPercentage = true,
  className,
  barColor,
  style,
}) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className={className} style={style}>
      {(label || showPercentage) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          {label && (
            <Text style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
              {label}
            </Text>
          )}
          {showPercentage && (
            <Text style={{ fontSize: '14px', color: '#6b7280' }}>
              {current}/{total} ({percentage}%)
            </Text>
          )}
        </div>
      )}
      <Progress
        percent={percentage}
        showInfo={false}
        strokeColor={barColor}
        trailColor="#e5e7eb"
        size="small"
      />
    </div>
  );
};

