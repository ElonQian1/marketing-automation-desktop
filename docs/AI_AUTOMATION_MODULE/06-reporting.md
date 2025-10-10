# Reporting & Analytics

## Objectives
- 提供每日关注与回复的可下载日志，满足客户复盘及合规留档。
- 输出运营指标，量化 AI 效能与任务处理效率。

## Report Types
1. **关注清单 (Follow Log)**：
   - 字段：`date_followed`, `account_id`, `account_name`, `video_id`, `device_id`, `operator`, `source`, `remarks`.
2. **回复清单 (Reply Log)**：
   - 字段：`date_replied`, `video_url`, `comment_id`, `comment_author`, `comment_content`, `reply_account_id`, `reply_content`, `ai_option_id`, `operator`, `status`.
3. **运营概览 (Daily Summary)**：
   - 指标：新增关注数、回复数、AI 采纳率、人工修改率、异常任务数、平均处理时间。

## Generation Flow
1. 每日 00:05 调度 Job（或按客户自定义时间），查询前一日任务与执行记录。
2. 数据清洗：
   - 统一时区为 CST；
   - 填充缺失值（例如无视频链接时标记 `N/A`）；
   - 标记 AI 回复是否被修改（字段 `reply_modified`）。
3. 数据校验：
   - 记录条数对比任务完成量；
  - 校验必填字段非空；
   - 若发现异常行，记录到 `report_error` 表并通知运营。
4. 导出：
   - 默认生成 CSV，可选 Excel（XLSX）。
   - 文件命名规则：`report_follow_YYYYMMDD.csv`、`report_reply_YYYYMMDD.csv`。
5. 存储与访问：
   - 文件存至安全目录或对象存储，保留至少 180 天。
   - 通过前端下载或邮件/飞书自动推送。

## Configuration
- 在 `report_settings` 表存储客户偏好：时间、格式、接收人、字段增删。
- 支持按客户、项目、设备账号维度生成过滤版本。
- 可配置“只导出 AI 参与的任务”或“只导出人工修改过的回复”等细分视图。

## Analytics Dashboard (可选)
- 指标图表：任务状态分布、AI 采纳率趋势、回复响应时间、热门关键词。
- 告警：当 AI 采纳率突降、失败任务激增时触发通知。
- 可与 BI 工具集成（如 Metabase、Superset），或直接在 Tauri 前端内实现基础图表。

## Data Retention & Compliance
- 报表访问需鉴权并记录下载日志。
- 如包含个人隐私信息，导出时应支持脱敏选项（遮蔽用户 ID）。
- 定期（如每季度）清理过期数据，遵守客户与平台的存储政策。
