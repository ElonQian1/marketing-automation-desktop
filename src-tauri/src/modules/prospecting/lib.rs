use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime, Manager, State, AppHandle
};
use std::sync::Arc;
use parking_lot::Mutex;
use std::path::PathBuf;
use anyhow::Result;

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
async fn init_storage(
    app: AppHandle,
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

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("prospecting")
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
            get_statistics
        ])
        .build()
}
