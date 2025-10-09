//! strategies/mod.rs - 匹配策略处理器模块
//! 
//! 提供模块化的匹配策略处理，支持不同的匹配策略和扩展。
//! 每个策略都有独立的处理器，确保代码清晰和可维护。

mod strategy_processor;
mod standard_strategy;
mod absolute_strategy;
mod custom_strategy;
mod hidden_element_parent_strategy;
pub mod xpath_direct_strategy;
mod xpath_first_index_strategy;
mod xpath_all_elements_strategy;

pub use strategy_processor::{
    StrategyProcessor,
    MatchingContext,
    StrategyResult,
    ProcessingError,
};

pub use standard_strategy::StandardStrategyProcessor;
pub use absolute_strategy::AbsoluteStrategyProcessor; 
pub use custom_strategy::CustomStrategyProcessor;
pub use hidden_element_parent_strategy::HiddenElementParentStrategyProcessor;
pub use xpath_direct_strategy::XPathDirectStrategyProcessor;
pub use xpath_first_index_strategy::XPathFirstIndexStrategyProcessor;
pub use xpath_all_elements_strategy::XPathAllElementsStrategyProcessor;

use std::collections::HashMap;
use serde_json::Value;

/// 策略工厂 - 根据策略名称创建对应的处理器
pub fn create_strategy_processor(strategy: &str) -> Box<dyn StrategyProcessor + Send + Sync> {
    match strategy {
        "xpath-direct" => Box::new(XPathDirectStrategyProcessor::new()), // 🆕 XPath 直接索引策略
        "xpath-first-index" => Box::new(XPathFirstIndexStrategyProcessor::new()), // 🆕 XPath 使用[1]索引策略
        "xpath-all-elements" => Box::new(XPathAllElementsStrategyProcessor::new()), // 🆕 XPath 返回所有元素策略
        "standard" => Box::new(StandardStrategyProcessor::new()),
        "absolute" => Box::new(AbsoluteStrategyProcessor::new()),
        "custom" => Box::new(CustomStrategyProcessor::new()),
        "hidden-element-parent" => Box::new(HiddenElementParentStrategyProcessor::new()),
        "strict" => Box::new(StandardStrategyProcessor::new()), // 复用 standard
        "relaxed" => Box::new(StandardStrategyProcessor::new()), // 复用 standard
        "positionless" => Box::new(StandardStrategyProcessor::new()), // 复用 standard
        _ => {
            tracing::warn!("🤖 未知匹配策略: {}, 使用 standard 策略", strategy);
            Box::new(StandardStrategyProcessor::new())
        }
    }
}

/// 从步骤参数中提取匹配上下文
pub fn extract_matching_context(params: &HashMap<String, Value>) -> Option<MatchingContext> {
    let matching_val = params.get("matching")?;
    
    let strategy = matching_val
        .get("strategy")
        .and_then(|s| s.as_str())
        .unwrap_or("standard")
        .to_string();

    let fields: Vec<String> = matching_val
        .get("fields")
        .and_then(|f| f.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|v| v.as_str().map(|s| s.to_string()))
                .collect()
        })
        .unwrap_or_default();

    let mut values = HashMap::new();
    if let Some(values_obj) = matching_val.get("values").and_then(|v| v.as_object()) {
        for (k, v) in values_obj {
            if let Some(s) = v.as_str() {
                values.insert(k.clone(), s.to_string());
            }
        }
    }

    let mut includes = HashMap::new();
    if let Some(includes_obj) = matching_val.get("includes").and_then(|v| v.as_object()) {
        for (k, v) in includes_obj {
            if let Some(arr) = v.as_array() {
                let words: Vec<String> = arr
                    .iter()
                    .filter_map(|item| item.as_str().map(|s| s.to_string()))
                    .collect();
                includes.insert(k.clone(), words);
            }
        }
    }

    let mut excludes = HashMap::new();
    if let Some(excludes_obj) = matching_val.get("excludes").and_then(|v| v.as_object()) {
        for (k, v) in excludes_obj {
            if let Some(arr) = v.as_array() {
                let words: Vec<String> = arr
                    .iter()
                    .filter_map(|item| item.as_str().map(|s| s.to_string()))
                    .collect();
                excludes.insert(k.clone(), words);
            }
        }
    }

    // 提取 match_mode（兼容驼峰/下划线）
    let mut match_mode = HashMap::new();
    if let Some(mode_obj) = matching_val
        .get("match_mode").and_then(|v| v.as_object())
        .or_else(|| matching_val.get("matchMode").and_then(|v| v.as_object()))
    {
        for (k, v) in mode_obj {
            if let Some(s) = v.as_str() {
                match_mode.insert(k.clone(), s.to_string());
            }
        }
    }

    // 提取 regex_includes（兼容驼峰/下划线）
    let mut regex_includes = HashMap::new();
    if let Some(ri_obj) = matching_val
        .get("regex_includes").and_then(|v| v.as_object())
        .or_else(|| matching_val.get("regexIncludes").and_then(|v| v.as_object()))
    {
        for (k, v) in ri_obj {
            if let Some(arr) = v.as_array() {
                let patterns: Vec<String> = arr
                    .iter()
                    .filter_map(|item| item.as_str().map(|s| s.to_string()))
                    .collect();
                regex_includes.insert(k.clone(), patterns);
            }
        }
    }

    // 提取 regex_excludes（兼容驼峰/下划线）
    let mut regex_excludes = HashMap::new();
    if let Some(re_obj) = matching_val
        .get("regex_excludes").and_then(|v| v.as_object())
        .or_else(|| matching_val.get("regexExcludes").and_then(|v| v.as_object()))
    {
        for (k, v) in re_obj {
            if let Some(arr) = v.as_array() {
                let patterns: Vec<String> = arr
                    .iter()
                    .filter_map(|item| item.as_str().map(|s| s.to_string()))
                    .collect();
                regex_excludes.insert(k.clone(), patterns);
            }
        }
    }

    // 提取固化的坐标信息（用于回退）
    let fallback_bounds = params.get("bounds")
        .or_else(|| params.get("boundsRect"))
        .cloned();

    // 🆕 提取原始XML快照
    let original_xml = params.get("xmlSnapshot")
        .and_then(|snapshot| snapshot.get("xmlContent"))
        .and_then(|content| content.as_str())
        .map(|s| s.to_string())
        .or_else(|| {
            // 也尝试从 original_xml 字段直接获取
            params.get("original_xml")
                .and_then(|xml| xml.as_str())
                .map(|s| s.to_string())
        });

    Some(MatchingContext {
        strategy,
        fields,
        values,
        includes,
        excludes,
        match_mode,
        regex_includes,
        regex_excludes,
        fallback_bounds,
        device_id: String::new(), // 将在调用时设置
        original_xml,
    })
}