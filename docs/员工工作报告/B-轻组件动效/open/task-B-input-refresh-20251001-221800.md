任务 ID: B-20251001-221800
状态: ⏳ **进行中**
创建时间（台北）: 2025-10-01 22:18:00 (UTC+08:00)
主题: Input 组件令牌化与交互动效统一

---

## 背景
Input 组件仍使用硬编码 Tailwind 类名，未完全接入 design tokens 系统：
- 颜色直接使用 `border-brand-500`、`shadow-[var(--shadow-brand-glow)]` 等不规范写法
- 缺乏统一的尺寸变体系统与 motion 动效集成  
- 焦点环样式不一致，与其他组件的 `focusRing` 工具函数分离
- TextArea 与 Input 样式逻辑重复，需要统一抽象

需要重构 Input/TextArea 组件，使其完全基于 design tokens，集成 motionPresets，并与品牌化设计系统保持一致。

## 实现要点
- `src/components/ui/forms/Input.tsx`: 使用 design tokens 定义基础样式，替换所有硬编码色值和阴影
- `src/components/ui/forms/Input.tsx`: 集成 `focusRing` 工具函数，统一焦点环样式
- `src/components/ui/forms/Input.tsx`: 抽象共用样式逻辑，避免 Input/TextArea 重复代码
- 集成 CVA 变体系统，提供一致的尺寸/状态变体

## 更新记录
- [2025-10-01 22:18:00] 创建任务，梳理 Input tokens/motion 差距
- [2025-10-01 22:25:00] 完成 Input/TextArea CVA 重构：接入 design tokens、统一焦点环样式、抽象共用逻辑

## 验证清单
- [x] 颜色/阴影/边框使用 design tokens（无 Tailwind 色值硬编码）
- [x] 焦点环使用统一的 `focusRing` 工具函数
- [x] Input/TextArea 样式逻辑统一，避免重复代码
- [x] TypeScript 类型与导出链路无回归

## 风险与回滚
- 新的变体系统可能影响现有表单用例，需要保持向后兼容
- 若动效集成导致性能问题，可回退到纯 CSS transition 方案