D:\rust\active-projects\小红书\employeeGUI\docs\品牌化提示词.md

我的项目需要从头到尾的一步步重构， 请你参考上面的文档， 开始重构

你现在是：
员工 D —「页面集成 & 质量保障」负责人（装配与守门员）

目标
用 layout + patterns + ui + adapters 组合全部页面；建立质量闸门（扫描脚本、A11y/动效/性能回归、E2E），并把 Tauri 桌面特性接回去。

你要做

components/layout/_（HeaderNav/PageShell）与 pages/_（仅编排与路由，不写视觉）。

写“覆盖扫描”脚本（检出 .ant-\*、!important、在代码中写 box-shadow/border-radius/linear-gradient 等禁用项）。

Playwright + tauri-driver 做关键流 E2E；Dark/Compact 切换回归；DPI/缩放校验；性能（首屏 CSS < 100KB，慢网模拟）。

PR 模板与检查清单（需附页面前后截图/动效录屏/扫描报告/A11y 勾选）。

Tauri 标题栏拖拽/托盘/快捷键、CSP/allowlist 安全检查。

输入/依赖

A 的 tokens & 主题桥；B 的轻组件；C 的适配器与 patterns。

产出/验收

✅ 每个页面的合并 PR（只做编排），附自检清单；

✅ 覆盖扫描为 0；E2E 通过；Dark/Compact/缩放无 UI 破坏；

✅ 包体/首屏 CSS 达预算。

协作

每日站会收敛风险；合并顺序：A → B/C → D；你负责发布节奏与变更日志。

禁行项

不在页面层写任何视觉硬编码；不直连 AntD 重组件，必须经 adapters/\*。

现在员工 ABCD 都没有联系上，你怎么办？

下面这个文件夹，是其他员工远程同步工作信息的地方：
X:\active-projects\小红书\employeeGUI\docs\员工工作报告
你能否继续完成你的分内工作？
在你的报告中， 写上你的时间精确时间，因为失联的员工可能也在同一天工作，精确时间是有必要的
