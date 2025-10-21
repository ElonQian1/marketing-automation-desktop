// src-tauri/src/commands/commands_lead_hunt.rs
// module: lead-hunt | layer: commands | role: 精准获客 Tauri 命令
// summary: 暴露给前端的精准获客相关命令

use tauri::AppHandle;

use crate::services::lead_hunt::{RawComment, ReplayPlan, save_comments, list_comments, write_replay_plan};

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
