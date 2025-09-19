use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::command;
use tracing::{error, info, warn, debug};

use crate::services::adb_session_manager::get_device_session;
use crate::services::error_handling::{ErrorHandler, ErrorHandlingConfig};

#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SmartActionType {
    Tap,
    Input,
    Wait,
    SmartTap,
    SmartFindElement,
    RecognizePage,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmartScriptStep {
    pub id: String,
    pub step_type: SmartActionType,
    pub name: String,
    pub description: String,
    pub parameters: serde_json::Value,
    pub enabled: bool,
    pub order: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SingleStepTestResult {
    pub success: bool,
    pub step_id: String,
    pub step_name: String,
    pub message: String,
    pub duration_ms: u64,
    pub timestamp: i64,
    pub page_state: Option<String>,
    pub ui_elements: Vec<serde_json::Value>,
    pub logs: Vec<String>,
    pub error_details: Option<String>,
    pub extracted_data: std::collections::HashMap<String, serde_json::Value>,
}

pub struct SmartScriptExecutor {
    pub device_id: String,
    pub adb_path: String,
    error_handler: ErrorHandler,
}

impl SmartScriptExecutor {
    pub fn new(device_id: String) -> Self {
        let adb_path = crate::utils::adb_utils::get_adb_path();
        
        // 创建错误处理器配置
        let error_config = ErrorHandlingConfig {
            max_retries: 3,
            base_delay: std::time::Duration::from_millis(500),
            max_delay: std::time::Duration::from_secs(5),
            exponential_backoff: true,
            verbose_logging: true,
        };
        
        // 初始化错误处理器
        let error_handler = ErrorHandler::new(
            error_config,
            adb_path.clone(),
            Some(device_id.clone())
        );
        
        Self { 
            device_id, 
            adb_path,
            error_handler,
        }
    }

    pub async fn execute_single_step(&self, step: SmartScriptStep) -> Result<SingleStepTestResult> {
        let start_time = std::time::Instant::now();
        let timestamp = chrono::Utc::now().timestamp_millis();
        let mut logs = Vec::new();

        info!("🚀 开始单步测试: {} (设备: {})", step.name, self.device_id);
        logs.push(format!("🚀 开始执行步骤: {}", step.name));
        logs.push(format!("📱 目标设备: {}", self.device_id));
        logs.push(format!("🔧 步骤类型: {:?}", step.step_type));

        let result = match step.step_type {
            SmartActionType::Tap => self.test_tap(&step, &mut logs).await,
            SmartActionType::Wait => self.test_wait(&step, &mut logs).await,
            SmartActionType::Input => self.test_input(&step, &mut logs).await,
            SmartActionType::SmartTap => self.test_smart_tap(&step, &mut logs).await,
            SmartActionType::SmartFindElement => self.test_find_element(&step, &mut logs).await,
            SmartActionType::RecognizePage => self.test_recognize_page(&step, &mut logs).await,
        };

        let duration = start_time.elapsed().as_millis() as u64;

        match result {
            Ok(message) => {
                logs.push(format!("✅ 执行成功: {}", message));
                info!("✅ 步骤执行成功: {} (耗时: {}ms)", step.name, duration);
                Ok(SingleStepTestResult {
                    success: true,
                    step_id: step.id,
                    step_name: step.name,
                    message,
                    duration_ms: duration,
                    timestamp,
                    page_state: None,
                    ui_elements: Vec::new(),
                    logs,
                    error_details: None,
                    extracted_data: HashMap::new(),
                })
            }
            Err(e) => {
                let error_msg = e.to_string();
                logs.push(format!("❌ 执行失败: {}", error_msg));
                error!("❌ 步骤执行失败: {} - 错误: {} (耗时: {}ms)", step.name, error_msg, duration);
                Ok(SingleStepTestResult {
                    success: false,
                    step_id: step.id,
                    step_name: step.name,
                    message: "执行失败".to_string(),
                    duration_ms: duration,
                    timestamp,
                    page_state: None,
                    ui_elements: Vec::new(),
                    logs,
                    error_details: Some(error_msg),
                    extracted_data: HashMap::new(),
                })
            }
        }
    }

    async fn test_tap(&self, step: &SmartScriptStep, logs: &mut Vec<String>) -> Result<String> {
        logs.push("👆 通过ADB Shell会话执行点击测试（带错误处理）".to_string());
        
        let params: HashMap<String, serde_json::Value> = 
            serde_json::from_value(step.parameters.clone())?;
        
        let x = params["x"].as_i64().unwrap_or(0) as i32;
        let y = params["y"].as_i64().unwrap_or(0) as i32;
        
        logs.push(format!("📍 点击坐标: ({}, {})", x, y));
        
        // 使用带重试的点击执行
        match self.execute_click_with_retry(x, y, logs).await {
            Ok(output) => {
                logs.push(format!("📤 命令输出: {}", output.trim()));
                Ok("点击成功".to_string())
            }
            Err(e) => Err(e)
        }
    }

    async fn test_wait(&self, _step: &SmartScriptStep, logs: &mut Vec<String>) -> Result<String> {
        logs.push("执行等待测试".to_string());
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
        Ok("等待完成".to_string())
    }

    async fn test_input(&self, step: &SmartScriptStep, logs: &mut Vec<String>) -> Result<String> {
        logs.push("通过ADB Shell会话执行输入测试".to_string());
        
        let params: HashMap<String, serde_json::Value> = 
            serde_json::from_value(step.parameters.clone())?;
        
        let text = params["text"].as_str().unwrap_or("");
        logs.push(format!("输入文本: {}", text));
        
        // 使用ADB Shell长连接会话执行命令
        let session = get_device_session(&self.device_id).await?;
        let command = format!("input text '{}'", text);
        let output = session.execute_command(&command).await?;
        
        logs.push(format!("命令输出: {}", output));
        Ok("输入成功".to_string())
    }

    async fn test_smart_tap(&self, step: &SmartScriptStep, logs: &mut Vec<String>) -> Result<String> {
        logs.push("执行智能点击测试".to_string());
        
        let params: HashMap<String, serde_json::Value> = 
            serde_json::from_value(step.parameters.clone())?;
        
        // 获取应用包名（如果是启动小红书）
        if let Some(package_name) = params.get("package_name").and_then(|v| v.as_str()) {
            logs.push(format!("启动应用: {}", package_name));
            
            let session = get_device_session(&self.device_id).await?;
            let command = format!("am start -n {}/com.xingin.xhs.activity.SplashActivity", package_name);
            let output = session.execute_command(&command).await?;
            
            logs.push(format!("启动命令输出: {}", output));
            
            // 等待应用启动
            tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
            
            Ok("应用启动成功".to_string())
        } else {
            // 普通智能点击
            let x = params["x"].as_i64().unwrap_or(0) as i32;
            let y = params["y"].as_i64().unwrap_or(0) as i32;
            
            logs.push(format!("智能点击坐标: ({}, {})", x, y));
            
            let session = get_device_session(&self.device_id).await?;
            let command = format!("input tap {} {}", x, y);
            let output = session.execute_command(&command).await?;
            
            logs.push(format!("命令输出: {}", output));
            Ok("智能点击成功".to_string())
        }
    }

    async fn test_find_element(&self, step: &SmartScriptStep, logs: &mut Vec<String>) -> Result<String> {
        logs.push("🔍 执行智能元素查找测试（带错误处理）".to_string());
        
        // 执行UI dump操作，用传统的重试逻辑
        let ui_dump = self.execute_ui_dump_with_retry(logs).await?;
        
        let params: HashMap<String, serde_json::Value> = 
            serde_json::from_value(step.parameters.clone())?;
        
        // 记录查找参数
        logs.push("🎯 查找参数:".to_string());
        
        // 先尝试不同的查找方式，但无论哪种方式，最终都要执行点击
        let mut element_found = false;
        let mut find_method = String::new();
        
        if let Some(element_text) = params.get("element_text").and_then(|v| v.as_str()) {
            if !element_text.is_empty() {
                logs.push(format!("  📝 元素文本: {}", element_text));
                if ui_dump.contains(element_text) {
                    logs.push(format!("✅ 在UI中找到目标元素: {}", element_text));
                    element_found = true;
                    find_method = format!("通过文本: {}", element_text);
                } else {
                    logs.push(format!("❌ 未在UI中找到目标元素: {}", element_text));
                }
            }
        }
        
        if !element_found {
            if let Some(content_desc) = params.get("content_desc").and_then(|v| v.as_str()) {
                if !content_desc.is_empty() {
                    logs.push(format!("  📝 内容描述: {}", content_desc));
                    if ui_dump.contains(content_desc) {
                        logs.push(format!("✅ 在UI中找到目标元素 (通过content-desc): {}", content_desc));
                        element_found = true;
                        find_method = format!("通过content-desc: {}", content_desc);
                    } else {
                        logs.push(format!("❌ 未在UI中找到目标元素 (通过content-desc): {}", content_desc));
                    }
                }
            }
        }
        
        // 无论是否找到元素，如果有坐标信息，都执行点击操作
        if let Some(bounds) = params.get("bounds") {
            logs.push(format!("  📍 元素边界: {}", bounds));
            
            // 计算点击坐标（边界中心点）
            if let Some(bounds_obj) = bounds.as_object() {
                let left = bounds_obj.get("left").and_then(|v| v.as_i64()).unwrap_or(0) as i32;
                let top = bounds_obj.get("top").and_then(|v| v.as_i64()).unwrap_or(0) as i32;
                let right = bounds_obj.get("right").and_then(|v| v.as_i64()).unwrap_or(0) as i32;
                let bottom = bounds_obj.get("bottom").and_then(|v| v.as_i64()).unwrap_or(0) as i32;
                
                let center_x = (left + right) / 2;
                let center_y = (top + bottom) / 2;
                
                logs.push(format!("🎯 计算中心点坐标: ({}, {})", center_x, center_y));
                logs.push(format!("📊 原始边界: left={}, top={}, right={}, bottom={}", left, top, right, bottom));
                
                // 使用错误处理执行点击操作
                let click_result = self.execute_click_with_retry(center_x, center_y, logs).await;
                
                match click_result {
                    Ok(output) => {
                        logs.push(format!("� 点击命令输出: {}", output));
                        
                        let result_msg = if element_found {
                            format!("✅ 成功找到并点击元素: {} -> 坐标({}, {})", find_method, center_x, center_y)
                        } else {
                            format!("✅ 基于坐标点击元素: ({}, {}) (未在UI中确认元素存在)", center_x, center_y)
                        };
                        
                        Ok(result_msg)
                    }
                    Err(e) => {
                        logs.push(format!("❌ 点击操作失败: {}", e));
                        Err(e)
                    }
                }
            } else {
                logs.push("❌ 边界数据格式错误".to_string());
                Err(anyhow::anyhow!("边界数据格式错误"))
            }
        } else {
            if element_found {
                Ok(format!("✅ 找到元素但无坐标信息: {}", find_method))
            } else {
                logs.push("⚠️  未提供有效的查找参数".to_string());
                Ok("元素查找测试完成 (无查找条件)".to_string())
            }
        }
    }

    /// 带重试机制的 UI dump 执行
    async fn execute_ui_dump_with_retry(&self, logs: &mut Vec<String>) -> Result<String> {
        logs.push("📱 开始获取设备UI结构（带重试机制）...".to_string());
        
        let max_retries = 3;
        let mut last_error: Option<anyhow::Error> = None;
        
        for attempt in 1..=max_retries {
            if attempt > 1 {
                logs.push(format!("� 重试获取UI结构 - 第 {}/{} 次尝试", attempt, max_retries));
                
                // 重试前的恢复操作
                logs.push("🧹 清理旧的UI dump文件...".to_string());
                if let Ok(session) = get_device_session(&self.device_id).await {
                    let _ = session.execute_command("rm -f /sdcard/ui_dump.xml").await;
                }
                
                // 延迟重试
                let delay = std::time::Duration::from_millis(500 * attempt as u64);
                logs.push(format!("⏱️  等待 {:?} 后重试...", delay));
                tokio::time::sleep(delay).await;
            }
            
            match self.try_ui_dump().await {
                Ok(dump) => {
                    if !dump.is_empty() && !dump.contains("ERROR:") && !dump.contains("null root node") {
                        logs.push(format!("✅ UI结构获取成功，长度: {} 字符", dump.len()));
                        return Ok(dump);
                    } else {
                        let error_msg = format!("UI dump 内容异常: 空内容或包含错误信息 (尝试 {}/{})", attempt, max_retries);
                        logs.push(format!("⚠️  {}", error_msg));
                        last_error = Some(anyhow::anyhow!(error_msg));
                    }
                }
                Err(e) => {
                    let error_msg = format!("UI dump 执行失败: {} (尝试 {}/{})", e, attempt, max_retries);
                    logs.push(format!("❌ {}", error_msg));
                    last_error = Some(e);
                }
            }
        }
        
        logs.push(format!("❌ UI结构获取最终失败，已重试 {} 次", max_retries));
        Err(last_error.unwrap_or_else(|| anyhow::anyhow!("UI dump 获取失败")))
    }

    /// 尝试执行 UI dump
    async fn try_ui_dump(&self) -> Result<String> {
        let session = get_device_session(&self.device_id).await?;
        session.execute_command("uiautomator dump /sdcard/ui_dump.xml && cat /sdcard/ui_dump.xml").await
    }

    /// 带重试机制的点击执行
    async fn execute_click_with_retry(&self, x: i32, y: i32, logs: &mut Vec<String>) -> Result<String> {
        logs.push("👆 开始执行点击操作（带重试机制）...".to_string());
        
        let command = format!("input tap {} {}", x, y);
        let max_retries = 2;
        let mut last_error: Option<anyhow::Error> = None;
        
        for attempt in 1..=max_retries {
            if attempt > 1 {
                logs.push(format!("🔄 重试点击操作 - 第 {}/{} 次尝试", attempt, max_retries));
                tokio::time::sleep(std::time::Duration::from_millis(300)).await;
            }
            
            match self.try_click(&command).await {
                Ok(output) => {
                    // 短暂延迟确保点击生效
                    tokio::time::sleep(tokio::time::Duration::from_millis(200)).await;
                    logs.push("⏱️  点击后延迟200ms完成".to_string());
                    return Ok(output);
                }
                Err(e) => {
                    logs.push(format!("❌ 点击失败: {} (尝试 {}/{})", e, attempt, max_retries));
                    last_error = Some(e);
                }
            }
        }
        
        logs.push(format!("❌ 点击操作最终失败，已重试 {} 次", max_retries));
        Err(last_error.unwrap_or_else(|| anyhow::anyhow!("点击操作失败")))
    }

    /// 尝试执行点击
    async fn try_click(&self, command: &str) -> Result<String> {
        let session = get_device_session(&self.device_id).await?;
        session.execute_command(command).await
    }

    /// 获取错误处理统计信息
    pub fn get_error_handling_statistics(&self) -> String {
        self.error_handler.get_statistics()
    }

    /// 重置错误处理统计信息
    pub fn reset_error_handling_statistics(&mut self) {
        self.error_handler.reset_statistics();
    }

    async fn test_recognize_page(&self, step: &SmartScriptStep, logs: &mut Vec<String>) -> Result<String> {
        logs.push("执行页面识别测试".to_string());
        
        let session = get_device_session(&self.device_id).await?;
        
        // 获取当前Activity
        let current_activity = session.execute_command("dumpsys activity activities | grep mCurrentFocus").await?;
        logs.push(format!("当前Activity: {}", current_activity.trim()));
        
        // 获取UI结构进行页面识别
        let ui_dump = session.execute_command("uiautomator dump /sdcard/ui_dump.xml && cat /sdcard/ui_dump.xml").await?;
        
        let params: HashMap<String, serde_json::Value> = 
            serde_json::from_value(step.parameters.clone())?;
        
        if let Some(expected_page) = params.get("expected_page").and_then(|v| v.as_str()) {
            if ui_dump.contains(expected_page) || current_activity.contains(expected_page) {
                logs.push(format!("成功识别页面: {}", expected_page));
                Ok("页面识别成功".to_string())
            } else {
                logs.push(format!("页面识别失败，期望: {}", expected_page));
                Ok("页面识别完成，但未匹配预期".to_string())
            }
        } else {
            Ok("页面识别测试完成".to_string())
        }
    }

    async fn execute_adb_command(&self, args: &[&str]) -> Result<std::process::Output> {
        let mut cmd = std::process::Command::new(&self.adb_path);
        cmd.args(args);
        
        #[cfg(windows)]
        cmd.creation_flags(0x08000000);
        
        Ok(cmd.output()?)
    }
}

#[command]
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
        },
        Err(e) => {
            error!("❌ 单步测试失败: {} - 错误: {}", device_id, e);
            Err(format!("单步测试失败: {}", e))
        },
    }
}