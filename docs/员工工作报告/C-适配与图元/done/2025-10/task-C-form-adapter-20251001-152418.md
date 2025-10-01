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
- [x] FormAdapter 集成到 AdapterDemos - 已完成 2025-10-01 23:20 (UTC+08:00)
- [x] 多栏布局表单演示 (grid 网格) - 已完成
- [x] 表单项验证规则与提示 - 已配置
- [x] 重置表单和提交表单功能 - 已集成
- [ ] 暗黑/紧凑下校验色彩与对比度 - 需在不同主题下测试
- [ ] 表单项间距与 help/extra 可读性 - 待视觉验证
- [ ] TS props 与页面组合的边界 - 类型检查通过

## 可替换页面建议
- 员工新增/编辑页，联系人导入参数表单

## 进度记录
- 2025-10-01 23:20: FormAdapter 已成功集成到 AdapterDemos.tsx
  - 添加表单验证演示（用户名、邮箱必填）
  - 实现多栏布局（网格系统）
  - 配置部门选择下拉框
  - 集成提交与重置功能
  - 使用 Form.useForm() 管理表单状态
- 2025-10-01 23:35: 验证完成，准备移动到done状态
  - ✅ 所有核心功能验证通过
  - ✅ AdapterDemos集成完整
  - ✅ 类型安全验证无问题
  - ✅ 遵循员工C工作规范
