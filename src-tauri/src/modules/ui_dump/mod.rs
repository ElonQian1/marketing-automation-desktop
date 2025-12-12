// src-tauri/src/modules/ui_dump/mod.rs
// module: ui_dump | layer: plugin | role: entry
// summary: UI Dump Tauri 插件入口 - 命令注册、状态管理、模块导出

pub mod ui_dump_config;
pub mod ui_dump_diagnostics;
pub mod ui_dump_exec_out;
pub mod ui_dump_legacy;
pub mod ui_dump_provider;
pub mod ui_dump_types;
pub mod domain;
pub mod strategies;

use std::sync::Arc;
use tauri::{
    plugin::{Builder, TauriPlugin},
    AppHandle, Manager, Runtime, State,
};
use tokio::sync::RwLock;
use tracing::{error, info, warn};

use ui_dump_config::{ConfigSummary, UiDumpConfigManager};
use ui_dump_diagnostics::{DiagnosticsBuffer, DiagnosticSummary};
use ui_dump_provider::UiDumpProvider;
use ui_dump_types::{DiagnosticEntry, DumpMode, DumpResult, DumpAndSaveResult};

// ============================================================================
// 插件状态
// ============================================================================

/// UI Dump 插件状态
pub struct UiDumpState {
    pub provider: Arc<UiDumpProvider>,
    pub config_manager: Arc<RwLock<UiDumpConfigManager>>,
    pub diagnostics: Arc<RwLock<DiagnosticsBuffer>>,
}

impl UiDumpState {
    /// 创建新的插件状态（内存模式，用于测试）
    pub fn new_memory() -> Self {
        let config_manager = Arc::new(RwLock::new(UiDumpConfigManager::new_memory()));
        let diagnostics = Arc::new(RwLock::new(DiagnosticsBuffer::new(50)));
        let provider = Arc::new(UiDumpProvider::new(
            Arc::clone(&config_manager),
            Arc::clone(&diagnostics),
        ));
        
        Self {
            provider,
            config_manager,
            diagnostics,
        }
    }
}

// ============================================================================
// Tauri 命令
// ============================================================================

/// 获取当前模式配置
#[tauri::command]
async fn get_mode(state: State<'_, UiDumpState>) -> Result<DumpMode, String> {
    let manager = state.config_manager.read().await;
    Ok(manager.get_preferred_mode())
}

/// 设置首选模式
#[tauri::command]
async fn set_mode(mode: DumpMode, state: State<'_, UiDumpState>) -> Result<(), String> {
    let mut manager = state.config_manager.write().await;
    manager.set_preferred_mode(mode);
    manager.save().await.map_err(|e| e.to_string())?;
    info!("✅ UI Dump 模式已设置为: {:?}", mode);
    Ok(())
}

/// 执行 UI Dump
#[tauri::command]
async fn dump(device_id: String, state: State<'_, UiDumpState>) -> Result<DumpResult, String> {
    state.provider
        .dump(&device_id)
        .await
        .map_err(|e| e.to_string())
}

/// 执行 UI Dump 并保存到文件
/// 
/// 结合 exec-out 快速模式和文件保存机制：
/// - 使用首选模式获取 XML
/// - 保存到 debug_xml 目录
/// - 可选截图
#[tauri::command]
async fn dump_and_save(
    device_id: String,
    save_dir: Option<String>,
    take_screenshot: Option<bool>,
    state: State<'_, UiDumpState>,
) -> Result<DumpAndSaveResult, String> {
    let save_path = save_dir.map(std::path::PathBuf::from);
    let screenshot = take_screenshot.unwrap_or(false);
    
    state.provider
        .dump_and_save(&device_id, save_path, screenshot)
        .await
        .map_err(|e| e.to_string())
}

/// 测试指定模式
#[tauri::command]
async fn test_mode(
    device_id: String,
    mode: DumpMode,
    state: State<'_, UiDumpState>,
) -> Result<DumpResult, String> {
    state.provider
        .test_mode(&device_id, mode)
        .await
        .map_err(|e| e.to_string())
}

/// 获取诊断日志
#[tauri::command]
async fn get_diagnostics(state: State<'_, UiDumpState>) -> Result<Vec<DiagnosticEntry>, String> {
    Ok(state.provider.get_diagnostics().await)
}

/// 获取诊断摘要
#[tauri::command]
async fn get_diagnostic_summary(state: State<'_, UiDumpState>) -> Result<DiagnosticSummary, String> {
    let diagnostics = state.diagnostics.read().await;
    Ok(diagnostics.generate_summary())
}

/// 清空诊断日志
#[tauri::command]
async fn clear_diagnostics(state: State<'_, UiDumpState>) -> Result<(), String> {
    state.provider.clear_diagnostics().await;
    Ok(())
}

/// 获取配置摘要
#[tauri::command]
async fn get_config(state: State<'_, UiDumpState>) -> Result<ConfigSummary, String> {
    let manager = state.config_manager.read().await;
    Ok(ConfigSummary::from(manager.get_config()))
}

/// 设置 ExecOut 超时时间
#[tauri::command]
async fn set_exec_out_timeout(timeout_ms: u64, state: State<'_, UiDumpState>) -> Result<(), String> {
    let mut manager = state.config_manager.write().await;
    manager.set_exec_out_timeout(timeout_ms);
    manager.save().await.map_err(|e| e.to_string())?;
    Ok(())
}

/// 设置 DumpPull 超时时间
#[tauri::command]
async fn set_dump_pull_timeout(timeout_ms: u64, state: State<'_, UiDumpState>) -> Result<(), String> {
    let mut manager = state.config_manager.write().await;
    manager.set_dump_pull_timeout(timeout_ms);
    manager.save().await.map_err(|e| e.to_string())?;
    Ok(())
}

/// 清除设备兼容性缓存
#[tauri::command]
async fn clear_device_compat(
    device_id: Option<String>,
    state: State<'_, UiDumpState>,
) -> Result<(), String> {
    let mut manager = state.config_manager.write().await;
    if let Some(id) = device_id {
        manager.clear_device_compat(&id);
    } else {
        manager.clear_device_compat_cache();
    }
    manager.save().await.map_err(|e| e.to_string())?;
    Ok(())
}

/// 重置配置为默认值
#[tauri::command]
async fn reset_config(state: State<'_, UiDumpState>) -> Result<(), String> {
    let mut manager = state.config_manager.write().await;
    manager.reset_to_default();
    manager.save().await.map_err(|e| e.to_string())?;
    Ok(())
}

/// 获取所有可用模式列表
#[tauri::command]
async fn list_modes() -> Result<Vec<ModeInfo>, String> {
    Ok(vec![
        ModeInfo {
            mode: DumpMode::Auto,
            name: "自动 (推荐)".to_string(),
            description: "自动选择最优模式，失败时自动降级".to_string(),
            implemented: true,
        },
        ModeInfo {
            mode: DumpMode::ExecOut,
            name: "ExecOut 快速模式".to_string(),
            description: "跳过文件I/O，直接输出到stdout，速度快30-40%".to_string(),
            implemented: true,
        },
        ModeInfo {
            mode: DumpMode::DumpPull,
            name: "DumpPull 兼容模式".to_string(),
            description: "传统方式，兼容性最好".to_string(),
            implemented: true,
        },
        ModeInfo {
            mode: DumpMode::A11y,
            name: "AccessibilityService".to_string(),
            description: "通过Android App实时获取，速度最快（需安装辅助App）".to_string(),
            implemented: true,
        },
    ])
}

/// 检查 Android App 连接状态（简单版）
#[tauri::command]
async fn check_android_app_status(device_id: String) -> Result<AndroidAppStatus, String> {
    use tokio::net::TcpStream;
    use tokio::time::timeout;
    use std::time::Duration;
    
    const PORT: u16 = 11451;
    
    // 1. 先设置端口转发
    let forward_result = tokio::process::Command::new("adb")
        .args(["-s", &device_id, "forward", &format!("tcp:{}", PORT), &format!("tcp:{}", PORT)])
        .output()
        .await;
    
    let forward_ok = match forward_result {
        Ok(output) => output.status.success(),
        Err(_) => false,
    };
    
    if !forward_ok {
        return Ok(AndroidAppStatus {
            connected: false,
            port: PORT,
            message: "ADB 端口转发失败".to_string(),
            suggestion: "请确认设备已连接并开启 USB 调试".to_string(),
        });
    }
    
    // 2. 尝试连接 Socket
    let addr = format!("127.0.0.1:{}", PORT);
    match timeout(Duration::from_secs(2), TcpStream::connect(&addr)).await {
        Ok(Ok(_)) => Ok(AndroidAppStatus {
            connected: true,
            port: PORT,
            message: "Android App 已连接".to_string(),
            suggestion: "可以使用 A11y 模式".to_string(),
        }),
        Ok(Err(e)) => Ok(AndroidAppStatus {
            connected: false,
            port: PORT,
            message: format!("连接失败: {}", e),
            suggestion: "请确认 Android App 已启动并授权无障碍权限".to_string(),
        }),
        Err(_) => Ok(AndroidAppStatus {
            connected: false,
            port: PORT,
            message: "连接超时".to_string(),
            suggestion: "请确认 Android App 已启动".to_string(),
        }),
    }
}

/// 完整诊断 Android App 连接
/// 
/// 执行多个步骤的诊断，返回每个步骤的详细状态
#[tauri::command]
async fn diagnose_android_app(device_id: String) -> Result<AndroidAppDiagnosis, String> {
    use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
    use tokio::net::TcpStream;
    use tokio::time::timeout;
    use std::time::{Duration, Instant};
    
    const PORT: u16 = 11451;
    let start = Instant::now();
    let mut steps = Vec::new();
    
    // ============ Step 1: 检查设备连接 ============
    let step1_start = Instant::now();
    let devices_output = tokio::process::Command::new("adb")
        .args(["devices", "-l"])
        .output()
        .await;
    
    let (device_connected, device_info) = match devices_output {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let found = stdout.contains(&device_id);
            let info = if found {
                stdout.lines()
                    .find(|line| line.contains(&device_id))
                    .map(|s| s.to_string())
                    .unwrap_or_default()
            } else {
                "设备未找到".to_string()
            };
            (found, info)
        }
        Err(e) => (false, format!("ADB 执行失败: {}", e)),
    };
    
    steps.push(DiagnosticStep {
        name: "设备连接".to_string(),
        passed: device_connected,
        message: if device_connected { 
            format!("✅ 设备已连接: {}", device_info.trim()) 
        } else { 
            format!("❌ {}", device_info) 
        },
        elapsed_ms: step1_start.elapsed().as_millis() as u64,
        details: None,
    });
    
    if !device_connected {
        return Ok(AndroidAppDiagnosis {
            success: false,
            steps,
            total_elapsed_ms: start.elapsed().as_millis() as u64,
            summary: "设备未连接，请检查 USB 连接和 ADB 驱动".to_string(),
        });
    }
    
    // ============ Step 2: 检查 App 安装 ============
    let step2_start = Instant::now();
    let package_output = tokio::process::Command::new("adb")
        .args(["-s", &device_id, "shell", "pm", "list", "packages", "com.employee.agent"])
        .output()
        .await;
    
    let app_installed = match &package_output {
        Ok(output) => String::from_utf8_lossy(&output.stdout).contains("com.employee.agent"),
        Err(_) => false,
    };
    
    steps.push(DiagnosticStep {
        name: "App 安装".to_string(),
        passed: app_installed,
        message: if app_installed {
            "✅ Employee Agent 已安装".to_string()
        } else {
            "❌ Employee Agent 未安装，请先安装 APK".to_string()
        },
        elapsed_ms: step2_start.elapsed().as_millis() as u64,
        details: None,
    });
    
    if !app_installed {
        return Ok(AndroidAppDiagnosis {
            success: false,
            steps,
            total_elapsed_ms: start.elapsed().as_millis() as u64,
            summary: "Android App 未安装".to_string(),
        });
    }
    
    // ============ Step 3: 检查无障碍服务 ============
    let step3_start = Instant::now();
    let a11y_output = tokio::process::Command::new("adb")
        .args(["-s", &device_id, "shell", "settings", "get", "secure", "enabled_accessibility_services"])
        .output()
        .await;
    
    let (a11y_enabled, a11y_value) = match &a11y_output {
        Ok(output) => {
            let value = String::from_utf8_lossy(&output.stdout).trim().to_string();
            let enabled = value.contains("com.employee.agent");
            (enabled, value)
        }
        Err(e) => (false, format!("查询失败: {}", e)),
    };
    
    steps.push(DiagnosticStep {
        name: "无障碍服务".to_string(),
        passed: a11y_enabled,
        message: if a11y_enabled {
            "✅ 无障碍服务已开启".to_string()
        } else if a11y_value == "null" || a11y_value.is_empty() {
            "❌ 无障碍服务未开启，请在 设置 → 无障碍 中开启 Employee Agent".to_string()
        } else {
            format!("❌ 无障碍服务未包含 Employee Agent (当前: {})", a11y_value)
        },
        elapsed_ms: step3_start.elapsed().as_millis() as u64,
        details: Some(format!("enabled_accessibility_services: {}", a11y_value)),
    });
    
    // ============ Step 4: 设置端口转发 ============
    let step4_start = Instant::now();
    let forward_output = tokio::process::Command::new("adb")
        .args(["-s", &device_id, "forward", &format!("tcp:{}", PORT), &format!("tcp:{}", PORT)])
        .output()
        .await;
    
    let forward_ok = match &forward_output {
        Ok(output) => output.status.success(),
        Err(_) => false,
    };
    
    steps.push(DiagnosticStep {
        name: "端口转发".to_string(),
        passed: forward_ok,
        message: if forward_ok {
            format!("✅ 端口转发已设置: tcp:{} -> tcp:{}", PORT, PORT)
        } else {
            format!("❌ 端口转发失败: {:?}", forward_output.as_ref().map(|o| String::from_utf8_lossy(&o.stderr).to_string()))
        },
        elapsed_ms: step4_start.elapsed().as_millis() as u64,
        details: None,
    });
    
    if !forward_ok {
        return Ok(AndroidAppDiagnosis {
            success: false,
            steps,
            total_elapsed_ms: start.elapsed().as_millis() as u64,
            summary: "端口转发失败".to_string(),
        });
    }
    
    // ============ Step 5: TCP 连接测试 ============
    let step5_start = Instant::now();
    let addr = format!("127.0.0.1:{}", PORT);
    let tcp_result = timeout(Duration::from_secs(3), TcpStream::connect(&addr)).await;
    
    let (tcp_ok, tcp_stream) = match tcp_result {
        Ok(Ok(stream)) => (true, Some(stream)),
        Ok(Err(e)) => {
            steps.push(DiagnosticStep {
                name: "TCP 连接".to_string(),
                passed: false,
                message: format!("❌ 无法连接 127.0.0.1:{} - {}", PORT, e),
                elapsed_ms: step5_start.elapsed().as_millis() as u64,
                details: Some("这表示 Android App 的 Socket 服务可能未启动".to_string()),
            });
            (false, None)
        }
        Err(_) => {
            steps.push(DiagnosticStep {
                name: "TCP 连接".to_string(),
                passed: false,
                message: format!("❌ 连接 127.0.0.1:{} 超时 (3秒)", PORT),
                elapsed_ms: step5_start.elapsed().as_millis() as u64,
                details: Some("请确认 Android App 正在运行并且 Socket 服务已启动".to_string()),
            });
            (false, None)
        }
    };
    
    if tcp_ok {
        steps.push(DiagnosticStep {
            name: "TCP 连接".to_string(),
            passed: true,
            message: format!("✅ 成功连接到 127.0.0.1:{}", PORT),
            elapsed_ms: step5_start.elapsed().as_millis() as u64,
            details: None,
        });
    }
    
    if !tcp_ok || tcp_stream.is_none() {
        return Ok(AndroidAppDiagnosis {
            success: false,
            steps,
            total_elapsed_ms: start.elapsed().as_millis() as u64,
            summary: "无法连接到 Android App Socket 服务，请确认 App 正在运行".to_string(),
        });
    }
    
    // ============ Step 6: 发送 DUMP 命令并等待响应 ============
    let step6_start = Instant::now();
    let mut stream = tcp_stream.unwrap();
    
    // 发送命令
    let send_result = stream.write_all(b"DUMP\n").await;
    if let Err(e) = send_result {
        steps.push(DiagnosticStep {
            name: "发送命令".to_string(),
            passed: false,
            message: format!("❌ 发送 DUMP 命令失败: {}", e),
            elapsed_ms: step6_start.elapsed().as_millis() as u64,
            details: None,
        });
        return Ok(AndroidAppDiagnosis {
            success: false,
            steps,
            total_elapsed_ms: start.elapsed().as_millis() as u64,
            summary: "发送命令失败".to_string(),
        });
    }
    
    // 读取响应
    let mut reader = BufReader::new(stream);
    let mut response = String::new();
    let read_result = timeout(Duration::from_secs(5), reader.read_line(&mut response)).await;
    
    let (response_ok, response_preview) = match read_result {
        Ok(Ok(bytes)) if bytes > 0 => {
            let preview = if response.len() > 200 {
                format!("{}... (共 {} 字节)", &response[..200], response.len())
            } else {
                response.clone()
            };
            (true, preview)
        }
        Ok(Ok(_)) => (false, "收到空响应".to_string()),
        Ok(Err(e)) => (false, format!("读取失败: {}", e)),
        Err(_) => (false, "读取响应超时 (5秒)".to_string()),
    };
    
    // 尝试解析 JSON
    let json_valid = if response_ok {
        serde_json::from_str::<serde_json::Value>(&response).is_ok()
    } else {
        false
    };
    
    steps.push(DiagnosticStep {
        name: "DUMP 命令".to_string(),
        passed: response_ok && json_valid,
        message: if response_ok && json_valid {
            format!("✅ 收到有效 JSON 响应 ({} 字节)", response.len())
        } else if response_ok {
            format!("⚠️ 收到响应但非有效 JSON: {}", response_preview)
        } else {
            format!("❌ {}", response_preview)
        },
        elapsed_ms: step6_start.elapsed().as_millis() as u64,
        details: if response_ok { Some(response_preview) } else { None },
    });
    
    let success = response_ok && json_valid;
    Ok(AndroidAppDiagnosis {
        success,
        steps,
        total_elapsed_ms: start.elapsed().as_millis() as u64,
        summary: if success {
            "🎉 所有测试通过！Android App 工作正常，可以使用 A11y 模式".to_string()
        } else {
            "诊断未通过，请查看上方失败步骤".to_string()
        },
    })
}

/// Android App 连接状态（简单版）
#[derive(Debug, Clone, serde::Serialize)]
pub struct AndroidAppStatus {
    pub connected: bool,
    pub port: u16,
    pub message: String,
    pub suggestion: String,
}

/// 诊断步骤结果
#[derive(Debug, Clone, serde::Serialize)]
pub struct DiagnosticStep {
    pub name: String,
    pub passed: bool,
    pub message: String,
    pub elapsed_ms: u64,
    pub details: Option<String>,
}

/// 完整诊断结果
#[derive(Debug, Clone, serde::Serialize)]
pub struct AndroidAppDiagnosis {
    pub success: bool,
    pub steps: Vec<DiagnosticStep>,
    pub total_elapsed_ms: u64,
    pub summary: String,
}

/// 模式信息（用于前端显示）
#[derive(Debug, Clone, serde::Serialize)]
pub struct ModeInfo {
    pub mode: DumpMode,
    pub name: String,
    pub description: String,
    pub implemented: bool,
}

// ============================================================================
// 插件初始化
// ============================================================================

/// 初始化 UI Dump 插件（带文件持久化）
/// 
/// 使用方式：在 main.rs 中添加 `.plugin(modules::ui_dump::init())`
/// 
/// 配置文件保存位置: `<app_data_dir>/dump_config.json`
/// - Windows: `%APPDATA%/<app>/dump_config.json`
/// - macOS: `~/Library/Application Support/<app>/dump_config.json`
/// - Linux: `~/.config/<app>/dump_config.json`
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("ui_dump")
        .invoke_handler(tauri::generate_handler![
            get_mode,
            set_mode,
            dump,
            dump_and_save,
            test_mode,
            get_diagnostics,
            get_diagnostic_summary,
            clear_diagnostics,
            get_config,
            set_exec_out_timeout,
            set_dump_pull_timeout,
            clear_device_compat,
            reset_config,
            list_modes,
            check_android_app_status,
            diagnose_android_app,
        ])
        .setup(|app, _api| {
            // 获取应用数据目录
            let app_data_dir = match app.path().app_data_dir() {
                Ok(dir) => dir,
                Err(e) => {
                    error!("⚠️ 无法获取应用数据目录: {}，使用内存模式", e);
                    let state = UiDumpState::new_memory();
                    app.manage(state);
                    info!("🔌 UI Dump 插件已初始化（内存模式）");
                    return Ok(());
                }
            };
            
            // 使用 tokio runtime 异步初始化
            let state = tauri::async_runtime::block_on(async {
                init_state_with_persistence(app_data_dir).await
            });
            
            app.manage(state);
            info!("🔌 UI Dump 插件已初始化（带持久化）");
            Ok(())
        })
        .build()
}

/// 异步初始化状态（内部使用）
async fn init_state_with_persistence(app_data_dir: std::path::PathBuf) -> UiDumpState {
    // 尝试加载持久化配置
    match UiDumpConfigManager::new(app_data_dir).await {
        Ok(manager) => {
            let buffer_size = manager.get_config().diagnostic_buffer_size;
            let config_manager = Arc::new(RwLock::new(manager));
            let diagnostics = Arc::new(RwLock::new(DiagnosticsBuffer::new(buffer_size)));
            let provider = Arc::new(UiDumpProvider::new(
                Arc::clone(&config_manager),
                Arc::clone(&diagnostics),
            ));
            
            info!("✅ 配置已从文件加载");
            
            UiDumpState {
                provider,
                config_manager,
                diagnostics,
            }
        }
        Err(e) => {
            warn!("⚠️ 加载持久化配置失败: {}，使用内存模式", e);
            UiDumpState::new_memory()
        }
    }
}

/// 异步初始化（供外部调用）
/// 
/// 用于需要在已有 AppHandle 上初始化的场景
pub async fn init_with_persistence<R: Runtime>(app: &AppHandle<R>) -> Result<(), Box<dyn std::error::Error>> {
    // 获取应用数据目录
    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| format!("无法获取应用数据目录: {}", e))?;
    
    // 创建配置管理器
    let config_manager = Arc::new(RwLock::new(
        UiDumpConfigManager::new(app_data_dir).await?
    ));
    
    // 读取配置中的缓冲区大小
    let buffer_size = {
        let manager = config_manager.read().await;
        manager.get_config().diagnostic_buffer_size
    };
    
    // 创建诊断缓冲区
    let diagnostics = Arc::new(RwLock::new(DiagnosticsBuffer::new(buffer_size)));
    
    // 创建提供器
    let provider = Arc::new(UiDumpProvider::new(
        Arc::clone(&config_manager),
        Arc::clone(&diagnostics),
    ));
    
    // 创建状态
    let state = UiDumpState {
        provider,
        config_manager,
        diagnostics,
    };
    
    app.manage(state);
    
    info!("🔌 UI Dump 插件已初始化（带持久化）");
    Ok(())
}

// ============================================================================
// 公共 API（供其他模块调用）
// ============================================================================

/// 获取全局 Provider（如果已初始化）
/// 
/// 用于其他 Rust 模块直接调用 UI Dump 功能
pub fn get_provider<R: Runtime>(app: &AppHandle<R>) -> Option<Arc<UiDumpProvider>> {
    app.try_state::<UiDumpState>()
        .map(|state| Arc::clone(&state.provider))
}

/// 直接执行 UI Dump（便捷函数）
/// 
/// 用于其他 Rust 模块直接调用
pub async fn unified_dump<R: Runtime>(
    app: &AppHandle<R>,
    device_id: &str,
) -> Result<DumpResult, String> {
    let provider = get_provider(app)
        .ok_or_else(|| "UI Dump 插件未初始化".to_string())?;
    
    provider.dump(device_id)
        .await
        .map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_state_creation() {
        let state = UiDumpState::new_memory();
        // 状态应该成功创建
        assert!(Arc::strong_count(&state.provider) >= 1);
    }
    
    #[tokio::test]
    async fn test_list_modes() {
        let modes = list_modes().await.unwrap();
        assert_eq!(modes.len(), 4);
        assert!(modes[0].implemented); // Auto
        assert!(modes[1].implemented); // ExecOut
        assert!(modes[2].implemented); // DumpPull
        assert!(!modes[3].implemented); // A11y (预留)
    }
}
