任务 ID: B-20251001-173500
状态: open
创建时间（台北）: 2025-10-01 17:35:00 (UTC+08:00)
主题: Dialog 接入 motionPresets 动效

---

## 背景
Dialog 仍使用原 radix 的 data-state 动画类，需统一接入 motionPresets（overlay、modal），以保证入场 180–220ms、离场 120–160ms 的一致性，并保留 tokens 与 A11y。

## 实现要点
- `DialogOverlay`: 使用 `asChild + motion.div`，应用 `motionPresets.variants.overlay`。
- `DialogContent`: 使用 `asChild + motion.div`，应用 `motionPresets.variants.modal` 与 enter 过渡。

## 更新记录
- [2025-10-01 17:35:00] 创建任务，准备替换 Overlay 与 Content 为 motion 变体。

## 验证清单
- [ ] Overlay/Content 入/出一致
- [ ] 焦点环与键盘路径保持
- [ ] tokens 生效（背景/边框/阴影/圆角）

## 风险与回滚
- 若发现焦点管理与动画冲突，可回退为原 data-state 类并逐项替换。
