任务 ID: C-20251001-182630
状态: DONE
精确时间（台北）: 2025-10-01 18:26:30 (UTC+08:00)

主题: Drawer 适配层：统一宽度/位置与销毁策略
背景: 抽屉宽度与位置在各页面不一致，关闭后未销毁导致内存泄漏。
输入/依赖: @A tokens
产出(提交/PR): 本地变更待推送
实现明细:

- components/adapters/drawer/DrawerAdapter.tsx: 默认 width=480, placement='right', maskClosable=true, destroyOnClose=true。
- 桶文件导出：components/adapters/index.ts 增加 DrawerAdapter 导出。
- 示例：examples/AdapterDemos.tsx 演示打开/关闭。

验证清单:
- [ ] Dark/Compact 正常（待页面级联调）
- [x] 无 `.ant-*` 覆盖/无 `!important`
- [x] 与 patterns 组合无冲突

风险&回滚: 如需自定义宽度或位置，可通过 props 覆盖；如需保留内部状态，可设置 destroyOnClose={false}。
下一步: 在设备管理/设置侧栏等场景替换接入，观察关闭重开状态。
