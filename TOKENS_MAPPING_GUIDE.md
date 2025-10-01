# Design Tokens 対照表 - 硬编码值禁止指南

## 📋 核心文件现状 (2025年1月21日)

| 文件 | 行数 | 状态 | 说明 |
|------|------|------|------|
| `src/styles/tokens.css` | 181行 | ✅ SSOT | Design Tokens 单一数据源 |
| `src/theme/ThemeBridge.tsx` | 209行 | ✅ 活跃 | AntD v5 主题桥接器 |
| `tailwind.config.js` | 125行 | ✅ 配置 | Tailwind CSS v4 配置 |

---

## 🚫 硬编码值严格禁止

### 颜色值硬编码 - 绝对禁止

```typescript
// ❌ 严格禁止 - 硬编码十六进制颜色
const style = { color: '#1890ff' };
const className = 'text-[#ff4d4f]';

// ❌ 严格禁止 - 硬编码RGB/RGBA
const style = { backgroundColor: 'rgb(24, 144, 255)' };
const style = { borderColor: 'rgba(255, 77, 79, 0.8)' };

// ✅ 必须使用 - Design Tokens
const style = { color: 'var(--color-primary)' };
const className = 'text-primary';
```

### 间距值硬编码 - 绝对禁止

```typescript
// ❌ 严格禁止 - 硬编码像素值
const style = { margin: '16px', padding: '8px 12px' };
const className = 'mt-[16px] px-[12px]';

// ✅ 必须使用 - Design Tokens
const style = { margin: 'var(--spacing-md)', padding: 'var(--spacing-sm) var(--spacing-base)' };
const className = 'mt-md px-base';
```

### 字体大小硬编码 - 绝对禁止

```typescript
// ❌ 严格禁止 - 硬编码字体大小
const style = { fontSize: '14px', lineHeight: '1.5' };
const className = 'text-[14px] leading-[1.5]';

// ✅ 必须使用 - Design Tokens
const style = { fontSize: 'var(--font-size-md)', lineHeight: 'var(--line-height-base)' };
const className = 'text-md leading-base';
```

---

## 📖 Design Tokens 完整対照表

### 🎨 颜色系统

#### 品牌色
```css
/* Primary - 主品牌色 */
--color-primary: #1890ff;
--color-primary-light: #40a9ff;
--color-primary-dark: #096dd9;

/* Secondary - 辅助色 */
--color-secondary: #722ed1;
--color-secondary-light: #9254de;
--color-secondary-dark: #531dab;
```

#### 状态色
```css
/* Success - 成功状态 */
--color-success: #52c41a;
--color-success-light: #73d13d;
--color-success-dark: #389e0d;

/* Warning - 警告状态 */
--color-warning: #faad14;
--color-warning-light: #ffc53d;
--color-warning-dark: #d48806;

/* Error - 错误状态 */
--color-error: #ff4d4f;
--color-error-light: #ff7875;
--color-error-dark: #cf1322;

/* Info - 信息状态 */
--color-info: #1890ff;
--color-info-light: #40a9ff;
--color-info-dark: #096dd9;
```

#### 中性色
```css
/* Text Colors */
--color-text-primary: rgba(0, 0, 0, 0.88);
--color-text-secondary: rgba(0, 0, 0, 0.65);
--color-text-tertiary: rgba(0, 0, 0, 0.45);
--color-text-quaternary: rgba(0, 0, 0, 0.25);

/* Background Colors */
--color-bg-container: #ffffff;
--color-bg-elevated: #ffffff;
--color-bg-layout: #f5f5f5;
--color-bg-spotlight: #ffffff;
--color-bg-mask: rgba(0, 0, 0, 0.45);

/* Border Colors */
--color-border: #d9d9d9;
--color-border-secondary: #f0f0f0;
--color-split: rgba(5, 5, 5, 0.06);
```

### 📏 间距系统

```css
/* Base Spacing Scale */
--spacing-xs: 4px;    /* 极小间距 */
--spacing-sm: 8px;    /* 小间距 */
--spacing-base: 12px; /* 基础间距 */
--spacing-md: 16px;   /* 中等间距 */
--spacing-lg: 20px;   /* 大间距 */
--spacing-xl: 24px;   /* 超大间距 */
--spacing-xxl: 32px;  /* 极大间距 */

/* Component-Specific Spacing */
--spacing-button-padding-horizontal: var(--spacing-md);
--spacing-button-padding-vertical: var(--spacing-xs);
--spacing-card-padding: var(--spacing-md);
--spacing-form-item-margin-bottom: var(--spacing-lg);
```

### 🔤 字体系统

```css
/* Font Sizes */
--font-size-xs: 10px;
--font-size-sm: 12px;
--font-size-base: 14px;
--font-size-md: 14px;
--font-size-lg: 16px;
--font-size-xl: 18px;
--font-size-xxl: 20px;

/* Line Heights */
--line-height-tight: 1.2;
--line-height-base: 1.5;
--line-height-relaxed: 1.6;
--line-height-loose: 2;

/* Font Weights */
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;

/* Font Families */
--font-family-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
--font-family-mono: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
```

### 🎭 阴影和边框

```css
/* Box Shadows */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02);
--shadow-base: 0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02);
--shadow-md: 0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02);
--shadow-lg: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-xl: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);

/* Border Radius */
--border-radius-sm: 2px;
--border-radius-base: 4px;
--border-radius-md: 6px;
--border-radius-lg: 8px;
--border-radius-xl: 12px;

/* Border Widths */
--border-width-base: 1px;
--border-width-thick: 2px;
```

### 🔄 动画和过渡

```css
/* Transition Durations */
--motion-duration-fast: 0.1s;
--motion-duration-mid: 0.2s;
--motion-duration-slow: 0.3s;

/* Easing Functions */
--motion-ease-out: cubic-bezier(0.215, 0.61, 0.355, 1);
--motion-ease-in: cubic-bezier(0.55, 0.055, 0.675, 0.19);
--motion-ease-in-out: cubic-bezier(0.645, 0.045, 0.355, 1);
--motion-ease-out-back: cubic-bezier(0.12, 0.4, 0.29, 1.46);
--motion-ease-in-back: cubic-bezier(0.71, -0.46, 0.88, 0.6);
--motion-ease-in-out-back: cubic-bezier(0.71, -0.46, 0.29, 1.46);
--motion-ease-out-circ: cubic-bezier(0.08, 0.82, 0.17, 1);
--motion-ease-in-circ: cubic-bezier(0.6, 0.04, 0.98, 0.34);
--motion-ease-in-out-circ: cubic-bezier(0.78, 0.14, 0.15, 0.86);
```

---

## 🛠️ 使用方式

### 在 React 组件中使用

```typescript
// ✅ 正确方式 - 使用CSS变量
const StyledComponent = styled.div`
  color: var(--color-text-primary);
  background-color: var(--color-bg-container);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--border-radius-base);
  box-shadow: var(--shadow-base);
`;

// ✅ 正确方式 - 使用Tailwind CSS类名
const Component = () => (
  <div className="text-primary bg-container p-md rounded-base shadow-base">
    Content
  </div>
);
```

### 在样式文件中使用

```css
/* ✅ 正确方式 - 使用tokens */
.custom-button {
  color: var(--color-text-primary);
  background-color: var(--color-primary);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-base);
  transition: all var(--motion-duration-mid) var(--motion-ease-out);
}

.custom-button:hover {
  background-color: var(--color-primary-light);
}
```

---

## 🔍 检查工具

### 自动扫描硬编码值

```bash
# 运行质量扫描检查
npm run scan:overrides

# 预期结果：0个真实CSS违规（仅DOM选择器允许）
```

### 手动检查清单

- [ ] ✅ 所有颜色值使用 `var(--color-*)` 或 Tailwind 类名
- [ ] ✅ 所有间距值使用 `var(--spacing-*)` 或 Tailwind 类名
- [ ] ✅ 所有字体大小使用 `var(--font-size-*)` 或 Tailwind 类名
- [ ] ✅ 所有边框圆角使用 `var(--border-radius-*)` 或 Tailwind 类名
- [ ] ✅ 所有阴影使用 `var(--shadow-*)` 或 Tailwind 类名
- [ ] ✅ 所有动画时长使用 `var(--motion-duration-*)` 或 Tailwind 类名

---

## 📚 相关文档

- **Design Tokens 源文件**: `src/styles/tokens.css`
- **主题桥接器**: `src/theme/ThemeBridge.tsx`
- **Tailwind 配置**: `tailwind.config.js`
- **质量扫描脚本**: `scripts/scan-overrides.mjs`

---

## ⚠️ 违规举报

发现硬编码值请立即通过以下方式举报：

1. **自动检测**: `npm run scan:overrides`
2. **手动检查**: 参考本文档检查清单
3. **团队协作**: 代码评审中严格检查

**目标**: 维持 **0个硬编码值违规** 的代码质量标准

---

*最后更新: 2025年1月21日 17:42*  
*负责人: 员工 A - Design Tokens & 主题桥负责人*  
*状态: 生产环境就绪*