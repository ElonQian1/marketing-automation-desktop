// src-tauri/src/exec/v3/helpers/strategy_generation.rs
// module: exec/v3 | layer: helpers | role: 策略生成与转换
// summary: 提供智能策略候选生成、优化选择、步骤转换等功能

use super::intelligent_analysis::{InteractiveElement, ScoredElement};
use crate::services::intelligent_analysis_service::{StrategyCandidate, ElementInfo};
use super::super::types::{StepRefOrInline, InlineStep, SingleStepAction};

/// 生成策略候选
/// 
/// 从评分后的元素列表生成策略候选，取前10个最高分元素
pub fn generate_strategy_candidates(
    scored_elements: &[ScoredElement], 
    original_params: &serde_json::Value
) -> Result<Vec<StrategyCandidate>, String> {
    let mut candidates = Vec::new();
    
    // 取前10个最高分元素生成策略
    for (idx, scored) in scored_elements.iter().take(10).enumerate() {
        let strategy_type = determine_strategy_type(&scored.element);
        let confidence = scored.final_score * 0.9 + (0.1 * (1.0 - idx as f64 / 10.0)); // 排序权重
        
        let execution_plan = create_execution_plan(&scored.element, original_params);
        
        candidates.push(StrategyCandidate {
            strategy: strategy_type,
            confidence,
            reasoning: format!("智能分析评分: {:.2}", scored.final_score),
            element_info: ElementInfo {
                bounds: scored.element.bounds.clone(),
                text: scored.element.text.clone(),
                resource_id: scored.element.resource_id.clone(),
                class_name: scored.element.class_name.clone(),
                click_point: None,
            },
            execution_params: execution_plan,
        });
    }
    
    Ok(candidates)
}

/// 根据元素特征判断策略类型
pub fn determine_strategy_type(element: &InteractiveElement) -> String {
    if element.clickable == Some(true) { 
        return "direct_click".to_string(); 
    }
    if element.semantic_role == "button" { 
        return "semantic_click".to_string(); 
    }
    if element.text.is_some() || element.content_desc.is_some() {
        return "text_based_click".to_string();
    }
    "fallback_click".to_string()
}

/// 创建执行计划
pub fn create_execution_plan(element: &InteractiveElement, original_params: &serde_json::Value) -> serde_json::Value {
    serde_json::json!({
        "action": "SmartSelection",
        "xpath": element.xpath,
        "targetText": element.text.clone().unwrap_or_default(),
        "contentDesc": element.content_desc.clone().unwrap_or_default(),
        "bounds": element.bounds.clone(),
        "resourceId": element.resource_id.clone(),
        "className": element.class_name.clone(),
        "originalParams": original_params
    })
}

/// 评估策略风险等级
pub fn assess_risk_level(confidence: f64, element: &InteractiveElement) -> String {
    if confidence > 0.8 && element.clickable == Some(true) {
        "low".to_string()
    } else if confidence > 0.6 {
        "medium".to_string()  
    } else {
        "high".to_string()
    }
}

/// 选择最优策略
/// 
/// 按置信度排序并取前3个作为最优策略
pub fn select_optimal_strategies(candidates: &[StrategyCandidate]) -> Result<Vec<StrategyCandidate>, String> {
    let mut optimal = candidates.to_vec();
    
    // 按置信度排序
    optimal.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap_or(std::cmp::Ordering::Equal));
    
    // 取前3个作为最优策略
    optimal.truncate(3);
    
    Ok(optimal)
}

/// 转换策略为V3步骤格式
pub fn convert_strategies_to_v3_steps(
    strategies: &[StrategyCandidate],
    _original_params: &serde_json::Value
) -> Result<Vec<StepRefOrInline>, String> {
    let mut steps = Vec::new();
    
    for (idx, strategy) in strategies.iter().enumerate() {
        // 🔧 关键修复：将策略置信度添加到执行参数中
        let mut enhanced_params = strategy.execution_params.clone();
        if let serde_json::Value::Object(ref mut obj) = enhanced_params {
            obj.insert("confidence".to_string(), serde_json::json!(strategy.confidence));
            obj.insert("strategy_type".to_string(), serde_json::json!(strategy.strategy));
            
            // 🔧 额外确保xpath信息传递
            if let Some(element_info) = &strategy.element_info.resource_id {
                if !obj.contains_key("xpath") {
                    let xpath = format!("//*[@resource-id='{}']", element_info);
                    obj.insert("xpath".to_string(), serde_json::json!(xpath));
                }
            }
        }
        
        // 🔍 调试：打印实际传递的参数
        tracing::info!("🔧 智能步骤参数: step_id={}, params={}", 
                       format!("intelligent_step_{}", idx + 1), 
                       serde_json::to_string_pretty(&enhanced_params).unwrap_or_default());
        
        let step = StepRefOrInline {
            r#ref: None,
            inline: Some(InlineStep {
                step_id: format!("intelligent_step_{}", idx + 1),
                action: SingleStepAction::SmartTap, // 🔧 修复：使用SmartTap代替SmartSelection
                params: enhanced_params,
            }),
        };
        steps.push(step);
    }
    
    Ok(steps)
}

/// 生成回退策略步骤
pub fn generate_fallback_strategy_steps() -> Vec<StepRefOrInline> {
    vec![
        StepRefOrInline {
            r#ref: None,
            inline: Some(InlineStep {
                step_id: "fallback_smart_tap".to_string(),
                action: SingleStepAction::SmartTap,
                params: serde_json::json!({
                    "strategy": "fallback",
                    "confidence": 0.5,
                    "description": "回退策略：基础智能点击"
                }),
            }),
        },
    ]
}

/// 转换智能分析结果为 V3 步骤格式
pub fn convert_analysis_result_to_v3_steps(
    analysis_result: crate::services::intelligent_analysis_service::IntelligentAnalysisResult
) -> Result<Vec<StepRefOrInline>, anyhow::Error> {
    let mut steps = Vec::new();
    
    for (index, candidate) in analysis_result.candidates.iter().enumerate() {
        // 🔧 修复：从智能分析结果中提取关键执行参数
        let target_text = candidate.execution_params.get("targetText")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        
        // 🔧 修复：优先使用智能分析生成的完整XPath（包含子元素过滤条件）
        // ⚠️ 关键修复：之前这里会重新生成简化的XPath，导致智能分析的子元素过滤条件丢失！
        let xpath = candidate.execution_params.get("xpath")
            .and_then(|v| v.as_str())
            .filter(|s| !s.is_empty()) // 过滤空字符串
            .map(|s| {
                tracing::info!("✅ [XPath保留] 使用智能分析生成的完整XPath: {}", s);
                s.to_string()
            })
            .or_else(|| {
                // ⚠️ 只有在智能分析完全没有提供xpath时，才回退到简单生成
                tracing::warn!("⚠️ [XPath回退] 智能分析未提供XPath，使用策略回退生成");
                match candidate.strategy.as_str() {
                    "self_anchor" => {
                        if let Some(resource_id) = candidate.execution_params.get("resource_id") {
                            Some(format!("//*[@resource-id='{}']", resource_id.as_str().unwrap_or("")))
                        } else if !target_text.is_empty() {
                            Some(format!("//*[@text='{}']", target_text))
                        } else {
                            None
                        }
                    },
                    "child_driven" => {
                        if !target_text.is_empty() {
                            Some(format!("//*[contains(@text,'{}') or contains(@content-desc,'{}')]", target_text, target_text))
                        } else {
                            None
                        }
                    },
                    _ => {
                        if !target_text.is_empty() {
                            Some(format!("//*[@text='{}' or @content-desc='{}']", target_text, target_text))
                        } else {
                            None
                        }
                    }
                }
            })
            .unwrap_or_else(|| "//*[@clickable='true']".to_string()); // 兜底xpath
        
        // 🆕 修复：构建完整的params，包含original_data传递
        let mut params = serde_json::json!({
            "strategy": candidate.strategy.clone(),
            "strategy_type": candidate.strategy.clone(), // 添加策略类型字段
            "confidence": candidate.confidence,
            "reasoning": candidate.reasoning.clone(),
            "xpath": xpath, // 🔧 关键修复：添加xpath参数
            "targetText": target_text,
            "minConfidence": candidate.execution_params.get("minConfidence").unwrap_or(&serde_json::json!(0.8)),
            "mode": candidate.execution_params.get("mode").unwrap_or(&serde_json::json!("first"))
        });
        
        // 🆕 关键修复：如果智能分析结果包含original_data，传递给执行步骤
        if let Some(original_data) = candidate.execution_params.get("original_data") {
            params["original_data"] = original_data.clone();
            tracing::info!("🔄 [数据传递] 步骤 {} 包含original_data，已传递到执行层", index + 1);
        } else {
            tracing::warn!("⚠️ [数据传递] 步骤 {} 缺少original_data，失败恢复能力受限", index + 1);
        }
        
        let step = StepRefOrInline {
            r#ref: None,
            inline: Some(InlineStep {
                step_id: format!("intelligent_step_{}", index + 1),
                action: match candidate.strategy.as_str() {
                    "tap" | "click" | "self_anchor" => SingleStepAction::SmartTap,
                    "find" | "locate" => SingleStepAction::SmartFindElement,
                    _ => SingleStepAction::SmartTap,
                },
                params,
            }),
        };
        
        steps.push(step);
    }
    
    tracing::info!("🔄 转换了 {} 个智能分析候选为 V3 步骤", steps.len());
    Ok(steps)
}
