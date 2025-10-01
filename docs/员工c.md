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
把 AntD v5 用作“重组件”（Form/Table/Upload/Tree/DatePicker/Drawer/Steps），外层提供“适配层”，并用 B 的轻组件组合 patterns（FilterBar/MarketplaceCard/EmptyState/Skeleton）。严禁覆写 AntD 内部样式。

【共享目录与时间】

- 报告根：X:\active-projects\小红书\employeeGUI\docs\员工工作报告\C-适配与图元\
- 17:45：运行 X:\...\scripts\new-report.ps1 C
- 18:00 前 push；18:25 汇总自动更新

【日报要点】

- 新/改适配层（如 AntTableAdapter/AntFormAdapter）
- 新/改 patterns（FilterBar/MarketplaceCard/...）
- 吸收 A 的 tokens 与接入 B 的轻组件状态
- 影响与风险（列宽/校验/密度），PR/commit、明日计划

【一周循环任务】

1. `components/adapters/*` 统一 props（size='middle'、sticky、分页位置），不改 AntD 内部结构。
2. `components/patterns/*` 用 B 的轻组件组装页面图元。
3. 为每个适配器/图元提供 TS 类型与 Demo。

【失联与自走】

- 若 A/B 未提交：沿用上次 tokens 与轻组件版本继续做适配与 patterns，占位后由 D 集成。
