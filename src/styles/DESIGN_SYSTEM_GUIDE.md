# CSS 设计系统完整指南

本文档描述了项目的现代化 CSS 设计系统架构和使用方法。

## 📁 目录结构

```
src/styles/
├── modern.css                    # 主入口文件
└── design-system/               # 设计系统模块
    ├── tokens.css               # 设计令牌（颜色、字体、间距等）
    ├── base.css                 # 基础样式和重置
    ├── utilities.css            # 实用工具类
    ├── components.css           # 组件样式
    ├── layout.css               # 布局系统
    ├── antd-theme.css           # Ant Design 主题定制
    ├── responsive.css           # 响应式设计
    └── accessibility.css        # 无障碍访问增强
```

## 🎨 设计令牌系统

### 颜色系统
```css
/* 主色调 */
--color-primary-50 到 --color-primary-950
--color-secondary-50 到 --color-secondary-950

/* 语义颜色 */
--color-success-500    /* 成功状态 */
--color-warning-500    /* 警告状态 */
--color-error-500      /* 错误状态 */
--color-info-500       /* 信息状态 */

/* 背景颜色 */
--color-bg-primary     /* 主要背景 */
--color-bg-secondary   /* 次要背景 */
--color-bg-tertiary    /* 第三级背景 */

/* 文本颜色 */
--color-text-primary   /* 主要文本 */
--color-text-secondary /* 次要文本 */
--color-text-muted     /* 弱化文本 */
```

### 字体系统
```css
/* 字体族 */
--font-family-sans: 'Inter', sans-serif;
--font-family-mono: 'JetBrains Mono', monospace;

/* 字体大小 */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */

/* 字体重量 */
--font-weight-light: 300;
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### 间距系统
```css
/* 统一间距比例 */
--space-0: 0;          /* 0px */
--space-1: 0.25rem;    /* 4px */
--space-2: 0.5rem;     /* 8px */
--space-3: 0.75rem;    /* 12px */
--space-4: 1rem;       /* 16px */
--space-5: 1.25rem;    /* 20px */
--space-6: 1.5rem;     /* 24px */
--space-8: 2rem;       /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
--space-20: 5rem;      /* 80px */
```

## 🔧 实用工具类

### 布局工具
```css
.flex              /* display: flex */
.flex-col          /* flex-direction: column */
.items-center      /* align-items: center */
.justify-between   /* justify-content: space-between */
.grid              /* display: grid */
.grid-cols-2       /* grid-template-columns: repeat(2, 1fr) */
```

### 间距工具
```css
.p-4              /* padding: var(--space-4) */
.px-4             /* padding-left/right: var(--space-4) */
.py-4             /* padding-top/bottom: var(--space-4) */
.m-4              /* margin: var(--space-4) */
.mx-auto          /* margin-left/right: auto */
.gap-4            /* gap: var(--space-4) */
```

### 文本工具
```css
.text-center      /* text-align: center */
.text-base        /* font-size: var(--text-base) */
.font-medium      /* font-weight: var(--font-weight-medium) */
.text-primary     /* color: var(--color-text-primary) */
.text-muted       /* color: var(--color-text-muted) */
```

### 颜色工具
```css
.bg-primary       /* background: var(--color-bg-primary) */
.bg-surface       /* background: var(--color-surface) */
.border-default   /* border-color: var(--color-border) */
```

## 🏗️ 布局系统

### 现代应用布局
```css
.modern-app {
  /* 完整的应用外壳 */
  display: flex;
  min-height: 100vh;
}

.modern-sidebar {
  /* 侧边导航栏 */
  width: 280px;
  background: var(--color-surface);
}

.modern-main {
  /* 主内容区域 */
  flex: 1;
  display: flex;
  flex-direction: column;
}

.modern-header {
  /* 顶部标题栏 */
  height: 64px;
  border-bottom: 1px solid var(--color-border);
}

.modern-content {
  /* 内容容器 */
  flex: 1;
  overflow-y: auto;
}
```

### 导航系统
```css
.modern-nav {
  /* 导航菜单容器 */
}

.modern-nav-item {
  /* 导航项 */
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
}

.modern-nav-link.active {
  /* 活跃导航项 */
  background: var(--color-primary-50);
  color: var(--color-primary-600);
}
```

## 🎨 组件样式

### 按钮系统
```css
.btn-primary      /* 主要按钮 */
.btn-secondary    /* 次要按钮 */
.btn-outline      /* 轮廓按钮 */
.btn-ghost        /* 幽灵按钮 */
.btn-sm           /* 小尺寸 */
.btn-lg           /* 大尺寸 */
```

### 卡片样式
```css
.card             /* 基础卡片 */
.card-hover       /* 悬停效果 */
.card-bordered    /* 带边框 */
.card-shadow      /* 带阴影 */
```

### 表单样式
```css
.form-field       /* 表单字段容器 */
.form-label       /* 表单标签 */
.form-input       /* 表单输入框 */
.form-error       /* 错误信息 */
.form-help        /* 帮助文本 */
```

## 🌗 主题切换

### 暗色主题
系统会自动检测用户的主题偏好，也可以手动切换：

```javascript
// 设置暗色主题
document.documentElement.setAttribute('data-theme', 'dark');

// 设置亮色主题
document.documentElement.setAttribute('data-theme', 'light');

// 自动主题（跟随系统）
document.documentElement.removeAttribute('data-theme');
```

### 主题变量
所有颜色变量都支持自动切换：
```css
/* 亮色主题 */
--color-bg-primary: #ffffff;
--color-text-primary: #1f2937;

/* 暗色主题 */
[data-theme="dark"] {
  --color-bg-primary: #1f2937;
  --color-text-primary: #f9fafb;
}
```

## 📱 响应式设计

### 断点系统
```css
/* 移动端 */
@media (max-width: 768px) { }

/* 平板端 */
@media (min-width: 769px) and (max-width: 1024px) { }

/* 桌面端 */
@media (min-width: 1025px) { }

/* 超大屏幕 */
@media (min-width: 1440px) { }
```

### 响应式工具类
```css
.mobile-only      /* 仅移动端显示 */
.tablet-up        /* 平板及以上显示 */
.desktop-up       /* 桌面及以上显示 */
.hidden-mobile    /* 移动端隐藏 */
```

### 流体字体
```css
.fluid-text-base  /* 自适应基础字体大小 */
.fluid-text-lg    /* 自适应大字体 */
```

## ♿ 无障碍访问

### 焦点管理
```css
:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}
```

### 屏幕阅读器支持
```css
.sr-only          /* 仅屏幕阅读器可见 */
.sr-only-focusable /* 获得焦点时可见 */
```

### 高对比度模式
```css
@media (prefers-contrast: high) {
  /* 高对比度样式 */
}
```

### 减少动画
```css
@media (prefers-reduced-motion: reduce) {
  /* 禁用动画 */
}
```

## 🎯 Ant Design 集成

### 主题定制
系统自动将 Ant Design 组件样式与设计系统保持一致：

```css
/* 按钮主题 */
.ant-btn-primary {
  background: var(--color-primary-600);
  border-color: var(--color-primary-600);
}

/* 输入框主题 */
.ant-input {
  border-color: var(--color-border);
  border-radius: var(--radius-md);
}

/* 表格主题 */
.ant-table {
  background: var(--color-surface);
}
```

### 暗色主题支持
所有 Ant Design 组件都支持暗色主题自动切换。

## 🚀 使用方法

### 1. 导入样式
在你的主应用文件中导入：

```typescript
// main.tsx 或 App.tsx
import './styles/modern.css';
```

### 2. 使用设计令牌
```css
.my-component {
  background: var(--color-bg-primary);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--text-base);
  box-shadow: var(--shadow-sm);
}
```

### 3. 使用工具类
```tsx
<div className="flex items-center justify-between p-4 bg-surface rounded-lg">
  <h2 className="text-lg font-semibold text-primary">标题</h2>
  <button className="btn-primary">操作</button>
</div>
```

### 4. 布局组件
```tsx
<div className="modern-app">
  <aside className="modern-sidebar">
    <nav className="modern-nav">
      {/* 导航内容 */}
    </nav>
  </aside>
  <main className="modern-main">
    <header className="modern-header">
      {/* 头部内容 */}
    </header>
    <div className="modern-content">
      <div className="modern-content-body">
        {/* 页面内容 */}
      </div>
    </div>
  </main>
</div>
```

## 🔧 自定义扩展

### 添加新的设计令牌
在 `tokens.css` 中添加：
```css
:root {
  --my-custom-color: #your-color;
  --my-custom-space: 1.5rem;
}
```

### 创建新的组件样式
在 `components.css` 中添加：
```css
.my-component {
  /* 组件样式 */
}
```

### 添加新的工具类
在 `utilities.css` 中添加：
```css
.my-utility {
  /* 工具类样式 */
}
```

## 📋 最佳实践

1. **优先使用设计令牌**：避免硬编码颜色、字体大小等值
2. **语义化类名**：使用有意义的类名而不是表象类名
3. **响应式优先**：从移动端开始设计，逐步增强
4. **无障碍友好**：确保所有交互元素都有适当的焦点状态
5. **性能考虑**：合理使用动画和过渡效果
6. **主题兼容**：确保所有自定义样式都支持暗色主题

## 🐛 问题排查

### 样式不生效
1. 检查导入顺序
2. 确保 CSS 变量正确引用
3. 检查浏览器兼容性

### 主题切换问题
1. 确保正确设置 `data-theme` 属性
2. 检查 CSS 变量是否正确定义
3. 验证 JavaScript 主题切换逻辑

### Ant Design 样式冲突
1. 检查样式导入顺序
2. 使用更具体的选择器
3. 必要时使用 `!important`（谨慎使用）

## 📚 参考资源

- [CSS 自定义属性](https://developer.mozilla.org/zh-CN/docs/Web/CSS/--*)
- [CSS Grid 布局](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_Grid_Layout)
- [Flexbox 布局](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_Flexible_Box_Layout)
- [CSS 媒体查询](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Media_Queries)
- [Web 无障碍性](https://developer.mozilla.org/zh-CN/docs/Web/Accessibility)

---

这个设计系统提供了完整的现代化 CSS 架构，支持主题切换、响应式设计和无障碍访问。通过模块化的组织方式，确保了代码的可维护性和可扩展性。