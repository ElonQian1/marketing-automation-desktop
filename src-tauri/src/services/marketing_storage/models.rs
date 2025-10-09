use serde::{Deserialize, Serialize};

// ==================== 候选池相关模型 ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WatchTargetPayload {
    pub dedup_key: String,
    pub target_type: String,   // enum: "video" | "account"
    pub platform: String,      // enum: "douyin" | "oceanengine" | "public"
    pub id_or_url: String,
    pub title: Option<String>,
    pub source: Option<String>, // enum: "manual" | "csv" | "whitelist" | "ads"
    pub industry_tags: Option<String>, // semicolon separated
    pub region: Option<String>, // enum: region tag
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WatchTargetRow {
    pub id: i64,
    pub dedup_key: String,
    pub target_type: String,
    pub platform: String,
    pub id_or_url: String,
    pub title: Option<String>,
    pub source: Option<String>,
    pub industry_tags: Option<String>,
    pub region: Option<String>,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ListWatchTargetsQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub platform: Option<String>,
    pub target_type: Option<String>,
}

// ==================== 评论相关模型 ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommentPayload {
    pub platform: String,      // "douyin" | "oceanengine" | "public"
    pub video_id: String,       // 归属视频ID
    pub author_id: String,      // 评论用户的平台ID（可脱敏）
    pub content: String,        // 评论文本
    pub like_count: Option<i32>,  // 点赞数
    pub publish_time: String,   // 评论发布时间 ISO8601
    pub region: Option<String>, // 地域（若可识别）
    pub source_target_id: String, // 溯源到 watch_targets.id
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommentRow {
    pub id: String,             // 内部主键 (UUID)
    pub platform: String,
    pub video_id: String,
    pub author_id: String,
    pub content: String,
    pub like_count: Option<i32>,
    pub publish_time: String,
    pub region: Option<String>,
    pub source_target_id: String,
    pub inserted_at: String,    // 入库时间
}

// ==================== 任务相关模型 ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskPayload {
    pub task_type: String,      // "reply" | "follow"
    pub comment_id: Option<String>, // 当任务=reply时必填
    pub target_user_id: Option<String>, // 当任务=follow时必填
    pub assign_account_id: String,   // 执行账号ID
    pub executor_mode: String,  // "api" | "manual"
    pub dedup_key: String,      // 查重键
    pub priority: Option<i32>,  // P0-P3默认 2
    pub deadline_at: Option<String>, // ISO8601
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskRow {
    pub id: String,             // 内部主键 (UUID)
    pub task_type: String,
    pub comment_id: Option<String>,
    pub target_user_id: Option<String>,
    pub assign_account_id: String,
    pub status: String,         // "NEW" | "READY" | "EXECUTING" | "DONE" | "FAILED"
    pub executor_mode: String,
    pub result_code: Option<String>, // "OK" | "RATE_LIMITED" | "DUPLICATED" | etc.
    pub error_message: Option<String>,
    pub dedup_key: String,
    pub created_at: String,
    pub executed_at: Option<String>,
    pub priority: i32,
    pub attempts: i32,
    pub deadline_at: Option<String>,
    pub lock_owner: Option<String>,
    pub lease_until: Option<String>,
}

// ==================== 话术模板相关模型 ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReplyTemplatePayload {
    pub template_name: String,
    pub channel: String,        // "all" | "douyin" | "oceanengine"
    pub text: String,           // 模板内容（含变量）
    pub variables: Option<String>, // 变量名（semicolon separated）
    pub category: Option<String>,  // 模板类别
    pub enabled: bool,          // 启用状态
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReplyTemplateRow {
    pub id: String,             // 内部主键 (UUID)
    pub template_name: String,
    pub channel: String,
    pub text: String,
    pub variables: Option<String>,
    pub category: Option<String>,
    pub enabled: bool,
    pub created_at: String,
    pub updated_at: String,
}

// ==================== 审计日志相关模型 ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditLogPayload {
    pub action: String,         // "TASK_CREATE" | "TASK_EXECUTE" | "TASK_FAIL" | "EXPORT" | etc.
    pub task_id: Option<String>, // 关联任务ID
    pub account_id: Option<String>, // 执行账号ID
    pub operator: String,       // "system" | "api" | "manual" | 人工账号名
    pub payload_hash: Option<String>, // 请求/回复摘要（脱敏）
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditLogRow {
    pub id: String,             // 内部主键 (UUID)
    pub action: String,
    pub task_id: Option<String>,
    pub account_id: Option<String>,
    pub operator: String,
    pub payload_hash: Option<String>,
    pub ts: String,             // 时间戳
}

// ==================== 日报相关模型 ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyReportPayload {
    pub date: String,           // 报告日期 (YYYY-MM-DD)
    pub follow_count: i32,      // 新增关注数
    pub reply_count: i32,       // 新增回复数
    pub file_path: String,      // 导出文件路径或索引
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyReportRow {
    pub id: String,             // 内部主键 (UUID)
    pub date: String,
    pub follow_count: i32,
    pub reply_count: i32,
    pub file_path: String,
    pub created_at: String,
}

// ==================== 查询参数模型 ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ListCommentsQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub platform: Option<String>,
    pub source_target_id: Option<String>,
    pub region: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ListTasksQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub status: Option<String>,
    pub task_type: Option<String>,
    pub assign_account_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ListReplyTemplatesQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub channel: Option<String>,
    pub enabled: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ListAuditLogsQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub action: Option<String>,
    pub task_id: Option<String>,
    pub start_time: Option<String>,
    pub end_time: Option<String>,
}
