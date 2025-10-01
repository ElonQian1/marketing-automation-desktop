任务 ID: B-20251001-223000
状态: ⏳ **进行中**
创建时间（台北）: 2025-10-01 22:30:00 (UTC+08:00)
主题: Select 组件令牌化与变体系统统一

---

## 背景
Select 组件仍使用硬编码 Tailwind 类名，未完全接入 design tokens 系统：
- 颜色直接使用 `border-border/60`、`hover:shadow-[0_2px_4px_rgba(0,0,0,0.05)]` 等硬编码值
- 缺乏统一的 CVA 变体系统，尺寸和状态管理分散
- 下拉面板样式使用硬编码玻璃态效果，未使用 design tokens
- 与 Input 组件样式不一致，缺乏表单组件间的视觉统一性

需要重构 Select/MultiSelect/TagSelect 组件，使其完全基于 design tokens，采用 CVA 变体系统，与其他表单组件保持一致性。

## 实现要点
- `src/components/ui/forms/Select.tsx`: 使用 design tokens 定义基础样式，替换所有硬编码色值和效果
- `src/components/ui/forms/Select.tsx`: 采用 CVA 变体系统，提供统一的 size/variant/error 状态管理
- `src/components/ui/forms/Select.tsx`: 集成 `focusRing` 工具函数，与 Input 组件保持焦点环一致性
- `src/components/ui/forms/Select.tsx`: 统一下拉面板样式，使用 tokens 定义玻璃态效果

## 更新记录
- [2025-10-01 22:30:00] 创建任务，开始 Select 令牌化重构

## 验证清单
- [ ] 颜色/阴影/边框使用 design tokens（无硬编码值）
- [ ] CVA 变体系统集成，尺寸和状态管理统一
- [ ] 焦点环与 Input 组件保持一致
- [ ] 下拉面板样式使用 tokens 定义
- [ ] TypeScript 类型与导出链路无回归

## 风险与回滚
- 新的变体系统可能影响现有选择器用例，需要保持向后兼容
- 下拉面板样式变更可能影响全局选择器外观，需要测试确认