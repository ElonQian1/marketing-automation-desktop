import React, { ReactNode, useRef, useEffect, useState } from 'react';
import { Card, Button, Space } from 'antd';
import { CloseOutlined, MinusOutlined, FullscreenOutlined } from '@ant-design/icons';

export interface DraggableHeaderPanelProps {
  title: string | ReactNode;
  children: ReactNode;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  showCloseButton?: boolean;
  showMinimizeButton?: boolean;
  showMaximizeButton?: boolean;
  headerActions?: ReactNode;
  className?: string;
  enableAutoScroll?: boolean;
  maxContentHeight?: number;
}

/**
 * 可拖拽标题栏面板组件
 * 特点：
 * - 标题栏空白区域可以拖拽
 * - 标题栏按钮不会被拖拽劫持
 * - 内容区域完全不受拖拽影响
 */
export const DraggableHeaderPanel: React.FC<DraggableHeaderPanelProps> = ({
  title,
  children,
  onClose,
  onMinimize,
  onMaximize,
  showCloseButton = true,
  showMinimizeButton = false,
  showMaximizeButton = false,
  headerActions,
  className = '',
  enableAutoScroll = true,
  maxContentHeight,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);

  // 动态计算内容高度
  useEffect(() => {
    if (!enableAutoScroll || !contentRef.current) return;

    const updateContentHeight = () => {
      const container = contentRef.current;
      if (!container) return;

      const parentElement = container.closest('.react-grid-item');
      if (parentElement) {
        const parentRect = parentElement.getBoundingClientRect();
        const cardHeader = container.previousElementSibling as HTMLElement;
        const headerHeight = cardHeader ? cardHeader.offsetHeight : 48;
        
        const availableHeight = parentRect.height - headerHeight - 24;
        const finalHeight = maxContentHeight 
          ? Math.min(availableHeight, maxContentHeight)
          : availableHeight;
        
        setContentHeight(Math.max(200, finalHeight));
      }
    };

    updateContentHeight();

    const resizeObserver = new ResizeObserver(updateContentHeight);
    const parentElement = contentRef.current.closest('.react-grid-item');
    if (parentElement) {
      resizeObserver.observe(parentElement);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [enableAutoScroll, maxContentHeight]);

  // 头部操作按钮 - 阻止拖拽传播
  const headerControls = (
    <Space 
      size="small"
      className="panel-header-controls"
      onMouseDown={(e) => e.stopPropagation()} // 阻止拖拽事件传播
      onClick={(e) => e.stopPropagation()} // 确保点击不会触发拖拽
    >
      {headerActions}
      {showMinimizeButton && (
        <Button
          type="text"
          icon={<MinusOutlined />}
          size="small"
          onClick={onMinimize}
          title="最小化"
        />
      )}
      {showMaximizeButton && (
        <Button
          type="text"
          icon={<FullscreenOutlined />}
          size="small"
          onClick={onMaximize}
          title="最大化"
        />
      )}
      {showCloseButton && (
        <Button
          type="text"
          icon={<CloseOutlined />}
          size="small"
          onClick={onClose}
          title="关闭面板"
          danger
        />
      )}
    </Space>
  );

  // 可拖拽的标题栏区域
  const draggableTitle = (
    <div 
      className="panel-header-draggable" 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        width: '100%',
        cursor: 'move',  // 标题栏显示移动光标
        userSelect: 'none',  // 防止文本选择
        flex: 1,
        minHeight: '32px'  // 确保有足够的拖拽区域
      }}
    >
      <div style={{ flex: 1, paddingRight: '8px' }}>
        {title}
      </div>
    </div>
  );

  return (
    <Card
      className={`draggable-header-panel ${className}`}
      title={draggableTitle}
      extra={headerControls}
      size="small"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        margin: 0,
      }}
      styles={{
        header: {
          // 重要：标题栏样式，确保有足够的拖拽区域
          padding: 'var(--space-2) var(--space-4)',
          borderBottom: '1px solid var(--border-primary)',
          backgroundColor: 'var(--bg-elevated)',
          cursor: 'move',
          userSelect: 'none'
        },
        body: {
          flex: 1,
          padding: 0,
          overflow: 'hidden',
          height: contentHeight ? `${contentHeight}px` : 'auto',
          cursor: 'default'  // 内容区域使用默认光标
        }
      }}
    >
      <div
        ref={contentRef}
        className="panel-content-area"
        style={{
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '16px',
          cursor: 'default'  // 确保内容区域不显示移动光标
        }}
        onMouseDown={(e) => e.stopPropagation()} // 阻止内容区域的拖拽事件
      >
        {children}
      </div>
    </Card>
  );
};