# 颜色对比度和样式规范指南

本指南帮助开发者避免白底白字等可读性问题，确保界面符合无障碍标准。

## 📋 问题概述

您遇到的**白底白字问题**是由以下原因造成的：

1. **全局深色主题设置**：项目使用深色主题，全局文字颜色为白色
2. **局部浅色背景**：某些组件使用浅色背景但未覆盖文字颜色
3. **Ant Design 继承问题**：Ant Design 组件会继承全局样式，导致颜色不匹配

## 🎯 解决方案

### 方案1：使用 `.light-theme-force` 类（推荐）

```tsx
// ❌ 问题代码：白底 + 继承的白字
<div style={{ background: '#ffffff' }}>
  <Typography.Title>看不见的标题</Typography.Title>
  <Tag color="green">看不见的标签</Tag>
</div>

// ✅ 解决方案：添加主题覆盖类
<div className="light-theme-force" style={{ background: 'var(--bg-light-base)' }}>
  <Typography.Title>清晰可见的标题</Typography.Title>
  <Tag color="green">清晰可见的标签</Tag>
</div>
```

### 方案2：显式设置颜色

```tsx
// ✅ 逐个组件设置
<div style={{ background: 'var(--bg-light-base)', color: 'var(--text-inverse)' }}>
  <Typography.Title style={{ color: 'var(--text-inverse) !important' }}>
    标题
  </Typography.Title>
  <Tag style={{ color: 'var(--text-inverse)' }}>标签</Tag>
</div>
```

## 🛠️ 开发工具

### 颜色对比度检查

运行以下命令检查项目中的潜在问题：

```bash
# 扫描颜色对比度问题
npm run check:contrast

# 检查硬编码样式
npm run check:hardcoded

# 完整质量检查
npm run quality:check
```

### 可用的 CSS 变量

```css
/* 背景色 */
--bg-light-base: #ffffff        /* 浅色背景 */
--bg-light-elevated: #f8fafc    /* 浅色提升背景 */
--bg-light-secondary: #f1f5f9   /* 浅色次级背景 */

/* 文字颜色 */
--text-inverse: #1e293b         /* 深色文字（用于浅色背景） */
--text-muted: #94a3b8          /* 次要文字颜色 */

/* 边框颜色 */
--border-muted: #d1d5db        /* 边框颜色 */
```

## 📝 开发规范

### 强制要求

1. **浅色背景必须配深色文字**
2. **深色背景必须配浅色文字**
3. **使用 CSS 变量而非硬编码颜色**
4. **浅色容器必须添加 `.light-theme-force` 类**

### 检查清单

创建包含背景色的组件时，请检查：

- [ ] 是否为浅色背景设置了深色文字？
- [ ] 是否为深色背景设置了浅色文字？  
- [ ] 是否使用了 CSS 变量而非硬编码颜色？
- [ ] 是否为 Ant Design 组件添加了颜色覆盖？
- [ ] 颜色对比度是否达到 WCAG AA 标准（4.5:1）？

## 🔧 配置文件位置

- **CSS 变量定义**：`src/styles/tokens.css`
- **主题覆盖类**：`.light-theme-force`（已在 tokens.css 中定义）
- **开发约束**：`.github/copilot-instructions.md`
- **品牌规范**：`docs/品牌化提示词.md`

## 🚀 AI 辅助开发

当使用 GitHub Copilot 或其他 AI 工具时，系统会自动：

1. 检查颜色对比度问题
2. 建议使用 CSS 变量
3. 提醒添加 `.light-theme-force` 类
4. 确保符合无障碍标准

## 📚 相关文档

- [品牌化提示词](../docs/品牌化提示词.md) - 完整的样式规范
- [Copilot 指导文档](../.github/copilot-instructions.md) - AI 开发约束
- [设计令牌](../src/styles/tokens.css) - CSS 变量定义

## 🐛 常见问题

**Q: 为什么会出现白底白字？**
A: 项目使用全局深色主题，但某些组件使用浅色背景时未覆盖文字颜色。

**Q: `.light-theme-force` 类的作用是什么？**
A: 强制为 Ant Design 组件设置深色文字，解决颜色继承问题。

**Q: 如何确保颜色对比度符合标准？**
A: 使用 `npm run check:contrast` 检查，确保对比度达到 4.5:1。

**Q: 可以硬编码颜色值吗？**
A: 不可以，必须使用 CSS 变量以确保主题一致性和可维护性。