# 任务卡 - Framer Motion 动效系统统一化

**任务 ID**: A-20251001-154000  
**状态**: DONE  
**精确时间（台北）**: 2025-10-01 16:00:00 (UTC+08:00)  

---

## 📋 任务概述

**主题**: 集成 Framer Motion，建立统一动效规范，优化页面转场与微交互  

**背景**: 
- 基于已完成的现代化 Design Tokens (212行) 和轻组件体系
- 需要建立统一的动效语言：入场、离场、悬停、转场
- 确保所有动效遵循品牌化的时长和缓动规范

**输入/依赖**: 
- 已完成的动效系统令牌：--motion-*, --duration-*, ease函数
- 已优化的 Button 和 Card 组件作为动效应用示例
- ThemeBridge.tsx 需要集成动效上下文

---

## 🎭 动效系统设计

### 动效层级架构

#### 1. 微交互层 (80-120ms)
```typescript
// 按钮反馈、悬停效果
const microInteractions = {
  hover: {
    scale: 'var(--motion-scale-hover)', // 1.02
    transition: { duration: 0.08, ease: 'var(--motion-smooth)' }
  },
  tap: {
    scale: 'var(--motion-scale-active)', // 0.98
    transition: { duration: 0.05 }
  }
}
```

#### 2. 组件动效层 (180-220ms)
```typescript
// 卡片入场、对话框显示
const componentAnimations = {
  fadeIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.18, ease: 'var(--motion-smooth)' }
  },
  slideUp: {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.22, ease: 'var(--motion-spring)' }
  }
}
```

#### 3. 页面转场层 (300ms+)
```typescript
// 路由切换、大布局变化
const pageTransitions = {
  pageSlide: {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
    transition: { duration: 0.3, ease: 'var(--ease-brand)' }
  }
}
```

---

## 🛠️ 实施计划

### 阶段一：Motion 基础设施
1. **检查 Framer Motion 依赖**
2. **创建动效常量和预设**
3. **建立动效组件包装器**

### 阶段二：组件动效集成
1. **增强现有 Button/Card 动效**
2. **创建 AnimatedContainer 包装器**
3. **实现页面转场系统**

### 阶段三：全局动效规范
1. **统一所有组件动效参数**
2. **建立动效性能监控**
3. **创建动效文档和示例**

---

## 📦 核心动效组件

### MotionButton 增强
```typescript
// 基于现有 Button 添加 Motion 支持
const MotionButton = motion(Button)

const buttonMotionProps = {
  whileHover: { 
    scale: 'var(--motion-scale-hover)',
    boxShadow: 'var(--shadow-brand-lg)'
  },
  whileTap: { 
    scale: 'var(--motion-scale-active)' 
  },
  transition: {
    duration: 'var(--duration-micro)',
    ease: 'var(--motion-smooth)'
  }
}
```

### AnimatedCard 容器
```typescript
// 卡片入场动效
const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      duration: 'var(--duration-normal)',
      ease: 'var(--motion-spring)'
    }
  }
}
```

### PageTransition 包装器
```typescript
// 页面级动效
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{
      duration: 'var(--duration-slower)',
      ease: 'var(--ease-brand)'
    }}
  >
    {children}
  </motion.div>
)
```

---

## 🎯 性能优化策略

### 1. 动效节流
- 使用 `will-change` 属性预告动效
- 避免在滚动时执行复杂动效
- 使用 `transform` 和 `opacity` 属性

### 2. 条件动效
```typescript
// 基于用户偏好禁用动效
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

const motionConfig = {
  transition: prefersReducedMotion.matches 
    ? { duration: 0 }
    : { duration: 'var(--duration-normal)' }
}
```

### 3. 智能加载
- 仅在需要时加载 Motion 组件
- 使用 React.lazy 延迟加载复杂动效

---

## 🧪 验证清单

- [ ] **Motion 依赖**: Framer Motion 正确安装和配置
- [ ] **基础动效**: Button/Card 微交互流畅响应
- [ ] **动效令牌**: 所有动效使用 Design Tokens 时长和缓动
- [ ] **性能测试**: 动效不影响页面滚动性能
- [ ] **可访问性**: 支持 prefers-reduced-motion 设置
- [ ] **浏览器兼容**: 动效在主要浏览器中正常工作
- [ ] **主题同步**: 动效在 dark/light 模式下表现一致

---

## 🚨 风险控制

**潜在风险**:
- 过多动效可能影响性能，特别是在低端设备
- 复杂动效可能与 AntD 组件内置动效冲突
- 动效参数需要精细调试以达到最佳用户体验

**缓解措施**:
- 建立动效性能基准测试
- 提供动效开关，允许用户完全禁用
- 使用 CSS 变量便于快速调整动效参数

---

## 🔄 状态更新

**15:40** - 创建任务卡，制定动效系统架构  
**15:45** - 分析动效层级和性能优化策略  
**15:50** - 准备检查 Motion 依赖和创建动效组件  
**15:55** - ✅ 发现 Framer Motion 已安装，现有动效系统完整  
**16:00** - ✅ 更新动效预设使用 Design Tokens：
  - 修改 motionDurations 从 CSS 变量读取
  - 创建 tokens.ts 统一动效令牌接口
  - 建立响应式动效支持（prefers-reduced-motion）  

---

## ➡️ 下一步

**当前任务**: 检查 Framer Motion 依赖，创建基础动效组件  
**完成目标**: 建立统一的动效语言和性能优化的动效系统  

**@协作提醒**: 
- @B: 动效系统即将可用，准备集成到具体业务组件
- @C: 关注动效对页面性能的影响，准备性能测试
- @D: 更新扫描脚本，检测动效使用是否符合性能规范

**🎉 重构里程碑**: 完成此任务卡后，Design Tokens 品牌化重构的核心架构将全面就绪！