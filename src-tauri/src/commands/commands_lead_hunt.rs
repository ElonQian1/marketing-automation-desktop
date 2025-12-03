// src-tauri/src/commands/commands_lead_hunt.rs
// module: lead-hunt | layer: commands | role: 精准获客 Tauri 命令
// summary: 暴露给前端的精准获客相关命令

use tauri::{AppHandle, Runtime};
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

/// 调试命令：填充测试数据到数据库
#[cfg(debug_assertions)]
#[tauri::command]
pub async fn lh_seed_database(app_handle: AppHandle) -> Result<(), String> {
    use crate::db;
    
    let conn = db::get_connection(&app_handle)
        .map_err(|e| format!("Failed to get DB connection: {}", e))?;
    
    db::seed::run_all(&conn)
        .map_err(|e| format!("Failed to seed database: {}", e))?;
    
    Ok(())
}

/// 批量分析评论 (后端处理)
#[tauri::command]
pub async fn lh_analyze_comments(
    app_handle: AppHandle,
    comment_ids: Vec<String>,
    batch_id: String,
    concurrency: Option<u32>,
    max_retries: Option<u32>,
) -> Result<(), String> {
    use crate::services::batch_analysis::{BatchAnalysisService, BatchAnalysisRequest};
    
    let service = BatchAnalysisService::new(app_handle);
    let request = BatchAnalysisRequest {
        comment_ids,
        batch_id,
        concurrency,
        max_retries,
    };
    
    service.start_batch_analysis(request).await
        .map_err(|e| format!("批量分析启动失败: {}", e))
}

/// 获取数据库统计信息
#[tauri::command]
pub async fn lh_get_stats(app_handle: AppHandle) -> Result<serde_json::Value, String> {
    use crate::db;
    use serde_json::json;
    
    let conn = db::get_connection(&app_handle)
        .map_err(|e| format!("Failed to get DB connection: {}", e))?;
    
    let comments_count = db::lead_comments::count(&conn)
        .map_err(|e| format!("Failed to count comments: {}", e))?;
    
    let analyses_count = db::lead_analyses::list_all(&conn)
        .map_err(|e| format!("Failed to count analyses: {}", e))?
        .len();
    
    let intent_stats = db::lead_analyses::count_by_intent(&conn)
        .map_err(|e| format!("Failed to get intent stats: {}", e))?;
    
    let pending_plans = db::replay_plans::list_pending(&conn, None)
        .map_err(|e| format!("Failed to count pending plans: {}", e))?
        .len();
    
    let all_plans = db::replay_plans::list_all(&conn)
        .map_err(|e| format!("Failed to count all plans: {}", e))?
        .len();
    
    let status_stats = db::replay_plans::count_by_status(&conn)
        .map_err(|e| format!("Failed to get status stats: {}", e))?;
    
    Ok(json!({
        "comments": {
            "total": comments_count
        },
        "analyses": {
            "total": analyses_count,
            "by_intent": intent_stats
        },
        "replay_plans": {
            "total": all_plans,
            "pending": pending_plans,
            "by_status": status_stats
        }
    }))
}
