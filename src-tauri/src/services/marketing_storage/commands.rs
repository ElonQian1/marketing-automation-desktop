use tauri::AppHandle;
use serde::{Deserialize, Serialize};
use super::models::{WatchTargetPayload, WatchTargetRow, ListWatchTargetsQuery};
use super::repositories as repo;

#[tauri::command]
pub fn bulk_upsert_watch_targets(app_handle: tauri::AppHandle, payloads: Vec<WatchTargetPayload>) -> Result<usize, String> {
    let conn = repo::get_connection(&app_handle).map_err(|e| e.to_string())?;
    repo::bulk_upsert_watch_targets(&conn, &payloads).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_watch_target_by_dedup_key(app_handle: tauri::AppHandle, dedup_key: String) -> Result<Option<WatchTargetRow>, String> {
    let conn = repo::get_connection(&app_handle).map_err(|e| e.to_string())?;
    repo::get_watch_target_by_dedup_key(&conn, &dedup_key).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_watch_targets(
    app_handle: tauri::AppHandle,
    limit: Option<i64>,
    offset: Option<i64>,
    platform: Option<String>,
    target_type: Option<String>,
) -> Result<Vec<WatchTargetRow>, String> {
    let conn = repo::get_connection(&app_handle).map_err(|e| e.to_string())?;
    let q = ListWatchTargetsQuery { limit, offset, platform, target_type };
    repo::list_watch_targets(&conn, &q).map_err(|e| e.to_string())
}
