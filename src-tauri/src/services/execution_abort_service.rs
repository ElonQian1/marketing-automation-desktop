#![allow(dead_code)]
#![allow(unused_variables)]
#![allow(unused_imports)]

// src-tauri/src/services/execution_abort_service.rs
// module: services | layer: services | role: 后端执行中止服务
// summary: 提供真正的后端 ADB 操作中止功能

use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::process::Command;
use serde::{Deserialize, Serialize};
use tauri::command;
use tracing::{info, warn, error};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AbortRequest {
    pub execution_id: String,
    pub reason: Option<String>,
    pub force: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AbortResult {
    pub success: bool,
    pub message: String,
    pub stopped_at: Option<StepLocation>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StepLocation {
    pub step_index: usize,
    pub step_name: String,
}

// 全局执行状态管理器
lazy_static::lazy_static! {
    static ref EXECUTION_MANAGER: Arc<Mutex<ExecutionManager>> = 
        Arc::new(Mutex::new(ExecutionManager::new()));
}

#[derive(Debug)]
pub struct ExecutionManager {
    // 当前活跃的执行ID
    active_executions: HashMap<String, ExecutionContext>,
}

#[derive(Debug)]
pub struct ExecutionContext {
    pub execution_id: String,
    pub device_id: String,
    pub started_at: std::time::Instant,
    pub current_step: Option<StepLocation>,
    pub should_abort: bool,
}

impl ExecutionManager {
    pub fn new() -> Self {
        Self {
            active_executions: HashMap::new(),
        }
    }

    pub fn register_execution(&mut self, execution_id: String, device_id: String) {
        info!("🎬 [执行管理器] 注册执行: {} (设备: {})", execution_id, device_id);
        
        let context = ExecutionContext {
            execution_id: execution_id.clone(),
            device_id,
            started_at: std::time::Instant::now(),
            current_step: None,
            should_abort: false,
        };

        self.active_executions.insert(execution_id, context);
    }

    pub fn update_current_step(&mut self, execution_id: &str, step: StepLocation) {
        if let Some(context) = self.active_executions.get_mut(execution_id) {
            context.current_step = Some(step);
        }
    }

    pub fn mark_for_abort(&mut self, execution_id: &str) -> bool {
        if let Some(context) = self.active_executions.get_mut(execution_id) {
            context.should_abort = true;
            info!("🛑 [执行管理器] 标记执行中止: {}", execution_id);
            true
        } else {
            warn!("⚠️ [执行管理器] 未找到执行: {}", execution_id);
            false
        }
    }

    pub fn should_abort(&self, execution_id: &str) -> bool {
        self.active_executions
            .get(execution_id)
            .map(|ctx| ctx.should_abort)
            .unwrap_or(false)
    }

    pub fn finish_execution(&mut self, execution_id: &str) -> Option<ExecutionContext> {
        info!("🏁 [执行管理器] 完成执行: {}", execution_id);
        self.active_executions.remove(execution_id)
    }

    pub fn list_active_executions(&self) -> Vec<&ExecutionContext> {
        self.active_executions.values().collect()
    }
}

/// 中止脚本执行
#[command]
pub async fn abort_script_execution(request: AbortRequest) -> Result<AbortResult, String> {
    info!("🛑 [中止服务] 收到中止请求: {:?}", request);

    let execution_id = &request.execution_id;
    let reason = request.reason.unwrap_or_else(|| "用户手动中止".to_string());
    let force = request.force.unwrap_or(false);

    // 1. 标记执行应当中止
    let (device_id, current_step) = {
        let mut manager = EXECUTION_MANAGER.lock().map_err(|e| {
            error!("❌ [中止服务] 获取执行管理器锁失败: {}", e);
            "无法获取执行管理器锁".to_string()
        })?;

        if !manager.mark_for_abort(execution_id) {
            return Ok(AbortResult {
                success: false,
                message: "没有找到指定的执行".to_string(),
                stopped_at: None,
            });
        }

        let context = manager.active_executions.get(execution_id);
        let device_id = context.as_ref().map(|c| c.device_id.clone()).unwrap_or_default();
        let current_step = context.as_ref().and_then(|c| c.current_step.clone());

        (device_id, current_step)
    };

    // 2. 尝试中止设备上的 ADB 操作
    let adb_abort_success = if force {
        force_kill_adb_operations(&device_id).await
    } else {
        graceful_abort_adb_operations(&device_id).await
    };

    if !adb_abort_success {
        warn!("⚠️ [中止服务] ADB 操作中止失败，但前端状态已标记中止");
    }

    // 3. 清理执行状态
    {
        let mut manager = EXECUTION_MANAGER.lock().map_err(|e| {
            error!("❌ [中止服务] 清理时获取执行管理器锁失败: {}", e);
            "无法清理执行状态".to_string()
        })?;
        manager.finish_execution(execution_id);
    }

    Ok(AbortResult {
        success: true,
        message: format!("执行已中止: {}", reason),
        stopped_at: current_step,
    })
}

/// 优雅中止 ADB 操作
async fn graceful_abort_adb_operations(device_id: &str) -> bool {
    info!("🔄 [ADB中止] 尝试优雅中止设备 {} 的操作", device_id);

    // 尝试发送中断信号给当前正在运行的 ADB 进程
    match Command::new("adb")
        .args(["-s", device_id, "shell", "input", "keyevent", "KEYCODE_BACK"])
        .output()
    {
        Ok(output) => {
            if output.status.success() {
                info!("✅ [ADB中止] 优雅中止成功 (发送返回键)");
                true
            } else {
                warn!("⚠️ [ADB中止] 优雅中止失败: {}", String::from_utf8_lossy(&output.stderr));
                false
            }
        }
        Err(e) => {
            error!("❌ [ADB中止] 优雅中止命令执行失败: {}", e);
            false
        }
    }
}

/// 强制终止 ADB 操作
async fn force_kill_adb_operations(device_id: &str) -> bool {
    info!("🔨 [ADB中止] 强制终止设备 {} 的操作", device_id);

    // 方法1: 终止设备上当前的操作
    let kill_current = Command::new("adb")
        .args(["-s", device_id, "shell", "pkill", "-f", "input"])
        .output();

    // 方法2: 重启 ADB 连接
    let restart_adb = Command::new("adb")
        .args(["disconnect", device_id])
        .output()
        .and_then(|_| {
            std::thread::sleep(std::time::Duration::from_millis(500));
            Command::new("adb")
                .args(["connect", device_id])
                .output()
        });

    match (kill_current, restart_adb) {
        (Ok(_), Ok(_)) => {
            info!("✅ [ADB中止] 强制终止成功");
            true
        }
        _ => {
            error!("❌ [ADB中止] 强制终止失败");
            false
        }
    }
}

/// 取消当前操作 (通用接口)
#[command]
pub async fn cancel_current_operation() -> Result<String, String> {
    info!("🔄 [通用中止] 取消当前操作");

    let active_executions = {
        let manager = EXECUTION_MANAGER.lock().map_err(|e| {
            error!("❌ [通用中止] 获取执行管理器锁失败: {}", e);
            "无法获取执行管理器锁".to_string()
        })?;
        manager.list_active_executions().iter().map(|ctx| ctx.execution_id.clone()).collect::<Vec<_>>()
    };

    if active_executions.is_empty() {
        return Ok("没有活跃的执行需要取消".to_string());
    }

    let mut results = Vec::new();
    for execution_id in active_executions {
        let request = AbortRequest {
            execution_id: execution_id.clone(),
            reason: Some("通用取消操作".to_string()),
            force: Some(false),
        };

        match abort_script_execution(request).await {
            Ok(_) => results.push(format!("✅ 取消执行: {}", execution_id)),
            Err(e) => results.push(format!("❌ 取消失败: {} - {}", execution_id, e)),
        }
    }

    Ok(results.join("; "))
}

/// 强制停止所有 ADB 操作
#[command]
pub async fn force_stop_all_adb_operations() -> Result<String, String> {
    info!("🔨 [强制停止] 停止所有 ADB 操作");

    // 1. 标记所有执行中止
    let device_ids = {
        let mut manager = EXECUTION_MANAGER.lock().map_err(|e| {
            error!("❌ [强制停止] 获取执行管理器锁失败: {}", e);
            "无法获取执行管理器锁".to_string()
        })?;

        let device_ids: Vec<String> = manager.active_executions
            .values()
            .map(|ctx| ctx.device_id.clone())
            .collect();

        // 标记所有执行中止
        for execution_id in manager.active_executions.keys().cloned().collect::<Vec<_>>() {
            manager.mark_for_abort(&execution_id);
        }

        device_ids
    };

    // 2. 强制终止所有设备的 ADB 操作
    let mut results = Vec::new();
    for device_id in device_ids {
        if force_kill_adb_operations(&device_id).await {
            results.push(format!("✅ 强制停止设备: {}", device_id));
        } else {
            results.push(format!("❌ 停止失败设备: {}", device_id));
        }
    }

    // 3. 清理所有执行状态
    {
        let mut manager = EXECUTION_MANAGER.lock().map_err(|e| {
            error!("❌ [强制停止] 清理时获取执行管理器锁失败: {}", e);
            "无法清理执行状态".to_string()
        })?;
        manager.active_executions.clear();
    }

    if results.is_empty() {
        Ok("没有需要停止的操作".to_string())
    } else {
        Ok(results.join("; "))
    }
}

/// 检查执行是否应当中止 (供其他模块调用)
pub fn should_abort_execution(execution_id: &str) -> bool {
    EXECUTION_MANAGER
        .lock()
        .map(|manager| manager.should_abort(execution_id))
        .unwrap_or(false)
}

/// 注册新的执行 (供其他模块调用)
pub fn register_execution(execution_id: String, device_id: String) {
    if let Ok(mut manager) = EXECUTION_MANAGER.lock() {
        manager.register_execution(execution_id, device_id);
    }
}

/// 完成执行 (供其他模块调用)
pub fn finish_execution(execution_id: &str) {
    if let Ok(mut manager) = EXECUTION_MANAGER.lock() {
        manager.finish_execution(execution_id);
    }
}