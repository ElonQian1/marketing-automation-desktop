# [C] tsconfig.app.json 配置清理（去重与规范）

- 日期: 2025-10-01
- 负责人: 员工C（适配与图元）
- 结果: ✅ 完成（不影响现有 type-check 结果）

## 内容
- 对 `tsconfig.app.json` 的 `exclude` 列表做去重与规范：
  - 移除重复项：`src/application/services/contact-import/**` 重复条目
  - 移除重复项：`src/components/AntDesignDemo.tsx` 重复条目
  - 保留 JSONC 注释与语义分区，未引入新的排除路径

## 验证
- 本地执行 `npm run type-check`：结果为 0 错误（与清理前一致）。

## 影响面
- 限定于 TypeScript 工程配置，运行时无影响。

## 备注
- 若后续需要缩小排除范围，请以模块维度梳理后逐步收敛，确保不会误纳入仍未迁移完毕的旧模块。