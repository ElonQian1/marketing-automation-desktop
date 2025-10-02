/**
 * 使用 Ant Design 官方推荐的 react-resizable 实现
 */

import React from 'react';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';

export interface ResizableHeaderProps {
  width?: number;
  onResize?: (width: number) => void;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const ResizableHeader: React.FC<ResizableHeaderProps> = ({
  width = 120,
  onResize,
  children,
  className,
  style,
  ...restProps
}) => {
  if (!onResize) {
    // 不可拖拽的普通表头
    return (
      <th className={className} style={{ ...style, width }} {...restProps}>
        {children}
      </th>
    );
  }

  return (
    <Resizable
      width={width}
      height={0}
      resizeHandles={['e']}  // 使用右边缘拖拽，不是右下角！
      onResize={(e, { size }) => onResize(size.width)}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th
        className={className}
        style={{
          ...style,
          width,
          position: 'relative',
          userSelect: 'none'
        }}
        {...restProps}
      >
        {children}
      </th>
    </Resizable>
  );
};

/**
 * 用于Ant Design Table的表头组件
 */
export const AntTableResizableHeader: React.FC<any> = (props) => {
  const { width, onResize, ...restProps } = props;
  
  return (
    <ResizableHeader
      width={width}
      onResize={onResize}
      {...restProps}
    />
  );
};