// src-tauri/src/exec/v3/events.rs
// module: exec | layer: infrastructure | role: 统一事件发射器
// summary: 封装 analysis:progress 和 analysis:complete 事件发射

use tauri::{AppHandle, Emitter};
use super::types::*;

/// 发射进度事件
pub fn emit_progress(
    app: &AppHandle,
    analysis_id: Option<String>,
    step_id: Option<String>,
    phase: Phase,
    confidence: Option<Confidence>,
    message: Option<String>,
    meta: Option<serde_json::Value>,
) -> Result<(), String> {
    let event = ExecEventV3::Progress {
        analysis_id,
        step_id,
        phase,
        confidence,
        message,
        meta,
    };
    
    app.emit("analysis:progress", &event)
        .map_err(|e| format!("发射 progress 事件失败: {}", e))
}

/// 发射完成事件
pub fn emit_complete(
    app: &AppHandle,
    analysis_id: Option<String>,
    summary: Option<Summary>,
    scores: Option<Vec<StepScore>>,
    result: Option<ResultPayload>,
) -> Result<(), String> {
    let event = ExecEventV3::Complete {
        analysis_id,
        summary,
        scores,
        result,
    };
    
    app.emit("analysis:complete", &event)
        .map_err(|e| format!("发射 complete 事件失败: {}", e))
}

/// 便捷方法：发射设备就绪阶段
pub fn emit_device_ready(
    app: &AppHandle,
    analysis_id: Option<String>,
) -> Result<(), String> {
    emit_progress(
        app,
        analysis_id,
        None,
        Phase::DeviceReady,
        None,
        Some("设备已就绪".to_string()),
        None,
    )
}

/// 便捷方法：发射快照就绪阶段
pub fn emit_snapshot_ready(
    app: &AppHandle,
    analysis_id: Option<String>,
    screen_hash: Option<String>,
) -> Result<(), String> {
    let mut meta = serde_json::Map::new();
    if let Some(hash) = screen_hash {
        meta.insert("screenHash".to_string(), serde_json::json!(hash));
    }
    
    emit_progress(
        app,
        analysis_id,
        None,
        Phase::SnapshotReady,
        None,
        Some("屏幕快照已获取".to_string()),
        Some(serde_json::Value::Object(meta)),
    )
}

/// 便捷方法：发射匹配开始阶段
pub fn emit_match_started(
    app: &AppHandle,
    analysis_id: Option<String>,
    step_id: String,
) -> Result<(), String> {
    emit_progress(
        app,
        analysis_id,
        Some(step_id),
        Phase::MatchStarted,
        None,
        Some("开始匹配元素".to_string()),
        None,
    )
}

/// 便捷方法：发射匹配成功阶段
pub fn emit_matched(
    app: &AppHandle,
    analysis_id: Option<String>,
    step_id: String,
    confidence: Confidence,
) -> Result<(), String> {
    emit_progress(
        app,
        analysis_id,
        Some(step_id),
        Phase::Matched,
        Some(confidence),
        Some(format!("匹配成功，置信度: {:.2}", confidence)),
        None,
    )
}

/// 便捷方法：发射验证成功阶段
pub fn emit_validated(
    app: &AppHandle,
    analysis_id: Option<String>,
    step_id: String,
) -> Result<(), String> {
    emit_progress(
        app,
        analysis_id,
        Some(step_id),
        Phase::Validated,
        None,
        Some("后置验证通过".to_string()),
        None,
    )
}

/// 便捷方法：发射执行成功阶段
pub fn emit_executed(
    app: &AppHandle,
    analysis_id: Option<String>,
    step_id: String,
) -> Result<(), String> {
    emit_progress(
        app,
        analysis_id,
        Some(step_id),
        Phase::Executed,
        None,
        Some("动作执行成功".to_string()),
        None,
    )
}
