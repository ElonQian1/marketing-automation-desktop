// src-tauri/src/infrastructure/events.rs
// module: infrastructure | layer: infrastructure | role: event-tracer
// summary: 统一事件发射器,支持开发期JSONL落盘追踪

use serde::Serialize;
use std::fs::{OpenOptions, create_dir_all};
use std::io::Write;
use std::path::Path;
use chrono::Utc;
use tauri::AppHandle;

#[derive(Serialize)]
struct EventTrace<'a, T> {
    ts: String,
    event_name: &'a str,
    payload: T,
}

/// 统一的事件发射 + 落盘追踪
/// 
/// 在开发模式下会将所有事件落盘到 debug/flows/YYYY-MM-DD/backend-events.jsonl
/// 生产模式下只发射事件,不落盘
pub fn emit_and_trace<T: Serialize>(
    app: &AppHandle,
    event_name: &'static str,
    payload: &T,
) -> Result<(), String> {
    // 1) 发射事件到前端
    app.emit(event_name, payload)
        .map_err(|e| format!("Failed to emit event '{}': {}", event_name, e))?;

    // 2) 开发模式: 落盘JSONL
    #[cfg(debug_assertions)]
    {
        if let Err(e) = trace_to_file(event_name, payload) {
            // 落盘失败不影响业务,只打印警告
            eprintln!("⚠️ Failed to trace event '{}' to file: {}", event_name, e);
        }
    }

    Ok(())
}

#[cfg(debug_assertions)]
fn trace_to_file<T: Serialize>(event_name: &str, payload: &T) -> std::io::Result<()> {
    // 构建日志目录路径
    let today = Utc::now().format("%Y-%m-%d").to_string();
    let log_dir = format!("debug/flows/{}", today);
    let log_file = format!("{}/backend-events.jsonl", log_dir);

    // 确保目录存在
    if !Path::new(&log_dir).exists() {
        create_dir_all(&log_dir)?;
    }

    // 序列化事件
    let trace = EventTrace {
        ts: Utc::now().to_rfc3339(),
        event_name,
        payload,
    };

    let line = serde_json::to_string(&trace)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidData, e))?;

    // 追加到文件
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(log_file)?;

    writeln!(file, "{}", line)?;
    
    Ok(())
}
