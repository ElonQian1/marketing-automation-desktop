use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::process::Command;
use std::time::Duration;
use tauri::command;
use tokio::time::sleep;
use tracing::{error, info, warn};
use crate::infra::adb::input_injector::{AdbShellInputInjector, InputInjector};
use crate::infra::adb::safe_input_injector::SafeInputInjector;

// 操作类型枚举
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ActionType {
    Tap,
    Swipe,
    Input,
    Wait,
    FindElement,
    CheckCondition,
    WaitForElement,  // 等待元素出现
    CheckPageState,  // 检查页面状态
    Loop,
    IfCondition,
    Screenshot,
    OpenApp,
}

// 脚本步骤结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScriptStep {
    pub id: String,
    pub r#type: ActionType,
    pub name: String,
    pub description: String,
    pub parameters: serde_json::Value,
    pub enabled: bool,
    pub order: u32,
}

// 脚本执行结果
#[derive(Debug, Serialize, Deserialize)]
pub struct ScriptExecutionResult {
    pub success: bool,
    pub total_steps: u32,
    pub executed_steps: u32,
    pub failed_steps: u32,
    pub duration: u64,
    pub logs: Vec<ExecutionLog>,
    pub message: String,
}

// 执行日志
#[derive(Debug, Serialize, Deserialize)]
pub struct ExecutionLog {
    pub step_id: String,
    pub step_name: String,
    pub status: ExecutionStatus,
    pub message: String,
    pub timestamp: String,
    pub duration: u64,
}

// 执行状态
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ExecutionStatus {
    Pending,
    Running,
    Success,
    Failed,
    Skipped,
}

// 脚本执行器
pub struct ScriptExecutor {
    device_id: String,
    adb_path: String,
}

impl ScriptExecutor {
    pub fn new(device_id: String) -> Self {
        let adb_path = crate::utils::adb_utils::get_adb_path();
        
        Self {
            device_id,
            adb_path,
        }
    }

    // 执行完整脚本
    pub async fn execute_script(&self, steps: Vec<ScriptStep>) -> Result<ScriptExecutionResult> {
        let start_time = std::time::Instant::now();
        let mut logs = Vec::new();
        let mut executed_steps = 0;
        let mut failed_steps = 0;
        
        info!("🚀 开始执行脚本，总共 {} 个步骤", steps.len());

        // 过滤启用的步骤并按顺序排序
        let mut enabled_steps: Vec<_> = steps.into_iter()
            .filter(|step| step.enabled)
            .collect();
        enabled_steps.sort_by_key(|step| step.order);

        for (index, step) in enabled_steps.iter().enumerate() {
            let step_start = std::time::Instant::now();
            
            info!("📋 执行步骤 {}/{}: {}", index + 1, enabled_steps.len(), step.name);

            let log = match self.execute_single_step(step).await {
                Ok(()) => {
                    executed_steps += 1;
                    ExecutionLog {
                        step_id: step.id.clone(),
                        step_name: step.name.clone(),
                        status: ExecutionStatus::Success,
                        message: "执行成功".to_string(),
                        timestamp: chrono::Utc::now().to_rfc3339(),
                        duration: step_start.elapsed().as_millis() as u64,
                    }
                }
                Err(e) => {
                    failed_steps += 1;
                    error!("❌ 步骤执行失败: {}", e);
                    ExecutionLog {
                        step_id: step.id.clone(),
                        step_name: step.name.clone(),
                        status: ExecutionStatus::Failed,
                        message: format!("执行失败: {}", e),
                        timestamp: chrono::Utc::now().to_rfc3339(),
                        duration: step_start.elapsed().as_millis() as u64,
                    }
                }
            };

            logs.push(log);

            // 如果失败且不是条件检查类型，可以选择继续或停止
            if failed_steps > 0 && !matches!(step.r#type, ActionType::CheckCondition) {
                warn!("⚠️ 步骤失败，继续执行下一步");
            }
        }

        let total_duration = start_time.elapsed().as_secs();
        let success = failed_steps == 0 && executed_steps > 0;

        let result = ScriptExecutionResult {
            success,
            total_steps: enabled_steps.len() as u32,
            executed_steps,
            failed_steps,
            duration: total_duration,
            logs,
            message: if success {
                format!("脚本执行成功！共执行 {} 个步骤，耗时 {}秒", executed_steps, total_duration)
            } else {
                format!("脚本执行完成，{} 个成功，{} 个失败", executed_steps, failed_steps)
            },
        };

        info!("✅ 脚本执行完成: {}", result.message);
        Ok(result)
    }

    // 执行单个步骤
    async fn execute_single_step(&self, step: &ScriptStep) -> Result<()> {
        match step.r#type {
            ActionType::Tap => self.execute_tap(step).await,
            ActionType::Swipe => self.execute_swipe(step).await,
            ActionType::Input => self.execute_input(step).await,
            ActionType::Wait => self.execute_wait(step).await,
            ActionType::FindElement => self.execute_find_element(step).await,
            ActionType::CheckCondition => self.execute_check_condition(step).await,
            ActionType::WaitForElement => self.execute_wait_for_element(step).await,
            ActionType::CheckPageState => self.execute_check_page_state(step).await,
            ActionType::Screenshot => self.execute_screenshot(step).await,
            ActionType::OpenApp => self.execute_open_app(step).await,
            _ => {
                warn!("不支持的操作类型: {:?}", step.r#type);
                Err(anyhow::anyhow!("不支持的操作类型"))
            }
        }
    }

    // 执行点击操作
    async fn execute_tap(&self, step: &ScriptStep) -> Result<()> {
        let params = &step.parameters;
        let x = params["x"].as_i64().context("缺少x坐标")?;
        let y = params["y"].as_i64().context("缺少y坐标")?;
        let wait_after = params.get("wait_after")
            .and_then(|v| v.as_i64())
            .unwrap_or(1000);

        info!("👆 点击坐标: ({}, {})", x, y);
        // 优先通过统一注入器执行（injector-v1.0），失败则回退到原始命令
        let injector = SafeInputInjector::from_env(AdbShellInputInjector::new(self.adb_path.clone()));
        let x_u32 = x as u32;
        let y_u32 = y as u32;
        info!("🐛 DEBUG: script_executor tap调用 - 原始坐标 x={}, y={}, 转换后 x_u32={}, y_u32={}", x, y, x_u32, y_u32);
        if let Err(e) = injector.tap(&self.device_id, x_u32, y_u32, None).await {
            warn!("🪄 injector-v1.0: 注入器点击失败，将回退旧命令。错误: {}", e);
            let output = Command::new(&self.adb_path)
                .args(&[
                    "-s", &self.device_id,
                    "shell", "input", "tap",
                    &x.to_string(), &y.to_string()
                ])
                .output()
                .context("执行点击命令失败")?;

            if !output.status.success() {
                let error_msg = String::from_utf8_lossy(&output.stderr);
                return Err(anyhow::anyhow!("点击命令执行失败: {}", error_msg));
            }
        } else {
            info!("🪄 injector-v1.0: tap 已通过统一注入器执行 x={}, y={}, longPress=None", x, y);
        }

        // 等待指定时间
        if wait_after > 0 {
            info!("⏱️ 等待 {}ms", wait_after);
            sleep(Duration::from_millis(wait_after as u64)).await;
        }

        Ok(())
    }

    // 执行滑动操作
    async fn execute_swipe(&self, step: &ScriptStep) -> Result<()> {
        let params = &step.parameters;
        let start_x = params["start_x"].as_i64().context("缺少起始X坐标")?;
        let start_y = params["start_y"].as_i64().context("缺少起始Y坐标")?;
        let end_x = params["end_x"].as_i64().context("缺少结束X坐标")?;
        let end_y = params["end_y"].as_i64().context("缺少结束Y坐标")?;
        let duration = params.get("duration")
            .and_then(|v| v.as_i64())
            .unwrap_or(1000);

        info!("👋 滑动: ({}, {}) -> ({}, {}), 时长: {}ms", start_x, start_y, end_x, end_y, duration);

        // 优先通过统一注入器执行（injector-v1.0），失败则回退到原始命令
    let injector = SafeInputInjector::from_env(AdbShellInputInjector::new(self.adb_path.clone()));
        if let Err(e) = injector.swipe(
            &self.device_id,
            start_x as u32,
            start_y as u32,
            end_x as u32,
            end_y as u32,
            duration as u32,
        ).await {
            warn!("🪄 injector-v1.0: 注入器执行失败，将回退旧命令。错误: {}", e);
            let output = Command::new(&self.adb_path)
                .args(&[
                    "-s", &self.device_id,
                    "shell", "input", "swipe",
                    &start_x.to_string(), &start_y.to_string(),
                    &end_x.to_string(), &end_y.to_string(),
                    &duration.to_string()
                ])
                .output()
                .context("执行滑动命令失败")?;

            if !output.status.success() {
                let error_msg = String::from_utf8_lossy(&output.stderr);
                return Err(anyhow::anyhow!("滑动命令执行失败: {}", error_msg));
            }
        } else {
            info!("🪄 injector-v1.0: swipe 已通过统一注入器执行");
        }

        // 滑动后额外等待
        sleep(Duration::from_millis(500)).await;

        Ok(())
    }

    // 执行输入操作
    async fn execute_input(&self, step: &ScriptStep) -> Result<()> {
        let params = &step.parameters;
        let text = params["text"].as_str().context("缺少输入文本")?;
        let clear_first = params.get("clear_first")
            .and_then(|v| v.as_bool())
            .unwrap_or(true);

        info!("⌨️ 输入文本: {}", text);

        // 如果需要先清空
        if clear_first {
            info!("🧹 先清空当前输入");
            let injector = SafeInputInjector::from_env(AdbShellInputInjector::new(self.adb_path.clone()));
            // 先尝试注入器发送全选
            let ctrl_a_ok = match injector.keyevent_symbolic(&self.device_id, "KEYCODE_CTRL_A").await {
                Ok(()) => { info!("🪄 injector-v1.0: KEYCODE_CTRL_A 已通过统一注入器执行"); true },
                Err(e) => {
                    warn!("🪄 injector-v1.0: 注入器 KEYCODE_CTRL_A 失败，将回退旧命令。错误: {}", e);
                    let out = Command::new(&self.adb_path)
                        .args(&["-s", &self.device_id, "shell", "input", "keyevent", "KEYCODE_CTRL_A"])
                        .output()
                        .context("清空输入失败")?;
                    out.status.success()
                }
            };
            if ctrl_a_ok { sleep(Duration::from_millis(200)).await; }

            // 再尝试删除
            let _ = match injector.keyevent_symbolic(&self.device_id, "KEYCODE_DEL").await {
                Ok(()) => { info!("🪄 injector-v1.0: KEYCODE_DEL 已通过统一注入器执行"); Ok(()) },
                Err(e) => {
                    warn!("🪄 injector-v1.0: 注入器 KEYCODE_DEL 失败，将回退旧命令。错误: {}", e);
                    Command::new(&self.adb_path)
                        .args(&["-s", &self.device_id, "shell", "input", "keyevent", "KEYCODE_DEL"])
                        .output()
                        .context("删除文本失败").map(|_| ())
                }
            };
        }

        // 输入文本：优先统一注入器，失败则回退
    let injector = SafeInputInjector::from_env(AdbShellInputInjector::new(self.adb_path.clone()));
        if let Err(e) = injector.input_text(&self.device_id, text).await {
            warn!("🪄 injector-v1.0: 注入器输入失败，将回退旧命令。错误: {}", e);
            let output = Command::new(&self.adb_path)
                .args(&[
                    "-s", &self.device_id,
                    "shell", "input", "text",
                    text
                ])
                .output()
                .context("执行输入命令失败")?;

            if !output.status.success() {
                let error_msg = String::from_utf8_lossy(&output.stderr);
                return Err(anyhow::anyhow!("输入命令执行失败: {}", error_msg));
            }
        } else {
            info!("🪄 injector-v1.0: text 已通过统一注入器执行");
        }

        Ok(())
    }

    // 执行等待操作
    async fn execute_wait(&self, step: &ScriptStep) -> Result<()> {
        let params = &step.parameters;
        let duration = params["duration"].as_i64().context("缺少等待时长")?;

        info!("⏱️ 等待 {}ms", duration);
        sleep(Duration::from_millis(duration as u64)).await;

        Ok(())
    }

    // 执行查找元素操作
    async fn execute_find_element(&self, step: &ScriptStep) -> Result<()> {
        let params = &step.parameters;
        let text = params["text"].as_str().context("缺少查找文本")?;
        let click_if_found = params.get("click_if_found")
            .and_then(|v| v.as_bool())
            .unwrap_or(true);
        let _timeout = params.get("timeout")
            .and_then(|v| v.as_i64())
            .unwrap_or(5000);

        info!("🔍 查找元素: {}", text);

        // 获取UI dump
        let output = Command::new(&self.adb_path)
            .args(&[
                "-s", &self.device_id,
                "shell", "uiautomator", "dump", "/dev/stdout"
            ])
            .output()
            .context("获取UI信息失败")?;

        let ui_content = String::from_utf8_lossy(&output.stdout);
        
        // 简单的文本查找
        if ui_content.contains(text) {
            info!("✅ 找到元素: {}", text);
            
            if click_if_found {
                // 这里可以集成更复杂的坐标查找逻辑
                info!("👆 元素找到，但坐标查找功能待实现");
                return Ok(());
            }
        } else {
            return Err(anyhow::anyhow!("未找到元素: {}", text));
        }

        Ok(())
    }

    // 执行条件检查
    async fn execute_check_condition(&self, step: &ScriptStep) -> Result<()> {
        let params = &step.parameters;
        let condition_text = params["condition_text"].as_str().context("缺少检查条件")?;

        info!("✅ 检查条件: {}", condition_text);

        // 获取UI dump
        let output = Command::new(&self.adb_path)
            .args(&[
                "-s", &self.device_id,
                "shell", "uiautomator", "dump", "/dev/stdout"
            ])
            .output()
            .context("获取UI信息失败")?;

        let ui_content = String::from_utf8_lossy(&output.stdout);
        let condition_met = ui_content.contains(condition_text);

        if condition_met {
            info!("✅ 条件满足: {}", condition_text);
        } else {
            info!("❌ 条件不满足: {}", condition_text);
        }

        Ok(())
    }

    // 执行截图操作
    async fn execute_screenshot(&self, _step: &ScriptStep) -> Result<()> {
        info!("📸 执行截图");

        let output = Command::new(&self.adb_path)
            .args(&[
                "-s", &self.device_id,
                "shell", "screencap", "/sdcard/script_screenshot.png"
            ])
            .output()
            .context("执行截图命令失败")?;

        if !output.status.success() {
            let error_msg = String::from_utf8_lossy(&output.stderr);
            return Err(anyhow::anyhow!("截图命令执行失败: {}", error_msg));
        }

        info!("✅ 截图已保存到设备");
        Ok(())
    }

    // 执行打开应用操作
    async fn execute_open_app(&self, step: &ScriptStep) -> Result<()> {
        let params = &step.parameters;
        let package_name = params["package_name"].as_str().context("缺少应用包名")?;

        info!("📱 打开应用: {}", package_name);

        let output = Command::new(&self.adb_path)
            .args(&[
                "-s", &self.device_id,
                "shell", "monkey", "-p", package_name, "-c", "android.intent.category.LAUNCHER", "1"
            ])
            .output()
            .context("执行打开应用命令失败")?;

        if !output.status.success() {
            let error_msg = String::from_utf8_lossy(&output.stderr);
            return Err(anyhow::anyhow!("打开应用命令执行失败: {}", error_msg));
        }

        // 等待应用启动
        sleep(Duration::from_millis(3000)).await;

        Ok(())
    }

    // 执行等待元素操作
    async fn execute_wait_for_element(&self, step: &ScriptStep) -> Result<()> {
        let params = &step.parameters;
        let condition_type = params["condition_type"].as_str().context("缺少条件类型")?;
        let selector = params["selector"].as_str().context("缺少选择器")?;
        let timeout_ms = params.get("timeout")
            .and_then(|v| v.as_u64())
            .unwrap_or(10000);

        info!("⏳ 等待元素: {} = {}, 超时: {}ms", condition_type, selector, timeout_ms);

        // 临时禁用：等待重构为使用 universal_ui_page_analyzer
        warn!("⚠️ 等待元素功能暂时不可用，正在重构中");
        return Err(anyhow::anyhow!("等待元素功能暂时不可用"));
    }

    // 执行页面状态检查
    async fn execute_check_page_state(&self, step: &ScriptStep) -> Result<()> {
        let params = &step.parameters;
        let indicators = params["indicators"].as_array()
            .context("缺少页面指示器列表")?
            .iter()
            .filter_map(|v| v.as_str())
            .collect::<Vec<_>>();

        info!("🔍 检查页面状态，指示器数量: {}", indicators.len());

        // 临时禁用：等待重构为使用 universal_ui_page_analyzer
        warn!("⚠️ 页面状态检查功能暂时不可用，正在重构中");
        return Err(anyhow::anyhow!("页面状态检查功能暂时不可用"));
    }
}

// Tauri命令: 执行脚本
#[command]
pub async fn execute_automation_script(
    device_id: String,
    steps: Vec<ScriptStep>,
) -> Result<ScriptExecutionResult, String> {
    info!("🎯 收到脚本执行请求，设备: {}, 步骤数: {}", device_id, steps.len());

    let executor = ScriptExecutor::new(device_id);
    
    match executor.execute_script(steps).await {
        Ok(result) => {
            info!("✅ 脚本执行完成: {}", result.message);
            Ok(result)
        }
        Err(e) => {
            error!("❌ 脚本执行失败: {}", e);
            Err(format!("脚本执行失败: {}", e))
        }
    }
}

// Tauri命令: 验证设备连接
#[command]
pub async fn validate_device_connection(device_id: String) -> Result<bool, String> {
    let adb_path = crate::utils::adb_utils::get_adb_path();
    
    let output = Command::new(&adb_path)
        .args(&["-s", &device_id, "shell", "echo", "test"])
        .output()
        .map_err(|e| format!("设备连接验证失败: {}", e))?;

    Ok(output.status.success())
}