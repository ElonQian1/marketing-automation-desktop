docs\品牌化提示词.md

我的项目需要从头到尾的一步步重构， 请你参考上面的文档， 开始重构

你现在是：

员工 d—

现在员工 ABCD 都没有联系上，你怎么办？

下面这个文件夹，是其他员工远程同步工作信息的地方：
D:\rust\active-projects\小红书\employeeGUI\docs\员工工作报告
你能否继续完成你的分内工作？
在你的报告中， 写上你的时间精确时间，因为失联的员工可能也在同一天工作，精确时间是有必要的

## 【任务描述】

【目标】
以“单任务单文件”方式推进页面装配与质量闸门（覆盖扫描、A11y/动效/性能回归、E2E）。同时维护团队级《汇总.md》或《看板.md》，让所有最新卡片都有入口。

【目录结构】
docs\员工工作报告\D-页面与质检\
 open\ review\ blocked\ done\YYYY-MM\
 \_index.md
docs\员工工作报告\汇总.md # 团队总入口（最新任务链接放这里）

【命名】
task-D-<slug>-<YYYYMMDD-HHmmss>.md
示例：task-D-templates-page-integration-20251001-143155.md

## 【任务卡模板】

任务 ID: D-<YYYYMMDD-HHmmss>
状态: open | review | blocked | done
创建时间（台北）: YYYY-MM-DD HH:mm:ss (UTC+08:00)
主题: Templates 页集成 patterns 与轻组件

---

## 集成明细

- pages/Templates.tsx：仅编排，移除视觉硬编码；重组件经 adapters/\*
- 覆盖扫描：.ant-\* / !important 结果
- E2E：场景与结果；Dark/Compact/DPI 回归
- 性能：首屏 CSS/包体

## 更新记录

- [YYYY-MM-DD HH:mm:ss] 完成列表区替换；扫描=0；E2E 2/2 通过
- [YYYY-MM-DD HH:mm:ss] 修复 DPI 125% 下的折行
  （持续更新，不另开文件）

## 验证清单

- [ ] 扫描=0（.ant-\* / !important）
- [ ] A11y / 动效统一 / 性能预算达标
- [ ] 汇总.md 已收录链接

【动作规则】

- 每有新卡或状态变化，就把该卡链接**追加到** docs\员工工作报告\汇总.md 顶部“最新动态”区；done 后移动到 done\YYYY-MM\ 并更新 \_index.md。
- 必要时为他人创建“占位卡”（状态 open）标明依赖与影响，便于协作。

【硬性约束】

- 页面层禁止直连 AntD 重组件（必须经 adapters/_）；不写 `.ant-_` 覆盖；单文件 ≤ 500 行。
