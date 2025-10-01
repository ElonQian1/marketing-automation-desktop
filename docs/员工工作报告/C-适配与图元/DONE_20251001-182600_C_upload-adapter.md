任务 ID: C-20251001-182600
状态: DONE
精确时间（台北）: 2025-10-01 18:26:00 (UTC+08:00)

主题: Upload 适配层：统一触发按钮与展示
背景: 需要统一上传入口的尺寸与触发交互，不覆写内部样式。
输入/依赖: @A tokens（密度/字号）; @B 轻组件（Button/CardShell）
产出(提交/PR): 本地变更待推送（聚合到同日 PR）
实现明细:

- components/adapters/upload/UploadAdapter.tsx: 提供 UploadAdapter，支持 size（作用于触发按钮），默认 showUploadList=true，支持自定义 trigger。
- 桶文件导出：components/adapters/index.ts 增加 UploadAdapter 导出。
- 示例：examples/AdapterDemos.tsx 中演示最小用例。

验证清单:
- [ ] Dark/Compact 正常（页面级联调待补）
- [x] 无 `.ant-*` 覆盖/无 `!important`
- [x] 与 patterns 组合无冲突（与 FilterBar/EmptyState 同页放置无样式冲突）

风险&回滚: UI 触发按钮尺寸与现有页面可能存在视觉偏差；可通过 props 覆盖 size 或自定义 trigger 回退。
下一步: 在需要上传入口的页面替换接入；补充受控上传示例（beforeUpload/onChange）。
