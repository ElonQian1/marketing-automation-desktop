// src-tauri/src/services/action_executor.rs
// module: services | layer: services | role: 操作执行器
// summary: 统一的UI操作执行器，支持多种操作类型

use std::time::Instant;
use crate::types::action_types::*;
use crate::services::adb::commands::adb_shell::safe_adb_shell_command;

/// 操作执行器
pub struct ActionExecutor {
    /// ADB连接超时时间
    timeout: u64,
}

impl ActionExecutor {
    pub fn new() -> Self {
        Self {
            timeout: 10000, // 默认10秒超时
        }
    }

    pub fn with_timeout(mut self, timeout: u64) -> Self {
        self.timeout = timeout;
        self
    }

    /// 执行操作
    pub async fn execute_action(
        &self,
        action: &ActionType,
        context: &ActionContext,
    ) -> Result<ActionResult, String> {
        let start_time = Instant::now();
        
        tracing::info!("🎯 [ActionExecutor] 开始执行操作: {}", action.type_id());
        tracing::debug!("操作详情: {}", action.description());

        let result = match action {
            ActionType::Click => self.execute_click(context).await,
            ActionType::LongPress { duration } => self.execute_long_press(context, *duration).await,
            ActionType::Input { text, clear_before } => {
                self.execute_input(context, text, clear_before.unwrap_or(false)).await
            }
            ActionType::SwipeUp { distance, duration } => {
                self.execute_swipe(context, "up", *distance, *duration).await
            }
            ActionType::SwipeDown { distance, duration } => {
                self.execute_swipe(context, "down", *distance, *duration).await
            }
            ActionType::SwipeLeft { distance, duration } => {
                self.execute_swipe(context, "left", *distance, *duration).await
            }
            ActionType::SwipeRight { distance, duration } => {
                self.execute_swipe(context, "right", *distance, *duration).await
            }
            ActionType::ScrollTo { target_x, target_y, duration } => {
                self.execute_scroll_to(context, *target_x, *target_y, *duration).await
            }
            ActionType::Wait { duration } => {
                self.execute_wait(*duration).await
            }
        };

        let elapsed = start_time.elapsed().as_millis() as u64;

        match result {
            Ok(message) => {
                tracing::info!("✅ [ActionExecutor] 操作执行成功: {} (耗时: {}ms)", message, elapsed);
                Ok(ActionResult::success(message, elapsed))
            }
            Err(error) => {
                tracing::error!("❌ [ActionExecutor] 操作执行失败: {} (耗时: {}ms)", error, elapsed);
                Ok(ActionResult::failure(error, elapsed))
            }
        }
    }

    /// 执行点击操作
    async fn execute_click(&self, context: &ActionContext) -> Result<String, String> {
        let bounds = context.target_bounds.as_ref()
            .ok_or("点击操作需要元素边界信息")?;

        let x = bounds.center_x();
        let y = bounds.center_y();

        self.execute_tap_command(&context.device_id, x, y).await?;
        Ok(format!("成功点击坐标 ({}, {})", x, y))
    }

    /// 执行点击命令
    async fn execute_tap_command(&self, device_id: &str, x: i32, y: i32) -> Result<(), String> {
        let command = format!("input tap {} {}", x, y);
        safe_adb_shell_command(device_id.to_string(), command)
            .await
            .map_err(|e| format!("点击执行失败: {}", e))?;
        Ok(())
    }

    /// 执行长按操作
    async fn execute_long_press(&self, context: &ActionContext, duration: Option<u64>) -> Result<String, String> {
        let bounds = context.target_bounds.as_ref()
            .ok_or("长按操作需要元素边界信息")?;

        let x = bounds.center_x();
        let y = bounds.center_y();
        let hold_duration = duration.unwrap_or(2000);

        // 执行长按命令（使用 swipe 同位置模拟长按）
        let command = format!("input touchscreen swipe {} {} {} {} {}", x, y, x, y, hold_duration);
        safe_adb_shell_command(context.device_id.clone(), command)
            .await
            .map_err(|e| format!("长按操作失败: {}", e))?;

        Ok(format!("成功长按坐标 ({}, {}) {}ms", x, y, hold_duration))
    }

    /// 执行输入操作
    async fn execute_input(&self, context: &ActionContext, text: &str, clear_before: bool) -> Result<String, String> {
        let bounds = context.target_bounds.as_ref()
            .ok_or("输入操作需要元素边界信息")?;

        // 先点击输入框获取焦点
        let x = bounds.center_x();
        let y = bounds.center_y();
        self.execute_tap_command(&context.device_id, x, y).await?;

        // 等待获取焦点
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

        // 如果需要清空现有内容
        if clear_before {
            let clear_cmd = "input keyevent KEYCODE_CTRL_A".to_string();
            safe_adb_shell_command(context.device_id.clone(), clear_cmd)
                .await
                .map_err(|e| format!("清空命令执行失败: {}", e))?;
                
            tokio::time::sleep(tokio::time::Duration::from_millis(200)).await;
            
            let delete_cmd = "input keyevent KEYCODE_DEL".to_string();
            safe_adb_shell_command(context.device_id.clone(), delete_cmd)
                .await
                .map_err(|e| format!("删除命令执行失败: {}", e))?;
                
            tokio::time::sleep(tokio::time::Duration::from_millis(200)).await;
        }

        // 输入文本
        self.execute_text_input(&context.device_id, text).await?;
        
        let action_desc = if clear_before { "清空后输入" } else { "输入" };
        Ok(format!("成功{}: \"{}\"", action_desc, text))
    }

    /// 执行滑动操作
    async fn execute_swipe(
        &self,
        context: &ActionContext,
        direction: &str,
        distance: Option<u32>,
        duration: Option<u64>,
    ) -> Result<String, String> {
        let bounds = context.target_bounds.as_ref()
            .ok_or("滑动操作需要元素边界信息")?;

        let start_x = bounds.center_x();
        let start_y = bounds.center_y();
        let swipe_distance = distance.unwrap_or(200) as i32;
        let swipe_duration = duration.unwrap_or(300);

        let (end_x, end_y) = match direction {
            "up" => (start_x, start_y - swipe_distance),
            "down" => (start_x, start_y + swipe_distance),
            "left" => (start_x - swipe_distance, start_y),
            "right" => (start_x + swipe_distance, start_y),
            _ => return Err(format!("不支持的滑动方向: {}", direction)),
        };

        let cmd = format!(
            "adb -s {} shell input touchscreen swipe {} {} {} {} {}",
            context.device_id, start_x, start_y, end_x, end_y, swipe_duration
        );

        let output = tokio::process::Command::new("cmd")
            .args(&["/C", &cmd])
            .output()
            .await
            .map_err(|e| format!("ADB命令执行失败: {}", e))?;

        if !output.status.success() {
            let error = String::from_utf8_lossy(&output.stderr);
            return Err(format!("滑动操作失败: {}", error));
        }

        Ok(format!(
            "成功{}滑动 从({}, {})到({}, {}) {}像素",
            match direction {
                "up" => "向上",
                "down" => "向下", 
                "left" => "向左",
                "right" => "向右",
                _ => direction,
            },
            start_x, start_y, end_x, end_y, swipe_distance
        ))
    }

    /// 执行滚动操作
    async fn execute_scroll_to(
        &self,
        context: &ActionContext,
        target_x: i32,
        target_y: i32,
        duration: Option<u64>,
    ) -> Result<String, String> {
        let bounds = context.target_bounds.as_ref()
            .ok_or("滚动操作需要元素边界信息")?;

        let start_x = bounds.center_x();
        let start_y = bounds.center_y();
        let scroll_duration = duration.unwrap_or(500);

        let cmd = format!(
            "adb -s {} shell input touchscreen swipe {} {} {} {} {}",
            context.device_id, start_x, start_y, target_x, target_y, scroll_duration
        );

        let output = tokio::process::Command::new("cmd")
            .args(&["/C", &cmd])
            .output()
            .await
            .map_err(|e| format!("ADB命令执行失败: {}", e))?;

        if !output.status.success() {
            let error = String::from_utf8_lossy(&output.stderr);
            return Err(format!("滚动操作失败: {}", error));
        }

        Ok(format!("成功滚动到位置 ({}, {})", target_x, target_y))
    }

    /// 执行文本输入命令
    async fn execute_text_input(&self, device_id: &str, text: &str) -> Result<(), String> {
        // 转义文本中的特殊字符
        let escaped_text = text.replace(" ", "%s").replace("&", "\\&");
        let command = format!("input text '{}'", escaped_text);
        safe_adb_shell_command(device_id.to_string(), command)
            .await
            .map_err(|e| format!("文本输入失败: {}", e))?;
        Ok(())
    }

    /// 执行等待操作
    async fn execute_wait(&self, duration: u64) -> Result<String, String> {
        tracing::info!("⏳ 等待 {}ms", duration);
        tokio::time::sleep(tokio::time::Duration::from_millis(duration)).await;
        Ok(format!("等待完成 {}ms", duration))
    }
}

impl Default for ActionExecutor {
    fn default() -> Self {
        Self::new()
    }
}