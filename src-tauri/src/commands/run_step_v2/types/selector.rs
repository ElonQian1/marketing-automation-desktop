// src-tauri/src/commands/run_step_v2/types/selector.rs
// module: step-execution | layer: types | role: 选择器类型
// summary: 元素选择器数据结构 - 父/子/自身选择器、文本匹配器等

use serde::Deserialize;
use super::response::Bounds;
use super::strategy::BoundsSignature;

/// 元素选择器（V2协议）
#[derive(Debug, Clone, Deserialize)]
pub struct ElementSelector {
    pub text: Option<String>,
    pub content_desc: Option<String>,
    pub resource_id: Option<String>,
    pub class_name: Option<String>,
    pub xpath: Option<String>,
    pub bounds: Option<Bounds>,
}

/// 变体选择器（策略中使用）
#[derive(Debug, Clone, Deserialize)]
pub struct VariantSelectors {
    pub parent: Option<ParentSelector>,
    pub child: Option<ChildSelector>,
    pub self_: Option<SelfSelector>,
}

/// 父节点选择器
#[derive(Debug, Clone, Deserialize)]
pub struct ParentSelector {
    pub class: Option<String>,
    pub clickable: Option<bool>,
    pub enabled: Option<bool>,
    pub resource_id: Option<String>,
}

/// 子节点选择器
#[derive(Debug, Clone, Deserialize)]
pub struct ChildSelector {
    pub class: Option<String>,
    pub resource_id: Option<String>,
    pub text: Option<TextMatcher>,
    pub content_desc: Option<String>,
}

/// 自身选择器
#[derive(Debug, Clone, Deserialize)]
pub struct SelfSelector {
    pub class: Option<String>,
    pub resource_id: Option<String>,
    pub text: Option<TextMatcher>,
    pub content_desc: Option<String>,
    pub clickable: Option<bool>,
    pub enabled: Option<bool>,
}

/// 文本匹配器
#[derive(Debug, Clone, Deserialize)]
pub struct TextMatcher {
    pub equals: Option<String>,
    pub contains: Option<String>,
    pub in_list: Option<Vec<String>>, // I18N别名集合
}

/// 向后兼容的选择器结构（保留旧接口）
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

/// 几何辅助信息
#[derive(Debug, Clone, Deserialize)]
pub struct GeometricAids {
    pub bounds: Option<Bounds>,
    pub bounds_signature: Option<BoundsSignature>,
}

/// 验证与回退配置
#[derive(Debug, Clone, Deserialize)]
pub struct ValidationAndFallback {
    pub revalidate: Option<String>, // "device_required" | "device_optional" | "none"
    pub fallback_to_bounds: Option<bool>,
    pub allow_backend_fallback: Option<bool>,
}

/// 动作规范
#[derive(Debug, Clone, Deserialize)]
pub struct ActionSpec {
    #[serde(rename = "type")]
    pub action_type: String,
    pub params: Option<serde_json::Value>,
}

/// 安全阈值
#[derive(Debug, Clone, Deserialize)]
pub struct SafetyThresholds {
    pub min_confidence: Option<f32>,
    pub require_uniqueness: Option<bool>,
    pub forbid_fullscreen_or_container: Option<bool>,
}

/// 结构化选择器
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

/// 屏幕信息
#[derive(Debug, Clone, Deserialize)]
pub struct ScreenInfo {
    pub width: i32,
    pub height: i32,
    pub dpi: i32,
    pub orientation: String, // "portrait" | "landscape"
}

/// 容器锚点
#[derive(Debug, Clone, Deserialize)]
pub struct ContainerAnchor {
    pub by: String,              // "id" | "xpath" | "class_structure"
    pub value: String,           // "com.app:id/bottom_navigation"
    pub fallback_xpath: Option<String>,
}

/// 可点击父节点提示
#[derive(Debug, Clone, Deserialize)]
pub struct ClickableParentHint {
    pub up_levels: i32,          // 从目标节点向上提升的层级数
    pub must_be_clickable: Option<bool>,
    pub must_be_enabled: Option<bool>,
}

/// 静态分析上下文（前端采集固化 - 完整版）
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
