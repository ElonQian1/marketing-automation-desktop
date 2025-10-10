# Data Pipeline Design

## Overview
Rust 服务负责抓取评论与视频指标，AI 模块消费结构化数据。流水线拆解为采集、预处理、持久化、任务生成四个阶段，并提供监控与重试机制。

```
Source (API/爬虫) → Ingestion Queue → Normalizer → Deduper → Storage (DB) → Task Builder → Task Queue
```

## Data Sources
- **关键词抓取器**：根据行业关键词访问搜索接口，输出评论、视频、作者信息。
- **账号/视频监控器**：周期性请求指定账号/视频，收集互动指标与新增评论。
- **人工补录**：运营手动导入评论或账号列表（CSV/表格），写入同一入口队列。

所有源数据在进入流水线前需打上 `source_type` 和 `collection_timestamp` 标签，以便追踪。

## Ingestion & Normalization
- **消息队列**：使用 `task_ingest` 队列缓冲抓取结果，支持批量写入。
- **字段标准化**：
  - 评论：`comment_id`、`video_id`、`author_id`、`content`、`like_count`、`publish_time`、`location`.
  - 视频：`video_id`、`title`、`view_count`、`like_count`、`comment_count`、`publish_time`.
- **清洗策略**：去除 HTML、控制字符，截断超过阈值的文本，标记缺失字段。
- **语言检测**：标记评论语言，为后续 Prompt 选择与翻译做准备。

## Deduplication
- 主键由 `comment_id + platform` 组成。
- 对于缺失 `comment_id` 的场景，使用哈希：`hash(video_id + author_id + content_digest)`.
- 维护每日 `dedupe_log` 表，记录被拒绝的重复数据及原因，供运营检查抓取质量。

## Storage Schema
- `comments`：存储标准化后的评论，包含状态字段（`new`, `queued`, `in_progress`, `done`, `ignored`）。
- `videos`：记录视频元数据与最新指标，便于生成监控提醒。
- `accounts`：监控账号配置、地域、标签与可用设备账号。
- `tasks`：评论处理任务，与 `comments` 表一对一关系，包含 AI 结果、优先级、指定设备。
- `task_history`：记录状态变更、执行人、执行设备、结果摘要。
- `ai_logs`：保存 AI 请求与响应摘要（脱敏后），用于审计与扩展训练。

数据库建议使用 PostgreSQL 或 SQLite（Tauri 内嵌）作为起步，未来可迁移到云端托管。

## Task Generation Rules
- 定时 Job（如每 5 分钟）扫描 `comments` 表，选取符合条件的记录生成任务。
- 条件：关键词命中、地域匹配、发布时间在窗口内、互动指标超过阈值。
- 同一评论若此前未完成任务，则更新已有任务而非重复生成。
- 将关键配置保存在 `task_policy` 表，支持按客户自定义。

## Scheduling & Retry
- 采集任务：行业关键词（15 min）、账号/视频监控（5 min），可根据优先级调整。
- AI 处理：任务生成后立即入 `ai_processing` 队列，支持并发调用与速率控制。
- 对于 AI 调用失败或超时的任务，记录错误并按指数退避重试（上限 3 次）。
- 若抓取失败，写入 `ingest_error` 表并发送告警。

## Data Quality & Monitoring
- 指标：抓取成功率、去重命中率、AI 调用成功率、任务生成延迟、日报生成时长。
- 报警：当任一指标低于阈值（如抓取成功率 < 90%）时，通过邮件/飞书通知。
- 审计：每日生成数据质检报告，包含重复评论、缺失字段、异常文本等统计。

## Interfaces
- 提供 REST/gRPC API 供前端或 CLI 查询评论、任务与历史执行。
- 导出接口返回 CSV/JSON，同时记录导出请求人、时间与过滤条件。
- 所有接口均需鉴权，并记录访问日志以满足审计要求。
