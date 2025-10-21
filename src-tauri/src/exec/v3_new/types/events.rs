// src-tauri/src/exec/v3_new/types/events.rs
// module: exec | layer: domain | role: 事件系统定义
// summary: 统一的事件发射接口，解决参数不匹配问题

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use anyhow::Result;

/// 进度阶段枚举
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProgressPhase {
    /// 初始化阶段
    Initializing,
    /// UI转储中
    UiDumping,
    /// 元素定位中
    Locating,
    /// 策略匹配中
    Matching,
    /// 执行操作中
    Executing,
    /// 验证结果中
    Validating,
    /// 完成
    Completed,
    /// 失败
    Failed,
}

/// 统一的进度事件结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProgressEvent {
    pub device_id: String,
    pub phase: ProgressPhase,
    pub progress: f64,
    pub message: String,
    pub step_id: Option<String>,
    pub task_id: Option<String>,
    pub data: Option<serde_json::Value>,
}

/// 执行完成事件结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompleteEvent {
    pub device_id: String,
    pub task_id: String,
    pub success: bool,
    pub message: String,
    pub execution_time_ms: u64,
    pub result_data: Option<serde_json::Value>,
    pub summary: Option<ExecutionSummary>,
}

/// 执行摘要信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionSummary {
    pub total_steps: u32,
    pub successful_steps: u32,
    pub failed_steps: u32,
    pub total_time_ms: u64,
    pub final_success: bool,
}

/// 统一的事件发射器
pub struct V3EventEmitter;

impl V3EventEmitter {
    /// 发射进度事件
    pub async fn emit_progress(
        app: &AppHandle,
        device_id: &str,
        phase: ProgressPhase,
        progress: f64,
        message: &str,
        step_id: Option<&str>,
        task_id: Option<&str>,
        data: Option<serde_json::Value>,
    ) -> Result<()> {
        let event = ProgressEvent {
            device_id: device_id.to_string(),
            phase,
            progress,
            message: message.to_string(),
            step_id: step_id.map(|s| s.to_string()),
            task_id: task_id.map(|s| s.to_string()),
            data,
        };
        
        app.emit("analysis:progress", &event)
            .map_err(|e| anyhow::anyhow!("Failed to emit progress event: {}", e))?;
            
        tracing::debug!("📡 [V3] Progress: {:?} - {}", phase, message);
        Ok(())
    }
    
    /// 发射完成事件
    pub async fn emit_complete(
        app: &AppHandle,
        device_id: &str,
        task_id: &str,
        success: bool,
        message: &str,
        execution_time_ms: u64,
        result_data: Option<serde_json::Value>,
        summary: Option<ExecutionSummary>,
    ) -> Result<()> {
        let event = CompleteEvent {
            device_id: device_id.to_string(),
            task_id: task_id.to_string(),
            success,
            message: message.to_string(),
            execution_time_ms,
            result_data,
            summary,
        };
        
        app.emit("analysis:complete", &event)
            .map_err(|e| anyhow::anyhow!("Failed to emit complete event: {}", e))?;
            
        tracing::info!("🎉 [V3] Complete: {} - {}", if success { "SUCCESS" } else { "FAILED" }, message);
        Ok(())
    }
    
    /// 便捷方法：发射初始化进度
    pub async fn emit_initializing(
        app: &AppHandle,
        device_id: &str,
        task_id: &str,
        message: &str,
    ) -> Result<()> {
        Self::emit_progress(
            app,
            device_id,
            ProgressPhase::Initializing,
            0.0,
            message,
            None,
            Some(task_id),
            None,
        ).await
    }
    
    /// 便捷方法：发射UI转储进度
    pub async fn emit_ui_dumping(
        app: &AppHandle,
        device_id: &str,
        task_id: &str,
        progress: f64,
    ) -> Result<()> {
        Self::emit_progress(
            app,
            device_id,
            ProgressPhase::UiDumping,
            progress,
            "正在获取UI结构...",
            None,
            Some(task_id),
            None,
        ).await
    }
    
    /// 便捷方法：发射元素定位进度
    pub async fn emit_locating(
        app: &AppHandle,
        device_id: &str,
        task_id: &str,
        step_id: &str,
        progress: f64,
    ) -> Result<()> {
        Self::emit_progress(
            app,
            device_id,
            ProgressPhase::Locating,
            progress,
            "正在定位目标元素...",
            Some(step_id),
            Some(task_id),
            None,
        ).await
    }
    
    /// 便捷方法：发射策略匹配进度
    pub async fn emit_matching(
        app: &AppHandle,
        device_id: &str,
        task_id: &str,
        step_id: &str,
        strategy_name: &str,
    ) -> Result<()> {
        let data = serde_json::json!({
            "strategy_name": strategy_name
        });
        
        Self::emit_progress(
            app,
            device_id,
            ProgressPhase::Matching,
            50.0,
            &format!("正在执行策略: {}", strategy_name),
            Some(step_id),
            Some(task_id),
            Some(data),
        ).await
    }
    
    /// 便捷方法：发射执行操作进度
    pub async fn emit_executing(
        app: &AppHandle,
        device_id: &str,
        task_id: &str,
        step_id: &str,
        action: &str,
    ) -> Result<()> {
        let data = serde_json::json!({
            "action": action
        });
        
        Self::emit_progress(
            app,
            device_id,
            ProgressPhase::Executing,
            75.0,
            &format!("正在执行操作: {}", action),
            Some(step_id),
            Some(task_id),
            Some(data),
        ).await
    }
    
    /// 便捷方法：发射验证结果进度
    pub async fn emit_validating(
        app: &AppHandle,
        device_id: &str,
        task_id: &str,
        step_id: &str,
    ) -> Result<()> {
        Self::emit_progress(
            app,
            device_id,
            ProgressPhase::Validating,
            90.0,
            "正在验证执行结果...",
            Some(step_id),
            Some(task_id),
            None,
        ).await
    }
}