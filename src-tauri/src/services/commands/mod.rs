use std::collections::HashMap;

use crate::services::smart_script_executor::SmartScriptExecutor;
use crate::services::execution::model::{
    SmartExecutorConfig,
    SmartExecutionResult,
    SmartScriptStep,
    SingleStepTestResult,
};
use tracing::{error, info};

// 🆕 导出智能自动链测试命令
mod chain_test;
pub use chain_test::execute_chain_test;

// 🆕 导出静态策略测试命令
mod static_test;
pub use static_test::execute_static_strategy_test;

/// 执行单步智能脚本测试。
#[tauri::command]
pub async fn execute_single_step_test(
    device_id: String,
    step: SmartScriptStep,
) -> Result<SingleStepTestResult, String> {
    info!("🧪 收到单步测试请求: {} (设备: {})", step.name, device_id);
    info!("📋 步骤类型: {:?}", step.step_type);
    info!("📝 步骤参数: {}", serde_json::to_string_pretty(&step.parameters).unwrap_or_default());

    let executor = SmartScriptExecutor::new(device_id.clone());

    match executor.execute_single_step(step).await {
        Ok(result) => {
            info!("✅ 单步测试成功: {} (耗时: {}ms)", result.step_name, result.duration_ms);
            Ok(result)
        }
        Err(e) => {
            error!("❌ 单步测试失败: {} - 错误: {}", device_id, e);
            Err(format!("单步测试失败: {}", e))
        }
    }
}

/// 执行整套智能脚本。
#[tauri::command]
pub async fn execute_smart_automation_script(
    device_id: String,
    steps: Vec<SmartScriptStep>,
    config: Option<SmartExecutorConfig>,
) -> Result<SmartExecutionResult, String> {
    info!("🚀 收到智能脚本批量执行请求: 设备 {}, {} 个步骤", device_id, steps.len());

    if std::env::var("USE_NEW_BACKEND").ok().as_deref() == Some("1") {
        info!("🧪 开启新后端灰度 (USE_NEW_BACKEND=1)，进入 v2 管线...");
        let adb_path = crate::utils::adb_utils::get_adb_path();
        match crate::new_backend::pipeline::run_v2_compat(&steps, &device_id, &adb_path).await {
            Ok(()) => {
                let result = SmartExecutionResult {
                    success: true,
                    total_steps: steps.len() as u32,
                    executed_steps: steps.len() as u32,
                    failed_steps: 0,
                    skipped_steps: 0,
                    duration_ms: 0,
                    logs: vec!["v2 pipeline 执行完成".to_string()],
                    final_page_state: None,
                    extracted_data: HashMap::new(),
                    message: "v2 pipeline 执行成功".to_string(),
                };
                return Ok(result);
            }
            Err(e) => {
                error!("❌ v2 pipeline 执行失败：{}，回退到旧执行器", e);
            }
        }
    }

    let executor = SmartScriptExecutor::new(device_id.clone());

    match executor.execute_smart_script(steps, config).await {
        Ok(result) => {
            info!(
                "✅ 智能脚本批量执行完成: {} (总耗时: {}ms)",
                result.message,
                result.duration_ms
            );
            Ok(result)
        }
        Err(e) => {
            error!("❌ 智能脚本批量执行失败: {} - 错误: {}", device_id, e);
            Err(format!("智能脚本批量执行失败: {}", e))
        }
    }
}

/// 在多台设备上执行整套智能脚本（顺序执行聚合结果）。
#[tauri::command]
pub async fn execute_smart_automation_script_multi(
    device_ids: Vec<String>,
    steps: Vec<SmartScriptStep>,
    config: Option<SmartExecutorConfig>,
) -> Result<HashMap<String, SmartExecutionResult>, String> {
    info!("🚀 收到多设备智能脚本批量执行请求: 设备数={}, 步骤数={}", device_ids.len(), steps.len());

    let mut results: HashMap<String, SmartExecutionResult> = HashMap::new();

    for device_id in device_ids {
        info!("➡️ 开始执行设备: {}", device_id);
        let executor = SmartScriptExecutor::new(device_id.clone());
        match executor.execute_smart_script(steps.clone(), config.clone()).await {
            Ok(result) => {
                info!("✅ 设备 {} 执行完成: 耗时={}ms, 成功={}", device_id, result.duration_ms, result.success);
                results.insert(device_id, result);
            }
            Err(e) => {
                error!("❌ 设备 {} 执行失败: {}", device_id, e);
                // 失败时也生成一个失败结果，保证返回结构完整
                let fail = SmartExecutionResult {
                    success: false,
                    total_steps: steps.len() as u32,
                    executed_steps: 0,
                    failed_steps: steps.len() as u32,
                    skipped_steps: 0,
                    duration_ms: 0,
                    logs: vec![format!("设备执行失败: {}", e)],
                    final_page_state: None,
                    extracted_data: HashMap::new(),
                    message: format!("设备执行失败: {}", e),
                };
                results.insert(device_id, fail);
            }
        }
    }

    Ok(results)
}
