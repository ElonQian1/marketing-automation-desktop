// src-tauri/src/types/smart_selection.rs
// module: types | layer: domain | role: 智能选择系统Rust类型定义
// summary: 智能选择系统的Rust端类型定义，与前端TypeScript类型对应

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// 元素指纹 - Rust版本
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ElementFingerprint {
    // 文本特征
    pub text_content: Option<String>,
    pub text_hash: Option<String>,
    
    // 结构特征
    pub class_chain: Option<Vec<String>>,
    pub resource_id: Option<String>,
    pub resource_id_suffix: Option<String>,
    
    // 位置特征
    pub bounds_signature: Option<BoundsSignature>,
    
    // 上下文特征
    pub parent_class: Option<String>,
    pub sibling_count: Option<u32>,
    pub child_count: Option<u32>,
    
    // 层次特征
    pub depth_level: Option<u32>,
    pub relative_index: Option<u32>,
    
    // 属性特征
    pub clickable: Option<bool>,
    pub enabled: Option<bool>,
    pub selected: Option<bool>,
    
    // 额外标识符
    pub content_desc: Option<String>,
    pub package_name: Option<String>,
}

/// 位置签名（标准化的位置信息）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BoundsSignature {
    pub x: f32,        // 中心X坐标比例 (0-1)
    pub y: f32,        // 中心Y坐标比例 (0-1)
    pub width: f32,    // 宽度比例 (0-1)
    pub height: f32,   // 高度比例 (0-1)
}

/// 匹配上下文
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MatchingContext {
    // 容器约束
    pub container_xpath: Option<String>,
    pub container_bounds: Option<crate::commands::run_step_v2::Bounds>,
    
    // 可点击父元素
    pub clickable_parent_xpath: Option<String>,
    
    // 多语言支持
    pub i18n_aliases: Option<Vec<String>>,
    
    // 匹配断言
    pub light_assertions: Option<LightAssertions>,
    
    // 搜索范围
    pub search_radius: Option<u32>,
    pub max_candidates: Option<u32>,
}

/// 轻量级断言
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LightAssertions {
    pub must_contain_text: Option<Vec<String>>,
    pub must_be_clickable: Option<bool>,
    pub must_be_visible: Option<bool>,
    pub exclude_text: Option<Vec<String>>,
}

/// 选择策略模式
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum SelectionMode {
    MatchOriginal,  // 精确匹配原选择的元素
    First,          // 选择第一个
    Last,           // 选择最后一个
    Random,         // 随机选择一个
    All,            // 选择全部（批量操作）
}

/// 选择配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SelectionConfig {
    pub mode: SelectionMode,
    
    // 排序规则
    pub order: Option<SortOrder>,
    
    // 随机选择配置
    pub random_seed: Option<u64>,
    
    // 批量操作配置（仅all模式）
    pub batch_config: Option<BatchConfig>,
    
    // 过滤配置
    pub filters: Option<FilterConfig>,
}

/// 排序规则
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum SortOrder {
    Dom,       // DOM顺序
    VisualYx,  // 视觉Y→X
    VisualXy,  // 视觉X→Y
}

/// 批量操作配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchConfig {
    pub interval_ms: u64,
    pub max_count: Option<u32>,
    pub jitter_ms: Option<u64>,
    pub continue_on_error: bool,
    pub show_progress: bool,
}

/// 过滤配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FilterConfig {
    pub exclude_states: Option<Vec<String>>,
    pub min_confidence: Option<f32>,
    pub position_tolerance: Option<u32>,
}

/// 策略变体类型
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum StrategyVariant {
    SelfId,
    RegionTextToParent,
    RegionLocalIndexWithCheck,
    NeighborRelative,
    GlobalIndexWithStrongChecks,
    AbsoluteXPathFallback,
}

/// 策略计划项
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StrategyPlanItem {
    pub id: String,
    pub kind: StrategyVariant,
    pub confidence: f32,
    pub description: String,
    pub params: Option<HashMap<String, serde_json::Value>>,
}

/// 策略计划
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StrategyPlan {
    pub selected: StrategyPlanItem,
    pub plan: Vec<StrategyPlanItem>,
    pub recommended_index: usize,
}

/// 执行限制
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionLimits {
    pub allow_backend_fallback: bool,
    pub time_budget_ms: u64,
    pub per_candidate_budget_ms: u64,
    pub strict_mode: bool,
    pub max_retry_count: u32,
}

/// 智能选择协议
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmartSelectionProtocol {
    // 核心定位信息
    pub anchor: AnchorInfo,
    
    // 选择策略
    pub selection: SelectionConfig,
    
    // 匹配上下文
    pub matching_context: Option<MatchingContext>,
    
    // 策略计划
    pub strategy_plan: Option<StrategyPlan>,
    
    // 执行限制
    pub limits: Option<ExecutionLimits>,
    
    // 兼容性字段
    pub fallback: Option<FallbackConfig>,
}

/// 锚点信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnchorInfo {
    pub container_xpath: Option<String>,
    pub clickable_parent_xpath: Option<String>,
    pub fingerprint: ElementFingerprint,
}

/// 兜底配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FallbackConfig {
    pub absolute_xpath: Option<String>,
    pub allow_fallback: bool,
}

/// 智能选择结果
#[derive(Debug, Clone, Serialize)]
pub struct SmartSelectionResult {
    pub success: bool,
    pub message: String,
    
    // 匹配信息
    pub matched_elements: MatchedElementsInfo,
    
    // 执行信息
    pub execution_info: Option<ExecutionInfo>,
    
    // 调试信息
    pub debug_info: Option<DebugInfo>,
}

/// 匹配元素信息
#[derive(Debug, Clone, Serialize)]
pub struct MatchedElementsInfo {
    pub total_found: u32,
    pub filtered_count: u32,
    pub selected_count: u32,
    pub confidence_scores: Vec<f32>,
}

/// 执行信息
#[derive(Debug, Clone, Serialize)]
pub struct ExecutionInfo {
    pub used_strategy: StrategyVariant,
    pub fallback_used: bool,
    pub execution_time_ms: u64,
    pub click_coordinates: Option<Vec<ClickCoordinate>>,
}

/// 点击坐标
#[derive(Debug, Clone, Serialize)]
pub struct ClickCoordinate {
    pub x: i32,
    pub y: i32,
}

/// 调试信息
#[derive(Debug, Clone, Serialize)]
pub struct DebugInfo {
    pub candidate_analysis: Vec<String>,
    pub strategy_attempts: Vec<String>,
    pub error_details: Option<String>,
}

/// 批量执行结果
#[derive(Debug, Clone, Serialize)]
pub struct BatchExecutionResult {
    pub total_targets: u32,
    pub successful_clicks: u32,
    pub failed_clicks: u32,
    pub skipped_clicks: u32,
    pub total_time_ms: u64,
    
    // 成功标识 (新增字段以解决编译错误)
    pub success: bool,
    
    // 详细结果
    pub click_results: Vec<ClickResult>,
    
    // 进度信息
    pub progress_logs: Vec<String>,
}

/// 单次点击结果
#[derive(Debug, Clone, Serialize)]
pub struct ClickResult {
    pub index: u32,
    pub success: bool,
    pub coordinates: ClickCoordinate,
    pub error_message: Option<String>,
    pub time_ms: u64,
}

/// 指纹匹配结果
#[derive(Debug, Clone)]
pub struct FingerprintMatchResult {
    pub similarity: f32,
    pub confidence: f32,
    pub matched_features: Vec<String>,  // 新增匹配特征字段
    pub details: MatchDetails,
    pub explanation: Vec<String>,
}

/// 匹配详情
#[derive(Debug, Clone)]
pub struct MatchDetails {
    pub text_match: f32,
    pub position_match: f32,
    pub structure_match: f32,
    pub attribute_match: f32,
}

/// 容错配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToleranceConfig {
    pub position_drift: u32,         // 位置漂移容错范围（像素）
    pub retry_on_failure: u32,       // 失败重试次数
    pub fallback_strategy: bool,     // 是否启用兜底策略
    pub min_similarity_threshold: f32, // 最低相似度阈值
}

/// 智能选择统计
#[derive(Debug, Clone, Serialize)]
pub struct SmartSelectionStats {
    pub total_selections: u64,
    pub success_rate: f32,
    pub average_confidence: f32,
    pub strategy_usage: HashMap<String, u64>,
    pub performance_metrics: PerformanceMetrics,
}

/// 性能指标
#[derive(Debug, Clone, Serialize)]
pub struct PerformanceMetrics {
    pub avg_execution_time_ms: f32,
    pub avg_candidates_found: f32,
    pub most_common_failures: Vec<String>,
}

/// 扩展的 RunStepRequestV2 结构
#[derive(Debug, Clone, Deserialize)]
pub struct SmartRunStepRequestV2 {
    // 保留原有字段
    pub device_id: String,
    pub mode: crate::commands::run_step_v2::StepRunMode,
    pub strategy: crate::commands::run_step_v2::StrategyKind,
    pub step: serde_json::Value,
    
    // 智能选择扩展字段
    pub smart_selection: Option<SmartSelectionProtocol>,
    
    // 分析缓存
    pub analysis_cache: Option<AnalysisCache>,
    
    // 执行配置
    pub execution_config: Option<SmartExecutionConfig>,
}

/// 分析缓存
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisCache {
    pub xml_snapshot: Option<String>,
    pub absolute_xpath: Option<String>,
    pub analysis_timestamp: Option<u64>,
    pub screen_size: Option<ScreenSize>,
}

/// 屏幕尺寸
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScreenSize {
    pub width: u32,
    pub height: u32,
}

/// 智能执行配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmartExecutionConfig {
    pub enable_smart_selection: bool,
    pub prefer_smart_over_legacy: bool,
    pub enable_batch_mode: bool,
    pub execution_strategy: ExecutionStrategy,
}

/// 执行策略
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ExecutionStrategy {
    Conservative,  // 保守策略
    Balanced,      // 平衡策略
    Aggressive,    // 激进策略
}

/// 扩展的响应结构
#[derive(Debug, Serialize)]
pub struct SmartStepResponseV2 {
    // 保留原有字段
    pub ok: bool,
    pub message: String,
    pub matched: Option<crate::commands::run_step_v2::MatchCandidate>,
    pub executed_action: Option<String>,
    pub verify_passed: Option<bool>,
    pub error_code: Option<String>,
    pub raw_logs: Option<Vec<String>>,
    
    // 智能选择扩展字段
    pub smart_result: Option<SmartSelectionResult>,
    pub batch_result: Option<BatchExecutionResult>,
    
    // 性能信息
    pub performance: Option<PerformanceInfo>,
}

/// 性能信息
#[derive(Debug, Clone, Serialize)]
pub struct PerformanceInfo {
    pub total_time_ms: u64,
    pub analysis_time_ms: u64,
    pub matching_time_ms: u64,
    pub execution_time_ms: u64,
    pub candidates_analyzed: u32,
}

impl Default for SelectionMode {
    fn default() -> Self {
        SelectionMode::MatchOriginal
    }
}

impl Default for SortOrder {
    fn default() -> Self {
        SortOrder::VisualYx
    }
}

impl Default for ExecutionStrategy {
    fn default() -> Self {
        ExecutionStrategy::Balanced
    }
}

/// 从前端请求转换为智能请求
impl From<crate::commands::run_step_v2::RunStepRequestV2> for SmartRunStepRequestV2 {
    fn from(request: crate::commands::run_step_v2::RunStepRequestV2) -> Self {
        SmartRunStepRequestV2 {
            device_id: request.device_id,
            mode: request.mode,
            strategy: request.strategy,
            step: request.step,
            smart_selection: None,
            analysis_cache: None,
            execution_config: Some(SmartExecutionConfig {
                enable_smart_selection: false,
                prefer_smart_over_legacy: false,
                enable_batch_mode: false,
                execution_strategy: ExecutionStrategy::Conservative,
            }),
        }
    }
}

/// 从智能响应转换为标准响应
impl From<SmartStepResponseV2> for crate::commands::run_step_v2::StepResponseV2 {
    fn from(response: SmartStepResponseV2) -> Self {
        crate::commands::run_step_v2::StepResponseV2 {
            ok: response.ok,
            message: response.message,
            matched: response.matched,
            executed_action: response.executed_action,
            verify_passed: response.verify_passed,
            error_code: response.error_code,
            raw_logs: response.raw_logs,
        }
    }
}

// ==================== 新增辅助类型 ====================

/// 锚点配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnchorConfig {
    pub container_xpath: Option<String>,
    pub clickable_parent_xpath: Option<String>,
    pub fingerprint: ElementFingerprint,
}