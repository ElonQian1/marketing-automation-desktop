// src-tauri/src/automation/pipeline/dispatcher.rs
// module: automation | layer: pipeline | role: 动作分发器
// summary: 处理无需元素匹配的直接动作（wait, keyevent, back, coordinate-swipe）

use serde_json::Value;
use crate::automation::actions::{input, swipe};

/// 尝试执行非元素交互动作
/// 
/// 如果动作类型是 wait, keyevent, back 或 纯坐标swipe，则直接执行并返回结果。
/// 返回：
/// - Ok(Some(result)): 动作已执行，返回结果 (x, y)
/// - Ok(None): 动作需要元素交互，请继续后续流程
/// - Err(e): 执行出错
pub async fn try_dispatch_direct_action(
    device_id: &str,
    _step_id: &str,
    params: &Value,
) -> Result<Option<(i32, i32)>, String> {
    let action_type = params.get("action").and_then(|v| v.as_str()).unwrap_or("tap");
    
    if action_type == "wait" {
        let duration = params.get("wait_ms").and_then(|v| v.as_u64()).unwrap_or(1000);
        tracing::info!("⏳ [智能执行] 执行等待: {}ms", duration);
        tokio::time::sleep(tokio::time::Duration::from_millis(duration)).await;
        return Ok(Some((0, 0)));
    }

    if action_type == "keyevent" {
        let keycode = params.get("keycode").and_then(|v| v.as_i64()).unwrap_or(0) as i32;
        input::execute_keyevent(device_id, keycode).await
            .map_err(|e| e.to_string())?;
        return Ok(Some((0, 0)));
    }

    if action_type == "back" {
        input::execute_keyevent(device_id, 4).await
            .map_err(|e| e.to_string())?;
        return Ok(Some((0, 0)));
    }
    
    if action_type == "swipe" {
        // 如果提供了明确的坐标，直接执行滑动，无需匹配元素
        if let (Some(sx), Some(sy), Some(ex), Some(ey)) = (
            params.get("start_x").and_then(|v| v.as_i64()),
            params.get("start_y").and_then(|v| v.as_i64()),
            params.get("end_x").and_then(|v| v.as_i64()),
            params.get("end_y").and_then(|v| v.as_i64())
        ) {
             let duration = params.get("duration").and_then(|v| v.as_u64()).unwrap_or(1000) as u32;
             swipe::execute_swipe(device_id, sx as i32, sy as i32, ex as i32, ey as i32, duration).await
                .map_err(|e| e.to_string())?;
             return Ok(Some((ex as i32, ey as i32)));
        }
        // 如果没有坐标，继续执行以尝试匹配元素（在元素上滑动）
    }
    
    Ok(None)
}
