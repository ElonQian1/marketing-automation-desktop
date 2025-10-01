D:\rust\active-projects\小红书\employeeGUI\docs\品牌化提示词.md

我的项目需要从头到尾的一步步重构， 请你参考上面的文档， 开始重构

你现在是：

员工 A —「Design Tokens & 主题桥」负责人（SSOT 拥有者）

现在员工 ABCD 都没有联系上，你怎么办？

下面这个文件夹，是其他员工远程同步工作信息的地方：
D:\rust\active-projects\小红书\employeeGUI\docs\员工工作报告
你能否继续完成你的分内工作？
在你的报告中， 写上你的时间精确时间，因为失联的员工可能也在同一天工作，精确时间是有必要的

## 【工作内容】

【目标】
以“单任务单文件”方式管理 tokens 与主题桥。一个任务从创建到完成，始终更新同一个 MD；状态写在卡内；完成后移动到 done/YYYY-MM/，并在 \_index.md 追加链接。

【目录结构（你的专用区）】
docs\员工工作报告\A-令牌主题\
 open\ # 进行中（默认放这里）
review\ # 待评审
blocked\ # 阻塞
done\YYYY-MM\ # 每月归档（例如 done\2025-10\）
\_index.md # 你的任务清单（最新在最上）

【任务卡文件命名（不再到处建新卡）】
task-A-<slug>-<YYYYMMDD-HHmmss>.md
示例：task-A-tokens-architecture-audit-20251001-143027.md
（说明：slug=简短英文主题；时间=台北时区的精确到秒，用于去重）

## 【任务卡模板（创建一次，后续反复更新“更新记录”段）】

任务 ID: A-<YYYYMMDD-HHmmss>
状态: open | review | blocked | done
创建时间（台北）: YYYY-MM-DD HH:mm:ss (UTC+08:00)
主题: <例如> 同步圆角与控件高度到 ThemeBridge

---

## 背景

为什么做；关联需求/问题编号。

## 变更范围

- styles/tokens.css（列出新增/修改的变量键名与示例值）
- tailwind.config.ts（对齐项）
- theme/ThemeBridge.tsx（darkAlgorithm + token）

## 更新记录

- [YYYY-MM-DD HH:mm:ss] 完成变量梳理，准备 PR #xxx
- [YYYY-MM-DD HH:mm:ss] 修正 text-2 对比度
  （每推进一次，就在这里追加一行；**不要新建新文件**）

## 验证清单

- [ ] 暗黑/紧凑 OK
- [ ] 无 `.ant-*` / 无 `!important`
- [ ] 关键页面 smoke pass

## 风险与回滚

……

## 下一步

下一张卡的标题或依赖 @B/@C/@D

【动作规则】

1. 新任务 → 在 open\ 下创建一张卡（用上面模板）；
2. 要评审 → 把“状态”改为 review，并把文件移到 review\；
3. 完成 → 将“状态”改为 done，文件移到 done\YYYY-MM\，并把链接追加到 \_index.md 顶部；
4. 阻塞 → 状态=blocked，移入 blocked\，在卡内写清卡点与 owner。

【硬性约束】

- 单文件 ≤ 500 行；视觉值仅在 tokens；禁用 `.ant-*` 与 `!important`。
