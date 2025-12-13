// src/modules/contact-import/ui/components/grid-layout/ResizablePanel.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React, { ReactNode } from 'react';
import { Card, Button, Space } from 'antd';
import { CloseOutlined, MinusOutlined, DragOutlined, FullscreenOutlined } from '@ant-design/icons';

export interface ResizablePanelProps {
  title: string | ReactNode;
  children: ReactNode;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  showCloseButton?: boolean;
  showMinimizeButton?: boolean;
  showMaximizeButton?: boolean;
  headerActions?: ReactNode;
  bodyStyle?: React.CSSProperties;
  className?: string;
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  title,
  children,
  onClose,
  onMinimize,
  onMaximize,
  showCloseButton = true,
  showMinimizeButton = false,
  showMaximizeButton = false,
  headerActions,
  bodyStyle,
  className = '',
}) => {
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
          title="关闭"
          danger
        />
      )}
    </Space>
  );

  return (
    <Card
      className={`resizable-panel ${className}`}
      title={
        <Space>
          <DragOutlined 
            style={{ 
              cursor: 'grab', 
              color: '#999',
              fontSize: '12px' 
            }} 
            title="拖拽移动"
          />
          <span>{title}</span>
        </Space>
      }
      extra={headerControls}
      style={{
        height: '100%',
        border: '1px solid #f0f0f0',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      }}
      styles={{ 
        header: {
          borderBottom: '1px solid #f0f0f0',
          minHeight: '56px',
          padding: '0 16px',
          background: '#fafafa',
        },
        body: {
          height: 'calc(100% - 56px)', // 减去头部高度
          overflow: 'auto',
          padding: '16px',
          ...bodyStyle,
        }
      }}
    >
      {children}
    </Card>
  );
};