/**
 * 高级交互体验优化模块
 * 提供动画、过渡、用户体验增强功能
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface AnimationConfig {
  /** 淡入动画时长（毫秒） */
  fadeInDuration?: number;
  /** 淡出动画时长（毫秒） */
  fadeOutDuration?: number;
  /** 是否启用动画 */
  enableAnimation?: boolean;
  /** 动画缓动函数 */
  easing?: string;
}

export interface UserExperienceOptions {
  /** 防抖延迟时间（毫秒） */
  debounceDelay?: number;
  /** 是否显示加载状态 */
  showLoading?: boolean;
  /** 加载状态最小显示时间（毫秒） */
  minLoadingTime?: number;
  /** 动画配置 */
  animation?: AnimationConfig;
}

/**
 * 高级用户体验管理 Hook
 */
export const useAdvancedUserExperience = (options: UserExperienceOptions = {}) => {
  const {
    debounceDelay = 300,
    showLoading = true,
    minLoadingTime = 500,
    animation = {
      fadeInDuration: 200,
      fadeOutDuration: 150,
      enableAnimation: true,
      easing: 'ease-out'
    }
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [animationState, setAnimationState] = useState<'entering' | 'entered' | 'exiting' | 'exited'>('exited');
  
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 清理定时器
  const clearTimeouts = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
  }, []);

  // 防抖显示
  const debouncedShow = useCallback((callback?: () => void) => {
    clearTimeouts();
    
    debounceTimeoutRef.current = setTimeout(() => {
      console.log('🎨 [AdvancedUX] 防抖显示触发');
      
      if (animation.enableAnimation) {
        setAnimationState('entering');
        animationTimeoutRef.current = setTimeout(() => {
          setAnimationState('entered');
          callback?.();
        }, animation.fadeInDuration);
      }
      
      setIsVisible(true);
      
      if (showLoading) {
        setIsLoading(true);
        loadingTimeoutRef.current = setTimeout(() => {
          setIsLoading(false);
        }, minLoadingTime);
      }
      
      callback?.();
    }, debounceDelay);
  }, [debounceDelay, showLoading, minLoadingTime, animation, clearTimeouts]);

  // 防抖隐藏
  const debouncedHide = useCallback((callback?: () => void) => {
    clearTimeouts();
    
    if (animation.enableAnimation) {
      setAnimationState('exiting');
      animationTimeoutRef.current = setTimeout(() => {
        setAnimationState('exited');
        setIsVisible(false);
        setIsLoading(false);
        callback?.();
      }, animation.fadeOutDuration);
    } else {
      setIsVisible(false);
      setIsLoading(false);
      callback?.();
    }
    
    console.log('🎨 [AdvancedUX] 防抖隐藏触发');
  }, [animation, clearTimeouts]);

  // 立即显示（跳过防抖）
  const immediateShow = useCallback((callback?: () => void) => {
    clearTimeouts();
    setIsVisible(true);
    setAnimationState('entered');
    callback?.();
  }, [clearTimeouts]);

  // 立即隐藏（跳过防抖和动画）
  const immediateHide = useCallback((callback?: () => void) => {
    clearTimeouts();
    setIsVisible(false);
    setIsLoading(false);
    setAnimationState('exited');
    callback?.();
  }, [clearTimeouts]);

  // 获取动画样式
  const getAnimationStyle = useCallback((): React.CSSProperties => {
    if (!animation.enableAnimation) {
      return {};
    }

    const baseStyle: React.CSSProperties = {
      transition: `opacity ${animation.fadeInDuration}ms ${animation.easing}, transform ${animation.fadeInDuration}ms ${animation.easing}`,
    };

    switch (animationState) {
      case 'entering':
        return {
          ...baseStyle,
          opacity: 0,
          transform: 'scale(0.95) translateY(-10px)',
        };
      case 'entered':
        return {
          ...baseStyle,
          opacity: 1,
          transform: 'scale(1) translateY(0)',
        };
      case 'exiting':
        return {
          ...baseStyle,
          opacity: 0,
          transform: 'scale(0.95) translateY(10px)',
        };
      case 'exited':
      default:
        return {
          ...baseStyle,
          opacity: 0,
          transform: 'scale(0.9) translateY(-10px)',
          pointerEvents: 'none' as const
        };
    }
  }, [animation, animationState]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, [clearTimeouts]);

  return {
    // 状态
    isVisible,
    isLoading,
    animationState,
    
    // 控制方法
    debouncedShow,
    debouncedHide,
    immediateShow,
    immediateHide,
    
    // 样式和配置
    getAnimationStyle,
    animation
  };
};

/**
 * 专门用于气泡组件的用户体验优化
 */
export const usePopoverUserExperience = (
  visible: boolean,
  onVisibilityChange?: (visible: boolean) => void
) => {
  const uxManager = useAdvancedUserExperience({
    debounceDelay: 150,
    showLoading: false,
    animation: {
      fadeInDuration: 200,
      fadeOutDuration: 150,
      enableAnimation: true,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  });

  // 响应外部visible状态变化
  useEffect(() => {
    if (visible && !uxManager.isVisible) {
      uxManager.debouncedShow(() => {
        onVisibilityChange?.(true);
      });
    } else if (!visible && uxManager.isVisible) {
      uxManager.debouncedHide(() => {
        onVisibilityChange?.(false);
      });
    }
  }, [visible, uxManager, onVisibilityChange]);

  // 获取增强的气泡样式
  const getPopoverStyle = useCallback((baseStyle: React.CSSProperties = {}): React.CSSProperties => {
    return {
      ...baseStyle,
      ...uxManager.getAnimationStyle(),
    };
  }, [uxManager]);

  return {
    isVisible: uxManager.isVisible,
    animationState: uxManager.animationState,
    getPopoverStyle,
    forceShow: uxManager.immediateShow,
    forceHide: uxManager.immediateHide
  };
};

/**
 * 交互反馈工具类
 */
export class InteractionFeedback {
  /**
   * 触觉反馈（如果设备支持）
   */
  static vibrate(pattern: number | number[] = 10) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        console.warn('触觉反馈不支持:', e);
      }
    }
  }

  /**
   * 音频反馈
   */
  static playSound(type: 'click' | 'success' | 'error' | 'warning' = 'click') {
    // 这里可以添加音频播放逻辑
    console.log(`🔊 播放音效: ${type}`);
  }

  /**
   * 视觉反馈 - 高亮元素
   */
  static highlightElement(elementId: string, duration: number = 1000) {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.style.transition = 'box-shadow 0.3s ease';
    element.style.boxShadow = '0 0 0 3px rgba(24, 144, 255, 0.5)';

    setTimeout(() => {
      element.style.boxShadow = '';
    }, duration);
  }
}