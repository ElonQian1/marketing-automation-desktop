任务 ID: C-20251001-152418
状态: review
创建时间（台北）: 2025-10-01 15:24:18 (UTC+08:00)
主题: Form 适配层（校验提示 & 密度）

---

## 背景
- 统一 FormAdapter 与 FormItemAdapter 的校验触发、help/extra 展示、密度与间距；禁止覆写 `.ant-*`

## 实现要点（现状）
- 入口：src/components/adapters/form/FormAdapter.tsx
- 统一：labelCol/wrapperCol 封装、submit/cancel 区域、disabled/readOnly 策略
- 示例：BrandShowcasePage 新增员工 Dialog 中使用

## 待验证
- [ ] 暗黑/紧凑下校验色彩与对比度
- [ ] 表单项间距与 help/extra 可读性
- [ ] TS props 与页面组合的边界

## 可替换页面建议
- 员工新增/编辑页，联系人导入参数表单
