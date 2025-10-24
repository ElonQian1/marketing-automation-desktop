use super::core::AdbService;
use crate::infra::adb::input_helper::{tap_safe_injector_first, swipe_safe_injector_first, input_text_injector_first};
use crate::utils::adb_utils::get_adb_path;

impl AdbService {
    /// 获取设备UI层次结构（XML格式）
    /// 用于智能元素查找、UI分析等自动化操作
    pub async fn dump_ui_hierarchy(&self, device_id: &str) -> Result<String, Box<dyn std::error::Error>> {
        // 首先在设备上生成UI dump文件 (使用shell命令)
        let dump_result = self.execute_adb_command(device_id, "shell uiautomator dump /sdcard/ui_hierarchy.xml").await?;
        
        // 检测是否出现反自动化保护错误（如抖音等应用）
        if dump_result.contains("ERROR: could not get idle state") || 
           dump_result.contains("Timeout") ||
           dump_result.contains("Permission denied") {
            return Err(format!("UI dump failed due to app protection: {}", dump_result.trim()).into());
        }
        
        // 检查是否成功生成了dump文件
        if !dump_result.contains("UI hierchary dumped to:") && !dump_result.is_empty() {
            return Err(format!("UI dump may have failed: {}", dump_result.trim()).into());
        }
        
        // 然后拉取文件内容 (使用shell命令)
        let content = self.execute_adb_command(device_id, "shell cat /sdcard/ui_hierarchy.xml").await?;
        
        // 验证XML内容的有效性
        if content.trim().is_empty() {
            return Err("UI dump file is empty".into());
        }
        
        if !content.trim_start().starts_with("<?xml") {
            return Err(format!("Invalid XML content, possibly due to app protection: {}", 
                              content.chars().take(100).collect::<String>()).into());
        }
        
        Ok(content)
    }

    /// 获取当前Activity信息
    pub async fn get_current_activity(&self, device_id: &str) -> Result<String, Box<dyn std::error::Error>> {
        self.execute_adb_command(device_id, "shell dumpsys activity activities | grep mCurrentFocus").await
    }

    /// 获取屏幕尺寸
    pub async fn get_screen_size(&self, device_id: &str) -> Result<String, Box<dyn std::error::Error>> {
        self.execute_adb_command(device_id, "shell wm size").await
    }

    /// 点击屏幕坐标
    pub async fn tap_screen(&self, device_id: &str, x: i32, y: i32) -> Result<String, Box<dyn std::error::Error>> {
        let adb_path = get_adb_path();
        tap_safe_injector_first(&adb_path, device_id, x, y, None).await?;
        Ok("OK".to_string())
    }

    /// 长按屏幕坐标
    pub async fn long_press(&self, device_id: &str, x: i32, y: i32, duration_ms: u32) -> Result<String, Box<dyn std::error::Error>> {
        let adb_path = get_adb_path();
        swipe_safe_injector_first(&adb_path, device_id, x, y, x, y, duration_ms).await?;
        Ok("OK".to_string())
    }

    /// 输入文本
    pub async fn input_text(&self, device_id: &str, text: &str) -> Result<String, Box<dyn std::error::Error>> {
        let adb_path = get_adb_path();
        input_text_injector_first(&adb_path, device_id, text).await?;
        Ok("OK".to_string())
    }

    /// 按键事件
    pub async fn key_event(&self, device_id: &str, keycode: i32) -> Result<String, Box<dyn std::error::Error>> {
        let command = format!("shell input keyevent {}", keycode);
        self.execute_adb_command(device_id, &command).await
    }

    /// 滑动屏幕
    pub async fn swipe_screen(&self, device_id: &str, x1: i32, y1: i32, x2: i32, y2: i32, duration_ms: u32) -> Result<String, Box<dyn std::error::Error>> {
        let adb_path = get_adb_path();
        swipe_safe_injector_first(&adb_path, device_id, x1, y1, x2, y2, duration_ms).await?;
        Ok("OK".to_string())
    }
}