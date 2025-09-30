# Universal UI 页面查找器（骨架）

三栏布局：左树（层级/筛选）+ 中央画布（预览/缩放）+ 右详情（字段/策略）。当前为 UI 骨架，占位数据，后续接入 useAdb()。

## 结构
- PageFinderView.tsx：顶层布局
- components/
  - SidebarTree.tsx：树与搜索
  - GridCanvas.tsx：画布、缩放控件
  - NodeDetailPanel.tsx：选中节点展示与策略按钮
- hooks/
  - usePageFinderState.ts：查询、选中、缩放、应用策略（占位）
- styles/index.css：少量局部样式，主要依赖 modern.css 令牌
- index.ts：聚合导出

## 接入建议
- 数据来源统一走 `useAdb()`（应用层），组件保持展示/交互职责；不要直接访问基础设施。
- 大小限制：每文件 < 300 行，复杂逻辑拆 hook / 子组件。

## 后续计划
- 接入真实节点与截图、策略选择器与字段预览
- 响应式与无障碍完善（键盘导航、aria-*）