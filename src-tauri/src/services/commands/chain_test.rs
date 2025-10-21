// src-tauri/src/services/commands/chain_test.rs
// module: services | layer: application | role: 智能自动链测试命令
// summary: 串行执行多步骤，带置信度阈值与回退策略

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use tracing::{error, info};

use crate::services::smart_script_executor::SmartScriptExecutor;
use crate::services::execution::model::{SmartScriptStep, SingleStepTestResult};

/// 智能自动链测试规格
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChainTestSpec {
    /// 有序步骤列表
    pub ordered_steps: Vec<SmartScriptStep>,
    /// 置信度阈值（0..1），低于此值则跳过该步骤
    pub threshold: f64,
    /// 运行模式：dryrun（仅评分不执行）或 execute（评分后执行）
    pub mode: ChainTestMode,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ChainTestMode {
    Dryrun,
    Execute,
}

/// 智能自动链测试结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChainTestResult {
    pub success: bool,
    pub total_steps: usize,
    pub executed_steps: usize,
    pub skipped_steps: usize,
    pub step_results: Vec<ChainStepResult>,
    pub duration_ms: u64,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChainStepResult {
    pub step_id: String,
    pub step_name: String,
    pub confidence: f64,
    pub executed: bool,
    pub success: bool,
    pub message: String,
    pub duration_ms: u64,
}

/// 执行智能自动链测试
#[tauri::command]
pub async fn execute_chain_test(
    device_id: String,
    spec: ChainTestSpec,
) -> Result<ChainTestResult, String> {
    info!(
        "🔗 收到智能自动链测试请求: 设备={}, 步骤数={}, 阈值={}",
        device_id,
        spec.ordered_steps.len(),
        spec.threshold
    );

    let start_time = std::time::Instant::now();
    let executor = SmartScriptExecutor::new(device_id.clone());

    let mut step_results = Vec::new();
    let mut executed_count = 0;
    let mut skipped_count = 0;
    let mut overall_success = true;

    for step in spec.ordered_steps.iter() {
        info!("🧪 处理步骤: {} (ID: {})", step.name, step.id);

        // 1. 先评分（使用统一匹配逻辑）
        let confidence = match evaluate_step_confidence(&executor, step).await {
            Ok(score) => score,
            Err(e) => {
                error!("❌ 步骤 '{}' 评分失败: {}", step.name, e);
                0.0
            }
        };

        info!("📊 步骤 '{}' 置信度: {:.2}", step.name, confidence);

        // 2. 根据阈值决定是否执行
        if confidence < spec.threshold {
            info!("⏭️ 跳过步骤 '{}': 置信度 {:.2} < 阈值 {:.2}", step.name, confidence, spec.threshold);
            step_results.push(ChainStepResult {
                step_id: step.id.clone(),
                step_name: step.name.clone(),
                confidence,
                executed: false,
                success: false,
                message: format!("置信度不足（{:.2} < {:.2}），已跳过", confidence, spec.threshold),
                duration_ms: 0,
            });
            skipped_count += 1;
            continue;
        }

        // 3. 执行步骤（如果非 dryrun 模式）
        let (executed, test_result) = match spec.mode {
            ChainTestMode::Dryrun => {
                info!("🔍 Dryrun 模式：仅评分，不执行步骤 '{}'", step.name);
                (false, None)
            }
            ChainTestMode::Execute => {
                info!("▶️ 执行步骤 '{}'", step.name);
                match executor.execute_single_step(step.clone()).await {
                    Ok(result) => (true, Some(result)),
                    Err(e) => {
                        error!("❌ 步骤 '{}' 执行失败: {}", step.name, e);
                        overall_success = false;
                        (true, None)
                    }
                }
            }
        };

        if executed {
            executed_count += 1;
        }

        let step_success = test_result.as_ref().map(|r| r.success).unwrap_or(false);
        let step_duration = test_result.as_ref().map(|r| r.duration_ms).unwrap_or(0);
        let step_message = test_result
            .as_ref()
            .map(|r| r.message.clone())
            .unwrap_or_else(|| "Dryrun 模式，未执行".to_string());

        step_results.push(ChainStepResult {
            step_id: step.id.clone(),
            step_name: step.name.clone(),
            confidence,
            executed,
            success: step_success,
            message: step_message,
            duration_ms: step_duration,
        });

        if executed && !step_success {
            overall_success = false;
            info!("❌ 步骤 '{}' 执行失败，终止链路", step.name);
            break;
        }
    }

    let total_duration = start_time.elapsed().as_millis() as u64;

    let result = ChainTestResult {
        success: overall_success && executed_count > 0,
        total_steps: spec.ordered_steps.len(),
        executed_steps: executed_count,
        skipped_steps: skipped_count,
        step_results,
        duration_ms: total_duration,
        message: format!(
            "智能自动链测试完成: 执行 {} 步，跳过 {} 步",
            executed_count, skipped_count
        ),
    };

    info!(
        "🏁 智能自动链测试完成: 成功={}, 耗时={}ms",
        result.success, result.duration_ms
    );

    Ok(result)
}

/// 评估步骤的置信度（0..1）
async fn evaluate_step_confidence(
    executor: &SmartScriptExecutor,
    step: &SmartScriptStep,
) -> Result<f64, String> {
    // 这里简化为调用统一匹配逻辑获取分数
    // 实际项目中可以集成更复杂的评分系统

    // 对于基础动作（tap/input/swipe/wait），直接返回高分
    use crate::services::execution::model::SmartActionType;
    match step.step_type {
        SmartActionType::Tap | SmartActionType::Input | SmartActionType::Wait | SmartActionType::Swipe => {
            return Ok(1.0);
        }
        _ => {}
    }

    // 对于智能动作，尝试获取匹配置信度
    // 这里需要调用 UI 分析器或匹配引擎
    // 当前简化为返回模拟分数

    // TODO: 集成真实的评分逻辑
    Ok(0.8)
}
