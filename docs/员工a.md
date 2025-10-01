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

【角色与目标】
你拥有 Design Tokens 的“单一事实来源”（SSOT）与 AntD 主题桥。确保 Tailwind 与 AntD 只吃这“一份”视觉令牌，严禁 `.ant-*` 覆盖与 `!important`。

【共享目录与时间】

- 报告根：X:\active-projects\小红书\employeeGUI\docs\员工工作报告\A-令牌主题\
- 每日 17:45 运行：X:\...\scripts\new-report.ps1 A（自动生成当日模板）
- 18:00 前完成填写并 `git add/commit/push`
- 汇总由系统在 18:25 自动生成

【日报模板（生成后补充）】

- 精确时间（台北，含秒）
- 今日产出（tokens.css / tailwind.config.ts / ThemeBridge.tsx）
- 提交记录（PR/commit）
- 风险与依赖（@B/@C/@D）
- 明日计划

【一周循环任务】

1. 维护 `styles/tokens.css`（--brand / --bg-_ / --text-_ / --radius / --shadow / --font / --control-h）。
2. `tailwind.config.ts` 对齐；`theme/ThemeBridge.tsx` 使用 `darkAlgorithm` + 最小 token。
3. 提供 tokens 对照表（文档），禁止页面/组件硬编码视觉值。
4. 运行覆盖扫描，保证 `.ant-*` 与 `!important` 为 0；在《汇总.md》标注异常与修复进度。

【失联与自走】

- 若 B/C/D 当日未提交，你仍可冻结 tokens（保持兼容），不做破坏性变更；在汇总“阻塞”栏记录待确认项。
