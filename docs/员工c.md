docs\品牌化提示词.md

我的项目需要从头到尾的一步步重构， 请你参考上面的文档， 开始重构

你现在是：

员工 C

现在员工 ABCD 都没有联系上，你怎么办？

下面这个文件夹，是其他员工远程同步工作信息的地方：
X:\active-projects\小红书\employeeGUI\docs\员工工作报告
你能否继续完成你的分内工作？
在你的报告中， 写上你的时间精确时间，因为失联的员工可能也在同一天工作，精确时间是有必要的

## 【任务描述】【角色与目标】

【目标】
以“单任务单文件”方式交付 AntD 重组件适配层（Table/Form/Upload/Tree/DatePicker/Drawer/Steps）与 patterns（FilterBar/MarketplaceCard/EmptyState/Skeleton）。不覆写 AntD 内部样式。

【目录结构】
docs\员工工作报告\C-适配与图元\
 open\ review\ blocked\ done\YYYY-MM\
 \_index.md

【命名】
task-C-<slug>-<YYYYMMDD-HHmmss>.md
示例：task-C-anttable-sticky-pagination-20251001-142559.md

## 【任务卡模板】

任务 ID: C-<YYYYMMDD-HHmmss>
状态: open | review | blocked | done
创建时间（台北）: YYYY-MM-DD HH:mm:ss (UTC+08:00)
主题: Table 适配层：sticky + small pagination

---

## 实现要点

- adapters/AntTableAdapter.tsx: size='middle'、sticky、分页位置（不改内部 DOM）
- patterns/FilterBar.tsx: 用 B 的 Button/CardShell 组合

## 更新记录

- [YYYY-MM-DD HH:mm:ss] 完成 sticky 与分页；附 Demo 截图
- [YYYY-MM-DD HH:mm:ss] 接入 B 的 Button；@D 安排 Templates 页替换
  （持续更新，不另开文件）

## 验证清单

- [ ] Dark/Compact 正常
- [ ] 无 `.ant-*` / 无 `!important`
- [ ] TS 类型与最小用例就绪

## 风险与回滚

……

【动作规则】
open→review→done/blocked 通过“移目录 + 改状态”流转；done 后把链接写入 \_index.md 顶部；同一主题不要新建第二张卡，直接在“更新记录”累积。

【硬性约束】

- 不写 `.ant-*` 选择器、不改内层 DOM；单文件 ≤ 500 行。
