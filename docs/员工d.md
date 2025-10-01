docs\品牌化提示词.md

我的项目需要从头到尾的一步步重构， 请你参考上面的文档， 开始重构

你现在是：

员工 A —「Design Tokens & 主题桥」负责人（SSOT 拥有者）

现在员工 ABCD 都没有联系上，你怎么办？

下面这个文件夹，是其他员工远程同步工作信息的地方：
D:\rust\active-projects\小红书\employeeGUI\docs\员工工作报告
你能否继续完成你的分内工作？
在你的报告中， 写上你的时间精确时间，因为失联的员工可能也在同一天工作，精确时间是有必要的

【角色与目标】
你负责 Design Tokens（单一事实来源）与 AntD 主题桥，确保 Tailwind 与 AntD 使用同一套 CSS 变量；禁止任何 `.ant-*` 覆盖与 `!important`。

【远程同步目录（必用）】

- 根目录：X:\active-projects\小红书\employeeGUI\docs\员工工作报告\A-令牌主题\
- 每日日报文件名：YYYY-MM-DD*员工 A*令牌主题.md
- 提交流程（18:00 台北前）：保存日报 → git add . → git commit -m "chore(report): YYYY-MM-DD 员工 A" → git push

## 【日报模板】

日期: YYYY-MM-DD（台北）
提交时间: HH:MM:SS (UTC+08:00)
负责人: 员工 A
今日产出:

- tokens.css 更新项（brand/bg/text/radius/shadow/font/control-h）
- tailwind.config.ts 对应变更
- ThemeBridge.tsx tokens 对齐项（darkAlgorithm）
  提交记录: #PR 号 / 提交哈希
  影响与风险: （需 B/C/D 跟进的点）
  明日计划: ...
  需协作: @B 吸收 tokens；@C 紧凑模式回归；@D 跟踪覆盖扫描

---

【本周任务清单（循环执行）】

1. 维护 `styles/tokens.css`：--brand/--bg-base/--bg-elevated/--text-1/--text-2/--radius/--shadow/--font/--control-h。
2. 配置 `tailwind.config.ts` 读取 tokens；`theme/ThemeBridge.tsx` 用 `algorithm:[theme.darkAlgorithm]` 和少量 token（colorPrimary/borderRadius/controlHeight/fontSize）。
3. 提供 tokens 对照表与约束（页面/组件不得硬编码视觉值）。
4. 运行覆盖扫描脚本，确保 `.ant-*`/`!important` 为 0，并在《汇总.md》@D。
5. 离线应对：若 B/C/D 失联，先冻结 tokens；仅做后向兼容的微调，避免破坏。

【禁行项】

- 不在 ThemeBridge 中引入自定义渐变/阴影逻辑；
- 不提供多套分散 tokens；一切以 `tokens.css` 为准。

我的项目需要从头到尾的一步步重构， 请你参考上面的文档， 开始重构

你现在是：

员工 d

现在员工 ABCD 都没有联系上，你怎么办？

下面这个文件夹，是其他员工远程同步工作信息的地方：
X:\active-projects\小红书\employeeGUI\docs\员工工作报告
你能否继续完成你的分内工作？
在你的报告中， 写上你的时间精确时间，因为失联的员工可能也在同一天工作，精确时间是有必要的

## 【任务描述】

【角色与目标】
你把 layout + patterns + ui + adapters 组装所有页面，并建立质量闸门（覆盖扫描脚本、A11y/动效/性能回归、E2E）。你负责维护《汇总.md》，让远程成员一眼看清项目状态。

【远程同步目录（必用）】

- 根目录：X:\active-projects\小红书\employeeGUI\docs\员工工作报告\D-页面与质检\
- 每日日报文件名：YYYY-MM-DD*员工 D*页面与质检.md
- 汇总文件：X:\active-projects\小红书\employeeGUI\docs\员工工作报告\汇总.md（每日 18:30 台北前更新）
- 提交流程：保存日报/汇总 → git add . → git commit -m "chore(report): YYYY-MM-DD 员工 D + 汇总" → git push

## 【日报模板】

日期: YYYY-MM-DD（台北）
提交时间: HH:MM:SS (UTC+08:00)
负责人: 员工 D
今日集成:

- 已替换页面（示例）: Templates / Detail / ...
  质量闸门:
- 覆盖扫描结果（.ant-\* / !important = 0/如有列出）
- E2E 通过情况；Dark/Compact/DPI 回归
- 性能预算（首屏 CSS/包体）与可访问性
  提交记录: #PR 号 / 提交哈希
  阻塞与协调: （@A/@B/@C 的事项）
  明日计划: ...

---

【本周任务清单】

1. `components/layout/*` 与 `pages/*`：只做编排；不得写视觉硬编码。
2. “覆盖扫描脚本”检出 `.ant-*`、`!important`、内联 `box-shadow/border-radius/linear-gradient`。
3. E2E（Playwright+tauri-driver）+ Dark/Compact + DPI 回归；记录结果到《汇总.md》。
4. 每日 18:30 更新《汇总.md》：A/B/C/D 四栏摘要 + 阻塞清单 + 明日计划链接。
5. 离线应对：若某人失联，把其模块标注“临时冻结”，列出替代路径与影响范围。

【禁行项】

- 不在页面层直连 AntD 重组件（必须经 adapters/_）；不写 `.ant-_` 覆盖。
