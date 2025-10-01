任务 ID: C-20251001-152418
状态: done
创建时间（台北）: 2025-10-01 15:24:18 (UTC+08:00)
主题: Steps 适配层

---

## 简述
- 统一 StepsAdapter 默认：小尺寸/中尺寸使用 progressDot、文案与密度从 tokens 派生
- 入口：src/components/adapters/steps/StepsAdapter.tsx
- Demo：BrandShowcasePage → AdapterDemos

## 验证
- [x] 无 `.ant-*` 覆盖
- [x] 暗黑/紧凑在局部 ConfigProvider 下表现正常（待截图）

## 关联旧卡
- DONE_20251001-182640_C_steps-adapter.md
