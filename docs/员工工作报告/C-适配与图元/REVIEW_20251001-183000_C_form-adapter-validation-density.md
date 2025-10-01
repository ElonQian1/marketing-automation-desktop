任务 ID: C-20251001-183000
状态: REVIEW
精确时间（台北）: 2025-10-01 18:30:00 (UTC+08:00)

主题: Form 适配层：校验提示与密度统一
背景: 表单在不同页面的校验提示、间距与布局不一致，需要适配层统一体验。
输入/依赖: @A tokens（密度/字号）, @B 轻组件（Button/TagPill）
产出(提交/PR): 既有实现（components/adapters/form/FormAdapter.tsx），桶文件已统一导出。
实现明细:

- components/adapters/form/FormAdapter.tsx: 统一 size 默认 middle；抽象 FormItemAdapter/DialogFormAdapter/StepFormAdapter 场景。
- 与 HeaderBar/FilterBar/EmptyState 等 patterns 组合，页面编排一致。
- 示例：pages/brand-showcase/BrandShowcasePage.tsx 中已有使用；可追加专门 Demo。

验证清单:
- [ ] Dark/Compact 正常（表单行高/校验提示对比）
- [x] 无 `.ant-*` 覆盖/无 `!important`
- [x] 与 patterns 组合无冲突

风险&回滚: 个别页面自定义校验文案或布局；可通过 props 局部覆盖；回滚不丢失能力。
下一步: @D 在新增/编辑表单页面替换接入；聚焦校验提示与密度表现，验收后标记 DONE。
