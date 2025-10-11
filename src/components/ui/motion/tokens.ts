// src/components/ui/motion/tokens.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

// 文件路径：src/components/ui/motion/tokens.ts

/**
 * Motion Design Tokens 集成
 * 直接从 CSS 变量读取动效参数，确保与 Design Tokens 完全同步
 */

/**
 * 从 CSS 变量获取动效时长（返回秒为单位的数值）
 */
export function getMotionDuration(tokenName: string): number {
  if (typeof document === 'undefined') return 0.18; // SSR fallback
  
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--duration-${tokenName}`)
    .trim();
    
  return parseFloat(value) / 1000 || 0.18;
}

/**
 * 从 CSS 变量获取缓动函数
 */
export function getMotionEasing(tokenName: string): string {
  if (typeof document === 'undefined') return 'ease-out';
  
  return getComputedStyle(document.documentElement)
    .getPropertyValue(`--motion-${tokenName}`)
    .trim() || 'ease-out';
}

/**
 * 从 CSS 变量获取变换值
 */
export function getMotionScale(tokenName: string): number {
  if (typeof document === 'undefined') return 1;
  
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--motion-scale-${tokenName}`)
    .trim();
    
  return parseFloat(value) || 1;
}

/**
 * 现代化动效预设 - 基于 Design Tokens
 */
export const modernMotionPresets = {
  // 微交互 - 按钮悬停、点击反馈
  micro: {
    duration: () => getMotionDuration('micro'),
    ease: () => getMotionEasing('smooth'),
  },
  
  // 快速动效 - 悬停效果
  fast: {
    duration: () => getMotionDuration('fast'),
    ease: () => getMotionEasing('smooth'),
  },
  
  // 标准动效 - 组件入场
  normal: {
    duration: () => getMotionDuration('normal'),
    ease: () => getMotionEasing('spring'),
  },
  
  // 慢速动效 - 复杂转场
  slow: {
    duration: () => getMotionDuration('slow'),
    ease: () => getMotionEasing('spring'),
  },
  
  // 页面级动效
  page: {
    duration: () => getMotionDuration('slower'),
    ease: () => getMotionEasing('smooth'),
  }
} as const;

/**
 * 常用动效变体 - 使用 Design Tokens
 */
export const tokenBasedVariants = {
  // 悬停缩放效果
  hoverScale: {
    rest: { scale: 1 },
    hover: { 
      scale: getMotionScale('hover'),
      transition: {
        duration: getMotionDuration('fast'),
        ease: getMotionEasing('smooth')
      }
    },
    tap: { 
      scale: getMotionScale('active'),
      transition: {
        duration: getMotionDuration('micro'),
      }
    }
  },
  
  // 淡入入场效果
  fadeIn: {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: getMotionDuration('normal'),
        ease: getMotionEasing('spring')
      }
    }
  },
  
  // 滑动入场效果
  slideUp: {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: getMotionDuration('normal'),
        ease: getMotionEasing('spring')
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: {
        duration: getMotionDuration('fast'),
        ease: getMotionEasing('smooth')
      }
    }
  }
} as const;

/**
 * 响应式动效 - 基于用户偏好
 */
export function getResponsiveMotion() {
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;
    
  return {
    shouldAnimate: !prefersReducedMotion,
    duration: prefersReducedMotion ? 0 : undefined,
    transition: prefersReducedMotion 
      ? { duration: 0 }
      : {
          duration: getMotionDuration('normal'),
          ease: getMotionEasing('smooth')
        }
  };
}