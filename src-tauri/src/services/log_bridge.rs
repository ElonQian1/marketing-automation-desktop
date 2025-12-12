/**
 * 日志桥接服务
 * 用于收集后端日志并传输到前端
 */

use serde::{Deserialize, Serialize};
use std::collections::VecDeque;
use std::sync::{Arc, Mutex};
use tauri::AppHandle;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEntry {
    pub id: String,
    pub timestamp: String, // ISO格式时间戳
    pub level: String,     // DEBUG, INFO, WARN, ERROR
    pub category: String,  // SYSTEM, DEVICE, DIAGNOSTIC, USER_ACTION
    pub source: String,    // 日志来源（组件名或服务名）
    pub message: String,
    pub details: Option<String>, // JSON字符串格式的详细信息
    pub device_id: Option<String>,
    pub session_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdbCommandLog {
    pub command: String,
    pub args: Vec<String>,
    pub output: String,
    pub error: Option<String>,
    pub exit_code: Option<i32>,
    pub duration_ms: u64,
    pub device_id: Option<String>,
    pub session_id: String,
    pub timestamp: String,
}

/// 日志收集器
/// 在Rust后端收集各种日志信息，并提供给前端查询
pub struct LogCollector {
    logs: Arc<Mutex<VecDeque<LogEntry>>>,
    adb_command_logs: Arc<Mutex<VecDeque<AdbCommandLog>>>,
    max_entries: usize,
    session_id: String,
    app_handle: Option<AppHandle>,
}

impl LogCollector {
    pub fn new(max_entries: usize) -> Self {
        let session_id = uuid::Uuid::new_v4().to_string();
        
        Self {
            logs: Arc::new(Mutex::new(VecDeque::with_capacity(max_entries))),
            adb_command_logs: Arc::new(Mutex::new(VecDeque::with_capacity(max_entries))),
            max_entries,
            session_id,
            app_handle: None,
        }
    }

    pub fn set_app_handle(&mut self, app_handle: AppHandle) {
        self.app_handle = Some(app_handle);
    }

    /// 添加普通日志条目
    pub fn add_log(
        &self,
        level: &str,
        category: &str,
        source: &str,
        message: &str,
        details: Option<&str>,
        device_id: Option<&str>,
    ) {
        let log_entry = LogEntry {
            id: uuid::Uuid::new_v4().to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
            level: level.to_string(),
            category: category.to_string(),
            source: source.to_string(),
            message: message.to_string(),
            details: details.map(|d| d.to_string()),
            device_id: device_id.map(|d| d.to_string()),
            session_id: self.session_id.clone(),
        };

        {
            let mut logs = self.logs.lock().unwrap();
            if logs.len() >= self.max_entries {
                logs.pop_front();
            }
            logs.push_back(log_entry.clone());
        }

        // 实时发送到前端
        if let Some(app_handle) = &self.app_handle {
            use crate::infrastructure::events::emit_and_trace;
            let _ = emit_and_trace(app_handle, "log-entry", &log_entry);
        }
        
        // 🐛 修复：移除 tracing 输出，避免日志重复
        // 调用方通常已经使用 tracing::info/error 记录过了
        // 这里只负责存储到内存和发送到前端
    }

    /// 添加ADB命令日志
    pub fn add_adb_command_log(
        &self,
        command: &str,
        args: &[String],
        output: &str,
        error: Option<&str>,
        exit_code: Option<i32>,
        duration_ms: u64,
    ) {
        // 从参数中解析设备ID（-s <serial>）
        let mut parsed_device_id: Option<String> = None;
        let mut i = 0usize;
        while i < args.len() {
            if args[i] == "-s" {
                if i + 1 < args.len() {
                    parsed_device_id = Some(args[i + 1].clone());
                }
                break;
            }
            i += 1;
        }

        let adb_log = AdbCommandLog {
            command: command.to_string(),
            args: args.to_vec(),
            output: output.to_string(),
            error: error.map(|e| e.to_string()),
            exit_code,
            duration_ms,
            device_id: parsed_device_id.clone(),
            session_id: self.session_id.clone(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        };

        {
            let mut logs = self.adb_command_logs.lock().unwrap();
            if logs.len() >= self.max_entries {
                logs.pop_front();
            }
            logs.push_back(adb_log.clone());
        }

        // 实时发送到前端  
        if let Some(app_handle) = &self.app_handle {
            use crate::infrastructure::events::emit_and_trace;
            let _ = emit_and_trace(app_handle, "adb-command-log", &adb_log);
        }

        // 也作为普通日志记录
        self.add_log(
            "INFO",
            "DIAGNOSTIC",
            "AdbService",
            &format!("执行ADB命令: {} {:?}", command, args),
            Some(&serde_json::to_string(&adb_log).unwrap_or_default()),
            parsed_device_id.as_deref(),
        );
    }

    /// 获取所有日志
    pub fn get_logs(&self) -> Vec<LogEntry> {
        self.logs.lock().unwrap().iter().cloned().collect()
    }

    /// 获取ADB命令日志
    pub fn get_adb_command_logs(&self) -> Vec<AdbCommandLog> {
        self.adb_command_logs.lock().unwrap().iter().cloned().collect()
    }

    /// 清空日志
    pub fn clear_logs(&self) {
        self.logs.lock().unwrap().clear();
        self.adb_command_logs.lock().unwrap().clear();
        
        if let Some(app_handle) = &self.app_handle {
            use crate::infrastructure::events::emit_and_trace;
            let _ = emit_and_trace(app_handle, "logs-cleared", &());
        }
    }

    /// 按条件过滤日志
    pub fn get_filtered_logs(
        &self,
        level_filter: Option<Vec<String>>,
        category_filter: Option<Vec<String>>,
        source_filter: Option<Vec<String>>,
        start_time: Option<String>,
        end_time: Option<String>,
    ) -> Vec<LogEntry> {
        let logs = self.logs.lock().unwrap();
        
        logs.iter()
            .filter(|log| {
                // 按级别过滤
                if let Some(levels) = &level_filter {
                    if !levels.contains(&log.level) {
                        return false;
                    }
                }

                // 按分类过滤
                if let Some(categories) = &category_filter {
                    if !categories.contains(&log.category) {
                        return false;
                    }
                }

                // 按来源过滤
                if let Some(sources) = &source_filter {
                    if !sources.contains(&log.source) {
                        return false;
                    }
                }

                // 按时间过滤
                if let Some(start) = &start_time {
                    if log.timestamp < *start {
                        return false;
                    }
                }

                if let Some(end) = &end_time {
                    if log.timestamp > *end {
                        return false;
                    }
                }

                true
            })
            .cloned()
            .collect()
    }
}

// 创建全局日志收集器实例
lazy_static::lazy_static! {
    pub static ref LOG_COLLECTOR: LogCollector = LogCollector::new(1000);
}

// 便捷的日志记录宏
#[macro_export]
macro_rules! log_info {
    ($category:expr, $source:expr, $message:expr) => {
        crate::services::log_bridge::LOG_COLLECTOR.add_log("INFO", $category, $source, $message, None, None);
    };
    ($category:expr, $source:expr, $message:expr, $details:expr) => {
        crate::services::log_bridge::LOG_COLLECTOR.add_log("INFO", $category, $source, $message, Some($details), None);
    };
    ($category:expr, $source:expr, $message:expr, $details:expr, $device_id:expr) => {
        crate::services::log_bridge::LOG_COLLECTOR.add_log("INFO", $category, $source, $message, Some($details), Some($device_id));
    };
}

#[macro_export]
macro_rules! log_error {
    ($category:expr, $source:expr, $message:expr) => {
        crate::services::log_bridge::LOG_COLLECTOR.add_log("ERROR", $category, $source, $message, None, None);
    };
    ($category:expr, $source:expr, $message:expr, $details:expr) => {
        crate::services::log_bridge::LOG_COLLECTOR.add_log("ERROR", $category, $source, $message, Some($details), None);
    };
}

#[macro_export]
macro_rules! log_adb_command {
    ($command:expr, $args:expr, $output:expr, $error:expr, $exit_code:expr, $duration_ms:expr) => {
        crate::services::log_bridge::LOG_COLLECTOR.add_adb_command_log($command, $args, $output, $error, $exit_code, $duration_ms);
    };
}