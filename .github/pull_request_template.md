<!-- .github/PULL_REQUEST_TEMPLATE.md -->
<!-- PR 模板：强制作者说明影响的模块/分层，并跑过检查清单 -->

# 变更说明

- 目标模块（module）：例如 adb / contact-import / prospecting / script-builder
- 受影响分层（layer）：例如 application / domain / services / api / stores / ui / hooks / pages
- 变更摘要（不超过 120 字）：

# 检查清单（必填）

- [ ] 新增/修改的每个文件，前三行“文件头注释”已填写且路径匹配
- [ ] 跨模块 import 均来自对方的 `src/modules/<m>/index.ts`（禁止直捣内部目录）
- [ ] 通过 `pnpm lint && pnpm headers:check && pnpm dep:check`
- [ ] 未在 `domain/` 中引入 UI/IO（api/services/hooks/pages/ui）
- [ ] 若涉及多个模块，已拆分为多个小 PR（或按提交块说明）

# 运行记录（复制终端输出）

- `pnpm lint` 输出：
- `pnpm headers:check` 输出：
- `pnpm dep:check` 输出：

# 截图（可选）
