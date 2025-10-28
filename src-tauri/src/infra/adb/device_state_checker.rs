// src-tauri/src/infra/adb/device_state_checker.rs
// module: adb | layer: infra | role: 设备状态检查器
// summary: 检查设备屏幕状态、前台应用等，用于诊断点击无响应问题

use anyhow::{Context, Result};
use tracing::{info, warn};

/// 设备屏幕状态
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ScreenState {
    /// 屏幕开启
    On,
    /// 屏幕关闭/休眠
    Off,
    /// 未知状态
    Unknown,
}

/// 设备状态信息
#[derive(Debug, Clone)]
pub struct DeviceStateInfo {
    /// 屏幕状态
    pub screen_state: ScreenState,
    /// 当前前台应用包名
    pub foreground_app: Option<String>,
    /// 是否锁屏
    pub is_locked: bool,
}

/// 设备状态检查器
pub struct DeviceStateChecker {
    adb_path: String,
}

impl DeviceStateChecker {
    pub fn new(adb_path: String) -> Self {
        Self { adb_path }
    }

    /// 检查设备屏幕状态
    pub async fn check_screen_state(&self, serial: &str) -> Result<ScreenState> {
        let adb_path = self.adb_path.clone();
        let serial = serial.to_string();

        let output = tokio::task::spawn_blocking(move || {
            let mut cmd = std::process::Command::new(&adb_path);
            cmd.args(&["-s", &serial, "shell", "dumpsys", "power"]);
            
            #[cfg(windows)]
            {
                use std::os::windows::process::CommandExt;
                cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
            }
            
            cmd.output()
        }).await?.context("执行 dumpsys power 失败")?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            warn!("⚠️ dumpsys power 执行失败: {}", stderr);
            return Ok(ScreenState::Unknown);
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        
        // 检查 mWakefulness 字段
        // Asleep = 屏幕关闭, Awake = 屏幕开启
        if stdout.contains("mWakefulness=Awake") {
            info!("🔍 [设备状态] 屏幕状态: 开启 (Awake)");
            Ok(ScreenState::On)
        } else if stdout.contains("mWakefulness=Asleep") || stdout.contains("mWakefulness=Dozing") {
            info!("🔍 [设备状态] 屏幕状态: 关闭/休眠 (Asleep/Dozing)");
            Ok(ScreenState::Off)
        } else {
            warn!("⚠️ [设备状态] 无法解析屏幕状态: {}", stdout.lines().take(5).collect::<Vec<_>>().join("; "));
            Ok(ScreenState::Unknown)
        }
    }

    /// 检查当前前台应用
    pub async fn check_foreground_app(&self, serial: &str) -> Result<Option<String>> {
        let adb_path = self.adb_path.clone();
        let serial = serial.to_string();

        let output = tokio::task::spawn_blocking(move || {
            let mut cmd = std::process::Command::new(&adb_path);
            cmd.args(&["-s", &serial, "shell", "dumpsys", "window", "windows"]);
            
            #[cfg(windows)]
            {
                use std::os::windows::process::CommandExt;
                cmd.creation_flags(0x08000000);
            }
            
            cmd.output()
        }).await?.context("执行 dumpsys window 失败")?;

        if !output.status.success() {
            warn!("⚠️ dumpsys window 执行失败");
            return Ok(None);
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        
        // 查找 mCurrentFocus 或 mFocusedApp
        for line in stdout.lines() {
            if line.contains("mCurrentFocus") || line.contains("mFocusedApp") {
                // 示例: mCurrentFocus=Window{abc123 u0 com.example.app/com.example.Activity}
                if let Some(start) = line.find(" u0 ") {
                    if let Some(package_start) = line[start + 4..].find(char::is_alphanumeric) {
                        let rest = &line[start + 4 + package_start..];
                        if let Some(end) = rest.find(|c: char| c == '/' || c == '}' || c == ' ') {
                            let package = rest[..end].to_string();
                            info!("🔍 [设备状态] 前台应用: {}", package);
                            return Ok(Some(package));
                        }
                    }
                }
            }
        }

        warn!("⚠️ [设备状态] 无法检测前台应用");
        Ok(None)
    }

    /// 检查设备是否锁屏
    pub async fn check_is_locked(&self, serial: &str) -> Result<bool> {
        let adb_path = self.adb_path.clone();
        let serial = serial.to_string();

        let output = tokio::task::spawn_blocking(move || {
            let mut cmd = std::process::Command::new(&adb_path);
            cmd.args(&["-s", &serial, "shell", "dumpsys", "window"]);
            
            #[cfg(windows)]
            {
                use std::os::windows::process::CommandExt;
                cmd.creation_flags(0x08000000);
            }
            
            cmd.output()
        }).await?.context("执行 dumpsys window 失败")?;

        if !output.status.success() {
            return Ok(false);
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        
        // 检查 mShowingLockscreen 或 mDreamingLockscreen
        let is_locked = stdout.contains("mShowingLockscreen=true") 
            || stdout.contains("mDreamingLockscreen=true");
        
        if is_locked {
            info!("🔍 [设备状态] 设备已锁屏");
        } else {
            info!("🔍 [设备状态] 设备未锁屏");
        }
        
        Ok(is_locked)
    }

    /// 综合检查设备状态
    pub async fn check_device_state(&self, serial: &str) -> Result<DeviceStateInfo> {
        info!("🔍 开始检查设备状态 (serial={})", serial);
        
        let (screen_state, foreground_app, is_locked) = tokio::join!(
            self.check_screen_state(serial),
            self.check_foreground_app(serial),
            self.check_is_locked(serial)
        );

        let state = DeviceStateInfo {
            screen_state: screen_state.unwrap_or(ScreenState::Unknown),
            foreground_app: foreground_app.unwrap_or(None),
            is_locked: is_locked.unwrap_or(false),
        };

        info!("🔍 [设备状态总结] screen={:?}, foreground={:?}, locked={}", 
            state.screen_state, state.foreground_app, state.is_locked);

        Ok(state)
    }

    /// 唤醒设备屏幕
    pub async fn wake_device(&self, serial: &str) -> Result<()> {
        info!("📱 尝试唤醒设备屏幕...");
        
        let adb_path = self.adb_path.clone();
        let serial = serial.to_string();

        let output = tokio::task::spawn_blocking(move || {
            let mut cmd = std::process::Command::new(&adb_path);
            cmd.args(&["-s", &serial, "shell", "input", "keyevent", "KEYCODE_WAKEUP"]);
            
            #[cfg(windows)]
            {
                use std::os::windows::process::CommandExt;
                cmd.creation_flags(0x08000000);
            }
            
            cmd.output()
        }).await?.context("执行唤醒命令失败")?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            anyhow::bail!("唤醒设备失败: {}", stderr);
        }

        info!("✅ 设备唤醒命令已发送");
        
        // 等待 500ms 让设备响应
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
        
        Ok(())
    }
}
