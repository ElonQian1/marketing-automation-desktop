# UX/UI 重构框架方案（现代桌面应用）

作者：设计系统与前端协作规范
更新时间：2025-09-30
适用范围：Employee GUI 桌面应用（Tauri + React + AntD + 设计系统）

---

## 一、目标与原则

- 目标：打造“专业、可信、耐久”的企业级桌面体验，保证长期可维护、可扩展。
- 设计原则：
  - 一致性：视觉与交互全局统一（令牌化 + 组件化）
  - 层次清晰：背景/表面/边框/文本对比稳定，暗色优先优化
  - 稳定落地：文件<500行、模块化分拆、语义令牌优先、无硬编码颜色
  - 高可用：响应式、键盘可达、屏幕阅读器、减少动画偏好

---

## 二、视觉系统（Design System）

### 1. 颜色（已落地 in `src/styles/design-system/tokens.css`）
- 色板：primary（蓝）/ secondary（紫）/ accent（青绿）/ gray（石墨）/ success / warning / error / info（均 50–950 色阶）
- 语义令牌：组件与页面仅使用 `--color-*` 语义别名与表面/文本/边框令牌，不使用硬编码十六进制
- 暗色主题：非简单反色，基于灰阶重算 surface/border/text，保证对比度

推荐用法：
- 主按钮：`--color-primary-600`（hover: `-700`）
- 强调/互动：`--color-accent-600`（hover: `-700`）
- 成功/警告/错误：`--color-success-600` / `--color-warning-600` / `--color-error-600`
- 表面/背景/文本/边框：`--color-surface` / `--color-bg-*` / `--color-text-*` / `--color-border`

### 2. 字体与排版
- 字体族：Inter（UI） + JetBrains Mono（代码）
- 等比字号：xs–4xl（12–36px），正文默认 `--text-base`
- 行高：`--leading-normal`（在 base.css 内）

### 3. 间距与圆角
- 8pt 网格：`--space-1…20`，页面/卡片/控件均使用令牌
- 圆角：`--radius-sm..3xl`，按钮/卡片/输入默认 `--radius-md/--radius-lg`

### 4. 阴影与动效
- 阴影：`--shadow-sm..2xl`（暗色有单独 shadow 组）
- 过渡：`--transition-fast/base/slow`，统一 Hover/Focus/Active 反馈

---

## 三、信息架构与 App Shell

### 1. App Shell（应用外壳）
- 结构：Sidebar（左） + Main（Header + Content + StatusBar）
- 功能：
  - Sidebar：品牌区、导航、分组、收藏、快捷搜索、设备概览（徽标）
  - Header：页面标题、面包屑、上下文工具条（操作按钮、切换、过滤、全局搜索）
  - Content：主内容视图（表格/看板/画布/分析）
  - StatusBar（可选）：实时状态、设备数、任务进度、消息入口

代码位置建议：
```
src/components/app-shell/
  AppShell.tsx               // 外壳编排（< 200 行）
  Sidebar.tsx                // 侧边栏（< 300 行）
  HeaderBar.tsx              // 顶栏（< 250 行）
  StatusBar.tsx              // 状态栏（< 200 行）
  styles/index.css           // Shell 样式（< 250 行，复用 design-system）
```

### 2. 导航与分组
- 基于“任务流”组织（设备、导入、脚本、模板、诊断）
- 支持分组/快捷入口/最近使用/收藏
- 菜单项态：默认/悬停/选中/禁用；暗色适配完成

---

## 四、Universal UI 智能页面查找器（重点改造）

### 1. 体验问题（现状）
- 视觉层次不清、工具条与主体耦合、空态/错误态不明显
- 操作路径分散（设备选择、策略选择、预览、结果联动未统一）

### 2. 新布局与交互
- 三栏结构：
  - 左：会话/设备/历史列表（带过滤与状态）
  - 中：画布预览（截图/网格/高亮/缩放/对比），工具条悬浮
  - 右：节点详情（字段选择、匹配策略、选中值预览、快速操作）
- 统一工具条：设备选择、刷新、缩放、对比、截图、匹配策略预设（standard/absolute/strict/relaxed/positionless）
- 反馈状态：空态（指导使用）、加载骨架、错误提示（可重试）、成功高亮（计数/耗时）

### 3. 模块与文件结构
```
src/components/universal-ui/page-finder/
  PageFinderView.tsx              // 编排与路由联动（< 250 行）
  hooks/
    useFinderState.ts             // 本地 UI 状态（< 150 行）
    useKeyboardShortcuts.ts       // 快捷键（< 120 行）
  components/
    Toolbar.tsx                   // 工具条（设备/缩放/对比/策略）（< 200 行）
    DevicePicker.tsx              // 设备选择（< 150 行）
    CanvasPreview.tsx             // 中部画布（缩放/网格/标注）（< 250 行）
    ResultsList.tsx               // 匹配结果列表（< 200 行）
    EmptyState.tsx                // 空态（< 120 行）
  inspector/
    NodeDetailPanel.tsx           // 右侧详情（承载状态）（遵循现有结构）
    MatchingStrategySelector.tsx  // 已存在：策略选择
    SelectedFieldsPreview.tsx     // 已存在：字段预览
  styles/
    index.css                     // 模块样式（< 300 行，仅语义类 + 工具类）
```

- ADB 约束：所有设备/匹配调用统一通过 `useAdb()`，严禁直连底层服务
- 数据流：PageFinderView 负责装配；状态集中在右侧 Panel 与上层 Hooks；子组件纯展示

### 4. 关键交互
- Shift 多选、Ctrl+滚轮缩放、Space 平移、Alt 对比开关
- 工具条吸顶/悬浮，超大画布时局部工具条
- 选中节点 → 右侧详情联动 → 一键“标准匹配”写回步骤参数

---

## 五、组件库与样式层次

### 1. 样式分层
- tokens.css（令牌） → base.css（重置） → utilities.css（工具类） → components.css（通用组件） → layout.css（外壳与布局） → antd-theme.css（主题桥接） → 模块样式（局部）
- 规范：模块样式文件 < 300 行，命名 `modern-*` 语义类 + 工具类组合

### 2. 表格/表单/卡片/抽屉
- 表格：密度切换（舒适/紧凑）、行悬浮、批量工具条、空态
- 表单：内联校验、帮助文本、分组与分割线、错误聚焦
- 卡片：标题区/操作区分离；卡栅格统一间距；Hover 抬升阴影
- 抽屉/模态：移动端全屏、桌面端适中；底部按钮区固定

---

## 六、动效与微交互
- 过渡：`--transition-fast/base/slow` 三档统一
- 进入：淡入+轻位移（卡片、抽屉、面板）
- 反馈：按钮 Hover 微抬升、聚焦环、加载骨架、渐进加载
- 降噪：`prefers-reduced-motion` 时禁用动画，只保留焦点可达

---

## 七、无障碍（A11y）
- 对比度达标：文本/图标在表面上满足 AA 标准
- 键盘可达：焦点可见（:focus-visible）+ 轮廓环
- 屏幕阅读：aria-label/aria-live/aria-expanded 等语义
- 触摸友好：最小触达 44x44，触摸反馈（ripple/背景）

---

## 八、文档与规范落地
- 设计系统指南：`src/styles/DESIGN_SYSTEM_GUIDE.md`（已提供）
- 模块 README：每个大模块 `README.md` 说明职责、输入/输出、交互要点
- 代码规范：样式不超 500 行；拆分 hooks/components/styles；语义令牌优先

---

## 九、实施路线图（建议三周迭代）

- 第 1 周：
  - App Shell 重构（Sidebar/Header/Content/StatusBar）
  - 导航信息架构与激活态/暗色态完成
  - 统一按钮/表单/卡片基线（components.css 复用）
- 第 2 周：
  - Universal UI 页面查找器端到端改造（布局/工具条/画布/详情）
  - ADB 接口统一校验（仅 `useAdb()`）
  - 空态/错误态/骨架态
- 第 3 周：
  - 表格/抽屉/筛选器增强
  - 动效与微交互统一
  - A11y 与对比度检测、密度适配

验收标准：
- 文件行数不超阈值，模块化清晰
- 颜色/间距/动效/无障碍按照令牌统一
- 暗色主题与移动端适配通过检查
- 页面查找器可用性显著提升（操作路径 < 3 步、失败有引导）

---

## 十、下一步（可执行）
1) 新建 `src/components/app-shell`，实现 AppShell/Sidebar/HeaderBar/StatusBar（按本方案结构）
2) 创建 `src/components/universal-ui/page-finder` 模块，迁移并编排现有查找器子组件
3) 将页面查找器工具条与策略选择联动（复用 MatchingStrategySelector/SelectedFieldsPreview）
4) 表格/抽屉密度与空态统一改造（逐页替换）

如需品牌主色微调或图表主题，我可在 tokens.css 上快速迭代并全局生效。