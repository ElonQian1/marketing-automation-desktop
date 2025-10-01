任务 ID: C-20251001-182620
状态: DONE
精确时间（台北）: 2025-10-01 18:26:20 (UTC+08:00)

主题: DatePicker 适配层：统一尺寸与范围选择
背景: 日期选择在不同页面尺寸不一致，统一 size 与 allowClear；提供范围选择组件。
输入/依赖: @A tokens; @B 轻组件（无直接依赖）
产出(提交/PR): 本地变更待推送
实现明细:

- components/adapters/date-picker/DatePickerAdapter.tsx: 提供 DatePickerAdapter 与 RangeDatePickerAdapter，默认 size=middle, allowClear=true。
- 桶文件导出：components/adapters/index.ts 增加 DatePicker 相关导出。
- 示例：examples/AdapterDemos.tsx 演示基础用法。

验证清单:
- [ ] Dark/Compact 正常（待页面级联调）
- [x] 无 `.ant-*` 覆盖/无 `!important`
- [x] 与 patterns 组合无冲突

风险&回滚: 个别页面如需禁用清除，可通过 allowClear={false} 回退；国际化格式按现有全局设置。
下一步: 在筛选条/表单页统一替换接入，核对表单校验提示与密度。
