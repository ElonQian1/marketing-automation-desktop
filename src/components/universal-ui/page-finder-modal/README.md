# Page Finder Modal 模块说明

本模块实现“Universal UI 智能页面查找器”的前端表现层与编排层，采用面板化与共享工具抽离，确保可扩展、可维护、低耦合。

## 目录结构

```
page-finder-modal/
├─ components/          # 具体 UI 组件（如 ElementList）
├─ filter/              # 过滤设置抽屉 FilterSettingsPanel
├─ hooks/               # usePageFinderModal 等本模块内部 Hook
├─ panels/              # 面板化容器（LeftControlPanel/MainViewContainer/SelectionPopoverContainer）
├─ types/               # 模块内类型（包含 VisualFilterConfig、ViewMode 等）
├─ utils/               # 本模块的轻量工具（列表排序入口等）
└─ index.ts             # 桶文件导出（组件、Hook、类型）
```

关联的共享工具位于：
- `shared/filters/visualFilter.ts`（通用过滤）
- `shared/filters/clickableHeuristics.ts`（可点击性推断）
- `shared/utils/sorting.ts`（排序：未知/未命名靠后 + 稳定；支持语义评分优先）

## 架构要点

- 编排层：`components/universal-ui/UniversalPageFinderModal.tsx` 负责视图切换、设备交互、快照/缓存加载、过滤配置透传。
- 面板化：
  - 左侧控制区：`panels/LeftControlPanel.tsx`（设备选择、视图切换、过滤设置按钮、分析、缓存）
  - 右侧内容区：`panels/MainViewContainer.tsx`
  - 选择弹层：`panels/SelectionPopoverContainer.tsx`
- 过滤配置单一来源：`types` 中的 `VisualFilterConfig`，通过 localStorage（key：`visualFilterConfig`）持久化。
- 过滤逻辑单点：所有视图统一通过 `shared/filters/visualFilter.ts` 应用；Tree/Grid 采用“预过滤后构树/网格”的策略，避免逻辑散落。
- 排序逻辑统一：`shared/utils/sorting.ts` 提供 `sortUnknownLastStable` 与 `sortByScoreThenUnknownLastStable`，页面列表使用 `sortByScoreThenUnknownLastStable`（语义评分优先 + 未知项靠后 + 稳定）。

## 使用与行为

- 打开过滤设置：左侧控制区点击“过滤设置”按钮 → 抽屉 `FilterSettingsPanel`。
- 规则项（仅影响前端可视化，不修改后端解析）：
  - `onlyClickable`：仅显示可点击元素
  - `treatButtonAsClickable`：将类名包含 `Button`/`TextView` 视为可点击（启发式）
  - `requireTextOrDesc`：要求存在 `text` 或 `content-desc`
  - `minWidth`/`minHeight`：最小宽/高（px）
  - `includeClasses`/`excludeClasses`：类名包含/排除（子串包含，逗号分隔）
- 适用范围：
  - Visual/Grid：直接传入 `filterConfig`；
  - List：内部使用 shared 过滤；
  - Tree：Modal 层预过滤 `UIElement[]` 后再构树。

## 无障碍与样式约束

- 浅色背景容器必须应用 `.light-theme-force`（已在 `FilterSettingsPanel` 上启用），确保浅底深字、满足对比度要求。
- 禁止硬编码颜色，使用项目 CSS 变量（详见 `docs/COLOR_CONTRAST_GUIDE.md` 与设计令牌文档）。

## DDD 与性能约束

- ADB 接口：同一页面仅在顶层（Modal）调用一次 `useAdb()`，通过 props 向下传递，避免重复初始化。
- 状态管理：设备/连接等核心状态在应用层统一维护；本模块内部只保留 UI 临时状态。
- 过滤/排序逻辑集中于 shared，禁止在子视图重复实现。

## 推荐调试步骤（避免漏掉目标元素）

1. 打开“过滤设置”，先用宽松配置：
   - 仅显示可点击：关
   - 将 Button 视为可点击：开
   - 必须有文本或描述：关
   - 最小宽/高：0/0（或 10/10）
   - includeClasses：留空或 `Button,TextView`
   - excludeClasses：按需添加 `ImageView,RecyclerView`
2. 在 Visual/List 确认元素存在，再切到 Tree/Grid；确认来自同一页面快照后逐步收紧规则。
3. 如需回退默认，点击“重置规则”。

## 后续演进建议

- 将其它列表/视图的排序统一至 `sortByScoreThenUnknownLastStable`（如仍有遗留自写排序）。
- 给 `shared/filters/visualFilter.ts` 与 `shared/utils/sorting.ts` 补最小单测（2-3 个 happy/edge 用例）。
- 进一步抽离视图分发为轻量组件，控制 `UniversalPageFinderModal.tsx` 文件行数在建议阈值内。
