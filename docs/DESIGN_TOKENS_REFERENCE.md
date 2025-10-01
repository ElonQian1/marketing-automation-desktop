# Design Tokens 对照表与使用指南

**版本**: v2.0  
**最后更新**: 2025-10-02  
**维护者**: 员工A (Design Tokens & Theme Bridge 负责人)

---

## 🎨 颜色令牌系统

### 主色彩
```css
/* 品牌主色 */
--color-primary: #1890ff;           /* 主要操作、强调元素 */
--color-primary-hover: #40a9ff;     /* 主色悬停状态 */
--color-primary-active: #0a7dd6;    /* 主色激活状态 */

/* 功能色彩 */
--color-success: #52c41a;           /* 成功状态 */
--color-warning: #faad14;           /* 警告状态 */
--color-error: #ff4d4f;             /* 错误状态 */
--color-info: #1890ff;              /* 信息提示 */
```

### 中性色彩
```css
/* 文本层级 */
--color-text-primary: #000000d9;    /* 主要文本 (85% 不透明度) */
--color-text-secondary: #00000073;  /* 次要文本 (45% 不透明度) */
--color-text-disabled: #00000040;   /* 禁用文本 (25% 不透明度) */

/* 背景层级 */
--color-bg-container: #ffffff;      /* 容器背景 */
--color-bg-elevated: #ffffff;       /* 悬浮背景 */
--color-bg-layout: #f5f5f5;         /* 布局背景 */

/* 边框 */
--color-border: #d9d9d9;            /* 常规边框 */
--color-border-secondary: #f0f0f0;  /* 次要边框 */
```

### 暗黑模式对应
```css
[data-theme="dark"] {
  --color-text-primary: #ffffffd9;
  --color-text-secondary: #ffffff73;
  --color-text-disabled: #ffffff40;
  
  --color-bg-container: #141414;
  --color-bg-elevated: #1f1f1f;
  --color-bg-layout: #000000;
  
  --color-border: #434343;
  --color-border-secondary: #303030;
}
```

---

## 📏 尺寸令牌系统

### 间距系统
```css
/* 基础间距单位 */
--spacing-xs: 4px;    /* 最小间距 */
--spacing-sm: 8px;    /* 小间距 */
--spacing-md: 16px;   /* 中等间距 */
--spacing-lg: 24px;   /* 大间距 */
--spacing-xl: 32px;   /* 特大间距 */

/* 布局间距 */
--spacing-section: 48px;    /* 章节间距 */
--spacing-page: 64px;       /* 页面间距 */
```

### 组件尺寸
```css
/* 控件高度 */
--control-height-sm: 24px;   /* 小型控件 */
--control-height-md: 32px;   /* 中型控件 */
--control-height-lg: 40px;   /* 大型控件 */

/* 边框圆角 */
--border-radius-sm: 2px;     /* 小圆角 */
--border-radius-md: 6px;     /* 中圆角 */
--border-radius-lg: 8px;     /* 大圆角 */
```

---

## 🔤 字体令牌系统

### 字体族
```css
--font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
--font-family-code: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
```

### 字体尺寸
```css
--font-size-xs: 12px;        /* 辅助文本 */
--font-size-sm: 14px;        /* 常规文本 */
--font-size-md: 16px;        /* 强调文本 */
--font-size-lg: 18px;        /* 小标题 */
--font-size-xl: 20px;        /* 大标题 */
--font-size-xxl: 24px;       /* 特大标题 */

/* 行高 */
--line-height-sm: 1.4;       /* 紧密行高 */
--line-height-md: 1.5;       /* 常规行高 */
--line-height-lg: 1.6;       /* 宽松行高 */
```

---

## 🌊 阴影令牌系统

```css
/* 阴影层级 */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);           /* 轻微阴影 */
--shadow-md: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 
             0 1px 2px 0 rgba(0, 0, 0, 0.06);            /* 中等阴影 */
--shadow-lg: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 
             0 2px 4px -1px rgba(0, 0, 0, 0.06);         /* 较大阴影 */
--shadow-xl: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 
             0 4px 6px -2px rgba(0, 0, 0, 0.05);         /* 悬浮阴影 */

/* 内阴影 */
--shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);  /* 凹陷效果 */
```

---

## 🎭 紧凑模式令牌

```css
[data-size="compact"] {
  --spacing-xs: 2px;
  --spacing-sm: 4px;
  --spacing-md: 8px;
  --spacing-lg: 12px;
  --spacing-xl: 16px;
  
  --control-height-sm: 20px;
  --control-height-md: 28px;
  --control-height-lg: 36px;
  
  --font-size-xs: 11px;
  --font-size-sm: 12px;
  --font-size-md: 14px;
}
```

---

## 🚀 使用指南

### 在 React 组件中使用

```tsx
// 1. 通过 CSS 类名使用 (推荐)
<div className="bg-container text-primary border-default">
  内容
</div>

// 2. 通过 CSS-in-JS 使用
const StyledComponent = styled.div`
  background: var(--color-bg-container);
  color: var(--color-text-primary);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
`;

// 3. 通过 Tailwind 工具类使用
<div className="bg-token-container text-token-primary p-token-md rounded-token-md">
  内容
</div>
```

### ThemeBridge 集成

```tsx
import { ThemeBridge } from '@/components/theme/ThemeBridge';

function App() {
  return (
    <ThemeBridge>
      {/* 所有子组件自动获得令牌支持 */}
      <YourComponents />
    </ThemeBridge>
  );
}
```

### 自定义组件最佳实践

```tsx
// ✅ 好的做法：使用令牌
const Button = styled.button`
  background: var(--color-primary);
  color: white;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  
  &:hover {
    background: var(--color-primary-hover);
  }
`;

// ❌ 避免的做法：硬编码值
const BadButton = styled.button`
  background: #1890ff;  /* 应该使用 var(--color-primary) */
  padding: 8px 16px;    /* 应该使用令牌 */
`;
```

---

## 🔧 开发工具支持

### VS Code 扩展推荐
- **CSS Var Complete**: 自动补全 CSS 变量
- **Color Highlight**: 高亮显示颜色值  
- **Tailwind CSS IntelliSense**: Tailwind 工具类提示

### 浏览器开发工具
```javascript
// 在控制台中快速查看令牌值
getComputedStyle(document.documentElement).getPropertyValue('--color-primary');

// 动态修改令牌（用于调试）
document.documentElement.style.setProperty('--color-primary', '#ff6b35');
```

---

## 📊 令牌覆盖统计

### 当前使用情况
- **颜色令牌**: 24个 (主色4个 + 功能色4个 + 中性色16个)
- **尺寸令牌**: 16个 (间距8个 + 组件尺寸5个 + 圆角3个)  
- **字体令牌**: 10个 (字体族2个 + 尺寸6个 + 行高2个)
- **阴影令牌**: 5个 (外阴影4个 + 内阴影1个)

### 主题模式支持
- ✅ 浅色模式 (默认)
- ✅ 暗黑模式  
- ✅ 紧凑模式
- ✅ 暗黑+紧凑组合模式

---

## 🚨 维护注意事项

### 添加新令牌的原则
1. **语义化命名**: 使用功能而非外观描述
2. **保持一致**: 遵循现有命名规范
3. **兼容性**: 考虑所有主题模式的适配
4. **文档更新**: 及时更新本对照表

### 弃用令牌的流程
1. 标记为 `@deprecated` 并添加替代方案
2. 更新所有使用处  
3. 版本升级后移除
4. 更新文档

---

**🔗 相关文档链接**:
- [动效规范文档](./MOTION_STANDARDS.md)
- [轻组件使用指南](./LIGHTWEIGHT_COMPONENTS_GUIDE.md)  
- [AntD适配约定](./ANTD_ADAPTER_CONVENTIONS.md)