任务 ID: C-20251001-152418
状态: done
创建时间（台北）: 2025-10-01 15:24:18 (UTC+08:00)
主题: Upload 适配层

---

## 简述
- 统一 UploadAdapter 默认：multiple 支持、触发按钮样式通过外层 Button/Slot 注入；不覆写 .ant-*
- 入口：src/components/adapters/upload/UploadAdapter.tsx
- Demo：BrandShowcasePage → AdapterDemos（懒加载）

## 验证
- [x] 无 `.ant-*` 覆盖
- [x] 暗黑/紧凑在局部 ConfigProvider 下表现正常（待截图入库）

## 关联旧卡
- DONE_20251001-182600_C_upload-adapter.md
