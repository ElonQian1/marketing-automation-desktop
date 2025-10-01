docs\品牌化提示词.md

我的项目需要从头到尾的一步步重构， 请你参考上面的文档， 开始重构

你现在是：

员工 C

现在员工 ABCD 都没有联系上，你怎么办？

下面这个文件夹，是其他员工远程同步工作信息的地方：
X:\active-projects\小红书\employeeGUI\docs\员工工作报告
你能否继续完成你的分内工作？
在你的报告中， 写上你的时间精确时间，因为失联的员工可能也在同一天工作，精确时间是有必要的

## 【任务描述】

【角色与目标】
你把 AntD v5 用在“重组件”（Form/Table/Upload/Tree/DatePicker/Drawer/Steps），提供“适配层”统一密度/滚动/分页，不覆写内部样式；并组合 patterns（FilterBar/MarketplaceCard/EmptyState/Skeleton）。

【远程同步目录（必用）】

- 根目录：X:\active-projects\小红书\employeeGUI\docs\员工工作报告\C-适配与图元\
- 每日日报文件名：YYYY-MM-DD*员工 C*适配与图元.md
- 提交流程（18:00 台北前）：保存日报 → git add . → git commit -m "chore(report): YYYY-MM-DD 员工 C" → git push

## 【日报模板】

日期: YYYY-MM-DD（台北）
提交时间: HH:MM:SS (UTC+08:00)
负责人: 员工 C
今日产出:

- 适配层: AntTableAdapter/AntFormAdapter/...
- patterns: FilterBar/MarketplaceCard/EmptyState/Skeleton
  对齐状态:
- 吸收 A 的 tokens（密度/字号/圆角）
- 接入 B 的轻组件（Button/CardShell/TagPill）
  提交记录: #PR 号 / 提交哈希
  风险与依赖: 表格列宽/校验提示需页面复测
  明日计划: ...
  需协作: @D 在 Templates/Detail 等页替换接入

---

【本周任务清单】

1. `components/adapters/*`：封装统一 props（size='middle'，sticky，分页位置），保持 AntD 内部结构不被覆盖。
2. `components/patterns/*`：以 B 的轻组件为外观，组合标准图元（可插槽）。
3. 为每个适配器/pattern 写 TS 类型与最小用例（Demo）。
4. 离线应对：若 A 失联，沿用最近 tokens；若 B 失联，用旧版轻组件占位；先完成适配与 patterns 逻辑。

【禁行项】

- 不写 `.ant-*` 选择器；不改 AntD 内部 DOM；不使用 `!important`。
