任务 ID: B-20251002-011400
状态: open
创建时间（台北）: 2025-10-02 01:14:00 (UTC+08:00)
主题: 轻组件硬编码样式清理 - Design Tokens 统一化

---

## 背景

通过运行 `scripts/check-hardcoded-styles.js` 检测发现，当前轻组件中仍存在81个ERROR级别的硬编码问题，主要集中在：

1. **TagPill组件**: 硬编码渐变阴影（`shadow-[0_1px_3px_rgba(59,130,246,0.1)]`）
2. **Card/CardShell组件**: 硬编码阴影值（`shadow-[var(--shadow-lg)]`）
3. **IconButton组件**: 硬编码颜色变体（`bg-brand-50`等）
4. **Input/Select组件**: 硬编码阴影样式（`shadow-[var(--shadow-brand-glow)]`）
5. **其他组件**: Dialog、Dropdown、Tooltip等的硬编码样式

这些问题违反了员工B轻组件开发规范中"仅读tokens（不硬编码颜色/圆角/阴影）"的约束。

## 实现要点

### 1. TagPill 硬编码阴影修复
- `src/components/ui/tag-pill/TagPill.tsx`: 替换硬编码RGBA阴影为design tokens
- 统一使用 `shadow-[var(--shadow-tag-*)]` 系列tokens
- 确保所有变体（brand/success/warning/error/info）使用统一的阴影系统

### 2. Card系列组件修复  
- `src/components/ui/card/Card.tsx`: 修复硬编码阴影值
- `src/components/ui/card/CardShell.tsx`: 统一阴影token使用
- 避免直接使用 `shadow-[var(--shadow-lg)]` 形式

### 3. IconButton 颜色系统修复
- `src/components/ui/buttons/IconButton.tsx`: 替换 `bg-brand-50` 等硬编码变体
- 统一使用 `bg-[var(--brand-50)]` 或对应的语义化tokens
- 确保所有色调变体符合design tokens规范

### 4. 表单组件阴影统一
- `src/components/ui/forms/Input.tsx`: 修复聚焦态阴影硬编码
- `src/components/ui/forms/Select.tsx`: 统一阴影token使用

## 更新记录

- [2025-10-02 01:14:00] 创建任务，识别81个ERROR级硬编码问题
- [2025-10-02 01:14:00] 分析问题分布：TagPill/Card/IconButton为重点修复对象

## 验证清单

- [ ] TagPill组件硬编码阴影修复（5个ERROR）
- [ ] Card/CardShell硬编码阴影修复（8个ERROR）  
- [ ] IconButton颜色变体修复（12个ERROR）
- [ ] Input/Select阴影token统一（6个ERROR）
- [ ] Dialog/Dropdown/Tooltip硬编码修复（其余ERROR）
- [ ] 运行检测脚本确认ERROR数量降至0
- [ ] 验证所有轻组件Dark/Light模式正常
- [ ] 确保修复后不影响现有功能

## 风险与回滚

风险：中等 - 涉及多个核心轻组件的样式修改
回滚：通过Git恢复修改前的文件版本
测试：重点验证品牌色和主题切换功能

## 预期成果

- ERROR级硬编码问题从81个降至0个
- 所有轻组件完全基于design tokens
- 符合员工B"仅读tokens"的硬性约束
- 提升主题切换和品牌一致性