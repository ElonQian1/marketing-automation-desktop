// src-tauri/src/commands/prospecting.rs
// module: tauri-backend | layer: commands | role: 精准获客 Tauri 命令
// summary: 提供精准获客模块的所有 Tauri 命令接口

use anyhow::Result;
use parking_lot::Mutex;
use std::sync::Arc;
use std::path::PathBuf;
use tauri::{AppHandle, State, Manager};

use crate::services::prospecting::{
    ProspectingService,
    types::{Comment, RawComment, CommentFilter, AnalysisResult, ReplyPlan, Statistics},
};

/// 精准获客模块的全局状态
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

/// 初始化精准获客存储
#[tauri::command]
pub async fn init_precise_acquisition_storage(
    app: AppHandle,
    state: State<'_, ProspectingState>,
) -> Result<(), String> {
    let data_dir = app.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    state.init_service(data_dir)
        .map_err(|e| format!("Failed to initialize service: {}", e))
}

/// 保存评论
#[tauri::command]
pub async fn prospecting_save_comment(
    state: State<'_, ProspectingState>,
    comment: RawComment, // 改为RawComment类型
) -> Result<(), String> {
    state.with_service(|service| {
        service.save_comment(&comment)
    }).map_err(|e| e.to_string())?;

    Ok(()) // 只返回成功状态
}

/// 获取评论列表
#[tauri::command]
pub async fn prospecting_get_comments(
    state: State<'_, ProspectingState>,
    filter: CommentFilter,
) -> Result<Vec<Comment>, String> {
    state.with_service(|service| {
        service.get_comments(&filter)
    }).map_err(|e| e.to_string())
}

/// 根据ID列表获取评论
#[tauri::command]
pub async fn prospecting_get_comments_by_ids(
    state: State<'_, ProspectingState>,
    ids: Vec<String>,
) -> Result<Vec<Comment>, String> {
    state.with_service(|service| {
        service.get_comments_by_ids(&ids)
    }).map_err(|e| e.to_string())
}

/// 保存分析结果
#[tauri::command]
pub async fn prospecting_save_analysis(
    state: State<'_, ProspectingState>,
    analysis: AnalysisResult,
) -> Result<(), String> {
    state.with_service(|service| {
        service.save_analysis(&analysis)
    }).map_err(|e| e.to_string())?;

    Ok(()) // 只返回成功状态
}

/// 保存回复计划
#[tauri::command]
pub async fn prospecting_save_reply_plan(
    state: State<'_, ProspectingState>,
    plan: ReplyPlan,
) -> Result<(), String> {
    state.with_service(|service| {
        service.save_reply_plan(&plan)
    }).map_err(|e| e.to_string())?;

    Ok(()) // 只返回成功状态
}

/// 获取回复计划列表
#[tauri::command]
pub async fn prospecting_get_reply_plans(
    state: State<'_, ProspectingState>,
    comment_ids: Vec<String>,
) -> Result<Vec<ReplyPlan>, String> {
    state.with_service(|service| {
        service.get_reply_plans(&comment_ids)
    }).map_err(|e| e.to_string())
}

/// 根据ID列表获取回复计划
#[tauri::command]
pub async fn prospecting_get_reply_plans_by_ids(
    state: State<'_, ProspectingState>,
    ids: Vec<String>,
) -> Result<Vec<ReplyPlan>, String> {
    state.with_service(|service| {
        service.get_reply_plans_by_ids(&ids)
    }).map_err(|e| e.to_string())
}

/// 执行真实回复计划（与模拟设备交互）
#[tauri::command]
pub async fn prospecting_execute_real_reply_plan(
    state: State<'_, ProspectingState>,
    plan_id: String,
) -> Result<bool, String> {
    // 这里暂时返回成功，实际实现需要与 ADB/设备交互
    // 在真实环境中，这里会调用设备自动化服务
    Ok(true)
}

/// 获取统计信息
#[tauri::command]
pub async fn prospecting_get_statistics(
    state: State<'_, ProspectingState>,
) -> Result<Statistics, String> {
    state.with_service(|service| {
        service.get_statistics()
    }).map_err(|e| e.to_string())
}