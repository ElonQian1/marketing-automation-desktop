// src-tauri/src/commands/structural_matching.rs
// module: commands | layer: application | role: 结构匹配命令
// summary: 提供结构匹配的Tauri命令接口

use crate::domain::structural_matching::{
    StructuralMatchingConfig, StructuralMatchResult, StructuralScorer,
};
use serde_json::Value;
use tauri::command;

/// 评估元素是否与模板结构匹配
#[command]
pub async fn evaluate_structural_match(
    config: StructuralMatchingConfig,
    template_element: Value,
    target_element: Value,
) -> Result<StructuralMatchResult, String> {
    println!(
        "🏗️ [StructuralMatching] 开始评估，配置ID: {}",
        config.config_id
    );

    let result = StructuralScorer::evaluate(&config, &template_element, &target_element);

    println!(
        "✅ [StructuralMatching] 评估完成，得分: {:.2} / {:.2}, 通过: {}",
        result.total_score,
        result.max_score.unwrap_or(0.0),
        result.passed
    );

    Ok(result)
}

/// 批量评估多个元素
#[command]
pub async fn evaluate_structural_match_batch(
    config: StructuralMatchingConfig,
    template_element: Value,
    target_elements: Vec<Value>,
) -> Result<Vec<StructuralMatchResult>, String> {
    println!(
        "🏗️ [StructuralMatching] 批量评估，候选元素数: {}",
        target_elements.len()
    );

    let results: Vec<StructuralMatchResult> = target_elements
        .iter()
        .map(|target| StructuralScorer::evaluate(&config, &template_element, target))
        .collect();

    let passed_count = results.iter().filter(|r| r.passed).count();
    println!(
        "✅ [StructuralMatching] 批量评估完成，通过数: {} / {}",
        passed_count,
        results.len()
    );

    Ok(results)
}

/// 获取匹配的元素（得分超过阈值）
#[command]
pub async fn get_matched_elements(
    config: StructuralMatchingConfig,
    template_element: Value,
    target_elements: Vec<Value>,
) -> Result<Vec<Value>, String> {
    println!(
        "🔍 [StructuralMatching] 筛选匹配元素，候选数: {}",
        target_elements.len()
    );

    let matched_elements: Vec<Value> = target_elements
        .iter()
        .filter_map(|target| {
            let result = StructuralScorer::evaluate(&config, &template_element, target);
            if result.passed {
                Some(target.clone())
            } else {
                None
            }
        })
        .collect();

    println!(
        "✅ [StructuralMatching] 筛选完成，匹配数: {}",
        matched_elements.len()
    );

    Ok(matched_elements)
}
