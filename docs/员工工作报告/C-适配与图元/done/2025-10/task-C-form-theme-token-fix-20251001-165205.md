任务 ID: C-20251001-165205
状态: review
创建时间（台北）: 2025-10-01 16:52:05 (UTC+08:00)
主题: FormAdapter 主题令牌解析修正

---

## 问题描述
- `src/components/adapters/form/FormAdapter.tsx` 中多处使用 `parseInt('var(--radius)')`、`parseInt('var(--space-6)')` 等写法，直接对 CSS 变量字符串取整会得到 `NaN`
- 实际运行下主题 token 值退化为 `NaN`，品牌化 ConfigProvider 无法生效
- 需要改为读取预设令牌（`designTokens`）或提供数值 fallback，确保暗黑/紧凑下同样稳定

## 验证入口
- `src/components/adapters/form/FormAdapter.tsx`
- 暗黑/紧凑模式下的 Form 演示（BrandShowcasePage → AdapterDemos）

## 校验清单
- [x] 所有 `parseInt('var(...)')` / `parseFloat('var(...)')` 改为安全的数值来源
- [ ] dark + compact 算法下令牌仍生效，无 `.ant-*` 覆写
- [ ] FormAdapter/ItemAdapter/DialogFormAdapter/StepFormAdapter 单元验证通过
- [x] 更新相关文档/任务记录

## 记录与结论
- [2025-10-01 16:52:05] 发现 FormAdapter 主题配置中直接对 CSS 变量字符串取整导致 `NaN`，需立项修正。
- [2025-10-01 17:03:22] 完成 FormAdapter 与 TableAdapter 中所有不安全的 `parseInt('var(...)')` 替换：
  - borderRadius: 12 (对应 --radius: 12px)
  - fontSize: 16 (固定值)
  - itemMarginBottom: 24/32/16 (对应 --space-6/8/4)
  - verticalLabelPadding: '0 0 8px' (对应 --space-2)
  - paddingInline: 16 (对应 --space-4)
  - 其他间距和尺寸均已改为数值常量
- [2025-10-01 17:05:34] 令牌修复完成，准备提交 review，待主管复核后转入 done/。

## 风险与回滚
- 修改主题 token 时注意不要引入真实 DOM 覆写；若出现样式回归，可退回当前版本并在卡片备注异常情况。