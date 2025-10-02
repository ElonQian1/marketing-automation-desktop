/**
 * 智能气泡容器组件
 * 处理z-index层级和模态框遮挡问题
 */
import React from 'react';

interface SmartPopoverContainerProps {
  visible: boolean;
  hasModalOpen?: boolean;
  position: { x: number; y: number };
  children: React.ReactNode;
  containerRef?: React.RefObject<HTMLDivElement>;
}

export const SmartPopoverContainer: React.FC<SmartPopoverContainerProps> = ({
  visible,
  hasModalOpen = false,
  position,
  children,
  containerRef
}) => {
  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: hasModalOpen ? 1050 : 10000, // 模态框打开时降低层级
        pointerEvents: 'none',
      }}
    >
      {children}
    </div>
  );
};