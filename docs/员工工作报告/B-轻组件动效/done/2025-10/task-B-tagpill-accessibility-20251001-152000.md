任务 ID: B-20251001-152000
状态: done
创建时间（台北）: 2025-10-01 15:20:00 (UTC+08:00)
主题: TagPill 可访问性与交互修复

---

## 背景
TagPill 轻组件在重构过程中插入了无效属性，导致 TypeScript 语法错误并破坏交互式可访问体验，需要在统一动效体系下予以修复。

## 实现要点
- `src/components/ui/tag-pill/TagPill.tsx`: 移除错误的 props 解构，确保 `motion.button` 设置 `aria-disabled`，补齐非交互态关闭按钮的隐藏文案。
- 统一沿用 `motionPresets.variants.hover`，保持 hover/press 节奏在 80–120ms 范围内，符合品牌动效规范。

## 更新记录
- [2025-10-01 15:18:00] 完成组件修复并复查 hover/press 动效，等待 Tooltip 工作衔接。

## 验证清单
- [x] 仅读 tokens（不硬编码颜色/圆角/阴影）
- [ ] Dark/Compact 正常（待 Storybook 联调）
- [ ] Story 截图/录屏可查

## 风险与回滚
- 现有 `DeviceManagementPageRefactored.tsx` 仍有 JSX 闭合标签错误，TypeScript 检查暂未通过；如需回滚可恢复至修复前的 TagPill 版本。
