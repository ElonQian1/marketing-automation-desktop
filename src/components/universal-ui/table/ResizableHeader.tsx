/**
 * 可拖拽调整宽度的表头组件
 */

import React, { useRef, useMemo, useCallback, useState } from 'react';
import { Tooltip } from 'antd';

export interface ResizableHeaderProps {
  width?: number;
  onResizeStart?: (e: React.PointerEvent<HTMLDivElement>) => void;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

// 优化的拖拽手柄样式 - 更好的用户体验
const useDragHandleStyles = () => useMemo(() => ({
  // 扩展的可点击区域
  clickArea: {
    position: 'absolute' as const,
    right: -8,
    top: 0,
    bottom: 0,
    width: 16,
    cursor: 'col-resize' as const,
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 可视化手柄
  handle: {
    width: 8,
    height: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: '3px',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(0, 0, 0, 0.05)',
  },
  handleHover: {
    backgroundColor: '#1890ff',
    width: 10,
    height: 24,
    boxShadow: '0 2px 4px rgba(24, 144, 255, 0.3)',
  },
  handleActive: {
    backgroundColor: '#096dd9',
    width: 10,
    height: 24,
    boxShadow: '0 2px 6px rgba(9, 109, 217, 0.4)',
  },
  // 拖拽图标样式 - 三个小点
  dots: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1px',
  },
  dot: {
    width: 2,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '50%',
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

  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // 优化事件处理器
  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    onResizeStart?.(e);
    
    // 监听全局pointer事件来重置拖拽状态
    const handlePointerUp = () => {
      setIsDragging(false);
      document.removeEventListener('pointerup', handlePointerUp);
    };
    
    document.addEventListener('pointerup', handlePointerUp);
  }, [onResizeStart]);

  // 计算拖拽手柄的动态样式
  const handleStyle = useMemo(() => {
    const baseStyle = dragHandleStyles.handle;
    if (isDragging) {
      return { ...baseStyle, ...dragHandleStyles.handleActive };
    }
    if (isHovering) {
      return { ...baseStyle, ...dragHandleStyles.handleHover };
    }
    return baseStyle;
  }, [dragHandleStyles, isHovering, isDragging]);

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
      <div style={{ 
        position: 'relative', 
        height: '100%', 
        display: 'flex',
        alignItems: 'center',
        paddingRight: '16px' // 为拖拽手柄留出空间
      }}>
        {children}
        
        {/* 增强的拖拽手柄 */}
        <Tooltip title="拖拽调整列宽" placement="top">
          <div
            onPointerDown={handlePointerDown}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={dragHandleStyles.clickArea}
          >
            {/* 可视化手柄 */}
            <div style={handleStyle}>
              {/* 拖拽图标 - 三个小点 */}
              <div style={dragHandleStyles.dots}>
                <div style={dragHandleStyles.dot} />
                <div style={dragHandleStyles.dot} />
                <div style={dragHandleStyles.dot} />
              </div>
            </div>
          </div>
        </Tooltip>
      </div>
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