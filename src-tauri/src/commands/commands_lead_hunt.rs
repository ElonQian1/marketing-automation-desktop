// src-tauri/src/commands/commands_lead_hunt.rs
// module: lead-hunt | layer: commands | role: 精准获客 Tauri 命令
// summary: 暴露给前端的精准获客相关命令

use tauri::AppHandle;
use std::sync::Arc;

use crate::services::lead_hunt::{RawComment, ReplayPlan, save_comments, list_comments, write_replay_plan, get_replay_plan};
use crate::device::{MockDumpProvider, ReplayOrchestrator};

#[tauri::command]
pub async fn lh_save_comments(app_handle: AppHandle, items: Vec<RawComment>) -> Result<(), String> {
    save_comments(&app_handle, items).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn lh_list_comments(app_handle: AppHandle) -> Result<Vec<RawComment>, String> {
    list_comments(&app_handle).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn lh_import_comments(app_handle: AppHandle) -> Result<(), String> {
    let mock = include_str!("../mock/social_comments.json");
    let items: Vec<RawComment> = serde_json::from_str(mock).map_err(|e| e.to_string())?;
    save_comments(&app_handle, items).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn lh_create_replay_plan(app_handle: AppHandle, plan: ReplayPlan) -> Result<(), String> {
    write_replay_plan(&app_handle, plan).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn lh_run_replay_plan(app_handle: AppHandle, plan_id: String) -> Result<(), String> {
    // 1. 读取计划
    let plan = get_replay_plan(&app_handle, &plan_id).map_err(|e| e.to_string())?;

    // 2. 创建 Mock 设备提供者
    let provider = Arc::new(MockDumpProvider::new(format!("mock_device_{}", plan_id)));

    // 3. 创建编排器
    let orchestrator = ReplayOrchestrator::new(provider, app_handle.clone());

    // 4. 启动后台任务执行
    tauri::async_runtime::spawn(async move {
        match orchestrator.execute_plan(plan).await {
            Ok(_) => println!("[lh_run_replay_plan] 执行成功"),
            Err(e) => eprintln!("[lh_run_replay_plan] 执行失败: {}", e),
        }
    });

    Ok(())
}
