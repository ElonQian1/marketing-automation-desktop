use std::collections::HashMap;

use anyhow::Result;
use tracing::{info, warn};

use crate::services::adb::get_device_session;
use crate::services::execution::matching::find_element_in_ui;
use crate::services::smart_script_executor::SmartScriptExecutor;
use serde_json;

pub async fn handle_tap(
    executor: &SmartScriptExecutor,
    step: &crate::services::execution::model::SmartScriptStep,
    logs: &mut Vec<String>,
) -> Result<String> {
    logs.push("👆 通过ADB Shell会话执行点击测试（带错误处理）".to_string());

    let params: HashMap<String, serde_json::Value> =
        serde_json::from_value(step.parameters.clone())?;

    // 检查是否有坐标参数
    let has_coords = params.get("x").and_then(|v| v.as_i64()).filter(|&x| x != 0).is_some()
        || params.get("y").and_then(|v| v.as_i64()).filter(|&y| y != 0).is_some();
    
    // 检查是否有文本匹配参数
    let text_match = params.get("text").and_then(|v| v.as_str());
    
    // 优先使用文本匹配（当没有有效坐标时）
    if !has_coords && text_match.is_some() {
        let text = text_match.unwrap();
        logs.push(format!("🔍 使用文本匹配模式: '{}'", text));
        info!("🔍 handle_tap: 使用文本匹配模式查找元素 '{}'", text);
        
        // 先获取 UI dump
        let ui_dump = executor.execute_ui_dump_with_retry(logs).await?;
        logs.push(format!("📋 UI dump 获取成功: {} 字符", ui_dump.len()));
        
        // 查找元素
        match find_element_in_ui(&ui_dump, text, logs).await? {
            Some((x, y)) => {
                logs.push(format!("✅ 找到元素 '{}' 的坐标: ({}, {})", text, x, y));
                info!("✅ 找到元素 '{}' 的坐标: ({}, {})", text, x, y);
                
                match executor.execute_click_with_retry(x, y, logs).await {
                    Ok(output) => {
                        logs.push(format!("📤 命令输出: {}", output.trim()));
                        Ok(format!("点击 '{}' 成功", text))
                    }
                    Err(e) => Err(e),
                }
            }
            None => {
                let error_msg = format!("❌ 未找到文本为 '{}' 的元素", text);
                logs.push(error_msg.clone());
                warn!("{}", error_msg);
                Err(anyhow::anyhow!(error_msg))
            }
        }
    } else {
        // 使用坐标模式
        let x = params.get("x").and_then(|v| v.as_i64()).unwrap_or(0) as i32;
        let y = params.get("y").and_then(|v| v.as_i64()).unwrap_or(0) as i32;

        logs.push(format!(
            "📍 点击坐标: ({}, {}) (从 parameters: x={}/y={})",
            x,
            y,
            params.get("x").map(|v| v.as_i64().unwrap_or(0)).unwrap_or(0),
            params.get("y").map(|v| v.as_i64().unwrap_or(0)).unwrap_or(0)
        ));

        match executor.execute_click_with_retry(x, y, logs).await {
            Ok(output) => {
                logs.push(format!("📤 命令输出: {}", output.trim()));
                Ok("点击成功".to_string())
            }
            Err(e) => Err(e),
        }
    }
}

pub async fn handle_wait(
    step: &crate::services::execution::model::SmartScriptStep,
    logs: &mut Vec<String>,
) -> Result<String> {
    let params: HashMap<String, serde_json::Value> =
        serde_json::from_value(step.parameters.clone()).unwrap_or_default();
    
    // 支持 duration_ms 或 wait_ms 参数
    let duration_ms = params.get("duration_ms")
        .or_else(|| params.get("wait_ms"))
        .and_then(|v| v.as_u64())
        .unwrap_or(500);
    
    logs.push(format!("⏳ 执行等待: {}ms", duration_ms));
    info!("⏳ handle_wait: 等待 {}ms", duration_ms);
    
    tokio::time::sleep(tokio::time::Duration::from_millis(duration_ms)).await;
    
    logs.push(format!("✅ 等待 {}ms 完成", duration_ms));
    Ok(format!("等待 {}ms 完成", duration_ms))
}

pub async fn handle_input(
    executor: &SmartScriptExecutor,
    step: &crate::services::execution::model::SmartScriptStep,
    logs: &mut Vec<String>,
) -> Result<String> {
    logs.push("通过ADB Shell会话执行输入测试".to_string());

    let params: HashMap<String, serde_json::Value> =
        serde_json::from_value(step.parameters.clone())?;

    let text = params["text"].as_str().unwrap_or("");
    logs.push(format!("输入文本: {}", text));

    let session = get_device_session(executor.device_id()).await?;
    session.input_text(text).await?;
    let output = "OK".to_string();

    logs.push(format!("命令输出: {}", output));
    Ok("输入成功".to_string())
}

pub async fn handle_swipe(
    executor: &SmartScriptExecutor,
    step: &crate::services::execution::model::SmartScriptStep,
    logs: &mut Vec<String>,
) -> Result<String> {
    logs.push("🔄 滑动操作（增强执行器）".to_string());
    match executor.execute_basic_swipe(step).await {
        Ok((_found_elements, _data)) => {
            logs.push("✅ 滑动执行完成".to_string());
            Ok("滑动成功".to_string())
        }
        Err(e) => {
            let msg = format!("❌ 滑动执行失败: {}", e);
            logs.push(msg.clone());
            Err(e)
        }
    }
}
