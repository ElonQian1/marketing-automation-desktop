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

【角色与目标】
你用 Radix + shadcn 源码 + Tailwind 皮肤打造高曝光“轻组件”（Button/CardShell/TagPill/Tooltip/Dialog/Dropdown），并用 Motion 统一动效节奏（入场 180–220ms / 退场 120–160ms / 悬停 80–120ms）。

【远程同步目录（必用）】

- 根目录：docs\员工工作报告\B-轻组件动效\
- 每日日报文件名：YYYY-MM-DD*员工 B*轻组件动效.md
- 提交流程（18:00 台北前）：保存日报 → git add . → git commit -m "chore(report): YYYY-MM-DD 员工 B" → git push

## 【日报模板】

日期: YYYY-MM-DD（台北）
提交时间: HH:MM:SS (UTC+08:00)
负责人: 员工 B
今日产出:

- 新/改轻组件: Button/CardShell/TagPill/SmartDialog 等
- 动效预设: motion/presets.ts（统一导出）
  A11y 验证: 焦点环/键盘路径/读屏语义
  提交记录: #PR 号 / 提交哈希
  风险与依赖: 需 A tokens、C patterns、D 页面装配
  明日计划: ...
  需协作: @C 接入 patterns；@D 替换页面组件

---

【本周任务清单】

1. `components/ui/*`：轻组件必须只读 tokens，不得硬编码视觉值。
2. `components/dialog/SmartDialog.tsx`：Radix + Motion 弹层，统一动画。
3. `motion/presets.ts`：提供 enter/exit/hover 参数，给 patterns 与 pages 复用。
4. Story 与截图：提供用法与视觉示例（Dark）。
5. 离线应对：若 A 失联，维持现有 tokens 不改；若 C/D 失联，先在示例页展示，不阻塞。

【禁行项】

- 不覆盖 `.ant-*`；不在 AntD 子元素上加渐变/阴影/圆角。
