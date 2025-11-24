// src-tauri/src/exec/v3/helpers/strategy_generation.rs
// module: exec/v3 | layer: helpers | role: 策略生成与转换
// summary: 提供智能策略候选生成、优化选择、步骤转换等功能

use crate::automation::analysis::intelligent::{InteractiveElement, ScoredElement};
use crate::automation::analysis::utils::truncate_xml_in_json;
use crate::services::intelligent_analysis_service::{StrategyCandidate, ElementInfo};
use crate::automation::types::{StepRefOrInline, InlineStep, SingleStepAction};

/// 从原始参数中提取步骤ID
/// 
/// 优先级顺序：
/// 1. originalParams.stepId 
/// 2. originalParams.step_id
/// 3. 顶层参数中的step_id字段
fn extract_original_step_id(original_params: &serde_json::Value) -> Option<String> {
    // 🔥 策略1: 从顶层 stepId 提取（由 intelligent_preprocessing 添加）
    if let Some(step_id) = original_params.get("stepId").and_then(|v| v.as_str()) {
        tracing::info!("🔍 [ID提取] 从顶层 stepId 提取: {}", step_id);
        return Some(step_id.to_string());
    }
    
    // 策略2: 从 originalParams 中提取
    if let Some(orig_params) = original_params.get("originalParams") {
        if let Some(step_id) = orig_params.get("stepId").and_then(|v| v.as_str()) {
            tracing::info!("🔍 [ID提取] 从 originalParams.stepId 提取: {}", step_id);
            return Some(step_id.to_string());
        }
        if let Some(step_id) = orig_params.get("step_id").and_then(|v| v.as_str()) {
            tracing::info!("🔍 [ID提取] 从 originalParams.step_id 提取: {}", step_id);
            return Some(step_id.to_string());
        }
    }
    
    // 策略3: 从 original_data 中提取
    if let Some(orig_data) = original_params.get("original_data") {
        if let Some(step_id) = orig_data.get("step_id").and_then(|v| v.as_str()) {
            tracing::info!("🔍 [ID提取] 从 original_data.step_id 提取: {}", step_id);
            return Some(step_id.to_string());
        }
    }
    
    // 策略4: 从顶层参数提取 step_id（备选）
    if let Some(step_id) = original_params.get("step_id").and_then(|v| v.as_str()) {
        tracing::info!("🔍 [ID提取] 从顶层 step_id 提取: {}", step_id);
        return Some(step_id.to_string());
    }
    
    tracing::warn!("⚠️ [ID提取] 未找到原始步骤ID，将使用自动生成ID");
    None
}

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
    if element.clickable.unwrap_or(false) { 
        return "direct_click".to_string(); 
    }
    if element.semantic_role == "button" { 
        return "semantic_click".to_string(); 
    }
    if !element.text.as_ref().map_or(true, |s| s.is_empty()) || !element.content_desc.as_ref().map_or(true, |s| s.is_empty()) {
        return "text_based_click".to_string();
    }
    "fallback_click".to_string()
}

/// 创建执行计划
pub fn create_execution_plan(element: &InteractiveElement, original_params: &serde_json::Value) -> serde_json::Value {
    let mut plan = serde_json::json!({
        "action": "SmartSelection",
        "xpath": element.xpath,
        "targetText": element.text.clone().unwrap_or_default(),
        "contentDesc": element.content_desc.clone().unwrap_or_default(),
        "bounds": element.bounds.clone(),
        "resourceId": element.resource_id.clone(),
        "className": element.class_name.clone(),
        "originalParams": original_params
    });

    // 🔥 关键修复：继承原始参数中的 smartSelection 配置（包含批量模式）
    if let Some(smart_selection) = original_params.get("smartSelection") {
        if let serde_json::Value::Object(ref mut obj) = plan {
            obj.insert("smartSelection".to_string(), smart_selection.clone());
            tracing::info!("✅ [批量模式继承] 已将 smartSelection 配置传递到执行计划: mode={:?}", 
                smart_selection.get("mode"));
        }
    }

    plan
}

/// 评估策略风险等级
pub fn assess_risk_level(confidence: f64, element: &InteractiveElement) -> String {
    if confidence > 0.8 && element.clickable.unwrap_or(false) {
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
    original_params: &serde_json::Value
) -> Result<Vec<StepRefOrInline>, String> {
    let mut steps = Vec::new();
    
    // 🔥 关键修复：提取原始步骤ID以保持配置查找的一致性
    let original_step_id = extract_original_step_id(original_params);
    
    for (idx, strategy) in strategies.iter().enumerate() {
        // 🔧 关键修复：将策略置信度添加到执行参数中
        let mut enhanced_params = strategy.execution_params.clone();
        if let serde_json::Value::Object(ref mut obj) = enhanced_params {
            obj.insert("confidence".to_string(), serde_json::json!(strategy.confidence));
            obj.insert("strategy_type".to_string(), serde_json::json!(strategy.strategy));
            
            // � 关键修复：保持originalParams传递，确保structural_signatures能被检测
            obj.insert("originalParams".to_string(), original_params.clone());
            
            // �🔧 额外确保xpath信息传递
            if let Some(element_info) = &strategy.element_info.resource_id {
                if !obj.contains_key("xpath") {
                    let xpath = format!("//*[@resource-id='{}']", element_info);
                    obj.insert("xpath".to_string(), serde_json::json!(xpath));
                }
            }
        }
        
        // 🔥 使用原始步骤ID（如果存在），否则回退到自动生成ID
        let step_id = if let Some(orig_id) = &original_step_id {
            if idx == 0 {
                // 第一个步骤使用原始ID，以便能找到保存的配置
                orig_id.clone()
            } else {
                // 多个步骤时，其他步骤添加后缀
                format!("{}_{}", orig_id, idx)
            }
        } else {
            // 回退到原有逻辑
            format!("intelligent_step_{}", idx + 1)
        };
        
        // 🔍 调试：打印实际传递的参数（XML字段简化显示）
        let truncated_params = truncate_xml_in_json(&enhanced_params);
        tracing::info!("🔧 智能步骤参数: step_id={}, params={}", 
                       &step_id, 
                       serde_json::to_string_pretty(&truncated_params).unwrap_or_default());
        
        let step = StepRefOrInline {
            r#ref: None,
            inline: Some(InlineStep {
                step_id,
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
    convert_analysis_result_to_v3_steps_with_config(analysis_result, None)
}

/// 转换智能分析结果为V3步骤（带配置保留）
///
/// 🔥 关键修复：支持保留原始的 smartSelection 和 originalParams 配置
pub fn convert_analysis_result_to_v3_steps_with_config(
    analysis_result: crate::services::intelligent_analysis_service::IntelligentAnalysisResult,
    preserved_config: Option<&serde_json::Value>, // 🆕 传入需要保留的配置
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
        
        // 🔥 【批量模式修复】保留原始的 smartSelection 和 originalParams 配置
        if let Some(config) = preserved_config {
            // 1. 保留 smartSelection（批量模式配置）
            if let Some(smart_selection) = config.get("smartSelection") {
                params["smartSelection"] = smart_selection.clone();
                tracing::info!("✅ [批量配置保留] 步骤 {} 已继承 smartSelection: mode={:?}", 
                    index + 1, 
                    smart_selection.get("mode"));
            }
            
            // 2. 🔥 关键修复：直接将 config 作为 originalParams（因为 config 本身就是原始参数）
            params["originalParams"] = config.clone();
            tracing::info!("✅ [原始参数保留] 步骤 {} 已继承完整的原始参数作为 originalParams", index + 1);
            
            // 3. 特别确保 structural_signatures 被正确传递
            if let Some(structural_sigs) = config.get("structural_signatures") {
                tracing::info!("✅ [结构签名确认] 步骤 {} 包含 structural_signatures: {:?}", 
                    index + 1,
                    structural_sigs.as_object().map(|obj| obj.keys().collect::<Vec<_>>())
                );
            }
        }
        
        // 🔥 使用原始步骤ID（如果存在）
        let step_id = if let Some(config) = preserved_config {
            // 🔧 修复：从 preserved_config 中提取 stepId，而不是从 originalParams
            let direct_id = config.get("stepId")
                .and_then(|v| v.as_str())
                .or_else(|| config.get("step_id").and_then(|v| v.as_str()));
            
            let extracted_option = extract_original_step_id(config);
            let extracted_id = if direct_id.is_some() {
                direct_id
            } else {
                extracted_option.as_deref()
            };
                
            if let Some(orig_id) = extracted_id {
                tracing::info!("🔍 [ID提取成功] 步骤 {} 使用原始ID: {}", index + 1, orig_id);
                if index == 0 {
                    // 第一个步骤使用原始ID，以便能找到保存的配置
                    orig_id.to_string()
                } else {
                    // 多个步骤时，其他步骤添加后缀
                    format!("{}_{}", orig_id, index)
                }
            } else {
                tracing::warn!("⚠️ [ID提取失败] 步骤 {} 使用自动生成ID", index + 1);
                // 回退到原有逻辑
                format!("intelligent_step_{}", index + 1)
            }
        } else {
            // 没有配置时，使用默认ID
            format!("intelligent_step_{}", index + 1)
        };

        let step = StepRefOrInline {
            r#ref: None,
            inline: Some(InlineStep {
                step_id,
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

/// 解析bounds字符串为坐标元组
/// 
/// 格式: "[left,top][right,bottom]"  
/// 例如: "[45,1059][249,1263]" -> (45, 1059, 249, 1263)
fn parse_bounds(bounds_str: &str) -> Option<(i32, i32, i32, i32)> {
    let bounds_str = bounds_str.trim();
    
    // 匹配格式: [left,top][right,bottom]
    let parts: Vec<&str> = bounds_str
        .trim_matches(&['[', ']'][..])
        .split("][")
        .collect();
    
    if parts.len() != 2 {
        return None;
    }
    
    let left_top: Vec<i32> = parts[0].split(',')
        .filter_map(|s| s.trim().parse::<i32>().ok())
        .collect();
    
    let right_bottom: Vec<i32> = parts[1].split(',')
        .filter_map(|s| s.trim().parse::<i32>().ok())
        .collect();
    
    if left_top.len() == 2 && right_bottom.len() == 2 {
        Some((left_top[0], left_top[1], right_bottom[0], right_bottom[1]))
    } else {
        None
    }
}

/// 计算候选元素的bounds与用户选择bounds的匹配度
/// 
/// 返回值越大表示匹配度越高:
/// - 如果候选完全在用户选择区域内: 返回 1.0
/// - 如果有部分重叠: 返回 0.5 ~ 0.99
/// - 如果距离很近: 返回 0.1 ~ 0.49
/// - 如果距离很远: 返回 0.0
fn calculate_bounds_match_score(
    candidate_bounds: &str,
    user_selected_bounds: &str,
) -> f64 {
    let candidate = match parse_bounds(candidate_bounds) {
        Some(b) => b,
        None => return 0.0,
    };
    
    let user_bounds = match parse_bounds(user_selected_bounds) {
        Some(b) => b,
        None => return 0.0,
    };
    
    let (c_left, c_top, c_right, c_bottom) = candidate;
    let (u_left, u_top, u_right, u_bottom) = user_bounds;
    
    // 1. 检查候选是否完全在用户选择区域内
    if c_left >= u_left && c_top >= u_top && c_right <= u_right && c_bottom <= u_bottom {
        // 完全包含,返回高分
        return 1.0;
    }
    
    // 2. 检查是否有重叠
    let has_overlap = !(c_right < u_left || c_left > u_right || c_bottom < u_top || c_top > u_bottom);
    
    if has_overlap {
        // 计算重叠面积
        let overlap_left = c_left.max(u_left);
        let overlap_top = c_top.max(u_top);
        let overlap_right = c_right.min(u_right);
        let overlap_bottom = c_bottom.min(u_bottom);
        
        let overlap_area = ((overlap_right - overlap_left) * (overlap_bottom - overlap_top)) as f64;
        let candidate_area = ((c_right - c_left) * (c_bottom - c_top)) as f64;
        
        // 重叠比例作为得分
        if candidate_area > 0.0 {
            return 0.5 + (overlap_area / candidate_area) * 0.49;
        } else {
            return 0.5;
        }
    }
    
    // 3. 计算中心点距离
    let c_center_x = (c_left + c_right) / 2;
    let c_center_y = (c_top + c_bottom) / 2;
    let u_center_x = (u_left + u_right) / 2;
    let u_center_y = (u_top + u_bottom) / 2;
    
    let distance = (((c_center_x - u_center_x).pow(2) + (c_center_y - u_center_y).pow(2)) as f64).sqrt();
    
    // 距离越近得分越高,最大距离2000像素
    let max_distance = 2000.0;
    if distance < max_distance {
        return 0.1 * (1.0 - distance / max_distance) * 0.39;
    }
    
    0.0
}

/// 根据用户选择的bounds重新排序候选
/// 
/// 将最接近用户选择区域的候选排在前面
pub fn rerank_candidates_by_bounds(
    candidates: Vec<crate::services::intelligent_analysis_service::StrategyCandidate>,
    user_selected_bounds: Option<&str>,
) -> Vec<crate::services::intelligent_analysis_service::StrategyCandidate> {
    // 如果没有用户选择的bounds,直接返回原候选
    let user_bounds = match user_selected_bounds {
        Some(b) if !b.is_empty() => b,
        _ => return candidates,
    };
    
    tracing::info!("🎯 [Bounds匹配] 开始根据用户选择bounds重新排序候选: user_bounds={}", user_bounds);
    
    // 计算每个候选的bounds匹配得分
    let mut scored_candidates: Vec<(crate::services::intelligent_analysis_service::StrategyCandidate, f64)> = candidates
        .into_iter()
        .map(|candidate| {
            let bounds_score = match &candidate.element_info.bounds {
                Some(bounds_str) => calculate_bounds_match_score(bounds_str, user_bounds),
                None => 0.0,
            };
            
            // 🔕 临时禁用：测试时噪音过大
            // tracing::debug!(
            //     "  候选: bounds={:?}, 原始置信度={:.3}, bounds匹配得分={:.3}",
            //     candidate.element_info.bounds,
            //     candidate.confidence,
            //     bounds_score
            // );
            
            (candidate, bounds_score)
        })
        .collect();
    
    // 按bounds匹配得分降序排序
    scored_candidates.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
    
    // 提取排序后的候选
    let reranked: Vec<_> = scored_candidates
        .into_iter()
        .enumerate()
        .inspect(|(index, (candidate, bounds_score))| {
            tracing::info!(
                "  [{}] bounds={:?}, text={:?}, 原始置信度={:.3}, bounds匹配得分={:.3}",
                index + 1,
                candidate.element_info.bounds,
                candidate.element_info.text,
                candidate.confidence,
                bounds_score
            );
        })
        .map(|(_, (candidate, _))| candidate)
        .collect();
    
    tracing::info!("✅ [Bounds匹配] 候选重排序完成，共 {} 个候选", reranked.len());
    
    reranked
}

