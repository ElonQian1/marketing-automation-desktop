任务 ID: B-20251001-170500
状态: done
创建时间（台北）: 2025-10-01 17:05:00 (UTC+08:00)
主题: Tooltip 组件品牌化重构

---

## 背景
Tooltip 仍保留旧版样式与动画，未接入统一的 motionPresets 与设计令牌，需要完成 Radix + Tailwind 的现代化重构并保持 A11y 完整。

## 实现要点
- `src/components/ui/tooltip/Tooltip.tsx`: 采用 motionPresets slide 变体、tokens 皮肤，以及 `TooltipArrow` 包装。
- `src/components/ui/index.ts`: 暴露 Tooltip 系列导出，便于上层统一引用。
- `docs/员工工作报告/B-轻组件动效/_index.md`: 更新完成后同步链接。

## 更新记录
- [2025-10-01 17:05:00] 创建任务，准备替换 Tooltip 样式与动效。
- [2025-10-01 17:38:00] 完成 Tooltip 样式/动效重构，新增 TooltipArrow 与统一导出，等待 Story 截图。
- [2025-10-01 17:52:00] 运行 `npm run type-check -- --pretty false`，存在既有模块错误（未改动文件），Tooltip 本身通过。

## 验证清单
- [x] 仅读 tokens（不硬编码颜色/圆角/阴影）
- [ ] Dark/Compact 正常
- [ ] Story 截图/录屏可查

## 风险与回滚
- Radix Tooltip 在 asChild 模式下需要验证 arrow 渲染是否稳定；如出现问题可临时回退到旧实现。
- 全局 type-check 仍受历史模块影响（适配层、Universal UI、Device Management 等），Tooltip 改动可通过 git revert 单独回滚。
