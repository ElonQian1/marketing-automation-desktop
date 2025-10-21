//! enhanced_location_commands.rs - 增强定位算法 Tauri 命令
//! 
//! 模块: Tauri 命令层 | 层级: 接口层 | 角色: 前后端桥接
//! summary: 为前端提供增强定位算法的 Tauri 命令接口

use crate::services::execution::matching::{
    EnhancedElementMatcher, EnhancedMatchingConfig, AttributeWeights,
    SmartXPathGenerator, XPathCandidate, ElementAttributes
};
use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use tauri::State;
use std::sync::Mutex;

/// 前端增强匹配配置
#[derive(Debug, Serialize, Deserialize)]
pub struct FrontendEnhancedConfig {
    #[serde(rename = "similarityThreshold")]
    pub similarity_threshold: Option<f64>,
    #[serde(rename = "enableFuzzyMatching")]
    pub enable_fuzzy_matching: Option<bool>,
    #[serde(rename = "enableContextMatching")]
    pub enable_context_matching: Option<bool>,
    #[serde(rename = "maxFallbackLayers")]
    pub max_fallback_layers: Option<u32>,
    #[serde(rename = "attributeWeights")]
    pub attribute_weights: Option<FrontendAttributeWeights>,
}

/// 前端属性权重配置
#[derive(Debug, Serialize, Deserialize)]
pub struct FrontendAttributeWeights {
    #[serde(rename = "resourceId")]
    pub resource_id: Option<f64>,
    pub text: Option<f64>,
    #[serde(rename = "contentDesc")]
    pub content_desc: Option<f64>,
    #[serde(rename = "className")]
    pub class_name: Option<f64>,
    pub bounds: Option<f64>,
    pub index: Option<f64>,
    #[serde(rename = "parentContext")]
    pub parent_context: Option<f64>,
    #[serde(rename = "siblingContext")]
    pub sibling_context: Option<f64>,
}

/// 前端匹配结果
#[derive(Debug, Serialize, Deserialize)]
pub struct FrontendMatchResult {
    pub success: bool,
    pub confidence: f64,
    pub coordinates: Option<(i32, i32)>,
    pub bounds: Option<String>,
    #[serde(rename = "matchedElement")]
    pub matched_element: Option<FrontendElementInfo>,
    #[serde(rename = "matchingStrategy")]
    pub matching_strategy: String,
    #[serde(rename = "fallbackUsed")]
    pub fallback_used: bool,
    #[serde(rename = "debugInfo")]
    pub debug_info: Vec<String>,
}

/// 前端元素信息
#[derive(Debug, Serialize, Deserialize)]
pub struct FrontendElementInfo {
    #[serde(rename = "className")]
    pub class_name: String,
    #[serde(rename = "resourceId")]
    pub resource_id: Option<String>,
    pub text: Option<String>,
    #[serde(rename = "contentDesc")]
    pub content_desc: Option<String>,
    pub bounds: String,
    pub index: Option<u32>,
    pub xpath: Option<String>,
}

/// 前端 XPath 候选项
#[derive(Debug, Serialize, Deserialize)]
pub struct FrontendXPathCandidate {
    pub xpath: String,
    pub strategy: String,
    pub confidence: f64,
    pub description: String,
}

/// 全局智能 XPath 生成器状态
pub type XPathGeneratorState = Mutex<SmartXPathGenerator>;

/// 将前端配置转换为后端配置
fn convert_frontend_config(frontend_config: Option<FrontendEnhancedConfig>) -> EnhancedMatchingConfig {
    let frontend = frontend_config.unwrap_or_default();
    
    EnhancedMatchingConfig {
        similarity_threshold: frontend.similarity_threshold.unwrap_or(0.75),
        enable_fuzzy_matching: frontend.enable_fuzzy_matching.unwrap_or(true),
        enable_context_matching: frontend.enable_context_matching.unwrap_or(true),
        max_fallback_layers: frontend.max_fallback_layers.unwrap_or(3),
        attribute_weights: convert_frontend_weights(frontend.attribute_weights),
    }
}

/// 将前端权重配置转换为后端配置
fn convert_frontend_weights(frontend_weights: Option<FrontendAttributeWeights>) -> AttributeWeights {
    let weights = frontend_weights.unwrap_or_default();
    
    AttributeWeights {
        resource_id: weights.resource_id.unwrap_or(0.9),
        text: weights.text.unwrap_or(0.8),
        content_desc: weights.content_desc.unwrap_or(0.8),
        class_name: weights.class_name.unwrap_or(0.6),
        bounds: weights.bounds.unwrap_or(0.3),
        index: weights.index.unwrap_or(0.4),
        parent_context: weights.parent_context.unwrap_or(0.7),
        sibling_context: weights.sibling_context.unwrap_or(0.5),
    }
}

/// 将后端匹配结果转换为前端格式
fn convert_match_result(
    backend_result: crate::services::execution::matching::MatchResult
) -> FrontendMatchResult {
    FrontendMatchResult {
        success: backend_result.success,
        confidence: backend_result.confidence,
        coordinates: backend_result.coordinates,
        bounds: backend_result.bounds,
        matched_element: backend_result.matched_element.map(convert_element_info),
        matching_strategy: backend_result.matching_strategy,
        fallback_used: backend_result.fallback_used,
        debug_info: backend_result.debug_info,
    }
}

/// 将后端元素信息转换为前端格式
fn convert_element_info(
    backend_element: crate::services::execution::matching::ElementInfo
) -> FrontendElementInfo {
    FrontendElementInfo {
        class_name: backend_element.class_name,
        resource_id: backend_element.resource_id,
        text: backend_element.text,
        content_desc: backend_element.content_desc,
        bounds: backend_element.bounds,
        index: backend_element.index,
        xpath: backend_element.xpath,
    }
}

/// 将后端 XPath 候选项转换为前端格式
fn convert_xpath_candidate(backend_candidate: XPathCandidate) -> FrontendXPathCandidate {
    FrontendXPathCandidate {
        xpath: backend_candidate.xpath,
        strategy: format!("{:?}", backend_candidate.strategy), // 将枚举转换为字符串
        confidence: backend_candidate.confidence,
        description: backend_candidate.description,
    }
}

/// 使用增强策略匹配元素
#[tauri::command]
pub async fn match_element_enhanced(
    target_criteria: HashMap<String, String>,
    device_id: String,
    config: Option<FrontendEnhancedConfig>,
) -> Result<FrontendMatchResult, String> {
    let backend_config = convert_frontend_config(config);
    let matcher = EnhancedElementMatcher::new(backend_config);

    // 获取设备 XML 内容（这里简化实现）
    let xml_content = get_device_ui_dump(&device_id).await?;

    match matcher.match_element(&target_criteria, &xml_content, &device_id).await {
        Ok(result) => Ok(convert_match_result(result)),
        Err(e) => Err(format!("增强元素匹配失败: {}", e)),
    }
}

/// 生成 XPath 候选项
#[tauri::command]
pub fn generate_xpath_candidates(
    attributes: ElementAttributes,
    xpath_generator_state: State<XPathGeneratorState>,
) -> Result<Vec<FrontendXPathCandidate>, String> {
    let generator = xpath_generator_state.lock().map_err(|e| {
        format!("无法获取 XPath 生成器锁: {}", e)
    })?;

    let candidates = generator.generate_candidates(&attributes);
    let frontend_candidates = candidates
        .into_iter()
        .map(convert_xpath_candidate)
        .collect();

    Ok(frontend_candidates)
}

/// 生成最佳 XPath
#[tauri::command]
pub fn generate_best_xpath(
    attributes: ElementAttributes,
    xpath_generator_state: State<XPathGeneratorState>,
) -> Result<Option<FrontendXPathCandidate>, String> {
    let generator = xpath_generator_state.lock().map_err(|e| {
        format!("无法获取 XPath 生成器锁: {}", e)
    })?;

    let best_candidate = generator.generate_best_xpath(&attributes);
    Ok(best_candidate.map(convert_xpath_candidate))
}

/// 验证 XPath 语法
#[tauri::command]
pub fn validate_xpath(
    xpath: String,
    xpath_generator_state: State<XPathGeneratorState>,
) -> Result<bool, String> {
    let generator = xpath_generator_state.lock().map_err(|e| {
        format!("无法获取 XPath 生成器锁: {}", e)
    })?;

    Ok(generator.validate_xpath(&xpath))
}

/// 更新 XPath 策略成功率
#[tauri::command]
pub fn update_xpath_strategy_success_rate(
    strategy: String,
    success: bool,
    xpath_generator_state: State<XPathGeneratorState>,
) -> Result<(), String> {
    let mut generator = xpath_generator_state.lock().map_err(|e| {
        format!("无法获取 XPath 生成器锁: {}", e)
    })?;

    // 简化策略字符串到枚举的转换
    use crate::services::execution::matching::XPathStrategy;
    let strategy_enum = match strategy.as_str() {
        "ResourceId" => XPathStrategy::ResourceId,
        "Text" => XPathStrategy::Text,
        "ContentDesc" => XPathStrategy::ContentDesc,
        "ClassHierarchy" => XPathStrategy::ClassHierarchy,
        "RelativePosition" => XPathStrategy::RelativePosition,
        "Composite" => XPathStrategy::Composite,
        "Fallback" => XPathStrategy::Fallback,
        _ => return Err(format!("未知策略类型: {}", strategy)),
    };

    generator.update_success_rate(strategy_enum, success);
    Ok(())
}

/// 获取设备 UI dump（简化实现）
async fn get_device_ui_dump(device_id: &str) -> Result<String, String> {
    use crate::services::adb_session_manager::get_device_session;
    
    match get_device_session(device_id).await {
        Ok(session) => {
            let dump_result = session
                .execute_command(
                    "uiautomator dump /sdcard/ui_dump.xml > /dev/null && cat /sdcard/ui_dump.xml",
                )
                .await;
            
            match dump_result {
                Ok(xml_content) => {
                    if xml_content.is_empty() || xml_content.contains("ERROR:") {
                        Err("UI dump 内容异常".to_string())
                    } else {
                        Ok(xml_content)
                    }
                }
                Err(e) => Err(format!("UI dump 命令执行失败: {}", e))
            }
        }
        Err(e) => Err(format!("无法连接到设备: {}", e))
    }
}

/// 默认配置实现
impl Default for FrontendEnhancedConfig {
    fn default() -> Self {
        Self {
            similarity_threshold: Some(0.75),
            enable_fuzzy_matching: Some(true),
            enable_context_matching: Some(true),
            max_fallback_layers: Some(3),
            attribute_weights: Some(FrontendAttributeWeights::default()),
        }
    }
}

impl Default for FrontendAttributeWeights {
    fn default() -> Self {
        Self {
            resource_id: Some(0.9),
            text: Some(0.8),
            content_desc: Some(0.8),
            class_name: Some(0.6),
            bounds: Some(0.3),
            index: Some(0.4),
            parent_context: Some(0.7),
            sibling_context: Some(0.5),
        }
    }
}