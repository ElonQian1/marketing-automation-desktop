use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime, Manager, State, AppHandle
};
use std::sync::Arc;
use parking_lot::Mutex;
use std::path::PathBuf;
use anyhow::Result;
use serde_json::Value;

use crate::services::prospecting::{
    ProspectingService,
    Comment, RawComment, CommentFilter, AnalysisResult, ReplyPlan, Statistics,
};

pub struct ProspectingState {
    service: Arc<Mutex<Option<ProspectingService>>>,
}

impl ProspectingState {
    pub fn new() -> Self {
        Self {
            service: Arc::new(Mutex::new(None)),
        }
    }
    
    pub fn init_service(&self, data_dir: PathBuf) -> Result<()> {
        let service = ProspectingService::new(data_dir)?;
        let mut guard = self.service.lock();
        *guard = Some(service);
        Ok(())
    }
    
    pub fn with_service<F, R>(&self, f: F) -> Result<R>
    where
        F: FnOnce(&ProspectingService) -> Result<R>,
    {
        let guard = self.service.lock();
        match guard.as_ref() {
            Some(service) => f(service),
            None => Err(anyhow::anyhow!("Prospecting service not initialized")),
        }
    }
}

#[tauri::command]
async fn init_storage<R: Runtime>(
    app: AppHandle<R>,
    state: State<'_, ProspectingState>,
) -> Result<(), String> {
    let data_dir = app.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    state.init_service(data_dir)
        .map_err(|e| format!("Failed to initialize service: {}", e))
}

#[tauri::command]
async fn save_comment(
    state: State<'_, ProspectingState>,
    comment: RawComment,
) -> Result<(), String> {
    state.with_service(|service| {
        service.save_comment(&comment)
    }).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn get_comments(
    state: State<'_, ProspectingState>,
    filter: CommentFilter,
) -> Result<Vec<Comment>, String> {
    state.with_service(|service| {
        service.get_comments(&filter)
    }).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_comments_by_ids(
    state: State<'_, ProspectingState>,
    ids: Vec<String>,
) -> Result<Vec<Comment>, String> {
    state.with_service(|service| {
        service.get_comments_by_ids(&ids)
    }).map_err(|e| e.to_string())
}

#[tauri::command]
async fn save_analysis(
    state: State<'_, ProspectingState>,
    analysis: AnalysisResult,
) -> Result<(), String> {
    state.with_service(|service| {
        service.save_analysis(&analysis)
    }).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn save_reply_plan(
    state: State<'_, ProspectingState>,
    plan: ReplyPlan,
) -> Result<(), String> {
    state.with_service(|service| {
        service.save_reply_plan(&plan)
    }).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn get_reply_plans(
    state: State<'_, ProspectingState>,
    comment_ids: Vec<String>,
) -> Result<Vec<ReplyPlan>, String> {
    state.with_service(|service| {
        service.get_reply_plans(&comment_ids)
    }).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_reply_plans_by_ids(
    state: State<'_, ProspectingState>,
    ids: Vec<String>,
) -> Result<Vec<ReplyPlan>, String> {
    state.with_service(|service| {
        service.get_reply_plans_by_ids(&ids)
    }).map_err(|e| e.to_string())
}

#[tauri::command]
async fn execute_real_reply_plan(
    _state: State<'_, ProspectingState>,
    plan_id: String,
) -> Result<bool, String> {
    Ok(true)
}

#[tauri::command]
async fn get_statistics(
    state: State<'_, ProspectingState>,
) -> Result<Statistics, String> {
    state.with_service(|service| {
        service.get_statistics()
    }).map_err(|e| e.to_string())
}

#[tauri::command]
async fn assign_tasks_to_device(
    _device_id: String,
    _task_ids: Vec<String>,
    _assigned_at: String,
) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
async fn update_task_status(
    _task_id: String,
    _status: String,
    _error_message: Option<String>,
    _updated_at: String,
) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
async fn cancel_task(
    _task_id: String,
    _reason: String,
    _cancelled_at: String,
) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
async fn get_rate_control_stats(
    _device_id: String,
    _since: String,
) -> Result<Value, String> {
    Ok(serde_json::json!({}))
}

#[tauri::command]
async fn get_device_id() -> Result<String, String> {
    Ok("mock_device_id".to_string())
}

#[tauri::command]
async fn get_cross_device_operations(
    _platform: String,
    _task_type: String,
    _target_user_id: Option<String>,
    _content: Option<String>,
    _exclude_device_id: String,
) -> Result<Vec<Value>, String> {
    Ok(vec![])
}

#[tauri::command]
async fn record_operation(
    _operation: Value,
) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
async fn get_operation_history(
    _platform: String,
    _task_type: String,
    _limit: i32,
) -> Result<Vec<Value>, String> {
    Ok(vec![])
}

#[tauri::command]
async fn calculate_content_hash(
    _content: String,
) -> Result<String, String> {
    Ok("mock_hash".to_string())
}

#[tauri::command]
async fn calculate_content_similarity(
    _content1: String,
    _content_hash2: String,
) -> Result<f64, String> {
    Ok(0.0)
}

#[tauri::command]
async fn sync_operations_to_cloud(
    _operations: Vec<Value>,
) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
async fn sync_operations_from_cloud(
    _device_id: String,
    _since_duration: i32,
) -> Result<Vec<Value>, String> {
    Ok(vec![])
}

#[tauri::command]
async fn cleanup_expired_operations(
    _cutoff_time: String,
) -> Result<i32, String> {
    Ok(0)
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::<R>::new("prospecting")
        .setup(|app, _api| {
            app.manage(ProspectingState::new());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            init_storage,
            save_comment,
            get_comments,
            get_comments_by_ids,
            save_analysis,
            save_reply_plan,
            get_reply_plans,
            get_reply_plans_by_ids,
            execute_real_reply_plan,
            get_statistics,
            assign_tasks_to_device,
            update_task_status,
            cancel_task,
            get_rate_control_stats,
            get_device_id,
            get_cross_device_operations,
            record_operation,
            get_operation_history,
            calculate_content_hash,
            calculate_content_similarity,
            sync_operations_to_cloud,
            sync_operations_from_cloud,
            cleanup_expired_operations,
        ])
        .build()
}
