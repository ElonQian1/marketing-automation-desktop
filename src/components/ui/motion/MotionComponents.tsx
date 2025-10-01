// 文件路径：src/components/ui/motion/MotionComponents.tsx

/**
 * Motion 包装组件
 * 
 * 提供常用的动效组件，简化在项目中使用 Motion 的方式
 * 所有组件都基于设计令牌中的动画规范
 */

import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import {
  motionDurations,
  motionTransitions,
  fadeVariants,
  slideVariants,
  scaleVariants,
  popVariants,
  hoverVariants,
  liftVariants,
  listVariants,
  listItemVariants,
  pageVariants,
  modalVariants,
  overlayVariants,
} from "./presets";

// ==================== 基础 Motion 组件 ====================

/**
 * 淡入动画组件
 */
export const FadeIn: React.FC<HTMLMotionProps<"div"> & { children: React.ReactNode }> = ({
  children,
  ...props
}) => (
  <motion.div
    variants={fadeVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    {...props}
  >
    {children}
  </motion.div>
);

/**
 * 滑入动画组件 - 支持多个方向
 */
interface SlideInProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  direction?: "top" | "bottom" | "left" | "right";
}

export const SlideIn: React.FC<SlideInProps> = ({
  children,
  direction = "bottom",
  ...props
}) => {
  const variants = {
    top: slideVariants.fromTop,
    bottom: slideVariants.fromBottom,
    left: slideVariants.fromLeft,
    right: slideVariants.fromRight,
  }[direction];

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * 缩放动画组件
 */
export const ScaleIn: React.FC<HTMLMotionProps<"div"> & { children: React.ReactNode }> = ({
  children,
  ...props
}) => (
  <motion.div
    variants={scaleVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    {...props}
  >
    {children}
  </motion.div>
);

/**
 * 弹出动画组件 - 更强调的效果
 */
export const PopIn: React.FC<HTMLMotionProps<"div"> & { children: React.ReactNode }> = ({
  children,
  ...props
}) => (
  <motion.div
    variants={popVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    {...props}
  >
    {children}
  </motion.div>
);

// ==================== 交互 Motion 组件 ====================

/**
 * 悬停缩放组件 - 适用于按钮等交互元素
 */
export const HoverScale: React.FC<HTMLMotionProps<"div"> & { children: React.ReactNode }> = ({
  children,
  ...props
}) => (
  <motion.div
    variants={hoverVariants}
    initial="rest"
    whileHover="hover"
    whileTap="tap"
    {...props}
  >
    {children}
  </motion.div>
);

/**
 * 悬停提升组件 - 适用于卡片等
 */
export const HoverLift: React.FC<HTMLMotionProps<"div"> & { children: React.ReactNode }> = ({
  children,
  ...props
}) => (
  <motion.div
    variants={liftVariants}
    initial="rest"
    whileHover="hover"
    {...props}
  >
    {children}
  </motion.div>
);

// ==================== 列表 Motion 组件 ====================

/**
 * 动画列表容器 - 支持交错动画
 */
export const AnimatedList: React.FC<HTMLMotionProps<"div"> & { children: React.ReactNode }> = ({
  children,
  ...props
}) => (
  <motion.div
    variants={listVariants}
    initial="hidden"
    animate="visible"
    {...props}
  >
    {children}
  </motion.div>
);

/**
 * 动画列表项 - 配合 AnimatedList 使用
 */
export const AnimatedListItem: React.FC<HTMLMotionProps<"div"> & { children: React.ReactNode }> = ({
  children,
  ...props
}) => (
  <motion.div
    variants={listItemVariants}
    {...props}
  >
    {children}
  </motion.div>
);

// ==================== 页面级 Motion 组件 ====================

/**
 * 页面转场组件 - 用于路由切换
 */
export const PageTransition: React.FC<HTMLMotionProps<"div"> & { children: React.ReactNode }> = ({
  children,
  ...props
}) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="in"
    exit="out"
    {...props}
  >
    {children}
  </motion.div>
);

/**
 * 模态框动画组件
 */
export const AnimatedModal: React.FC<HTMLMotionProps<"div"> & { 
  children: React.ReactNode;
  isOpen: boolean;
}> = ({
  children,
  isOpen,
  ...props
}) => (
  <motion.div
    variants={modalVariants}
    initial="hidden"
    animate={isOpen ? "visible" : "exit"}
    exit="exit"
    {...props}
  >
    {children}
  </motion.div>
);

/**
 * 遮罩层动画组件
 */
export const AnimatedOverlay: React.FC<HTMLMotionProps<"div"> & { 
  children?: React.ReactNode;
  isOpen: boolean;
}> = ({
  children,
  isOpen,
  ...props
}) => (
  <motion.div
    variants={overlayVariants}
    initial="hidden"
    animate={isOpen ? "visible" : "exit"}
    exit="exit"
    {...props}
  >
    {children}
  </motion.div>
);

// ==================== 高级 Motion Hook ====================

/**
 * 列表交错动画 Hook
 */
export const useStaggerAnimation = (itemCount: number, delay = 0.05) => {
  return {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: delay ?? motionDurations.stagger,
          delayChildren: motionDurations.hover,
        },
      },
    },
    item: {
      hidden: { y: 10, opacity: 0 },
      visible: { 
        y: 0, 
        opacity: 1,
        transition: motionTransitions.enter,
      },
    },
  };
};

/**
 * 序列动画 Hook
 */
export const useSequenceAnimation = (steps: number) => {
  return {
    container: {
      hidden: {},
      visible: {
        transition: {
          staggerChildren: 0.2,
          delayChildren: motionDurations.hover,
        },
      },
    },
    step: (i: number) => ({
      hidden: { opacity: 0, x: -20 },
      visible: { 
        opacity: 1, 
        x: 0,
        transition: {
          delay: i * 0.1,
          ...motionTransitions.enter,
        },
      },
    }),
  };
};