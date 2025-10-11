
# 员工B｜模块前缀化与导入修复执行（低约束，支持碎片化）

> 交流与记录请仅使用此文件夹：
> `docs/DDD架构清晰问题/`
> **随时提交**；每次提交后在该文件夹追加一行到 `stream_b.md`（没有就新建），格式：
> `[时间] 做了什么 → 下一步`

## 你的角色

“实施与收尾工程师”。在**不增加限制**的前提下，按“**模块优先 + 模块内分层**”推进**四件套**的落地执行：
**命名前缀 + 门牌导出 + 别名导入 + 文件头**。重点是**把容易重名的子目录**（如 `strategies / services / utils / validators / adapters / pipelines / mappers / repositories`）前缀化，修好导入路径，确保项目可编译与可运行。

## 唯一硬底线（仅此一条）

* **domain 不得依赖 UI/IO**：不要在 `domain/*` 中 `import` 到 `ui / services / api / hooks / pages`。其余跨模块行为不作限制。

---

## 本轮目标（一次说清）

1. 对上述**易重名目录**中的文件/类型进行**前缀化命名**：

   * `prospecting` → `prospecting-*/Prospecting*`
   * `script-builder` → `script-*/Script*`
   * `contact-import` → `contact-*/Contact*`
   * `adb` → `adb-*/Adb*`
2. 修复前缀化带来的**导入路径**：跨模块优先改为**别名 + 门牌**（`@prospecting`、`@script`… 命中各模块 `index.ts`）。
3. **完善门牌 `index.ts`**：只导出对外契约（`domain/public/**`）、用例（`application/**`）、公开 hooks；**不导出**内部实现（如 `domain/strategies/*`）。
4. 补齐**三行文件头**（缺了就加），保持可编译、可运行。

---

## 输入

* 代码仓库：`ElonQian1/marketing-automation-desktop`（分支 `main`）
* 参考文档：

  * `docs/architecture/prefix-migration-plan.md`（如缺则你先创建空表并逐步填充）
  * `tsconfig.json` 的路径别名（`@prospecting/*`、`@script/*`、`@contact/*`、`@adb/*`、`@shared/*`）

---

## 输出（每轮提交至少满足其一）

* 一小批文件完成**前缀化重命名**（含类型名同步前缀化）并**修好导入**；
* 某模块的 `index.ts` 已**只导出**契约/用例/公开 hooks；
* 改动文件均补上**三行文件头**；
* **可编译可运行**（基础页面/流程烟雾测试通过）；
* 在 `prefix-migration-plan.md` 勾掉已完成条目，并在 `stream_b.md` 记录一行。

---

## 执行步骤（碎片化也能推进）

### 步骤 1｜拿计划（没有就自建）

* 若存在 `docs/architecture/prefix-migration-plan.md`：从上到下按表执行。
* 若不存在：先创建该文件，优先扫描并填入两块：

  * `src/modules/prospecting/domain/strategies/**`
  * `src/modules/script-builder/domain/strategies/**`
    表头示例：
    `| 模块 | 子目录 | from(现名) | to(前缀化后) | 类型名改为 | 备注 |`

### 步骤 2｜前缀化重命名（小批量，随做随提）

* 只改**文件名**与**公开导出类型名**，不动业务逻辑。
* 模板：

  * `weighted.ts` → `prospecting-strategy-weighted.ts`；`StrategyWeighted` → `ProspectingStrategyWeighted`
  * `standard.ts` → `script-strategy-standard.ts`；`StrategyStandard` → `ScriptStrategyStandard`
* 遇到**同名冲突**：在目标名后追加更具体语义，如 `-rule-based`、`-pipeline`。

### 步骤 3｜修导入（优先门牌 + 别名）

* 跨模块导入改为：

  ```ts
  import { BuildLeadScoreUseCase } from '@prospecting'; // 命中 src/modules/prospecting/index.ts
  import { ScriptStrategy } from '@script';
  ```
* 如果门牌尚未导出所需契约：

  * 先在该模块 `domain/public/**` 放契约/预设；
  * 在 `index.ts` re-export；
  * 回到调用方把 import 改到别名门牌。
* 暂时需要直接内部导入也可，但请在改动处加一行 `// TODO: 回收到 @<module> 门牌`。

### 步骤 4｜完善门牌 `index.ts`

* 仅导出**对外稳定 API**：

  ```ts
  // src/modules/prospecting/index.ts
  // module: prospecting | layer: public | role: barrel
  // summary: 对外公共出口（契约/用例/Hook）
  export * from './domain/public/strategies/contracts';
  export * from './application/BuildLeadScoreUseCase';
  export * from './hooks/useProspectingWizard';
  // 不导出 domain/strategies 内部实现
  ```

### 步骤 5｜三行文件头（缺了就补）

```ts
// src/modules/<module>/<layer>/path/File.ts
// module: <module> | layer: <ui|hooks|application|domain|services|api|stores|pages> | role: <简短角色>
// summary: 一句中文职责摘要
```

> 若仓库已有自动补头脚本（如 `pnpm headers:auto`），先运行脚本再检查摘要是否准确。

### 步骤 6｜编译与最小验证

```bash
pnpm install
pnpm type-check
pnpm lint || true     # 仅作提示，不阻塞
pnpm build            # 或 pnpm tauri dev 进行手动烟雾测试
```

* 打开与本次改动相关的页面，做一次最小操作路径验证（例如：加载数据 → 调用用例 → 渲染结果）。

---

## 提交规范（贴合“随时提交”）

* **小步提交**，每批改动聚焦一个子目录或 3–10 个文件。
* 提交信息建议格式（不强制）：

  ```
  refactor(prospecting): 前缀化 strategies* 并修复导入
  Next: 回收 X 到 @prospecting 门牌
  Note: 类型名同步前缀化，行为不变
  ```
* 提交后，在 `docs/DDD架构清晰问题/stream_b.md` 末尾**追加一行**：
  `[2025-10-12 16:40] script-builder/strategies 前缀化 4 项 → 下一步：补 index.ts 导出 contracts`

---

## 验收清单（每次提交自检）

* [ ] 目标文件已**前缀化**（文件名 + 类型名），如 `Prospecting* / Script* / Contact* / Adb*`
* [ ] 跨模块导入**优先**改为 `@<module>` 门牌（仍有内部导入处已标注 TODO）
* [ ] 相关模块 `index.ts` **只导出** contracts / usecase / hooks（未泄露内部实现）
* [ ] 改动文件有**三行文件头**
* [ ] `pnpm type-check` 与 `pnpm build` 通过；页面烟雾测试正常
* [ ] `prefix-migration-plan.md` 勾掉完成项；`stream_b.md` 追加一行记录

---

## Do / Don’t

* ✅ Do：前缀化命名 + 修导入 + 完善门牌 + 补文件头，**保证可编译**
* ✅ Do：小步提交，边改边跑，边记录
* ❌ Don’t：在 `domain/*` 里引入 `ui/services/api/hooks/pages`（唯一硬底线）
* ❌ Don’t：一次性大改动而不提交，避免回滚困难

---

## 常见问题（速解）

* **重命名后类型冲突？** 在导出名或文件名加更具体后缀：`-standard`, `-weighted`, `-rule-based`。
* **别名未生效？** 检查 `tsconfig.json` 的 `paths` 是否指到模块根（从而命中 `index.ts`）。
* **门牌导出过多？** 保守导出：只导出 `domain/public` 契约、用例、公开 hooks；内部实现不导出。
* **需要共享算法？** 抽到 `src/shared/**`；若是领域契约少量共享，放到 `domain/public/**` 并由门牌导出。
