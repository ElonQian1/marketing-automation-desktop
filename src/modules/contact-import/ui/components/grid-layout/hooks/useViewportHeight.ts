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

  const calculateDimensions = useCallback(() => {
    if (typeof window === 'undefined') return;

    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    // 计算被排除元素占用的高度
    let excludedHeight = 0;
    excludeSelectors.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        excludedHeight += rect.height;
      }
    });

    // 计算可用高度
    const availableHeight = Math.max(
      minHeight,
      windowHeight - excludedHeight - padding
    );

    setDimensions({
      width: windowWidth,
      height: windowHeight,
      availableHeight,
    });
  }, [excludeSelectors, minHeight, padding]);

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

    observer.observe(document.body, {
      childList: true,
      subtree: true,
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