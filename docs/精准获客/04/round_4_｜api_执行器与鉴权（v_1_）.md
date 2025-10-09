# Round 4｜API 执行器与鉴权（v1）

> 目标：定义“API 执行器”的输入/输出、前置检查、错误处理、审计与安全；同时明确抖音与巨量两条链路的差异化点。

---

## 1) 统一抽象（接口契约）
- `execute_reply(task_id, account_id, text)` → `{result_code, message_id?, external_url?, ts}`
- `execute_hide(task_id, account_id)` → `{result_code, ts}`（广告评论）
- `execute_follow(task_id, account_id)` → `{result_code, ts}`（若平台开放）

**入参校验**：
- `task_id` 必须处于 `READY` 且锁定；
- `account_id` 具备目标平台权限；
- `text` 通过敏感词与文本相似度检查。

---

## 2) 执前检查（内置）
1. **权限**：
   - 抖音：检查所需 scope 已授权且 token 未过期；
   - 巨量：校验 `advertiser_id` 的授权与接口可用。
2. **频控**：账号额度与最小间隔；同视频/用户上限；
3. **查重**：评论级/用户级/文本级；
4. **合规**：模板是否含敏感词；是否命中黑名单场景。

> 任何一项不通过 → 返回 `FAILED` 或 `RATE_LIMITED/DUPLICATED/BLOCKED`，并写审计。

---

## 3) 调用顺序（伪流程）
1) 读取并锁定任务（租约 120s）；
2) 执前四件套通过；
3) **调用平台 API**（抖音/巨量）：
   - 成功：获取 `message_id` 或操作结果；
   - 失败：映射为我们的 `ResultCode`；
4) 写 `audit_logs`，更新任务状态与执行文本；
5) 释放锁；必要时触发降速/熔断。

---

## 4) 错误映射（示例）
- 平台 429/节流 → `RATE_LIMITED`（记录重试时间或本地冷却策略）；
- 鉴权失败/权限不足 → `PERMISSION_DENIED`；
- 资源不存在/已删 → `NOT_FOUND`；
- 命中风控/策略拒绝 → `BLOCKED`；
- 网络/超时 → `TEMP_ERROR`（指数退避）。

---

## 5) 安全与密钥管理
- 令牌与密钥：存 OS Keychain/凭据管理器；
- 最小权限：仅申请所需 scope；
- 轮转：在到期前 7 天预警与自动刷新；
- 审计：所有鉴权相关失败都落 `audit_logs`，便于复盘。

---

## 6) 差异提示（抖音 vs 巨量）
- **抖音（自然）**：以 `open_id` 维度执行回复；可能返回 message_id/评论链接；
- **巨量（广告）**：以 `advertiser_id` + 创意/计划维度管理评论（含隐藏）；
- 两者**不可混用**，任务创建时已标注来源，执行器按来源路由。

---

## 7) DoD（通过标准）
- 任一成功调用都能落审计（含外部 message_id/URL）；
- 错误都有明确的 `ResultCode` 映射与处理策略；
- 令牌过期/权限不足能被提前发现并提示；
- 账号被频控或熔断时，操作台有明确的可解释提示。

