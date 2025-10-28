// src-tauri/src/exec/v3/helpers/intelligent_preprocessing.rs
// module: exec | layer: v3/helpers | role: 智能分析前置处理器
// summary: 处理提前智能分析检测、步骤质量评估和步骤合并优化

use super::super::types::{
    StepRefOrInline, QualitySettings, ConstraintSettings, ValidationSettings, ChainMode,
};
use super::super::events::emit_progress;
use super::super::types::Phase;
use super::analysis_helpers::{
    should_trigger_intelligent_analysis_early,
    should_trigger_intelligent_analysis,
    perform_intelligent_strategy_analysis_from_raw,
};
use super::device_manager;
use super::step_optimization::merge_and_optimize_steps;
use crate::exec::v3::types::SingleStepAction;
use tauri::AppHandle;

/// 提前智能分析检测：在Legacy引擎执行前检查参数
/// 
/// 如果发现步骤参数为空，跳过Legacy引擎预筛选，直接从原始XML开始Step 0-6
/// 
/// 返回：
/// - Some(Vec): 智能分析生成的新步骤列表（需要递归执行）
/// - None: 未触发提前分析，继续执行原逻辑
pub async fn check_and_trigger_early_analysis<'a>(
    app: &'a AppHandle,
    analysis_id: &'a str,
    device_id: &'a str,
    ordered_steps: &'a [StepRefOrInline],
) -> Result<Option<Vec<StepRefOrInline>>, String> {
    for (step_idx, step) in ordered_steps.iter().enumerate() {
        if let Some(inline) = &step.inline {
            match &inline.action {
                SingleStepAction::SmartSelection | SingleStepAction::Tap => {
                    if should_trigger_intelligent_analysis_early(&inline.params) {
                        tracing::info!("🧠 步骤 {} 检测到参数为空，提前触发智能分析，跳过Legacy预筛选", step_idx);
                        
                        // 获取原始UI XML
                        let ui_xml = device_manager::get_ui_snapshot(device_id).await?;
                        
                        // 发送智能分析开始事件  
                        emit_progress(
                            app,
                            Some(analysis_id.to_string()),
                            None,
                            Phase::DeviceReady,
                            None,
                            Some("🧠 直接启动智能分析 (Step 0-6) - 从原始数据开始".to_string()),
                            None,
                        )?;
                        
                        // 直接调用智能分析，从原始数据开始
                        match perform_intelligent_strategy_analysis_from_raw(
                            device_id, 
                            &inline.params, 
                            &ui_xml, 
                            app
                        ).await {
                            Ok(intelligent_steps) => {
                                tracing::info!("✅ 原始数据智能分析成功，生成 {} 个优化步骤", intelligent_steps.len());
                                return Ok(Some(intelligent_steps));
                            }
                            Err(e) => {
                                tracing::warn!("⚠️ 原始数据智能分析失败: {}", e);
                                // 继续检查其他步骤
                            }
                        }
                    }
                }
                _ => {}
            }
        }
    }
    
    Ok(None)
}

/// 智能分析步骤优化：根据步骤质量决定是否触发智能分析并合并步骤
/// 
/// 策略：
/// - 如果步骤质量不佳或缺少候选，触发智能分析生成优化步骤
/// - 如果有原始候选，合并智能分析结果并去重优化
/// - 如果步骤质量良好，跳过智能分析直接使用原有步骤
/// 
/// 返回：
/// - 优化后的步骤列表（可能是原步骤、智能步骤或合并步骤）
pub async fn optimize_steps_with_intelligent_analysis<'a>(
    app: &'a AppHandle,
    analysis_id: &'a str,
    device_id: &'a str,
    ordered_steps: &'a [StepRefOrInline],
    quality: &'a QualitySettings,
    threshold: f32,
) -> Result<Vec<StepRefOrInline>, String> {
    // 🔍 检查是否需要智能分析
    let need_intelligent_analysis = should_trigger_intelligent_analysis(ordered_steps, quality);
    
    if !need_intelligent_analysis {
        tracing::info!("🎯 跳过智能策略分析：候选步骤质量良好，直接使用原有步骤 ({}个)", ordered_steps.len());
        return Ok(ordered_steps.to_vec());
    }
    
    tracing::info!("🧠 触发智能策略分析：原候选数={}, threshold={:.2}", 
        ordered_steps.len(), threshold);
    
    // 发送智能分析开始事件
    emit_progress(
        app,
        Some(analysis_id.to_string()),
        None,
        Phase::DeviceReady,
        None,
        Some("启动智能策略分析 (Step 0-6) - 优化候选步骤".to_string()),
        None,
    )?;
    
    // 🔥 【核心修复】提取第一个步骤的 params（包含 original_data）
    let original_params = ordered_steps
        .first()
        .and_then(|step| step.inline.as_ref())
        .map(|inline| inline.params.clone())
        .unwrap_or(serde_json::Value::Null);
    
    // ✅ FIX: 优先使用步骤保存的 original_xml，避免重新dump导致页面变化
    let ui_xml = if let Some(original_data) = original_params.get("original_data") {
        if let Some(original_xml) = original_data.get("original_xml").and_then(|v| v.as_str()) {
            if !original_xml.is_empty() {
                tracing::info!("✅ [XML来源] 使用步骤保存的 original_xml ({} 字符)", original_xml.len());
                original_xml.to_string()
            } else {
                tracing::warn!("⚠️ [XML来源] original_xml为空，重新dump设备XML");
                device_manager::get_ui_snapshot(device_id).await?
            }
        } else {
            tracing::warn!("⚠️ [XML来源] original_xml字段不存在或类型错误，重新dump设备XML");
            device_manager::get_ui_snapshot(device_id).await?
        }
    } else {
        tracing::warn!("⚠️ [XML来源] 缺少original_data，重新dump设备XML");
        device_manager::get_ui_snapshot(device_id).await?
    };
    
    tracing::info!("🔍 [数据传递] 提取原始步骤参数传递给智能分析: {}", 
        if original_params.is_null() { "null (无原始数据)" } 
        else { "包含original_data" });
        
    // 调用智能策略分析进行执行优化
    match perform_intelligent_strategy_analysis_from_raw(device_id, &original_params, &ui_xml, app).await {
        Ok(intelligent_steps) => {
            if !intelligent_steps.is_empty() {
                tracing::info!("🧠 智能策略分析成功，生成 {} 个优化候选步骤", intelligent_steps.len());
                
                // 🎯 策略选择：智能分析结果 vs 原有步骤
                if ordered_steps.is_empty() {
                    // 如果没有原始候选，直接使用智能分析结果
                    tracing::info!("🔄 使用智能分析步骤（原无候选）");
                    Ok(intelligent_steps)
                } else {
                    // 如果有原始候选，合并两者并去重优化
                    tracing::info!("🔄 合并智能分析结果与原候选步骤");
                    Ok(merge_and_optimize_steps(ordered_steps, intelligent_steps))
                }
            } else {
                tracing::warn!("🧠 智能策略分析未生成候选步骤，保持原有步骤");
                Ok(ordered_steps.to_vec())
            }
        }
        Err(e) => {
            tracing::warn!("🧠 智能策略分析失败: {}", e);
            tracing::info!("   继续使用原有候选步骤，不影响正常执行");
            Ok(ordered_steps.to_vec())
        }
    }
}

/// 打印最终步骤列表详情（用于调试）
pub fn log_final_steps(final_ordered_steps: &[StepRefOrInline]) {
    tracing::info!("📋 V3最终执行候选列表 ({} 个步骤):", final_ordered_steps.len());
    for (idx, step) in final_ordered_steps.iter().enumerate() {
        if let Some(inline) = &step.inline {
            let target_text = inline.params.get("targetText")
                .or_else(|| inline.params.get("text"))
                .or_else(|| inline.params.get("contentDesc"))
                .or_else(|| inline.params.get("smartSelection").and_then(|ss| ss.get("targetText")))
                .and_then(|v| v.as_str())
                .unwrap_or("未知目标");
            
            let mode = inline.params.get("mode")
                .or_else(|| inline.params.get("smartSelection").and_then(|ss| ss.get("mode")))
                .and_then(|v| v.as_str())
                .unwrap_or("未指定");
            
            tracing::info!("  [{}/{}] {} -> action={:?}, target='{}', mode='{}'", 
                idx + 1, final_ordered_steps.len(), inline.step_id, inline.action, target_text, mode);
        } else if let Some(ref_id) = &step.r#ref {
            tracing::info!("  [{}/{}] 引用步骤: {}", idx + 1, final_ordered_steps.len(), ref_id);
        }
    }
}
