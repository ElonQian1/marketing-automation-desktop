use tauri::{plugin::{Builder, TauriPlugin}, Wry, AppHandle};
use serde_json::Value;
use crate::automation::types::{ContextEnvelope, SingleStepSpecV3, ChainSpecV3, StaticSpecV3, TaskV3};
use crate::commands::automation_commands::{
    execute_single_step_test_v3 as execute_single_step_test_v3_impl,
    execute_chain_test_v3 as execute_chain_test_v3_impl,
    execute_static_strategy_test_v3 as execute_static_strategy_test_v3_impl,
    execute_task_v3 as execute_task_v3_impl
};

#[tauri::command]
async fn execute_single_step_test_v3(
    app: AppHandle,
    envelope: ContextEnvelope,
    step: SingleStepSpecV3,
) -> Result<Value, String> {
    execute_single_step_test_v3_impl(app, envelope, step).await
}

#[tauri::command]
async fn execute_chain_test_v3(
    app: AppHandle,
    envelope: ContextEnvelope,
    spec: Value,
) -> Result<Value, String> {
    execute_chain_test_v3_impl(app, envelope, spec).await
}

#[tauri::command]
async fn execute_static_strategy_test_v3(
    app: AppHandle,
    envelope: ContextEnvelope,
    spec: StaticSpecV3,
) -> Result<Value, String> {
    execute_static_strategy_test_v3_impl(app, envelope, spec).await
}

#[tauri::command]
async fn execute_task_v3(
    app: AppHandle,
    envelope: ContextEnvelope,
    task: TaskV3,
) -> Result<Value, String> {
    execute_task_v3_impl(app, envelope, task).await
}

pub fn init() -> TauriPlugin<Wry> {
    Builder::new("execution_v3")
        .invoke_handler(tauri::generate_handler![
            execute_single_step_test_v3,
            execute_chain_test_v3,
            execute_static_strategy_test_v3,
            execute_task_v3
        ])
        .build()
}
