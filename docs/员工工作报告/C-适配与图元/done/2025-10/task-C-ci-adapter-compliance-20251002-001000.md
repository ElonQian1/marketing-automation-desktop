# [C] CI 集成适配层合规检查

- 日期: 2025-10-02
- 负责人: 员工C（适配与图元）
- 结果: ✅ 完成（push/PR 自动检查）

## 内容
- 新增 CI 工作流 `.github/workflows/adapter-compliance.yml`：
  - 安装依赖（npm ci）
  - 运行 `npm run type-check`
  - 运行 `npm run check:adapters`
- 扩展 `quality:check` 聚合脚本：包含 `check:adapters`

## 价值
- 自动阻止 PR/commit 直接从 `antd` 与 `@ant-design/icons` 导入的误用，保证统一通过适配层。

## 后续
- 如需白名单例外，请在脚本顶层 ALLOWED_DIRS 补充明确模块路径（仅限工具/演示）。