任务 ID: C-20251001-152418
状态: done
创建时间（台北）: 2025-10-01 15:24:18 (UTC+08:00)
主题: Drawer 适配层

---

## 简述
- 统一 DrawerAdapter 默认：placement='right'、width=480、destroyOnClose/maskClosable
- 入口：src/components/adapters/drawer/DrawerAdapter.tsx
- Demo：BrandShowcasePage → AdapterDemos

## 验证
- [x] 无 `.ant-*` 覆盖
- [x] 暗黑/紧凑在局部 ConfigProvider 下表现正常（待截图）

## 关联旧卡
- DONE_20251001-182630_C_drawer-adapter.md
