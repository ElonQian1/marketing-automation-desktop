use tauri::{plugin::{Builder, TauriPlugin}, Runtime, AppHandle, Wry};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use lazy_static::lazy_static;

// 引入原始模块中的类型和逻辑
// 注意：我们需要确保这些类型是公开的，或者在这里重新定义
use crate::commands::intelligent_analysis::{
    AnalysisJobConfig, AnalysisJobResponse, BindAnalysisResultRequest, BindAnalysisResultResponse,
    StrategyCandidate, ANALYSIS_SERVICE, STEP_STRATEGY_STORE
};
use crate::commands::run_step_v2::{RunStepRequestV2, StepResponseV2, run_step_v2 as run_step_v2_impl};

// ==================== 🧠 Intelligent Analysis V2 Commands ====================

/// 启动智能分析
#[tauri::command]
async fn start_intelligent_analysis(
    app_handle: AppHandle,
    config: AnalysisJobConfig,
) -> Result<AnalysisJobResponse, String> {
    ANALYSIS_SERVICE.start_analysis(app_handle, config).await
}

/// 取消智能分析
#[tauri::command]
async fn cancel_intelligent_analysis(job_id: String) -> Result<(), String> {
    ANALYSIS_SERVICE.cancel_analysis(&job_id)
}

/// 绑定分析结果到步骤卡
#[tauri::command]
async fn bind_analysis_result_to_step(
    request: BindAnalysisResultRequest,
) -> Result<BindAnalysisResultResponse, String> {
    let BindAnalysisResultRequest {
        step_id,
        analysis_result,
        selected_strategy_key,
        overwrite_existing,
    } = request;
    
    // 1. 查找选中的策略
    let selected_strategy = analysis_result
        .smart_candidates
        .iter()
        .chain(analysis_result.static_candidates.iter())
        .find(|s| s.key == selected_strategy_key)
        .cloned();
    
    let strategy = match selected_strategy {
        Some(s) => s,
        None => {
            return Err(format!(
                "未找到策略 key={} (available: {:?})",
                selected_strategy_key,
                analysis_result
                    .smart_candidates
                    .iter()
                    .map(|s| s.key.as_str())
                    .collect::<Vec<_>>()
            ));
        }
    };
    
    // 2. 检查是否已存在策略
    let mut store = STEP_STRATEGY_STORE.lock().map_err(|e| {
        format!("锁定步骤策略存储失败: {}", e)
    })?;
    
    let has_existing = store.contains_key(&step_id);
    
    if has_existing && !overwrite_existing {
        return Ok(BindAnalysisResultResponse {
            success: false,
            message: format!("步骤 {} 已存在策略,且未允许覆盖", step_id),
            step_id: step_id.clone(),
            bound_strategy: None,
        });
    }
    
    // 3. 保存策略到存储
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;
    
    store.insert(step_id.clone(), (strategy.clone(), timestamp));
    
    tracing::info!(
        "✅ 绑定策略到步骤: step_id={}, strategy_key={}, confidence={:.1}%, overwrite={}",
        step_id,
        strategy.key,
        strategy.confidence,
        has_existing
    );
    
    // 4. 返回成功响应
    Ok(BindAnalysisResultResponse {
        success: true,
        message: format!(
            "成功绑定策略 '{}' 到步骤 '{}'",
            strategy.name, step_id
        ),
        step_id,
        bound_strategy: Some(strategy),
    })
}

/// 获取步骤绑定的策略 (用于测试和查询)
#[tauri::command]
async fn get_step_strategy(step_id: String) -> Result<Option<StrategyCandidate>, String> {
    let store = STEP_STRATEGY_STORE.lock().map_err(|e| {
        format!("锁定步骤策略存储失败: {}", e)
    })?;
    
    Ok(store.get(&step_id).map(|(strategy, _)| strategy.clone()))
}

/// 清除步骤策略 (用于测试)
#[tauri::command]
async fn clear_step_strategy(step_id: String) -> Result<bool, String> {
    let mut store = STEP_STRATEGY_STORE.lock().map_err(|e| {
        format!("锁定步骤策略存储失败: {}", e)
    })?;
    
    Ok(store.remove(&step_id).is_some())
}

/// 运行单步 V2 (Legacy)
#[tauri::command]
async fn run_step_v2(app_handle: AppHandle, request: RunStepRequestV2) -> Result<StepResponseV2, String> {
    run_step_v2_impl(app_handle, request).await
}

// ==================== 🔌 Plugin Initialization ====================

pub fn init() -> TauriPlugin<Wry> {
    Builder::new("intelligent_analysis")
        .invoke_handler(tauri::generate_handler![
            start_intelligent_analysis,
            cancel_intelligent_analysis,
            bind_analysis_result_to_step,
            get_step_strategy,
            clear_step_strategy,
            run_step_v2
        ])
        .build()
}
