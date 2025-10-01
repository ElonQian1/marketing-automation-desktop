任务 ID: C-20251001-182640
状态: DONE
精确时间（台北）: 2025-10-01 18:26:40 (UTC+08:00)

主题: Steps 适配层：紧凑展示与统一尺寸
背景: 流程步骤在中小密度下间距偏大，统一为 progressDot 以更紧凑。
输入/依赖: @A tokens
产出(提交/PR): 本地变更待推送
实现明细:

- components/adapters/steps/StepsAdapter.tsx: size 默认为 middle；当 size≠large 时默认 progressDot。
- 桶文件导出：components/adapters/index.ts 增加 StepsAdapter 导出。
- 示例：examples/AdapterDemos.tsx 演示基础流程。

验证清单:
- [ ] Dark/Compact 正常（待页面级联调）
- [x] 无 `.ant-*` 覆盖/无 `!important`
- [x] 与 patterns 组合无冲突

风险&回滚: 如需显示数字节点，可显式传 progressDot={false}；国际化文案按全局配置。
下一步: 在导入向导/表单分步页替换接入，配合 FormAdapter 校验提示。
