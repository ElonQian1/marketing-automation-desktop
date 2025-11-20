use serde::{Deserialize, Serialize};
use rusqlite::types::{FromSql, FromSqlResult, ValueRef, ToSql, ToSqlOutput};
use rusqlite::Result;

// ==================== 候选池相关模型 ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WatchTargetPayload {
    pub dedup_key: String,
    pub target_type: TargetType,   // enum: "video" | "account"
    pub platform: MarketingPlatform,      // enum: "douyin" | "oceanengine" | "public"
    pub id_or_url: String,
    pub title: Option<String>,
    pub source: Option<TargetSource>, // enum: "manual" | "csv" | "whitelist" | "ads"
    pub industry_tags: Option<String>, // semicolon separated
    pub region: Option<String>, // enum: region tag
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WatchTargetRow {
    pub id: String,                      // 内部主键（UUID格式）
    pub dedup_key: String,
    pub target_type: TargetType,
    pub platform: MarketingPlatform,
    pub id_or_url: String,
    pub title: Option<String>,
    pub source: TargetSource,                  // source现在是必填字段
    pub industry_tags: Option<String>,
    pub region: Option<String>,
    pub last_fetch_at: Option<String>,   // 新增：上次拉取评论时间
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ListWatchTargetsQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub platform: Option<MarketingPlatform>,
    pub target_type: Option<TargetType>,
}

// ==================== 评论相关模型 ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommentPayload {
    pub platform: MarketingPlatform,      // "douyin" | "oceanengine" | "public"
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
    pub platform: MarketingPlatform,
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
    pub task_type: TaskType,      // "reply" | "follow"
    pub comment_id: Option<String>, // 当任务=reply时必填
    pub target_user_id: Option<String>, // 当任务=follow时必填
    pub assign_account_id: String,   // 执行账号ID
    pub executor_mode: ExecutorMode,  // "api" | "manual"
    pub dedup_key: String,      // 查重键
    pub priority: Option<i32>,  // P0-P3默认 2
    pub deadline_at: Option<String>, // ISO8601
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TaskType {
    Reply,
    Follow,
    #[serde(other)]
    Unknown,
}

impl ToString for TaskType {
    fn to_string(&self) -> String {
        match self {
            TaskType::Reply => "reply".to_string(),
            TaskType::Follow => "follow".to_string(),
            TaskType::Unknown => "unknown".to_string(),
        }
    }
}

impl From<String> for TaskType {
    fn from(s: String) -> Self {
        match s.as_str() {
            "reply" => TaskType::Reply,
            "follow" => TaskType::Follow,
            _ => TaskType::Unknown,
        }
    }
}

impl ToSql for TaskType {
    fn to_sql(&self) -> Result<ToSqlOutput<'_>> {
        Ok(ToSqlOutput::from(self.to_string()))
    }
}

impl FromSql for TaskType {
    fn column_result(value: ValueRef<'_>) -> FromSqlResult<Self> {
        value.as_str().map(|s| TaskType::from(s.to_string()))
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TaskStatus {
    New,
    Ready,
    Executing,
    Done,
    Failed,
    #[serde(other)]
    Unknown,
}

impl ToString for TaskStatus {
    fn to_string(&self) -> String {
        match self {
            TaskStatus::New => "NEW".to_string(),
            TaskStatus::Ready => "READY".to_string(),
            TaskStatus::Executing => "EXECUTING".to_string(),
            TaskStatus::Done => "DONE".to_string(),
            TaskStatus::Failed => "FAILED".to_string(),
            TaskStatus::Unknown => "UNKNOWN".to_string(),
        }
    }
}

impl From<String> for TaskStatus {
    fn from(s: String) -> Self {
        match s.as_str() {
            "NEW" => TaskStatus::New,
            "READY" => TaskStatus::Ready,
            "EXECUTING" => TaskStatus::Executing,
            "DONE" => TaskStatus::Done,
            "FAILED" => TaskStatus::Failed,
            _ => TaskStatus::Unknown,
        }
    }
}

impl ToSql for TaskStatus {
    fn to_sql(&self) -> Result<ToSqlOutput<'_>> {
        Ok(ToSqlOutput::from(self.to_string()))
    }
}

impl FromSql for TaskStatus {
    fn column_result(value: ValueRef<'_>) -> FromSqlResult<Self> {
        value.as_str().map(|s| TaskStatus::from(s.to_string()))
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ExecutorMode {
    Api,
    Manual,
    #[serde(other)]
    Unknown,
}

impl ToString for ExecutorMode {
    fn to_string(&self) -> String {
        match self {
            ExecutorMode::Api => "api".to_string(),
            ExecutorMode::Manual => "manual".to_string(),
            ExecutorMode::Unknown => "unknown".to_string(),
        }
    }
}

impl From<String> for ExecutorMode {
    fn from(s: String) -> Self {
        match s.as_str() {
            "api" => ExecutorMode::Api,
            "manual" => ExecutorMode::Manual,
            _ => ExecutorMode::Unknown,
        }
    }
}

impl ToSql for ExecutorMode {
    fn to_sql(&self) -> Result<ToSqlOutput<'_>> {
        Ok(ToSqlOutput::from(self.to_string()))
    }
}

impl FromSql for ExecutorMode {
    fn column_result(value: ValueRef<'_>) -> FromSqlResult<Self> {
        value.as_str().map(|s| ExecutorMode::from(s.to_string()))
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TaskResultCode {
    Ok,
    RateLimited,
    Duplicated,
    Failed,
    Cancelled,
    TempError,
    PermissionDenied,
    NotFound,
    Blocked,
    PermError,
    #[serde(other)]
    Unknown,
}

impl ToString for TaskResultCode {
    fn to_string(&self) -> String {
        match self {
            TaskResultCode::Ok => "OK".to_string(),
            TaskResultCode::RateLimited => "RATE_LIMITED".to_string(),
            TaskResultCode::Duplicated => "DUPLICATED".to_string(),
            TaskResultCode::Failed => "FAILED".to_string(),
            TaskResultCode::Cancelled => "CANCELLED".to_string(),
            TaskResultCode::TempError => "TEMP_ERROR".to_string(),
            TaskResultCode::PermissionDenied => "PERMISSION_DENIED".to_string(),
            TaskResultCode::NotFound => "NOT_FOUND".to_string(),
            TaskResultCode::Blocked => "BLOCKED".to_string(),
            TaskResultCode::PermError => "PERM_ERROR".to_string(),
            TaskResultCode::Unknown => "UNKNOWN".to_string(),
        }
    }
}

impl From<String> for TaskResultCode {
    fn from(s: String) -> Self {
        match s.as_str() {
            "OK" => TaskResultCode::Ok,
            "RATE_LIMITED" => TaskResultCode::RateLimited,
            "DUPLICATED" => TaskResultCode::Duplicated,
            "FAILED" => TaskResultCode::Failed,
            "CANCELLED" => TaskResultCode::Cancelled,
            "TEMP_ERROR" => TaskResultCode::TempError,
            "PERMISSION_DENIED" => TaskResultCode::PermissionDenied,
            "NOT_FOUND" => TaskResultCode::NotFound,
            "BLOCKED" => TaskResultCode::Blocked,
            "PERM_ERROR" => TaskResultCode::PermError,
            _ => TaskResultCode::Unknown,
        }
    }
}

impl ToSql for TaskResultCode {
    fn to_sql(&self) -> Result<ToSqlOutput<'_>> {
        Ok(ToSqlOutput::from(self.to_string()))
    }
}

impl FromSql for TaskResultCode {
    fn column_result(value: ValueRef<'_>) -> FromSqlResult<Self> {
        value.as_str().map(|s| TaskResultCode::from(s.to_string()))
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskRow {
    pub id: String,             // 内部主键 (UUID)
    pub task_type: TaskType,
    pub comment_id: Option<String>,
    pub target_user_id: Option<String>,
    pub assign_account_id: String,
    pub status: TaskStatus,         // "NEW" | "READY" | "EXECUTING" | "DONE" | "FAILED"
    pub executor_mode: ExecutorMode,
    pub result_code: Option<TaskResultCode>, // "OK" | "RATE_LIMITED" | "DUPLICATED" | etc.
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
    pub platform: Option<MarketingPlatform>,
    pub source_target_id: Option<String>,
    pub region: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ListTasksQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub status: Option<TaskStatus>,
    pub task_type: Option<TaskType>,
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

// ==================== Enums ====================

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum MarketingPlatform {
    Douyin,
    #[serde(rename = "oceanengine")]
    OceanEngine,
    Public,
    #[serde(other)]
    Unknown,
}

impl ToString for MarketingPlatform {
    fn to_string(&self) -> String {
        match self {
            MarketingPlatform::Douyin => "douyin".to_string(),
            MarketingPlatform::OceanEngine => "oceanengine".to_string(),
            MarketingPlatform::Public => "public".to_string(),
            MarketingPlatform::Unknown => "unknown".to_string(),
        }
    }
}

impl From<String> for MarketingPlatform {
    fn from(s: String) -> Self {
        match s.as_str() {
            "douyin" => MarketingPlatform::Douyin,
            "oceanengine" => MarketingPlatform::OceanEngine,
            "public" => MarketingPlatform::Public,
            _ => MarketingPlatform::Unknown,
        }
    }
}

impl ToSql for MarketingPlatform {
    fn to_sql(&self) -> Result<ToSqlOutput<'_>> {
        Ok(ToSqlOutput::from(self.to_string()))
    }
}

impl FromSql for MarketingPlatform {
    fn column_result(value: ValueRef<'_>) -> FromSqlResult<Self> {
        value.as_str().map(|s| MarketingPlatform::from(s.to_string()))
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum TargetType {
    Video,
    Account,
    #[serde(other)]
    Unknown,
}

impl ToString for TargetType {
    fn to_string(&self) -> String {
        match self {
            TargetType::Video => "video".to_string(),
            TargetType::Account => "account".to_string(),
            TargetType::Unknown => "unknown".to_string(),
        }
    }
}

impl From<String> for TargetType {
    fn from(s: String) -> Self {
        match s.as_str() {
            "video" => TargetType::Video,
            "account" => TargetType::Account,
            _ => TargetType::Unknown,
        }
    }
}

impl ToSql for TargetType {
    fn to_sql(&self) -> Result<ToSqlOutput<'_>> {
        Ok(ToSqlOutput::from(self.to_string()))
    }
}

impl FromSql for TargetType {
    fn column_result(value: ValueRef<'_>) -> FromSqlResult<Self> {
        value.as_str().map(|s| TargetType::from(s.to_string()))
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum TargetSource {
    Manual,
    Csv,
    Whitelist,
    Ads,
    #[serde(other)]
    Unknown,
}

impl ToString for TargetSource {
    fn to_string(&self) -> String {
        match self {
            TargetSource::Manual => "manual".to_string(),
            TargetSource::Csv => "csv".to_string(),
            TargetSource::Whitelist => "whitelist".to_string(),
            TargetSource::Ads => "ads".to_string(),
            TargetSource::Unknown => "unknown".to_string(),
        }
    }
}

impl From<String> for TargetSource {
    fn from(s: String) -> Self {
        match s.as_str() {
            "manual" => TargetSource::Manual,
            "csv" => TargetSource::Csv,
            "whitelist" => TargetSource::Whitelist,
            "ads" => TargetSource::Ads,
            _ => TargetSource::Unknown,
        }
    }
}

impl ToSql for TargetSource {
    fn to_sql(&self) -> Result<ToSqlOutput<'_>> {
        Ok(ToSqlOutput::from(self.to_string()))
    }
}

impl FromSql for TargetSource {
    fn column_result(value: ValueRef<'_>) -> FromSqlResult<Self> {
        value.as_str().map(|s| TargetSource::from(s.to_string()))
    }
}
