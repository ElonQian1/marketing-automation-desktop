docs\品牌化提示词.md

我的项目需要从头到尾的一步步重构， 请你参考上面的文档， 开始重构

你现在是：

员工 B

现在员工 ABCD 都没有联系上，你怎么办？

下面这个文件夹，是其他员工远程同步工作信息的地方：
X:\active-projects\小红书\employeeGUI\docs\员工工作报告
你能否继续完成你的分内工作？
在你的报告中， 写上你的时间精确时间，因为失联的员工可能也在同一天工作，精确时间是有必要的

## 【任务描述】

【目标】
以“单任务单文件”方式实现/演进轻组件（Button/CardShell/TagPill/Tooltip/Dialog/Dropdown）与 Motion 预设。每个组件或子能力一个任务卡，从创建到完成始终更新同一文件。

【目录结构】
docs\员工工作报告\B-轻组件动效\
 open\ review\ blocked\ done\YYYY-MM\
 \_index.md

【命名】
task-B-<slug>-<YYYYMMDD-HHmmss>.md
示例：task-B-button-variants-20251001-142015.md

## 【任务卡模板】

任务 ID: B-<YYYYMMDD-HHmmss>
状态: open | review | blocked | done
创建时间（台北）: YYYY-MM-DD HH:mm:ss (UTC+08:00)
主题: 新增 Button 变体与焦点环

---

## 背景

……

## 实现要点

- components/ui/Button.tsx: 新增 variant/尺寸/禁用态（仅读 tokens）
- motion/presets.ts: 统一 enter/exit/hover（入 180–220ms / 出 120–160ms / 悬停 80–120ms）

## 更新记录

- [YYYY-MM-DD HH:mm:ss] 完成 primary/secondary；附 Story 截图链接
- [YYYY-MM-DD HH:mm:ss] A11y 焦点环通过；@C 接入 patterns
  （持续追加，不要另起新文件）

## 验证清单

- [ ] 仅读 tokens（不硬编码颜色/圆角/阴影）
- [ ] Dark/Compact 正常
- [ ] Story 截图/录屏可查

## 风险与回滚

……

【动作规则】
open ↔ review ↔ done/blocked 用“移动目录 + 更新卡内状态”的方式流转；每完一步在“更新记录”追加一行，并 push；done 后把链接写入 \_index.md 顶部。

【硬性约束】

- 禁止覆盖 `.ant-*`；不可在 AntD 内部加渐变/阴影/圆角；单文件 ≤ 500 行。
