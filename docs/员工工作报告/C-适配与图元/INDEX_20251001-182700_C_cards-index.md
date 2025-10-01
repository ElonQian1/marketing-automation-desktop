任务 ID: C-20251001-182700
状态: REVIEW
精确时间（台北）: 2025-10-01 23:18:50 (UTC+08:00)

主题: 任务卡索引（10/01）
背景: 汇总今日新增的适配器与图元任务卡，便于协作与替换接入。
清单:
- DONE_20251001-182600_C_upload-adapter.md
- DONE_20251001-182610_C_tree-adapter.md
- DONE_20251001-182620_C_date-picker-adapter.md
- DONE_20251001-182630_C_drawer-adapter.md
- DONE_20251001-182640_C_steps-adapter.md
- DONE_20251001-182650_C_skeleton-patterns.md
 - REVIEW_20251001-182900_C_table-adapter-sticky-pagination.md
 - REVIEW_20251001-183000_C_form-adapter-validation-density.md
 - INPROG_20251001-183100_C_dark-compact-verification.md（原 TODO 卡已更新为 INPROG）
- REVIEW_20251001-183130_C_pattern-demos.md（已挂载于 BrandShowcasePage）

可替换页面建议:
- 设备管理页：Drawer/Steps/Skeleton
- 筛选与列表页：DatePicker/Upload + FilterBar + SkeletonList
- 市场卡片页：SkeletonCard + MarketplaceCard

协作:
- @D 请在对应页面尝试替换接入；如发现密度/列宽/校验提示问题，回帖到对应任务卡并退回 INPROG。
 - 演示入口：BrandShowcasePage（src/pages/brand-showcase/BrandShowcasePage.tsx）
	 - Theme 控制区：暗黑/紧凑开关（局部 ConfigProvider，仅影响示例区域）
	 - PatternDemos/AdapterDemos：点击“显示示例”展开
