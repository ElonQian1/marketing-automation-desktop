// src-tauri/src/commands/run_step_v2/execution/action_executor.rs
// module: step-execution | layer: execution | role: 动作执行器
// summary: 执行V2操作（点击、滑动、输入等）使用匹配到的坐标

use super::super::{MatchCandidate, ExecInfo};
// use crate::infra::adb::input_helper::{tap_injector_first, input_text_injector_first, swipe_injector_first};
// use crate::infra::adb::keyevent_helper::keyevent_code_injector_first;
use crate::automation::actions::{tap, swipe, input};

/// 执行V2操作（使用匹配到的坐标）
pub async fn execute_v2_action_with_coords(
    step: &serde_json::Value, 
    device_id: &str, 
    match_candidate: &MatchCandidate
) -> Result<ExecInfo, String> {
    let start_time = std::time::Instant::now();
    
    // 检测 ADB 路径 (Legacy check, kept for compatibility but actions use global get_adb_path)
    let _adb_path = detect_adb_path();
    
    // 解析前端 StepPayload 结构中的操作信息
    let action_type = step.get("action")
        .and_then(|v| v.as_str())
        .unwrap_or("tap");
    
    let action_result = match action_type {
        "tap" => {
            execute_tap_action(step, device_id, match_candidate, action_type).await?
        },
        "doubleTap" => {
             // Explicitly handle double tap
             execute_double_tap_action(step, device_id, match_candidate).await?
        },
        "longPress" | "long_press" => {
            execute_long_press_action(step, device_id, match_candidate).await?
        },
        "keyevent" => {
            execute_keyevent_action(step, device_id).await?
        },
        "input" => {
            execute_input_action(step, device_id).await?
        },
        "back" => {
            input::execute_keyevent(device_id, 4).await
                .map_err(|e| format!("真机返回键失败: {}", e))?;
            "真机返回键执行成功".to_string()
        },
        "type" => {
            execute_type_action(step, device_id).await?
        },
        "wait" => {
            execute_wait_action(step).await?
        },
        "swipe" => {
            execute_swipe_action(step, device_id).await?
        },
        _ => format!("执行了 {} 操作", action_type)
    };
    
    let execution_time = start_time.elapsed().as_millis() as u64;
    tracing::info!("executed: action={} time={}ms", action_type, execution_time);
    
    Ok(ExecInfo {
        ok: true,
        action: action_result,
        execution_time_ms: execution_time,
    })
}

/// 检测 ADB 路径
fn detect_adb_path() -> &'static str {
    if std::path::Path::new("platform-tools/adb.exe").exists() {
        "platform-tools/adb.exe"
    } else if std::path::Path::new("D:\\leidian\\LDPlayer9\\adb.exe").exists() {
        "D:\\leidian\\LDPlayer9\\adb.exe"
    } else {
        "adb"
    }
}

/// 执行点击类动作（tap）
async fn execute_tap_action(
    step: &serde_json::Value,
    device_id: &str,
    match_candidate: &MatchCandidate,
    action_type: &str
) -> Result<String, String> {
    // 优先使用匹配元素的坐标，如果匹配失败则使用步骤中的坐标
    let (x, y) = calculate_coords(step, match_candidate);
    
    tracing::info!("🎯 执行坐标: ({}, {}) (来源: {})", x, y, 
                  if match_candidate.confidence > 0.0 { "匹配元素" } else { "步骤参数" });
    
    tap::execute_tap(device_id, x, y).await
        .map_err(|e| format!("真机{}失败: {}", action_type, e))?;
    Ok(format!("真机{}执行成功 ({}, {})", action_type, x, y))
}

/// 执行双击动作
async fn execute_double_tap_action(
    step: &serde_json::Value,
    device_id: &str,
    match_candidate: &MatchCandidate,
) -> Result<String, String> {
    let (x, y) = calculate_coords(step, match_candidate);
    
    tracing::info!("🎯 执行双击: ({}, {})", x, y);
    
    tap::execute_double_tap(device_id, x, y).await
        .map_err(|e| format!("真机双击失败: {}", e))?;
    Ok(format!("真机双击执行成功 ({}, {})", x, y))
}

/// 辅助函数：计算坐标
fn calculate_coords(step: &serde_json::Value, match_candidate: &MatchCandidate) -> (i32, i32) {
    if match_candidate.confidence > 0.0 {
        // 使用匹配到的元素中心点
        let bounds = &match_candidate.bounds;
        let calc_x = (bounds.left + bounds.right) / 2;
        let calc_y = (bounds.top + bounds.bottom) / 2;
        tracing::info!("🐛 V2坐标计算: bounds=({},{},{},{}) -> center=({},{})", 
                     bounds.left, bounds.top, bounds.right, bounds.bottom, calc_x, calc_y);
        (calc_x, calc_y)
    } else if let Some(bounds) = step.get("bounds") {
        let left = bounds.get("left").and_then(|v| v.as_f64()).unwrap_or(100.0) as i32;
        let top = bounds.get("top").and_then(|v| v.as_f64()).unwrap_or(100.0) as i32;
        let right = bounds.get("right").and_then(|v| v.as_f64()).unwrap_or(200.0) as i32;
        let bottom = bounds.get("bottom").and_then(|v| v.as_f64()).unwrap_or(200.0) as i32;
        ((left + right) / 2, (top + bottom) / 2) // 计算中心点
    } else if let Some(offset) = step.get("offset") {
        let x = offset.get("x").and_then(|v| v.as_f64()).unwrap_or(100.0) as i32;
        let y = offset.get("y").and_then(|v| v.as_f64()).unwrap_or(100.0) as i32;
        (x, y)
    } else {
        (100, 100) // 默认坐标
    }
}

/// 执行系统按键动作
async fn execute_keyevent_action(
    step: &serde_json::Value,
    device_id: &str
) -> Result<String, String> {
    let key_code = step.get("key_code")
        .or_else(|| step.get("keyCode"))
        .and_then(|v| v.as_i64())
        .unwrap_or(4) as i32; // 默认返回键
    
    tracing::info!("🎯 执行系统按键: keycode={}", key_code);
    
    input::execute_keyevent(device_id, key_code).await
        .map_err(|e| format!("真机按键失败: {}", e))?;
    Ok(format!("真机按键执行成功 (keycode={})", key_code))
}

/// 执行文本输入动作
async fn execute_input_action(
    step: &serde_json::Value,
    device_id: &str
) -> Result<String, String> {
    if let Some(text) = step.get("text")
        .or_else(|| step.get("input_text"))
        .and_then(|v| v.as_str()) {
        tracing::info!("🎯 执行文本输入: text={}", text);
        
        input::execute_input(device_id, text).await
            .map_err(|e| format!("真机文本输入失败: {}", e))?;
        Ok(format!("真机文本输入成功: {}", text))
    } else {
        Err("文本输入操作缺少内容".to_string())
    }
}

/// 执行长按动作
async fn execute_long_press_action(
    step: &serde_json::Value,
    device_id: &str,
    match_candidate: &MatchCandidate
) -> Result<String, String> {
    let (x, y) = calculate_coords(step, match_candidate);
    
    let duration = step.get("duration")
        .and_then(|v| v.as_u64())
        .unwrap_or(2000) as u32;
    
    tracing::info!("🎯 执行长按: ({}, {}) 时长:{}ms", x, y, duration);
    
    tap::execute_long_press(device_id, x, y, duration).await
        .map_err(|e| format!("真机长按失败: {}", e))?;
    Ok(format!("真机长按执行成功 ({}, {}) {}ms", x, y, duration))
}

/// 执行文本输入动作（type）
async fn execute_type_action(
    step: &serde_json::Value,
    device_id: &str
) -> Result<String, String> {
    if let Some(text) = step.get("text").and_then(|v| v.as_str()) {
        input::execute_input(device_id, text).await
            .map_err(|e| format!("真机文本输入失败: {}", e))?;
        Ok(format!("真机文本输入成功: {}", text))
    } else {
        Err("文本输入操作缺少内容".to_string())
    }
}

/// 执行等待动作
async fn execute_wait_action(step: &serde_json::Value) -> Result<String, String> {
    let duration_ms = step.get("duration_ms")
        .and_then(|v| v.as_u64())
        .unwrap_or(1000);
    tokio::time::sleep(tokio::time::Duration::from_millis(duration_ms)).await;
    Ok(format!("等待{}ms完成", duration_ms))
}

/// 执行滑动动作
async fn execute_swipe_action(
    step: &serde_json::Value,
    device_id: &str
) -> Result<String, String> {
    let start_x = step.get("start_x").and_then(|v| v.as_i64()).unwrap_or(540) as i32;
    let start_y = step.get("start_y").and_then(|v| v.as_i64()).unwrap_or(1200) as i32;
    let end_x = step.get("end_x").and_then(|v| v.as_i64()).unwrap_or(540) as i32;
    let end_y = step.get("end_y").and_then(|v| v.as_i64()).unwrap_or(600) as i32;
    let duration = step.get("duration").and_then(|v| v.as_u64()).unwrap_or(300) as u32;
    
    tracing::info!("🎯 执行坐标滑动: ({},{}) → ({},{}) 时长:{}ms", start_x, start_y, end_x, end_y, duration);
    
    swipe::execute_swipe(device_id, start_x, start_y, end_x, end_y, duration).await
        .map_err(|e| format!("真机滑动失败: {}", e))?;
    Ok(format!("真机滑动执行成功: ({},{})→({},{})", start_x, start_y, end_x, end_y))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_adb_path() {
        let path = detect_adb_path();
        assert!(path.contains("adb"));
    }
}
