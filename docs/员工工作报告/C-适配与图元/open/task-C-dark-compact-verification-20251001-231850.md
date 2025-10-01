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
- [2025-10-01 15:38:24] 复核 BrandShowcasePage（用户手动更新后）仍保留主题开关与 Adapter/Pattern Demos，可继续执行暗黑/紧凑截图验证。
- [2025-10-01 15:40:26] 静态检查确认 AdapterDemos/PatternDemos 通过 ConfigProvider 暗黑+紧凑算法组合渲染；需人工运行 `npm run tauri dev` 或 `npm run dev` 打开 BrandShowcasePage，按步骤收集暗黑+紧凑截图后即可转 Review。
- [2025-10-01 15:41:33] 将入口页面 `src/pages/BrandShowcasePage.tsx` 恢复为对 `brand-showcase/BrandShowcasePage` 的聚合导出，确保暗黑/紧凑开关与 Demos 统一来源，避免手动实现偏离适配层验收路径。
- [2025-10-01 15:45:04] 复核 canonical `BrandShowcasePage` 仍包含暗黑 (`enableDark`) 与紧凑 (`enableCompact`) 切换逻辑、Pattern/Adapter demos 懒加载入口未变，可直接按照既定 checklist 进行运行态验证及截图。
- [2025-10-01 15:45:25] 下一步：运行 `npm run dev`（前端）或 `npm run tauri dev` 后手动切换暗黑/紧凑并拍摄对比截图，完成后更新“截图与备注链接”并移动至 review/。
- [2025-10-01 15:47:26] 预定下一轮工作时段执行截图，需准备：1) 启动 dev 模式；2) 捕获 Adapter/Pattern Demos 在亮/暗、紧凑/默认的截图各 1 张；3) 将截图路径与备注补入本卡再提交 review。
- [2025-10-01 15:53:55] 二次确认入口页仍指向 canonical 版本；index 清单与待办卡一致，后续执行截图时补全“截图与备注链接”后即可流转至 review。
