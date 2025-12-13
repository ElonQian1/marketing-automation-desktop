// src-tauri/src/core/application/device_service.rs
// module: core/application | layer: application | role: device-use-cases
// summary: 设备应用服务 - 设备管理相关用例，桥接到 ADB 和 UI Dump 模块

use std::process::Command;
use tracing::{info, warn, error};

use crate::core::domain::device::{Device, DeviceStatus};
use crate::core::shared::{CoreError, CoreResult, error::ErrorCode};

/// 设备应用服务
pub struct DeviceAppService {
    adb_path: String,
}

impl DeviceAppService {
    pub fn new() -> Self {
        Self {
            adb_path: crate::utils::adb_utils::get_adb_path(),
        }
    }

    /// 获取设备列表
    /// 
    /// 通过 ADB 命令获取连接的设备
    pub async fn list_devices(&self) -> CoreResult<Vec<Device>> {
        info!("📱 获取设备列表");
        
        let output = self.execute_adb_command(&["devices"]).await?;
        
        let devices: Vec<Device> = output
            .lines()
            .skip(1) // 跳过 "List of devices attached" 行
            .filter_map(|line| {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 2 {
                    let device_id = parts[0].to_string();
                    let status = match parts[1] {
                        "device" => DeviceStatus::Connected,
                        "offline" => DeviceStatus::Offline,
                        "unauthorized" => DeviceStatus::Unauthorized,
                        _ => DeviceStatus::Disconnected,
                    };
                    Some(Device {
                        id: device_id.clone(),
                        name: device_id.clone(),
                        model: "Unknown".to_string(),
                        status,
                        android_version: "Unknown".to_string(),
                        screen_resolution: (1080, 1920),
                    })
                } else {
                    None
                }
            })
            .collect();
        
        info!("📱 找到 {} 个设备", devices.len());
        Ok(devices)
    }

    /// 获取设备详情
    pub async fn get_device(&self, device_id: &str) -> CoreResult<Device> {
        info!("📱 获取设备详情: {}", device_id);
        
        // 获取设备属性
        let model = self.get_device_property(device_id, "ro.product.model").await
            .unwrap_or_else(|_| "Unknown".to_string());
        let android_version = self.get_device_property(device_id, "ro.build.version.release").await
            .unwrap_or_else(|_| "Unknown".to_string());
        
        Ok(Device {
            id: device_id.to_string(),
            name: model.clone(),
            model,
            status: DeviceStatus::Connected,
            android_version,
            screen_resolution: (1080, 1920),
        })
    }

    /// 获取设备屏幕内容（UI Dump）
    /// 
    /// 通过 uiautomator 命令获取屏幕 XML
    pub async fn get_screen_content(&self, device_id: &str) -> CoreResult<String> {
        info!("📸 获取设备屏幕: {}", device_id);
        
        // 使用 exec-out 模式（更高效）
        let result = self.execute_adb_command(&[
            "-s", device_id,
            "exec-out", "uiautomator", "dump", "/dev/tty"
        ]).await;
        
        match result {
            Ok(xml) => {
                // 验证 XML 格式
                if xml.contains("<hierarchy") && xml.contains("</hierarchy>") {
                    info!("📸 屏幕内容获取成功: {} 字符", xml.len());
                    Ok(xml)
                } else {
                    // 尝试使用传统 dump+pull 模式
                    self.get_screen_content_legacy(device_id).await
                }
            }
            Err(_) => {
                self.get_screen_content_legacy(device_id).await
            }
        }
    }
    
    /// 传统方式获取屏幕内容
    async fn get_screen_content_legacy(&self, device_id: &str) -> CoreResult<String> {
        // 先 dump 到设备
        let _ = self.execute_adb_command(&[
            "-s", device_id,
            "shell", "uiautomator", "dump", "/sdcard/ui_dump.xml"
        ]).await?;
        
        // 再 cat 内容
        let xml = self.execute_adb_command(&[
            "-s", device_id,
            "shell", "cat", "/sdcard/ui_dump.xml"
        ]).await?;
        
        if xml.contains("<hierarchy") {
            Ok(xml)
        } else {
            Err(CoreError::new(
                ErrorCode::DeviceError,
                "无法获取屏幕内容"
            ))
        }
    }
    
    /// 获取设备属性
    async fn get_device_property(&self, device_id: &str, property: &str) -> CoreResult<String> {
        let output = self.execute_adb_command(&[
            "-s", device_id,
            "shell", "getprop", property
        ]).await?;
        
        Ok(output.trim().to_string())
    }
    
    /// 执行 ADB 命令
    async fn execute_adb_command(&self, args: &[&str]) -> CoreResult<String> {
        let mut cmd = Command::new(&self.adb_path);
        cmd.args(args);
        
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
        }
        
        match cmd.output() {
            Ok(output) => {
                if output.status.success() {
                    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
                    Ok(stdout)
                } else {
                    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
                    error!("❌ ADB 命令失败: {}", stderr);
                    Err(CoreError::new(
                        ErrorCode::DeviceError,
                        format!("ADB 命令失败: {}", stderr)
                    ))
                }
            }
            Err(e) => {
                error!("❌ 无法执行 ADB: {}", e);
                Err(CoreError::new(
                    ErrorCode::DeviceError,
                    format!("无法执行 ADB: {}", e)
                ))
            }
        }
    }
}

impl Default for DeviceAppService {
    fn default() -> Self {
        Self::new()
    }
}
