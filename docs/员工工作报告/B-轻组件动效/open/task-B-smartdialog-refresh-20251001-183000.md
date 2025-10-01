任务 ID: B-20251001-183000
状态: archived
创建时间（台北）: 2025-10-01 18:30:00 (UTC+08:00)
归档时间（台北）: 2025-10-01 19:45:00 (UTC+08:00)
主题: SmartDialog 动效与 tokens 对齐（已迁移至 done 目录）

---

## 背景
SmartDialog 仍使用旧版 `@/utils/cn` 引用和 data-state 动画类，需要接入统一的 motionPresets（overlay/modal）、tokens 焦点环，并复查 header/actions 的品牌化样式。

## 实现要点
- `src/components/ui/SmartDialog.tsx`: 替换为 `../utils` 工具，使用 `motionPresets` 包装 Overlay/Content，校准按钮样式与辅助元素。
- 复用 `focusRing`、`fastTransition` 等工具类，避免硬编码。
- 确保 header/title/description/actions 使用 tokens，并保持可访问性。

## 更新记录
- [2025-10-01 18:30:00] 创建任务，准备重构 SmartDialog。
- [2025-10-01 19:45:00] 任务已在 done 目录完成归档，详情请见 `../done/2025-10/task-B-smartdialog-refresh-20251001-183000.md`。

## 验证清单
- [x] 仅读 tokens（不硬编码颜色/圆角/阴影）
- [x] Overlay/Content 动效 200/140ms 一致
- [x] 焦点环/键盘路径正常

## 风险与回滚
- 动效与 Portal 层级需兼容多个同时打开的对话框；如出现问题可回退至当前实现并分拆迭代。
