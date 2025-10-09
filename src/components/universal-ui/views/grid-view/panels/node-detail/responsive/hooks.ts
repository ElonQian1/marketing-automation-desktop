import { useState, useEffect, useCallback } from 'react';
import { BREAKPOINTS, DEVICE_TYPES, type Breakpoint, type DeviceType } from './constants';

interface ViewportDimensions {
  width: number;
  height: number;
}

interface BreakpointInfo {
  currentBreakpoint: Breakpoint;
  deviceType: DeviceType;
  isXs: boolean;
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  is2xl: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

/**
 * 🎯 响应式断点检测 Hook
 * 
 * 📍 功能：
 * - 实时监听窗口尺寸变化
 * - 提供当前断点和设备类型信息
 * - 支持防抖优化避免频繁更新
 * - 提供便捷的断点判断方法
 */
export const useBreakpoint = (debounceMs: number = 150): BreakpointInfo => {
  const [viewport, setViewport] = useState<ViewportDimensions>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  }));

  // 获取当前断点
  const getCurrentBreakpoint = useCallback((width: number): Breakpoint => {
    if (width >= BREAKPOINTS['2xl']) return '2xl';
    if (width >= BREAKPOINTS.xl) return 'xl';
    if (width >= BREAKPOINTS.lg) return 'lg';
    if (width >= BREAKPOINTS.md) return 'md';
    if (width >= BREAKPOINTS.sm) return 'sm';
    return 'xs';
  }, []);

  // 获取设备类型
  const getDeviceType = useCallback((width: number): DeviceType => {
    if (width < DEVICE_TYPES.mobile.max) return 'mobile';
    if (width < DEVICE_TYPES.tablet.max) return 'tablet';
    return 'desktop';
  }, []);

  // 防抖更新处理
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setViewport({
          width: window.innerWidth,
          height: window.innerHeight
        });
      }, debounceMs);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(timeoutId);
    };
  }, [debounceMs]);

  // 计算断点信息
  const currentBreakpoint = getCurrentBreakpoint(viewport.width);
  const deviceType = getDeviceType(viewport.width);

  return {
    currentBreakpoint,
    deviceType,
    isXs: currentBreakpoint === 'xs',
    isSm: currentBreakpoint === 'sm',
    isMd: currentBreakpoint === 'md',
    isLg: currentBreakpoint === 'lg',
    isXl: currentBreakpoint === 'xl',
    is2xl: currentBreakpoint === '2xl',
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop'
  };
};

/**
 * 🖥️ 视口尺寸监听 Hook
 */
export const useViewport = (debounceMs: number = 150): ViewportDimensions & {
  isLandscape: boolean;
  isPortrait: boolean;
  aspectRatio: number;
} => {
  const [viewport, setViewport] = useState<ViewportDimensions>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  }));

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setViewport({
          width: window.innerWidth,
          height: window.innerHeight
        });
      }, debounceMs);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(timeoutId);
    };
  }, [debounceMs]);

  return {
    ...viewport,
    isLandscape: viewport.width > viewport.height,
    isPortrait: viewport.height > viewport.width,
    aspectRatio: viewport.width / viewport.height
  };
};

/**
 * 📱 移动端检测 Hook
 */
export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    
    // 基于用户代理检测
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = ['mobile', 'android', 'iphone', 'ipod', 'blackberry', 'windows phone'];
    const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
    
    // 基于屏幕尺寸检测
    const isMobileSize = window.innerWidth < BREAKPOINTS.md;
    
    // 基于触摸支持检测
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    return isMobileUA || (isMobileSize && isTouchDevice);
  });

  const [hasHover, setHasHover] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(hover: hover)').matches;
  });

  useEffect(() => {
    const hoverQuery = window.matchMedia('(hover: hover)');
    const handleHoverChange = (e: MediaQueryListEvent) => setHasHover(e.matches);
    
    hoverQuery.addEventListener('change', handleHoverChange);
    return () => hoverQuery.removeEventListener('change', handleHoverChange);
  }, []);

  return {
    isMobile,
    hasHover,
    isTouchDevice: !hasHover,
    isHoverCapable: hasHover
  };
};

/**
 * 🎯 媒体查询 Hook
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
};

/**
 * 🔧 响应式值选择 Hook
 * 
 * 根据当前断点返回对应的值
 */
export const useResponsiveValue = <T>(values: {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}): T | undefined => {
  const { currentBreakpoint } = useBreakpoint();
  
  // 按优先级返回最适合的值
  const breakpointOrder: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
  
  for (let i = currentIndex; i < breakpointOrder.length; i++) {
    const bp = breakpointOrder[i];
    if (values[bp] !== undefined) {
      return values[bp];
    }
  }
  
  return undefined;
};

/**
 * 📐 容器查询模拟 Hook
 * 
 * 监听指定元素的尺寸变化（模拟容器查询）
 */
export const useContainerQuery = (elementRef: React.RefObject<HTMLElement>) => {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!elementRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });

    resizeObserver.observe(elementRef.current);
    return () => resizeObserver.disconnect();
  }, [elementRef]);

  // 基于容器尺寸的断点判断
  const getContainerBreakpoint = useCallback((width: number): Breakpoint => {
    if (width >= 1280) return 'xl';
    if (width >= 1024) return 'lg';
    if (width >= 768) return 'md';
    if (width >= 640) return 'sm';
    return 'xs';
  }, []);

  return {
    ...containerSize,
    containerBreakpoint: getContainerBreakpoint(containerSize.width),
    isContainerNarrow: containerSize.width < 480,
    isContainerWide: containerSize.width > 1200
  };
};