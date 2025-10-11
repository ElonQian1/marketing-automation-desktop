
【角色】
你是“架构护栏工程师”。目标：一次性在仓库里搭好“可读、可查、可被工具强制执行”的护栏与骨架，确保任何人类或 AI 不容易搞错文件属于哪个模块/分层。

【输入】
- 目标仓库：ElonQian1/marketing-automation-desktop（主分支 main）
- 用户既定规范：模块化目录（adb / contact-import / prospecting / script-builder）、三行文件头（路径/模块/分层/角色/摘要）、只允许从模块 index.ts 导入。
- 本次对你已提供的文件模板：`.github/PULL_REQUEST_TEMPLATE.md`、`.github/copilot-instructions.md`、`AGENTS.md`、`.eslintrc.cjs`、`.dependency-cruiser.cjs`、`scripts/check_headers.js`、`tsconfig.json` 的 paths 片段、`.husky/pre-commit`。

【你的任务】
1) 若模板文件缺失，请在仓库创建/覆盖为提供的版本；保持中文注释。
2) 安装并配置依赖（任选包管工具）：
   - pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-boundaries eslint-plugin-import dependency-cruiser husky lint-staged
3) 在 `package.json` 写入脚本：
   - "lint" / "dep:check" / "headers:check" / "prepare" 与 lint-staged 配置（参照模板）。
4) 确认 `tsconfig.json` 含有模块路径别名（@adb/@contact/@prospecting/@script/@shared）。
5) 在 `src/modules/` 下为四个模块创建最小骨架（如果不存在）：
   - `<module>/{api,application,domain,services,stores,hooks,ui}/`
   - 创建 `index.ts`（内容暂留空的导出占位）与 `README.md`（按模板写明目录职责）。
   - 每个新文件顶部写三行文件头注释（路径/模块/分层/角色/摘要，中文）。
6) 运行并粘贴检查结果：
   - `pnpm lint`、`pnpm headers:check`、`pnpm dep:check`
7) 生成《迁移建议清单.md》（放在 `docs/architecture/`），列出：当前文件清单 → 目标模块/分层路径（from→to 表），先给出联系人导入与 ADB 两个模块的高优先级清单。
8) PR 策略：
   - 若允许分支：创建 PR `chore(guardrail): 初始化护栏与模块骨架`，描述中附运行输出与变更点。
   - 若不允许分支：按“工具配置 → 模块骨架 → 文档”分三次小提交到 main，每次提交信息附带检查清单。

【验收标准】
- 以上检查命令全绿。
- 四模块目录已存在，`index.ts` 与 `README.md` 已就绪。
- PR 模板/代理说明/Copilot 守则存在且完整。
- 迁移建议清单包含 from→to 表和优先级排序（联系人导入/ADB 优先）。
