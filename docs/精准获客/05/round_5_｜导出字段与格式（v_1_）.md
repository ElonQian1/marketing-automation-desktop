# Round 5｜导出字段与格式（v1）

> 目的：把“导出什么、导出成什么样、如何命名与校验”一次说清楚，确保任意人导出的 CSV 都能被客户系统稳定消费。

---

## 1) 文件清单与命名
- **关注清单**：`follow_list_YYYY-MM-DD.csv`
- **回复清单**：`reply_list_YYYY-MM-DD.csv`
- **摘要指标（可选）**：`daily_summary_YYYY-MM-DD.csv`

> 命名中的日期为**生成日报的业务日期**（本地时区，默认 `Asia/Tokyo`）。

---

## 2) 编码与格式
- 编码：UTF-8（带或不带 BOM，按客户需求，可配置）。
- 分隔符：逗号 `,`；换行：`\n`。
- 引号：字段含逗号/换行/双引号时使用双引号包裹，内部双引号转义为 `"`。
- 时间：ISO 8601，示例 `2025-10-09T10:12:00+09:00`。

---

## 3) 字段定义（最小集）
### 3.1 关注清单 `follow_list_*.csv`
| 列名（中文） | 字段名（内部） | 说明 | 示例 |
|---|---|---|---|
| 关注日期 | follow_date | 业务日期（本地时区） | 2025-10-09 |
| 关注账号ID | target_user_id | 平台用户 ID（脱敏可选） | MS4wLjABAAAAXXXX |
| 执行账号ID | reply_account_id | 我方用于执行的账号 ID | MS4wLjABAAAAYYYY |
| 来源 | source | douyin/oceanengine/public | douyin |
| 执行模式 | executor_mode | api/manual | api |

### 3.2 回复清单 `reply_list_*.csv`
| 列名（中文） | 字段名（内部） | 说明 | 示例 |
|---|---|---|---|
| 日期 | reply_date | 业务日期（本地时区） | 2025-10-09 |
| 视频链接 | video_url | 归属视频 URL 或标识 | https://www.douyin.com/video/xxxx |
| 评论账户ID | comment_author_id | 评论作者平台 ID | MS4wLjABAAAAX1 |
| 评论内容 | comment_text | 原评论文本 | 太有用了！ |
| 回复账号ID | reply_account_id | 我方执行账号 ID | MS4wLjABAAAAY2 |
| 回复内容 | reply_text | 最终发送文本 | 感谢关注… |
| 执行模式 | executor_mode | api/manual | api |
| 外部回执 | external_receipt | message_id 或外部链接 | msg_123456 |

### 3.3 摘要指标 `daily_summary_*.csv`（可选）
| 字段 | 说明 |
|---|---|
| date | 业务日期 |
| follow_count | 新增关注数 |
| reply_count | 新增回复数 |
| tasks_created | 当日创建任务数 |
| tasks_done | 当日完成任务数 |
| tasks_failed | 当日失败任务数 |
| rate_limit_hits | 频控命中次数 |
| dedup_hits | 查重命中次数 |
| accounts_active | 参与执行的账号数 |

---

## 4) 校验（导出前）
- **必填**：所有主字段不得为空（见上表）。
- **长度**：文本字段 ≤ 500 字（或按客户协议）；
- **合法性**：URL 合法、ID 格式匹配平台规范；
- **重复**：按 `target_user_id+follow_date`（关注）与 `external_receipt`/`comment_author_id+video_url+reply_date`（回复）去重；
- **隐私**：如包含昵称/头像等公开信息，需标注来源且遵守导出协议。

---

## 5) 大文件与分片
- 单文件建议 ≤ 10 万行；超出自动按 `*_part01.csv` 分片；
- 每个分片都应包含**同样表头**与**相同日期**。

---

## 6) 版本与变更
- 模板版本：`export_schema_version = v1.0.0`（写入文件首行注释或单独 `meta.json`）。
- 变更需记录：新增/删除字段、含义变化、兼容策略、发布人与日期。

---

## 7) 失败与恢复
- 导出失败需生成 `error_report_YYYY-MM-DD.json`：包含错误码、失败明细与建议；
- 局部失败（单行非法）默认**跳过并计数**，在错误报告中列明。

