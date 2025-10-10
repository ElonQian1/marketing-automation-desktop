# Task Orchestration & Execution

## Objectives
- 将抓取到的评论转化为可执行任务，结合 AI 建议与人工决策，提高处理效率。
- 保证不同设备账号之间的去重与负载均衡，避免平台风控触发。
- 提供清晰的状态流转与操作审计。

## Task Lifecycle
```
new → queued → ai_enriched → assigned → executing → done|ignored|failed
```

- **new**：评论通过筛选后创建任务，尚未入 AI 队列。
- **queued**：等待 AI 处理，或因速率限制延迟。
- **ai_enriched**：AI 返回分类、优先级、回复候选。
- **assigned**：人工选择设备账号，锁定处理人。
- **executing**：执行引擎调用自动化脚本或人工回复。
- **done**：成功关注或回复，记录结果。
- **ignored**：被判定为垃圾/不处理，需备注原因。
- **failed**：执行失败，自动回滚状态，等待重新派发或人工处理。

每次状态变更写入 `task_history`，包含操作人、时间、备注。

## Queue Structure
- `task_ingest`：原始评论入队。
- `task_ready`：经筛选可生成任务的评论。
- `ai_processing`：等待 AI enrich。
- `manual_review`：AI 置信度低或敏感任务。
- `execution_queue`：准备执行的任务，按照优先级排序。

队列可使用 Redis Streams、SQLite + 任务表或消息中间件（如 RabbitMQ）。MVP 阶段可用数据库队列表实现。

## Filtering & Assignment Rules
- **地域**：任务必须匹配目标地域（例如评论所属省份或用户 IP 归属）。
- **时间窗口**：仅处理最近 N 小时的评论，过期任务标记为 `expired`。
- **数量上限**：按客户设定的每日关注数、回复数限制，超额时自动延后。
- **互动阈值**：通过点赞数、回复数、粉丝量等评分决定是否进入高优队列。
- **设备可用性**：检查设备账号状态（在线/离线、冷却时间），确保符合平台规则。
- **去重策略**：
  - 同一评论不可重复派发至不同设备；
  - 同一作者在 24h 内只允许一次关注；
  - 同一视频的重复提问 AI 可引用历史回复，提醒人工复用。

## Device Selection Algorithm
1. 根据任务优先级排序（AI score + 互动指标）。
2. 过滤出满足地域/时间/冷却要求的设备账号。
3. 按设备权重（工作量、成功率）进行负载均衡。
4. 如果无可用设备，任务进入 `on_hold` 状态并触发告警。

## Execution Flow
1. 执行专员在前端选择任务 → 查看评论上下文与 AI 建议。
2. 选择 `reply_option` 或自定义回复，选择设备账号。
3. 前端调用执行 API，Rust 自动化脚本完成关注或回复。
4. 执行结果（成功/失败、返回消息）写入 `task_history`。
5. 若成功，任务状态更新为 `done`，并通知日报模块。

## Error Handling
- **自动化失败**：记录错误码、重试次数；超过阈值后转入人工处理。
- **平台限制**：检测到风控提示时，暂停对应设备账号，并通知运营。
- **AI 数据缺失**：如果 AI 响应解析失败或字段缺失，任务回退到 `queued`。

## Interfaces
- `GET /tasks`：分页查询，可按状态、优先级、关键词过滤。
- `POST /tasks/{id}/assign`：锁定任务给执行人 + 设备。
- `POST /tasks/{id}/execute`：执行关注/回复，传入最终文案。
- `POST /tasks/{id}/ignore`：标记任务忽略，需提供原因。
- `POST /tasks/{id}/rollback`：将失败任务恢复到 `ai_enriched` 状态。

所有接口需要记录操作日志并校验操作权限。

## Audit & Compliance
- 任务日志保留至少 180 天，包含 AI 建议、人工修改、最终回复。
- 支持导出满足条件的任务历史，以配合内部审查或客户复盘。
- 对于人工覆盖 AI 回复的场景，保留修改前后差异，以评估 AI 质量。
