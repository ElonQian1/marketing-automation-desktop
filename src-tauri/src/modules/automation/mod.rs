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

#[tauri::command]
async fn record_circuit_breaker_operation(_service: String, _operation: String, _success: bool) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
async fn update_circuit_breaker_state(_service: String, _state: String) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
async fn reset_circuit_breaker(_service: String) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
async fn get_circuit_breaker_status(_account_id: String, _task_type: String) -> Result<Value, String> {
    Ok(serde_json::json!({
        "state": "closed",
        "failure_count": 0,
        "success_count": 0,
        "failure_rate": 0.0,
        "state_history": []
    }))
}

#[tauri::command]
async fn get_failure_statistics(_account_id: String, _task_type: String, _time_window_minutes: i32) -> Result<Value, String> {
    Ok(serde_json::json!({
        "total_operations": 0,
        "failure_count": 0,
        "failure_rate": 0.0
    }))
}

#[tauri::command]
async fn execute_script_with_monitoring(_script: Value, _execution_id: String) -> Result<String, String> {
    Ok("stub_execution_id".to_string())
}

#[tauri::command]
async fn pause_script_execution(_execution_id: String) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
async fn resume_script_execution(_execution_id: String) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
async fn stop_script_execution(_execution_id: String) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
async fn click_detected_element(_device_id: String, _element: Value, _click_type: String) -> Result<(), String> {
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
            stop_loop_test,
            record_circuit_breaker_operation,
            update_circuit_breaker_state,
            reset_circuit_breaker,
            get_circuit_breaker_status,
            get_failure_statistics,
            execute_script_with_monitoring,
            pause_script_execution,
            resume_script_execution,
            stop_script_execution,
            click_detected_element
        ])
        .build()
}
