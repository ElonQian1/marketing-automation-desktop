# 动效规范文档

**版本**: v2.0  
**最后更新**: 2025-10-02  
**维护者**: 员工A (Design Tokens & Theme Bridge 负责人)

---

## 🎯 动效设计原则

### 核心理念
- **自然流畅**: 模拟真实物理世界的运动
- **功能性**: 为用户交互提供清晰的视觉反馈
- **性能优先**: 保证60FPS流畅体验
- **一致性**: 统一的时间曲线和持续时间

---

## ⏱️ 时间规范

### 标准持续时间
```css
/* 进入动画 - 相对较慢，让用户感知新元素 */
--motion-duration-enter-fast: 180ms;     /* 快速进入 */
--motion-duration-enter-normal: 200ms;   /* 标准进入 */
--motion-duration-enter-slow: 220ms;     /* 慢速进入 */

/* 退出动画 - 相对较快，避免阻塞用户操作 */
--motion-duration-exit-fast: 120ms;      /* 快速退出 */
--motion-duration-exit-normal: 140ms;    /* 标准退出 */
--motion-duration-exit-slow: 160ms;      /* 慢速退出 */

/* 微交互动画 - 极快响应 */
--motion-duration-micro: 100ms;          /* 悬停、焦点等 */
```

### 应用场景映射
```typescript
// 组件级动画持续时间映射
const MOTION_DURATIONS = {
  // 模态框、抽屉等大型组件
  modal: {
    enter: 'var(--motion-duration-enter-slow)',    // 220ms
    exit: 'var(--motion-duration-exit-normal)',    // 140ms
  },
  
  // 下拉菜单、工具提示等中型组件  
  dropdown: {
    enter: 'var(--motion-duration-enter-normal)',  // 200ms
    exit: 'var(--motion-duration-exit-fast)',      // 120ms
  },
  
  // 按钮、标签等小型组件
  button: {
    hover: 'var(--motion-duration-micro)',         // 100ms
    active: 'var(--motion-duration-micro)',        // 100ms
  },
  
  // 页面级转场
  page: {
    enter: 'var(--motion-duration-enter-slow)',    // 220ms
    exit: 'var(--motion-duration-exit-slow)',      // 160ms
  }
} as const;
```

---

## 📈 缓动曲线 (Easing Functions)

### 标准缓动函数
```css
/* 进入动画 - 加速进入，营造活力感 */
--motion-ease-enter: cubic-bezier(0.4, 0, 0.2, 1);      /* Material Design 标准 */
--motion-ease-enter-back: cubic-bezier(0.34, 1.56, 0.64, 1); /* 回弹进入 */

/* 退出动画 - 加速退出，干净利落 */
--motion-ease-exit: cubic-bezier(0.4, 0, 1, 1);         /* 加速退出 */
--motion-ease-exit-back: cubic-bezier(0.36, 0, 0.66, -0.56); /* 回弹退出 */

/* 微交互 - 线性或轻微缓动 */
--motion-ease-linear: linear;                            /* 线性变化 */
--motion-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);    /* 标准缓入缓出 */
```

### 使用指导
```scss
// ✅ 推荐：进入动画使用加速曲线
.fade-enter {
  animation: fadeIn var(--motion-duration-enter-normal) var(--motion-ease-enter);
}

// ✅ 推荐：退出动画使用减速曲线  
.fade-exit {
  animation: fadeOut var(--motion-duration-exit-fast) var(--motion-ease-exit);
}

// ✅ 推荐：悬停等微交互使用线性或轻微缓动
.button:hover {
  transition: background-color var(--motion-duration-micro) var(--motion-ease-linear);
}
```

---

## 🎭 动画类型与实现

### 1. 透明度动画 (Opacity)
```css
/* 淡入淡出 - 最常用，性能最佳 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

.fade-transition {
  transition: opacity var(--motion-duration-enter-normal) var(--motion-ease-enter);
}
```

### 2. 缩放动画 (Scale)
```css
/* 缩放进入 - 适合模态框、卡片 */
@keyframes scaleIn {
  from { 
    opacity: 0;
    transform: scale(0.9);
  }
  to { 
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes scaleOut {
  from { 
    opacity: 1;
    transform: scale(1);
  }
  to { 
    opacity: 0;
    transform: scale(0.95);
  }
}

.scale-transition {
  transition: 
    opacity var(--motion-duration-enter-normal) var(--motion-ease-enter),
    transform var(--motion-duration-enter-normal) var(--motion-ease-enter);
}
```

### 3. 滑动动画 (Slide)
```css
/* 滑动进入 - 适合侧边栏、抽屉 */
@keyframes slideInLeft {
  from { 
    opacity: 0;
    transform: translateX(-20px);
  }
  to { 
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideOutRight {
  from { 
    opacity: 1;
    transform: translateX(0);
  }
  to { 
    opacity: 0;
    transform: translateX(20px);
  }
}

.slide-transition {
  transition: 
    opacity var(--motion-duration-enter-normal) var(--motion-ease-enter),
    transform var(--motion-duration-enter-normal) var(--motion-ease-enter);
}
```

### 4. 弹跳动画 (Bounce)
```css
/* 回弹效果 - 适合重要提示、确认操作 */
@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.bounce-transition {
  animation: bounceIn var(--motion-duration-enter-slow) var(--motion-ease-enter-back);
}
```

---

## 🎬 Framer Motion 集成

### 标准动画预设
```typescript
// src/utils/motionPresets.ts
export const motionPresets = {
  // 淡入淡出
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1], // --motion-ease-enter
    },
  },
  
  // 缩放
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  
  // 滑动
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: {
      duration: 0.22,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  
  // 微交互
  hover: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: {
      duration: 0.1,
      ease: "linear",
    },
  },
} as const;
```

### 组件中的使用
```tsx
import { motion } from 'framer-motion';
import { motionPresets } from '@/utils/motionPresets';

// 基础动画组件
export const AnimatedCard: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => (
  <motion.div
    {...motionPresets.scale}
    className="bg-container p-4 rounded-md shadow-md"
  >
    {children}
  </motion.div>
);

// 交互式按钮
export const AnimatedButton: React.FC<ButtonProps> = ({ 
  children, 
  ...props 
}) => (
  <motion.button
    {...motionPresets.hover}
    className="btn-primary px-4 py-2 rounded-md"
    {...props}
  >
    {children}
  </motion.button>
);

// 页面级转场
export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => (
  <motion.div
    {...motionPresets.slideUp}
    className="min-h-screen"
  >
    {children}
  </motion.div>
);
```

---

## 🚀 性能优化指南

### 1. 使用性能友好的属性
```css
/* ✅ 推荐：只触发合成层，不引起重排重绘 */
.optimized-animation {
  transform: translateX(0);     /* GPU 加速 */
  opacity: 1;                   /* GPU 加速 */
  filter: blur(0px);           /* GPU 加速 */
}

/* ❌ 避免：会引起重排重绘的属性 */
.slow-animation {
  left: 0;                     /* 触发重排 */
  width: 100px;                /* 触发重排 */
  background: red;             /* 触发重绘 */
}
```

### 2. 启用硬件加速
```css
.will-animate {
  will-change: transform, opacity;  /* 提前告知浏览器 */
  transform: translateZ(0);         /* 强制开启硬件加速 */
  backface-visibility: hidden;      /* 避免闪烁 */
}

/* 动画结束后清理 */
.animation-done {
  will-change: auto;               /* 释放GPU资源 */
}
```

### 3. 批量动画处理
```typescript
// 使用 requestAnimationFrame 批量处理
export const batchAnimate = (animations: Array<() => void>) => {
  requestAnimationFrame(() => {
    animations.forEach(animate => animate());
  });
};

// Framer Motion 中的性能优化
const optimizedVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1],
      // 批量处理子元素动画
      staggerChildren: 0.05,
    }
  },
};
```

---

## 🎨 主题适配

### 暗黑模式动画调整
```css
[data-theme="dark"] {
  /* 暗黑模式下稍微放慢动画，减少视觉疲劳 */
  --motion-duration-enter-normal: 240ms;  /* 比浅色模式慢 40ms */
  --motion-duration-exit-normal: 160ms;   /* 比浅色模式慢 20ms */
}

/* 暗黑模式下的特殊效果 */
[data-theme="dark"] .glow-effect {
  transition: box-shadow var(--motion-duration-micro) var(--motion-ease-linear);
}

[data-theme="dark"] .glow-effect:hover {
  box-shadow: 0 0 20px rgba(24, 144, 255, 0.3);  /* 发光效果 */
}
```

### 减动效偏好适配
```css
/* 尊重用户的减动效偏好 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  /* 保留重要的状态变化动画 */
  .critical-feedback {
    transition-duration: 0.15s !important;
  }
}
```

---

## 📊 动效审查清单

### 设计审查
- [ ] **持续时间合理**: 进入180-220ms，退出120-160ms
- [ ] **缓动函数一致**: 使用标准预设，避免自定义
- [ ] **语义明确**: 动画方向与用户心理预期一致
- [ ] **性能友好**: 优先使用 transform 和 opacity

### 技术审查  
- [ ] **硬件加速**: 复杂动画启用 GPU 加速
- [ ] **资源清理**: 动画结束后清理 will-change
- [ ] **批量处理**: 避免多个元素同时触发重排
- [ ] **异常处理**: 处理动画中断和重复触发

### 用户体验审查
- [ ] **减动效适配**: 支持 prefers-reduced-motion
- [ ] **主题适配**: 暗黑模式下的视觉效果
- [ ] **交互反馈**: 用户操作有即时视觉响应
- [ ] **一致性**: 相似组件使用相同动画模式

---

## 🛠️ 开发工具支持

### Chrome DevTools 性能分析
```javascript
// 在控制台中分析动画性能
performance.mark('animation-start');
// ... 执行动画
performance.mark('animation-end');
performance.measure('animation-duration', 'animation-start', 'animation-end');
console.log(performance.getEntriesByName('animation-duration'));
```

### React DevTools Profiler
```tsx
// 使用 Profiler 监控动画组件性能
import { Profiler } from 'react';

function onRenderCallback(id, phase, actualDuration) {
  if (actualDuration > 16) { // 超过一帧时间
    console.warn(`Animation component ${id} took ${actualDuration}ms`);
  }
}

<Profiler id="AnimatedComponent" onRender={onRenderCallback}>
  <AnimatedComponent />
</Profiler>
```

---

## 📚 参考资源

### 外部参考
- [Material Design Motion](https://material.io/design/motion/)
- [Apple Human Interface Guidelines - Animation](https://developer.apple.com/design/human-interface-guidelines/motion)
- [CSS Triggers](https://csstriggers.com/) - 了解CSS属性的性能影响

### 内部资源  
- [Design Tokens 对照表](./DESIGN_TOKENS_REFERENCE.md)
- [轻组件使用指南](./LIGHTWEIGHT_COMPONENTS_GUIDE.md)
- [性能监控指南](./PERFORMANCE_MONITORING.md)

---

**🔄 版本历史**:
- v2.0 (2025-10-02): 完善性能优化和主题适配部分
- v1.0 (2025-10-01): 初始版本，建立基础动效规范

**👥 贡献者**: 员工A (Design Tokens & Theme Bridge)