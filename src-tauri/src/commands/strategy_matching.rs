// src-tauri/src/commands/strategy_matching.rs
//! 策略匹配命令 - 重新实现 match_element_by_criteria

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tracing::{info, error};

use crate::services::execution::matching::matching_strategies::{
    create_strategy_processor, MatchingContext
};

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

/// 匹配条件DTO - 从前端接收的匹配参数
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MatchCriteriaDTO {
    pub strategy: String,
    pub fields: Vec<String>,
    pub values: HashMap<String, String>,
    #[serde(default)]
    pub excludes: HashMap<String, Vec<String>>,
    #[serde(default)]
    pub includes: HashMap<String, Vec<String>>,
    #[serde(default)]
    pub match_mode: HashMap<String, String>,
    #[serde(default)]
    pub regex_includes: HashMap<String, Vec<String>>,
    #[serde(default)]
    pub regex_excludes: HashMap<String, Vec<String>>,
    #[serde(default)]
    pub hidden_element_parent_config: Option<HiddenElementParentConfig>,
    #[serde(default)]
    pub options: Option<MatchOptionsDTO>,
}

/// 匹配选项DTO - 从前端接收的选项参数
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MatchOptionsDTO {
    pub allow_absolute: Option<bool>,
    pub fields: Option<Vec<String>>,
    pub inflate: Option<i32>,
    pub timeout: Option<u64>,
    pub max_candidates: Option<usize>,
    pub confidence_threshold: Option<f64>,
}

/// 隐藏元素父容器配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HiddenElementParentConfig {
    pub target_text: String,
    #[serde(default = "default_max_traversal_depth")]
    pub max_traversal_depth: u32,
    #[serde(default = "default_clickable_indicators")]
    pub clickable_indicators: Vec<String>,
    #[serde(default = "default_exclude_indicators")]
    pub exclude_indicators: Vec<String>,
    #[serde(default = "default_confidence_threshold")]
    pub confidence_threshold: f64,
}

fn default_max_traversal_depth() -> u32 { 3 }
fn default_clickable_indicators() -> Vec<String> {
    vec!["Button".to_string(), "ImageButton".to_string(), "TextView".to_string()]
}
fn default_exclude_indicators() -> Vec<String> {
    vec!["android.webkit.WebView".to_string(), "android.widget.ScrollView".to_string()]
}
fn default_confidence_threshold() -> f64 { 0.7 }

/// 策略匹配命令 - 支持隐藏元素父容器查找等策略
/// 🆕 增加时间预算控制，避免长时间阻塞
#[tauri::command]
pub async fn match_element_by_criteria(
    device_id: String,
    criteria: MatchCriteriaDTO,
) -> Result<MatchResult, String> {
    use std::time::{Duration, Instant};
    use tokio::time::timeout;

    info!("🎯 策略匹配开始: 设备={} 策略={}", device_id, criteria.strategy);
    
    // 🆕 处理 options 参数
    if let Some(ref options) = criteria.options {
        info!("📋 匹配选项: allow_absolute={:?}, timeout={:?}, confidence_threshold={:?}", 
              options.allow_absolute, options.timeout, options.confidence_threshold);
    }
    
    // 🆕 受控回退机制：设置时间预算（支持 options 中的 timeout）
    let default_timeout = match criteria.strategy.as_str() {
        "xpath-direct" | "xpath-first-index" | "xpath-all-elements" => Duration::from_secs(10),
        "hidden-element-parent" => Duration::from_secs(8),
        _ => Duration::from_secs(5),
    };
    
    let time_budget = criteria.options
        .as_ref()
        .and_then(|opts| opts.timeout.map(Duration::from_secs))
        .unwrap_or(default_timeout);

    let start_time = Instant::now();
    info!("⏱️ 时间预算: {:?} (策略: {})", time_budget, criteria.strategy);

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

    // 🆕 执行策略匹配 - 带时间预算控制
    let strategy_execution = async {
        processor.process(&mut context, &mut logs).await
    };

    match timeout(time_budget, strategy_execution).await {
        Ok(execution_result) => match execution_result {
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
                    "bounds": result.bounds,
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
        },
        Err(_) => {
            // 🆕 超时处理 - 受控回退机制
            let elapsed = start_time.elapsed();
            error!("⏰ 策略匹配超时: 设备={} 策略={} 耗时={:?} 预算={:?}", 
                   device_id, criteria.strategy, elapsed, time_budget);
            
            // 返回超时失败结果
            Ok(MatchResult {
                ok: false,
                message: format!("策略匹配超时 (耗时: {:?}, 预算: {:?})", elapsed, time_budget),
                preview: None,
                matched_elements: vec![],
                confidence_score: 0.0,
            })
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
        max_traversal_depth: max_traversal_depth.unwrap_or(5),
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
        options: None, // 测试用例不使用 options
    };

    // 调用通用策略匹配
    match_element_by_criteria(device_id, criteria).await
}
