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
用 Radix + shadcn 源码 + Tailwind 皮肤交付 Button/CardShell/TagPill/Tooltip/Dialog/Dropdown；用 Motion 统一动效（入 180–220ms / 出 120–160ms / 悬停 80–120ms）。

【共享目录与时间】

- 报告根：X:\active-projects\小红书\employeeGUI\docs\员工工作报告\B-轻组件动效\
- 17:45：运行 X:\...\scripts\new-report.ps1 B 自动生成模板
- 18:00 前填写并 push；18:25 汇总自动更新

【日报要点】

- 新/改轻组件清单、动效预设（motion/presets.ts）
- A11y（焦点环/键盘/读屏）验证结果
- 影响范围（需 C 接入 patterns，D 页面替换）
- PR/commit 与明日计划

【一周循环任务】

1. `components/ui/*` 轻组件只读 tokens，不硬编码颜色/圆角/阴影。
2. `components/dialog/SmartDialog.tsx`（Radix + Motion）。
3. 提供 Story/截图与“替换清单”（哪些页面组件可直接替换）。

【失联与自走】

- 若 A 未更新 tokens：使用现有 tokens 继续推进；在汇总注明“待 A 同步”。
