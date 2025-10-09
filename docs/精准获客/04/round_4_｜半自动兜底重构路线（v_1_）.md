# Round 4｜半自动兜底重构路线（v1）

> 目标：把执行台从「mock 驱动的演示页」演进为「遵循文档约束、可扩展、可复用」的半自动兜底体系。覆盖数据接入、UI 结构、服务拆分、审计闭环三大维度。

---

## 1) 现状摘要
- `TaskExecutionCenter` 使用 `monitoringService` 的假数据，API/鉴权/审计流程缺席；
- 执行台 Drawer 与 `reply-management` 中的话术/审计逻辑重复但不共享；
- 频控/查重/敏感词存在于多个模块，尚未复用统一服务；
- 模板与变量策略仍是硬编码数组，未对接「多模板轮换 + 变量回退 + 敏感词等级」；
- 审计日志仅在 `PreciseAcquisitionApplicationService` 中定义，前端未落库。

---

## 2) 目标架构
1. **数据与服务层**
   - `PreciseAcquisitionApplicationService` 承担候选池、任务、审计、频控的唯一数据入口；
   - 引入 `SemiAutoTaskService`（前端 hook + 后端 command）负责：
     - 锁定任务（半自动、API）；
     - 执行前四件套检查；
     - 生成/刷新话术草稿与变量；
     - 写入 `audit_logs` 与 `tasks` 状态更新。

2. **前端模块划分**
   - `modules/task-management/semi-auto/`：半自动执行台共用面板（Drawer、脚本、复核）；
   - `modules/conversation-templates/`：话术模板、变量词典、多样性策略；
   - `modules/audit-receipts/`：人工回执、截图、失败原因表单；
   - 共用 `useSafetyChecks` hook，封装敏感词、频控、查重、熔断。

3. **流程闭环**
   - 任务→预检查→话术渲染→人工执行→回执落库→审计记录→统计刷新；
   - 对应 UI：任务列、执行台 Drawer、回执面板、审计提示徽章。

---

## 3) 增量路线
| 阶段 | 内容 | 产出 |
| --- | --- | --- |
| P0 | 统一数据来源、消除 mock | `TaskExecutionCenter` 改为调用 `PreciseAcquisitionApplicationService`；提供临时命令或接口桩。 |
| P1 | 半自动执行台组件化 | `SemiAutoExecutionDrawer`、`usePrecheckEvaluator`、`useSemiAutoTasks`；执行入口统一。 |
| P2 | 话术模板模块化 | `conversation-templates` 模块，支持变量高亮、轮换、回退；执行台复制草稿。 |
| P3 | 回执与审计闭环 | `audit-receipts` 模块，调用后端写 `audit_logs`、回填任务状态、上传截图指针。 |
| P4 | 风险策略复用 | 把敏感词/相似度/频控从 hook 迁入服务；提供可解释 UI。 |
| P5 | API 执行与人工兜底融合 | 与 `api_执行器` 文档一致：自动判断可调用 API 与否、回落半自动。 |

---

## 4) 模块拆分细节
### 4.1 `modules/task-management/semi-auto`
- `useSemiAutoTasks`：封装任务筛选、锁定、状态更新；
- `SemiAutoExecutionDrawer`：组合预检查、话术、回执组件；
- `SemiAutoPrecheckPanel`（现 `PrecheckStatusBar`）扩展敏感词等级、冷却时间。

### 4.2 `modules/conversation-templates`
- 数据来源：CSV/接口，字段符合《话术模板与变量规范》；
- 能力：模板轮换、变量 fallback、长度抖动、同义词池；
- 输出：`useTemplates(sceneId, context)` → 返回多候选草稿 + 标记敏感词命中。

### 4.3 `modules/audit-receipts`
- 表单字段：操作人、时间、任务ID、最终文本、截图路径、失败原因；
- 接口：`submitManualReceipt(payload)` → 更新任务状态 + `audit_logs`；
- UI：操作台回执区域、任务列表中的审计 badge。

---

## 5) 数据与接口契约
| 功能 | 接口 | 描述 |
| --- | --- | --- |
| 任务拉取 | `getTasks(filter)` | 返回任务实体（含 executor_mode、dedup_key、audit 状态）。 |
| 锁定任务 | `lockTask(taskId)` | 120s 租约，避免多端冲突。 |
| 预检查 | `checkPreconditions(taskId)` | 频控、查重、敏感词、权限；返回状态树。 |
| 话术草稿 | `generateDraft(taskId, templateId?)` | 填充变量并附敏感词提示。 |
| 回执提交 | `submitManualReceipt(taskId, payload)` | 写入 audit_log、更新任务状态。 |
| 审计查询 | `getAuditTrail(taskId)` | 返回人工/自动执行证据。 |

---

## 6) 驱动优化的指标
- 任务成功率、人工回执时长、敏感词命中率；
- 四件套阻塞原因分布（权限/频控/查重/敏感词）；
- 模板多样性指标（轮换覆盖、相似度>0.85 警报数）；
- 审计滞后率（任务 Done 后未落日志的比例）。

---

## 7) 下一步行动列表
1. P0：搭建 `useSemiAutoTasks`，让执行台使用服务层数据；
2. P1：把 Drawer 拆到独立组件，同时接入现有 `usePrecheckEvaluator`；
3. P2：实现模板模块并在 Drawer 中替换硬编码草稿；
4. P3：补齐回执提交流程并写入审计；
5. P4：整合敏感词/频控策略，提供等级标签与冷却倒计时；
6. P5：实现 API 与半自动兜底的执行策略切换。

---

> 本路线将作为后续重构的迭代基线，每个阶段完成后更新 DoD 与风险清单，确保与 Round 4 文档的一致性。***
