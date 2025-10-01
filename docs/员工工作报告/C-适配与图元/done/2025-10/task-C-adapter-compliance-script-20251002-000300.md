# [C] 适配层合规检查脚本

- 日期: 2025-10-02
- 负责人: 员工C（适配与图元）
- 结果: ✅ 完成（提供 npm run check:adapters）

## 目的
防止页面/模块直接从 `antd` 与 `@ant-design/icons` 导入，确保统一通过 `components/adapters` 与 UI 层，符合 DDD 表现层约束与品牌化输出。

## 实现
- 新增 `scripts/check-adapter-usage.js`：
  - 递归扫描 `src/**/*.{ts,tsx}`
  - 排除 `components/adapters`、`components/ui`、`theme`、`infrastructure` 等允许直连目录
  - 命中 `import ... from 'antd'` 或 `import ... from '@ant-design/icons'` 即报违规，列出文件与行号并以非零码退出
- 在 `package.json` 增加脚本：
  - `npm run check:adapters`

## 使用
- 本地或 CI 中执行：
  - `npm run check:adapters`

## 影响面
- 纯静态检查，对运行时无影响。

## 后续
- 可在 CI 合规门禁中加入（与 `quality:gate` 同步）。