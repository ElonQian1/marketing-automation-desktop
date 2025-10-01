任务 ID: C-20251001-231850
状态: review
创建时间（台北）: 2025-10-01 23:18:50 (UTC+08:00)
主题: Table 适配层：sticky + small pagination

---

## 背景
统一重组件体验，禁止覆写 `.ant-*` 与 DOM，适配层承载 size/scroll/pagination 等默认。

## 实现要点（计划）
- components/adapters/table/TableAdapter.tsx：默认 size='middle'、sticky header、分页位置（bottomRight），支持横向滚动
- 通过外层容器/props 注入，不修改 AntD 内层结构
- 最小示例：BrandShowcasePage 中以 AdapterDemos 展示

## 更新记录（累积）
- [2025-10-01 23:18:50] 适配层统一方案已落地（见当前实现）；演示入口已就绪

## 验证清单
- [ ] Dark/Compact 正常
- [ ] 无 `.ant-*` / 无 `!important`
- [ ] TS 类型与最小用例就绪

## 可替换页面建议
- 员工管理列表页、设备列表页、联系人导入记录页

## 风险与回滚
- 列宽/自适应可能与历史页面样式冲突；优先调整 tokens 或容器，避免侵入 Table 内部
