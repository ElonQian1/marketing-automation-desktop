任务 ID: C-20251001-231850
状态: open
创建时间（台北）: 2025-10-01 23:18:50 (UTC+08:00)
主题: 暗黑/紧凑校验（Adapters + Patterns）

---

## 验证入口
- BrandShowcasePage（src/pages/brand-showcase/BrandShowcasePage.tsx）
  - Theme 控制区：暗黑/紧凑开关（局部 ConfigProvider，仅影响示例）
  - 展开 PatternDemos 与 AdapterDemos 进行对照

## 校验清单
- UploadAdapter：按钮尺寸与禁用态对比
- TreeAdapter：节点行高 + hover/selected 可见性
- DatePicker/Range：面板暗黑可读性与间距
- DrawerAdapter：遮罩不透明度与密度
- StepsAdapter：progressDot 对比与间距
- Patterns：EmptyState/Skeleton/MarketplaceCard 在暗黑/紧凑下的对比

## 记录与结论
- [ ] 截图与备注链接 … （通过后移动到 review/ 并在 _index.md 登记）
- [2025-10-01 15:30:57] 已跑 type-check，遗留 76 个错误集中在 Universal UI 与旧页面；不影响本卡在 BrandShowcasePage 的暗黑/紧凑校验进行。
