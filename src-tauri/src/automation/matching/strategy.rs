// src-tauri/src/automation/matching/strategy.rs
// module: automation | layer: matching | role: 匹配策略选择器
// summary: 根据不同的策略类型（self_anchor, child_driven, content_desc等）收集候选元素

use crate::services::universal_ui_page_analyzer::UIElement;
use super::xpath::{
    extract_resource_id_from_xpath,
    extract_child_text_filter_from_xpath,
    extract_content_desc_from_xpath,
};
use super::text::{
    element_has_child_with_text,
    find_all_elements_by_text_or_desc,
};
use crate::automation::matching::scorer::{
    MultiCandidateEvaluator,
    EvaluationCriteria,
    ParentInfo,
};
use crate::exec::semantic_analyzer::SemanticAnalyzer;
use crate::exec::semantic_analyzer::config::TextMatchingMode;

/// 收集候选元素
pub fn collect_candidate_elements<'a>(
    elements: &'a [UIElement],
    strategy_type: &str,
    xpath: &str,
    target_text: &str,
    original_bounds: Option<&str>,  // 🔥 新增：用户选择的 bounds
    params: &serde_json::Value,     // 🔥 新增：完整参数，用于提取 children_texts
) -> Vec<&'a UIElement> {
    // 🔥 P0修复：先按 XPath 或 class 收集初步候选
    let candidates: Vec<&UIElement> = match strategy_type {
        "self_anchor" => {
            // 🔥 对于自锚定策略，优先使用resource-id + 子元素文本过滤
            if xpath.contains("@resource-id") {
                let resource_id = extract_resource_id_from_xpath(xpath);
                
                // 🔥 检查是否有子元素文本过滤条件
                if let Some(child_text) = extract_child_text_filter_from_xpath(xpath) {
                    tracing::info!("🔍 [元素匹配] 使用子元素文本过滤: resource-id='{}' + 子元素text='{}'", resource_id, child_text);
                    
                    // 收集所有同时满足 resource-id 和子元素文本的元素
                    elements.iter().filter(|e| {
                        let has_resource_id = e.resource_id.as_ref() == Some(&resource_id);
                        let has_child_text = element_has_child_with_text(e, &child_text);
                        
                        if has_resource_id && has_child_text {
                            tracing::info!("✅ [候选收集] 找到匹配元素: resource-id='{}', text='{:?}', bounds='{:?}'", 
                                         resource_id, e.text, e.bounds);
                        }
                        
                        has_resource_id && has_child_text
                    }).collect()
                } else {
                    // 没有子元素过滤，收集所有匹配 resource-id 的元素
                    tracing::warn!("⚠️ [元素匹配] XPath 没有子元素过滤，仅使用 resource-id 匹配（可能不准确）");
                    elements.iter().filter(|e| {
                        e.resource_id.as_ref() == Some(&resource_id)
                    }).collect()
                }
            } else {
                find_all_elements_by_text_or_desc(elements, target_text)
            }
        },
        "child_driven" => {
            // 🔥 对于子元素驱动策略，优先使用 children_texts，如果为空则回退到 targetText
            let search_text = params.get("original_data")
                .and_then(|od| od.get("children_texts"))
                .and_then(|ct| ct.as_array())
                .and_then(|arr| arr.first())
                .and_then(|v| v.as_str())
                .filter(|s| !s.trim().is_empty())
                .unwrap_or(target_text);
            
            if search_text.is_empty() {
                tracing::warn!("⚠️ [child_driven策略] 无可用文本，尝试使用element_text");
                let element_text = params.get("original_data")
                    .and_then(|od| od.get("element_text"))
                    .and_then(|v| v.as_str())
                    .filter(|s| !s.trim().is_empty())
                    .unwrap_or("");
                find_all_elements_by_text_or_desc(elements, element_text)
            } else {
                tracing::info!("🔍 [child_driven策略] 使用子元素文本搜索: '{}'", search_text);
                find_all_elements_by_text_or_desc(elements, search_text)
            }
        },
        "content_desc" => {
            // 🔥 P0修复：为 content-desc 策略添加专门处理
            if xpath.contains("@content-desc") {
                // 从 XPath 提取 content-desc 的值: //*[@content-desc='添加朋友']
                let content_desc = extract_content_desc_from_xpath(xpath);
                
                if !content_desc.is_empty() {
                    tracing::info!("🔍 [元素匹配] 使用 content-desc 匹配: '{}'", content_desc);
                    
                    // 🐛 DEBUG: 打印所有非空content-desc元素(最多前20个)
                    tracing::info!("📋 [DEBUG] 列出所有带 content-desc 的元素:");
                    let mut desc_count = 0;
                    for (i, elem) in elements.iter().enumerate() {
                        let cd = &elem.content_desc; if !cd.is_empty() {
                            if !cd.trim().is_empty() {
                                tracing::info!("  [{}] content_desc='{}', text={:?}, bounds={:?}", 
                                            i, cd, elem.text, elem.bounds);
                                desc_count += 1;
                                if desc_count >= 20 { break; } // 限制输出数量
                            }
                        }
                    }
                    
                    if desc_count == 0 {
                        tracing::warn!("⚠️ [DEBUG] XML中没有任何非空的content-desc属性!");
                    } else {
                        tracing::info!("📊 [DEBUG] 共找到 {} 个带content-desc的元素(显示前20个)", desc_count);
                    }
                    
                    // 收集所有匹配 content-desc 的元素
                    let candidates: Vec<_> = elements.iter().filter(|e| {
                        // 🐛 DEBUG: 更详细的比较逻辑
                        let cd = &e.content_desc;
                        if !cd.trim().is_empty() {
                            let matches = cd.trim() == content_desc.trim();
                            if matches {
                                tracing::info!("✅ [候选收集] 找到匹配元素: content-desc='{}', bounds='{:?}'", 
                                             content_desc, e.bounds);
                            }
                            matches
                        } else {
                            false
                        }
                    }).collect();
                    
                    if candidates.is_empty() {
                        tracing::warn!("⚠️ [元素匹配] 未找到 content-desc='{}' 的元素，已检查 {} 个元素", 
                                     content_desc, elements.len());
                    }
                    
                    candidates
                } else {
                    tracing::warn!("⚠️ [元素匹配] 无法从 XPath 提取 content-desc 值，回退到文本匹配");
                    find_all_elements_by_text_or_desc(elements, target_text)
                }
            } else {
                // 没有 content-desc 属性，回退到文本匹配
                find_all_elements_by_text_or_desc(elements, target_text)
            }
        },
        _ => {
            // 默认策略：综合文本和描述匹配所有候选
            find_all_elements_by_text_or_desc(elements, target_text)
        }
    };
    
    // 🔥 批量模式检测：从 params 中提取 mode
    let batch_mode = params.get("smartSelection")
        .and_then(|v| v.get("mode"))
        .and_then(|v| v.as_str())
        .unwrap_or("first");
    
    // 🔥 P0修复：根据 mode 决定是否使用 Bounds 精确过滤
    if let Some(user_bounds) = original_bounds {
        if batch_mode == "all" {
            // 🎯 批量模式：优先过滤可点击元素
            tracing::info!("🔄 [批量模式] 开始过滤 {} 个候选", candidates.len());
            
            // 1️⃣ 优先选择可点击的元素
            let clickable_candidates: Vec<_> = candidates.iter()
                .filter(|e| {
                    // clickable 是 Option<bool>，直接判断
                    e.clickable
                })
                .copied()
                .collect();
            
            if !clickable_candidates.is_empty() {
                tracing::info!(
                    "✅ [批量模式-可点击过滤] 从 {} 个候选中筛选出 {} 个可点击元素",
                    candidates.len(),
                    clickable_candidates.len()
                );
                tracing::info!("   用户选择bounds='{}' 将用于相似度排序", user_bounds);
                // TODO: 实现 Bounds 相似度排序
                return clickable_candidates;
            } else {
                // 2️⃣ 如果没有可点击元素，保留所有候选（兜底）
                tracing::warn!(
                    "⚠️ [批量模式-可点击过滤] 未找到可点击元素，保留全部 {} 个候选",
                    candidates.len()
                );
                return candidates;
            }
        } else {
            // 🎯 单次模式：使用 Bounds 精确过滤
            let exact_match: Vec<_> = candidates.iter()
                .filter(|e| {
                    let b = e.bounds.to_string();
                    let normalize = |s: &str| s.replace(" ", "");
                    normalize(&b) == normalize(user_bounds)
                })
                .copied()
                .collect();
            
            if !exact_match.is_empty() {
                tracing::info!("✅ [Bounds过滤] 找到 {} 个完全匹配用户选择bounds的元素 (从 {} 个候选中过滤)", 
                             exact_match.len(), candidates.len());
                return exact_match;
            } else {
                tracing::warn!("⚠️ [Bounds过滤] 未找到完全匹配用户bounds='{}' 的元素，使用全部 {} 个候选", 
                             user_bounds, candidates.len());
            }
        }
    }
    
    candidates
}

/// 评估最佳候选元素
pub fn evaluate_best_candidate<'a>(
    candidate_elements: Vec<&'a UIElement>,
    params: &serde_json::Value,
    ui_xml: &str,  // 🔥 新增：当前XML内容，用于子元素文本提取
    match_direction: Option<&str>,  // 🆕 匹配方向："forward" | "backward" | None(单步模式)
) -> Result<Option<&'a UIElement>, String> {
    if candidate_elements.len() > 1 {
        tracing::info!("🔍 [多候选评估] 启动模块化评估器（{} 个候选）", candidate_elements.len());
        
        // 从 original_data 提取评估准则
        let original_data = params.get("original_data");
        
        // 🔥 修复：优先使用 element_text，如果为空则回退到 children_texts[0]
        let target_text_option = original_data
            .and_then(|od| od.get("element_text"))
            .and_then(|v| v.as_str())
            .filter(|s| !s.is_empty())  // 🔥 过滤空字符串
            .or_else(|| {
                params.get("smartSelection")
                    .and_then(|v| v.get("targetText"))
                    .and_then(|v| v.as_str())
                    .filter(|s| !s.is_empty())  // 🔥 过滤空字符串
            })
            .or_else(|| {
                // 🔥 回退：使用 children_texts 的第一个元素（父容器+子文本模式）
                original_data
                    .and_then(|od| od.get("children_texts"))
                    .and_then(|v| v.as_array())
                    .and_then(|arr| arr.first())
                    .and_then(|v| v.as_str())
                    .filter(|s| !s.is_empty())
            })
            .map(|s| s.to_string());
        
        let target_content_desc = original_data
            .and_then(|od| od.get("key_attributes"))
            .and_then(|ka| ka.get("content-desc"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        
        let original_bounds = original_data
            .and_then(|od| od.get("element_bounds"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        
        // 提取子元素文本（用于更精准的匹配）
        let children_texts = original_data
            .and_then(|od| od.get("children_texts"))
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str())
                    .map(|s| s.to_string())
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();
        
        // 🔍 DEBUG: 输出目标文本来源
        tracing::info!("🔍 [目标文本提取] target_text={:?}, children_texts={:?}", target_text_option, children_texts);
        
        let original_resource_id = original_data
            .and_then(|od| od.get("key_attributes"))
            .and_then(|ka| ka.get("resource-id"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        
        // 🔥 提取 selected_xpath（用户精确选择的绝对全局XPath）
        let selected_xpath = original_data
            .and_then(|od| od.get("selected_xpath"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        
        // 🆕 NEW: 提取匹配策略标记
        let matching_strategy = original_data
            .and_then(|od| od.get("matching_strategy"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        
        // 🆕 NEW: 提取兄弟元素文本
        let sibling_texts = original_data
            .and_then(|od| od.get("sibling_texts"))
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str())
                    .map(|s| s.to_string())
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();
        
        // 🆕 NEW: 提取父元素信息
        let parent_info = original_data
            .and_then(|od| od.get("parent_info"))
            .and_then(|v| v.as_object())
            .map(|obj| {
                ParentInfo {
                    content_desc: obj.get("contentDesc")
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string(),
                    text: obj.get("text")
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string(),
                    resource_id: obj.get("resourceId")
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string(),
                }
            });
        
        // 🔍 DEBUG: 输出新提取的策略信息
        if matching_strategy.is_some() || !sibling_texts.is_empty() || parent_info.is_some() {
            tracing::info!("🔥 [策略标记提取] matching_strategy={:?}, sibling_texts={:?}, parent_info={:?}", 
                         matching_strategy, sibling_texts, parent_info);
        }
        
        // ✅ 创建语义分析器实例
        let mut semantic_analyzer = SemanticAnalyzer::new();
        
        // 🔥 从前端配置读取文本匹配模式，优先级：smartSelection > originalParams
        let (text_matching_mode, antonym_detection_enabled) = {
            // 尝试从smartSelection配置中获取
            let smart_selection_config = params
                .get("smartSelection")
                .and_then(|v| v.as_object())
                .or_else(|| {
                    params
                        .get("originalParams")
                        .and_then(|v| v.as_object())
                        .and_then(|obj| obj.get("smartSelection"))
                        .and_then(|v| v.as_object())
                });
            
            if let Some(config) = smart_selection_config {
                let mode = config
                    .get("textMatchingMode")
                    .and_then(|v| v.as_str())
                    .unwrap_or("exact"); // 默认绝对匹配
                
                let antonym_enabled = config
                    .get("antonymCheckEnabled")
                    .and_then(|v| v.as_bool())
                    .unwrap_or(false); // 默认禁用反义词检测
                
                tracing::info!("🧠 [文本匹配配置] 从前端获取: mode={}, antonym_enabled={}", mode, antonym_enabled);
                
                match mode {
                    "partial" => (TextMatchingMode::Partial, antonym_enabled),
                    _ => (TextMatchingMode::Exact, false), // 绝对匹配强制禁用反义词检测
                }
            } else {
                tracing::warn!("⚠️ [文本匹配配置] 未找到前端配置，使用默认值: mode=exact, antonym_enabled=false");
                (TextMatchingMode::Exact, false) // 默认使用绝对匹配
            }
        };
        
        semantic_analyzer.set_text_matching_mode(text_matching_mode);
        semantic_analyzer.set_antonym_detection(antonym_detection_enabled);

        // ✅ 构建评估准则（完整版）
        let criteria = EvaluationCriteria {
            target_text: target_text_option.clone(), // 克隆避免move
            target_content_desc,
            original_bounds,
            original_resource_id,
            children_texts,
            // 🔥 根据匹配方向决定 prefer_last
            // - None（单步模式）: prefer_last = false（信任智能匹配，不跳过第一个）
            // - "forward"（正向）: prefer_last = false（从第一个开始）
            // - "backward"（反向）: prefer_last = true（从最后一个开始）
            prefer_last: match match_direction {
                Some("forward") => false,   // 正向：从第一个开始
                Some("backward") => true,   // 反向：从最后一个开始
                _ => false,                 // ✅ 单步模式：信任智能匹配系统，从第一个开始
            },
            selected_xpath, // 🔥 传递用户选择的XPath（最高优先级匹配依据）
            xml_content: Some(ui_xml.to_string()), // 🔥 传递当前XML，用于子元素文本提取
            matching_strategy, // 🆕 NEW: 匹配策略标记
            sibling_texts, // 🆕 NEW: 兄弟元素文本
            parent_info, // 🆕 NEW: 父元素信息
            semantic_analyzer: Some(semantic_analyzer), // 🆕 NEW: 语义分析器
        };
        
        // ✅ 使用 MultiCandidateEvaluator 进行综合评估
        tracing::info!("🧠 [多候选评估] 开始综合评分，criteria.selected_xpath={:?}", criteria.selected_xpath);
        
        if let Some(best_candidate) = MultiCandidateEvaluator::evaluate_candidates(candidate_elements.clone(), &criteria) {
            // 🚨 检查分数是否达到最低有效阈值
            const MIN_VALID_SCORE: f32 = 0.3; // 设置最低有效分数
            
            if best_candidate.score < MIN_VALID_SCORE {
                tracing::error!("🚨 [目标不存在] 最佳候选分数过低 ({:.3} < {:.1})，当前页面可能不存在真正的目标元素", 
                               best_candidate.score, MIN_VALID_SCORE);
                tracing::error!("   📍 最佳候选详情: text={:?}, content-desc={:?}, bounds={:?}", 
                               best_candidate.element.text, 
                               best_candidate.element.content_desc,
                               best_candidate.element.bounds);
                tracing::error!("   🔍 评分原因:");
                for reason in &best_candidate.reasons {
                    tracing::error!("      └─ {}", reason);
                }
                
                // 特殊检查：如果是反义词情况，给出更明确的错误信息
                if best_candidate.reasons.iter().any(|r| r.contains("反义词") || r.contains("语义相反")) {
                    if let Some(ref target_text) = criteria.target_text {
                        return Err(format!(
                            "当前页面不存在可点击的'{}' 按钮，所有找到的按钮都是相反状态（如'已{}'）。\n建议：请检查页面状态，或者更新页面后重试。",
                            target_text, target_text
                        ));
                    }
                }
                
                return Err(format!(
                    "当前页面不存在符合条件的目标元素（最高分仅{:.3}），请检查页面状态或目标选择是否正确。",
                    best_candidate.score
                ));
            }
            
            tracing::info!("✅ [多候选评估] 最佳匹配: score={:.3}", best_candidate.score);
            tracing::info!("   📍 详情: text={:?}, content-desc={:?}, bounds={:?}", 
                         best_candidate.element.text, 
                         best_candidate.element.content_desc,
                         best_candidate.element.bounds);
            tracing::info!("   🔍 评分原因:");
            for reason in &best_candidate.reasons {
                tracing::info!("      └─ {}", reason);
            }
            
            return Ok(Some(best_candidate.element));
        } else {
            tracing::warn!("⚠️ [多候选评估] 评估失败，使用第一个候选");
            return Ok(candidate_elements.first().copied());
        }
    } else {
        // 只有一个或零个候选，直接使用
        Ok(candidate_elements.first().copied())
    }
}
