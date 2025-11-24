// src-tauri/src/automation/matching/recovery.rs
// module: automation | layer: matching | role: 失败恢复管理器
// summary: 当真机XML匹配失败时，使用原始XML快照进行重新分析和恢复

use crate::services::universal_ui_page_analyzer::{UIElement, parse_ui_elements_simple as parse_ui_elements};
use crate::types::page_analysis::ElementBounds;
use crate::automation::matching::strategy::collect_candidate_elements;
use serde_json::Value;
use anyhow::Result;

// 🛡️ 安全检查：检查是否为整屏节点
fn check_fullscreen_node(bounds: &ElementBounds) -> bool {
    let width = (bounds.right - bounds.left) as f32;
    let height = (bounds.bottom - bounds.top) as f32;
    let area = width * height;
    
    // 假设屏幕大小为 1080x2400（可以后续从设备信息获取）
    let screen_area = 1080.0 * 2400.0;
    let area_ratio = area / screen_area;
    
    area_ratio > 0.95
}

// 🛡️ 安全检查：检查是否为容器类节点
fn check_container_node(class_name: &Option<String>) -> bool {
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
        
        container_classes.iter().any(|c| class.contains(c))
    } else {
        false
    }
}

fn parse_bounds_string(bounds_str: &str) -> ElementBounds {
    // 格式: [left,top][right,bottom]
    let re = regex::Regex::new(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]").unwrap();
    if let Some(caps) = re.captures(bounds_str) {
        let left = caps[1].parse().unwrap_or(0);
        let top = caps[2].parse().unwrap_or(0);
        let right = caps[3].parse().unwrap_or(0);
        let bottom = caps[4].parse().unwrap_or(0);
        ElementBounds { left, top, right, bottom }
    } else {
        ElementBounds { left: 0, top: 0, right: 0, bottom: 0 }
    }
}

/// 失败恢复上下文
#[derive(Debug, Clone)]
pub struct RecoveryContext {
    /// 原始XML内容（静态分析时的XML快照）
    pub original_xml: String,
    /// 用户选择的精确XPath
    pub selected_xpath: String,
    /// 目标元素的文本
    pub element_text: Option<String>,
    /// 目标元素的bounds
    pub element_bounds: Option<String>,
    /// 目标元素的resource-id
    pub resource_id: Option<String>,
    /// 目标元素的content-desc
    pub content_desc: Option<String>,
    /// 策略类型
    pub strategy_type: String,
    /// 🎯 NEW: 匹配策略标记（用于路由到正确的策略处理器）
    pub matching_strategy: Option<String>,
    /// 🎯 NEW: 子元素文本列表
    pub children_texts: Vec<String>,
    /// 🎯 NEW: 兄弟元素文本列表
    pub sibling_texts: Vec<String>,
    /// 🎯 NEW: 父元素信息
    pub parent_info: Option<Value>,
}

/// 失败恢复结果 - 包含多个候选元素
#[derive(Debug, Clone)]
pub struct RecoveryResult {
    /// 候选元素列表（相似度由高到低排序）
    pub candidates: Vec<UIElement>,
    /// 使用的恢复策略
    pub recovery_strategy: String,
    /// 原始XML中找到的目标元素（用于参考）
    pub original_target: Option<UIElement>,
}

impl RecoveryContext {
    /// 从 inline.params 的 original_data 构建恢复上下文
    pub fn from_params(params: &Value) -> Option<Self> {
        let original_data = params.get("original_data")?;
        
        // 必须有原始XML才能进行恢复
        let original_xml = original_data.get("xml_content")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())?;
            
        let selected_xpath = params.get("selector")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
            
        let element_text = original_data.get("element_text")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
            
        let element_bounds = original_data.get("element_bounds")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
            
        let resource_id = original_data.get("key_attributes")
            .and_then(|ka| ka.get("resource-id"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
            
        let content_desc = original_data.get("key_attributes")
            .and_then(|ka| ka.get("content-desc"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
            
        let strategy_type = params.get("strategy")
            .and_then(|v| v.as_str())
            .unwrap_or("default")
            .to_string();

        // 🆕 提取新字段
        let matching_strategy = original_data.get("matching_strategy")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());

        let children_texts = original_data.get("children_texts")
            .and_then(|v| v.as_array())
            .map(|arr| arr.iter().filter_map(|v| v.as_str().map(String::from)).collect())
            .unwrap_or_default();

        let sibling_texts = original_data.get("sibling_texts")
            .and_then(|v| v.as_array())
            .map(|arr| arr.iter().filter_map(|v| v.as_str().map(String::from)).collect())
            .unwrap_or_default();

        let parent_info = original_data.get("parent_info").cloned();

        Some(Self {
            original_xml,
            selected_xpath,
            element_text,
            element_bounds,
            resource_id,
            content_desc,
            strategy_type,
            matching_strategy,
            children_texts,
            sibling_texts,
            parent_info,
        })
    }
}

/// 尝试恢复元素
/// 
/// 当精确匹配失败时调用，尝试使用更宽松的条件找到目标
pub fn attempt_element_recovery<'a>(
    params: &Value,
    elements: &'a [UIElement],
) -> Result<Option<&'a UIElement>, String> {
    // 1. 构建恢复上下文
    let context = match RecoveryContext::from_params(params) {
        Some(ctx) => ctx,
        None => return Ok(None), // 缺少必要信息，无法恢复
    };
    
    // 2. 解析原始XML，找到目标元素在原始环境中的特征
    let original_elements = parse_ui_elements(&context.original_xml)
        .map_err(|e| format!("Failed to parse original XML: {}", e))?;
        
    // 3. 在原始XML中定位目标元素（作为基准）
    let original_target = find_original_target(&original_elements, &context);
    
    // 4. 根据策略类型选择恢复策略
    let strategy_name = context.matching_strategy.as_deref().unwrap_or(&context.strategy_type);
    
    // 5. 使用 collect_candidate_elements 收集候选
    let target_text = context.element_text.as_deref().unwrap_or("");
    let original_bounds = context.element_bounds.as_deref();
    
    let candidates = collect_candidate_elements(
        elements,
        strategy_name,
        &context.selected_xpath,
        target_text,
        original_bounds,
        params
    );
    
    if candidates.is_empty() {
        return Ok(None);
    }
    
    // 6. 返回最佳候选
    // collect_candidate_elements 已经做了一些筛选，但没有排序
    // 这里我们简单地返回第一个，或者可以调用 evaluate_best_candidate
    // 但 evaluate_best_candidate 需要 params 和 ui_xml，我们有
    
    // 暂时直接返回第一个，因为 collect_candidate_elements 通常会返回最相关的
    Ok(candidates.first().cloned())
}

// 在原始XML中找到目标元素
fn find_original_target<'a>(
    elements: &'a [UIElement],
    context: &RecoveryContext,
) -> Option<&'a UIElement> {
    // 简单实现：尝试通过属性匹配
    elements.iter().find(|e| {
        let text_match = match (e.text.as_str(), context.element_text.as_deref()) {
            (a, Some(b)) if !a.is_empty() => a == b,
            ("", None) => true,
            _ => false,
        };
        
        let id_match = match (e.resource_id.as_deref(), context.resource_id.as_deref()) {
            (Some(a), Some(b)) => a == b,
            (None, None) => true,
            _ => false,
        };
        
        text_match && id_match
    })
}
