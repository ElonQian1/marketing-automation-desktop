任务 ID: C-20251001-182610
状态: DONE
精确时间（台北）: 2025-10-01 18:26:10 (UTC+08:00)

主题: Tree 适配层：虚拟滚动与统一默认
背景: 长树渲染卡顿，需要在固定高度下启用 virtual；统一默认 size。
输入/依赖: @A tokens; @B 轻组件（无直接依赖）
产出(提交/PR): 本地变更待推送
实现明细:

- components/adapters/tree/TreeAdapter.tsx: 增加 TreeAdapter，支持 height；当传入 height 时默认 virtual=true。
- 桶文件导出：components/adapters/index.ts 增加 TreeAdapter 导出。
- 示例：examples/AdapterDemos.tsx 演示虚拟滚动。

验证清单:
- [ ] Dark/Compact 正常（待页面级联调）
- [x] 无 `.ant-*` 覆盖/无 `!important`
- [x] 与 patterns 组合无冲突

风险&回滚: 个别页面如依赖非虚拟滚动行为，可通过显式 virtual={false} 覆盖回退。
下一步: 在统一视图/树视图页面替换接入，评估超大数据集性能。
