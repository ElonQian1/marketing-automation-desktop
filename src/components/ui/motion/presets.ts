// 文件路径：src/components/ui/motion/presets.ts

/**
 * Motion 统一动效参数与变体
 *
 * 本文件集中定义轻组件动效所需的时间、缓动、过渡与常用 Variants，
 * 对应产品规范：入场 180-220ms、离场 120-160ms、悬停 80-120ms，曲线为 ease-out。
 * 组件层统一从此处读取配置，避免在各处硬编码动效参数。
 */

import type { Transition, Variants } from "framer-motion";

/**
 * 动效时长（基于 Design Tokens，单位：秒）
 */
export const motionDurations = {
  // 从 CSS 变量读取，确保与 Design Tokens 同步
  micro: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--duration-micro')) / 1000 || 0.08,
  hover: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--duration-fast')) / 1000 || 0.12,
  press: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--duration-micro')) / 1000 || 0.08,
  enter: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--duration-normal')) / 1000 || 0.18,
  exit: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--duration-fast')) / 1000 || 0.12,
  slow: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--duration-slow')) / 1000 || 0.22,
  slower: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--duration-slower')) / 1000 || 0.3,
  overlay: 0.15, // 遮罩层淡入淡出
  stagger: 0.05, // 列表交错间隔
} as const;

/**
 * 动效缓动曲线
 */
export const motionEasings = {
  easeOut: [0, 0, 0.2, 1] as [number, number, number, number],
  brand: [0.22, 1, 0.36, 1] as [number, number, number, number],
} as const;

/**
 * 标准过渡定义
 */
export const motionTransitions = {
  hover: {
    type: "tween",
    duration: motionDurations.hover,
    ease: motionEasings.easeOut,
  } satisfies Transition,
  press: {
    type: "tween",
    duration: motionDurations.press,
    ease: motionEasings.easeOut,
  } satisfies Transition,
  enter: {
    type: "tween",
    duration: motionDurations.enter,
    ease: motionEasings.brand,
  } satisfies Transition,
  exit: {
    type: "tween",
    duration: motionDurations.exit,
    ease: motionEasings.brand,
  } satisfies Transition,
  overlay: {
    type: "tween",
    duration: motionDurations.overlay,
    ease: motionEasings.easeOut,
  } satisfies Transition,
  spring: {
    type: "spring",
    damping: 26,
    stiffness: 320,
    mass: 0.9,
  } satisfies Transition,
} as const;

/**
 * 悬停与按下的统一 variants
 */
export const hoverVariants: Variants = {
  rest: {
    scale: 1,
    transition: motionTransitions.hover,
  },
  hover: {
    scale: 1.02,
    transition: motionTransitions.hover,
  },
  tap: {
    scale: 0.98,
    transition: motionTransitions.press,
  },
};

export const liftVariants: Variants = {
  rest: {
    y: 0,
    boxShadow: "var(--shadow-sm)",
    transition: motionTransitions.hover,
  },
  hover: {
    y: -4,
    boxShadow: "var(--shadow)",
    transition: motionTransitions.hover,
  },
};

/**
 * 入场/离场 variants
 */
export const fadeVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: motionTransitions.enter,
  },
  exit: {
    opacity: 0,
    transition: motionTransitions.exit,
  },
};

export const scaleVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: motionTransitions.enter,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: motionTransitions.exit,
  },
};

export const popVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.85,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: motionTransitions.spring,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: motionTransitions.exit,
  },
};

export const slideVariants = {
  fromTop: {
    initial: { opacity: 0, y: -20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: motionTransitions.enter,
    },
    exit: {
      opacity: 0,
      y: -12,
      transition: motionTransitions.exit,
    },
  },
  fromBottom: {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: motionTransitions.enter,
    },
    exit: {
      opacity: 0,
      y: 12,
      transition: motionTransitions.exit,
    },
  },
  fromLeft: {
    initial: { opacity: 0, x: -20 },
    animate: {
      opacity: 1,
      x: 0,
      transition: motionTransitions.enter,
    },
    exit: {
      opacity: 0,
      x: -12,
      transition: motionTransitions.exit,
    },
  },
  fromRight: {
    initial: { opacity: 0, x: 20 },
    animate: {
      opacity: 1,
      x: 0,
      transition: motionTransitions.enter,
    },
    exit: {
      opacity: 0,
      x: 12,
      transition: motionTransitions.exit,
    },
  },
} satisfies Record<string, Variants>;

export const listVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: motionDurations.stagger,
      delayChildren: motionDurations.hover,
    },
  },
};

export const listItemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: motionTransitions.enter,
  },
};

export const pageVariants: Variants = {
  initial: { opacity: 0, x: 24 },
  in: {
    opacity: 1,
    x: 0,
    transition: motionTransitions.enter,
  },
  out: {
    opacity: 0,
    x: -24,
    transition: motionTransitions.exit,
  },
};

export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: motionTransitions.enter,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 12,
    transition: motionTransitions.exit,
  },
};

export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: motionTransitions.overlay,
  },
  exit: {
    opacity: 0,
    transition: motionTransitions.overlay,
  },
};

/**
 * 统一导出对象，方便按需引用
 */
export const motionPresets = {
  durations: motionDurations,
  easings: motionEasings,
  transitions: motionTransitions,
  variants: {
    fade: fadeVariants,
    scale: scaleVariants,
    pop: popVariants,
    slide: slideVariants,
    hover: hoverVariants,
    lift: liftVariants,
    list: listVariants,
    listItem: listItemVariants,
    page: pageVariants,
    modal: modalVariants,
    overlay: overlayVariants,
  },
} as const;
