// src-tauri/src/automation/engine.rs
// module: automation | layer: core | role: 自动化执行引擎
// summary: 统一的步骤执行入口，协调配置加载、匹配策略和动作执行

use anyhow::Result;
use crate::automation::types::InlineStep;

/// 执行智能分析生成的步骤
/// 
/// 流程：
/// 1. 加载并合并配置 (Config Loading)
/// 2. 尝试结构化匹配 (Structural Matching)
/// 3. 尝试直接动作分发 (Direct Action Dispatch)
/// 4. 尝试传统匹配 (Legacy Matching)
/// 5. 执行默认点击动作 (Default Action)
pub async fn execute_step(
    device_id: &str,
    inline: &InlineStep,
    ui_xml: &str,
) -> Result<(i32, i32), String> {
    
    tracing::info!("🧠 [Automation] 开始执行步骤: {}", inline.step_id);
    
    // 1. 加载并合并配置
    use crate::automation::pipeline::config::load_and_merge_step_config;
    let merged_params = load_and_merge_step_config(&inline.step_id, &inline.params);
    
    // 2. 尝试结构化匹配
    use crate::automation::matching::structural::try_structural_matching_flow;
    if let Some(coords) = try_structural_matching_flow(device_id, ui_xml, &merged_params).await? {
        return Ok(coords);
    }

    // 3. 动作分发（无需元素匹配的动作）
    use crate::automation::pipeline::dispatcher::try_dispatch_direct_action;
    if let Some(result) = try_dispatch_direct_action(device_id, &inline.step_id, &merged_params).await? {
        return Ok(result);
    }
    
    // 4. 传统匹配 (XPath/Text)
    // 检查批量模式
    let batch_mode = merged_params.get("selection_mode").and_then(|v| v.as_str());
    
    let (x, y) = if batch_mode == Some("all") {
        use crate::automation::matching::legacy::try_batch_matching_flow;
        try_batch_matching_flow(device_id, ui_xml, &merged_params, &inline.step_id).await?
    } else {
        use crate::automation::matching::legacy::try_legacy_matching_flow;
        try_legacy_matching_flow(ui_xml, &merged_params, &inline.step_id)?
    };
    
    // 5. 执行动作 (Click, Input, LongPress, etc.)
    // 注意：try_batch_matching_flow 已经执行了动作，返回 (0,0)
    // try_legacy_matching_flow 返回坐标，尚未执行动作
    
    if batch_mode != Some("all") {
        execute_matched_action(device_id, x, y, &merged_params).await?;
    }
    
    Ok((x, y))
}

/// 执行匹配后的动作
async fn execute_matched_action(
    device_id: &str,
    x: i32,
    y: i32,
    params: &serde_json::Value,
) -> Result<(), String> {
    let action_type = params.get("action").and_then(|v| v.as_str()).unwrap_or("tap");
    tracing::info!("⚡ [Automation] 执行动作: {} @ ({}, {})", action_type, x, y);

    match action_type {
        "tap" => {
            crate::automation::actions::tap::execute_tap(device_id, x, y).await
                .map_err(|e| e.to_string())?;
        },
        "doubleTap" => {
            crate::automation::actions::tap::execute_double_tap(device_id, x, y).await
                .map_err(|e| e.to_string())?;
        },
        "longPress" | "long_press" => {
            let duration = params.get("duration").and_then(|v| v.as_u64()).unwrap_or(1000) as u32;
            crate::automation::actions::tap::execute_long_press(device_id, x, y, duration).await
                .map_err(|e| e.to_string())?;
        },
        "input" => {
            // 先点击聚焦
            crate::automation::actions::tap::execute_tap(device_id, x, y).await
                .map_err(|e| format!("输入前点击失败: {}", e))?;
            
            // 再输入文本
            let text = params.get("input").and_then(|v| v.as_str()).unwrap_or("");
            crate::automation::actions::input::execute_input(device_id, text).await
                .map_err(|e| e.to_string())?;
        },
        _ => {
            // 默认点击
            crate::automation::actions::tap::execute_tap(device_id, x, y).await
                .map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

