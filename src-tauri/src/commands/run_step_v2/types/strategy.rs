// src-tauri/src/commands/run_step_v2/types/strategy.rs
// module: step-execution | layer: types | role: 策略类型
// summary: 决策链策略数据结构 - 策略变体、配置、上下文等

use serde::{Serialize, Deserialize};
use super::selector::VariantSelectors;

/// 完整决策链计划
#[derive(Debug, Clone, Deserialize)]
pub struct DecisionChainPlan {
    pub strategy: StrategyConfig,
    pub context: StaticAnalysisContext,
    pub child_anchors: Option<Vec<ChildAnchor>>,
    pub structural_signatures: Option<StructuralSignatures>,
    pub plan: Vec<StrategyVariant>, // 从强到弱排序的可执行配方
}

/// 策略配置
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

/// 静态分析上下文（策略专用）
#[derive(Debug, Clone, Deserialize)]
pub struct StaticAnalysisContext {
    pub unique_resource_id: bool,
    pub unique_content_desc: bool,
    pub has_stable_container: bool,
    pub has_text_anchor: bool,
    pub text_language: Option<String>,
    pub recommended_strategy: String,
    pub confidence: f32,
}

/// 子树锚点（解决"父无字段，子有字段"）
#[derive(Debug, Clone, Deserialize)]
pub struct ChildAnchor {
    pub anchor_type: String,     // "text" | "resource_id" | "content_desc" | "icon_id"
    pub equals: Option<String>,  // 精确匹配值
    pub contains: Option<String>, // 包含匹配值
    pub regex: Option<String>,   // 正则匹配
    pub i18n_alias: Option<Vec<String>>, // 多语言变体 ["收藏","Favorites","Starred"]
}

/// 结构签名
#[derive(Debug, Clone, Deserialize)]
pub struct StructuralSignatures {
    pub ancestor_class_chain: Option<Vec<String>>,
    pub sibling_signature: Option<String>,
    pub bounds_signature: Option<BoundsSignature>,
}

/// 边界签名
#[derive(Debug, Clone, Deserialize)]
pub struct BoundsSignature {
    pub width_ratio: f32,
    pub height_ratio: f32,
    pub center_x_ratio: f32,
    pub center_y_ratio: f32,
}

/// 策略变体（Plan中的单个策略）
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

/// 策略类型枚举
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

/// 结构提示
#[derive(Debug, Clone, Deserialize)]
pub struct StructureHint {
    pub relation: String,        // "parent_child" | "ancestor_descendant" | "sibling"
    pub direction: Option<String>, // "up" | "down" | "next" | "prev"
    pub levels: Option<i32>,
}

/// 索引提示
#[derive(Debug, Clone, Deserialize)]
pub struct IndexHint {
    pub local_index: Option<i32>, // 容器内第n个（从1开始）
    pub global_index: Option<i32>, // 全局第n个（尽量避免）
}

/// 轻量级检查
#[derive(Debug, Clone, Deserialize)]
pub struct LightCheck {
    pub check_type: String,      // "child_text_contains" | "child_text_contains_any" | "clickable" | "enabled"
    pub value: Option<String>,
    pub values: Option<Vec<String>>,
}
