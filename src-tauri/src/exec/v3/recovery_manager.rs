// src-tauri/src/exec/v3/recovery_manager.rs
// module: exec | layer: v3 | role: 失败恢复管理器
// summary: 当真机XML匹配失败时，使用原始XML快照进行重新分析和恢复

use crate::services::ui_reader_service::{UIElement, parse_ui_elements};
use serde_json::Value;
use anyhow::Result;

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
        
        tracing::info!(
            "✅ [恢复上下文] 成功构建: xpath={}, text={:?}, strategy={}",
            selected_xpath, element_text, strategy_type
        );
        
        Some(Self {
            original_xml,
            selected_xpath,
            element_text,
            element_bounds,
            resource_id,
            content_desc,
            strategy_type,
        })
    }
}

/// 🔧 核心功能：失败恢复 - 当真机XML匹配失败时尝试恢复
/// 
/// 恢复流程：
/// 1. 解析原始XML，找到目标元素
/// 2. 提取目标元素的完整特征
/// 3. 在真机XML中搜索相似元素（返回多个候选）
/// 4. 返回候选列表，由外部的candidate_evaluator进行最终评估
pub fn attempt_recovery(
    recovery_ctx: &RecoveryContext,
    current_elements: &[UIElement],
) -> Result<RecoveryResult> {
    
    tracing::info!("🔧 [失败恢复] 开始恢复流程");
    
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
