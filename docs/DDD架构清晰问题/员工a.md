


# 员工A｜模块优先 + 模块内分层的结构化改造（低约束，支持碎片化）

> 交流与记录请仅使用此文件夹：
> `docs/DDD架构清晰问题/`
> 若有临时结论/问题/TODO，请在该文件夹内**追加一行**到 `stream_a.md`（没有就新建），格式：`[时间] 简述 → 下一步`。

## 你的角色

“结构整形工程师”。在**不提高限制**的前提下，把项目统一到「**模块优先 + 模块内分层**」，并用**四件套**降低“同名子目录（strategies、services、utils…）被误改”的风险。

## 唯一硬底线（仅此一条）

* **domain 不得依赖 UI/IO**：不要在 `domain/*` 里 `import` 到 `ui/services/api/hooks/pages`，其它跨模块行为不作限制。

---

## 本轮目标（一次说清）

1. 对**容易重名**的子目录实施**命名前缀**（文件名 + 类型名）：

   * `prospecting` → `prospecting-*/Prospecting*`
   * `script-builder` → `script-*/Script*`
   * `contact-import` → `contact-*/Contact*`
   * `adb` → `adb-*/Adb*`
     覆盖目录：`domain/strategies`、`services`、`utils`、`validators`、`adapters`、`pipelines`、`mappers`、`repositories`。
2. 为每个模块补好**门牌导出 `index.ts`**：只导出 `domain/public/**` 契约/预设、`application` 用例、公开 `hooks`/轻类型；**不导出**内部实现（如 `domain/strategies/*`）。
3. **别名统一导入**：在 `tsconfig.json` 使用 `@prospecting/*`、`@script/*`、`@contact/*`、`@adb/*`、`@shared/*`，跨模块导入统一走门牌。
4. **三行文件头**：每个 `ts/tsx` 顶部写清真实路径、模块、分层、角色、中文摘要（可用自动脚本补，缺了就加）。

---

## 执行顺序（碎片化也能跟得上）

### 步骤1｜列清单（只做你要改的那部分）

* 在 `docs/architecture/` 新建 `prefix-migration-plan.md`，记录 from→to 重命名表，**先覆盖**：

  * `src/modules/prospecting/domain/strategies/**`
  * `src/modules/script-builder/domain/strategies/**`
* 表头示例：

  ```
  | 模块 | 子目录 | from(现名) | to(前缀化后) | 类型名改为 | 备注 |
  ```

### 步骤2｜前缀化命名（小步重命名，随做随提）

* 仅改**文件名**与**导出类型名**，不改逻辑。
* 示例：

  * `weighted.ts` → `prospecting-strategy-weighted.ts`；`StrategyWeighted` → `ProspectingStrategyWeighted`
  * `standard.ts` → `script-strategy-standard.ts`；`StrategyStandard` → `ScriptStrategyStandard`

### 步骤3｜修导入（优先从门牌拿）

* 跨模块导入统一改为：

  ```ts
  import { XXX } from '@prospecting';   // 命中 src/modules/prospecting/index.ts
  import { YYY } from '@script';
  ```
* 仅当门牌暂时未导出所需契约时，**先不强制**，可临时保持内部导入；后续补门牌并回收。

### 步骤4｜完善门牌导出

* 每个模块根建/补 `index.ts`，只导出**对外稳定 API**：

  ```ts
  // src/modules/prospecting/index.ts
  // module: prospecting | layer: public | role: barrel
  // summary: 对外公共出口（契约/用例/Hook）
  export * from './domain/public/strategies/contracts';
  export * from './application/BuildLeadScoreUseCase';
  export * from './hooks/useProspectingWizard';
  // 不导出 domain/strategies 内部实现
  ```

### 步骤5｜别名检查

* `tsconfig.json` 需包含：

  ```json
  {
    "compilerOptions": {
      "baseUrl": ".",
      "paths": {
        "@prospecting/*": ["src/modules/prospecting/*"],
        "@script/*": ["src/modules/script-builder/*"],
        "@contact/*": ["src/modules/contact-import/*"],
        "@adb/*": ["src/modules/adb/*"],
        "@shared/*": ["src/shared/*"]
      }
    }
  }
  ```

### 步骤6｜三行文件头（缺了就补）

模板（复制到每个 `ts/tsx` 顶部）：

```ts
// src/modules/<module>/<layer>/path/File.ts
// module: <module> | layer: <ui|hooks|application|domain|services|api|stores|pages> | role: <简短角色>
// summary: 一句中文职责摘要
```

---

## 提交粒度与记录（适配“随时提交”）

* **随做随提**：每完成一批前缀化/导入修复，就提交一次。
* **记录方式**：在 `docs/DDD架构清晰问题/stream_a.md` 末尾追加一行（Markdown 文本即可）：

  ```
  [2025-10-12 14:05] prospecting/strategies 前缀化 3 项 → 下一步：补 prospecting/index.ts 导出 contracts
  ```

---

## 验收清单（每次提交自检 30 秒）

* [ ] 改动文件名与类型名已加模块前缀（Prospecting*/Script*/Contact*/Adb*）
* [ ] 跨模块导入**优先**改为 `@<module>` 门牌
* [ ] 门牌 `index.ts` **只**导出 contracts/usecase/hook（未泄露内部实现）
* [ ] 改动文件有三行文件头
* [ ] 编译通过，核心路径可运行
* [ ] 在 `prefix-migration-plan.md` 勾掉完成项，在 `stream_a.md` 记一行

---

## 参考示例（策略契约文件）

```ts
// src/modules/script-builder/domain/public/strategies/contracts.ts
// module: script-builder | layer: domain | role: contract
// summary: 对外共享的脚本策略契约/预设
export interface ScriptStrategy { run(input: unknown): unknown }
export const ScriptPresetStandard = { /* 小而稳的预设 */ };
```

---

### 温馨提示

* 共享通用算法放 `src/shared/**`；要对外公开的领域契约放 `domain/public/**` 并由门牌导出。
* 若临时存在“跨模块内部导入”，先确保能跑；之后再补门牌与契约回收，不必一次到位。
* 只保留一条硬底线：**domain 不要 import UI/IO**；其余保持自由与灵活。
