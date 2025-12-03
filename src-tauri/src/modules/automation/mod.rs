use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};
use serde_json::Value;
use crate::services::duplication_guard::{
    check_duplication_action_cmd, record_duplication_action_cmd,
    DuplicationCheckRequest, DuplicationCheckResult, ActionRecord
};

#[tauri::command]
fn check_duplication(req: DuplicationCheckRequest) -> DuplicationCheckResult {
    check_duplication_action_cmd(req)
}

#[tauri::command]
fn record_action(record: ActionRecord) {
    record_duplication_action_cmd(record)
}

#[tauri::command]
async fn execute_script(
    _device_id: String,
    _steps: Vec<Value>,
) -> Result<Value, String> {
    // TODO: Implement actual execution logic or delegate to script manager
    Ok(serde_json::json!({"status": "success", "message": "Stub execution"}))
}

#[tauri::command]
async fn abort_script_execution(
    _execution_id: String,
    _reason: String,
    _force: bool,
) -> Result<Value, String> {
    Ok(serde_json::json!({}))
}

#[tauri::command]
async fn cancel_current_operation() -> Result<(), String> {
    Ok(())
}

#[tauri::command]
async fn force_stop_all_adb_operations() -> Result<(), String> {
    Ok(())
}

#[tauri::command]
async fn stop_loop_test(_loop_id: String) -> Result<(), String> {
    Ok(())
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::<R>::new("automation")
        .invoke_handler(tauri::generate_handler![
            check_duplication,
            record_action,
            execute_script,
            abort_script_execution,
            cancel_current_operation,
            force_stop_all_adb_operations,
            stop_loop_test
        ])
        .build()
}
