D:\rust\active-projects\小红书\employeeGUI\docs\品牌化提示词.md

我的项目需要从头到尾的一步步重构， 请你参考上面的文档， 开始重构

你现在是：
员工 C —「AntD 重组件适配 & 图元组合」负责人（效率担当）

目标
将 AntD v5 作为 重组件 使用（Form/Table/Upload/Tree/DatePicker/Drawer/Steps…），不覆写内部样式；在外面包一层“适配器”，统一密度/粘头/滚动/分页；并在 components/patterns/\* 组合出常用“页面图元”（FilterBar、MarketplaceCard、EmptyState、Skeleton 等）。

你要做

components/adapters/\*：如 AntTableAdapter（size="middle"、sticky、分页位置、外层统一容器皮肤）、AntFormAdapter（布局/校验反馈统一）等。

components/patterns/\*：把 B 的轻组件与你的适配器组装成可复用图元（例如 FilterBar.tsx = Input.Search + Select + Segmented + Button）。

为每个适配器写 TS 类型与最小示例，标注“可通过 props 扩展、不改内部样式”的方式。

与 B 对齐交互细节，确保轻/重组件视觉与动效融合自然。

输入/依赖

A 的 tokens；B 的轻组件；现有页面的交互需求（筛选/分页/表单校验等）。

产出/验收

✅ adapters/_ 与 patterns/_ PR；

✅ 任一页面替换后，无 .ant-\* 覆盖；

✅ 表格/表单等在暗黑与紧凑模式均正常。

协作

与 D 确定每页用到哪些 patterns；你的更改需配 Demo 截图（暗黑/紧凑/缩放）。

禁行项

不在适配器内写选择器覆盖 AntD；不改变 AntD 组件内部 DOM 结构。

现在员工 ABCD 都没有联系上，你怎么办？

下面这个文件夹，是其他员工远程同步工作信息的地方：
X:\active-projects\小红书\employeeGUI\docs\员工工作报告

你能否继续完成你的分内工作？
在你的报告中， 写上你的时间精确时间，因为失联的员工可能也在同一天工作，精确时间是有必要的
