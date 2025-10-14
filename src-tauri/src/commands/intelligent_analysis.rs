// src-tauri/src/commands/intelligent_analysis.rs
// 智能分析后端服务 - 负责元素智能分析、策略生成、事件通知

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager, Emitter};
use sha1::{Sha1, Digest};

// ============================================
// 类型定义
// ============================================

/// 元素选择上下文
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ElementSelectionContext {
    pub snapshot_id: String,
    pub element_path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub element_text: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub element_bounds: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub element_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub key_attributes: Option<HashMap<String, String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub container_info: Option<ContainerInfo>,
}

/// 容器信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainerInfo {
    pub container_type: String,
    pub container_path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub item_index: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub total_items: Option<u32>,
}

/// 分析任务配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisJobConfig {
    pub element_context: ElementSelectionContext,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub step_id: Option<String>,
    pub lock_container: bool,
    pub enable_smart_candidates: bool,
    pub enable_static_candidates: bool,
}

/// 分析任务状态
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AnalysisJobState {
    Queued,
    Running,
    Completed,
    Failed,
    Canceled,
}

/// 策略候选项
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StrategyCandidate {
    pub key: String,
    pub name: String,
    pub confidence: f32,
    pub description: String,
    pub variant: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub xpath: Option<String>,
    pub enabled: bool,
    pub is_recommended: bool,
}

/// 分析结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisResult {
    pub selection_hash: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub step_id: Option<String>,
    pub smart_candidates: Vec<StrategyCandidate>,
    pub static_candidates: Vec<StrategyCandidate>,
    pub recommended_key: String,
    pub recommended_confidence: f32,
    pub fallback_strategy: StrategyCandidate,
}

/// 分析作业响应
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisJobResponse {
    pub job_id: String,
    pub selection_hash: String,
    pub state: AnalysisJobState,
}

// ============================================
// 事件载荷 (Event Payloads)
// ============================================

/// 分析进度事件
#[derive(Debug, Clone, Serialize)]
pub struct AnalysisProgressEvent {
    pub job_id: String,
    pub progress: u8,
    pub current_step: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub estimated_time_left: Option<u64>,
}

/// 分析完成事件
#[derive(Debug, Clone, Serialize)]
pub struct AnalysisDoneEvent {
    pub job_id: String,
    pub selection_hash: String,
    pub result: AnalysisResult,
}

/// 分析错误事件
#[derive(Debug, Clone, Serialize)]
pub struct AnalysisErrorEvent {
    pub job_id: String,
    pub selection_hash: String,
    pub error: String,
}

// ============================================
// Selection Hash 计算 (与前端保持一致)
// ============================================

/// 计算 selection_hash
/// 
/// 组成规则 (与前端 TypeScript 实现一致):
/// - snapshot:${snapshotId}
/// - path:${elementPath}
/// - type:${elementType}
/// - text:${textHash}
/// - bounds:${elementBounds}
/// - attrs:${normalizedAttrs}
/// - container:${containerType}:${containerPath}
/// - index:${itemIndex}
pub fn calculate_selection_hash(context: &ElementSelectionContext) -> String {
    let mut components = Vec::new();
    
    // 1. Snapshot ID
    components.push(format!("snapshot:{}", context.snapshot_id));
    
    // 2. Element Path (核心标识)
    components.push(format!("path:{}", context.element_path));
    
    // 3. Element Type
    if let Some(ref element_type) = context.element_type {
        components.push(format!("type:{}", element_type));
    }
    
    // 4. Text Hash
    if let Some(ref text) = context.element_text {
        let text_hash = calculate_text_hash(text);
        components.push(format!("text:{}", text_hash));
    }
    
    // 5. Bounds
    if let Some(ref bounds) = context.element_bounds {
        components.push(format!("bounds:{}", bounds));
    }
    
    // 6. Key Attributes (标准化并排序)
    if let Some(ref attrs) = context.key_attributes {
        let mut attr_pairs: Vec<_> = attrs.iter().collect();
        attr_pairs.sort_by_key(|(k, _)| k.as_str());
        let attr_string: String = attr_pairs
            .iter()
            .map(|(k, v)| format!("{}={}", k, normalize_attribute_value(v)))
            .collect::<Vec<_>>()
            .join("&");
        if !attr_string.is_empty() {
            components.push(format!("attrs:{}", attr_string));
        }
    }
    
    // 7. Container Info
    if let Some(ref container) = context.container_info {
        components.push(format!(
            "container:{}:{}",
            container.container_type, container.container_path
        ));
        if let Some(index) = container.item_index {
            components.push(format!("index:{}", index));
        }
    }
    
    // 组合并计算哈希
    let combined = components.join("|");
    calculate_text_hash(&combined)
}

/// 计算文本哈希 (使用 SHA1)
fn calculate_text_hash(text: &str) -> String {
    let mut hasher = Sha1::new();
    hasher.update(text.as_bytes());
    let result = hasher.finalize();
    format!("{:x}", result)[..12].to_string()
}

/// 标准化属性值
fn normalize_attribute_value(value: &str) -> String {
    value.trim().to_lowercase()
}

// ============================================
// 智能分析服务
// ============================================

/// 智能分析服务
pub struct IntelligentAnalysisService {
    active_jobs: Arc<Mutex<HashMap<String, AnalysisJobConfig>>>,
}

impl IntelligentAnalysisService {
    pub fn new() -> Self {
        Self {
            active_jobs: Arc::new(Mutex::new(HashMap::new())),
        }
    }
    
    /// 启动智能分析
    pub async fn start_analysis(
        &self,
        app_handle: AppHandle,
        config: AnalysisJobConfig,
    ) -> Result<AnalysisJobResponse, String> {
        // 1. 计算 selection_hash
        let selection_hash = calculate_selection_hash(&config.element_context);
        
        // 2. 生成 job_id
        let job_id = uuid::Uuid::new_v4().to_string();
        
        tracing::info!(
            "🚀 启动智能分析: job_id={}, selection_hash={}, element_path={}",
            job_id,
            selection_hash,
            config.element_context.element_path
        );
        
        // 3. 保存任务
        {
            let mut jobs = self.active_jobs.lock().unwrap();
            jobs.insert(job_id.clone(), config.clone());
        }
        
        // 4. 启动后台分析任务
        let app_handle_clone = app_handle.clone();
        let job_id_clone = job_id.clone();
        let selection_hash_clone = selection_hash.clone();
        let active_jobs_clone = self.active_jobs.clone();
        
        tauri::async_runtime::spawn(async move {
            // 执行分析流程
            if let Err(e) = execute_analysis_workflow(
                app_handle_clone.clone(),
                job_id_clone.clone(),
                selection_hash_clone.clone(),
                config,
            ).await {
                // 发送错误事件
                tracing::error!("❌ 分析失败: job_id={}, error={}", job_id_clone, e);
                let _ = app_handle_clone.emit("analysis:error", AnalysisErrorEvent {
                    job_id: job_id_clone.clone(),
                    selection_hash: selection_hash_clone.clone(),
                    error: e,
                });
            }
            
            // 清理任务
            let mut jobs = active_jobs_clone.lock().unwrap();
            jobs.remove(&job_id_clone);
        });
        
        Ok(AnalysisJobResponse {
            job_id,
            selection_hash,
            state: AnalysisJobState::Running,
        })
    }
    
    /// 取消分析
    pub fn cancel_analysis(&self, job_id: &str) -> Result<(), String> {
        let mut jobs = self.active_jobs.lock().unwrap();
        if jobs.remove(job_id).is_some() {
            tracing::info!("⏹️ 取消分析: job_id={}", job_id);
            Ok(())
        } else {
            Err(format!("任务不存在: {}", job_id))
        }
    }
}

/// 执行分析工作流
async fn execute_analysis_workflow(
    app_handle: AppHandle,
    job_id: String,
    selection_hash: String,
    config: AnalysisJobConfig,
) -> Result<(), String> {
    tracing::info!("📊 开始分析工作流: job_id={}", job_id);
    
    // Step 1: 初始化 (10%)
    emit_progress(&app_handle, &job_id, 10, "初始化分析环境").await;
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    
    // Step 2: XML解析 (30%)
    emit_progress(&app_handle, &job_id, 30, "解析页面结构").await;
    tokio::time::sleep(tokio::time::Duration::from_millis(800)).await;
    
    // Step 3: 智能策略生成 (60%)
    emit_progress(&app_handle, &job_id, 60, "生成智能策略").await;
    tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;
    
    // Step 4: 策略评分 (80%)
    emit_progress(&app_handle, &job_id, 80, "评估策略质量").await;
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    
    // Step 5: 完成 (100%)
    emit_progress(&app_handle, &job_id, 95, "生成分析报告").await;
    
    // 生成分析结果 (TODO: 接入真实的策略生成服务)
    let result = generate_mock_analysis_result(&selection_hash, &config);
    
    tracing::info!("✅ 分析完成: job_id={}, 推荐策略={}", job_id, result.recommended_key);
    
    // 发送完成事件
    app_handle.emit("analysis:done", AnalysisDoneEvent {
        job_id,
        selection_hash,
        result,
    }).map_err(|e| e.to_string())?;
    
    Ok(())
}

/// 发送进度事件
async fn emit_progress(app_handle: &AppHandle, job_id: &str, progress: u8, step: &str) {
    let _ = app_handle.emit("analysis:progress", AnalysisProgressEvent {
        job_id: job_id.to_string(),
        progress,
        current_step: step.to_string(),
        estimated_time_left: Some(((100 - progress) as u64) * 50), // 估算剩余时间
    });
    
    tracing::debug!("📊 进度更新: job_id={}, progress={}%, step={}", job_id, progress, step);
}

/// 生成模拟分析结果 (临时实现,后续接入真实服务)
fn generate_mock_analysis_result(
    selection_hash: &str,
    config: &AnalysisJobConfig,
) -> AnalysisResult {
    let smart_candidates = vec![
        StrategyCandidate {
            key: "self_anchor".to_string(),
            name: "自锚定策略".to_string(),
            confidence: 95.0,
            description: "基于 resource-id 直接定位".to_string(),
            variant: "self_anchor".to_string(),
            xpath: Some("//*[@resource-id='com.example:id/button']".to_string()),
            enabled: true,
            is_recommended: true,
        },
        StrategyCandidate {
            key: "child_driven".to_string(),
            name: "子元素驱动策略".to_string(),
            confidence: 85.0,
            description: "通过子元素特征定位".to_string(),
            variant: "child_driven".to_string(),
            xpath: Some("//*[contains(@text,'确定')]".to_string()),
            enabled: true,
            is_recommended: false,
        },
        StrategyCandidate {
            key: "region_scoped".to_string(),
            name: "区域约束策略".to_string(),
            confidence: 78.0,
            description: "限定在特定容器区域内".to_string(),
            variant: "region_scoped".to_string(),
            xpath: Some("//*[@class='Container']//*[@class='Button']".to_string()),
            enabled: true,
            is_recommended: false,
        },
    ];
    
    let fallback = StrategyCandidate {
        key: "index_fallback".to_string(),
        name: "索引兜底策略".to_string(),
        confidence: 60.0,
        description: "基于位置索引定位".to_string(),
        variant: "index_fallback".to_string(),
        xpath: Some("(//*[@class='Button'])[3]".to_string()),
        enabled: true,
        is_recommended: false,
    };
    
    AnalysisResult {
        selection_hash: selection_hash.to_string(),
        step_id: config.step_id.clone(),
        smart_candidates: smart_candidates.clone(),
        static_candidates: vec![],
        recommended_key: "self_anchor".to_string(),
        recommended_confidence: 95.0,
        fallback_strategy: fallback,
    }
}

// ============================================
// Tauri 命令
// ============================================

lazy_static::lazy_static! {
    static ref ANALYSIS_SERVICE: IntelligentAnalysisService = IntelligentAnalysisService::new();
}

/// 启动智能分析
#[tauri::command]
pub async fn start_intelligent_analysis(
    app_handle: AppHandle,
    config: AnalysisJobConfig,
) -> Result<AnalysisJobResponse, String> {
    ANALYSIS_SERVICE.start_analysis(app_handle, config).await
}

/// 取消智能分析
#[tauri::command]
pub async fn cancel_intelligent_analysis(job_id: String) -> Result<(), String> {
    ANALYSIS_SERVICE.cancel_analysis(&job_id)
}

/// 绑定分析结果到步骤卡
#[tauri::command]
pub async fn bind_analysis_result_to_step(
    step_id: String,
    result: AnalysisResult,
) -> Result<(), String> {
    // TODO: 实现将分析结果保存到步骤卡数据
    tracing::info!(
        "📌 绑定分析结果到步骤: step_id={}, recommended={}",
        step_id,
        result.recommended_key
    );
    Ok(())
}
