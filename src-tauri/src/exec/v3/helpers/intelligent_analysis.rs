// src-tauri/src/exec/v3/helpers/intelligent_analysis.rs
// module: exec/v3 | layer: helpers | role: UI元素智能分析、用户意图识别、元素评分
// summary: 提供智能分析系统核心功能，包括交互元素提取、用户意图分析、多维度评分等

use serde::{Deserialize, Serialize};

/// 交互元素数据结构（智能分析专用）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InteractiveElement {
    pub text: Option<String>,
    pub resource_id: Option<String>,
    pub content_desc: Option<String>,
    pub class: Option<String>,
    pub class_name: Option<String>,
    pub bounds: Option<String>,
    pub clickable: Option<bool>,
    pub enabled: Option<bool>,
    pub focusable: Option<bool>,
    pub long_clickable: Option<bool>,
    pub checkable: Option<bool>,
    pub xpath: String,
    pub ui_role: String,
    pub semantic_role: String,
}

/// 用户意图分析结果
#[derive(Debug, Clone)]
pub struct UserIntent {
    pub action_type: String,
    pub target_text: String,
    pub target_hints: Vec<String>,
    pub context: String,
    pub confidence: f64,
}

/// 设备信息上下文
#[derive(Debug, Clone)]
pub struct DeviceInfo {
    pub device_id: String,
    pub screen_size: Option<(u32, u32)>,
    pub current_app: Option<String>,
    pub orientation: Option<String>,
}

/// 带评分的元素
#[derive(Debug, Clone)]
pub struct ScoredElement {
    pub element: InteractiveElement,
    pub total_score: f64,
    pub final_score: f64,
    pub text_relevance: f64,
    pub semantic_match: f64,
    pub interaction_capability: f64,
    pub position_weight: f64,
    pub context_fitness: f64,
}

/// 从 XML 提取所有可交互元素
/// 
/// 核心功能：
/// 1. 使用 ui_reader_service 解析 XML
/// 2. 转换为 InteractiveElement 格式
/// 3. 过滤保留有交互潜力的元素
pub fn extract_all_interactive_elements_from_xml(ui_xml: &str) -> Result<Vec<InteractiveElement>, String> {
    // 使用已验证的ui_reader_service解析方法，避免roxmltree的严格XML解析问题
    use crate::services::ui_reader_service::parse_ui_elements;
    
    let ui_elements = parse_ui_elements(ui_xml)
        .map_err(|e| format!("XML解析失败: {}", e))?;
    
    let mut elements = Vec::new();
    
    // 将UIElement转换为InteractiveElement
    for (index, ui_element) in ui_elements.iter().enumerate() {
        let interactive_element = InteractiveElement {
            text: ui_element.text.clone(),
            resource_id: ui_element.resource_id.clone(),
            content_desc: ui_element.content_desc.clone(),
            class: ui_element.class.clone(),
            class_name: ui_element.class.clone(), // 复制class到class_name
            bounds: ui_element.bounds.clone(),
            clickable: ui_element.clickable,
            enabled: ui_element.enabled,
            focusable: None, // UIElement没有这个字段
            long_clickable: None, // UIElement没有这个字段
            checkable: None, // UIElement没有这个字段
            xpath: format!("//node[@index='{}']", index), // 简化的xpath
            ui_role: ui_element.class.clone().unwrap_or_default(),
            semantic_role: determine_semantic_role_from_class(&ui_element.class),
        };
        
        // 只添加可能有交互价值的元素
        if is_potentially_interactive(&interactive_element) {
            elements.push(interactive_element);
        }
    }
    
    tracing::info!("🔍 提取了 {} 个潜在交互元素（包括非clickable）", elements.len());
    Ok(elements)
}

/// 判断元素是否具有交互潜力（基于ui_reader_service的UIElement）
pub fn is_potentially_interactive(element: &InteractiveElement) -> bool {
    // 1. 显式可交互属性
    if element.clickable == Some(true) || element.enabled == Some(true) {
        return true;
    }
    
    // 2. 有意义的文本内容
    if let Some(text) = &element.text {
        if !text.trim().is_empty() && text.len() < 100 { // 避免长文本
            return true;
        }
    }
    
    // 3. 有描述内容
    if let Some(desc) = &element.content_desc {
        if !desc.trim().is_empty() {
            return true;
        }
    }
    
    // 4. 特定的类名模式
    if let Some(class) = &element.class {
        if class.contains("Button") || class.contains("Text") || class.contains("View") {
            return true;
        }
    }
    
    true // 默认都认为可能是交互的，让智能分析来判断
}

/// 根据 class 确定元素的语义角色
pub fn determine_semantic_role_from_class(class: &Option<String>) -> String {
    if let Some(class_name) = class {
        if class_name.contains("Button") { return "button".to_string(); }
        if class_name.contains("Edit") || class_name.contains("Input") { return "input".to_string(); }
        if class_name.contains("Text") { return "text".to_string(); }
        if class_name.contains("Layout") || class_name.contains("Group") { return "container".to_string(); }
    }
    
    "unknown".to_string()
}

/// 从原始参数分析用户意图
/// 
/// 功能：
/// 1. 从多个参数字段收集目标提示（targetText、contentDesc、text、smartSelection等）
/// 2. 判断是否需要智能推断（无明确目标时）
/// 3. 返回结构化的用户意图分析结果
pub fn analyze_user_intent_from_params(params: &serde_json::Value) -> Result<UserIntent, String> {
    let mut target_hints = Vec::new();
    
    // 从各种参数中收集目标提示
    if let Some(text) = params.get("targetText").and_then(|v| v.as_str()) {
        if !text.trim().is_empty() {
            target_hints.push(text.to_string());
        }
    }
    
    if let Some(desc) = params.get("contentDesc").and_then(|v| v.as_str()) {
        if !desc.trim().is_empty() {
            target_hints.push(desc.to_string());
        }
    }
    
    if let Some(text) = params.get("text").and_then(|v| v.as_str()) {
        if !text.trim().is_empty() {
            target_hints.push(text.to_string());
        }
    }
    
    // 检查smartSelection嵌套参数
    if let Some(smart_sel) = params.get("smartSelection") {
        if let Some(text) = smart_sel.get("targetText").and_then(|v| v.as_str()) {
            if !text.trim().is_empty() {
                target_hints.push(text.to_string());
            }
        }
    }
    
    // 如果没有明确的目标提示，这就是需要智能分析的情况
    let (action_type, context, priority) = if target_hints.is_empty() {
        ("intelligent_find".to_string(), "用户未提供明确目标，需要智能推断".to_string(), 1.0)
    } else {
        ("click".to_string(), format!("用户目标: {}", target_hints.join(", ")), 0.8)
    };
    
    Ok(UserIntent {
        action_type,
        target_text: target_hints.first().cloned().unwrap_or_default(),
        target_hints,
        context,
        confidence: priority,
    })
}

/// 智能评分系统（多维度评估）
/// 
/// 评分维度：
/// - text_relevance (30%): 文本相关性
/// - semantic_match (25%): 语义匹配度
/// - interaction_capability (20%): 交互能力
/// - position_weight (15%): 位置权重
/// - context_fitness (10%): 上下文适配度
pub fn score_elements_intelligently(
    elements: &[InteractiveElement],
    intent: &UserIntent,
    device_info: &DeviceInfo,
) -> Result<Vec<ScoredElement>, String> {
    let mut scored_elements = Vec::new();
    
    for element in elements {
        let text_relevance = calculate_text_relevance(element, intent);
        let semantic_match = calculate_semantic_match(element, intent);
        let interaction_capability = calculate_interaction_capability(element);
        let position_weight = calculate_position_weight(element, device_info);
        let context_fitness = calculate_context_fitness(element, intent);
        
        // 综合评分算法
        let final_score = (text_relevance * 0.3) +
                         (semantic_match * 0.25) +
                         (interaction_capability * 0.2) +
                         (position_weight * 0.15) +
                         (context_fitness * 0.1);
        
        scored_elements.push(ScoredElement {
            element: element.clone(),
            total_score: final_score,
            final_score,
            text_relevance,
            semantic_match,
            interaction_capability,
            position_weight,
            context_fitness,
        });
    }
    
    // 按评分排序
    scored_elements.sort_by(|a, b| b.final_score.partial_cmp(&a.final_score).unwrap_or(std::cmp::Ordering::Equal));
    
    Ok(scored_elements)
}

/// 辅助评分函数：文本相关性
pub fn calculate_text_relevance(element: &InteractiveElement, intent: &UserIntent) -> f64 {
    if intent.target_text.is_empty() && intent.target_hints.is_empty() {
        return 0.5; // 没有明确目标时，所有元素得中等分
    }
    
    // 检查target_text
    if !intent.target_text.is_empty() {
        if let Some(text) = &element.text {
            if text.contains(&intent.target_text) { return 1.0; }
            if text.to_lowercase().contains(&intent.target_text.to_lowercase()) { return 0.8; }
        }
        if let Some(desc) = &element.content_desc {
            if desc.contains(&intent.target_text) { return 1.0; }
            if desc.to_lowercase().contains(&intent.target_text.to_lowercase()) { return 0.8; }
        }
    }
    
    // 检查target_hints
    for hint in &intent.target_hints {
        if let Some(text) = &element.text {
            if text.contains(hint) { return 1.0; }
            if text.to_lowercase().contains(&hint.to_lowercase()) { return 0.8; }
        }
        if let Some(desc) = &element.content_desc {
            if desc.contains(hint) { return 1.0; }
            if desc.to_lowercase().contains(&hint.to_lowercase()) { return 0.8; }
        }
    }
    0.0
}

/// 辅助评分函数：语义匹配度
pub fn calculate_semantic_match(element: &InteractiveElement, intent: &UserIntent) -> f64 {
    match intent.action_type.as_str() {
        "click" | "intelligent_find" => {
            if element.clickable == Some(true) { return 1.0; }
            if element.semantic_role == "button" { return 0.9; }
            if element.semantic_role == "text" { return 0.7; }
            0.3
        }
        _ => 0.5
    }
}

/// 辅助评分函数：交互能力
pub fn calculate_interaction_capability(element: &InteractiveElement) -> f64 {
    let mut score: f64 = 0.0;
    if element.clickable == Some(true) { score += 0.4; }
    if element.enabled == Some(true) { score += 0.2; }
    if element.focusable == Some(true) { score += 0.2; }
    if element.long_clickable == Some(true) { score += 0.1; }
    if element.checkable == Some(true) { score += 0.1; }
    score.min(1.0)
}

/// 辅助评分函数：位置权重
pub fn calculate_position_weight(element: &InteractiveElement, _device_info: &DeviceInfo) -> f64 {
    // 简化版位置权重，优先中心区域和上半屏
    if element.bounds.is_some() {
        0.7 // 有边界信息的元素优先
    } else {
        0.3
    }
}

/// 辅助评分函数：上下文适配度
pub fn calculate_context_fitness(element: &InteractiveElement, intent: &UserIntent) -> f64 {
    // 简化版上下文适配度
    if intent.target_text.is_empty() && intent.target_hints.is_empty() {
        // 没有明确目标时，优先常见交互元素
        if element.semantic_role == "button" { return 0.9; }
        if element.text.as_ref().map_or(false, |t| t.len() < 10 && !t.trim().is_empty()) { return 0.8; }
    }
    0.5
}

/// 从 XML 中智能提取目标元素
/// 
/// 功能：在用户未明确指定目标时，尝试识别常见交互目标
pub fn extract_intelligent_targets_from_xml(ui_xml: &str) -> String {
    // 简单实现：查找常见的可交互元素
    let common_targets = [
        "关注", "收藏", "点赞", "评论", "分享", "播放", "暂停", "下载", "购买", "加入购物车",
        "登录", "注册", "提交", "确认", "取消", "返回", "搜索", "筛选", "排序", "刷新"
    ];
    
    for target in &common_targets {
        if ui_xml.contains(target) {
            tracing::info!("🎯 在XML中发现目标: {}", target);
            return target.to_string();
        }
    }
    
    tracing::warn!("❓ 未在XML中识别出明确目标，使用通用分析");
    "通用交互元素".to_string()
}
