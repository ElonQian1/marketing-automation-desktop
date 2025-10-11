```md
<!-- AGENTS.md -->
<!-- 简明分工，三位代理协同的“作战手册” -->

# 代理分工

## A ｜架构护栏工程师（Guardrail Architect）

- 目标：一次性搭建项目护栏与基础结构（PR 模板、ESLint、依赖巡航、Husky、headers 检查脚本、TS 路径别名、模块骨架）。
- 交付物：`.github/` 配置、`scripts/check_headers.js`、`.eslintrc.cjs`、`.dependency-cruiser.cjs`、`tsconfig.json` paths、四大模块 `index.ts` 与 README 模板。
- 验收：跑通 `pnpm lint && pnpm headers:check && pnpm dep:check`，生成一份《迁移建议清单》。

## B ｜模块迁移执行官（Module Migrator）

- 目标：把现有文件迁入 `src/modules/<m>/...`，补齐三行文件头、修正 import、完善各模块 `index.ts` 导出。
- 交付物：from→to 迁移表、若干小 PR（每 PR 聚焦单一模块）。
- 验收：CI 全绿；依赖巡航无“跨模块直捣内部”；功能回归不变（不改业务语义）。

## C ｜文档与评审官（Docs & Reviewer）

- 目标：补齐文档、图谱与自动化校验；严格执行 PR 模板与清单。
- 交付物：`docs/architecture/overview.md`、各模块 `README.md`、依赖关系图（depcruise 导出）、PR 评审意见。
- 验收：新同事 30 分钟内可理解架构并能按规范提交一个小改动。
```
