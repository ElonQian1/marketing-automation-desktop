# 员工X｜任务提示词（低约束，支持碎片化）

> **新员工使用指南**：复制此文件为 `员工c.md`/`员工d.md`，只需修改"你的角色"和"本轮目标"部分

## 你的角色（👈 修改这段）
**示例角色类型**：
- 结构整形工程师：前缀化计划、门牌导出、别名检查、文件头普及
- 执行收尾工程师：批量重命名、修 import、补门牌、跑编译
- 契约与门牌工程师：把对外契约放 `domain/public/**` 并由门牌导出；回收内部直连
- 导入与文件头工程师：把跨模块 import 换成别名 + 门牌；补齐三行文件头
- 用例封装工程师：application层用例整理和封装
- 文档同步工程师：保持文档与代码同步
- 测试补坑工程师：补充缺失的测试用例

**你的具体角色**：[在这里描述你负责的具体工作内容]

## 唯一硬底线（所有员工共同遵守）
- **domain 不得依赖 UI/IO**：不要在 `domain/*` 中 `import` 到 `ui/services/api/hooks/pages`

## 本轮目标（👈 修改这段，列出3-5条具体目标）
1) 对 `<模块>` 的 `<目录>` 做命名前缀：`<module-prefix>-strategy-*.ts` / `<TypePrefix>*`
2) 修复 import：跨模块统一从 `@<module>` 门牌导入
3) 补 `<模块>` 的 index.ts：仅导出 domain/public 契约、application 用例、公开 hooks
4) 补三行文件头
5) [根据角色添加其他具体目标]

## 输入资源
- 参考：`prefix-migration-plan.md`（前缀化计划表）
- 参考：`tsconfig.json` paths（@prospecting/@script/@contact/@adb/@shared）
- 参考：`架构快速参考.md`（日常开发速查）
- 参考：现有模块的 index.ts 结构

## 输出要求（每次提交至少满足一个）
- 前缀化 + 修导入 一小批完成（含类型名前缀）
- 某模块 index.ts 完善
- 改动文件补齐三行文件头
- 项目可编译并通过最小烟测
- 在 `prefix-migration-plan.md` 勾选完成项
- 在 `stream_shared.md` 追加一行记录

## 执行步骤（碎片化友好）
1) 从 `prefix-migration-plan.md` 取 3–10 个文件开始
2) 重命名（文件名+类型名）→ 修导入（优先门牌 + 别名）
3) 缺导出的契约放 `domain/public/**` 并在 index.ts 导出
4) 补三行文件头格式：
   ```
   // src/path/to/file.ts
   // module: <module-name> | layer: <domain/application/infrastructure> | role: <role>
   // summary: <简要说明>
   ```
5) 运行检查：`npm run type-check && npm run build`
6) 新增/修改处做一次最小路径烟测
7) 提交并在 `stream_shared.md` 记一行

## 验收清单（每次提交自检）
- [ ] 文件名与类型名已加模块前缀（Prospecting*/Script*/Contact*/Adb*）
- [ ] 跨模块导入优先使用 `@<module>` 门牌（内部导入处标记 TODO）
- [ ] index.ts 仅导出 contracts/usecase/hooks（未泄露内部实现）
- [ ] 三行文件头齐全且路径正确
- [ ] 可编译可运行（npm run type-check通过）
- [ ] 记录到 `stream_shared.md`
- [ ] 在 `prefix-migration-plan.md` 更新进度

## 常见问题
**Q: 不确定某个文件应该放在哪个模块？**
A: 查看 `架构快速参考.md` 的分层表格，或在 `stream_shared.md` 记录疑问

**Q: 遇到复杂的类型定义冲突？**  
A: 先让代码能跑，在文件中标记 `// TODO: resolve type conflict`，继续其他工作

**Q: 某个模块的 index.ts 应该导出什么？**
A: 原则：仅导出对外契约，不导出内部实现。参考其他模块的 index.ts

---
**记住**：小步快跑，随时提交。遇到问题先记录，再解决。保持工作的连续性比完美更重要。