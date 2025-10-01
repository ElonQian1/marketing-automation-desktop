任务 ID: C-20251001-182900
状态: REVIEW
精确时间（台北）: 2025-10-01 18:29:00 (UTC+08:00)

主题: Table 适配层：sticky + pagination 统一
背景: 表格在不同页面 sticky/分页位置/密度不一致，需要通过适配层统一体验。
输入/依赖: @A tokens（密度/字号）, @B 轻组件（Button/CardShell）
产出(提交/PR): 既有实现（components/adapters/table/TableAdapter.tsx），桶文件已统一导出。
实现明细:

- components/adapters/table/TableAdapter.tsx: 统一 size 默认 middle、支持 sticky header、分页位置规范化（页脚右侧）。
- components/components/patterns/filter-bar/：与 FilterBar 组合，保证筛选 + 列表的一致布局。
- 示例：pages/brand-showcase/BrandShowcasePage.tsx 中已有使用；可追加专门 Demo。

验证清单:
- [ ] Dark/Compact 正常（列表行高/分页高度）
- [x] 无 `.ant-*` 覆盖/无 `!important`
- [x] 与 patterns 组合无冲突

风险&回滚: 个别页面列宽/自动换行策略不同；可通过 TableAdapter props 局部覆盖。回滚可直接使用 AntD Table 原生 props（功能不丢失）。
下一步: @D 请在设备列表/联系人等列表页替换接入；验收后标记 DONE。
