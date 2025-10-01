任务 ID: C-20251001-183130
状态: REVIEW
精确时间（台北）: 2025-10-01 23:18:50 (UTC+08:00)

主题: 新建 PatternDemos.tsx 展示 Skeleton/EmptyState/MarketplaceCard
背景: 需要集中展示关键 patterns 的组合表现，便于产品/设计验收。
输入/依赖: @B 轻组件（Button/CardShell/TagPill）, tokens/ThemeBridge
产出(提交/PR): 已新增示例文件 src/examples/PatternDemos.tsx；可在任意演示页路由挂载验收
实现建议:

- 在 src/examples/ 下新增 PatternDemos.tsx，展示：
  - SkeletonCard + MarketplaceCard（metric/device/feature）
  - EmptyState 变体（noData/searchEmpty/filtered/error/offline）
- 与 HeaderBar/FilterBar 组合一页展示
- 暗黑/紧凑切换校验

挂载信息: 已在 BrandShowcasePage 中通过 React.lazy 按需加载，且在同页提供暗黑/紧凑开关（局部 ConfigProvider 包裹）。
下一步: @D 在 BrandShowcasePage 切换开关完成暗黑/紧凑校验；通过后标记 DONE，并在索引卡附上截图链接。
