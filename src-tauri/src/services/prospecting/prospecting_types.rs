// src-tauri/src/services/prospecting/types.rs
use rusqlite::types::{FromSql, FromSqlResult, ValueRef, ToSql, ToSqlOutput, Value, FromSqlError};
use rusqlite::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// 社交媒体平台
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SocialPlatform {
    Douyin,
    Xhs,
    Weibo,
    Kuaishou,
}

impl ToSql for SocialPlatform {
    fn to_sql(&self) -> Result<ToSqlOutput<'_>> {
        let s = serde_json::to_string(self).map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;
        Ok(ToSqlOutput::Owned(Value::Text(s)))
    }
}

impl FromSql for SocialPlatform {
    fn column_result(value: ValueRef<'_>) -> FromSqlResult<Self> {
        let s = value.as_str()?;
        serde_json::from_str(s).map_err(|e| FromSqlError::Other(Box::new(e)))
    }
}

/// 意图类型
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum IntentType {
    #[serde(rename = "询价")]
    Inquiry,
    #[serde(rename = "询地址")]
    Location,
    #[serde(rename = "售后")]
    AfterSales,
    #[serde(rename = "咨询")]
    Consultation,
    #[serde(rename = "购买")]
    Purchase,
    #[serde(rename = "比较")]
    Comparison,
    #[serde(rename = "无效")]
    Invalid,
}

impl ToSql for IntentType {
    fn to_sql(&self) -> Result<ToSqlOutput<'_>> {
        let s = serde_json::to_string(self).map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;
        Ok(ToSqlOutput::Owned(Value::Text(s)))
    }
}

impl FromSql for IntentType {
    fn column_result(value: ValueRef<'_>) -> FromSqlResult<Self> {
        let s = value.as_str()?;
        serde_json::from_str(s).map_err(|e| FromSqlError::Other(Box::new(e)))
    }
}

/// 原始评论数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RawComment {
    pub id: String,
    pub platform: SocialPlatform,
    #[serde(rename = "videoUrl")]
    pub video_url: Option<String>,
    pub author: String,
    pub content: String,
    pub timestamp: Option<i64>,
    #[serde(rename = "avatarUrl")]
    pub avatar_url: Option<String>,
    #[serde(rename = "likeCount")]
    pub like_count: Option<i32>,
    pub metadata: Option<HashMap<String, serde_json::Value>>,
}

/// 提取的实体信息
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Entities {
    pub product: Option<String>,
    pub quantity: Option<String>,
    pub location: Option<String>,
    pub contact: Option<String>,
    #[serde(rename = "priceRange")]
    pub price_range: Option<String>,
    pub brand: Option<String>,
    pub model: Option<String>,
}

/// AI分析结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisResult {
    #[serde(rename = "commentId")]
    pub comment_id: String,
    pub intent: IntentType,
    pub confidence: f64,
    pub entities: Entities,
    #[serde(rename = "suggestedReply")]
    pub suggested_reply: String,
    pub tags: Vec<String>,
    #[serde(rename = "analyzedAt")]
    pub analyzed_at: i64,
}

/// 完整的评论信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Comment {
    #[serde(flatten)]
    pub raw: RawComment,
    pub analysis: Option<AnalysisResult>,
    #[serde(rename = "isReplied")]
    pub is_replied: Option<bool>,
    #[serde(rename = "repliedAt")]
    pub replied_at: Option<i64>,
    #[serde(rename = "actualReply")]
    pub actual_reply: Option<String>,
}

/// 回复计划状态
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ReplyPlanStatus {
    Pending,
    Executing,
    Completed,
    Failed,
}

impl ToSql for ReplyPlanStatus {
    fn to_sql(&self) -> Result<ToSqlOutput<'_>> {
        let s = serde_json::to_string(self).map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;
        Ok(ToSqlOutput::Owned(Value::Text(s)))
    }
}

impl FromSql for ReplyPlanStatus {
    fn column_result(value: ValueRef<'_>) -> FromSqlResult<Self> {
        let s = value.as_str()?;
        serde_json::from_str(s).map_err(|e| FromSqlError::Other(Box::new(e)))
    }
}

/// 回复步骤类型
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ReplyStepType {
    OpenApp,
    NavigateToVideo,
    FindComment,
    InputReply,
    SendReply,
    #[serde(other)]
    Unknown,
}

/// 回复步骤状态
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ReplyStepStatus {
    Pending,
    Executing,
    Completed,
    Failed,
}

/// 回复步骤
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReplyStep {
    pub id: String,
    #[serde(rename = "type")]
    pub step_type: ReplyStepType, // open_app, navigate_to_video, find_comment, input_reply, send_reply
    pub description: String,
    pub params: HashMap<String, serde_json::Value>,
    pub status: ReplyStepStatus, // pending, executing, completed, failed
    pub error: Option<String>,
    pub duration: Option<i64>,
}

/// 回复计划
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReplyPlan {
    pub id: String,
    #[serde(rename = "commentId")]
    pub comment_id: String,
    pub platform: SocialPlatform,
    #[serde(rename = "videoUrl")]
    pub video_url: String,
    #[serde(rename = "targetAuthor")]
    pub target_author: String,
    #[serde(rename = "targetComment")]
    pub target_comment: String,
    #[serde(rename = "replyContent")]
    pub reply_content: String,
    pub steps: Vec<ReplyStep>,
    pub status: ReplyPlanStatus,
    #[serde(rename = "createdAt")]
    pub created_at: i64,
    #[serde(rename = "updatedAt")]
    pub updated_at: i64,
    #[serde(rename = "executedAt")]
    pub executed_at: Option<i64>,
    #[serde(rename = "completedAt")]
    pub completed_at: Option<i64>,
    pub error: Option<String>,
    #[serde(rename = "isSimulation")]
    pub is_simulation: bool,
}

/// 筛选条件
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CommentFilter {
    pub platform: Option<SocialPlatform>,
    pub intent: Option<IntentType>,
    #[serde(rename = "hasAnalysis")]
    pub has_analysis: Option<bool>,
}

/// 统计信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Statistics {
    #[serde(rename = "totalComments")]
    pub total_comments: i64,
    #[serde(rename = "analyzedComments")]
    pub analyzed_comments: i64,
    #[serde(rename = "intentDistribution")]
    pub intent_distribution: HashMap<String, i64>,
    #[serde(rename = "platformDistribution")]
    pub platform_distribution: HashMap<String, i64>,
    #[serde(rename = "replyPlans")]
    pub reply_plans: ReplyPlanStats,
}

/// 回复计划统计
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReplyPlanStats {
    pub total: i64,
    pub completed: i64,
    pub failed: i64,
    pub pending: i64,
}

/// 回复执行结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReplyExecutionResult {
    pub success: bool,
    #[serde(rename = "completedSteps")]
    pub completed_steps: usize,
    pub error: Option<String>,
}