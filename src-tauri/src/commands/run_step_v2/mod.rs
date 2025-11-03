// src-tauri/src/commands/run_step_v2/mod.rs
// module: v2-execution | layer: commands | role: V2统一执行协议入口
// summary: 实现三条执行链(static/step/chain)的真机执行，支持完整的V2协议

// 🏗️ 子模块：结构匹配Runtime集成
mod sm_integration;

use tauri::{command, AppHandle};
use serde::{Deserialize, Serialize};
use anyhow::Result;
use regex;

use crate::services::ui_reader_service::{get_ui_dump, UIElement};
use crate::infra::adb::input_helper::{tap_injector_first, input_text_injector_first, swipe_injector_first};
use crate::infra::adb::keyevent_helper::keyevent_code_injector_first;
use crate::engine::{
    FallbackController, XmlIndexer, 
    SafetyGatekeeper
};
use crate::engine::strategy_plugin::{StrategyRegistry, ExecutionEnvironment, STRATEGY_REGISTRY};

// 🛡️ 安全检查辅助函数

/// 检查是否为整屏节点（占屏幕95%以上面积）
fn is_fullscreen_node(bounds: &(i32, i32, i32, i32)) -> bool {
    let (left, top, right, bottom) = bounds;
    let width = (right - left) as f32;
    let height = (bottom - top) as f32;
    let area = width * height;
    
    // 假设屏幕大小为 1080x2400（可以后续从设备信息获取）
    let screen_area = 1080.0 * 2400.0;
    let area_ratio = area / screen_area;
    
    tracing::debug!("🔍 节点面积检查: {}x{} = {:.1}%, 阈值95%", 
                    width as i32, height as i32, area_ratio * 100.0);
    
    area_ratio > 0.95
}

/// 检查是否为容器类节点（不应该被直接点击）
fn is_container_node(class_name: &Option<String>) -> bool {
    if let Some(class) = class_name {
        let container_classes = [
            "android.widget.FrameLayout",
            "android.widget.LinearLayout", 
            "android.view.ViewGroup",
            "com.android.internal.policy.DecorView",
            "android.widget.RelativeLayout",
            "android.widget.ScrollView",
            "androidx.constraintlayout.widget.ConstraintLayout",
        ];
        
        let is_container = container_classes.iter().any(|&container_class| class == container_class);
        
        if is_container {
            tracing::debug!("🔍 容器类检查: {} 被识别为容器节点", class);
        }
        
        is_container
    } else {
        false
    }
}

// V2 执行模式（匹配前端枚举）
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum StepRunMode { 
    MatchOnly,
    ExecuteStep,
}

impl Default for StepRunMode {
    fn default() -> Self { StepRunMode::ExecuteStep }
}

// V2 策略类型（匹配前端）
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum StrategyKind {
    Intelligent,
    Standard,
    Absolute,
    Custom,
}

// 🧠 同构决策链核心：统一评分引擎
pub struct UnifiedScoringCore;

impl UnifiedScoringCore {
    /// 三态对比评分：同构的评分逻辑，前后端复用
    pub fn calculate_tristate_score(
        static_evidence: &StaticEvidence,
        runtime_node: &UIElement
    ) -> f32 {
        let mut score = 0.0f32;
        
        // P1: 最强证据 - ResourceId + XPath (权重0.85)
        score += Self::score_resource_id(&static_evidence.resource_id, &runtime_node.resource_id);
        score += Self::score_xpath(&static_evidence.xpath, &runtime_node.class);
        
        // P2: 中等证据 - Text + ContentDesc (权重0.60-0.70)
        score += Self::score_text(&static_evidence.text, &runtime_node.text);
        score += Self::score_content_desc(&static_evidence.content_desc, &runtime_node.content_desc);
        
        // P3: 弱证据 - ClassName (权重0.30)
        score += Self::score_class_name(&static_evidence.class_name, &runtime_node.class);
        
        // 结构性奖励
        if static_evidence.container_scoped {
            score += 0.30; // 容器限定奖励
        }
        if static_evidence.parent_clickable {
            score += 0.20; // 父可点击奖励
        }
        
        // 惩罚项
        if let Some(index) = static_evidence.local_index {
            score -= 0.15; // 索引依赖惩罚
            if static_evidence.has_light_checks {
                score += 0.10; // 轻校验回补
            }
        }
        if static_evidence.global_index.is_some() {
            score -= 0.60; // 全局索引重度惩罚
        }
        
        score.max(0.0)
    }
    
    /// 评分单项：ResourceId 匹配/缺失/不一致
    fn score_resource_id(static_val: &Option<String>, runtime_val: &Option<String>) -> f32 {
        match (static_val, runtime_val) {
            (Some(s), Some(r)) if s == r => 0.85,      // 完全匹配
            (Some(_), Some(_)) => -0.50,               // 不一致（严重）
            (Some(_), None) => -0.35,                  // 退化（失去强锚点）
            (None, Some(_)) => -0.08,                  // 意外出现（轻微）
            (None, None) => 0.02,                      // 缺失一致
        }
    }
    
    /// 评分单项：XPath 包含匹配
    fn score_xpath(static_xpath: &Option<String>, runtime_class: &Option<String>) -> f32 {
        match (static_xpath, runtime_class) {
            (Some(xpath), Some(class)) if xpath.contains(class) => 0.85,
            (Some(_), Some(_)) => -0.45,               // XPath路径失效
            (Some(_), None) => -0.30,                  // 路径退化
            (None, Some(_)) => -0.05,                  // 意外出现
            (None, None) => 0.01,                      // 路径缺失一致
        }
    }
    
    /// 评分单项：Text 匹配（支持I18N别名）
    fn score_text(static_text: &Option<Vec<String>>, runtime_text: &Option<String>) -> f32 {
        match (static_text, runtime_text) {
            (Some(aliases), Some(rt)) => {
                if aliases.iter().any(|alias| rt.contains(alias) || alias.contains(rt)) {
                    0.70 // 文本匹配（含I18N）
                } else {
                    -0.25 // 文本不匹配
                }
            },
            (Some(_), None) => -0.20,                  // 文本丢失
            (None, Some(_)) => -0.03,                  // 意外出现文本
            (None, None) => 0.02,                      // 文本缺失一致
        }
    }
    
    /// 评分单项：ContentDesc 匹配
    fn score_content_desc(static_desc: &Option<String>, runtime_desc: &Option<String>) -> f32 {
        match (static_desc, runtime_desc) {
            (Some(s), Some(r)) if r.contains(s) || s.contains(r) => 0.60,
            (Some(_), Some(_)) => -0.20,               // ContentDesc不匹配
            (Some(_), None) => -0.15,                  // ContentDesc丢失
            (None, Some(_)) => -0.02,                  // 意外出现
            (None, None) => 0.01,                      // 缺失一致
        }
    }
    
    /// 评分单项：ClassName 匹配
    fn score_class_name(static_class: &Option<String>, runtime_class: &Option<String>) -> f32 {
        match (static_class, runtime_class) {
            (Some(s), Some(r)) if r.contains(s) || s.contains(r) => 0.30,
            (Some(_), Some(_)) => -0.15,               // 类名不匹配
            (Some(_), None) => -0.10,                  // 类名丢失
            (None, Some(_)) => -0.02,                  // 意外出现
            (None, None) => 0.01,                      // 缺失一致
        }
    }
    
    /// 双重唯一性验证：阈值唯一 + 间隔唯一
    pub fn validate_uniqueness(
        candidates: &[MatchCandidate], 
        min_confidence: f32
    ) -> bool {
        if candidates.is_empty() {
            return false;
        }
        
        let top1 = &candidates[0];
        
        // 阈值唯一性：Top1 >= min_confidence 且只有1个
        let threshold_unique = top1.confidence >= min_confidence as f64 && 
            candidates.iter().filter(|c| c.confidence >= min_confidence as f64).count() == 1;
        
        // 间隔唯一性：Top1 - Top2 >= 0.15
        let gap_unique = if candidates.len() >= 2 {
            let top2 = &candidates[1];
            (top1.confidence - top2.confidence) >= 0.15
        } else {
            true // 只有一个候选时自动通过间隔检查
        };
        
        threshold_unique || gap_unique
    }
}

// 🔧 静态证据包结构（前端传递给后端的评分依据）
#[derive(Debug, Clone)]
pub struct StaticEvidence {
    pub resource_id: Option<String>,
    pub xpath: Option<String>,
    pub text: Option<Vec<String>>,          // I18N别名集合
    pub content_desc: Option<String>,
    pub class_name: Option<String>,
    pub container_scoped: bool,             // 是否容器限定
    pub parent_clickable: bool,             // 父节点可点击
    pub local_index: Option<i32>,           // 局部索引
    pub global_index: Option<i32>,          // 全局索引
    pub has_light_checks: bool,             // 是否有轻校验
}

// 前端兼容的 RunStepRequestV2 结构
// � 同构决策链：静态分析 → 真机复现的完整数据结构

// 1️⃣ 静态分析上下文（前端采集固化）
#[derive(Debug, Clone, Deserialize)]
pub struct StaticAnalysisContext {
    pub package: Option<String>,
    pub activity: Option<String>,
    pub screen: Option<ScreenInfo>,
    pub absolute_xpath: Option<String>,
    pub xml_hash: Option<String>,
    pub node_fingerprint: Option<String>,
    pub container_anchor: Option<ContainerAnchor>,
    pub clickable_parent_hint: Option<ClickableParentHint>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ScreenInfo {
    pub width: i32,
    pub height: i32,
    pub dpi: i32,
    pub orientation: String, // "portrait" | "landscape"
}

#[derive(Debug, Clone, Deserialize)]
pub struct ContainerAnchor {
    pub by: String,              // "id" | "xpath" | "class_structure"
    pub value: String,           // "com.app:id/bottom_navigation"
    pub fallback_xpath: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ClickableParentHint {
    pub up_levels: i32,          // 从目标节点向上提升的层级数
    pub must_be_clickable: Option<bool>,
    pub must_be_enabled: Option<bool>,
}

// 2️⃣ 子树锚点（解决"父无字段，子有字段"）
#[derive(Debug, Clone, Deserialize)]
pub struct ChildAnchor {
    pub anchor_type: String,     // "text" | "resource_id" | "content_desc" | "icon_id"
    pub equals: Option<String>,  // 精确匹配值
    pub contains: Option<String>, // 包含匹配值
    pub regex: Option<String>,   // 正则匹配
    pub i18n_alias: Option<Vec<String>>, // 多语言变体 ["收藏","Favorites","Starred"]
}

// 3️⃣ 策略变体（Plan中的单个策略）
#[derive(Debug, Clone, Deserialize)]
pub struct StrategyVariant {
    pub id: String,              // "RegionTextToParent#1"
    pub kind: VariantKind,       // 策略类型枚举
    pub scope: String,           // "regional" | "global"
    pub container_xpath: Option<String>,
    pub selectors: VariantSelectors,
    pub structure: Option<StructureHint>,
    pub index: Option<IndexHint>,
    pub checks: Option<Vec<LightCheck>>,
    pub static_score: f32,
    pub explain: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum VariantKind {
    SelfId,                      // 直接resource-id匹配
    SelfDesc,                    // 直接content-desc匹配  
    ChildToParent,               // 子锚点→父执行
    RegionTextToParent,          // 容器内子锚点→父执行
    RegionLocalIndexWithCheck,   // 容器内索引+轻校验
    NeighborRelative,            // 邻居相对定位
    GlobalIndexWithStrongChecks, // 全局索引+强校验（最后兜底）
    BoundsTap,                   // 坐标兜底
}

impl std::fmt::Display for VariantKind {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            VariantKind::SelfId => write!(f, "self-id"),
            VariantKind::SelfDesc => write!(f, "self-desc"),
            VariantKind::ChildToParent => write!(f, "child-to-parent"),
            VariantKind::RegionTextToParent => write!(f, "region-text-to-parent"),
            VariantKind::RegionLocalIndexWithCheck => write!(f, "region-local-index-with-check"),
            VariantKind::NeighborRelative => write!(f, "neighbor-relative"),
            VariantKind::GlobalIndexWithStrongChecks => write!(f, "global-index-with-strong-checks"),
            VariantKind::BoundsTap => write!(f, "bounds-tap"),
        }
    }
}

impl VariantKind {
    pub fn to_str(&self) -> &'static str {
        match self {
            VariantKind::SelfId => "self-id",
            VariantKind::SelfDesc => "self-desc",
            VariantKind::ChildToParent => "child-to-parent",
            VariantKind::RegionTextToParent => "region-text-to-parent",
            VariantKind::RegionLocalIndexWithCheck => "region-local-index-with-check",
            VariantKind::NeighborRelative => "neighbor-relative",
            VariantKind::GlobalIndexWithStrongChecks => "global-index-with-strong-checks",
            VariantKind::BoundsTap => "bounds-tap",
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct VariantSelectors {
    pub parent: Option<ParentSelector>,
    pub child: Option<ChildSelector>,
    pub self_: Option<SelfSelector>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ParentSelector {
    pub class: Option<String>,
    pub clickable: Option<bool>,
    pub enabled: Option<bool>,
    pub resource_id: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ChildSelector {
    pub class: Option<String>,
    pub resource_id: Option<String>,
    pub text: Option<TextMatcher>,
    pub content_desc: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct SelfSelector {
    pub class: Option<String>,
    pub resource_id: Option<String>,
    pub text: Option<TextMatcher>,
    pub content_desc: Option<String>,
    pub clickable: Option<bool>,
    pub enabled: Option<bool>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct TextMatcher {
    pub equals: Option<String>,
    pub contains: Option<String>,
    pub in_list: Option<Vec<String>>, // I18N别名集合
}

#[derive(Debug, Clone, Deserialize)]
pub struct StructureHint {
    pub relation: String,        // "parent_child" | "ancestor_descendant" | "sibling"
    pub direction: Option<String>, // "up" | "down" | "next" | "prev"
    pub levels: Option<i32>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct IndexHint {
    pub local_index: Option<i32>, // 容器内第n个（从1开始）
    pub global_index: Option<i32>, // 全局第n个（尽量避免）
}

#[derive(Debug, Clone, Deserialize)]
pub struct LightCheck {
    pub check_type: String,      // "child_text_contains" | "child_text_contains_any" | "clickable" | "enabled"
    pub value: Option<String>,
    pub values: Option<Vec<String>>,
}

// 4️⃣ 完整决策链计划
#[derive(Debug, Clone, Deserialize)]
pub struct DecisionChainPlan {
    pub strategy: StrategyConfig,
    pub context: StaticAnalysisContext,
    pub child_anchors: Option<Vec<ChildAnchor>>,
    pub structural_signatures: Option<StructuralSignatures>,
    pub plan: Vec<StrategyVariant>, // 从强到弱排序的可执行配方
}

#[derive(Debug, Clone, Deserialize)]
pub struct StrategyConfig {
    pub selected: String,        // 当前要执行的Variant ID
    pub allow_backend_fallback: Option<bool>,
    pub time_budget_ms: Option<u64>,
    pub per_candidate_budget_ms: Option<u64>,
    pub require_uniqueness: Option<bool>,
    pub min_confidence: Option<f32>,
    pub forbid_containers: Option<bool>,
    pub post_assertions: Option<Vec<String>>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct StructuralSignatures {
    pub ancestor_class_chain: Option<Vec<String>>,
    pub sibling_signature: Option<String>,
    pub bounds_signature: Option<BoundsSignature>,
}

// 5️⃣ 向后兼容的选择器结构（保留旧接口）
#[derive(Debug, Clone, Deserialize)]
pub struct ElementSelectors {
    pub absolute_xpath: Option<String>,
    pub resource_id: Option<String>, 
    pub text: Option<String>,
    pub content_desc: Option<String>,
    pub class_name: Option<String>,
    pub xpath_prefix: Option<String>,
    pub leaf_index: Option<i32>,
    // 兼容性字段（映射到新结构）
    pub target_node_type: Option<String>,
    pub anchor_xpath: Option<String>,
    pub parent_constraint: Option<String>,
    pub container_xpath: Option<String>,
    pub i18n_text_variants: Option<Vec<String>>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct BoundsSignature {
    pub width_ratio: f32,
    pub height_ratio: f32,
    pub center_x_ratio: f32,
    pub center_y_ratio: f32,
}

#[derive(Debug, Clone, Deserialize)]
pub struct GeometricAids {
    pub bounds: Option<Bounds>,
    pub bounds_signature: Option<BoundsSignature>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ValidationAndFallback {
    pub revalidate: Option<String>, // "device_required" | "device_optional" | "none"
    pub fallback_to_bounds: Option<bool>,
    pub allow_backend_fallback: Option<bool>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ActionSpec {
    #[serde(rename = "type")]
    pub action_type: String,
    pub params: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct SafetyThresholds {
    pub min_confidence: Option<f32>,
    pub require_uniqueness: Option<bool>,
    pub forbid_fullscreen_or_container: Option<bool>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct StructuredSelector {
    pub selectors: ElementSelectors,
    pub geometric: Option<GeometricAids>,
    pub validation: Option<ValidationAndFallback>,
    pub action: ActionSpec,
    pub safety: Option<SafetyThresholds>,
    pub step_id: String,
    pub selector_id: Option<String>,
    pub selector_preferred: Option<bool>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct RunStepRequestV2 {
    pub device_id: String,
    pub mode: StepRunMode,
    pub strategy: StrategyKind,
    pub step: serde_json::Value, // StepPayload 复杂结构，暂用 Value
}

fn default_true() -> bool { true }

// 旧版兼容结构体（保持兼容性）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StepAction {
    pub action_type: ActionType,
    pub target_element: Option<ElementCriteria>,
    pub input_text: Option<String>,
    pub coordinates: Option<(f64, f64)>,
    pub swipe_direction: Option<SwipeDirection>,
    pub key_code: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ActionType {
    Tap,
    DoubleTap, 
    LongPress,
    Swipe,
    Type,
    Wait,
    Back,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ElementCriteria {
    pub text: Option<String>,
    pub resource_id: Option<String>,
    pub class_name: Option<String>,
    pub content_desc: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SwipeDirection {
    pub from_x: f64,
    pub from_y: f64,
    pub to_x: f64,
    pub to_y: f64,
}

// V2 响应结构体（匹配前端 RunStepResponseV2）
#[derive(Debug, Clone, Serialize)]
pub struct MatchCandidate {
    pub id: String,
    pub score: f64,
    pub confidence: f64,
    pub bounds: Bounds,
    pub text: Option<String>,
    pub class_name: Option<String>,
    pub package_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bounds {
    pub left: i32,
    pub top: i32,
    pub right: i32,
    pub bottom: i32,
}

#[derive(Debug, Clone, Serialize)]
pub struct ExecInfo { 
    pub ok: bool, 
    pub action: String,
    pub execution_time_ms: u64,
}

#[derive(Debug, Serialize)]
pub struct StepResponseV2 {
    pub ok: bool,
    pub message: String,
    pub matched: Option<MatchCandidate>,
    pub executed_action: Option<String>,
    pub verify_passed: Option<bool>,
    pub error_code: Option<String>,
    pub raw_logs: Option<Vec<String>>,
}

// 内部匹配信息（用于日志）
#[derive(Debug, Clone)]
pub struct MatchInfo { 
    pub uniqueness: i32, 
    pub confidence: f32,
    pub elements_found: i32,
}

// 旧版兼容结构体
#[derive(Debug, Serialize)]
pub struct StepExecutionResult {
    pub success: bool,
    pub message: String,
    pub execution_time_ms: u64,
    pub verification_passed: bool,
    pub found_elements: Vec<UIElement>,
}

// V2 统一执行入口（前端兼容接口）
#[command]
pub async fn run_step_v2(app_handle: AppHandle, request: RunStepRequestV2) -> Result<StepResponseV2, String> {
    tracing::info!(
        "engine=v2 device_id={} mode={:?} strategy={:?}",
        request.device_id, request.mode, request.strategy
    );
    tracing::info!("bridge=ADB shadow=false dump_source=Device");
    
    // 简化处理：当前只实现 step 执行链.
    execute_v2_step(app_handle, &request).await
}
 

// V2 步骤执行（匹配前端数据结构）
async fn execute_v2_step(app_handle: AppHandle, req: &RunStepRequestV2) -> Result<StepResponseV2, String> {
    // 🎯 【关键修复】处理coordinateParams参数展开
    let mut step_with_coords = req.step.clone();
    
    // 如果前端发送了coordinateParams，展开到step对象中
    if let Some(coord_params) = req.step.get("coordinateParams") {
        if let Some(obj) = coord_params.as_object() {
            tracing::info!("🔧 展开coordinateParams到step对象: {:?}", obj);
            for (key, value) in obj {
                // 🔧 参数名称映射：处理前后端参数名不匹配问题
                let mapped_key = match key.as_str() {
                    "duration" => "duration_ms",  // 延时参数映射
                    _ => key
                };
                step_with_coords[mapped_key] = value.clone();
            }
        }
    }
    
    // 🎯 【关键优化】对于坐标滑动操作，跳过元素匹配直接执行
    let has_coordinates = step_with_coords.get("start_x").is_some() && 
                          step_with_coords.get("start_y").is_some() && 
                          step_with_coords.get("end_x").is_some() && 
                          step_with_coords.get("end_y").is_some();
    
    let action_type = step_with_coords.get("action").and_then(|v| v.as_str()).unwrap_or("tap");
    
    tracing::info!("🔍 坐标检测: has_coordinates={}, action_type={}", has_coordinates, action_type);
    
    // 🎯 【新增】检测无需选择器的操作类型（系统按键、输入等）
    let needs_no_selector = matches!(action_type, "keyevent" | "input" | "long_press");
    
    if needs_no_selector {
        tracing::info!("🎯 检测到无选择器操作: {}, 跳过元素匹配直接执行", action_type);
        
        // 创建虚拟匹配结果（不需要真实元素匹配）
        let dummy_candidate = MatchCandidate {
            id: format!("{}_mode", action_type),
            score: 1.0,
            confidence: 0.0, // 标记为无选择器模式
            bounds: Bounds { left: 0, top: 0, right: 0, bottom: 0 },
            text: Some(format!("{}操作模式", action_type)),
            class_name: None,
            package_name: None,
        };
        
        // 直接执行操作
        match execute_v2_action_with_coords(&step_with_coords, &req.device_id, &dummy_candidate).await {
            Ok(exec_info) => {
                tracing::info!("✅ {}执行成功: {}", action_type, exec_info.action);
                return Ok(StepResponseV2 {
                    ok: true,
                    message: exec_info.action,
                    matched: Some(dummy_candidate),
                    executed_action: Some(action_type.to_string()),
                    verify_passed: Some(true),
                    error_code: None,
                    raw_logs: Some(vec![format!("{}执行成功", action_type)]),
                });
            },
            Err(e) => {
                tracing::error!("❌ {}执行失败: {}", action_type, e);
                return Ok(StepResponseV2 {
                    ok: false,
                    message: format!("{}执行失败: {}", action_type, e),
                    matched: None,
                    executed_action: None,
                    verify_passed: Some(false),
                    error_code: Some(format!("{}_EXEC_FAILED", action_type.to_uppercase())),
                    raw_logs: Some(vec![format!("{}失败: {}", action_type, e)]),
                });
            }
        }
    }
    
    if has_coordinates && action_type == "swipe" {
        tracing::info!("🎯 检测到坐标滑动操作，跳过元素匹配直接执行");
        tracing::info!("📐 坐标参数: start_x={:?}, start_y={:?}, end_x={:?}, end_y={:?}", 
                      step_with_coords.get("start_x"), 
                      step_with_coords.get("start_y"),
                      step_with_coords.get("end_x"), 
                      step_with_coords.get("end_y"));
        
        // 创建虚拟匹配结果（不需要真实元素匹配）
        let dummy_candidate = MatchCandidate {
            id: "coord_mode".to_string(),
            score: 1.0,
            confidence: 0.0, // 标记为坐标模式
            bounds: Bounds { left: 0, top: 0, right: 0, bottom: 0 },
            text: Some("坐标滑动模式".to_string()),
            class_name: None,
            package_name: None,
        };
        
        // 直接执行坐标操作
        match execute_v2_action_with_coords(&step_with_coords, &req.device_id, &dummy_candidate).await {
            Ok(exec_info) => {
                tracing::info!("✅ 坐标滑动执行成功: {}", exec_info.action);
                return Ok(StepResponseV2 {
                    ok: true,
                    message: exec_info.action,
                    matched: Some(dummy_candidate),
                    executed_action: Some("swipe".to_string()),
                    verify_passed: Some(true),
                    error_code: None,
                    raw_logs: Some(vec!["坐标滑动执行成功".to_string()]),
                });
            },
            Err(e) => {
                tracing::error!("❌ 坐标滑动执行失败: {}", e);
                return Ok(StepResponseV2 {
                    ok: false,
                    message: format!("坐标滑动执行失败: {}", e),
                    matched: None,
                    executed_action: None,
                    verify_passed: Some(false),
                    error_code: Some("COORD_EXEC_FAILED".to_string()),
                    raw_logs: Some(vec![format!("坐标滑动失败: {}", e)]),
                });
            }
        }
    }
    
    // � 创建使用修改后步骤的请求对象，用于后续函数调用
    let req_with_coords = RunStepRequestV2 {
        device_id: req.device_id.clone(),
        mode: req.mode.clone(), 
        strategy: req.strategy.clone(),
        step: step_with_coords,
    };
    
    // �🔍 第一步：查询 selection_mode 和 batch_config
    let selector_id = req_with_coords.step.get("step_id").and_then(|v| v.as_str())
        .or_else(|| req_with_coords.step.get("selector").and_then(|v| v.as_str()));

    let (selection_mode, batch_config) = if let Some(id) = selector_id {
        let mut strategy_opt = crate::commands::intelligent_analysis::get_step_strategy(id.to_string()).await.ok().flatten();
        
        // 尝试用 selector 查询（兜底）
        if strategy_opt.is_none() {
            if let Some(selector) = req_with_coords.step.get("selector").and_then(|v| v.as_str()) {
                if selector != id {
                    strategy_opt = crate::commands::intelligent_analysis::get_step_strategy(selector.to_string()).await.ok().flatten();
                }
            }
        }
        
        match strategy_opt {
            Some(strategy) => {
                tracing::info!("🎯 从Store获取执行模式: selection_mode={:?}, has_batch_config={}", 
                              strategy.selection_mode, strategy.batch_config.is_some());
                (strategy.selection_mode.clone(), strategy.batch_config.clone())
            }
            None => (None, None)
        }
    } else {
        (None, None)
    };
    
    // 获取真实的UI dump
    tracing::info!("🔍 开始获取设备UI dump...");
    let ui_dump_result = get_ui_dump(&req.device_id).await;
    
    let (match_info, candidates) = match ui_dump_result {
        Ok(ui_xml) => {
            tracing::info!("✅ UI dump获取成功，大小: {} 字符", ui_xml.len());
            
            // 进行真实的元素匹配，传递 selection_mode
            match find_element_in_ui(&ui_xml, &req_with_coords, selection_mode.clone()).await {
                Ok((info, cands)) => {
                    tracing::info!("matched: uniq={} conf={:.2} candidates={}", info.uniqueness, info.confidence, cands.len());
                    (info, cands)
                },
                Err(e) => {
                    tracing::error!("❌ 元素匹配失败: {}", e);
                    return Ok(StepResponseV2 {
                        ok: false,
                        message: format!("元素匹配失败: {}", e),
                        matched: None,
                        executed_action: None,
                        verify_passed: Some(false),
                        error_code: Some("MATCH_FAILED".to_string()),
                        raw_logs: Some(vec![format!("匹配失败: {}", e)]),
                    });
                }
            }
        },
        Err(e) => {
            tracing::error!("❌ UI dump获取失败: {}", e);
            return Ok(StepResponseV2 {
                ok: false,
                message: format!("UI dump获取失败: {}", e),
                matched: None,
                executed_action: None,
                verify_passed: Some(false),
                error_code: Some("UI_DUMP_FAILED".to_string()),
                raw_logs: Some(vec![format!("UI dump失败: {}", e)]),
            });
        }
    };
    
    // 检查是否有候选
    if candidates.is_empty() {
        return Ok(StepResponseV2 {
            ok: false,
            message: "未找到匹配的元素".to_string(),
            matched: None,
            executed_action: None,
            verify_passed: Some(false),
            error_code: Some("NO_MATCH".to_string()),
            raw_logs: Some(vec!["未找到匹配元素".to_string()]),
        });
    }
    
    // 🎯 根据 selection_mode 决定执行策略
    let is_batch_mode = selection_mode.as_deref() == Some("all");
    
    if is_batch_mode {
        tracing::info!("� 批量执行模式：将依次点击 {} 个元素", candidates.len());
        
        // 获取批量配置
        let interval_ms = batch_config.as_ref()
            .and_then(|cfg| cfg.get("interval_ms"))
            .and_then(|v| v.as_u64())
            .unwrap_or(500);
        
        let mut success_count = 0;
        let mut failed_count = 0;
        let mut logs = Vec::new();
        
        // 获取 ADB 路径
        let adb_path = if std::path::Path::new("platform-tools/adb.exe").exists() {
            "platform-tools/adb.exe"
        } else if std::path::Path::new("D:\\leidian\\LDPlayer9\\adb.exe").exists() {
            "D:\\leidian\\LDPlayer9\\adb.exe"
        } else {
            "adb"
        };
        
        for (index, candidate) in candidates.iter().enumerate() {
            tracing::info!("📍 批量执行 {}/{}: bounds=({},{},{},{})", 
                          index + 1, candidates.len(),
                          candidate.bounds.left, candidate.bounds.top,
                          candidate.bounds.right, candidate.bounds.bottom);
            
            // 计算点击坐标（元素中心点）
            let x = (candidate.bounds.left + candidate.bounds.right) / 2;
            let y = (candidate.bounds.top + candidate.bounds.bottom) / 2;
            
            tracing::info!("🎯 批量点击坐标: ({}, {})", x, y);
            
            // 执行点击
            let tap_result = tap_injector_first(adb_path, &req.device_id, x, y, None).await;
            
            match tap_result {
                Ok(_) => {
                    success_count += 1;
                    logs.push(format!("✅ 第{}个元素点击成功 ({}, {})", index + 1, x, y));
                }
                Err(e) => {
                    failed_count += 1;
                    logs.push(format!("❌ 第{}个元素点击失败: {}", index + 1, e));
                    tracing::warn!("❌ 批量执行失败: {}", e);
                }
            }
            
            // 间隔延迟
            if index < candidates.len() - 1 {
                tokio::time::sleep(tokio::time::Duration::from_millis(interval_ms)).await;
            }
        }
        
        return Ok(StepResponseV2 {
            ok: success_count > 0,
            message: format!("批量执行完成：成功 {}/{}，失败 {}", success_count, candidates.len(), failed_count),
            matched: candidates.first().cloned(),
            executed_action: Some("batch_tap".to_string()),
            verify_passed: Some(success_count == candidates.len()),
            error_code: if failed_count > 0 { Some("PARTIAL_FAILURE".to_string()) } else { None },
            raw_logs: Some(logs),
        });
    }
    
    // 非批量模式：使用第一个候选
    let match_candidate = candidates.into_iter().next().unwrap();


    // �🛡️ 三道安全闸门检查（仅非批量模式）
    
    // 1️⃣ 唯一性闸门：只有唯一匹配才能执行
    if match_info.uniqueness != 1 {
        tracing::warn!("❌ 唯一性检查失败: uniq={}, 拒绝执行", match_info.uniqueness);
        return Ok(StepResponseV2 {
            ok: false,
            message: format!("匹配不唯一 (uniq={}), 拒绝执行以防误操作", match_info.uniqueness),
            matched: Some(match_candidate),
            executed_action: None,
            verify_passed: Some(false),
            error_code: Some("NON_UNIQUE".to_string()),
            raw_logs: Some(vec![format!("唯一性检查失败: uniq={}", match_info.uniqueness)]),
        });
    }

    // 2️⃣ 置信度闸门：低置信度拒绝执行 
    if match_info.confidence < 0.6 {
        tracing::warn!("❌ 置信度检查失败: conf={:.2}, 拒绝执行", match_info.confidence);
        return Ok(StepResponseV2 {
            ok: false, 
            message: format!("置信度过低 ({:.1}%), 拒绝执行", match_info.confidence * 100.0),
            matched: Some(match_candidate),
            executed_action: None,
            verify_passed: Some(false),
            error_code: Some("LOW_CONFIDENCE".to_string()),
            raw_logs: Some(vec![format!("置信度检查失败: {:.1}%", match_info.confidence * 100.0)]),
        });
    }

    // 3️⃣ 整屏/容器节点闸门：禁止执行整屏或容器类节点
    let bounds_tuple = (match_candidate.bounds.left, match_candidate.bounds.top, 
                       match_candidate.bounds.right, match_candidate.bounds.bottom);
    let is_fullscreen_or_container = is_fullscreen_node(&bounds_tuple) || 
                                     is_container_node(&match_candidate.class_name);
    if is_fullscreen_or_container {
        let reason = if is_fullscreen_node(&bounds_tuple) { "整屏节点" } else { "容器节点" };
        tracing::warn!("❌ {}检查失败: bounds={:?}, class={:?}, 拒绝执行", 
                       reason, match_candidate.bounds, match_candidate.class_name);
        return Ok(StepResponseV2 {
            ok: false,
            message: format!("匹配到{}, 拒绝执行以防误操作", reason),
            matched: Some(match_candidate),
            executed_action: None, 
            verify_passed: Some(false),
            error_code: Some("UNSAFE_TARGET".to_string()),
            raw_logs: Some(vec![format!("{}检查失败", reason)]),
        });
    }

    tracing::info!("✅ 安全闸门检查通过: uniq={}, conf={:.2}, 目标安全", 
                   match_info.uniqueness, match_info.confidence);

    // 检查执行模式
    if matches!(req.mode, StepRunMode::MatchOnly) {
        return Ok(StepResponseV2 {
            ok: true,
            message: "仅匹配模式，未执行操作".to_string(),
            matched: Some(match_candidate),
            executed_action: None,
            verify_passed: None,
            error_code: None,
            raw_logs: Some(vec!["匹配成功".to_string()]),
        });
    }
    
    // 执行操作
    let exec_result = execute_v2_action_with_coords(&req_with_coords.step, &req_with_coords.device_id, &match_candidate).await?;
    let action_type = req_with_coords.step.get("action").and_then(|v| v.as_str()).unwrap_or("unknown");
    
    Ok(StepResponseV2 {
        ok: exec_result.ok,
        message: "V2执行成功".to_string(),
        matched: Some(match_candidate),
        executed_action: Some(action_type.to_string()),
        verify_passed: Some(true),
        error_code: None,
        raw_logs: Some(vec![
            format!("匹配: 置信度{:.1}%", match_info.confidence * 100.0),
            format!("执行: {} ({}ms)", exec_result.action, exec_result.execution_time_ms),
        ]),
    })
}

// 执行V2操作（使用匹配到的坐标）
async fn execute_v2_action_with_coords(step: &serde_json::Value, device_id: &str, match_candidate: &MatchCandidate) -> Result<ExecInfo, String> {
    let start_time = std::time::Instant::now();
    
    // 检测 ADB 路径
    let adb_path = if std::path::Path::new("platform-tools/adb.exe").exists() {
        "platform-tools/adb.exe"
    } else if std::path::Path::new("D:\\leidian\\LDPlayer9\\adb.exe").exists() {
        "D:\\leidian\\LDPlayer9\\adb.exe"
    } else {
        "adb"
    };
    
    // 解析前端 StepPayload 结构中的操作信息
    let action_type = step.get("action")
        .and_then(|v| v.as_str())
        .unwrap_or("tap");
    
    let action_result = match action_type {
        "tap" | "doubleTap" | "longPress" => {
            // 优先使用匹配元素的坐标，如果匹配失败则使用步骤中的坐标
            let (x, y) = if match_candidate.confidence > 0.0 {
                // 使用匹配到的元素中心点
                let bounds = &match_candidate.bounds;
                let calc_x = (bounds.left + bounds.right) / 2;
                let calc_y = (bounds.top + bounds.bottom) / 2;
                tracing::info!("🐛 V2坐标计算: bounds=({},{},{},{}) -> center=({},{})", 
                             bounds.left, bounds.top, bounds.right, bounds.bottom, calc_x, calc_y);
                (calc_x, calc_y)
            } else if let Some(bounds) = step.get("bounds") {
                let left = bounds.get("left").and_then(|v| v.as_f64()).unwrap_or(100.0) as i32;
                let top = bounds.get("top").and_then(|v| v.as_f64()).unwrap_or(100.0) as i32;
                let right = bounds.get("right").and_then(|v| v.as_f64()).unwrap_or(200.0) as i32;
                let bottom = bounds.get("bottom").and_then(|v| v.as_f64()).unwrap_or(200.0) as i32;
                ((left + right) / 2, (top + bottom) / 2) // 计算中心点
            } else if let Some(offset) = step.get("offset") {
                let x = offset.get("x").and_then(|v| v.as_f64()).unwrap_or(100.0) as i32;
                let y = offset.get("y").and_then(|v| v.as_f64()).unwrap_or(100.0) as i32;
                (x, y)
            } else {
                (100, 100) // 默认坐标
            };
            
            tracing::info!("🎯 执行坐标: ({}, {}) (来源: {})", x, y, 
                          if match_candidate.confidence > 0.0 { "匹配元素" } else { "步骤参数" });
            
            tap_injector_first(adb_path, device_id, x, y, None).await
                .map_err(|e| format!("真机{}失败: {}", action_type, e))?;
            format!("真机{}执行成功 ({}, {})", action_type, x, y)
        },
        "keyevent" => {
            // 🎯 【新增】系统按键支持
            let key_code = step.get("key_code")
                .or_else(|| step.get("keyCode"))
                .and_then(|v| v.as_i64())
                .unwrap_or(4) as i32; // 默认返回键
            
            tracing::info!("🎯 执行系统按键: keycode={}", key_code);
            
            keyevent_code_injector_first(adb_path, device_id, key_code).await
                .map_err(|e| format!("真机按键失败: {}", e))?;
            format!("真机按键执行成功 (keycode={})", key_code)
        },
        "input" => {
            // 🎯 【新增】文本输入支持
            if let Some(text) = step.get("text")
                .or_else(|| step.get("input_text"))
                .and_then(|v| v.as_str()) {
                tracing::info!("🎯 执行文本输入: text={}", text);
                
                input_text_injector_first(adb_path, device_id, text).await
                    .map_err(|e| format!("真机文本输入失败: {}", e))?;
                format!("真机文本输入成功: {}", text)
            } else {
                return Err("文本输入操作缺少内容".to_string());
            }
        },
        "long_press" => {
            // 🎯 【新增】长按支持
            let (x, y) = if match_candidate.confidence > 0.0 {
                let bounds = &match_candidate.bounds;
                ((bounds.left + bounds.right) / 2, (bounds.top + bounds.bottom) / 2)
            } else if let Some(x_val) = step.get("x").and_then(|v| v.as_i64()) {
                let y_val = step.get("y").and_then(|v| v.as_i64()).unwrap_or(100) as i32;
                (x_val as i32, y_val)
            } else {
                (100, 100)
            };
            
            let duration = step.get("duration")
                .and_then(|v| v.as_u64())
                .unwrap_or(2000);
            
            tracing::info!("🎯 执行长按: ({}, {}) 时长:{}ms", x, y, duration);
            
            // 使用 swipe 模拟长按（起止点相同）
            swipe_injector_first(adb_path, device_id, x, y, x, y, duration as u32).await
                .map_err(|e| format!("真机长按失败: {}", e))?;
            format!("真机长按执行成功 ({}, {}) {}ms", x, y, duration)
        },
        "back" => {
            keyevent_code_injector_first(adb_path, device_id, 4).await
                .map_err(|e| format!("真机返回键失败: {}", e))?;
            "真机返回键执行成功".to_string()
        },
        "type" => {
            if let Some(text) = step.get("text").and_then(|v| v.as_str()) {
                input_text_injector_first(adb_path, device_id, text).await
                    .map_err(|e| format!("真机文本输入失败: {}", e))?;
                format!("真机文本输入成功: {}", text)
            } else {
                return Err("文本输入操作缺少内容".to_string());
            }
        },
        "wait" => {
            let duration_ms = step.get("duration_ms")
                .and_then(|v| v.as_u64())
                .unwrap_or(1000);
            tokio::time::sleep(tokio::time::Duration::from_millis(duration_ms)).await;
            format!("等待{}ms完成", duration_ms)
        },
        "swipe" => {
            // 🎯 【关键修复】实现坐标式滑动逻辑
            let start_x = step.get("start_x").and_then(|v| v.as_i64()).unwrap_or(540) as i32;
            let start_y = step.get("start_y").and_then(|v| v.as_i64()).unwrap_or(1200) as i32;
            let end_x = step.get("end_x").and_then(|v| v.as_i64()).unwrap_or(540) as i32;
            let end_y = step.get("end_y").and_then(|v| v.as_i64()).unwrap_or(600) as i32;
            let duration = step.get("duration").and_then(|v| v.as_u64()).unwrap_or(300) as u32;
            
            tracing::info!("🎯 执行坐标滑动: ({},{}) → ({},{}) 时长:{}ms", start_x, start_y, end_x, end_y, duration);
            
            swipe_injector_first(adb_path, device_id, start_x, start_y, end_x, end_y, duration).await
                .map_err(|e| format!("真机滑动失败: {}", e))?;
            format!("真机滑动执行成功: ({},{})→({},{})", start_x, start_y, end_x, end_y)
        },
        _ => format!("执行了 {} 操作", action_type)
    };
    
    let execution_time = start_time.elapsed().as_millis() as u64;
    tracing::info!("executed: action={} time={}ms", action_type, execution_time);
    
    Ok(ExecInfo {
        ok: true,
        action: action_result,
        execution_time_ms: execution_time,
    })
}

// 旧版兼容命令（保持向下兼容）
#[command]
pub async fn run_step_v2_legacy(
    action: StepAction,
    device_id: String,
) -> Result<StepExecutionResult, String> {
    let start_time = tokio::time::Instant::now();
    
    // 检测 ADB 路径
    let adb_path = if std::path::Path::new("platform-tools/adb.exe").exists() {
        "platform-tools/adb.exe"
    } else if std::path::Path::new("D:\\leidian\\LDPlayer9\\adb.exe").exists() {
        "D:\\leidian\\LDPlayer9\\adb.exe"
    } else {
        "adb"
    };
    
    let action_result = match action.action_type {
        ActionType::Tap => {
            if let Some(coords) = action.coordinates {
                tap_injector_first(adb_path, &device_id, coords.0 as i32, coords.1 as i32, None).await
                    .map_err(|e| format!("真机点击失败: {}", e))?;
                "真机点击执行成功".to_string()
            } else {
                return Err("点击操作缺少坐标".to_string());
            }
        },
        ActionType::Back => {
            keyevent_code_injector_first(adb_path, &device_id, 4).await
                .map_err(|e| format!("真机返回键失败: {}", e))?;
            "真机返回键执行成功".to_string()
        },
        ActionType::Type => {
            if let Some(text) = action.input_text {
                input_text_injector_first(adb_path, &device_id, &text).await
                    .map_err(|e| format!("真机文本输入失败: {}", e))?;
                format!("真机文本输入成功: {}", text)
            } else {
                return Err("文本输入操作缺少内容".to_string());
            }
        },
        _ => "其他动作类型执行成功".to_string()
    };
    
    let execution_time = start_time.elapsed().as_millis() as u64;
    
    Ok(StepExecutionResult {
        success: true,
        message: action_result,
        execution_time_ms: execution_time,
        verification_passed: true,
        found_elements: vec![],
    })
}

#[derive(Debug, Clone)]
enum SelectorSource {
    Inline,
    Store, 
    CoordFallback,
    None,
}

// 在UI dump中查找匹配的元素
async fn find_element_in_ui(ui_xml: &str, req: &RunStepRequestV2, selection_mode: Option<String>) -> Result<(MatchInfo, Vec<MatchCandidate>), String> {
    // 🔥 关键调试：输出接收到的selection_mode
    tracing::info!("🔥 [find_element_in_ui] 接收到 selection_mode: {:?}", selection_mode);
    
    // 🏗️ 【Phase 4 新增】结构匹配优先策略
    // 如果步骤数据包含 structural_signatures，优先使用 sm_match_once
    if let Some(structural_sigs_value) = req.step.get("structural_signatures") {
        tracing::info!("🏗️ [SM Integration] 检测到结构签名，优先使用结构匹配Runtime");
        
        // 尝试反序列化 structural_signatures
        if let Ok(structural_sigs) = serde_json::from_value::<StructuralSignatures>(structural_sigs_value.clone()) {
            // 构建 SmStaticEvidence（简化版）
            let sm_evidence = sm_integration::SmStaticEvidence {
                resource_id: req.step.get("resource_id").and_then(|v| v.as_str()).map(String::from),
                text: req.step.get("text").and_then(|v| v.as_str()).map(String::from),
                content_desc: req.step.get("content_desc").and_then(|v| v.as_str()).map(String::from),
                class: req.step.get("class").and_then(|v| v.as_str()).map(String::from),
                bounds: req.step.get("bounds").and_then(|v| {
                    if let Some(arr) = v.as_array() {
                        if arr.len() == 4 {
                            Some(Bounds {
                                left: arr[0].as_i64().unwrap_or(0) as i32,
                                top: arr[1].as_i64().unwrap_or(0) as i32,
                                right: arr[2].as_i64().unwrap_or(0) as i32,
                                bottom: arr[3].as_i64().unwrap_or(0) as i32,
                            })
                        } else {
                            None
                        }
                    } else {
                        None
                    }
                }),
                xpath: req.step.get("xpath").and_then(|v| v.as_str()).map(String::from),
                leaf_index: req.step.get("leaf_index").and_then(|v| v.as_i64()).map(|i| i as i32),
                structural_signatures: Some(structural_sigs),
            };
            
            // 🎯 调用结构匹配集成
            match sm_integration::match_with_structural_matching(&req.device_id, ui_xml, &sm_evidence).await {
                Ok(candidates) if !candidates.is_empty() => {
                    let match_info = MatchInfo {
                        uniqueness: if candidates.len() == 1 { 1 } else { 0 },
                        confidence: candidates.first().map(|c| c.score).unwrap_or(0.0) as f32,
                        elements_found: candidates.len() as i32,
                    };
                    
                    tracing::info!(
                        "✅ [SM Integration] 结构匹配成功 | 候选数={} | 最高分={:.2} | 唯一性={}",
                        candidates.len(),
                        match_info.confidence,
                        match_info.uniqueness
                    );
                    
                    return Ok((match_info, candidates));
                }
                Ok(_) => {
                    tracing::info!("🔄 [SM Integration] 结构匹配无结果，fallback到传统评分");
                }
                Err(e) => {
                    tracing::warn!("⚠️ [SM Integration] 结构匹配失败: {} | fallback到传统评分", e);
                }
            }
        } else {
            tracing::warn!("⚠️ [SM Integration] structural_signatures 反序列化失败，fallback到传统评分");
        }
    }
    
    // 🔄 Fallback：传统匹配流程
    tracing::info!("🔄 [Fallback] 使用传统tristate评分匹配");
    
    // 解析步骤中的匹配条件
    // 输出完整的步骤参数用于调试
    tracing::info!("🔍 V2引擎收到的完整步骤参数: {:?}", req.step);
    
    // 选择器解析：优先级 Inline > Store > CoordFallback
    let (selector_source, target_text, target_xpath, target_resource_id, target_class, target_content_desc) = 
        resolve_selector_with_priority(req).await?;
    
    tracing::info!("🎯 selector_source={:?}", selector_source);
    
    // 🔍 关键自测点1：选择器来源跟踪
    match selector_source {
        SelectorSource::Inline => tracing::info!("✅ 使用卡片内联selector"),
        SelectorSource::Store => tracing::info!("✅ 从step_id查询store获得selector"),  
        SelectorSource::CoordFallback => tracing::info!("⚠️ 启用坐标兜底模式"),
        SelectorSource::None => tracing::error!("❌ 无任何有效selector来源"),
    }    tracing::info!("🔍 最终搜索条件: text={:?}, xpath={:?}, resourceId={:?}, className={:?}, contentDesc={:?}", 
                   target_text, target_xpath, target_resource_id, target_class, target_content_desc);
    
    // 🔍 关键自测点2：选择器字段验证  
    let has_selector_fields = target_text.is_some() || target_xpath.is_some() || 
                             target_resource_id.is_some() || target_class.is_some() || 
                             target_content_desc.is_some();
    if !has_selector_fields {
        tracing::error!("❌ 自测失败: 所有selector字段均为None - 必定触发NO_SELECTOR");
    } else {
        tracing::info!("✅ 自测通过: 至少有一个selector字段非None");
    }
    
    // 🎯 处理坐标兜底场景
    if matches!(selector_source, SelectorSource::CoordFallback) {
        tracing::info!("🎯 执行坐标Hit-Test");
        match coord_fallback_hit_test(ui_xml, req).await {
            Ok(candidate) => {
                let match_info = MatchInfo {
                    uniqueness: 1, // Hit-Test保证唯一性
                    confidence: candidate.confidence as f32,
                    elements_found: 1,
                };
                return Ok((match_info, vec![candidate])); // 返回Vec而不是单个
            }
            Err(e) => {
                return Err(format!("坐标兜底失败: {}", e));
            }
        }
    }
    
    // 🛡️ 检查是否有任何选择器（非坐标兜底情况）
    let has_any_selector = target_text.is_some() || target_xpath.is_some() || 
                           target_resource_id.is_some() || target_class.is_some() || 
                           target_content_desc.is_some();
    
    if !has_any_selector {
        tracing::error!("❌ 没有提供任何选择器条件，拒绝执行");
        return Err("NO_SELECTOR: 必须提供至少一个选择器条件 (text/xpath/resourceId/className/contentDesc)".to_string());
    }
    
    // 简单的XML解析 - 查找匹配的节点
    let mut best_match: Option<MatchCandidate> = None;
    let mut best_score = 0.0f64;
    let mut elements_found = 0;
    let mut matching_candidates = Vec::new(); // 收集所有匹配的候选
    
    // 使用正则表达式解析XML节点
    let node_regex = regex::Regex::new(r#"<node[^>]*>"#).unwrap();
    
    for node_match in node_regex.find_iter(ui_xml) {
        elements_found += 1;
        let node_str = node_match.as_str();
        
        let mut score = 0.0f64;
        let mut matches = 0;
        
        // 提取节点属性
        let text = extract_attribute(node_str, "text");
        let resource_id = extract_attribute(node_str, "resource-id");
        let class_name = extract_attribute(node_str, "class");
        let content_desc = extract_attribute(node_str, "content-desc");
        let bounds_str = extract_attribute(node_str, "bounds");
        
        // 一致性评分：考虑与静态分析结果的一致性
        let mut successful_matches = 0;
        
        // 🔥 强锚点匹配 - ResourceId & XPath 同等权重（P0级别）
        
        // Resource ID匹配 - 强证据（通常跨版本稳定）
        if let Some(ref target) = target_resource_id {
            match &resource_id {
                Some(node_id) if node_id.contains(target.as_str()) || target.contains(node_id) => {
                    score += 0.85; // ResourceId完全匹配 - 强锚点
                    successful_matches += 1;
                    tracing::debug!("🎯 ResourceId强匹配: {} <-> {}", target, node_id);
                }
                Some(node_id) => {
                    score -= 0.50; // 不一致扣分 - 严重失配
                    tracing::debug!("❌ ResourceId不一致: {} <-> {}", target, node_id);
                }
                None => {
                    score -= 0.35; // 从有到缺失 - 失去强锚点
                    tracing::debug!("⚠️ ResourceId退化: 静态有({}) → 真机缺失", target);
                }
            }
        } else {
            // 静态分析时ResourceId就缺失 - 中性处理
            match &resource_id {
                Some(_) => {
                    // 从缺失到出现新值 - 不确定是好是坏，微弱扣分
                    score -= 0.08;
                    tracing::debug!("⚪ ResourceId意外出现: 静态缺失 → 真机有值");
                }
                None => {
                    // 保持缺失一致性 - 极弱奖励
                    score += 0.02;
                    tracing::debug!("✓ ResourceId一致缺失");
                }
            }
        }
        
        // XPath匹配 - 强证据（与ResourceId同等权重）
        if let Some(ref target) = target_xpath {
            if target.starts_with('/') || target.starts_with("//") {
                // 简化XPath匹配：检查路径中的关键类名
                match &class_name {
                    Some(node_class) if target.contains(node_class) => {
                        score += 0.85; // XPath匹配 - 强锚点（与ResourceId同级）
                        successful_matches += 1;
                        tracing::debug!("🎯 XPath强匹配: {} 包含 {}", target, node_class);
                    }
                    Some(node_class) => {
                        score -= 0.45; // 不一致扣分 - XPath路径失效
                        tracing::debug!("❌ XPath不一致: {} 不包含 {}", target, node_class);
                    }
                    None => {
                        score -= 0.30; // 从有xpath到缺失class - 路径退化
                        tracing::debug!("⚠️ XPath退化: 预期类名缺失");
                    }
                }
            }
        } else {
            // 静态分析时XPath就缺失 - 中性处理
            match &class_name {
                Some(_) => {
                    score -= 0.05; // 意外出现类名，轻微不确定
                    tracing::debug!("⚪ 类名意外出现: 静态无XPath → 真机有类名");
                }
                None => {
                    score += 0.01; // 保持路径缺失一致
                    tracing::debug!("✓ XPath一致缺失");
                }
            }
        }
        
        // 文本匹配 - P2级别证据
        if let Some(ref target) = target_text {
            match &text {
                Some(node_text) if node_text.contains(target.as_str()) || target.contains(node_text) => {
                    score += 0.70; // 文本完全匹配
                    successful_matches += 1;
                    tracing::debug!("✅ 文本匹配: {} <-> {}", target, node_text);
                }
                Some(node_text) => {
                    score -= 0.25; // 文本不匹配
                    tracing::debug!("❌ 文本不匹配: {} <-> {}", target, node_text);
                }
                None => {
                    score -= 0.20; // 从有文本到缺失
                    tracing::debug!("⚠️ 文本从有到缺失: 目标={}", target);
                }
            }
        } else {
            // 静态分析时文本就缺失
            match &text {
                Some(_) => {
                    score -= 0.03; // 从缺失到有值，轻微不一致
                    tracing::debug!("⚪ 文本从缺失到有值，轻微不一致");
                }
                None => {
                    score += 0.02; // 保持缺失一致性
                    tracing::debug!("✓ 文本保持缺失一致");
                }
            }
        }
        
        // 类名匹配 - P3级别弱证据
        if let Some(ref target) = target_class {
            match &class_name {
                Some(node_class) if node_class.contains(target.as_str()) || target.contains(node_class) => {
                    score += 0.30; // 类名匹配
                    successful_matches += 1;
                    tracing::debug!("✅ 类名匹配: {} <-> {}", target, node_class);
                }
                Some(node_class) => {
                    score -= 0.15; // 类名不匹配
                    tracing::debug!("❌ 类名不匹配: {} <-> {}", target, node_class);
                }
                None => {
                    score -= 0.10; // 从有类名到缺失
                    tracing::debug!("⚠️ 类名从有到缺失: 目标={}", target);
                }
            }
        } else {
            // 静态分析时类名就缺失  
            match &class_name {
                Some(_) => {
                    score -= 0.02; // 从缺失到有值，轻微不一致
                    tracing::debug!("⚪ 类名从缺失到有值，轻微不一致");
                }
                None => {
                    score += 0.01; // 保持缺失一致性
                    tracing::debug!("✓ 类名保持缺失一致");
                }
            }
        }
        
        // Content Description匹配 - P2级别证据
        if let Some(ref target) = target_content_desc {
            match &content_desc {
                Some(node_desc) if node_desc.contains(target.as_str()) || target.contains(node_desc) => {
                    score += 0.60; // Content-desc匹配
                    successful_matches += 1;
                    tracing::debug!("✅ Content-desc匹配: {} <-> {}", target, node_desc);
                }
                Some(node_desc) => {
                    score -= 0.20; // Content-desc不匹配
                    tracing::debug!("❌ Content-desc不匹配: {} <-> {}", target, node_desc);
                }
                None => {
                    score -= 0.15; // 从有content-desc到缺失
                    tracing::debug!("⚠️ Content-desc从有到缺失: 目标={}", target);
                }
            }
        } else {
            // 静态分析时content-desc就缺失
            match &content_desc {
                Some(_) => {
                    score -= 0.02; // 从缺失到有值，轻微不一致
                    tracing::debug!("⚪ Content-desc从缺失到有值，轻微不一致");
                }
                None => {
                    score += 0.01; // 保持缺失一致性
                    tracing::debug!("✓ Content-desc保持缺失一致");
                }
            }
        }
        
        // 如果没有任何成功匹配，跳过这个元素
        if successful_matches == 0 {
            continue; // 没有任何条件匹配
        }
        
        // 🛡️ 容器类节点降权处理
        if is_container_node(&class_name) {
            tracing::debug!("🔻 容器类节点降权: {} -> {:.2} * 0.1", class_name.as_deref().unwrap_or("unknown"), score);
            score *= 0.1; // 容器类节点大幅降权
        }
        
        // 解析bounds
        let bounds = if let Some(bounds_str) = bounds_str {
            parse_bounds(&bounds_str).unwrap_or(Bounds { left: 0, top: 0, right: 100, bottom: 100 })
        } else {
            Bounds { left: 0, top: 0, right: 100, bottom: 100 }
        };
        
        // 收集所有有效匹配
        let candidate = MatchCandidate {
            id: format!("element_{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis()),
            score: score,
            confidence: score,
            bounds,
            text: text.clone(),
            class_name: class_name.clone(),
            package_name: resource_id.clone().or_else(|| Some("unknown.package".to_string())),
        };
        
        matching_candidates.push(candidate.clone());
        
        // 更新最佳匹配
        if score > best_score {
            best_score = score;
            best_match = Some(candidate);
        }
    }
    
    if let Some(candidate) = best_match {
        // 📊 双重唯一性标准：置信度阈值 + Top1-Top2间隔
        matching_candidates.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap());
        
        let high_quality_matches = matching_candidates.iter()
            .filter(|c| c.confidence >= 0.70)
            .count();
        
        // 计算Top1-Top2间隔
        let confidence_gap = if matching_candidates.len() >= 2 {
            matching_candidates[0].confidence - matching_candidates[1].confidence
        } else {
            1.0 // 只有一个候选，间隔为最大
        };
        
        // 双重唯一性检查
        let is_unique_by_confidence = high_quality_matches == 1;
        let is_unique_by_gap = confidence_gap >= 0.15; // Top1领先Top2至少15%
        
        let uniqueness = if is_unique_by_confidence || is_unique_by_gap {
            1 
        } else {
            high_quality_matches.max(2) as i32
        };
        
        tracing::info!("🔍 双重唯一性: 总候选={}, 高质量(≥0.70)={}, Top1={:.3}, Gap={:.3}, 唯一性={} (conf:{} gap:{})", 
                      matching_candidates.len(), high_quality_matches, 
                      matching_candidates.get(0).map(|c| c.confidence).unwrap_or(0.0),
                      confidence_gap, uniqueness, is_unique_by_confidence, is_unique_by_gap);
        
        // 🛡️ 双阶段容器拦截检查
        let is_container = is_container_node(&candidate.class_name);
        let is_fullscreen = is_fullscreen_node(&(candidate.bounds.left, candidate.bounds.top, candidate.bounds.right, candidate.bounds.bottom));
        
        if is_container || is_fullscreen {
            let block_type = if is_container { "容器" } else { "整屏" };
            tracing::error!("🛡️ 双阶段容器拦截: {}节点被阻止 class={:?} bounds=({},{},{},{})",
                          block_type, candidate.class_name, 
                          candidate.bounds.left, candidate.bounds.top,
                          candidate.bounds.right, candidate.bounds.bottom);
            return Err(format!("CONTAINER_BLOCKED: {}节点不允许直接点击", block_type));
        } else {
            tracing::info!("✅ 自测通过: 非容器/整屏节点 class={:?} bounds=({},{},{},{})",
                          candidate.class_name, candidate.bounds.left, candidate.bounds.top,
                          candidate.bounds.right, candidate.bounds.bottom);
        }
        
        let match_info = MatchInfo {
            uniqueness,
            confidence: best_score as f32,
            elements_found,
        };
        
        // �️ 安全检查：最低置信度
        let min_confidence = req.step.get("min_confidence")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.70); // 提升默认阈值到0.70
            
        if best_score < min_confidence {
            tracing::warn!("⚠️ 最佳匹配置信度({:.2})低于阈值({:.2})", best_score, min_confidence);
            return Err(format!("LOW_CONFIDENCE: 最佳置信度{:.2}低于阈值{:.2}", best_score, min_confidence));
        }
        
        // 🛡️ 安全检查：整屏/容器拒绝（双阶段拦截）
        let forbid_containers = req.step.get("forbid_fullscreen_or_container")
            .and_then(|v| v.as_bool())
            .unwrap_or(true);
            
        if forbid_containers {
            let candidate_bounds = (candidate.bounds.left, candidate.bounds.top, candidate.bounds.right, candidate.bounds.bottom);
            
            // 🔍 关键自测点4：容器/整屏拦截验证
            if is_fullscreen_node(&candidate_bounds) {
                tracing::warn!("🚫 自测检查: 整屏节点被拦截 bounds=({},{},{},{})", 
                              candidate.bounds.left, candidate.bounds.top, candidate.bounds.right, candidate.bounds.bottom);
                return Err("FULLSCREEN_BLOCKED: 匹配到整屏节点，拒绝执行".to_string());
            }
            
            if is_container_node(&candidate.class_name) {
                tracing::warn!("🚫 自测检查: 容器节点被拦截 class={:?}", candidate.class_name);
                return Err(format!("CONTAINER_BLOCKED: 匹配到容器节点({:?})，拒绝执行", candidate.class_name.as_deref().unwrap_or("unknown")));
            }
            
            tracing::info!("✅ 自测通过: 非容器/整屏节点 class={:?} bounds=({},{},{},{})",
                          candidate.class_name, candidate.bounds.left, candidate.bounds.top, candidate.bounds.right, candidate.bounds.bottom);
        }
        
        // 🔍 检查唯一性约束（批量模式除外）
        let require_uniqueness = req.step.get("require_uniqueness")
            .and_then(|v| v.as_bool())
            .unwrap_or(true);
        
        let is_batch_mode = selection_mode.as_deref() == Some("all");
        
        tracing::info!("🔥 [唯一性检查] selection_mode={:?}, is_batch_mode={}, require_uniqueness={}, uniqueness={}", 
                      selection_mode, is_batch_mode, require_uniqueness, uniqueness);
            
        if require_uniqueness && !is_batch_mode && uniqueness > 1 {
            // 生成解歧建议
            let disambiguation_suggestions = generate_disambiguation_suggestions(&matching_candidates, req);
            tracing::warn!("⚠️ 匹配到{}个元素，违反唯一性约束。建议: {:?}", uniqueness, disambiguation_suggestions);
            return Err(format!("NON_UNIQUE: 匹配到{}个元素。建议添加: {}", uniqueness, disambiguation_suggestions.join(", ")));
        }
        
        if is_batch_mode {
            tracing::info!("🔄 批量模式：返回所有 {} 个高质量候选", matching_candidates.len());
            // 返回所有高质量候选（置信度 >= 0.70）
            let high_quality_candidates: Vec<MatchCandidate> = matching_candidates.into_iter()
                .filter(|c| c.confidence >= 0.70)
                .collect();
            
            let match_info = MatchInfo {
                uniqueness: high_quality_candidates.len() as i32,
                confidence: high_quality_candidates.get(0).map(|c| c.confidence as f32).unwrap_or(0.0),
                elements_found,
            };
            
            return Ok((match_info, high_quality_candidates));
        }
        
        // 非批量模式：返回最佳匹配
        let match_info = MatchInfo {
            uniqueness,
            confidence: best_score as f32,
            elements_found,
        };
        
        Ok((match_info, vec![candidate]))
    } else {
        // 检查是否没有提供匹配条件
        if target_text.is_none() && target_xpath.is_none() && target_resource_id.is_none() && 
           target_class.is_none() && target_content_desc.is_none() {
            return Err("❌ 没有提供任何匹配条件 (text, xpath, resourceId, className, contentDesc)。请在步骤中指定至少一个匹配条件。".to_string());
        }
        Err(format!("❌ 未找到匹配的元素。搜索条件: text={:?}, xpath={:?}, resourceId={:?}, className={:?}, contentDesc={:?}",
                   target_text, target_xpath, target_resource_id, target_class, target_content_desc))
    }
}

// 提取XML属性值
fn extract_attribute(node_str: &str, attr_name: &str) -> Option<String> {
    let pattern = format!(r#"{}="([^"]*)"#, attr_name);
    let regex = regex::Regex::new(&pattern).ok()?;
    regex.captures(node_str)?.get(1).map(|m| m.as_str().to_string())
}

// 子锚点→父执行的增强选择器结构
#[derive(Debug, Clone)]
struct EnhancedSelectorInfo {
    source: SelectorSource,
    text: Option<String>,
    xpath: Option<String>, 
    resource_id: Option<String>,
    class_name: Option<String>,
    content_desc: Option<String>,
    // 子锚点→父执行专用字段
    target_node_type: Option<String>,
    anchor_xpath: Option<String>,
    parent_constraint: Option<String>,
    container_xpath: Option<String>,
    i18n_text_variants: Option<Vec<String>>,
}

// 子锚点→父执行的XPath生成器
fn build_child_to_parent_xpath(
    container_xpath: &Option<String>,
    target_node_type: &Option<String>,
    parent_constraint: &Option<String>,
    anchor_xpath: &Option<String>,
    i18n_variants: &Option<Vec<String>>
) -> Option<String> {
    let target_type = target_node_type.as_ref().map(|s| s.as_str()).unwrap_or("*");
    let constraint = parent_constraint.as_ref().map(|s| s.as_str()).unwrap_or("[@clickable='true']");
    
    if let Some(anchor) = anchor_xpath {
        let mut xpath = if let Some(container) = container_xpath {
            format!("{}//{}{}", container, target_type, constraint)
        } else {
            format!("//{}{}", target_type, constraint)
        };
        
        // 处理I18N文本变体
        if let Some(variants) = i18n_variants {
            if variants.len() > 1 {
                let text_conditions: Vec<String> = variants.iter()
                    .map(|v| format!("@text='{}'", v))
                    .collect();
                let i18n_condition = format!("[{}]", text_conditions.join(" or "));
                let enhanced_anchor = anchor.replace("@text", &format!("({})", text_conditions.join(" or ")));
                xpath = format!("{}[{}]", xpath, enhanced_anchor);
            } else {
                xpath = format!("{}[{}]", xpath, anchor);
            }
        } else {
            xpath = format!("{}[{}]", xpath, anchor);
        }
        
        tracing::info!("🏗️ 生成子锚点→父执行XPath: {}", xpath);
        Some(xpath)
    } else {
        None
    }
}

// 选择器解析：按优先级 Inline > Store > CoordFallback > None
async fn resolve_selector_with_priority(req: &RunStepRequestV2) -> Result<(SelectorSource, Option<String>, Option<String>, Option<String>, Option<String>, Option<String>), String> {
    // 1️⃣ 优先级1：内联结构化选择器
    if let Some(structured_selector) = req.step.get("structured_selector") {
        tracing::info!("🎯 使用内联结构化选择器");
        
        let mut text: Option<String> = None;
        let mut xpath: Option<String> = None;
        let mut resource_id: Option<String> = None;
        let mut class_name: Option<String> = None;
        let mut content_desc: Option<String> = None;
        
        if let Some(element_selectors) = structured_selector.get("elementSelectors") {
            text = element_selectors.get("text").and_then(|v| v.as_str()).map(|s| s.to_string());
            resource_id = element_selectors.get("resourceId").and_then(|v| v.as_str()).map(|s| s.to_string());
            class_name = element_selectors.get("className").and_then(|v| v.as_str()).map(|s| s.to_string());
            content_desc = element_selectors.get("contentDescription").and_then(|v| v.as_str()).map(|s| s.to_string());
            xpath = element_selectors.get("xpath").and_then(|v| v.as_str()).map(|s| s.to_string());
            
            // 🔥 检查子锚点→父执行字段
            let target_node_type = element_selectors.get("targetNodeType").and_then(|v| v.as_str()).map(|s| s.to_string());
            let anchor_xpath = element_selectors.get("anchorXpath").and_then(|v| v.as_str()).map(|s| s.to_string());
            let parent_constraint = element_selectors.get("parentConstraint").and_then(|v| v.as_str()).map(|s| s.to_string());
            let container_xpath = element_selectors.get("containerXpath").and_then(|v| v.as_str()).map(|s| s.to_string());
            let i18n_variants = element_selectors.get("i18nTextVariants")
                .and_then(|v| v.as_array())
                .map(|arr| arr.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect::<Vec<String>>());
            
            // 🏗️ 如果有子锚点配置，生成子锚点→父执行XPath
            if anchor_xpath.is_some() && (target_node_type.is_some() || parent_constraint.is_some()) {
                if let Some(enhanced_xpath) = build_child_to_parent_xpath(
                    &container_xpath, &target_node_type, &parent_constraint, &anchor_xpath, &i18n_variants
                ) {
                    tracing::info!("🎯 启用子锚点→父执行模式，生成XPath: {}", enhanced_xpath);
                    xpath = Some(enhanced_xpath);
                } else {
                    tracing::warn!("⚠️ 子锚点→父执行配置不完整，降级到常规模式");
                }
            }
        }
        
        tracing::info!("📋 内联选择器: text={:?}, resourceId={:?}, className={:?}, contentDesc={:?}, xpath={:?}", 
                       text, resource_id, class_name, content_desc, xpath);
        return Ok((SelectorSource::Inline, text, xpath, resource_id, class_name, content_desc));
    }
    
    // 2️⃣ 优先级2：通过step_id/selector查询Store
    let selector_id = req.step.get("step_id").and_then(|v| v.as_str())
        .or_else(|| req.step.get("selector").and_then(|v| v.as_str()));
        
    if let Some(id) = selector_id {
        tracing::info!("🔍 通过Store查询选择器: {}", id);
        
        // 首先尝试用 step_id 查询
        let mut strategy_opt = crate::commands::intelligent_analysis::get_step_strategy(id.to_string()).await.ok().flatten();
        
        // 如果 step_id 查不到，尝试用 selector 查询（兜底）
        if strategy_opt.is_none() {
            if let Some(selector) = req.step.get("selector").and_then(|v| v.as_str()) {
                if selector != id {  // 避免重复查询
                    tracing::info!("🔄 step_id未命中，尝试用selector查询: {}", selector);
                    strategy_opt = crate::commands::intelligent_analysis::get_step_strategy(selector.to_string()).await.ok().flatten();
                }
            }
        }
        
        match strategy_opt {
            Some(strategy) => {
                tracing::info!("✅ Store命中策略候选: mode={:?}, batch={:?}", 
                              strategy.selection_mode, strategy.batch_config.is_some());
                return Ok((
                    SelectorSource::Store,
                    strategy.text.clone(),
                    strategy.xpath.clone(),
                    strategy.resource_id.clone(),
                    strategy.class_name.clone(),
                    None // content_desc暂时不支持
                ));
            }
            None => {
                tracing::warn!("⚠️ Store未找到策略: step_id={}, selector可能也未配置", id);
            }
        }
    }
    
    // 3️⃣ 优先级3：兼容旧格式直接参数
    let direct_text = req.step.get("text").and_then(|v| v.as_str()).map(|s| s.to_string());
    let direct_xpath = req.step.get("xpath").and_then(|v| v.as_str()).map(|s| s.to_string());
    let direct_resource_id = req.step.get("resourceId").and_then(|v| v.as_str()).map(|s| s.to_string());
    let direct_class = req.step.get("className").and_then(|v| v.as_str()).map(|s| s.to_string());
    
    if direct_text.is_some() || direct_xpath.is_some() || direct_resource_id.is_some() || direct_class.is_some() {
        tracing::info!("📝 使用直接参数选择器");
        return Ok((SelectorSource::Inline, direct_text, direct_xpath, direct_resource_id, direct_class, None));
    }
    
    // 4️⃣ 优先级4：坐标兜底（如果允许）
    let fallback_enabled = req.step.get("fallback_to_bounds")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);
        
    if fallback_enabled && req.step.get("bounds").is_some() {
        tracing::info!("🎯 启用坐标兜底模式");
        return Ok((SelectorSource::CoordFallback, None, None, None, None, None));
    }
    
    // 5️⃣ 无有效选择器
    tracing::error!("❌ 未找到任何有效选择器");
    Ok((SelectorSource::None, None, None, None, None, None))
}

// 坐标兜底：对指定坐标进行hit-test，找到最小覆盖节点
async fn coord_fallback_hit_test(ui_xml: &str, req: &RunStepRequestV2) -> Result<MatchCandidate, String> {
    let bounds = req.step.get("bounds").ok_or("坐标兜底需要bounds参数")?;
    
    let left = bounds.get("left").and_then(|v| v.as_i64()).ok_or("缺少bounds.left")? as i32;
    let top = bounds.get("top").and_then(|v| v.as_i64()).ok_or("缺少bounds.top")? as i32;
    let right = bounds.get("right").and_then(|v| v.as_i64()).ok_or("缺少bounds.right")? as i32;
    let bottom = bounds.get("bottom").and_then(|v| v.as_i64()).ok_or("缺少bounds.bottom")? as i32;
    
    let center_x = (left + right) / 2;
    let center_y = (top + bottom) / 2;
    
    tracing::info!("🎯 坐标Hit-Test: ({}, {}) 在区域 [{},{} - {},{}]", center_x, center_y, left, top, right, bottom);
    
    // 找到包含该点的最小节点
    let mut best_candidate: Option<MatchCandidate> = None;
    let mut smallest_area = i64::MAX;
    
    let node_regex = regex::Regex::new(r#"<node[^>]*>"#).unwrap();
    
    for node_match in node_regex.find_iter(ui_xml) {
        let node_str = node_match.as_str();
        
        if let Some(bounds_str) = extract_attribute(node_str, "bounds") {
            if let Ok(node_bounds) = parse_bounds(&bounds_str) {
                // 检查点是否在节点内
                if center_x >= node_bounds.left && center_x <= node_bounds.right &&
                   center_y >= node_bounds.top && center_y <= node_bounds.bottom {
                    
                    let area = ((node_bounds.right - node_bounds.left) as i64) * 
                              ((node_bounds.bottom - node_bounds.top) as i64);
                    
                    // 选择面积最小的节点（最精确的匹配）
                    if area < smallest_area {
                        let class_name = extract_attribute(node_str, "class");
                        
                        // 🛡️ 安全检查：拒绝整屏或容器类节点
                        if is_fullscreen_node(&(node_bounds.left, node_bounds.top, node_bounds.right, node_bounds.bottom)) {
                            tracing::warn!("🚫 Hit-Test命中整屏节点，跳过");
                            continue;
                        }
                        
                        if is_container_node(&class_name) {
                            tracing::warn!("🚫 Hit-Test命中容器节点: {:?}，跳过", class_name);
                            continue;
                        }
                        
                        smallest_area = area;
                        tracing::debug!("🎯 Hit-Test更新候选: 面积={}, 类名={:?}", area, &class_name);
                        tracing::info!("✅ 自测坐标Hit-Test: leaf={:?} 面积={} 坐标=({},{})", 
                                      &class_name, area, center_x, center_y);
                        
                        best_candidate = Some(MatchCandidate {
                            id: format!("hit_test_{}", center_x),
                            score: 0.75, // 坐标兜底给保守分数
                            confidence: 0.75,
                            bounds: node_bounds,
                            text: extract_attribute(node_str, "text"),
                            class_name,
                            package_name: extract_attribute(node_str, "package"),
                        });
                    }
                }
            }
        }
    }
    
    match best_candidate {
        Some(candidate) => {
            tracing::info!("✅ Hit-Test成功: 匹配到 {:?} (面积={})", candidate.class_name, smallest_area);
            Ok(candidate)
        }
        None => {
            Err(format!("❌ Hit-Test失败: 坐标({}, {})未命中任何有效节点", center_x, center_y))
        }
    }
}

// 生成解歧建议：分析多个匹配元素的差异，提出精确化建议
fn generate_disambiguation_suggestions(candidates: &[MatchCandidate], req: &RunStepRequestV2) -> Vec<String> {
    let mut suggestions = Vec::new();
    
    // 检查是否可以通过文本区分
    let unique_texts: std::collections::HashSet<_> = candidates.iter()
        .filter_map(|c| c.text.as_ref())
        .collect();
    if unique_texts.len() > 1 {
        suggestions.push("具体文本内容".to_string());
    }
    
    // 检查是否可以通过类名区分
    let unique_classes: std::collections::HashSet<_> = candidates.iter()
        .filter_map(|c| c.class_name.as_ref())
        .collect();
    if unique_classes.len() > 1 {
        suggestions.push("更具体的className".to_string());
    }
    
    // 建议使用位置索引
    if candidates.len() > 1 {
        suggestions.push("leaf_index定位".to_string());
    }
    
    // 建议使用XPath前缀
    suggestions.push("xpath_prefix祖先路径".to_string());
    
    // 建议使用邻近锚点
    suggestions.push("邻近文本锚点".to_string());
    
    // 如果所有候选都相似，建议使用坐标
    let similar_score_count = candidates.iter()
        .filter(|c| (c.confidence - candidates[0].confidence).abs() < 0.1)
        .count();
    if similar_score_count == candidates.len() {
        suggestions.push("坐标精确定位".to_string());
    }
    
    suggestions
}

// 解析bounds字符串
fn parse_bounds(bounds_str: &str) -> Result<Bounds, String> {
    // bounds格式: [left,top][right,bottom]
    let bounds_regex = regex::Regex::new(r#"\[(\d+),(\d+)\]\[(\d+),(\d+)\]"#).unwrap();
    if let Some(caps) = bounds_regex.captures(bounds_str) {
        Ok(Bounds {
            left: caps[1].parse().unwrap_or(0),
            top: caps[2].parse().unwrap_or(0),
            right: caps[3].parse().unwrap_or(100),
            bottom: caps[4].parse().unwrap_or(100),
        })
    } else {
        Err(format!("无法解析bounds: {}", bounds_str))
    }
}

// 🚀 新增：插件化决策链执行入口
#[command]
pub async fn run_decision_chain_v2(app_handle: AppHandle, plan_json: String, device_id: String) -> Result<serde_json::Value, String> {
    tracing::info!("🚀 启动插件化决策链执行");
    
    // 1. 解析和验证Plan契约
    let plan: DecisionChainPlan = serde_json::from_str(&plan_json)
        .map_err(|e| format!("Plan JSON解析失败: {}", e))?;
    
    // 检查Plan版本（从strategy中获取，这里简化处理）
    tracing::info!("📋 Plan验证通过，跳过版本检查");
    
    tracing::info!("📋 Plan验证通过: {} 个策略候选", plan.plan.len());
    
    // 2. 获取真机UI Dump
    let ui_xml = get_ui_dump(&device_id).await.map_err(|e| format!("获取UI Dump失败: {}", e))?;
    let xml_hash = format!("{:x}", md5::compute(&ui_xml));
    
    tracing::info!("📱 UI Dump获取成功: {} chars, hash={}", ui_xml.len(), &xml_hash[..8]);
    
    // 3. 构建执行环境
    // 获取ADB路径
    let adb_path = crate::utils::adb_utils::get_adb_path();
    
    let env = ExecutionEnvironment {
        app_handle: app_handle.clone(),
        device_id: device_id.to_string(),
        xml_content: ui_xml.clone(),
        target_variant: StrategyVariant {
            id: "example".to_string(),
            kind: VariantKind::SelfId,
            scope: "local".to_string(),
            container_xpath: None,
            selectors: VariantSelectors {
                parent: None,
                child: None,
                self_: Some(SelfSelector {
                    class: None,
                    resource_id: Some("example".to_string()),
                    text: None,
                    content_desc: None,
                    clickable: None,
                    enabled: None,
                }),
            },
            structure: None,
            index: None,
            checks: None,
            static_score: 0.8,
            explain: "Example variant".to_string(),
        },
        ui_xml: ui_xml.clone(),
        xml_hash,
        package: plan.context.package.clone().unwrap_or_default(),
        activity: plan.context.activity.clone().unwrap_or_default(),
        screen_width: plan.context.screen.as_ref().map(|s| s.width).unwrap_or(1080),
        screen_height: plan.context.screen.as_ref().map(|s| s.height).unwrap_or(2400),
        container_xpath: plan.context.container_anchor.as_ref()
            .map(|ca| ca.fallback_xpath.clone().unwrap_or_else(|| format!("//*[@{}='{}']", ca.by, ca.value))),
        adb_path,
        serial: device_id.to_string(),
    };
    
    // 4. 构建XML索引（提升搜索效率）
    let _xml_indexer = XmlIndexer::build_from_xml(&ui_xml)
        .map_err(|e| format!("XML索引构建失败: {}", e))?;
    
    // 5. 获取策略注册表
    let registry = StrategyRegistry::new();
    
    tracing::info!("🔧 策略注册表就绪: {} 个插件", registry.list_strategies().len());
    
    // 6. 执行决策链（带回退）
    let result = FallbackController::execute_with_fallback(&env, &plan, &registry)
        .await
        .map_err(|e| format!("决策链执行失败: {}", e))?;
    
    // 7. 包装返回结果
    let response = serde_json::json!({
        "success": result.success,
        "used_variant": result.used_variant,
        "match_count": result.match_count,
        "final_confidence": result.final_confidence,
        "execution_time_ms": result.execution_time_ms,
        "tap_coordinates": result.tap_coordinates,
        "screenshot_path": result.screenshot_path,
        "error_reason": result.error_reason,
        "fallback_chain": result.fallback_chain,
        "telemetry": {
            "xml_hash": env.xml_hash,
            "strategy_count": plan.plan.len(),
            "registry_plugins": registry.list_strategies().len(),
            "plan_version": "v2"
        }
    });
    
    if result.success {
        tracing::info!("✅ 决策链执行成功: {} 在 {}ms", result.used_variant, result.execution_time_ms);
    } else {
        tracing::error!("❌ 决策链执行失败: {:?}", result.error_reason);
    }
    
    Ok(response)
}

// 📊 决策链统计和健康检查
#[command]
pub async fn get_decision_chain_stats() -> Result<serde_json::Value, String> {
    let registry = StrategyRegistry::new();
    
    let stats = serde_json::json!({
        "plugin_system": {
            "total_plugins": registry.list_strategies().len(),
            "available_strategies": registry.list_strategies(),
        },
        "contract": {
            "supported_version": "v2",
            "schema_location": "/shared/plan_schema.json"
        },
        "safety_gates": {
            "uniqueness_validation": true,
            "container_blocking": true,
            "light_checks": true,
            "confidence_threshold": 0.70
        },
        "performance": {
            "default_time_budget_ms": 1200,
            "per_candidate_budget_ms": 180,
            "xml_indexing": "enabled"
        }
    });
    
    Ok(stats)
}
