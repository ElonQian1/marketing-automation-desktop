// src/components/analysis/ConfidenceLegend.tsx
// module: analysis | layer: ui | role: 置信度颜色图例
// summary: 显示置信度颜色对应的质量等级说明

import React from 'react';
import { Card, Tag, Space, Typography } from 'antd';

const { Text } = Typography;

interface ConfidenceLegendProps {
  /** 是否显示详细说明 */
  showDetails?: boolean;
  /** 组件大小 */
  size?: 'small' | 'default';
}

/**
 * 置信度颜色图例组件
 */
export const ConfidenceLegend: React.FC<ConfidenceLegendProps> = ({
  showDetails = false,
  size = 'default'
}) => {
  const legendItems = [
    {
      color: 'green',
      range: '85%+',
      level: '高置信度',
      description: '策略质量极佳，推荐优先使用'
    },
    {
      color: 'blue',
      range: '70-84%',
      level: '中高置信度', 
      description: '策略质量良好，可以安全使用'
    },
    {
      color: 'orange',
      range: '55-69%',
      level: '中等置信度',
      description: '策略质量一般，需要谨慎使用'
    },
    {
      color: 'volcano',
      range: '40-54%',
      level: '中低置信度',
      description: '策略质量较差，建议配合其他策略'
    },
    {
      color: 'red',
      range: '< 40%',
      level: '低置信度',
      description: '策略质量很差，不推荐单独使用'
    }
  ];

  const isSmall = size === 'small';

  return (
    <Card 
      size={isSmall ? 'small' : 'default'}
      title={
        <div className="flex items-center gap-2">
          <span className={isSmall ? 'text-sm' : ''}>🎨 置信度颜色图例</span>
        </div>
      }
    >
      <div className="space-y-2">
        {legendItems.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag 
                color={item.color}
                style={{ 
                  fontWeight: 'bold',
                  fontSize: isSmall ? '10px' : '12px',
                  minWidth: isSmall ? '45px' : '55px',
                  textAlign: 'center'
                }}
              >
                {item.range}
              </Tag>
              <Text className={isSmall ? 'text-xs' : 'text-sm'}>
                {item.level}
              </Text>
            </div>
            
            {showDetails && (
              <Text 
                type="secondary" 
                className={`${isSmall ? 'text-xs' : 'text-sm'} max-w-xs`}
              >
                {item.description}
              </Text>
            )}
          </div>
        ))}
      </div>
      
      {!showDetails && (
        <div className="mt-3 pt-2 border-t border-gray-100">
          <Text type="secondary" className={isSmall ? 'text-xs' : 'text-sm'}>
            💡 颜色越绿表示策略质量越高，越红表示质量越低
          </Text>
        </div>
      )}
    </Card>
  );
};

export default ConfidenceLegend;