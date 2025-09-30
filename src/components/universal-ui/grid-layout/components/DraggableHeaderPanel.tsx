import React, { ReactNode, useRef, useEffect, useState } from 'react';
import { Card, Button, Space } from 'antd';
import { CloseOutlined, MinusOutlined, FullscreenOutlined } from '@ant-design/icons';

export interface DraggableHeaderPanelProps {
  /** 面板标题 */
  title: string | ReactNode;
  /** 面板内容 */
  children: ReactNode;
  /** 关闭按钮回调 */
  onClose?: () => void;
  /** 最小化按钮回调 */
  onMinimize?: () => void;
  /** 最大化按钮回调 */
  onMaximize?: () => void;
  /** 是否显示关闭按钮 */
  showCloseButton?: boolean;
  /** 是否显示最小化按钮 */
  showMinimizeButton?: boolean;
  /** 是否显示最大化按钮 */
  showMaximizeButton?: boolean;
  /** 标题栏额外操作 */
  headerActions?: ReactNode;
  /** 自定义样式类名 */
  className?: string;
  /** 是否启用自动滚动 */
  enableAutoScroll?: boolean;
  /** 最大内容高度 */
  maxContentHeight?: number;
  /** 面板样式 */
  style?: React.CSSProperties;
  /** 标题栏样式 */
  headerStyle?: React.CSSProperties;
  /** 内容区域样式 */
  bodyStyle?: React.CSSProperties;
}

/**
 * 通用可拖拽标题栏面板组件
 * 
 * 特点：
 * ✅ 标题栏空白区域可以拖拽
 * ✅ 标题栏按钮不会被拖拽劫持  
 * ✅ 内容区域完全不受拖拽影响
 * ✅ 支持自定义标题栏操作
 * ✅ 响应式设计和自动滚动
 * ✅ 完全通用，可在任意页面复用
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
  style,
  headerStyle,
  bodyStyle,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);

  // 动态计算内容高度
  useEffect(() => {
    if (!enableAutoScroll || !contentRef.current) return;

    const updateContentHeight = () => {
      const container = contentRef.current;
      if (!container) return;

      const containerHeight = container.clientHeight;
      const scrollHeight = container.scrollHeight;
      
      if (scrollHeight > containerHeight) {
        const calculatedHeight = maxContentHeight 
          ? Math.min(scrollHeight + 20, maxContentHeight)
          : scrollHeight + 20;
        setContentHeight(calculatedHeight);
      } else {
        setContentHeight(undefined);
      }
    };

    updateContentHeight();
    
    // 监听内容变化
    const resizeObserver = new ResizeObserver(updateContentHeight);
    resizeObserver.observe(contentRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [enableAutoScroll, maxContentHeight, children]);

  // 构建标题栏操作按钮
  const buildHeaderExtra = () => {
    const buttons = [];
    
    // 自定义操作按钮
    if (headerActions) {
      buttons.push(
        <div key="custom-actions" className="panel-header-controls">
          {headerActions}
        </div>
      );
    }
    
    // 系统按钮
    const systemButtons = [];
    
    if (showMinimizeButton && onMinimize) {
      systemButtons.push(
        <Button
          key="minimize"
          type="text"
          size="small"
          icon={<MinusOutlined />}
          onClick={onMinimize}
        />
      );
    }
    
    if (showMaximizeButton && onMaximize) {
      systemButtons.push(
        <Button
          key="maximize"
          type="text"
          size="small"
          icon={<FullscreenOutlined />}
          onClick={onMaximize}
        />
      );
    }
    
    if (showCloseButton && onClose) {
      systemButtons.push(
        <Button
          key="close"
          type="text"
          size="small"
          icon={<CloseOutlined />}
          onClick={onClose}
          danger
        />
      );
    }
    
    if (systemButtons.length > 0) {
      buttons.push(
        <Space key="system-buttons" size="small" className="panel-header-controls">
          {systemButtons}
        </Space>
      );
    }
    
    return buttons.length > 0 ? (
      <Space 
        size="small"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {buttons}
      </Space>
    ) : null;
  };

  return (
    <Card
      title={
        <div className="draggable-header panel-header" style={headerStyle}>
          {title}
        </div>
      }
      extra={buildHeaderExtra()}
      className={`draggable-panel ${className}`}
      style={style}
      bodyStyle={bodyStyle}
      headStyle={{
        cursor: 'move',
        userSelect: 'none',
        ...headerStyle
      }}
    >
      <div
        ref={contentRef}
        className="panel-content panel-content-area"
        style={{
          height: contentHeight,
          overflowY: contentHeight ? 'auto' : 'visible',
          overflowX: 'hidden',
        }}
        onMouseDown={(e) => e.stopPropagation()} // 阻止内容区域触发拖拽
      >
        {children}
      </div>
    </Card>
  );
};

/**
 * 面板快速构建工具
 */
export const createDraggablePanel = (
  id: string,
  title: string,
  content: ReactNode,
  options: Partial<DraggableHeaderPanelProps> = {}
) => {
  return {
    id,
    title,
    content: (
      <DraggableHeaderPanel title={title} {...options}>
        {content}
      </DraggableHeaderPanel>
    ),
  };
};