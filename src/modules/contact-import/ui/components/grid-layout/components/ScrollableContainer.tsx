// src/modules/contact-import/ui/components/grid-layout/components/ScrollableContainer.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React, { ReactNode, useRef, useEffect } from 'react';
import { useViewportHeight } from '../hooks/useViewportHeight';
import '../styles/scrollable.css';

export interface ScrollableContainerProps {
  children: ReactNode;
  className?: string;
  excludeSelectors?: string[];
  enableVirtualScrolling?: boolean;
  scrollbarStyle?: 'auto' | 'overlay' | 'hidden';
}

export const ScrollableContainer: React.FC<ScrollableContainerProps> = ({
  children,
  className = '',
  excludeSelectors = [],
  enableVirtualScrolling = false,
  scrollbarStyle = 'auto',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { availableHeight } = useViewportHeight({ 
    excludeSelectors,
    padding: 32 // 为工具栏和边距留出空间
  });

  // 处理平滑滚动和键盘导航
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          container.scrollBy({
            top: e.key === 'PageDown' ? container.clientHeight * 0.9 : 100,
            behavior: 'smooth'
          });
          break;
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          container.scrollBy({
            top: e.key === 'PageUp' ? -container.clientHeight * 0.9 : -100,
            behavior: 'smooth'
          });
          break;
        case 'Home':
          e.preventDefault();
          container.scrollTo({ top: 0, behavior: 'smooth' });
          break;
        case 'End':
          e.preventDefault();
          container.scrollTo({ 
            top: container.scrollHeight, 
            behavior: 'smooth' 
          });
          break;
      }
    };

    // 只在容器聚焦时启用键盘导航
    container.addEventListener('keydown', handleKeyDown);
    container.setAttribute('tabindex', '0');

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const containerStyle: React.CSSProperties = {
    height: `${availableHeight}px`,
    overflowY: scrollbarStyle === 'hidden' ? 'hidden' : 'auto',
    overflowX: 'hidden',
    position: 'relative',
    // 优化滚动性能
    willChange: 'scroll-position',
    // 自定义滚动条样式
    scrollBehavior: 'smooth',
    ...(scrollbarStyle === 'overlay' && {
      // Webkit滚动条样式
      WebkitOverflowScrolling: 'touch',
    }),
  };

  // 虚拟滚动的基础实现（可扩展）
  if (enableVirtualScrolling) {
    return (
      <div
        ref={containerRef}
        className={`scrollable-container virtual-scroll ${className}`}
        style={containerStyle}
        role="region"
        aria-label="可滚动内容区域"
      >
        <div className="virtual-scroll-content">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`scrollable-container ${className}`}
      style={{
        ...containerStyle,
        // 自定义滚动条样式通过CSS变量实现
      }}
      role="region"
      aria-label="可滚动内容区域"
    >
      {children}
    </div>
  );
};