// src-tauri/src/commands/intelligent_analysis.rs
// 智能分析后端服务 - 负责元素智能分析、策略生成、事件通知
//
// 🔄 [V2 系统 - 计划升级到 V3]
//
// 当前状态：V2 智能分析命令，负责单步分析和策略生成
// V3 升级路径：
//   - V3 执行引擎：src-tauri/src/exec/v3/ (已实现)
//   - V3 命令：execute_single_step_test_v3, execute_chain_test_v3
//
// V2 vs V3 架构对比：
//
//   【V2 架构】
//   start_intelligent_analysis(config) 
//     → 分析元素 
//     → 生成候选策略 
//     → 发送 analysis:done 事件
//     → 前端显式调用 bind_analysis_result_to_step 绑定
//
//   【V3 架构】
//   execute_chain_test_v3(spec)
//     → 支持 by-ref 模式（只传 analysisId，从缓存读取）
//     → 智能自动链：短路（跳过低置信度）+ 回退（失败尝试备选）
//     → 统一事件系统：analysis:progress (Phase枚举), analysis:complete
//     → 自动缓存结果，无需显式绑定
//
// 关键改进：
//   ✅ V3 减少 90% 数据传输（by-ref 模式）
//   ✅ V3 智能短路+回退算法（更稳定）
//   ✅ V3 统一三条链路（单步/自动链/静态）
//   ✅ V3 类型安全（增强类型自动映射）
//
// 迁移策略：
//   Phase 1: V2 和 V3 命令共存于 main.rs
//   Phase 2: 前端创建 V3 服务层和 Hook
//   Phase 3: 特性开关控制 V2/V3 切换
//   Phase 4: 灰度测试，逐步迁移用户
//   Phase 5: V3 稳定后标记 V2 为 @deprecated
//
// 详见：EXECUTION_V2_MIGRATION_GUIDE.md
// ============================================

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::AppHandle;
use sha1::{Sha1, Digest};
use crate::infrastructure::events::emit_and_trace;
use crate::engine::{StrategyEngine, AnalysisContext, Evidence, ContainerInfo as EngineContainerInfo};

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
    // 🔥 关系锚点策略增强字段
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "siblingTexts")]
    pub sibling_texts: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "parentElement")]
    pub parent_element: Option<ParentElementInfo>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "childrenTexts")]
    pub children_texts: Option<Vec<String>>,
}

/// 父元素信息（用于关系锚点策略）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParentElementInfo {
    pub content_desc: String,
    pub text: String,
    pub resource_id: String,
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
    
    // 完整的SelectorStack信息
    #[serde(skip_serializing_if = "Option::is_none")]
    pub xpath: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resource_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub class_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content_desc: Option<String>,
    
    pub enabled: bool,
    pub is_recommended: bool,
    
    // 🆕 智能选择配置 (用于批量模式)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub selection_mode: Option<String>, // "first" | "last" | "match-original" | "random" | "all"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub batch_config: Option<serde_json::Value>, // 批量执行配置
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

/// 绑定分析结果请求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BindAnalysisResultRequest {
    pub step_id: String,
    pub analysis_result: AnalysisResult,
    pub selected_strategy_key: String,
    pub overwrite_existing: bool,
}

/// 绑定分析结果响应
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BindAnalysisResultResponse {
    pub success: bool,
    pub message: String,
    pub step_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bound_strategy: Option<StrategyCandidate>,
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
    /// 整体置信度 (0.0-1.0)
    pub confidence: f32,
    /// 置信度证据分项
    pub evidence: Evidence,
    /// 分析来源：'single' 或 'chain'
    pub origin: String,
    /// 可选的元素ID和卡片ID (前端路由用)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub element_uid: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub card_id: Option<String>,
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
                let _ = emit_and_trace(&app_handle_clone, "analysis:error", &AnalysisErrorEvent {
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
    
    // TODO: 替换为基于真实工作量的进度计算
    // 当前使用模拟的阶段性进度，应基于实际的分析任务复杂度动态计算
    
    // Step 1: 初始化分析环境
    emit_progress(&app_handle, &job_id, 5, "初始化分析环境").await;
    tokio::time::sleep(tokio::time::Duration::from_millis(200)).await;
    
    // Step 2: XML解析与结构分析 (主要工作量)
    emit_progress(&app_handle, &job_id, 25, "解析页面结构").await;
    tokio::time::sleep(tokio::time::Duration::from_millis(800)).await;
    
    // Step 3: 智能策略生成 (核心算法)
    emit_progress(&app_handle, &job_id, 65, "生成智能策略").await;
    tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;
    
    // Step 4: 策略评分与优选
    emit_progress(&app_handle, &job_id, 85, "评估策略质量").await;
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    
    // Step 5: 生成最终分析报告
    emit_progress(&app_handle, &job_id, 95, "生成分析报告").await;
    tokio::time::sleep(tokio::time::Duration::from_millis(300)).await;
    
    // 🆕 使用共用引擎生成真实的分析结果
    let engine = StrategyEngine::new();
    let analysis_context = build_analysis_context(&config.element_context);
    let step_result = engine.analyze_single_step(&analysis_context);
    
    // 转换为旧版AnalysisResult格式 (兼容现有代码)
    let result = convert_step_result_to_analysis_result(&step_result, &selection_hash, &config);
    
    // Step 6: 完成 (100%) - 确保 UI 进度条到 100%
    emit_progress(&app_handle, &job_id, 100, "分析完成").await;
    
    tracing::info!(
        "✅ 分析完成: job_id={}, 推荐策略={}, 置信度={:.1}%", 
        job_id, result.recommended_key, step_result.confidence * 100.0
    );
    
    // 🆕 发送增强的完成事件 (包含置信度和证据)
    emit_and_trace(&app_handle, "analysis:done", &AnalysisDoneEvent {
        job_id: job_id.clone(),
        selection_hash: selection_hash.clone(),
        result,
        confidence: step_result.confidence,
        evidence: step_result.evidence,
        origin: "single".to_string(), // 单步分析
        element_uid: Some(config.element_context.element_path.clone()),
        card_id: config.step_id.clone(),
    }).map_err(|e| e.to_string())?;
    
    Ok(())
}

/// 发送进度事件
async fn emit_progress(app_handle: &AppHandle, job_id: &str, progress: u8, step: &str) {
    let _ = emit_and_trace(app_handle, "analysis:progress", &AnalysisProgressEvent {
        job_id: job_id.to_string(),
        progress,
        current_step: step.to_string(),
        estimated_time_left: Some(((100 - progress) as u64) * 50), // 估算剩余时间
    });
    
    tracing::debug!("📊 进度更新: job_id={}, progress={}%, step={}", job_id, progress, step);
}

/// 构建分析上下文 (从ElementSelectionContext转换为AnalysisContext)
fn build_analysis_context(element_context: &ElementSelectionContext) -> AnalysisContext {
    AnalysisContext {
        element_path: element_context.element_path.clone(),
        element_text: element_context.element_text.clone(),
        element_type: element_context.element_type.clone(),
        resource_id: element_context.key_attributes
            .as_ref()
            .and_then(|attrs| attrs.get("resource-id"))
            .cloned(),
        class_name: element_context.key_attributes
            .as_ref()
            .and_then(|attrs| attrs.get("class"))
            .cloned(),
        bounds: element_context.element_bounds.clone(),
        content_desc: element_context.key_attributes  // 🆕 提取 content-desc
            .as_ref()
            .and_then(|attrs| attrs.get("content-desc"))
            .cloned(),
        container_info: element_context.container_info.as_ref().map(|ci| EngineContainerInfo {
            container_type: ci.container_type.clone(),
            container_path: ci.container_path.clone(),
            item_index: ci.item_index,
            total_items: ci.total_items,
        }),
    }
}

/// 转换StepResult为AnalysisResult (兼容现有代码)
fn convert_step_result_to_analysis_result(
    step_result: &crate::engine::strategy_engine::StepResult,
    selection_hash: &str,
    config: &AnalysisJobConfig,
) -> AnalysisResult {
    let smart_candidates: Vec<StrategyCandidate> = step_result.candidates.iter().map(|c| {
        StrategyCandidate {
            key: c.key.clone(),
            name: c.name.clone(),
            confidence: c.confidence * 100.0, // 转换为百分比
            description: c.description.clone(),
            variant: c.variant.clone(),
            xpath: c.xpath.clone(),
            // 从AnalysisContext提取完整选择器信息
            text: config.element_context.element_text.clone(),
            resource_id: config.element_context.key_attributes.as_ref()
                .and_then(|attrs| attrs.get("resource-id"))
                .cloned(),
            class_name: config.element_context.key_attributes.as_ref()
                .and_then(|attrs| attrs.get("class"))
                .cloned(),
            content_desc: config.element_context.key_attributes.as_ref()
                .and_then(|attrs| attrs.get("content-desc"))
                .cloned(),
            enabled: true,
            is_recommended: c.key == step_result.recommended,
            selection_mode: None,  // 智能分析结果不带选择模式
            batch_config: None,
        }
    }).collect();
    
    let fallback = smart_candidates.last().unwrap_or(&StrategyCandidate {
        key: "emergency_fallback".to_string(),
        name: "应急兜底策略".to_string(),
        confidence: 50.0,
        description: "应急兜底定位".to_string(),
        variant: "emergency_fallback".to_string(),
        xpath: Some(config.element_context.element_path.clone()),
        text: config.element_context.element_text.clone(),
        resource_id: config.element_context.key_attributes.as_ref()
            .and_then(|attrs| attrs.get("resource-id"))
            .cloned(),
        class_name: config.element_context.key_attributes.as_ref()
            .and_then(|attrs| attrs.get("class"))
            .cloned(),
        content_desc: config.element_context.key_attributes.as_ref()
            .and_then(|attrs| attrs.get("content-desc"))
            .cloned(),
        enabled: true,
        is_recommended: false,
        selection_mode: None,
        batch_config: None,
    }).clone();
    
    AnalysisResult {
        selection_hash: selection_hash.to_string(),
        step_id: config.step_id.clone(),
        smart_candidates,
        static_candidates: vec![],
        recommended_key: step_result.recommended.clone(),
        recommended_confidence: step_result.confidence * 100.0, // 转换为百分比
        fallback_strategy: fallback,
    }
}

/// 生成模拟分析结果 (临时实现,后续接入真实服务)
/// 🚨 注意：此函数已被上面的共用引擎替代，保留用于向后兼容
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
            text: config.element_context.element_text.clone(),
            resource_id: Some("com.example:id/button".to_string()),
            class_name: None,
            content_desc: None,
            enabled: true,
            is_recommended: true,
            selection_mode: None,
            batch_config: None,
        },
        StrategyCandidate {
            key: "child_driven".to_string(),
            name: "子元素驱动策略".to_string(),
            confidence: 85.0,
            description: "通过子元素特征定位".to_string(),
            variant: "child_driven".to_string(),
            xpath: Some("//*[contains(@text,'确定')]".to_string()),
            text: Some("确定".to_string()),
            resource_id: None,
            class_name: None,
            content_desc: None,
            enabled: true,
            is_recommended: false,
            selection_mode: None,
            batch_config: None,
        },
        StrategyCandidate {
            key: "region_scoped".to_string(),
            name: "区域约束策略".to_string(),
            confidence: 78.0,
            description: "限定在特定容器区域内".to_string(),
            variant: "region_scoped".to_string(),
            xpath: Some("//*[@class='Container']//*[@class='Button']".to_string()),
            text: None,
            resource_id: None,
            class_name: Some("Button".to_string()),
            content_desc: None,
            enabled: true,
            is_recommended: false,
            selection_mode: None,
            batch_config: None,
        },
    ];
    
    let fallback = StrategyCandidate {
        key: "index_fallback".to_string(),
        name: "索引兜底策略".to_string(),
        confidence: 60.0,
        description: "基于位置索引定位".to_string(),
        variant: "index_fallback".to_string(),
        xpath: Some("//*[@class='Button'][3]".to_string()),
        text: None,
        resource_id: None,
        class_name: Some("Button".to_string()),
        content_desc: None,
        enabled: true,
        is_recommended: false,
        selection_mode: None,
        batch_config: None,
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
    /// 全局步骤策略存储 (内存缓存)
    /// Key: step_id, Value: (StrategyCandidate, timestamp)
    static ref STEP_STRATEGY_STORE: Arc<Mutex<HashMap<String, (StrategyCandidate, i64)>>> = 
        Arc::new(Mutex::new(HashMap::new()));
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
    request: BindAnalysisResultRequest,
) -> Result<BindAnalysisResultResponse, String> {
    let BindAnalysisResultRequest {
        step_id,
        analysis_result,
        selected_strategy_key,
        overwrite_existing,
    } = request;
    
    // 1. 查找选中的策略
    let selected_strategy = analysis_result
        .smart_candidates
        .iter()
        .chain(analysis_result.static_candidates.iter())
        .find(|s| s.key == selected_strategy_key)
        .cloned();
    
    let strategy = match selected_strategy {
        Some(s) => s,
        None => {
            return Err(format!(
                "未找到策略 key={} (available: {:?})",
                selected_strategy_key,
                analysis_result
                    .smart_candidates
                    .iter()
                    .map(|s| s.key.as_str())
                    .collect::<Vec<_>>()
            ));
        }
    };
    
    // 2. 检查是否已存在策略
    let mut store = STEP_STRATEGY_STORE.lock().map_err(|e| {
        format!("锁定步骤策略存储失败: {}", e)
    })?;
    
    let has_existing = store.contains_key(&step_id);
    
    if has_existing && !overwrite_existing {
        return Ok(BindAnalysisResultResponse {
            success: false,
            message: format!("步骤 {} 已存在策略,且未允许覆盖", step_id),
            step_id: step_id.clone(),
            bound_strategy: None,
        });
    }
    
    // 3. 保存策略到存储
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;
    
    store.insert(step_id.clone(), (strategy.clone(), timestamp));
    
    tracing::info!(
        "✅ 绑定策略到步骤: step_id={}, strategy_key={}, confidence={:.1}%, overwrite={}",
        step_id,
        strategy.key,
        strategy.confidence,
        has_existing
    );
    
    // 4. 返回成功响应
    Ok(BindAnalysisResultResponse {
        success: true,
        message: format!(
            "成功绑定策略 '{}' 到步骤 '{}'",
            strategy.name, step_id
        ),
        step_id,
        bound_strategy: Some(strategy),
    })
}

/// 获取步骤绑定的策略 (用于测试和查询)
#[tauri::command]
pub async fn get_step_strategy(step_id: String) -> Result<Option<StrategyCandidate>, String> {
    let store = STEP_STRATEGY_STORE.lock().map_err(|e| {
        format!("锁定步骤策略存储失败: {}", e)
    })?;
    
    Ok(store.get(&step_id).map(|(strategy, _)| strategy.clone()))
}

/// 清除步骤策略 (用于测试)
#[tauri::command]
pub async fn clear_step_strategy(step_id: String) -> Result<bool, String> {
    let mut store = STEP_STRATEGY_STORE.lock().map_err(|e| {
        format!("锁定步骤策略存储失败: {}", e)
    })?;
    
    Ok(store.remove(&step_id).is_some())
}

/// 获取存储的智能选择配置模式
/// 专门用于V3引擎获取保存的选择模式
pub async fn get_stored_selection_mode(step_id: &str) -> Result<Option<String>, String> {
    let store = STEP_STRATEGY_STORE.lock().map_err(|e| {
        let err_msg = format!("锁定步骤策略存储失败: {}", e);
        tracing::error!("❌ {}", err_msg);
        err_msg
    })?;

    if let Some((strategy, _timestamp)) = store.get(step_id) {
        tracing::debug!("🔍 [get_stored_selection_mode] 找到存储的策略: step_id={}, selection_mode={:?}", 
            step_id, strategy.selection_mode);
        Ok(strategy.selection_mode.clone())
    } else {
        tracing::debug!("🔍 [get_stored_selection_mode] 未找到存储的策略: step_id={}", step_id);
        Ok(None)
    }
}

/// 直接保存智能选择配置到Store (简化版本，无需完整AnalysisResult)
/// 专门用于 CompactStrategyMenu 的智能选择配置保存
#[tauri::command]
pub async fn save_smart_selection_config(
    step_id: String,
    selection_mode: String,
    batch_config: Option<serde_json::Value>,
) -> Result<bool, String> {
    tracing::info!(
        "📥 [save_smart_selection_config] 收到保存请求: step_id={}, mode={}, batch_config={:?}",
        step_id,
        selection_mode,
        batch_config
    );

    // 构建简化的策略对象
    let description = if let Some(ref config) = batch_config {
        format!("智能选择-{} (批量配置: {:?})", selection_mode, config)
    } else {
        format!("智能选择-{}", selection_mode)
    };

    let strategy = StrategyCandidate {
        key: format!("smart_selection_{}", step_id),
        name: format!("智能选择-{}", selection_mode),
        confidence: 85.0,
        description,
        variant: "smart-selection".to_string(),
        xpath: Some("//android.widget.TextView[@text='关注']".to_string()), // 默认XPath
        text: Some("关注".to_string()),
        resource_id: None,
        class_name: None,
        content_desc: None,
        enabled: true,
        is_recommended: true,
        selection_mode: Some(selection_mode.clone()),  // ✅ 保存选择模式
        batch_config: batch_config.clone(),  // ✅ 保存批量配置
    };

    // 保存到Store
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    let mut store = STEP_STRATEGY_STORE.lock().map_err(|e| {
        let err_msg = format!("锁定步骤策略存储失败: {}", e);
        tracing::error!("❌ {}", err_msg);
        err_msg
    })?;

    store.insert(step_id.clone(), (strategy.clone(), timestamp));

    tracing::info!(
        "✅ 保存智能选择配置成功: step_id={}, mode={}, batch_config={:?}, store_size={}",
        step_id,
        selection_mode,
        batch_config,
        store.len()
    );

    Ok(true)
}
