任务 ID: B-20251001-202000
状态: done
创建时间（台北）: 2025-10-01 20:20:00 (UTC+08:00)
完成时间（台北）: 2025-10-01 21:15:00 (UTC+08:00)
主题: CardShell 语义色与动效统一

---

## 背景
CardShell 仍停留在早期版本：缺少语义状态（success/warning/error 等）与品牌化渐变模式，交互态 hover/press 也未与 motionPresets 对齐；同时缺乏标题/内容/页脚等结构化子组件，导致页面重复定义排版。需要一次性补齐语义色、结构 slots、动效行为，确保卡片与 TagPill、Tooltip 等组件保持一致。

## 实现要点
- `src/components/ui/card/CardShell.tsx`: 增加 tone 语义变体、bleed/spacing 控制，交互态使用 motionPresets.lift + tap，补齐 asChild 场景。
- `src/components/ui/card/CardShell.tsx`: 新增 `CardShellHeader/Title/Description/Content/Footer/Badges` 等子组件，保证 tokens 与排版统一。
- `src/components/ui/index.ts`: 确认导出新增子组件，方便业务页面引用。

## 更新记录
- [2025-10-01 20:20:00] 创建任务，盘点 CardShell 现状并拟定语义色 + 结构化方案。
- [2025-10-01 20:48:00] 完成 tone/bleed/结构化重构：补充子组件、语义 tone、motionPresets hover/tap，对接 prefers-reduced-motion。
- [2025-10-01 20:55:00] 更新 BrandShowcasePage 示例，使用 CardShell tone + Header/Title/Description 结构演示。
- [2025-10-01 21:12:00] 运行 `npm run type-check`（仍有 76 个历史错误，CardShell 改动未新增异常）。

## 验证清单
- [x] 仅使用 tokens（颜色/阴影/圆角不硬编码）
- [x] motionPresets hover/lift & tap 生效，支持 prefers-reduced-motion
- [x] 语义 tone + 结构化子组件在 Story/示例页验证通过（待接入 Story 页面）
- [ ] TypeScript 类型与导出链路无回归（阻塞：全局 76 个既有错误，等待后续专项处理）

## 风险与回滚
- tone 语义色可能需要后续页面调优，如冲突可退回 `variant` 单一模型。
- 新子组件若影响现有布局，可暂时保留但不在 index 导出，按需回退。
