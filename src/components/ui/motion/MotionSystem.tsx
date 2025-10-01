// 文件路径：src/components/ui/motion/MotionSystem.tsx

/**
 * Motion 动效系统 - 统一的动画体验
 * 
 * 基于 Framer Motion，提供品牌化的动效组件和工具
 * 
 * 动效原则：
 * - Enter: 180-220ms，ease-out
 * - Exit: 120-160ms，ease-in
 * - Hover: 80-120ms，ease-out
 * - 使用 transform 和 opacity，避免重排
 */

import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

// 统一的动效配置
export const motionConfig = {
  duration: {
    fast: 0.12,      // 120ms - 悬停效果
    normal: 0.18,    // 180ms - 标准入场
    slow: 0.22,      // 220ms - 复杂转场
    exit: 0.14,      // 140ms - 退场效果
  },
  
  easing: {
    easeOut: [0, 0, 0.2, 1] as const,           // 入场缓动
    easeIn: [0.4, 0, 1, 1] as const,            // 退场缓动
    easeInOut: [0.4, 0, 0.2, 1] as const,       // 双向缓动
    brand: [0.22, 1, 0.36, 1] as const,         // 品牌化缓动
  },
};

// 基础动画变体
export const baseVariants: Variants = {
  // 淡入动画
  fadeIn: {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { 
        duration: motionConfig.duration.normal,
        ease: motionConfig.easing.easeOut 
      }
    },
    exit: { 
      opacity: 0,
      transition: { 
        duration: motionConfig.duration.exit,
        ease: motionConfig.easing.easeIn 
      }
    },
  },
  
  // 滑入动画
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: motionConfig.duration.normal,
        ease: motionConfig.easing.easeOut 
      }
    },
    exit: { 
      opacity: 0, 
      y: -10,
      transition: { 
        duration: motionConfig.duration.exit,
        ease: motionConfig.easing.easeIn 
      }
    },
  },
  
  // 缩放动画
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: motionConfig.duration.normal,
        ease: motionConfig.easing.easeOut 
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.98,
      transition: { 
        duration: motionConfig.duration.exit,
        ease: motionConfig.easing.easeIn 
      }
    },
  },
  
  // 悬停效果
  hover: {
    rest: { scale: 1 },
    hover: { 
      scale: 1.02,
      transition: { 
        duration: motionConfig.duration.fast,
        ease: motionConfig.easing.easeOut 
      }
    },
  },
  
  // 点击效果
  tap: {
    rest: { scale: 1 },
    tap: { scale: 0.98 },
  },
};

/**
 * 淡入组件
 */
interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export const FadeIn: React.FC<FadeInProps> = ({ 
  children, 
  delay = 0,
  duration = motionConfig.duration.normal,
  className 
}) => (
  <motion.div
    className={className}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{
      duration,
      delay,
      ease: motionConfig.easing.easeOut,
    }}
  >
    {children}
  </motion.div>
);

/**
 * 滑入组件
 */
interface SlideInProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  duration?: number;
  className?: string;
}

export const SlideIn: React.FC<SlideInProps> = ({
  children,
  direction = 'up',
  delay = 0,
  duration = motionConfig.duration.normal,
  className,
}) => {
  const getInitialPosition = () => {
    switch (direction) {
      case 'up': return { y: 20 };
      case 'down': return { y: -20 };
      case 'left': return { x: 20 };
      case 'right': return { x: -20 };
      default: return { y: 20 };
    }
  };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...getInitialPosition() }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, ...getInitialPosition() }}
      transition={{
        duration,
        delay,
        ease: motionConfig.easing.easeOut,
      }}
    >
      {children}
    </motion.div>
  );
};

/**
 * 缩放入场组件
 */
interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  initialScale?: number;
  className?: string;
}

export const ScaleIn: React.FC<ScaleInProps> = ({
  children,
  delay = 0,
  duration = motionConfig.duration.normal,
  initialScale = 0.95,
  className,
}) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, scale: initialScale }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: initialScale }}
    transition={{
      duration,
      delay,
      ease: motionConfig.easing.easeOut,
    }}
  >
    {children}
  </motion.div>
);

/**
 * 悬停缩放组件
 */
interface HoverScaleProps {
  children: React.ReactNode;
  scale?: number;
  className?: string;
}

export const HoverScale: React.FC<HoverScaleProps> = ({
  children,
  scale = 1.02,
  className,
}) => (
  <motion.div
    className={className}
    whileHover={{ scale }}
    whileTap={{ scale: 0.98 }}
    transition={{
      duration: motionConfig.duration.fast,
      ease: motionConfig.easing.easeOut,
    }}
  >
    {children}
  </motion.div>
);

/**
 * 悬停抬升组件
 */
interface HoverLiftProps {
  children: React.ReactNode;
  lift?: number;
  className?: string;
}

export const HoverLift: React.FC<HoverLiftProps> = ({
  children,
  lift = -2,
  className,
}) => (
  <motion.div
    className={className}
    whileHover={{ y: lift }}
    transition={{
      duration: motionConfig.duration.fast,
      ease: motionConfig.easing.easeOut,
    }}
  >
    {children}
  </motion.div>
);

/**
 * 交错动画列表
 */
interface AnimatedListProps {
  children: React.ReactNode[];
  stagger?: number;
  className?: string;
}

export const AnimatedList: React.FC<AnimatedListProps> = ({
  children,
  stagger = 0.05,
  className,
}) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="visible"
    variants={{
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: stagger,
        },
      },
    }}
  >
    {children.map((child, index) => (
      <motion.div
        key={index}
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              duration: motionConfig.duration.normal,
              ease: motionConfig.easing.easeOut,
            },
          },
        }}
      >
        {child}
      </motion.div>
    ))}
  </motion.div>
);

/**
 * 页面转场组件
 */
interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className,
}) => (
  <AnimatePresence mode="wait">
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{
        duration: motionConfig.duration.normal,
        ease: motionConfig.easing.easeOut,
      }}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);

/**
 * 智能动画包装器
 * 根据内容类型自动选择合适的动画
 */
interface SmartAnimationProps {
  children: React.ReactNode;
  type?: 'fade' | 'slide' | 'scale' | 'hover' | 'lift';
  delay?: number;
  className?: string;
}

export const SmartAnimation: React.FC<SmartAnimationProps> = ({
  children,
  type = 'fade',
  delay = 0,
  className,
}) => {
  const AnimationComponent = {
    fade: FadeIn,
    slide: SlideIn,
    scale: ScaleIn,
    hover: HoverScale,
    lift: HoverLift,
  }[type];

  return (
    <AnimationComponent delay={delay} className={className}>
      {children}
    </AnimationComponent>
  );
};

export { AnimatePresence, motion };