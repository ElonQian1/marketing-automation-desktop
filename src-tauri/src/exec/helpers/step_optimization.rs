// src-tauri/src/exec/v3/helpers/step_optimization.rs
// module: exec/v3 | layer: helpers | role: 步骤优化与合并
// summary: 提供步骤合并、去重、目标文本提取等优化功能

use super::super::types::StepRefOrInline;

/// 合并并优化原始步骤与智能分析步骤
/// 
/// 策略：
/// 1. 智能分析步骤优先（通常质量更高）
/// 2. 去重相似功能的步骤
/// 3. 限制总数量，避免执行时间过长
pub fn merge_and_optimize_steps(
    original_steps: &[StepRefOrInline],
    intelligent_steps: Vec<StepRefOrInline>
) -> Vec<StepRefOrInline> {
    let mut merged_steps = Vec::new();
    
    // 🎯 策略1: 优先添加智能分析生成的步骤（通常质量更高）
    tracing::info!("🔄 优先合并 {} 个智能分析步骤", intelligent_steps.len());
    for step in intelligent_steps {
        merged_steps.push(step);
    }
    
    // 🎯 策略2: 添加原始步骤，但避免功能重复
    tracing::info!("🔄 合并 {} 个原始步骤（去重处理）", original_steps.len());
    for original_step in original_steps {
        let is_duplicate = check_if_step_duplicate(&merged_steps, original_step);
        if !is_duplicate {
            merged_steps.push(original_step.clone());
        } else {
            if let Some(step_id) = get_step_id(original_step) {
                tracing::debug!("🔄 跳过重复步骤: {}", step_id);
            }
        }
    }
    
    // 🎯 策略3: 限制总步骤数量，避免执行时间过长
    const MAX_MERGED_STEPS: usize = 8;
    if merged_steps.len() > MAX_MERGED_STEPS {
        tracing::info!("🔄 限制步骤数量从 {} 到 {}", merged_steps.len(), MAX_MERGED_STEPS);
        merged_steps.truncate(MAX_MERGED_STEPS);
    }
    
    tracing::info!("✅ 步骤合并完成：智能分析 + 原始步骤 = {} 个优化候选", merged_steps.len());
    merged_steps
}

/// 检查步骤是否与已有步骤功能重复
pub fn check_if_step_duplicate(existing_steps: &[StepRefOrInline], new_step: &StepRefOrInline) -> bool {
    let new_step_target = extract_step_target_text(new_step);
    if new_step_target.is_none() {
        return false; // 无法提取目标文本的步骤不认为重复
    }
    
    let new_target = new_step_target.unwrap();
    
    // 检查是否有相同目标文本的步骤
    for existing_step in existing_steps {
        if let Some(existing_target) = extract_step_target_text(existing_step) {
            // 简单的文本相似性检查
            if new_target == existing_target || 
               new_target.contains(&existing_target) || 
               existing_target.contains(&new_target) {
                return true;
            }
        }
    }
    
    false
}

/// 提取步骤的目标文本用于重复检查
pub fn extract_step_target_text(step: &StepRefOrInline) -> Option<String> {
    if let Some(inline) = &step.inline {
        // 尝试从多个可能的参数字段提取目标文本
        let target_text = inline.params.get("targetText")
            .and_then(|v| v.as_str())
            .or_else(|| inline.params.get("text").and_then(|v| v.as_str()))
            .or_else(|| inline.params.get("contentDesc").and_then(|v| v.as_str()))
            .or_else(|| {
                inline.params.get("smartSelection")
                    .and_then(|ss| ss.get("targetText"))
                    .and_then(|v| v.as_str())
            });
        
        target_text.map(|s| s.to_string())
    } else {
        None
    }
}

/// 获取步骤ID用于日志
pub fn get_step_id(step: &StepRefOrInline) -> Option<String> {
    if let Some(inline) = &step.inline {
        Some(inline.step_id.clone())
    } else if let Some(ref_id) = &step.r#ref {
        Some(ref_id.clone())
    } else {
        None
    }
}
