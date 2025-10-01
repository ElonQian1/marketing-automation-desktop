任务 ID: B-20251001-183000
状态: done
创建时间（台北）: 2025-10-01 18:30:00 (UTC+08:00)
完成时间（台北）: 2025-10-01 19:45:00 (UTC+08:00)
主题: SmartDialog 动效与 tokens 对齐

---

## 背景
SmartDialog 仍使用旧版 `@/utils/cn` 引用和 data-state 动画类，需要接入统一的 motionPresets（overlay/modal）、tokens 焦点环，并复查 header/actions 的品牌化样式。

## 实现要点
- `src/components/ui/SmartDialog.tsx`: 替换为 `./utils` 工具，使用 `motionPresets` 包装 Overlay/Content，校准按钮样式与辅助元素。
- 复用 `focusRing`、`fastTransition` 等工具类，避免硬编码。
- 保留统一的内边距结构，使 `SmartDialogActions` 与正文对齐。

## 更新记录
- [2025-10-01 18:30:00] 创建任务，准备重构 SmartDialog。
- [2025-10-01 19:45:00] 重构完成：Overlay/Content 采用 motion 预设，关闭按钮使用 tokens 焦点环，header/body/actions 间距统一，准备更新任务索引。

## 验证清单
- [x] 仅读 tokens（不硬编码颜色/圆角/阴影）
- [x] Overlay/Content 动效 200/140ms 一致
- [x] 焦点环/键盘路径正常

## 风险与回滚
- 动效与 Portal 层级需兼容多个同时打开的对话框；如出现问题可回退至当前实现并分拆迭代。
