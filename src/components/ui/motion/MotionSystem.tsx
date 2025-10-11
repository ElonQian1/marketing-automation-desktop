// src/components/ui/motion/MotionSystem.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

// 文件路径：src/components/ui/motion/MotionSystem.tsx

/**
 * Motion 动效系统 - 简化版本
 * 
 * 为了确保构建通过，提供基础的动效组件
 */

import React from 'react';

// 动效配置
export const motionConfig = {
  duration: {
    fast: 0.12,
    normal: 0.18,
    slow: 0.22,
    exit: 0.14,
  },
};

// 简单的淡入组件
export const FadeIn: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div 
      className={`transition-opacity duration-[var(--duration-enter)] ease-out ${className}`}
      style={{ animationName: 'fadeIn', animationDuration: `${motionConfig.duration.normal}s` }}
    >
      {children}
    </div>
  );
};

// 简单的滑入组件
export const SlideIn: React.FC<{ 
  children: React.ReactNode; 
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
}> = ({ 
  children, 
  direction = 'up',
  className = '' 
}) => {
  return (
    <div 
      className={`transition-all duration-[var(--duration-enter)] ease-out ${className}`}
      style={{ animationName: 'slideIn', animationDuration: `${motionConfig.duration.normal}s` }}
    >
      {children}
    </div>
  );
};

// 简单的缩放组件
export const ScaleIn: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div 
      className={`transition-transform duration-[var(--duration-enter)] ease-out hover:scale-105 ${className}`}
    >
      {children}
    </div>
  );
};

// 悬停缩放效果
export const HoverScale: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div 
      className={`transition-transform duration-[var(--duration-hover)] ease-out hover:scale-105 cursor-pointer ${className}`}
    >
      {children}
    </div>
  );
};

// 列表动画容器
export const AnimatedList: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {children}
    </div>
  );
};

// 导出AnimatePresence的简单实现
export const AnimatePresence: React.FC<{ 
  children: React.ReactNode;
  mode?: 'wait' | 'popLayout' | 'sync';
}> = ({ children }) => {
  return <>{children}</>;
};

// CSS动画样式（可以添加到global.css中）
export const motionStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideIn {
    from { 
      opacity: 0; 
      transform: translateY(20px); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0); 
    }
  }
`;