// src-tauri/src/services/batch_analysis.rs
// module: lead-hunt | layer: services | role: 批量AI分析服务
// summary: 实现批量评论分析的并发处理、重试机制和进度事件

use crate::ai;
use crate::db;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH, Duration};
use tauri::{AppHandle, Emitter};
use tokio::time::sleep;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchAnalysisRequest {
    /// 评论ID列表
    pub comment_ids: Vec<String>,
    /// 批次ID（用于跟踪进度）
    pub batch_id: String,
    /// 并发数（可选，使用设置中的默认值）
    pub concurrency: Option<u32>,
    /// 最大重试次数（可选，使用设置中的默认值）
    pub max_retries: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchAnalysisProgress {
    pub batch_id: String,
    pub total: usize,
    pub processed: usize,
    pub successful: usize,
    pub failed: usize,
    pub current_comment: Option<String>,
    pub status: String, // "processing" | "completed" | "failed"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommentAnalysisResult {
    pub comment_id: String,
    pub success: bool,
    pub intent: Option<String>,
    pub confidence: Option<f64>,
    pub entities: Option<serde_json::Value>,
    pub reply_suggestion: Option<String>,
    pub tags: Option<Vec<String>>,
    pub error: Option<String>,
    pub attempts: u32,
}

/// 批量分析服务
pub struct BatchAnalysisService {
    app_handle: AppHandle,
}

impl BatchAnalysisService {
    pub fn new(app_handle: AppHandle) -> Self {
        Self { app_handle }
    }

    /// 启动批量分析任务
    pub async fn start_batch_analysis(
        &self,
        request: BatchAnalysisRequest,
    ) -> anyhow::Result<()> {
        let app_handle = self.app_handle.clone();
        
        // 在后台任务中执行批量分析
        tauri::async_runtime::spawn(async move {
            if let Err(e) = Self::execute_batch_analysis(app_handle, request).await {
                eprintln!("[BatchAnalysis] 批量分析失败: {}", e);
            }
        });

        Ok(())
    }

    /// 执行批量分析的核心逻辑
    async fn execute_batch_analysis(
        app_handle: AppHandle,
        request: BatchAnalysisRequest,
    ) -> anyhow::Result<()> {
        let batch_id = request.batch_id.clone();
        let comment_ids = request.comment_ids.clone();
        
        // 获取配置
        let ai_settings = ai::config::load_settings();
        let concurrency = request.concurrency.unwrap_or(ai_settings.concurrency);
        let max_retries = request.max_retries.unwrap_or(3); // 默认3次重试

        println!("[BatchAnalysis] 开始批量分析: batch_id={}, comments={}, concurrency={}", 
                batch_id, comment_ids.len(), concurrency);

        // 发送开始事件
        let progress = BatchAnalysisProgress {
            batch_id: batch_id.clone(),
            total: comment_ids.len(),
            processed: 0,
            successful: 0,
            failed: 0,
            current_comment: None,
            status: "processing".to_string(),
        };
        Self::emit_progress(&app_handle, &progress).await;

        // 获取数据库连接
        let conn = db::get_connection(&app_handle)?;
        
        // 加载所有评论数据
        let mut comments = Vec::new();
        for comment_id in &comment_ids {
            if let Some(comment) = db::lead_comments::find_by_id(&conn, comment_id)? {
                comments.push(comment);
            }
        }

        // 并发处理评论分析
        let results = Self::analyze_comments_concurrently(
            app_handle.clone(),
            comments,
            concurrency,
            max_retries,
            batch_id.clone(),
        ).await;

        // 保存分析结果到数据库
        let conn = db::get_connection(&app_handle)?;
        let mut successful_count = 0;
        let mut failed_count = 0;

        for result in &results {
            if result.success {
                if let (Some(intent), Some(confidence)) = (&result.intent, &result.confidence) {
                    let analysis = db::lead_analyses::LeadAnalysis {
                        id: None,
                        comment_id: result.comment_id.clone(),
                        intent: intent.clone(),
                        confidence: *confidence,
                        entities_json: result.entities.as_ref().map(|v| v.to_string()),
                        reply_suggestion: result.reply_suggestion.clone(),
                        tags_json: result.tags.as_ref().map(|tags| {
                            serde_json::to_string(tags).unwrap_or_default()
                        }),
                        created_at: SystemTime::now()
                            .duration_since(UNIX_EPOCH)
                            .unwrap()
                            .as_secs() as i64,
                    };

                    if let Err(e) = db::lead_analyses::insert(&conn, &analysis) {
                        eprintln!("[BatchAnalysis] 保存分析结果失败: {}", e);
                        failed_count += 1;
                    } else {
                        successful_count += 1;
                    }
                }
            } else {
                failed_count += 1;
            }
        }

        // 发送完成事件
        let final_progress = BatchAnalysisProgress {
            batch_id: batch_id.clone(),
            total: comment_ids.len(),
            processed: comment_ids.len(),
            successful: successful_count,
            failed: failed_count,
            current_comment: None,
            status: if failed_count == 0 { "completed" } else { "partial" }.to_string(),
        };
        Self::emit_progress(&app_handle, &final_progress).await;

        println!("[BatchAnalysis] 批量分析完成: successful={}, failed={}", 
                successful_count, failed_count);

        Ok(())
    }

    /// 并发分析评论
    async fn analyze_comments_concurrently(
        app_handle: AppHandle,
        comments: Vec<db::lead_comments::LeadComment>,
        concurrency: u32,
        max_retries: u32,
        batch_id: String,
    ) -> Vec<CommentAnalysisResult> {
        use futures::stream::{self, StreamExt};
        
        let app_handle = Arc::new(app_handle);
        let batch_id = Arc::new(batch_id);
        let total_comments = comments.len();
        let processed_count = Arc::new(tokio::sync::Mutex::new(0));

        let results = stream::iter(comments.into_iter().enumerate())
            .map(|(_index, comment)| {
                let app_handle = app_handle.clone();
                let batch_id = batch_id.clone();
                let processed_count = processed_count.clone();
                
                async move {
                    let result = Self::analyze_single_comment_with_retry(
                        comment.clone(),
                        max_retries,
                        app_handle.as_ref(),
                    ).await;

                    // 更新进度
                    {
                        let mut count = processed_count.lock().await;
                        *count += 1;
                        let processed = *count;
                        
                        let progress = BatchAnalysisProgress {
                            batch_id: batch_id.as_str().to_string(),
                            total: total_comments,
                            processed,
                            successful: 0, // 这里暂不计算，最后统计
                            failed: 0,
                            current_comment: Some(format!("{} ({})", comment.author, comment.content.chars().take(20).collect::<String>())),
                            status: "processing".to_string(),
                        };
                        
                        Self::emit_progress(app_handle.as_ref(), &progress).await;
                    }

                    result
                }
            })
            .buffer_unordered(concurrency as usize) // 控制并发数
            .collect()
            .await;

        results
    }

    /// 分析单条评论，支持重试
    async fn analyze_single_comment_with_retry(
        comment: db::lead_comments::LeadComment,
        max_retries: u32,
        app_handle: &AppHandle,
    ) -> CommentAnalysisResult {
        for attempt in 1..=max_retries {
            match Self::analyze_single_comment(&comment, app_handle).await {
                Ok(result) => {
                    return CommentAnalysisResult {
                        comment_id: comment.id,
                        success: true,
                        intent: Some(result.intent),
                        confidence: Some(result.confidence),
                        entities: result.entities,
                        reply_suggestion: result.reply_suggestion,
                        tags: result.tags,
                        error: None,
                        attempts: attempt,
                    };
                }
                Err(e) => {
                    eprintln!("[BatchAnalysis] 分析失败 (attempt {}/{}): {}", attempt, max_retries, e);
                    
                    if attempt < max_retries {
                        // 指数退避：2^attempt 秒，最多8秒
                        let backoff_seconds = (2_u64.pow(attempt)).min(8);
                        sleep(Duration::from_secs(backoff_seconds)).await;
                    }
                }
            }
        }

        // 所有重试都失败了
        CommentAnalysisResult {
            comment_id: comment.id,
            success: false,
            intent: None,
            confidence: None,
            entities: None,
            reply_suggestion: None,
            tags: None,
            error: Some("所有重试都失败".to_string()),
            attempts: max_retries,
        }
    }

    /// 分析单条评论（调用AI服务）
    async fn analyze_single_comment(
        comment: &db::lead_comments::LeadComment,
        _app_handle: &AppHandle,
    ) -> anyhow::Result<SingleAnalysisResult> {
        // 构造分析请求
        let prompt = format!(
            "请分析以下评论的意图和情感，并生成合适的回复建议。\n\n平台: {}\n作者: {}\n评论: {}\n\n请返回JSON格式：{{\"intent\": \"意图\", \"confidence\": 0.95, \"entities\": {{}}, \"reply_suggestion\": \"建议回复\", \"tags\": [\"标签1\", \"标签2\"]}}",
            comment.platform, 
            comment.author, 
            comment.content
        );

        // 调用AI分析
        let ai_settings = ai::config::load_settings();
        let ai_router = ai::router::AIRouter::new(ai_settings);
        
        let chat_request = crate::ai::types::ChatRequest {
            model: "gpt-3.5-turbo".to_string(), // 使用默认模型
            messages: vec![crate::ai::types::ChatMessage {
                role: "user".to_string(),
                content: prompt,
            }],
            tools: None,
            tool_choice: None,
            temperature: Some(0.7),
            stream: Some(false),
        };
        
        let response_value = ai_router.chat(chat_request, None::<fn(crate::ai::provider::ChatChunk)>).await
            .map_err(|e| anyhow::anyhow!("AI分析失败: {}", e))?;
            
        // 从响应中提取文本内容
        let response = response_value.get("content")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        // 解析AI响应
        Self::parse_ai_response(&response)
    }

    /// 解析AI响应
    fn parse_ai_response(response: &str) -> anyhow::Result<SingleAnalysisResult> {
        // 尝试提取JSON部分
        let json_str = if let Some(start) = response.find('{') {
            if let Some(end) = response.rfind('}') {
                &response[start..=end]
            } else {
                response
            }
        } else {
            response
        };

        // 解析JSON
        match serde_json::from_str::<serde_json::Value>(json_str) {
            Ok(json) => Ok(SingleAnalysisResult {
                intent: json.get("intent")
                    .and_then(|v| v.as_str())
                    .unwrap_or("未知")
                    .to_string(),
                confidence: json.get("confidence")
                    .and_then(|v| v.as_f64())
                    .unwrap_or(0.5),
                entities: json.get("entities").cloned(),
                reply_suggestion: json.get("reply_suggestion")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string()),
                tags: json.get("tags")
                    .and_then(|v| v.as_array())
                    .map(|arr| {
                        arr.iter()
                            .filter_map(|v| v.as_str().map(|s| s.to_string()))
                            .collect()
                    }),
            }),
            Err(_) => {
                // 如果JSON解析失败，使用默认值
                Ok(SingleAnalysisResult {
                    intent: "咨询".to_string(),
                    confidence: 0.3,
                    entities: None,
                    reply_suggestion: Some("感谢您的关注！".to_string()),
                    tags: Some(vec!["待处理".to_string()]),
                })
            }
        }
    }

    /// 发送进度事件
    async fn emit_progress(app_handle: &AppHandle, progress: &BatchAnalysisProgress) {
        if let Err(e) = app_handle.emit("ai://progress", progress) {
            eprintln!("[BatchAnalysis] 发送进度事件失败: {}", e);
        }
    }
}

#[derive(Debug, Clone)]
struct SingleAnalysisResult {
    intent: String,
    confidence: f64,
    entities: Option<serde_json::Value>,
    reply_suggestion: Option<String>,
    tags: Option<Vec<String>>,
}