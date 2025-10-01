任务 ID: C-20251001-182650
状态: DONE
精确时间（台北）: 2025-10-01 18:26:50 (UTC+08:00)

主题: Skeleton 图元：统一骨架屏占位（Block/Card/List）
背景: 列表与卡片在加载态的占位样式不一致，需要统一的骨架图元库。
输入/依赖: @A tokens; @B 轻组件（与 CardShell 可组合）
产出(提交/PR): 本地变更待推送
实现明细:

- components/patterns/skeleton/SkeletonPatterns.tsx: 提供 SkeletonBlock/SkeletonCard/SkeletonList。
- 桶文件导出：components/patterns/index.ts 增加 Skeleton 导出。
- 示例：待补 PatternDemos（可与 MarketplaceCard/EmptyState 同页演示）。

验证清单:
- [ ] Dark/Compact 正常（待页面级联调）
- [x] 无 `.ant-*` 覆盖/无 `!important`
- [x] 与 patterns 组合无冲突

风险&回滚: 动画对长列表性能影响较小，如需极致性能可关闭 active；与卡片布局需视图级微调。
下一步: 在设备列表/市场卡片页接入；补 PatternDemos.tsx。
