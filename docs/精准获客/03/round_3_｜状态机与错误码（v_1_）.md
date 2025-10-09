# Round 3｜状态机与错误码（v1）

> 把任务“从生到死”的路径一次定清楚，异常都有去处；同一对象在任何时刻只允许一个**有效执行者**。

---

## 1) 任务状态机（TaskState）
```
NEW → READY → EXECUTING → DONE
                 ↘
                  FAILED
```

- **NEW**：筛选规则命中新建；未分配账号。
- **READY**：已分配账号与设备，等待出队执行。
- **EXECUTING**：已加锁（租约锁，默认 120s，可续期），正在执行。
- **DONE**：执行成功（API/人工），完成签收与审计。
- **FAILED**：执行失败，包含重试计数与最后错误码。

### 辅助标记
- `priority`（P0–P3）：默认 P2；被@或强线索升至 P1/P0。
- `deadline_at`：过期则自动取消（写审计 `TASK_CANCELLED`）。
- `attempts`：重试次数；超过阈值转 `FAILED` 并熔断评估。

---

## 2) 关键事件（Event）
- `TASK_CREATED`（NEW）
- `TASK_ASSIGNED`（READY）
- `TASK_LOCKED` / `TASK_UNLOCKED`（EXECUTING 上下锁）
- `TASK_DONE` / `TASK_FAILED`
- `TASK_CANCELLED`（过期/手动）
- `TASK_RATE_DELAYED`（频控延后）

> 所有事件都写入 `audit_logs`，包含操作者、账号、payload 摘要（脱敏）。

---

## 3) 出队与加锁（并发安全）
- **公平出队**：按 `priority`、`created_at`、`account 可用额度` 排序。
- **租约锁**：`lock_owner=account_id`，`lease=120s`，执行心跳续期；超时自动释放。
- **幂等**：以 `dedup_key` 和 `task_id` 作为幂等键，重复提交不重复执行。

---

## 4) 重试与退避（Backoff）
- 临时错误（`TEMP_ERROR`）：指数退避（30s、60s、120s、…），最多 5 次。
- 频控延后（`RATE_LIMITED`）：按平台建议冷却时间或本地策略延后出队。
- 永久错误（`PERM_ERROR/ PERMISSION_DENIED/ BLOCKED`）：直接 `FAILED`，不重试。

---

## 5) 错误码词典（ResultCode）
| 代码 | 说明 | 建议处理 |
|---|---|---|
| OK | 执行成功 | 签收 → DONE |
| RATE_LIMITED | 频控触发 | 延后 → READY（带下一次可执行时间） |
| DUPLICATED | 查重命中 | 取消 → DONE（标记为去重） |
| PERMISSION_DENIED | 权限不足/未授权 | FAILED（人工处理/申请权限） |
| NOT_FOUND | 目标不存在/已删 | FAILED（记录上下文） |
| BLOCKED | 命中黑名单/敏感场景 | FAILED（不可重试） |
| TEMP_ERROR | 临时错误（网络/超时） | 重试（指数退避） |
| PERM_ERROR | 永久错误（参数/策略） | FAILED（修复后重建） |

---

## 6) 熔断（Circuit Breaker）
- 维度：`account_id` / `platform` / `source`。
- 触发：近 10 分钟失败率 > 40% 或连续 `PERMISSION_DENIED` ≥ 3。
- 行为：暂停该维度出队 10–30 分钟；通知运营；可手动解锁。

---

## 7) 取消与回收
- **超时取消**：`deadline_at` 过期 → `TASK_CANCELLED`。
- **人工取消**：运营在操作台关闭任务（需选择原因）。
- **回收**：`EXECUTING` 任务若租约过期无心跳 → 自动回收为 `READY` 并换锁。

---

## 8) 审计与可观测
- 每个状态变化都写 `audit_logs`；
- 指标：`queue_length`、`success_rate`、`avg_wait`、`error_topK`、`circuit_open_count`；
- 日/周报：状态分布、失败原因占比、熔断统计、平均响应时间。

