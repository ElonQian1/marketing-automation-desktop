// src-tauri/src/exec/v3/helpers/step_executor.rs
// module: exec | layer: v3/helpers | role: 步骤执行器
// summary: 执行智能分析生成的步骤，包含元素匹配、失败恢复和真实设备操作

use super::super::types::{InlineStep, ValidationSettings};


/// 🔧 执行真实设备操作（包装函数）
/// 
/// 此函数是 execute_intelligent_analysis_step 的包装，用于保持向后兼容
pub async fn execute_step_real_operation(
    device_id: &str,
    step: &InlineStep,
    ui_xml: &str,
    _validation: &ValidationSettings,
) -> Result<(i32, i32), String> {
    execute_intelligent_analysis_step(device_id, step, ui_xml).await
}

/// 🧠 执行智能分析生成的步骤
/// 
/// 智能分析生成的步骤包含完整的执行策略，无需重新运行 legacy 匹配引擎
pub async fn execute_intelligent_analysis_step(
    device_id: &str,
    inline: &InlineStep,
    ui_xml: &str,
) -> Result<(i32, i32), String> {
    
    tracing::info!("🧠 [智能执行] 开始执行智能分析步骤: {}", inline.step_id);
    
    // 🔥 关键修复：从 STEP_STRATEGY_STORE 读取保存的配置并合并到参数
    use super::config_loader::load_and_merge_step_config;
    let merged_params = load_and_merge_step_config(&inline.step_id, &inline.params);
    
    // 🏗️ 尝试结构化匹配
    use super::sm_integration::try_structural_matching_flow;
    if let Some(coords) = try_structural_matching_flow(device_id, ui_xml, &merged_params).await? {
        return Ok(coords);
    }

    // 🔥 动作分发（无需元素匹配的动作）
    use super::action_dispatcher::try_dispatch_direct_action;
    if let Some(result) = try_dispatch_direct_action(device_id, &inline.step_id, &merged_params).await? {
        return Ok(result);
    }
    
    // 仅在非结构匹配流程下才需要 XPath 参数
    // 🔧 修复：避免在结构模式下提前因为缺少XPath而失败
    use super::legacy_matcher::try_legacy_matching_flow;
    let (x, y) = try_legacy_matching_flow(ui_xml, &merged_params, &inline.step_id)?;
    
    // 执行点击操作
    execute_click_action_at(device_id, x, y, &inline.step_id).await?;
    
    Ok((x, y))
}

/// 在指定坐标执行点击
async fn execute_click_action_at(
    device_id: &str,
    x: i32,
    y: i32,
    _step_id: &str,
) -> Result<(), String> {
    tracing::info!("👆 [智能执行] 点击坐标: ({}, {})", x, y);
    crate::automation::actions::tap::execute_tap(device_id, x, y).await
        .map_err(|e| format!("点击失败: {}", e))?;
    Ok(())
}







/// 执行按键操作
pub async fn execute_keyevent_action(
    device_id: &str,
    keycode: i32,
    step_id: &str,
) -> Result<(i32, i32), String> {
    tracing::info!("🧠 [智能执行] 准备发送按键: {}", keycode);
    
    match crate::automation::actions::input::execute_keyevent(
        device_id,
        keycode,
    ).await {
        Ok(_) => {
            tracing::info!("🧠 ✅ 智能分析步骤执行成功: {} -> 发送按键", step_id);
            Ok((0, 0)) // 按键操作不返回具体坐标
        }
        Err(e) => {
            tracing::error!("🧠 ❌ 智能分析步骤执行失败: {} -> {}", step_id, e);
            Err(format!("智能分析步骤执行失败: {}", e))
        }
    }
}

/// 执行滑动操作
pub async fn execute_swipe_action(
    device_id: &str,
    start_x: i32,
    start_y: i32,
    end_x: i32,
    end_y: i32,
    duration_ms: i32,
    step_id: &str,
) -> Result<(i32, i32), String> {
    tracing::info!("🧠 [智能执行] 准备滑动: ({},{}) -> ({},{})", start_x, start_y, end_x, end_y);
    
    match crate::automation::actions::swipe::execute_swipe(
        device_id,
        start_x,
        start_y,
        end_x,
        end_y,
        duration_ms as u32,
    ).await {
        Ok(_) => {
            tracing::info!("🧠 ✅ 智能分析步骤执行成功: {} -> 滑动", step_id);
            Ok((end_x, end_y))
        }
        Err(e) => {
            tracing::error!("🧠 ❌ 智能分析步骤执行失败: {} -> {}", step_id, e);
            Err(format!("智能分析步骤执行失败: {}", e))
        }
    }
}


