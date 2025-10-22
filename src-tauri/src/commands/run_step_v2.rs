// src-tauri/src/commands/run_step_v2.rs
// module: commands | layer: application | role: RunStep V2 统一执行命令
// summary: 新版步骤执行管道，支持选择器优先+坐标兜底+执行后验证

use serde::{Deserialize, Serialize};
use tauri::command;
use tracing::{info, warn, error, debug};
use std::time::Instant;
use std::collections::HashMap;

// ===== 数据结构定义 =====

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub enum ActionType {
    Tap,
    DoubleTap, 
    LongPress,
    Swipe,
    Type,
    Wait,
    Back,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub enum StrategyKind {
    Intelligent,
    Standard, 
    Absolute,
    Custom,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub enum StepRunMode {
    MatchOnly,
    ExecuteStep,
}

#[derive(Serialize, Deserialize, Clone, Copy, Debug)]
pub struct Bounds {
    pub left: i32,
    pub top: i32, 
    pub right: i32,
    pub bottom: i32,
}

#[derive(Serialize, Deserialize, Clone, Copy, Debug)]
pub struct Offset {
    pub x: i32,
    pub y: i32,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct RetryPolicy {
    pub max: u32,
    pub interval_ms: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub enum VerifyType {
    Exists,
    Text, 
    Gone,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct VerifySpec {
    pub r#type: VerifyType,
    pub timeout_ms: u64,
    pub expected_text: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct BaseStep {
    pub step_id: String,
    pub selector: Option<String>,
    pub selector_preferred: Option<bool>,
    pub bounds: Option<Bounds>,
    pub fallback_to_bounds: Option<bool>,
    pub retry: Option<RetryPolicy>,
    pub verify_after: Option<VerifySpec>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SwipeParams {
    pub direction: String, // "up"|"down"|"left"|"right"
    pub distance_dp: Option<i32>,
    pub duration_ms: Option<u64>,
    pub start: Option<String>, // "center"|"edge"|"custom"
    pub start_offset: Option<Offset>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(tag = "action", rename_all = "snake_case")]
pub enum ActionPayload {
    Tap { 
        press_ms: Option<u64>, 
        offset: Option<Offset> 
    },
    DoubleTap { 
        press_ms: Option<u64>, 
        offset: Option<Offset> 
    },
    LongPress { 
        press_ms: Option<u64>, 
        offset: Option<Offset> 
    },
    Swipe {
        direction: String,
        distance_dp: Option<i32>,
        duration_ms: Option<u64>,
        start: Option<String>,
        start_offset: Option<Offset>,
    },
    Type { 
        text: String, 
        secure: Option<bool>, 
        clear: Option<bool>, 
        submit: Option<bool> 
    },
    Wait { 
        duration_ms: u64 
    },
    Back,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct StepPayload {
    #[serde(flatten)]
    pub base: BaseStep,
    #[serde(flatten)]
    pub action: ActionPayload,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct RunStepRequestV2 {
    pub device_id: String,
    pub mode: StepRunMode,
    pub strategy: StrategyKind, // ✅ 顶层字段，解决 missing field 问题
    pub step: StepPayload,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MatchCandidate {
    pub id: String,
    pub score: f32,
    pub confidence: f32,
    pub bounds: Bounds,
    pub text: Option<String>,
    pub class_name: Option<String>,
    pub package_name: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct RunStepResponseV2 {
    pub ok: bool,
    pub message: String,
    pub matched: Option<MatchCandidate>,
    pub executed_action: Option<ActionType>,
    pub verify_passed: Option<bool>,
    pub error_code: Option<String>,
    pub raw_logs: Option<Vec<String>>,
}

// ===== 核心执行逻辑 =====

#[command]
pub async fn run_step_v2(request: RunStepRequestV2) -> Result<RunStepResponseV2, String> {
    let start_time = Instant::now();
    info!("[RunStepV2] 开始执行: {:?}", request);

    // 0) 基础校验
    if let Err(e) = validate_request(&request) {
        warn!("[RunStepV2] 参数校验失败: {}", e);
        return Ok(RunStepResponseV2 {
            ok: false,
            message: format!("参数校验失败: {}", e),
            matched: None,
            executed_action: None,
            verify_passed: None,
            error_code: Some("INVALID_ARGS".to_string()),
            raw_logs: Some(vec![format!("参数校验失败: {}", e)]),
        });
    }

    let mut logs = Vec::new();
    
    // 1) 策略匹配阶段
    logs.push(format!("开始策略匹配: {:?}", request.strategy));
    let candidate = match match_with_strategy(&request).await {
        Ok(c) => {
            info!("[RunStepV2] 匹配成功: 置信度 {:.2}", c.confidence);
            logs.push(format!("匹配成功: 置信度 {:.2}", c.confidence));
            Some(c)
        }
        Err(e) => {
            warn!("[RunStepV2] 匹配失败: {}", e);
            logs.push(format!("匹配失败: {}", e));
            
            if matches!(request.mode, StepRunMode::MatchOnly) {
                return Ok(RunStepResponseV2 {
                    ok: false,
                    message: format!("匹配失败: {}", e),
                    matched: None,
                    executed_action: None,
                    verify_passed: None,
                    error_code: Some("NO_CANDIDATE".to_string()),
                    raw_logs: Some(logs),
                });
            }
            None
        }
    };

    // 仅匹配模式：到此结束
    if matches!(request.mode, StepRunMode::MatchOnly) {
        return Ok(RunStepResponseV2 {
            ok: true,
            message: "仅匹配完成".to_string(),
            matched: candidate,
            executed_action: None,
            verify_passed: None,
            error_code: None,
            raw_logs: Some(logs),
        });
    }

    // 2) 计算执行点位（选择器优先 + 坐标兜底）
    let (x, y) = match resolve_execution_point(&candidate, &request.step.base) {
        Ok(point) => {
            info!("[RunStepV2] 执行点位: ({}, {})", point.0, point.1);
            logs.push(format!("执行点位: ({}, {})", point.0, point.1));
            point
        }
        Err(e) => {
            error!("[RunStepV2] 无法确定执行点位: {}", e);
            return Ok(RunStepResponseV2 {
                ok: false,
                message: format!("无法确定执行点位: {}", e),
                matched: candidate,
                executed_action: None,
                verify_passed: None,
                error_code: Some("NO_CANDIDATE".to_string()),
                raw_logs: Some(logs),
            });
        }
    };

    // 3) 执行动作
    let action_type = get_action_type(&request.step.action);
    match execute_action(&request.device_id, &request.step.action, x, y).await {
        Ok(_) => {
            info!("[RunStepV2] 动作执行成功: {:?}", action_type);
            logs.push(format!("动作执行成功: {:?}", action_type));
        }
        Err(e) => {
            error!("[RunStepV2] 动作执行失败: {}", e);
            return Ok(RunStepResponseV2 {
                ok: false,
                message: format!("动作执行失败: {}", e),
                matched: candidate,
                executed_action: Some(action_type),
                verify_passed: None,
                error_code: Some("ADB_ERROR".to_string()),
                raw_logs: Some(logs),
            });
        }
    }

    // 4) 可选验证
    let verify_passed = if let Some(verify_spec) = &request.step.base.verify_after {
        match verify_after(&request.device_id, verify_spec).await {
            Ok(passed) => {
                info!("[RunStepV2] 执行后验证: {}", if passed { "通过" } else { "失败" });
                logs.push(format!("执行后验证: {}", if passed { "通过" } else { "失败" }));
                Some(passed)
            }
            Err(e) => {
                warn!("[RunStepV2] 验证过程异常: {}", e);
                logs.push(format!("验证过程异常: {}", e));
                Some(false)
            }
        }
    } else {
        None
    };

    let duration_ms = start_time.elapsed().as_millis() as u64;
    info!("[RunStepV2] 执行完成，耗时: {}ms", duration_ms);

    Ok(RunStepResponseV2 {
        ok: true,
        message: "执行成功".to_string(),
        matched: candidate,
        executed_action: Some(action_type),
        verify_passed,
        error_code: None,
        raw_logs: Some(logs),
    })
}

// ===== 辅助函数 =====

fn validate_request(request: &RunStepRequestV2) -> Result<(), String> {
    // 校验动作参数
    match &request.step.action {
        ActionPayload::Type { text, .. } => {
            if text.is_empty() {
                return Err("Type 动作必须包含非空文本".to_string());
            }
        }
        ActionPayload::Wait { duration_ms } => {
            if *duration_ms == 0 {
                return Err("Wait 动作时长必须大于0".to_string());
            }
        }
        ActionPayload::Swipe { direction, .. } => {
            if !["up", "down", "left", "right"].contains(&direction.as_str()) {
                return Err("Swipe 方向必须是 up/down/left/right 之一".to_string());
            }
        }
        _ => {} // 其他动作暂时无需特殊校验
    }
    
    Ok(())
}

async fn match_with_strategy(request: &RunStepRequestV2) -> Result<MatchCandidate, String> {
    // TODO: 实际的策略匹配逻辑
    // 这里暂时返回模拟数据，等原有匹配系统集成完成后替换
    
    use tokio::time::{sleep, Duration};
    sleep(Duration::from_millis(300)).await; // 模拟匹配耗时
    
    if let Some(selector) = &request.step.base.selector {
        Ok(MatchCandidate {
            id: format!("matched_{}", selector),
            score: 0.85,
            confidence: 0.88,
            bounds: Bounds { left: 100, top: 200, right: 180, bottom: 240 },
            text: Some("匹配元素".to_string()),
            class_name: Some("android.widget.Button".to_string()),
            package_name: Some("com.example.app".to_string()),
        })
    } else {
        Err("无选择器信息".to_string())
    }
}

fn resolve_execution_point(candidate: &Option<MatchCandidate>, base: &BaseStep) -> Result<(i32, i32), String> {
    // 选择器优先：有候选就用候选中心点
    if let Some(c) = candidate {
        let center_x = (c.bounds.left + c.bounds.right) / 2;
        let center_y = (c.bounds.top + c.bounds.bottom) / 2;
        return Ok((center_x, center_y));
    }
    
    // 坐标兜底：允许兜底 && 有边界信息
    if base.fallback_to_bounds.unwrap_or(false) {
        if let Some(bounds) = &base.bounds {
            let center_x = (bounds.left + bounds.right) / 2;
            let center_y = (bounds.top + bounds.bottom) / 2;
            return Ok((center_x, center_y));
        }
    }
    
    Err("既无匹配候选，也不允许坐标兜底".to_string())
}

async fn execute_action(device_id: &str, action: &ActionPayload, x: i32, y: i32) -> Result<(), String> {
    // TODO: 实际的 ADB 执行逻辑
    // 这里暂时模拟执行，等 ADB 服务集成完成后替换
    
    use tokio::time::{sleep, Duration};
    
    match action {
        ActionPayload::Tap { press_ms, .. } => {
            info!("执行 Tap: ({}, {}), 时长: {:?}ms", x, y, press_ms);
            sleep(Duration::from_millis(100)).await;
        }
        ActionPayload::DoubleTap { .. } => {
            info!("执行 DoubleTap: ({}, {})", x, y);
            sleep(Duration::from_millis(200)).await;
        }
        ActionPayload::LongPress { press_ms, .. } => {
            let duration = press_ms.unwrap_or(450);
            info!("执行 LongPress: ({}, {}), 时长: {}ms", x, y, duration);
            sleep(Duration::from_millis(duration + 50)).await;
        }
        ActionPayload::Swipe { direction, duration_ms, .. } => {
            info!("执行 Swipe: 方向 {}, 时长: {:?}ms", direction, duration_ms);
            sleep(Duration::from_millis(duration_ms.unwrap_or(250) + 50)).await;
        }
        ActionPayload::Type { text, secure, .. } => {
            if *secure == Some(true) {
                info!("执行 Type: [SECURE TEXT], 长度: {}", text.len());
            } else {
                info!("执行 Type: {}", text);
            }
            sleep(Duration::from_millis(text.len() as u64 * 20)).await;
        }
        ActionPayload::Wait { duration_ms } => {
            info!("执行 Wait: {}ms", duration_ms);
            sleep(Duration::from_millis(*duration_ms)).await;
        }
        ActionPayload::Back => {
            info!("执行 Back");
            sleep(Duration::from_millis(100)).await;
        }
    }
    
    Ok(())
}

async fn verify_after(device_id: &str, verify_spec: &VerifySpec) -> Result<bool, String> {
    // TODO: 实际的验证逻辑
    // 这里暂时返回模拟结果
    
    use tokio::time::{sleep, Duration};
    sleep(Duration::from_millis(200)).await;
    
    match verify_spec.r#type {
        VerifyType::Exists => Ok(true), // 模拟元素存在
        VerifyType::Gone => Ok(false),  // 模拟元素未消失
        VerifyType::Text => Ok(true),   // 模拟文本匹配成功
    }
}

fn get_action_type(action: &ActionPayload) -> ActionType {
    match action {
        ActionPayload::Tap { .. } => ActionType::Tap,
        ActionPayload::DoubleTap { .. } => ActionType::DoubleTap,
        ActionPayload::LongPress { .. } => ActionType::LongPress,
        ActionPayload::Swipe { .. } => ActionType::Swipe,
        ActionPayload::Type { .. } => ActionType::Type,
        ActionPayload::Wait { .. } => ActionType::Wait,
        ActionPayload::Back => ActionType::Back,
    }
}