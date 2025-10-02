/**
 * 可拖拽调整宽度的表头组件
 */

import React, { useRef, useMemo, useCallback } from 'react';
import { Tooltip } from 'antd';

export interface ResizableHeaderProps {
  width?: number;
  onResizeStart?: (e: React.PointerEvent<HTMLDivElement>) => void;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

// 优化的拖拽手柄样式 - 使用 useMemo 避免重复计算
const useDragHandleStyles = () => useMemo(() => ({
  base: {
    position: 'absolute' as const,
    right: -2,
    top: 0,
    bottom: 0,
    width: 4,
    cursor: 'col-resize' as const,
    backgroundColor: 'transparent',
    borderRight: '2px solid transparent',
    transition: 'border-color 0.2s',
    zIndex: 1,
  },
  hover: {
    borderRightColor: '#1890ff',
  },
  normal: {
    borderRightColor: 'transparent',
  }
}), []);

const ResizableHeaderComponent: React.FC<ResizableHeaderProps> = ({
  width,
  onResizeStart,
  children,
  className,
  style,
  ...restProps
}) => {
  const headerRef = useRef<HTMLTableHeaderCellElement>(null);
  const dragHandleStyles = useDragHandleStyles();

  // 优化事件处理器 - 使用 useCallback 避免重复创建
  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.borderRightColor = dragHandleStyles.hover.borderRightColor;
  }, [dragHandleStyles.hover.borderRightColor]);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.borderRightColor = dragHandleStyles.normal.borderRightColor;
  }, [dragHandleStyles.normal.borderRightColor]);

  // 计算表头样式 - 使用 useMemo 避免重复计算
  const headerStyle = useMemo(() => ({
    ...style,
    width,
    position: 'relative' as const,
  }), [style, width]);

  if (!onResizeStart) {
    // 不可拖拽的普通表头
    return (
      <th
        ref={headerRef}
        className={className}
        style={headerStyle}
        {...restProps}
      >
        {children}
      </th>
    );
  }

  return (
    <th
      ref={headerRef}
      className={className}
      style={headerStyle}
      {...restProps}
    >
      {children}
      
      {/* 拖拽手柄 */}
      <Tooltip title="拖拽调整列宽" placement="top">
        <div
          onPointerDown={onResizeStart}
          style={dragHandleStyles.base}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      </Tooltip>
    </th>
  );
};

// 使用 React.memo 优化性能，避免不必要的重新渲染
export const ResizableHeader = React.memo(ResizableHeaderComponent);

/**
 * 用于Ant Design Table的表头组件
 */
const AntTableResizableHeaderComponent: React.FC<any> = (props) => {
  const { resizableProps, ...restProps } = props;
  
  return (
    <ResizableHeader
      width={resizableProps?.width}
      onResizeStart={resizableProps?.onResizeStart}
      {...restProps}
    />
  );
};

export const AntTableResizableHeader = React.memo(AntTableResizableHeaderComponent);