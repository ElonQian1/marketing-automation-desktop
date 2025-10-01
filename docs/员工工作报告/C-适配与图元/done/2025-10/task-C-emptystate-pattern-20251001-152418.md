任务 ID: C-20251001-152418
状态: done
创建时间（台北）: 2025-10-01 15:24:18 (UTC+08:00)
主题: EmptyState Pattern

---

## 简述
- 多状态：noData/searchEmpty/filtered/error/offline；统一 icon/文案/操作位
- 入口：src/components/patterns/index.ts（按需导入 EmptyState）
- Demo：BrandShowcasePage + PatternDemos

## 验证
- [x] 无 `.ant-*` 覆盖
- [x] 暗黑/紧凑验证通过（待截图）
