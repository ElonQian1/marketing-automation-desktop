// src-tauri/src/exec/v3/recovery_manager.rs
// module: exec | layer: v3 | role: 失败恢复管理器
// summary: 当真机XML匹配失败时，使用原始XML快照进行重新分析和恢复

use crate::services::ui_reader_service::{UIElement, parse_ui_elements};
use crate::services::execution::matching::strategies::{
    create_strategy_processor, StrategyProcessor, MatchingContext
};
use serde_json::Value;
use anyhow::Result;
use std::collections::HashMap;

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
        
        let original_xml = original_data
            .get("original_xml")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())?;
        
        if original_xml.is_empty() {
            tracing::warn!("⚠️ [恢复上下文] original_xml 为空");
            return None;
        }
        
        let selected_xpath = original_data
            .get("selected_xpath")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
            .unwrap_or_default();
        
        let element_text = original_data
            .get("element_text")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        
        let element_bounds = original_data
            .get("element_bounds")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        
        let key_attributes = original_data.get("key_attributes");
        
        let resource_id = key_attributes
            .and_then(|ka| ka.get("resource-id"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        
        let content_desc = key_attributes
            .and_then(|ka| ka.get("content-desc"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        
        let strategy_type = params
            .get("strategy_type")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
            .unwrap_or_else(|| "unknown".to_string());
        
        // 🎯 NEW: 提取匹配策略标记
        let matching_strategy = original_data
            .get("matching_strategy")
            .or_else(|| params.get("matching_strategy"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        
        // 🎯 NEW: 提取子元素文本列表
        let children_texts: Vec<String> = original_data
            .get("children_texts")
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str().map(|s| s.to_string()))
                    .collect()
            })
            .unwrap_or_default();
        
        // 🎯 NEW: 提取兄弟元素文本列表
        let sibling_texts: Vec<String> = original_data
            .get("sibling_texts")
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str().map(|s| s.to_string()))
                    .collect()
            })
            .unwrap_or_default();
        
        // 🎯 NEW: 提取父元素信息
        let parent_info = original_data
            .get("parent_info")
            .cloned();
        
        tracing::info!(
            "✅ [恢复上下文] 成功构建: xpath={}, text={:?}, strategy={}, matching_strategy={:?}",
            selected_xpath, element_text, strategy_type, matching_strategy
        );
        
        if !children_texts.is_empty() || !sibling_texts.is_empty() || parent_info.is_some() {
            tracing::info!(
                "🎯 [关系数据] 提取成功: children_texts={}, sibling_texts={}, has_parent_info={}",
                children_texts.len(), sibling_texts.len(), parent_info.is_some()
            );
        }
        
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

/// 🔧 核心功能：失败恢复 - 当真机XML匹配失败时尝试恢复
/// 
/// 恢复流程：
/// 0. 🎯 NEW: 如果有 matching_strategy 标记，优先使用策略路由器
/// 1. 解析原始XML，找到目标元素
/// 2. 提取目标元素的完整特征
/// 3. 在真机XML中搜索相似元素（返回多个候选）
/// 4. 返回候选列表，由外部的candidate_evaluator进行最终评估
pub fn attempt_recovery(
    recovery_ctx: &RecoveryContext,
    current_elements: &[UIElement],
) -> Result<RecoveryResult> {
    
    tracing::info!("🔧 [失败恢复] 开始恢复流程");
    
    // 🎯 Step 0: 优先检查是否有明确的匹配策略标记
    if let Some(ref strategy_tag) = recovery_ctx.matching_strategy {
        // 检查是否是关系锚点策略
        if strategy_tag.starts_with("anchor_by_") {
            tracing::info!("🎯 [策略路由] 检测到关系锚点策略: {}", strategy_tag);
            
            // 尝试使用策略路由器进行匹配
            match try_strategy_router(recovery_ctx, current_elements, strategy_tag) {
                Ok(result) => {
                    tracing::info!("✅ [策略路由] 匹配成功，返回结果");
                    return Ok(result);
                }
                Err(e) => {
                    tracing::warn!("⚠️ [策略路由] 匹配失败: {:?}，回退到传统恢复流程", e);
                    // 继续执行下面的传统恢复流程
                }
            }
        }
    }
    
    // Step 1: 解析原始XML
    let original_elements = parse_ui_elements(&recovery_ctx.original_xml)
        .map_err(|e| anyhow::anyhow!("解析原始XML失败: {}", e))?;
    
    tracing::info!("✅ [失败恢复] 原始XML解析成功: {} 个元素", original_elements.len());
    
    // Step 2: 在原始XML中找到目标元素
    let original_target = find_target_in_original(&original_elements, recovery_ctx)?;
    
    tracing::info!(
        "✅ [失败恢复] 在原始XML中找到目标: text={:?}, bounds={:?}, resource-id={:?}",
        original_target.text,
        original_target.bounds,
        original_target.resource_id
    );
    
    // Step 3: 在真机XML中搜索相似候选元素（返回多个，由外部评估器选择最佳）
    let candidates = find_similar_elements_in_current(
        current_elements,
        original_target,
        &recovery_ctx.strategy_type
    );
    
    tracing::info!(
        "✅ [失败恢复] 在真机XML中找到 {} 个相似候选元素",
        candidates.len()
    );
    
    let strategy_name = if !recovery_ctx.selected_xpath.is_empty() {
        "xpath_then_similarity".to_string()
    } else if recovery_ctx.element_text.is_some() && recovery_ctx.resource_id.is_some() {
        "text_and_resource_id".to_string()
    } else if recovery_ctx.element_text.is_some() {
        "text_matching".to_string()
    } else if recovery_ctx.content_desc.is_some() {
        "content_desc_matching".to_string()
    } else {
        "unknown_strategy".to_string()
    };
    
    Ok(RecoveryResult {
        candidates,
        recovery_strategy: strategy_name,
        original_target: Some(original_target.clone()),
    })
}

/// 在原始XML中找到目标元素
fn find_target_in_original<'a>(
    elements: &'a [UIElement],
    ctx: &RecoveryContext,
) -> Result<&'a UIElement> {
    
    // 策略1: 使用XPath精确匹配
    if !ctx.selected_xpath.is_empty() {
        if let Some(elem) = find_by_xpath(elements, &ctx.selected_xpath) {
            tracing::info!("✅ [原始目标] 通过XPath找到: {}", ctx.selected_xpath);
            return Ok(elem);
        }
    }
    
    // 策略2: 使用文本+resource-id组合匹配
    if let (Some(ref text), Some(ref rid)) = (&ctx.element_text, &ctx.resource_id) {
        if let Some(elem) = elements.iter().find(|e| {
            e.text.as_ref() == Some(text) && e.resource_id.as_ref() == Some(rid)
        }) {
            tracing::info!("✅ [原始目标] 通过text+resource-id找到");
            return Ok(elem);
        }
    }
    
    // 策略3: 使用文本匹配
    if let Some(ref text) = ctx.element_text {
        if !text.is_empty() {
            if let Some(elem) = elements.iter().find(|e| e.text.as_ref() == Some(text)) {
                tracing::info!("✅ [原始目标] 通过text找到: {}", text);
                return Ok(elem);
            }
        }
    }
    
    // 策略4: 使用content-desc匹配
    if let Some(ref desc) = ctx.content_desc {
        if !desc.is_empty() {
            if let Some(elem) = elements.iter().find(|e| {
                e.content_desc.as_ref().map(|d| d.contains(desc)).unwrap_or(false)
            }) {
                tracing::info!("✅ [原始目标] 通过content-desc找到: {}", desc);
                return Ok(elem);
            }
        }
    }
    
    Err(anyhow::anyhow!(
        "在原始XML中无法找到目标元素。XPath={}, text={:?}",
        ctx.selected_xpath, ctx.element_text
    ))
}

/// 在真机XML中搜索相似元素（返回多个候选）
fn find_similar_elements_in_current(
    current_elements: &[UIElement],
    original_target: &UIElement,
    strategy_type: &str,
) -> Vec<UIElement> {
    
    tracing::info!("🔍 [相似搜索] 开始在真机XML中搜索相似元素 (策略: {})", strategy_type);
    
    // 对所有元素进行基础过滤：
    // 1. 至少有一个关键属性匹配（text、resource-id或content-desc）
    // 2. 如果原始元素有这些属性，优先匹配它们
    let mut candidates: Vec<UIElement> = current_elements.iter()
        .filter(|elem| {
            let has_text_match = original_target.text.as_ref()
                .and_then(|o_text| elem.text.as_ref().map(|e_text| 
                    e_text == o_text || e_text.contains(o_text) || o_text.contains(e_text)
                ))
                .unwrap_or(false);
            
            let has_rid_match = original_target.resource_id.as_ref()
                .and_then(|o_rid| elem.resource_id.as_ref().map(|e_rid| e_rid == o_rid))
                .unwrap_or(false);
            
            let has_desc_match = original_target.content_desc.as_ref()
                .and_then(|o_desc| elem.content_desc.as_ref().map(|e_desc| 
                    e_desc == o_desc || e_desc.contains(o_desc) || o_desc.contains(e_desc)
                ))
                .unwrap_or(false);
            
            // 至少有一个关键属性匹配
            has_text_match || has_rid_match || has_desc_match
        })
        .cloned()
        .collect();
    
    tracing::info!("� [相似搜索] 基础过滤后找到 {} 个候选元素", candidates.len());
    
    // 如果候选太多（>10），进一步过滤：优先保留有resource-id匹配的
    if candidates.len() > 10 {
        if let Some(ref o_rid) = original_target.resource_id {
            let with_rid: Vec<_> = candidates.iter()
                .filter(|elem| elem.resource_id.as_ref() == Some(o_rid))
                .cloned()
                .collect();
            
            if !with_rid.is_empty() {
                tracing::info!("🔍 [相似搜索] 使用resource-id进一步过滤: {} → {} 个候选", 
                             candidates.len(), with_rid.len());
                candidates = with_rid;
            }
        }
    }
    
    // 打印候选信息（最多10个）
    for (i, elem) in candidates.iter().take(10).enumerate() {
        tracing::info!(
            "  [候选 {}] text={:?}, resource-id={:?}, content-desc={:?}, bounds={:?}",
            i + 1, elem.text, elem.resource_id, elem.content_desc, elem.bounds
        );
    }
    
    candidates
}

/// 简化的XPath查找（仅支持基本格式）
fn find_by_xpath<'a>(elements: &'a [UIElement], xpath: &str) -> Option<&'a UIElement> {
    // 这里简化实现，实际应该使用完整的XPath解析器
    // 目前只支持简单的 //*[@resource-id='xxx'] 格式
    
    if xpath.contains("@resource-id='") {
        if let Some(start) = xpath.find("@resource-id='") {
            let start = start + 14;
            if let Some(end) = xpath[start..].find('\'') {
                let rid = &xpath[start..start + end];
                return elements.iter().find(|e| {
                    e.resource_id.as_ref().map(|r| r == rid).unwrap_or(false)
                });
            }
        }
    }
    
    None
}

fn parse_bounds_center(bounds: &str) -> Option<(f32, f32)> {
    let parts: Vec<&str> = bounds
        .trim_matches(|c| c == '[' || c == ']')
        .split("][")
        .collect();
    
    if parts.len() != 2 {
        return None;
    }
    
    let p1: Vec<&str> = parts[0].split(',').collect();
    let p2: Vec<&str> = parts[1].split(',').collect();
    
    if p1.len() != 2 || p2.len() != 2 {
        return None;
    }
    
    let x1 = p1[0].parse::<f32>().ok()?;
    let y1 = p1[1].parse::<f32>().ok()?;
    let x2 = p2[0].parse::<f32>().ok()?;
    let y2 = p2[1].parse::<f32>().ok()?;
    
    Some(((x1 + x2) / 2.0, (y1 + y2) / 2.0))
}

fn calculate_distance(p1: (f32, f32), p2: (f32, f32)) -> f32 {
    let dx = p1.0 - p2.0;
    let dy = p1.1 - p2.1;
    (dx * dx + dy * dy).sqrt()
}

/// 🎯 NEW: 使用策略路由器进行匹配（关系锚点策略专用）
fn try_strategy_router(
    recovery_ctx: &RecoveryContext,
    current_elements: &[UIElement],
    strategy_tag: &str,
) -> Result<RecoveryResult> {
    tracing::info!("🎯 [策略路由器] 开始使用策略: {}", strategy_tag);
    
    // 构建策略上下文
    let mut values = HashMap::new();
    
    // 转换 UIElement 为 HashMap<String, String> 格式
    let elements_map: Vec<HashMap<String, String>> = current_elements
        .iter()
        .map(|elem| {
            let mut map = HashMap::new();
            
            if let Some(ref text) = elem.text {
                map.insert("text".to_string(), text.clone());
            }
            if let Some(ref rid) = elem.resource_id {
                map.insert("resource-id".to_string(), rid.clone());
            }
            if let Some(ref desc) = elem.content_desc {
                map.insert("content-desc".to_string(), desc.clone());
            }
            if let Some(ref bounds) = elem.bounds {
                map.insert("bounds".to_string(), bounds.clone());
            }
            if let Some(ref clickable) = elem.clickable {
                map.insert("clickable".to_string(), clickable.to_string());
            }
            if let Some(ref class) = elem.class {
                map.insert("class".to_string(), class.clone());
            }
            
            map
        })
        .collect();
    
    // 构建 MatchingContext
    let context = MatchingContext {
        strategy: strategy_tag.to_string(),
        fields: vec![],
        values,
        includes: HashMap::new(),
        excludes: HashMap::new(),
        match_mode: HashMap::new(),
        regex_includes: HashMap::new(),
        regex_excludes: HashMap::new(),
        fallback_bounds: recovery_ctx.element_bounds.as_ref().map(|b| {
            serde_json::json!(b)
        }),
        device_id: String::new(),
        original_xml: Some(recovery_ctx.original_xml.clone()),
    };
    
    // 创建策略处理器
    let processor = create_strategy_processor(strategy_tag);
    
    // 异步执行策略（这里需要在异步上下文中调用）
    // 由于 attempt_recovery 是同步的，我们需要创建一个运行时
    let runtime = tokio::runtime::Runtime::new()
        .map_err(|e| anyhow::anyhow!("创建运行时失败: {}", e))?;
    
    let mut logs = Vec::new();
    let mut matching_context = context.clone();
    
    let strategy_result = runtime.block_on(async {
        processor.process(&mut matching_context, &mut logs).await
    }).map_err(|e| anyhow::anyhow!("策略执行失败: {:?}", e))?;
    
    // 打印日志
    for log in logs {
        tracing::info!("{}", log);
    }
    
    if !strategy_result.success {
        return Err(anyhow::anyhow!("策略执行失败: {}", strategy_result.message));
    }
    
    tracing::info!(
        "✅ [策略路由器] 策略执行成功:\n  - Bounds: {:?}\n  - 坐标: {:?}\n  - 消息: {}",
        strategy_result.bounds,
        strategy_result.coordinates,
        strategy_result.message
    );
    
    // 构建简单的 UIElement（只包含必要字段）
    let ui_element = UIElement {
        text: None,
        resource_id: None,
        content_desc: None,
        bounds: strategy_result.bounds.clone(),
        clickable: Some(true),
        enabled: Some(true),
        class: None,
        package: None,
    };
    
    Ok(RecoveryResult {
        candidates: vec![ui_element],
        recovery_strategy: format!("strategy_router_{}", strategy_tag),
        original_target: None,
    })
}
