// src/components/ui/layouts/Grid.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Row, Col, type RowProps, type ColProps } from 'antd';
import { clsx } from 'clsx';

// 工具函数：合并类名
const cn = (...classes: (string | undefined | null | boolean)[]) => {
  return clsx(classes.filter(Boolean));
};

/**
 * 网格容器组件props
 */
export interface GridProps extends RowProps {
  /**
   * 间距大小
   */
  spacing?: 'none' | 'small' | 'medium' | 'large' | number;
  
  /**
   * 垂直对齐方式
   */
  verticalAlign?: 'top' | 'middle' | 'bottom' | 'stretch';
  
  /**
   * 水平对齐方式
   */
  horizontalAlign?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
  
  /**
   * 是否换行
   */
  wrap?: boolean;
  
  /**
   * 自定义类名
   */
  className?: string;
}

/**
 * 网格项组件props
 */
export interface GridItemProps extends ColProps {
  /**
   * 响应式配置的简化版本
   */
  xs?: number | { span?: number; offset?: number };
  sm?: number | { span?: number; offset?: number };
  md?: number | { span?: number; offset?: number };
  lg?: number | { span?: number; offset?: number };
  xl?: number | { span?: number; offset?: number };
  xxl?: number | { span?: number; offset?: number };
  
  /**
   * 自定义类名
   */
  className?: string;
}

/**
 * 网格容器组件
 * 基于Ant Design的Row组件，提供更简洁的API
 */
export const Grid: React.FC<GridProps> = ({
  spacing = 'medium',
  verticalAlign = 'top',
  horizontalAlign = 'start',
  wrap = true,
  className,
  children,
  ...props
}) => {
  // 映射间距到数值
  const getGutter = (): number => {
    if (typeof spacing === 'number') return spacing;
    
    switch (spacing) {
      case 'none':
        return 0;
      case 'small':
        return 8;
      case 'large':
        return 24;
      default: // medium
        return 16;
    }
  };

  // 映射垂直对齐
  const getVerticalAlign = (): RowProps['align'] => {
    switch (verticalAlign) {
      case 'middle':
        return 'middle';
      case 'bottom':
        return 'bottom';
      case 'stretch':
        return 'stretch';
      default:
        return 'top';
    }
  };

  // 映射水平对齐
  const getHorizontalAlign = (): RowProps['justify'] => {
    switch (horizontalAlign) {
      case 'center':
        return 'center';
      case 'end':
        return 'end';
      case 'space-between':
        return 'space-between';
      case 'space-around':
        return 'space-around';
      case 'space-evenly':
        return 'space-evenly';
      default:
        return 'start';
    }
  };

  const gridClassName = cn(
    'ui-grid',
    spacing === 'none' && 'ui-grid--no-spacing',
    spacing === 'small' && 'ui-grid--small-spacing',
    spacing === 'medium' && 'ui-grid--medium-spacing',
    spacing === 'large' && 'ui-grid--large-spacing',
    !wrap && 'ui-grid--no-wrap',
    className
  );

  return (
    <Row
      {...props}
      gutter={getGutter()}
      align={getVerticalAlign()}
      justify={getHorizontalAlign()}
      wrap={wrap}
      className={gridClassName}
    >
      {children}
    </Row>
  );
};

/**
 * 网格项组件
 * 基于Ant Design的Col组件，提供更简洁的API
 */
export const GridItem: React.FC<GridItemProps> = ({
  className,
  children,
  ...props
}) => {
  const gridItemClassName = cn(
    'ui-grid-item',
    className
  );

  return (
    <Col
      {...props}
      className={gridItemClassName}
    >
      {children}
    </Col>
  );
};

/**
 * 响应式网格项组件
 * 预定义的响应式配置
 */
export const ResponsiveGridItem: React.FC<{
  children: React.ReactNode;
  className?: string;
  /** 手机端 */
  mobile?: number;
  /** 平板端 */
  tablet?: number;
  /** 桌面端 */
  desktop?: number;
  /** 大屏幕 */
  large?: number;
}> = ({
  children,
  className,
  mobile = 24,
  tablet = 12,
  desktop = 8,
  large = 6,
}) => {
  return (
    <GridItem
      xs={mobile}
      sm={tablet}
      md={desktop}
      lg={large}
      className={className}
    >
      {children}
    </GridItem>
  );
};

/**
 * 等宽网格容器
 * 自动将子元素等分为指定列数
 */
export const EqualGrid: React.FC<{
  children: React.ReactNode;
  columns: number;
  spacing?: GridProps['spacing'];
  className?: string;
}> = ({
  children,
  columns,
  spacing = 'medium',
  className,
}) => {
  const span = Math.floor(24 / columns);
  
  return (
    <Grid spacing={spacing} className={className}>
      {React.Children.map(children, (child, index) => (
        <GridItem key={index} span={span}>
          {child}
        </GridItem>
      ))}
    </Grid>
  );
};