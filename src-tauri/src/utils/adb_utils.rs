use tracing::{debug, info, warn};
use std::process::{Command, Output};
use std::sync::OnceLock;
use anyhow::Result;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

/// 🔧 ADB 路径缓存 - 避免重复检测文件系统
static CACHED_ADB_PATH: OnceLock<String> = OnceLock::new();

/// 获取 ADB 可执行文件的路径
/// 在开发环境和生产环境中都能正确找到 ADB 工具
/// 
/// ⚡ 使用 OnceLock 缓存，首次调用后不再重复检测文件系统
pub fn get_adb_path() -> String {
    // 🔧 使用缓存避免重复文件系统检测
    CACHED_ADB_PATH.get_or_init(|| {
        debug!("🔍 首次检测ADB路径...");
        detect_adb_path_internal()
    }).clone()
}

/// 内部实际检测逻辑（仅首次调用时执行）
fn detect_adb_path_internal() -> String {
    let possible_adb_paths = vec![
        // 1. 开发环境: 项目根目录的platform-tools
        std::env::current_dir()
            .unwrap_or_else(|_| std::path::PathBuf::from("."))
            .parent()
            .unwrap_or(&std::path::PathBuf::from(".."))
            .join("platform-tools")
            .join("adb.exe"),
            
        // 2. 开发环境: 从src-tauri向上两级目录找platform-tools
        std::env::current_dir()
            .unwrap_or_else(|_| std::path::PathBuf::from("."))
            .join("..")
            .join("platform-tools")
            .join("adb.exe"),
            
        // 3. 生产环境: 应用程序目录下的 adb.exe (资源文件)
        std::env::current_exe()
            .ok()
            .and_then(|exe| exe.parent().map(|p| p.to_path_buf()))
            .unwrap_or_else(|| std::path::PathBuf::from("."))
            .join("adb.exe"),
    ];

    // 找到第一个存在的ADB路径
    for path in &possible_adb_paths {
        debug!("🔍 检查ADB路径: {}", path.display());
        if path.exists() {
            let path_str = path.to_string_lossy().to_string();
            info!("✅ 找到可用的ADB路径: {}", path_str);
            return path_str;
        }
    }
    
    // 如果都找不到，返回系统默认的 adb
    warn!("未找到任何ADB路径，使用系统默认的 adb.exe");
    "adb.exe".to_string()
}

/// 执行命令并隐藏窗口（Windows专用）
/// 这个函数确保在 Windows 上不会弹出 CMD 窗口
#[allow(dead_code)]
pub fn execute_command_hidden(command: &str, args: &[&str]) -> Result<Output> {
    let mut cmd = Command::new(command);
    cmd.args(args);
    
    #[cfg(windows)]
    {
        // Windows: 隐藏命令行窗口
        // CREATE_NO_WINDOW = 0x08000000
        cmd.creation_flags(0x08000000);
    }
    
    let output = cmd.output()?;
    Ok(output)
}

/// 执行 ADB 命令并隐藏窗口
#[allow(dead_code)]
pub fn execute_adb_command(args: &[&str]) -> Result<Output> {
    let adb_path = get_adb_path();
    execute_command_hidden(&adb_path, args)
}