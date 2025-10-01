任务 ID: C-20251001-152418
状态: done
创建时间（台北）: 2025-10-01 15:24:18 (UTC+08:00)
主题: Tree 适配层

---

## 简述
- 统一 TreeAdapter 默认：支持高度触发虚拟化、选择/展开交互一致；不覆写 .ant-*
- 入口：src/components/adapters/tree/TreeAdapter.tsx
- Demo：BrandShowcasePage → AdapterDemos

## 验证
- [x] 无 `.ant-*` 覆盖
- [x] 暗黑/紧凑在局部 ConfigProvider 下表现正常（待截图）

## 关联旧卡
- DONE_20251001-182610_C_tree-adapter.md
