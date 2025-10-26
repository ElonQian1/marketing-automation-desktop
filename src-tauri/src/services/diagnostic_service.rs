// src-tauri/src/services/diagnostic_service.rs
// 诊断服务：提供系统诊断功能

use crate::utils::adb_utils::{get_adb_path, execute_adb_command};
use std::env;
use std::process::Command;
use serde_json::{json, Value};

/// 获取 ADB 路径
#[tauri::command]
pub async fn get_adb_path_cmd() -> Result<String, String> {
    Ok(get_adb_path())
}

/// 获取环境信息
#[tauri::command]
pub async fn get_environment_info() -> Result<Value, String> {
    let mut env_info = json!({});
    
    // 环境变量
    if let Ok(path) = env::var("PATH") {
        env_info["PATH"] = json!(path);
    }
    
    if let Ok(android_home) = env::var("ANDROID_HOME") {
        env_info["ANDROID_HOME"] = json!(android_home);
    }
    
    if let Ok(android_sdk_root) = env::var("ANDROID_SDK_ROOT") {
        env_info["ANDROID_SDK_ROOT"] = json!(android_sdk_root);
    }
    
    // ADB 路径
    env_info["adb_path"] = json!(get_adb_path());
    
    // 操作系统信息
    env_info["os"] = json!(env::consts::OS);
    env_info["arch"] = json!(env::consts::ARCH);
    
    Ok(env_info)
}

/// 测试设备响应性
#[tauri::command]
pub async fn test_device_responsiveness(device_id: String) -> Result<Value, String> {
    let adb_path = get_adb_path();
    
    // 测试设备连接
    let device_check = Command::new(&adb_path)
        .args(&["-s", &device_id, "shell", "echo", "test"])
        .output()
        .map_err(|e| format!("Failed to execute adb command: {}", e))?;
    
    if !device_check.status.success() {
        return Ok(json!({
            "success": false,
            "message": format!("设备连接失败: {}", String::from_utf8_lossy(&device_check.stderr)),
            "connected": false,
            "responsive": false,
            "error": String::from_utf8_lossy(&device_check.stderr).to_string()
        }));
    }
    
    // 测试获取设备信息
    let prop_check = Command::new(&adb_path)
        .args(&["-s", &device_id, "shell", "getprop", "ro.build.version.release"])
        .output()
        .map_err(|e| format!("Failed to get device properties: {}", e))?;
    
    let android_version = if prop_check.status.success() {
        String::from_utf8_lossy(&prop_check.stdout).trim().to_string()
    } else {
        "unknown".to_string()
    };
    
    // 检查设备是否在设备列表中
    let devices = match execute_adb_command(&["devices"]) {
        Ok(output) => {
            let devices_output = String::from_utf8_lossy(&output.stdout);
            let mut device_list = Vec::new();
            for line in devices_output.lines() {
                if line.contains("\tdevice") {
                    if let Some(device_id_from_list) = line.split('\t').next() {
                        device_list.push(device_id_from_list.to_string());
                    }
                }
            }
            device_list
        }
        Err(_) => Vec::new(),
    };
    let device_found = devices.iter().any(|d| d == &device_id);
    
    // 计算整体成功状态
    let overall_success = device_check.status.success() && prop_check.status.success() && device_found;
    let message = if overall_success {
        format!("设备 {} 响应正常，Android版本: {}", device_id, android_version)
    } else if !device_found {
        format!("设备 {} 未在ADB设备列表中找到", device_id)
    } else if !prop_check.status.success() {
        "设备属性查询失败".to_string()
    } else {
        "设备连接异常".to_string()
    };
    
    Ok(json!({
        "success": overall_success,
        "message": message,
        "connected": device_check.status.success(),
        "responsive": prop_check.status.success(),
        "android_version": android_version,
        "in_device_list": device_found,
        "device_count": devices.len()
    }))
}

/// 全面的系统诊断
#[tauri::command]
pub async fn run_full_diagnostic() -> Result<Value, String> {
    let mut diagnostic = json!({});
    
    // ADB 路径检查
    let adb_path = get_adb_path();
    diagnostic["adb_path"] = json!(adb_path);
    
    // 检查 ADB 是否可执行
    let adb_version = Command::new(&adb_path)
        .args(&["version"])
        .output();
    
    match adb_version {
        Ok(output) => {
            diagnostic["adb_available"] = json!(true);
            diagnostic["adb_version"] = json!(String::from_utf8_lossy(&output.stdout).trim().to_string());
        }
        Err(e) => {
            diagnostic["adb_available"] = json!(false);
            diagnostic["adb_error"] = json!(e.to_string());
        }
    }
    
    // 获取设备列表
    match execute_adb_command(&["devices"]) {
        Ok(output) => {
            let devices_output = String::from_utf8_lossy(&output.stdout);
            let mut devices = Vec::new();
            for line in devices_output.lines() {
                if line.contains("\tdevice") {
                    if let Some(device_id) = line.split('\t').next() {
                        devices.push(device_id.to_string());
                    }
                }
            }
            diagnostic["devices_count"] = json!(devices.len());
            diagnostic["devices"] = json!(devices);
        }
        Err(e) => {
            diagnostic["devices_error"] = json!(e.to_string());
        }
    }
    
    // 环境变量
    if let Ok(env_info) = get_environment_info().await {
        diagnostic["environment"] = env_info;
    }
    
    Ok(diagnostic)
}