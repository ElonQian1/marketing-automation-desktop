# Round 5｜审计事件模型（v1）

> 目标：定义“可追溯”的事件与字段，让任何一次操作都有证据链可查；与 Round 3 的状态机/错误码对齐。

---

## 1) 事件类型（EventType）
- 任务生命周期：`TASK_CREATED`、`TASK_ASSIGNED`、`TASK_LOCKED`、`TASK_DONE`、`TASK_FAILED`、`TASK_CANCELLED`、`TASK_RATE_DELAYED`
- 阈值与风控：`CIRCUIT_OPEN`、`CIRCUIT_CLOSE`、`RATE_LIMIT_UPDATE`
- 配置与内容：`TEMPLATE_CHANGE`、`SENSITIVE_WORD_UPDATE`、`TAGSET_UPDATE`
- 导入导出：`IMPORT`、`EXPORT`
- 鉴权与账户：`AUTH_REFRESH`、`AUTH_FAIL`、`ACCOUNT_STATUS_CHANGE`

---

## 2) 事件字段（统一结构）
| 字段 | 类型 | 说明 |
|---|---|---|
| event_id | string | 主键（UUID/雪花） |
| ts | datetime | 事件时间（ISO 8601，含时区） |
| type | enum | 见上方类型枚举 |
| actor | string | 操作者（`system/api/manual@user`） |
| account_id | string | 执行账号（如有） |
| task_id | string | 关联任务（如有） |
| objects | json | 相关对象引用（视频/评论/模板等） |
| result_code | enum | `OK/RATE_LIMITED/...`（如有） |
| payload_hash | string | 请求/回复摘要（脱敏） |
| meta | json | 额外信息（如冷却时间、相似度分值） |

---

## 3) 存储与索引
- 表：`audit_logs`；
- 索引：`(ts)`、`(type)`、`(task_id)`、`(account_id, ts)`；
- 保留期：≥ 180 天（可配）；
- 安全：脱敏存储，不写入明文隐私；
- 导出：支持按日导出 NDJSON/CSV 供审计归档。

---

## 4) 事件示例
```json
{
  "event_id": "al_01H...",
  "ts": "2025-10-09T12:45:10+09:00",
  "type": "TASK_DONE",
  "actor": "system",
  "account_id": "acc_01H...",
  "task_id": "tsk_01H...",
  "objects": {"video_url": "https://...", "comment_id": "cmt_01H..."},
  "result_code": "OK",
  "payload_hash": "sha1:...",
  "meta": {"executor_mode": "api", "external_receipt": "msg_123"}
}
```

---

## 5) 对齐与扩展
- 与《状态机与错误码（v1）》字段对齐，避免双重定义；
- 允许扩展 `meta` 以容纳平台特有回执；
- 任何新增事件类型需更新：枚举、索引、导出脚本与培训文档。

