// src-tauri/src/modules/cloud_sync/device_id.rs
// module: cloud_sync | layer: infrastructure | role: 设备ID生成
// summary: 生成持久化的机器唯一标识符

use std::path::PathBuf;
use std::fs;
use anyhow::{Result, Context};

/// 获取或生成设备ID
/// 
/// 优先级：
/// 1. 从本地缓存文件读取
/// 2. 从系统硬件信息生成（CPU ID + 主板序列号 + MAC地址）
/// 3. 生成随机UUID作为后备
pub fn get_device_id() -> Result<String> {
    // 1. 尝试从缓存读取
    let cache_path = get_cache_path()?;
    if cache_path.exists() {
        if let Ok(id) = fs::read_to_string(&cache_path) {
            let id = id.trim();
            if !id.is_empty() && id.len() >= 16 {
                return Ok(id.to_string());
            }
        }
    }

    // 2. 生成新ID
    let device_id = generate_device_id()?;
    
    // 3. 缓存到本地
    if let Some(parent) = cache_path.parent() {
        fs::create_dir_all(parent).ok();
    }
    fs::write(&cache_path, &device_id)
        .context("Failed to cache device ID")?;
    
    Ok(device_id)
}

/// 获取缓存文件路径
fn get_cache_path() -> Result<PathBuf> {
    let app_data = dirs::data_local_dir()
        .context("Cannot find local data directory")?;
    Ok(app_data.join("employee-gui").join(".device_id"))
}

/// 生成设备唯一标识
fn generate_device_id() -> Result<String> {
    // 优先使用系统特定方法
    #[cfg(target_os = "windows")]
    {
        if let Ok(id) = generate_windows_device_id() {
            return Ok(id);
        }
    }
    
    // 后备方案：使用机器名 + 随机UUID
    let hostname = hostname::get()
        .map(|h| h.to_string_lossy().to_string())
        .unwrap_or_else(|_| "unknown".to_string());
    
    let uuid = uuid::Uuid::new_v4();
    Ok(format!("pc-{}-{}", hostname, &uuid.to_string()[..8]))
}

/// Windows 特定的设备ID生成
#[cfg(target_os = "windows")]
fn generate_windows_device_id() -> Result<String> {
    use std::process::Command;
    
    // 获取 Machine GUID (Windows 安装时生成的唯一ID)
    let output = Command::new("powershell")
        .args([
            "-NoProfile",
            "-Command",
            "(Get-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Cryptography' -Name MachineGuid).MachineGuid"
        ])
        .output()
        .context("Failed to execute PowerShell")?;
    
    if output.status.success() {
        let guid = String::from_utf8_lossy(&output.stdout)
            .trim()
            .to_string();
        if guid.len() >= 16 {
            // 使用 SHA256 哈希以保护隐私
            use sha2::{Sha256, Digest};
            let mut hasher = Sha256::new();
            hasher.update(guid.as_bytes());
            let hash = hasher.finalize();
            return Ok(format!("pc-{}", hex::encode(&hash[..12])));
        }
    }
    
    anyhow::bail!("Cannot get Windows Machine GUID")
}
