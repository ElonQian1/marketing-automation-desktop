// src-tauri/src/commands/strategy_matching.rs
//! 策略匹配命令 - 重新实现 match_element_by_criteria

use serde::Serialize;
use std::collections::HashMap;
use tracing::{info, error};

use crate::services::execution::matching::strategies::{
    create_strategy_processor, MatchingContext
};
use crate::xml_judgment::{MatchCriteriaDTO, HiddenElementParentConfig};

#[derive(Debug, Serialize)]
pub struct MatchResult {
    pub ok: bool,
    pub message: String,
    pub preview: Option<ElementPreview>,
    pub matched_elements: Vec<serde_json::Value>,
    pub confidence_score: f64,
}

#[derive(Debug, Serialize)]
pub struct ElementPreview {
    pub text: String,
    pub bounds: String,
    pub class: Option<String>,
    pub content_desc: Option<String>,
}

/// 策略匹配命令 - 支持隐藏元素父容器查找等策略
#[tauri::command]
pub async fn match_element_by_criteria(
    device_id: String,
    criteria: MatchCriteriaDTO,
) -> Result<MatchResult, String> {
    info!("🎯 策略匹配开始: 设备={} 策略={}", device_id, criteria.strategy);

    // 创建策略处理器
    let processor = create_strategy_processor(&criteria.strategy);
    
    // 构造匹配上下文 - 根据正确的 MatchingContext 结构
    let mut context = MatchingContext {
        strategy: criteria.strategy.clone(),
        fields: criteria.fields.clone(),
        values: criteria.values.clone(),
        includes: criteria.includes.clone(),
        excludes: criteria.excludes.clone(),
        match_mode: criteria.match_mode.clone(),
        regex_includes: criteria.regex_includes.clone(),
        regex_excludes: criteria.regex_excludes.clone(),
        fallback_bounds: None, // 策略匹配不使用固化坐标
        device_id: device_id.clone(),
        original_xml: None, // 策略匹配命令不传递原始XML（总是获取最新）
    };

    let mut logs = Vec::new();

    // 执行策略匹配
    match processor.process(&mut context, &mut logs).await {
        Ok(result) => {
            let success = result.success;
            let message = result.message;
            let confidence = if success { 0.8 } else { 0.0 };

            // 创建预览信息
            let preview = if success && result.coordinates.is_some() {
                Some(ElementPreview {
                    text: result.matched_element.clone().unwrap_or_default(),
                    bounds: result.bounds.clone().unwrap_or_default(),
                    class: None,
                    content_desc: None,
                })
            } else {
                None
            };

            info!("🎯 策略匹配完成: 成功={} 消息={} 置信度={:.2}", 
                  success, message, confidence);

            // 构造虚拟匹配元素数组（适配前端期望）
            let matched_elements = if success {
                vec![serde_json::json!({
                    "text": result.matched_element.unwrap_or_default(),
                    "bounds": result.bounds.unwrap_or_default(),
                    "coordinates": result.coordinates.map(|(x, y)| format!("({}, {})", x, y)),
                })]
            } else {
                vec![]
            };

            Ok(MatchResult {
                ok: success,
                message,
                preview,
                matched_elements,
                confidence_score: confidence,
            })
        }
        Err(e) => {
            error!("❌ 策略处理失败: {}", e);
            Err(format!("策略处理失败: {}", e))
        }
    }
}

/// 专门用于隐藏元素策略的快捷命令
#[tauri::command]
pub async fn match_hidden_element_by_text(
    device_id: String,
    target_text: String,
    max_traversal_depth: Option<u32>,
) -> Result<MatchResult, String> {
    info!("🔍 隐藏元素文本匹配: 设备={} 目标文本='{}'", device_id, target_text);

    // 构造隐藏元素策略配置
    let config = HiddenElementParentConfig {
        target_text: target_text.clone(),
        max_traversal_depth: max_traversal_depth.unwrap_or(5) as usize,
        clickable_indicators: vec![
            "Button".to_string(),
            "ImageButton".to_string(),
            "TextView".to_string(),
        ],
        exclude_indicators: vec![
            "android.webkit.WebView".to_string(),
            "android.widget.ScrollView".to_string(),
        ],
        confidence_threshold: 0.7,
    };

    let criteria = MatchCriteriaDTO {
        strategy: "hidden-element-parent".to_string(),
        fields: vec!["text".to_string(), "content-desc".to_string()],
        values: HashMap::from([
            ("text".to_string(), target_text.clone()),
            ("content-desc".to_string(), target_text.clone()),
        ]),
        excludes: HashMap::new(),
        includes: HashMap::new(),
        match_mode: HashMap::new(),
        regex_includes: HashMap::new(),
        regex_excludes: HashMap::new(),
        hidden_element_parent_config: Some(config),
    };

    // 调用通用策略匹配
    match_element_by_criteria(device_id, criteria).await
}