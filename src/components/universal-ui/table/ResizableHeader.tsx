/**
 * 可拖拽调整宽度的表头组件
 */

import React, { useRef } from 'react';
import { Tooltip } from 'antd';

export interface ResizableHeaderProps {
  width?: number;
  onResizeStart?: (e: React.PointerEvent<HTMLDivElement>) => void;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const ResizableHeader: React.FC<ResizableHeaderProps> = ({
  width,
  onResizeStart,
  children,
  className,
  style,
  ...restProps
}) => {
  const headerRef = useRef<HTMLTableHeaderCellElement>(null);

  if (!onResizeStart) {
    // 不可拖拽的普通表头
    return (
      <th
        ref={headerRef}
        className={className}
        style={{ 
          ...style, 
          width,
          position: 'relative',
        }}
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
      style={{ 
        ...style, 
        width,
        position: 'relative',
      }}
      {...restProps}
    >
      {children}
      
      {/* 拖拽手柄 */}
      <Tooltip title="拖拽调整列宽" placement="top">
        <div
          onPointerDown={onResizeStart}
          style={{
            position: 'absolute',
            right: -2,
            top: 0,
            bottom: 0,
            width: 4,
            cursor: 'col-resize',
            backgroundColor: 'transparent',
            borderRight: '2px solid transparent',
            transition: 'border-color 0.2s',
            zIndex: 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderRightColor = '#1890ff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderRightColor = 'transparent';
          }}
        />
      </Tooltip>
    </th>
  );
};

/**
 * 用于Ant Design Table的表头组件
 */
export const AntTableResizableHeader: React.FC<any> = (props) => {
  const { resizableProps, ...restProps } = props;
  
  return (
    <ResizableHeader
      width={resizableProps?.width}
      onResizeStart={resizableProps?.onResizeStart}
      {...restProps}
    />
  );
};