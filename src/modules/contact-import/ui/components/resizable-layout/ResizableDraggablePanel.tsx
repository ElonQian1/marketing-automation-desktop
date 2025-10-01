import React, { useRef, useState, useCallback, ReactNode } from 'react';
import { Card, Button, Space } from 'antd';
import { CloseOutlined, MinusOutlined, BorderOutlined, ExpandOutlined, DragOutlined } from '@ant-design/icons';
import { PanelConfig } from './useResizableLayout';

interface ResizableDraggablePanelProps {
  config: PanelConfig;
  onUpdate: (updates: Partial<PanelConfig>) => void;
  onFocus: () => void;
  children: ReactNode;
  className?: string;
}

export const ResizableDraggablePanel: React.FC<ResizableDraggablePanelProps> = ({
  config,
  onUpdate,
  onFocus,
  children,
  className = '',
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // 拖拽开始
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('drag-handle')) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - config.x,
        y: e.clientY - config.y,
      });
      onFocus();
    }
  }, [config.x, config.y, onFocus]);

  // 调整大小开始
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: config.width,
      height: config.height,
    });
    onFocus();
  }, [config.width, config.height, onFocus]);

  // 鼠标移动处理
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = Math.max(0, e.clientX - dragStart.x);
      const newY = Math.max(0, e.clientY - dragStart.y);
      onUpdate({ x: newX, y: newY });
    } else if (isResizing) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      const newWidth = Math.max(config.minWidth || 200, resizeStart.width + deltaX);
      const newHeight = Math.max(config.minHeight || 150, resizeStart.height + deltaY);
      
      // 限制最大尺寸
      const maxWidth = config.maxWidth || window.innerWidth;
      const maxHeight = config.maxHeight || window.innerHeight;
      
      onUpdate({
        width: Math.min(newWidth, maxWidth),
        height: Math.min(newHeight, maxHeight),
      });
    }
  }, [isDragging, isResizing, dragStart, resizeStart, config, onUpdate]);

  // 鼠标释放处理
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  // 注册全局鼠标事件
  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // 切换最小化
  const handleMinimize = useCallback(() => {
    onUpdate({ isMinimized: !config.isMinimized });
  }, [config.isMinimized, onUpdate]);

  // 关闭面板
  const handleClose = useCallback(() => {
    onUpdate({ isVisible: false });
  }, [onUpdate]);

  // 如果面板不可见，不渲染
  if (config.isVisible === false) {
    return null;
  }

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    left: config.x,
    top: config.y,
    width: config.width,
    height: config.isMinimized ? 'auto' : config.height,
    minWidth: config.minWidth || 200,
    minHeight: config.isMinimized ? 'auto' : (config.minHeight || 150),
    maxWidth: config.maxWidth,
    maxHeight: config.maxHeight,
    zIndex: config.zIndex || 1,
    cursor: isDragging ? 'grabbing' : 'default',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    borderRadius: '6px',
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    cursor: 'grab',
    padding: 'var(--space-2) var(--space-4)',
    borderBottom: '1px solid var(--border-primary)',
    backgroundColor: 'var(--bg-elevated)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const contentStyle: React.CSSProperties = {
    height: config.isMinimized ? 0 : config.height - 47, // 减去header高度
    overflow: config.isMinimized ? 'hidden' : 'auto',
    padding: config.isMinimized ? 0 : '16px',
  };

  const resizeHandleStyle: React.CSSProperties = {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '20px',
    height: '20px',
    cursor: 'nw-resize',
    backgroundColor: 'transparent',
  };

  return (
    <div
      ref={panelRef}
      className={`resizable-draggable-panel ${className}`}
      style={panelStyle}
      onMouseDown={handleMouseDown}
    >
      {/* 面板头部 */}
      <div className="drag-handle" style={headerStyle}>
        <Space>
          <DragOutlined />
          <span style={{ fontWeight: 500 }}>{config.title}</span>
        </Space>
        <Space size="small">
          <Button
            type="text"
            icon={<MinusOutlined />}
            size="small"
            onClick={handleMinimize}
            title={config.isMinimized ? '展开' : '最小化'}
          />
          <Button
            type="text"
            icon={<CloseOutlined />}
            size="small"
            onClick={handleClose}
            title="关闭"
          />
        </Space>
      </div>

      {/* 面板内容 */}
      <div style={contentStyle}>
        {children}
      </div>

      {/* 调整大小句柄 */}
      {!config.isMinimized && (
        <div
          style={resizeHandleStyle}
          onMouseDown={handleResizeMouseDown}
          title="拖拽调整大小"
        >
          <div style={{
            position: 'absolute',
            right: '4px',
            bottom: '4px',
            width: '12px',
            height: '12px',
            background: 'linear-gradient(-45deg, transparent 30%, #ccc 30%, #ccc 35%, transparent 35%, transparent 65%, #ccc 65%, #ccc 70%, transparent 70%)',
          }} />
        </div>
      )}
    </div>
  );
};