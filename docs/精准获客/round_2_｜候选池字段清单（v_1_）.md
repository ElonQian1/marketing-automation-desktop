# Round 2｜候选池字段清单（v1）

> 目的：统一“候选池/评论/任务/模板/审计/日报”的字段与含义，便于开发、测试与运营协作。

---

## A. watch_targets（候选池）
| 字段 | 类型 | 必填 | 说明 | 示例 |
|---|---|---|---|---|
| id | string | 是 | 内部主键（UUID/雪花） | `wt_01H...` |
| target_type | enum | 是 | `video` / `account` | `video` |
| platform | enum | 是 | `douyin` / `oceanengine` / `public` | `douyin` |
| platform_id_or_url | string | 是 | 平台上的唯一标识或 URL | `https://www.douyin.com/video/xxxx` |
| title | string | 否 | 视频标题或账号昵称 | `示例视频` |
| source | enum | 是 | `manual` / `csv` / `whitelist` / `ads` | `csv` |
| industry_tags | string[] | 否 | 行业标签（枚举） | `口腔;健康` |
| region_tag | enum | 否 | 区域枚举 | `华东` |
| last_fetch_at | datetime | 否 | 上次拉取评论的时间 | `2025-10-09T10:00:00` |
| notes | string | 否 | 备注 | `——` |
| created_at / updated_at | datetime | 是 | 审计字段 | `...` |

---

## B. comments（评论）
| 字段 | 类型 | 必填 | 说明 | 示例 |
|---|---|---|---|---|
| id | string | 是 | 内部主键 | `cmt_01H...` |
| platform | enum | 是 | `douyin` / `oceanengine` / `public` | `douyin` |
| video_id | string | 是 | 归属视频（内部映射） | `vid_01H...` 或平台原始 ID |
| author_id | string | 是 | 评论用户的平台 ID（可脱敏） | `MS4wLjABAAAAX1` |
| content | text | 是 | 评论文本 | `太有用了！` |
| like_count | int | 否 | 点赞数 | `12` |
| publish_time | datetime | 是 | 评论发布时间 | `2025-10-09T09:30:00` |
| region | enum | 否 | 地域（若可识别） | `华东` |
| source_target_id | string | 是 | 溯源到 watch_targets.id | `wt_01H...` |
| inserted_at | datetime | 是 | 入库时间 | `...` |

---

## C. tasks（任务）
| 字段 | 类型 | 必填 | 说明 | 示例 |
|---|---|---|---|---|
| id | string | 是 | 内部主键 | `tsk_01H...` |
| task_type | enum | 是 | `reply` / `follow` | `reply` |
| comment_id | string | 任务=reply 时是 | 关联评论 | `cmt_01H...` |
| target_user_id | string | 任务=follow 时是 | 目标用户 | `MS4wLjABAAAAX1` |
| assign_account_id | string | 是 | 执行账号（open_id/advertiser_id 映射） | `acc_01H...` |
| status | enum | 是 | `NEW/READY/EXECUTING/DONE/FAILED` | `READY` |
| executor_mode | enum | 是 | `api` / `manual` | `api` |
| result_code | enum | 否 | 结果（见 codes 表） | `OK` |
| error_message | string | 否 | 失败原因 | `权限不足` |
| dedup_key | string | 是 | 查重键（公式见规范） | `sha1(douyin:cmtid)` |
| created_at / executed_at | datetime | 是/否 | 创建/执行时间 | `...` |

---

## D. reply_templates（话术模板）
| 字段 | 类型 | 必填 | 说明 | 示例 |
|---|---|---|---|---|
| id | string | 是 | 主键 | `tpl_01H...` |
| template_name | string | 是 | 模板名 | `基础问候` |
| channel | enum | 是 | `all/douyin/oceanengine` | `all` |
| text | text | 是 | 模板内容（含变量） | `你好 @{{nickname}}...` |
| variables | string[] | 否 | 变量名 | `nickname;topic` |
| category | enum | 否 | 模板类别 | `通用/专业` |
| enabled | bool | 是 | 启用 | `true` |
| updated_at | datetime | 是 | 更新时间 | `...` |

---

## E. audit_logs（审计）
| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| id | string | 是 | 主键 |
| action | enum | 是 | `TASK_CREATE/TASK_EXECUTE/TASK_FAIL/EXPORT` 等 |
| task_id | string | 否 | 关联任务 |
| account_id | string | 否 | 执行账号 |
| operator | string | 是 | `system/api/manual` 或人工账号名 |
| payload_hash | string | 否 | 请求/回复摘要（脱敏） |
| ts | datetime | 是 | 时间戳 |

---

## F. daily_reports（日报）
| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| date | date | 是 | 报告日期 |
| follow_count | int | 是 | 新增关注数 |
| reply_count | int | 是 | 新增回复数 |
| file_path | string | 是 | 导出文件路径或索引 |

---

## 附录：枚举建议
- `industry_tags`：口腔、母婴、医疗健康、美妆、教育培训、健身、食品饮料、家居、3C、汽车…（可扩展）
- `region_tag`：全国、华东、华北、华南、华中、西南、西北、东北（或省级）
- `source`：manual、csv、whitelist、ads
- `status`：NEW、READY、EXECUTING、DONE、FAILED
- `result_code`：OK、RATE_LIMITED、DUPLICATED、PERMISSION_DENIED、NOT_FOUND、BLOCKED、TEMP_ERROR、PERM_ERROR

