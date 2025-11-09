// src-tauri/src/exec/v3/helpers/step_scoring.rs
// module: v3 | layer: helpers | role: 步骤评分功能 - SmartSelection评分引擎
// summary: 提供步骤可行性评分，基于SmartSelection引擎分析候选元素置信度

use crate::exec::v3::{StepRefOrInline, SingleStepAction, QualitySettings};
use crate::services::legacy_simple_selection_engine::SmartSelectionEngine;
use super::protocol_builders::create_smart_selection_protocol_for_scoring;

/// 🎯 对步骤进行智能评分（基于SmartSelection引擎）
/// 
/// **核心功能**：
/// - 评估步骤在当前UI状态下的可行性
/// - 基于候选元素数量和置信度计算分数
/// - **不执行任何真实设备操作**（评分阶段）
///
/// **评分机制**：
/// 1. 提取步骤的目标文本参数
/// 2. 使用SmartSelection引擎解析XML并查找候选元素
/// 3. 根据候选元素的平均置信度返回评分
///
/// **分数含义**：
/// - 0.0~0.3：匹配度差，不推荐执行
/// - 0.4~0.5：勉强可用，存在风险
/// - 0.6~0.8：匹配良好，推荐使用  
/// - 0.9~1.0：完美匹配，优先执行
///
/// **特殊处理**：
/// - 智能分析生成的步骤：使用预计算的置信度
/// - 引用类型步骤：返回默认中等分数0.6
///
/// **参数**：
/// - device_id: 设备ID（预留参数）
/// - ui_xml: 当前UI的XML内容
/// - step: 待评分的步骤
/// - quality: 质量设置（预留参数）
///
/// **返回**：
/// - Ok(f32): 评分（0.0~1.0）
/// - Err(String): 评分失败错误
pub async fn score_step_with_smart_selection(
    device_id: &str,
    ui_xml: &str,
    step: &StepRefOrInline,
    quality: &QualitySettings,
) -> Result<f32, String> {
    
    // 从步骤中提取参数
    let (step_id, params) = if let Some(inline) = &step.inline {
        let step_id = &inline.step_id;
        
        // ✅ 提取minConfidence参数：优先从smartSelection中读取,默认0.8
        let min_confidence = inline.params
            .get("smartSelection")
            .and_then(|ss| ss.get("minConfidence"))
            .and_then(|v| v.as_f64())
            .or_else(|| {
                inline.params
                    .get("minConfidence")
                    .and_then(|v| v.as_f64())
            });
        
        // ✅ 检测结构模式：结构模式下评分阶段直接返回高分,实际评分由执行阶段的SM Runtime完成
        let is_structural = inline.params
            .get("matchingStrategy")
            .and_then(|v| v.as_str())
            .map(|s| s.eq_ignore_ascii_case("structural"))
            .unwrap_or(false);
        
        if is_structural {
            // 结构模式：检查是否有structural_signatures
            let has_structural_sigs = inline.params
                .get("structural_signatures")
                .and_then(|sigs| sigs.get("skeleton"))
                .and_then(|sk| sk.as_array())
                .map(|arr| !arr.is_empty())
                .unwrap_or(false);
            
            if has_structural_sigs {
                tracing::info!(
                    "🏗️ 步骤 {} 结构模式评分: 跳过Legacy引擎,返回高置信度 0.90 (实际匹配由SM Runtime执行)",
                    step_id
                );
                return Ok(0.90); // 结构模式下的评分由执行阶段的SM Runtime完成
            } else {
                tracing::warn!(
                    "⚠️ 步骤 {} 声明结构模式但缺少structural_signatures,降级评分",
                    step_id
                );
                return Ok(0.50); // 参数不完整,给予较低分数
            }
        }
        
        // 🔧 关键修复：检测智能分析生成的步骤，直接返回其置信度
        if step_id.starts_with("intelligent_step_") {
            // 智能分析步骤：从步骤参数中提取预计算的置信度
            if let Some(confidence_value) = inline.params.get("confidence") {
                if let Some(confidence) = confidence_value.as_f64() {
                    tracing::info!("🧠 智能分析步骤 {} 使用预计算置信度: {:.3}", step_id, confidence);
                    return Ok(confidence as f32);
                }
            }
            
            // 如果没有预计算置信度，使用默认高置信度（智能分析生成的步骤应该是可信的）
            tracing::info!("🧠 智能分析步骤 {} 使用默认高置信度: 0.85", step_id);
            return Ok(0.85);
        }
        
        // 从inline步骤中构建SmartSelection参数
        let params = match &inline.action {
            SingleStepAction::SmartSelection => {
                // 🔧 修复：SmartSelection步骤参数提取逻辑改进
                // 支持两种参数结构：直接从根级别获取，或从smartSelection子对象获取
                let target_text = inline.params.get("targetText")
                    .and_then(|v| v.as_str())
                    .or_else(|| inline.params.get("contentDesc").and_then(|v| v.as_str()))
                    .or_else(|| inline.params.get("text").and_then(|v| v.as_str()))
                    // 🎯 新增：从smartSelection子对象中提取参数（前端V3格式）
                    .or_else(|| {
                        inline.params.get("smartSelection")
                            .and_then(|ss| ss.get("targetText"))
                            .and_then(|v| v.as_str())
                    })
                    .or_else(|| {
                        inline.params.get("smartSelection")
                            .and_then(|ss| ss.get("contentDesc"))
                            .and_then(|v| v.as_str())
                    })
                    .or_else(|| {
                        inline.params.get("smartSelection")
                            .and_then(|ss| ss.get("text"))
                            .and_then(|v| v.as_str())
                    });
                
                if let Some(text) = target_text {
                    tracing::info!("🎯 SmartSelection目标文本: '{}'", text);
                    create_smart_selection_protocol_for_scoring(text, min_confidence)?
                } else {
                    // 打印所有可用参数用于调试（包括smartSelection子对象）
                    let available_keys: Vec<_> = if let Some(obj) = inline.params.as_object() {
                        obj.keys().collect()
                    } else {
                        vec![]
                    };
                    let smart_selection_keys: Option<Vec<_>> = inline.params.get("smartSelection")
                        .and_then(|ss| ss.as_object())
                        .map(|obj| obj.keys().collect());
                    
                    tracing::error!("❌ SmartSelection步骤缺少目标文本参数");
                    tracing::error!("   可用根级参数: {:?}", available_keys);
                    tracing::error!("   smartSelection子参数: {:?}", smart_selection_keys);
                    return Err("SmartSelection步骤缺少targetText/contentDesc/text参数".to_string());
                }
            }
            SingleStepAction::Tap => {
                // 对于普通点击，从多种参数源获取文本
                let target_text = inline.params.get("text")
                    .and_then(|v| v.as_str())
                    .or_else(|| inline.params.get("contentDesc").and_then(|v| v.as_str()))
                    .or_else(|| inline.params.get("targetText").and_then(|v| v.as_str()));
                
                if let Some(text) = target_text {
                    tracing::info!("🎯 Tap目标文本: '{}'", text);
                    create_smart_selection_protocol_for_scoring(text, min_confidence)?
                } else {
                    let available_keys: Vec<_> = if let Some(obj) = inline.params.as_object() {
                        obj.keys().collect()
                    } else {
                        vec![]
                    };
                    tracing::error!("❌ Tap步骤缺少目标文本参数，可用参数: {:?}", available_keys);
                    return Err("Tap步骤缺少text/contentDesc/targetText参数".to_string());
                }
            }
            SingleStepAction::SmartTap => {
                // SmartTap 与 Tap 使用相同的评分逻辑，从多种参数源获取文本
                let target_text = inline.params.get("text")
                    .and_then(|v| v.as_str())
                    .or_else(|| inline.params.get("contentDesc").and_then(|v| v.as_str()))
                    .or_else(|| inline.params.get("targetText").and_then(|v| v.as_str()))
                    .or_else(|| inline.params.get("element_info")
                        .and_then(|ei| ei.get("text"))
                        .and_then(|v| v.as_str()));
                
                if let Some(text) = target_text {
                    tracing::info!("🎯 SmartTap目标文本: '{}'", text);
                    create_smart_selection_protocol_for_scoring(text, min_confidence)?
                } else {
                    // SmartTap 允许无文本的智能推理，返回默认评分参数
                    tracing::info!("🧠 SmartTap无明确目标文本，使用智能推理模式");
                    create_smart_selection_protocol_for_scoring("", min_confidence)?
                }
            }
            _ => {
                return Err(format!("不支持的步骤类型进行评分: {:?}", inline.action));
            }
        };
        
        (step_id.clone(), params)
    } else if let Some(ref_id) = &step.r#ref {
        // 对于引用类型，暂时返回中等分数
        tracing::warn!("引用类型步骤 {} 暂不支持详细评分，给予默认分数", ref_id);
        return Ok(0.6);
    } else {
        return Err("步骤缺少有效的内联或引用定义".to_string());
    };
    
    // 🎯 【评分阶段核心】：只进行分析评分，绝不执行真实设备操作！
    // 
    // ✅ 正确做法：使用 parse_xml_and_find_candidates (仅XML解析+候选匹配)
    // ❌ 严禁调用：tap_injector_first, execute_*, 或任何执行函数
    // ❌ 严禁调用：SmartSelectionEngine::execute_* 系列函数
    // 
    // 📊 评分逻辑：基于候选元素数量和平均置信度计算步骤可行性
    match SmartSelectionEngine::parse_xml_and_find_candidates(ui_xml, &params) {
        Ok(candidates) => {
            let confidence = if candidates.is_empty() {
                // 🔍 无候选元素：评分为0，表示该步骤无法执行
                tracing::warn!("📊 步骤 {} 评分: 无候选元素，评分=0.0", step_id);
                0.0
            } else {
                // 📈 有候选元素：计算平均置信度作为评分
                let total_confidence: f32 = candidates.iter().map(|c| c.confidence).sum();
                let avg_confidence = total_confidence / candidates.len() as f32;
                
                tracing::info!("📊 步骤 {} 评分完成: 候选数={}, 平均置信度={:.2} 【仅评分阶段，未执行点击】", 
                    step_id, candidates.len(), avg_confidence);
                    
                avg_confidence
            };
            Ok(confidence)
        }
        Err(e) => {
            tracing::warn!("📊 步骤 {} 评分失败: {}", step_id, e);
            // 评分失败不一定意味着元素不存在，可能是配置问题，给予较低但非零分数
            Ok(0.1)
        }
    }
}
