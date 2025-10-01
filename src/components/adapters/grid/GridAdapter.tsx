/**
 * Grid适配器 - AntD Row/Col 封装
 * 
 * 遵循员工D架构约束：页面层禁止直连AntD重组件
 * 通过适配器层统一封装，确保品牌一致性
 */

import React from 'react';
import { Row as AntRow, Col as AntCol, Space as AntSpace } from 'antd';
import type { RowProps as AntRowProps, ColProps as AntColProps, SpaceProps as AntSpaceProps } from 'antd';
import { cn } from '@/components/ui/utils';

// Grid Row 适配器
interface GridRowProps extends Omit<AntRowProps, 'className'> {
  className?: string;
  children?: React.ReactNode;
}

export const GridRow: React.FC<GridRowProps> = ({ 
  className, 
  children, 
  gutter = [16, 16],
  ...props 
}) => {
  return (
    <AntRow
      className={cn('w-full', className)}
      gutter={gutter}
      {...props}
    >
      {children}
    </AntRow>
  );
};

// Grid Col 适配器
interface GridColProps extends Omit<AntColProps, 'className'> {
  className?: string;
  children?: React.ReactNode;
}

export const GridCol: React.FC<GridColProps> = ({ 
  className, 
  children, 
  ...props 
}) => {
  return (
    <AntCol
      className={cn('flex flex-col', className)}
      {...props}
    >
      {children}
    </AntCol>
  );
};

// Space 适配器
interface GridSpaceProps extends Omit<AntSpaceProps, 'className'> {
  className?: string;
  children?: React.ReactNode;
}

export const GridSpace: React.FC<GridSpaceProps> = ({ 
  className, 
  children,
  direction = 'horizontal',
  size = 'middle',
  ...props 
}) => {
  return (
    <AntSpace
      className={cn('w-full', className)}
      direction={direction}
      size={size}
      {...props}
    >
      {children}
    </AntSpace>
  );
};

// 导出类型
export type { GridRowProps, GridColProps, GridSpaceProps };