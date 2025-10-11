// src/modules/contact-import/ui/components/grid-layout/hooks/useViewportHeight.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

import { useState, useEffect, useCallback, useRef } from 'react';

export interface ViewportDimensions {
  width: number;
  height: number;
  availableHeight: number;
}

export interface UseViewportHeightOptions {
  excludeSelectors?: string[]; // 要排除的元素选择器（如导航栏、工具栏等）
  minHeight?: number; // 最小高度
  padding?: number; // 额外的padding
}

export function useViewportHeight(options: UseViewportHeightOptions = {}) {
  const {
    excludeSelectors = [],
    minHeight = 400,
    padding = 16
  } = options;

  const [dimensions, setDimensions] = useState<ViewportDimensions>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    availableHeight: typeof window !== 'undefined' ? window.innerHeight - padding : 768 - padding,
  });

  const rafRef = useRef<number | null>(null);
  const optsRef = useRef<{ excludeSelectors: string[]; minHeight: number; padding: number }>({ excludeSelectors, minHeight, padding });

  // 同步最新 options 到 ref，避免因依赖变化导致 effect 反复重建
  useEffect(() => {
    optsRef.current = { excludeSelectors, minHeight, padding };
  }, [excludeSelectors, minHeight, padding]);

  const calculateDimensions = useCallback(() => {
    if (typeof window === 'undefined') return;

    const { excludeSelectors: ex, minHeight: minH, padding: pad } = optsRef.current;
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    // 计算被排除元素占用的高度
    let excludedHeight = 0;
    for (const selector of ex) {
      const element = document.querySelector(selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        excludedHeight += rect.height;
      }
    }

    // 计算可用高度
    const availableHeight = Math.max(
      minH,
      windowHeight - excludedHeight - pad
    );

    // 仅在确实发生变化时更新，避免渲染-观察-再渲染的死循环
    setDimensions(prev => {
      if (
        prev.width === windowWidth &&
        prev.height === windowHeight &&
        prev.availableHeight === availableHeight
      ) {
        return prev;
      }
      return { width: windowWidth, height: windowHeight, availableHeight };
    });
  }, []);

  useEffect(() => {
    // 初始计算
    calculateDimensions();

    // 防抖处理的resize监听器
    const handleResize = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(calculateDimensions);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // 监听DOM变化，以防导航栏等元素动态改变
    const observer = new MutationObserver(() => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(calculateDimensions);
    });

    // 仅观察 class/style 变化，限制在 body 直接子层，降低抖动概率
    observer.observe(document.body, {
      childList: true,
      subtree: false,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      observer.disconnect();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [calculateDimensions]);

  return dimensions;
}