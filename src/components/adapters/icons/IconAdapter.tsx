// src/components/adapters/icons/IconAdapter.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * Icon适配器 - AntD Icons 封装
 * 
 * 遵循员工D架构约束：统一图标使用规范
 * 提供品牌一致的图标组件
 */

import React from 'react';
import {
  StarOutlined,
  RocketOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { cn } from '../../ui/utils';

// 基础图标Props
interface IconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
}

// 图标尺寸映射
const iconSizeMap = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg', 
  xl: 'text-xl',
} as const;

// 品牌图标组件
export const BrandStarIcon: React.FC<IconProps> = ({ 
  className, 
  size = 'md', 
  color 
}) => (
  <StarOutlined 
    className={cn(iconSizeMap[size], className)} 
    style={color ? { color } : undefined} 
  />
);

export const BrandRocketIcon: React.FC<IconProps> = ({ 
  className, 
  size = 'md', 
  color 
}) => (
  <RocketOutlined 
    className={cn(iconSizeMap[size], className)} 
    style={color ? { color } : undefined} 
  />
);

export const BrandBulbIcon: React.FC<IconProps> = ({ 
  className, 
  size = 'md', 
  color 
}) => (
  <BulbOutlined 
    className={cn(iconSizeMap[size], className)} 
    style={color ? { color } : undefined} 
  />
);

// 状态图标
export const BrandSuccessIcon: React.FC<IconProps> = ({ 
  className, 
  size = 'md' 
}) => (
  <CheckCircleOutlined 
    className={cn(iconSizeMap[size], 'text-success-500', className)} 
  />
);

export const BrandWarningIcon: React.FC<IconProps> = ({ 
  className, 
  size = 'md' 
}) => (
  <ExclamationCircleOutlined 
    className={cn(iconSizeMap[size], 'text-warning-500', className)} 
  />
);

export const BrandInfoIcon: React.FC<IconProps> = ({ 
  className, 
  size = 'md' 
}) => (
  <InfoCircleOutlined 
    className={cn(iconSizeMap[size], 'text-primary-500', className)} 
  />
);

export const BrandErrorIcon: React.FC<IconProps> = ({ 
  className, 
  size = 'md' 
}) => (
  <CloseCircleOutlined 
    className={cn(iconSizeMap[size], 'text-error-500', className)} 
  />
);

// 导出类型
export type { IconProps };