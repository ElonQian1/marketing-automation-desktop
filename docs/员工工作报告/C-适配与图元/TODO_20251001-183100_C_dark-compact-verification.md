任务 ID: C-20251001-183100
状态: INPROG
精确时间（台北）: 2025-10-01 23:18:50 (UTC+08:00)

主题: 暗黑/紧凑校验：Upload/Tree/DatePicker/Drawer/Steps
背景: 适配器已落地，需要在 Dark/Compact 下进行高度/行距/对比度验证。
输入/依赖: ThemeBridge/ConfigProvider, tokens（密度/字号/圆角）
产出(提交/PR): 待补校验记录与截图
实施清单:

- [ ] UploadAdapter：触发按钮尺寸/对比度，禁用态对比
- [ ] TreeAdapter：节点行高与 hover/selected 可见性
- [ ] DatePickerAdapter/Range：面板暗黑对比与间距
- [ ] DrawerAdapter：遮罩不透明度与内容密度
- [ ] StepsAdapter：progressDot 在暗黑对比与间距

风险&回滚: 若出现对比度不足，优先调整 tokens；不在组件内覆写 .ant-*。
验证入口: BrandShowcasePage → Theme 控制区（暗黑/紧凑开关）→ 展开 Pattern/Adapter Demos。
下一步: 逐项勾选实施清单并补充截图，完成后标记 REVIEW。
