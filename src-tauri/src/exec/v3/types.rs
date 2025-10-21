// src-tauri/src/exec/v3/types.rs
// module: exec | layer: domain | role: V3 执行协议 Rust 类型定义
// summary: 与前端 TypeScript 类型对应的 Rust 数据结构

use serde::{Deserialize, Serialize};
use serde_json::Value;

/// 置信度：0..1 范围
pub type Confidence = f32;

// ========== 上下文信封 ==========

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContextEnvelope {
    pub device_id: String,
    pub app: AppCtx,
    #[serde(default)]
    pub snapshot: SnapshotCtx,
    #[serde(default = "default_execution_mode")]
    pub execution_mode: ExecutionMode,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppCtx {
    pub package: String,
    pub activity: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SnapshotCtx {
    pub analysis_id: Option<String>,
    pub screen_hash: Option<String>,
    pub xml_cache_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ExecutionMode {
    Strict,
    Relaxed,
}

fn default_execution_mode() -> ExecutionMode {
    ExecutionMode::Strict
}

// ========== 质量设置 ==========

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct QualitySettings {
    pub ocr: Option<OcrMode>,
    pub text_lang: Option<String>,
    pub normalize: Option<NormalizeCfg>,
    pub n_candidates: Option<u32>,
    pub signal_weights: Option<Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OcrMode {
    Auto,
    Force,
    Off,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct NormalizeCfg {
    pub case: Option<String>,
    pub digits: Option<String>,
    pub emoji: Option<String>,
}

// ========== 约束设置 ==========

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ConstraintSettings {
    pub must_be_visible: Option<bool>,
    pub must_be_clickable: Option<bool>,
    pub unique: Option<bool>,
    pub roi: Option<Roi>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Roi {
    pub x: i32,
    pub y: i32,
    pub w: i32,
    pub h: i32,
}

// ========== 验证设置 ==========

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ValidationSettings {
    pub post_action: Option<PostAction>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PostAction {
    pub wait_for: WaitFor,
    pub value: Option<String>,
    pub timeout_ms: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum WaitFor {
    NodeGone,
    NewActivity,
    TextAppears,
}

// ========== 智能单步 ==========

/// 智能单步规格（支持 by-ref 和 by-inline 两种形态）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[serde(untagged)]
pub enum SingleStepSpecV3 {
    /// 引用式：前端只传 analysisId + stepId，后端从缓存读取 StepSpec
    /// 这是推荐方式，避免前后端类型不匹配（如 footer_other）
    ByRef {
        analysis_id: String,
        step_id: String,
    },
    /// 内联式：前端传完整动作（仅用于调试，不推荐）
    ByInline {
        step_id: String,
        #[serde(flatten)]
        action: SingleStepAction,
        #[serde(default)]
        params: Value,
        #[serde(default)]
        quality: QualitySettings,
        #[serde(default)]
        constraints: ConstraintSettings,
        #[serde(default)]
        validation: ValidationSettings,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "action", rename_all = "snake_case")]
pub enum SingleStepAction {
    Tap,
    Input,
    Wait,
    Swipe,
    SmartTap,
    SmartFindElement,
    BatchMatch,
    RecognizePage,
    VerifyAction,
    WaitForPageState,
    ExtractElement,
    SmartNavigation,
    LoopStart,
    LoopEnd,
    ContactGenerateVcf,
    ContactImportToDevice,
    /// 受控兜底：未知动作类型
    #[serde(other)]
    Unknown,
}

// ========== 智能自动链 ==========

/// 智能自动链规格（支持 by-ref 和 by-inline 两种形态）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[serde(untagged)]
pub enum ChainSpecV3 {
    /// 引用式：前端只传 analysisId，后端从缓存读取 ChainResult
    ByRef {
        analysis_id: String,
        #[serde(default = "default_threshold")]
        threshold: Confidence,
        #[serde(default = "default_chain_mode")]
        mode: ChainMode,
    },
    /// 内联式：前端传完整步骤（兼容旧代码，不推荐）
    ByInline {
        chain_id: Option<String>,
        ordered_steps: Vec<StepRefOrInline>,
        threshold: Confidence,
        mode: ChainMode,
        #[serde(default)]
        quality: QualitySettings,
        #[serde(default)]
        constraints: ConstraintSettings,
        #[serde(default)]
        validation: ValidationSettings,
    },
}

fn default_threshold() -> Confidence {
    0.7
}

fn default_chain_mode() -> ChainMode {
    ChainMode::Execute
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ChainMode {
    Dryrun,
    Execute,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StepRefOrInline {
    pub r#ref: Option<String>,
    pub inline: Option<InlineStep>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InlineStep {
    pub step_id: String,
    #[serde(flatten)]
    pub action: SingleStepAction,
    #[serde(default)]
    pub params: Value,
}

// ========== 静态策略 ==========

/// 静态策略规格（支持 by-ref 和 by-inline 两种形态）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[serde(untagged)]
pub enum StaticSpecV3 {
    /// 引用式：从脚本库读取定位器
    ByRef {
        script_id: String,
        static_step_id: String,
        #[serde(default)]
        dryrun: bool,
    },
    /// 内联式：直接传定位器（用于调试）
    ByInline {
        strategy_id: Option<String>,
        action: StaticAction,
        locator: Locator,
        input_text: Option<String>,
        click_point_policy: Option<ClickPointPolicy>,
        #[serde(default)]
        dryrun: bool,
        #[serde(default)]
        quality: QualitySettings,
        #[serde(default)]
        constraints: ConstraintSettings,
        #[serde(default)]
        validation: ValidationSettings,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum StaticAction {
    Tap,
    Input,
    Wait,
    Swipe,
    VerifyAction,
    ExtractElement,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Locator {
    pub by: LocatorBy,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum LocatorBy {
    Id,
    Text,
    Desc,
    #[serde(rename = "xpath")]
    XPath,
    Bounds,
    IndexPath,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ClickPointPolicy {
    Center,
    Safe,
    Custom,
}

// ========== 执行结果 ==========

/// V3 执行结果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecutionResult {
    pub success: bool,
    pub step_id: Option<String>,
    pub elapsed_ms: u64,
    pub error: Option<String>,
    pub coords: Option<Point>,
    pub confidence: Option<Confidence>,
    pub screen_hash: Option<String>,
    pub validation: Option<ValidationResult>,
}

/// 执行摘要
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecutionSummary {
    pub total_steps: usize,
    pub completed_steps: usize,
    pub failed_steps: usize,
    pub elapsed_ms: u64,
    pub success_rate: f32,
    pub final_result: Option<ExecutionResult>,
}

/// 执行事件 V3 (别名)
pub type ExecutionEventV3 = ExecEventV3;

/// 进度阶段 (别名)
pub type ProgressPhase = Phase;

// ========== 事件协议 ==========

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "kebab-case")]
pub enum ExecEventV3 {
    #[serde(rename = "analysis:progress")]
    Progress {
        analysis_id: Option<String>,
        step_id: Option<String>,
        phase: Phase,
        confidence: Option<Confidence>,
        message: Option<String>,
        meta: Option<Value>,
    },
    #[serde(rename = "analysis:complete")]
    Complete {
        analysis_id: Option<String>,
        summary: Option<Summary>,
        scores: Option<Vec<StepScore>>,
        result: Option<ResultPayload>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Phase {
    DeviceReady,
    SnapshotReady,
    MatchStarted,
    Matched,
    Validated,
    Executed,
    Finished,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Summary {
    pub adopted_step_id: Option<String>,
    pub elapsed_ms: Option<u64>,
    pub reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StepScore {
    pub step_id: String,
    pub confidence: Confidence,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResultPayload {
    pub ok: bool,
    pub coords: Option<Point>,
    pub candidate_count: Option<u32>,
    pub screen_hash_now: Option<String>,
    pub validation: Option<ValidationResult>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Point {
    pub x: i32,
    pub y: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidationResult {
    pub passed: bool,
    pub reason: Option<String>,
}

// ========== 聚合入口 ==========

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum TaskV3 {
    Step { step: SingleStepSpecV3 },
    Chain { spec: ChainSpecV3 },
    Static { spec: StaticSpecV3 },
}
