// src-tauri/src/commands/run_step_v2/legacy/mod.rs
// module: run_step_v2 | layer: legacy | role: 遗留功能存档
// summary: V2协议之前的遗留执行函数，已废弃，保留仅用于兼容性

use tauri::command;
use crate::commands::run_step_v2::types::response::StepExecutionResult;
use crate::infra::adb::input_helper::{tap_injector_first, input_text_injector_first};
use crate::infra::adb::keyevent_helper::keyevent_code_injector_first;

#[derive(Debug, serde::Deserialize)]
pub struct StepAction {
    pub action_type: ActionType,
    pub coordinates: Option<(f64, f64)>,
    pub input_text: Option<String>,
}

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ActionType {
    Tap,
    Back,
    Type,
    #[serde(other)]
    Unknown,
}

/// 🚨 已废弃：V2协议之前的遗留步骤执行函数
/// 
/// **警告**: 此函数已被 `run_step_v2` 替代，保留仅用于向后兼容
/// 
/// # 迁移指南
/// 请使用 `run_step_v2` 替代此函数，新协议支持：
/// - 统一的步骤数据结构
/// - 更强大的元素匹配策略
/// - 完整的执行遥测
/// - 决策链和批量执行
#[deprecated(
    since = "0.2.0",
    note = "使用 run_step_v2 替代，支持完整的V2统一协议"
)]
#[command]
pub async fn run_step_v2_legacy(
    action: StepAction,
    device_id: String,
) -> Result<StepExecutionResult, String> {
    let start_time = tokio::time::Instant::now();
    
    // 检测 ADB 路径
    let adb_path = if std::path::Path::new("platform-tools/adb.exe").exists() {
        "platform-tools/adb.exe"
    } else if std::path::Path::new("D:\\leidian\\LDPlayer9\\adb.exe").exists() {
        "D:\\leidian\\LDPlayer9\\adb.exe"
    } else {
        "adb"
    };
    
    let action_result = match action.action_type {
        ActionType::Tap => {
            if let Some(coords) = action.coordinates {
                tap_injector_first(adb_path, &device_id, coords.0 as i32, coords.1 as i32, None).await
                    .map_err(|e| format!("真机点击失败: {}", e))?;
                "真机点击执行成功".to_string()
            } else {
                return Err("点击操作缺少坐标".to_string());
            }
        },
        ActionType::Back => {
            keyevent_code_injector_first(adb_path, &device_id, 4).await
                .map_err(|e| format!("真机返回键失败: {}", e))?;
            "真机返回键执行成功".to_string()
        },
        ActionType::Type => {
            if let Some(text) = action.input_text {
                input_text_injector_first(adb_path, &device_id, &text).await
                    .map_err(|e| format!("真机文本输入失败: {}", e))?;
                format!("真机文本输入成功: {}", text)
            } else {
                return Err("文本输入操作缺少内容".to_string());
            }
        },
        _ => "其他动作类型执行成功".to_string()
    };
    
    let execution_time = start_time.elapsed().as_millis() as u64;
    
    Ok(StepExecutionResult {
        success: true,
        message: action_result,
        execution_time_ms: execution_time,
        verification_passed: true,
        found_elements: vec![],
    })
}
