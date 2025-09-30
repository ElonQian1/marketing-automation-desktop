import React, { ReactNode, useRef, useEffect, useState } from 'react';
import { Card, Button, Space } from 'antd';
import { CloseOutlined, MinusOutlined, DragOutlined, FullscreenOutlined } from '@ant-design/icons';

export interface EnhancedResizablePanelProps {
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

export const EnhancedResizablePanel: React.FC<EnhancedResizablePanelProps> = ({
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

      // 获取父容器的高度
      const parentElement = container.closest('.react-grid-item');
      if (parentElement) {
        const parentRect = parentElement.getBoundingClientRect();
        const cardHeader = container.previousElementSibling as HTMLElement;
        const headerHeight = cardHeader ? cardHeader.offsetHeight : 48;
        
        // 计算可用的内容高度
        const availableHeight = parentRect.height - headerHeight - 24; // 24px for padding
        const finalHeight = maxContentHeight 
          ? Math.min(availableHeight, maxContentHeight)
          : availableHeight;
        
        setContentHeight(Math.max(200, finalHeight)); // 最小高度200px
      }
    };

    // 初始计算
    updateContentHeight();

    // 监听父容器大小变化
    const resizeObserver = new ResizeObserver(updateContentHeight);
    const parentElement = contentRef.current.closest('.react-grid-item');
    if (parentElement) {
      resizeObserver.observe(parentElement);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [enableAutoScroll, maxContentHeight]);

  // 头部操作按钮
  const headerControls = (
    <Space size="small">
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

  // 拖拽手柄
  const dragHandle = (
    <div className="drag-handle" style={{ 
      cursor: 'move', 
      display: 'inline-flex', 
      alignItems: 'center',
      marginRight: '8px'
    }}>
      <DragOutlined style={{ color: '#666' }} />
    </div>
  );

  const titleWithHandle = (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      {dragHandle}
      <div style={{ flex: 1 }}>{title}</div>
    </div>
  );

  return (
    <Card
      className={`resizable-panel-content ${className}`}
      title={titleWithHandle}
      extra={headerControls}
      size="small"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        margin: 0,
      }}
      bodyStyle={{
        flex: 1,
        padding: 0,
        overflow: 'hidden',
        height: contentHeight ? `${contentHeight}px` : 'auto',
      }}
    >
      <div
        ref={contentRef}
        className="resizable-panel-body"
        style={{
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '16px',
        }}
      >
        {children}
      </div>
    </Card>
  );
};