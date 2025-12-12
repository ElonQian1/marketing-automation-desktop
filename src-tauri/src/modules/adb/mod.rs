use tauri::{plugin::{Builder, TauriPlugin}, Wry, Manager, State};
use std::sync::Mutex;
use crate::services::adb::AdbService;
use crate::services::log_bridge::LOG_COLLECTOR;
#[cfg(windows)]
use std::os::windows::process::CommandExt;
use std::process::Command;
use std::time::Instant;
use tauri::AppHandle;
use crate::services::smart_app_manager::SmartAppManagerState;
use crate::services::smart_app_manager::{AppInfo, PagedApps};
use crate::services::adb::tracking::adb_device_tracker::TrackedDevice;
use crate::utils::adb_utils::get_adb_path;

use crate::services::adb::commands::adb_file::safe_adb_push;
use crate::services::adb::commands::ui_automation::{adb_dump_ui_xml, adb_tap_coordinate};
use crate::services::adb::tracking::adb_device_tracker::{start_device_tracking, stop_device_tracking, get_tracked_devices};

#[tauri::command]
async fn execute(adb_path: String, args: Vec<String>, service: State<'_, Mutex<AdbService>>) -> Result<String, String> {
    let service = service.lock().map_err(|e| e.to_string())?;
    service.execute_command(&adb_path, &args).map_err(|e| e.to_string())
}

#[tauri::command]
async fn check_file(path: String, service: State<'_, Mutex<AdbService>>) -> Result<bool, String> {
    let service = service.lock().map_err(|e| e.to_string())?;
    Ok(service.check_file_exists(&path))
}

#[tauri::command]
async fn detect_ldplayer(service: State<'_, Mutex<AdbService>>) -> Result<Option<String>, String> {
    let service = service.lock().map_err(|e| e.to_string())?;
    Ok(service.detect_ldplayer_adb())
}

#[tauri::command]
async fn detect_path(service: State<'_, Mutex<AdbService>>) -> Result<String, String> {
    let service = service.lock().map_err(|e| e.to_string())?;
    if let Some(detected_path) = service.detect_ldplayer_adb() {
        Ok(detected_path)
    } else {
        match service.execute_command("adb.exe", &["version".to_string()]) {
            Ok(_) => Ok("adb.exe".to_string()),
            Err(_) => {
                let current_dir = std::env::current_dir().map_err(|e| format!("Failed to get current directory: {}", e))?;
                let adb_path = current_dir.join("platform-tools").join("adb.exe");
                if adb_path.exists() {
                    Ok(adb_path.to_string_lossy().to_string())
                } else {
                    let parent_adb_path = current_dir.parent().ok_or("No parent directory")?.join("platform-tools").join("adb.exe");
                    if parent_adb_path.exists() {
                        Ok(parent_adb_path.to_string_lossy().to_string())
                    } else {
                        Err("未找到可用的ADB路径".to_string())
                    }
                }
            }
        }
    }
}

#[tauri::command]
async fn list_devices(adb_path: String, service: State<'_, Mutex<AdbService>>) -> Result<String, String> {
    let service = service.lock().map_err(|e| e.to_string())?;
    service.get_devices(&adb_path).map_err(|e| e.to_string())
}

#[tauri::command]
async fn version() -> Result<String, String> {
    let adb_path = "platform-tools/adb.exe";
    let mut cmd = Command::new(adb_path);
    cmd.arg("version");
    #[cfg(windows)]
    { cmd.creation_flags(0x08000000); }
    match cmd.output() {
        Ok(output) => {
            if output.status.success() {
                let version_output = String::from_utf8_lossy(&output.stdout);
                Ok(version_output.lines().next().unwrap_or("Unknown").to_string())
            } else {
                Err(format!("ADB版本获取失败: {}", String::from_utf8_lossy(&output.stderr)))
            }
        }
        Err(e) => Err(format!("无法执行ADB命令: {}", e)),
    }
}

#[tauri::command]
async fn start_server_simple() -> Result<String, String> {
    let adb_path = "platform-tools/adb.exe";
    let mut cmd = Command::new(adb_path);
    cmd.arg("start-server");
    #[cfg(windows)]
    { cmd.creation_flags(0x08000000); }
    let start = Instant::now();
    let res = cmd.output();
    let dur = start.elapsed();
    match res {
        Ok(output) => {
            if output.status.success() {
                let out_str = String::from_utf8_lossy(&output.stdout).to_string();
                let err_str = String::from_utf8_lossy(&output.stderr).to_string();
                LOG_COLLECTOR.add_adb_command_log(
                    adb_path,
                    &vec!["start-server".to_string()],
                    &out_str,
                    if err_str.is_empty() { None } else { Some(err_str.as_str()) },
                    output.status.code(),
                    dur.as_millis() as u64,
                );
                Ok("ADB服务器启动成功".to_string())
            } else {
                let error = String::from_utf8_lossy(&output.stderr);
                let out_str = String::from_utf8_lossy(&output.stdout).to_string();
                LOG_COLLECTOR.add_adb_command_log(
                    adb_path,
                    &vec!["start-server".to_string()],
                    &out_str,
                    Some(error.as_ref()),
                    output.status.code(),
                    dur.as_millis() as u64,
                );
                Err(format!("ADB服务器启动失败: {}", error))
            }
        }
        Err(e) => {
            LOG_COLLECTOR.add_adb_command_log(
                adb_path,
                &vec!["start-server".to_string()],
                "",
                Some(&format!("{}", e)),
                None,
                dur.as_millis() as u64,
            );
            Err(format!("无法执行ADB命令: {}", e))
        }
    }
}

#[tauri::command]
async fn kill_server_simple() -> Result<String, String> {
    let adb_path = "platform-tools/adb.exe";
    let mut cmd = Command::new(adb_path);
    cmd.arg("kill-server");
    #[cfg(windows)]
    { cmd.creation_flags(0x08000000); }
    let start = Instant::now();
    let res = cmd.output();
    let dur = start.elapsed();
    match res {
        Ok(output) => {
            if output.status.success() {
                let out_str = String::from_utf8_lossy(&output.stdout).to_string();
                let err_str = String::from_utf8_lossy(&output.stderr).to_string();
                LOG_COLLECTOR.add_adb_command_log(
                    adb_path,
                    &vec!["kill-server".to_string()],
                    &out_str,
                    if err_str.is_empty() { None } else { Some(err_str.as_str()) },
                    output.status.code(),
                    dur.as_millis() as u64,
                );
                Ok("ADB服务器停止成功".to_string())
            } else {
                let error = String::from_utf8_lossy(&output.stderr);
                let out_str = String::from_utf8_lossy(&output.stdout).to_string();
                LOG_COLLECTOR.add_adb_command_log(
                    adb_path,
                    &vec!["kill-server".to_string()],
                    &out_str,
                    Some(error.as_ref()),
                    output.status.code(),
                    dur.as_millis() as u64,
                );
                Err(format!("ADB服务器停止失败: {}", error))
            }
        }
        Err(e) => {
            LOG_COLLECTOR.add_adb_command_log(
                adb_path,
                &vec!["kill-server".to_string()],
                "",
                Some(&format!("{}", e)),
                None,
                dur.as_millis() as u64,
            );
            Err(format!("无法执行ADB命令: {}", e))
        }
    }
}

#[tauri::command]
async fn execute_simple(command: String) -> Result<String, String> {
    let adb_path = "platform-tools/adb.exe";
    let args: Vec<&str> = command.split_whitespace().collect();
    let mut cmd = Command::new(adb_path);
    cmd.args(&args);
    #[cfg(windows)]
    { cmd.creation_flags(0x08000000); }
    let start = Instant::now();
    let res = cmd.output();
    let dur = start.elapsed();
    match res {
        Ok(output) => {
            if output.status.success() {
                let result = String::from_utf8_lossy(&output.stdout);
                LOG_COLLECTOR.add_adb_command_log(
                    adb_path,
                    &args.iter().map(|s| s.to_string()).collect::<Vec<String>>(),
                    &result.to_string(),
                    None,
                    output.status.code(),
                    dur.as_millis() as u64,
                );
                Ok(result.to_string())
            } else {
                let error = String::from_utf8_lossy(&output.stderr);
                let out_str = String::from_utf8_lossy(&output.stdout).to_string();
                LOG_COLLECTOR.add_adb_command_log(
                    adb_path,
                    &args.iter().map(|s| s.to_string()).collect::<Vec<String>>(),
                    &out_str,
                    Some(error.as_ref()),
                    output.status.code(),
                    dur.as_millis() as u64,
                );
                Err(format!("ADB命令执行失败: {}", error))
            }
        }
        Err(e) => {
            LOG_COLLECTOR.add_adb_command_log(
                adb_path,
                &args.iter().map(|s| s.to_string()).collect::<Vec<String>>(),
                "",
                Some(&format!("{}", e)),
                None,
                dur.as_millis() as u64,
            );
            Err(format!("无法执行ADB命令: {}", e))
        }
    }
}

#[tauri::command]
async fn connect(adb_path: String, address: String, service: State<'_, Mutex<AdbService>>) -> Result<String, String> {
    let service = service.lock().map_err(|e| e.to_string())?;
    service.connect_device(&adb_path, &address).map_err(|e| e.to_string())
}

#[tauri::command]
async fn disconnect(adb_path: String, address: String, service: State<'_, Mutex<AdbService>>) -> Result<String, String> {
    let service = service.lock().map_err(|e| e.to_string())?;
    service.disconnect_device(&adb_path, &address).map_err(|e| e.to_string())
}

#[tauri::command]
async fn start_server(adb_path: String, service: State<'_, Mutex<AdbService>>) -> Result<String, String> {
    let service = service.lock().map_err(|e| e.to_string())?;
    service.start_server(&adb_path).map_err(|e| e.to_string())
}

#[tauri::command]
async fn kill_server(adb_path: String, service: State<'_, Mutex<AdbService>>) -> Result<String, String> {
    let service = service.lock().map_err(|e| e.to_string())?;
    service.kill_server(&adb_path).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_properties(adb_path: String, device_id: String, service: State<'_, Mutex<AdbService>>) -> Result<String, String> {
    let service = service.lock().map_err(|e| e.to_string())?;
    service.get_device_properties(&adb_path, &device_id).map_err(|e| e.to_string())
}

#[tauri::command]
async fn shell(device_id: String, command: String) -> Result<String, String> {
    crate::services::adb::commands::adb_shell::safe_adb_shell_command(device_id, command).await
}

#[tauri::command]
async fn push(device_id: String, local_path: String, remote_path: String) -> Result<String, String> {
    crate::services::adb::commands::adb_file::safe_adb_push(device_id, local_path, remote_path).await
}

#[tauri::command]
async fn dump_ui(device_id: String) -> Result<String, String> {
    crate::services::adb::commands::ui_automation::adb_dump_ui_xml(device_id).await
}

#[tauri::command]
async fn tap(device_id: String, x: i32, y: i32) -> Result<bool, String> {
    crate::services::adb::commands::ui_automation::adb_tap_coordinate(device_id, x, y).await
}

#[tauri::command]
async fn start_tracking(app_handle: AppHandle) -> Result<(), String> {
    crate::services::adb::tracking::adb_device_tracker::start_device_tracking(app_handle).await
}

#[tauri::command]
async fn stop_tracking() -> Result<(), String> {
    crate::services::adb::tracking::adb_device_tracker::stop_device_tracking().await
}

#[tauri::command]
async fn get_tracking_list() -> Result<Vec<TrackedDevice>, String> {
    crate::services::adb::tracking::adb_device_tracker::get_tracked_devices().await
}

#[tauri::command]
async fn list_apps(
    device_id: String,
    include_system_apps: Option<bool>,
    force_refresh: Option<bool>,
    filter_mode: Option<String>,
    refresh_strategy: Option<String>,
    state: State<'_, SmartAppManagerState>,
) -> Result<Vec<AppInfo>, String> {
    crate::commands::apps::get_device_apps(
        device_id,
        include_system_apps,
        force_refresh,
        filter_mode,
        refresh_strategy,
        state,
    ).await
}

#[tauri::command]
async fn list_apps_paged(
    device_id: String,
    filter_mode: Option<String>,
    refresh_strategy: Option<String>,
    page: Option<u32>,
    page_size: Option<u32>,
    query: Option<String>,
    state: State<'_, SmartAppManagerState>,
) -> Result<PagedApps, String> {
    crate::commands::apps::get_device_apps_paged(
        device_id,
        filter_mode,
        refresh_strategy,
        page,
        page_size,
        query,
        state,
    ).await
}

#[tauri::command]
async fn scan_apps(
    app_handle: AppHandle,
    device_id: String,
    filter_mode: Option<String>,
) -> Result<(), String> {
    crate::commands::apps::scan_device_apps(app_handle, device_id, filter_mode).await
}

#[tauri::command]
async fn get_icon(
    device_id: String,
    package_name: String,
    force_refresh: Option<bool>,
) -> Result<Vec<u8>, String> {
    crate::commands::apps::get_app_icon(device_id, package_name, force_refresh).await
}

#[tauri::command]
async fn validate_connection(device_id: String) -> Result<bool, String> {
    crate::utils::device_utils::validate_device_connection(device_id).await
}

#[tauri::command]
async fn get_ui_dump(device_id: String) -> Result<String, String> {
    crate::commands::ui_dump::get_ui_dump(device_id).await
}

#[tauri::command]
async fn search_apps(
    device_id: String,
    query: String,
    state: State<'_, SmartAppManagerState>,
) -> Result<Vec<AppInfo>, String> {
    crate::commands::apps::search_device_apps(device_id, query, state).await
}

#[tauri::command]
async fn launch_app(
    device_id: String,
    package_name: String,
    state: State<'_, SmartAppManagerState>,
) -> Result<crate::services::smart_app_manager::AppLaunchResult, String> {
    crate::commands::apps::launch_device_app(device_id, package_name, state).await
}

#[tauri::command]
async fn get_cached_apps(
    device_id: String,
    state: State<'_, SmartAppManagerState>,
) -> Result<Vec<AppInfo>, String> {
    crate::commands::apps::get_cached_device_apps(device_id, state).await
}

#[tauri::command]
async fn get_popular_apps() -> Result<Vec<AppInfo>, String> {
    crate::commands::apps::get_popular_apps().await
}

#[tauri::command]
async fn capture_device_screenshot(_device_id: String) -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "success": true,
        "screenshot_path": "stub_path.png",
        "error": null
    }))
}

#[tauri::command]
async fn get_device_ui_xml(_device_id: String) -> Result<String, String> {
    Ok("<node></node>".to_string())
}

#[tauri::command]
async fn get_current_app_info(_device_id: String) -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "package": "com.example.app",
        "activity": "MainActivity"
    }))
}

#[tauri::command]
async fn get_screen_resolution(_device_id: String) -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "width": 1080,
        "height": 1920
    }))
}

#[tauri::command]
async fn execute_ui_action(_device_id: String, _action: serde_json::Value) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
async fn stop_device_mirror(_device_id: String) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
async fn stop_device_mirror_session(_device_id: String, _session_name: String) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
async fn adb_swipe(_device_id: String, _start_x: i32, _start_y: i32, _end_x: i32, _end_y: i32, _duration: i32) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
async fn adb_input_text(_device_id: String, _text: String) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
async fn adb_screenshot(_device_id: String) -> Result<String, String> {
    Ok("stub_path.png".to_string())
}

#[tauri::command]
async fn adb_press_key(_device_id: String, _key_code: i32) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
async fn adb_close_app(_device_id: String, _package_name: String) -> Result<(), String> {
    Ok(())
}

/// 安装 APK 到指定设备
/// - deviceId: 目标设备 ID (如 "emulator-5554" 或 "192.168.1.100:5555")
/// - apkPath: APK 文件的完整路径
#[tauri::command]
async fn adb_install_apk(device_id: String, apk_path: String) -> Result<String, String> {
    let adb_path = get_adb_path();
    
    // 检查 APK 文件是否存在
    if !std::path::Path::new(&apk_path).exists() {
        return Err(format!("APK 文件不存在: {}", apk_path));
    }
    
    let mut cmd = Command::new(&adb_path);
    cmd.args(&["-s", &device_id, "install", "-r", &apk_path]); // -r 表示替换安装
    
    #[cfg(windows)]
    { cmd.creation_flags(0x08000000); } // 隐藏窗口
    
    let start = Instant::now();
    let res = cmd.output();
    let dur = start.elapsed();
    
    match res {
        Ok(output) => {
            let out_str = String::from_utf8_lossy(&output.stdout).to_string();
            let err_str = String::from_utf8_lossy(&output.stderr).to_string();
            
            LOG_COLLECTOR.add_adb_command_log(
                &adb_path,
                &vec!["-s".to_string(), device_id.clone(), "install".to_string(), "-r".to_string(), apk_path.clone()],
                &out_str,
                if err_str.is_empty() { None } else { Some(err_str.as_str()) },
                output.status.code(),
                dur.as_millis() as u64,
            );
            
            // ADB install 成功时 stdout 会包含 "Success"
            if out_str.contains("Success") {
                Ok(format!("APK 安装成功 (耗时 {:.1}s)", dur.as_secs_f32()))
            } else if out_str.contains("INSTALL_FAILED") || err_str.contains("INSTALL_FAILED") {
                // 解析常见安装失败原因
                let reason = if out_str.contains("INSTALL_FAILED_ALREADY_EXISTS") {
                    "应用已存在且版本相同"
                } else if out_str.contains("INSTALL_FAILED_INSUFFICIENT_STORAGE") {
                    "设备存储空间不足"
                } else if out_str.contains("INSTALL_FAILED_INVALID_APK") {
                    "APK 文件无效或损坏"
                } else if out_str.contains("INSTALL_FAILED_VERSION_DOWNGRADE") {
                    "无法降级安装，请先卸载旧版本"
                } else if out_str.contains("INSTALL_FAILED_USER_RESTRICTED") {
                    "请在手机上允许 USB 安装应用"
                } else {
                    "安装失败"
                };
                Err(format!("{}: {}", reason, out_str.trim()))
            } else if output.status.success() {
                // 有些设备不输出 Success 但状态码是 0
                Ok(format!("APK 安装完成 (耗时 {:.1}s)", dur.as_secs_f32()))
            } else {
                Err(format!("安装失败: {}{}", out_str, err_str))
            }
        }
        Err(e) => {
            LOG_COLLECTOR.add_adb_command_log(
                &adb_path,
                &vec!["-s".to_string(), device_id, "install".to_string(), "-r".to_string(), apk_path],
                "",
                Some(&format!("{}", e)),
                None,
                dur.as_millis() as u64,
            );
            Err(format!("无法执行 ADB 安装命令: {}", e))
        }
    }
}

#[tauri::command]
async fn adb_uninstall_app(_device_id: String, _package_name: String) -> Result<(), String> {
    Ok(())
}

/// 获取内置 Agent APK 的路径
/// 开发环境: 直接返回项目目录下的路径
/// 生产环境: 返回打包后资源目录下的路径
#[tauri::command]
async fn get_bundled_agent_apk() -> Result<String, String> {
    // 方法1: 检查当前目录的 agent-apk 文件夹 (开发环境 - 如果从项目根目录运行)
    let dev_path = std::path::Path::new("agent-apk/employee-agent.apk");
    if dev_path.exists() {
        return Ok(dev_path.canonicalize()
            .map_err(|e| format!("无法获取绝对路径: {}", e))?
            .to_string_lossy()
            .to_string());
    }
    
    // 方法2: 检查父目录的 agent-apk 文件夹 (开发环境 - 如果从 src-tauri 目录运行)
    let parent_dev_path = std::path::Path::new("../agent-apk/employee-agent.apk");
    if parent_dev_path.exists() {
        return Ok(parent_dev_path.canonicalize()
            .map_err(|e| format!("无法获取绝对路径: {}", e))?
            .to_string_lossy()
            .to_string());
    }
    
    // 方法3: 检查 exe 同级目录 (生产环境打包后)
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            let prod_path = exe_dir.join("agent-apk").join("employee-agent.apk");
            if prod_path.exists() {
                return Ok(prod_path.to_string_lossy().to_string());
            }
        }
    }
    
    // 方法4: 检查 exe 的父级目录 (某些打包方式)
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            if let Some(parent_dir) = exe_dir.parent() {
                let alt_path = parent_dir.join("agent-apk").join("employee-agent.apk");
                if alt_path.exists() {
                    return Ok(alt_path.to_string_lossy().to_string());
                }
            }
        }
    }
    
    // 获取当前目录用于调试信息
    let cwd = std::env::current_dir()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|_| "unknown".to_string());
    
    Err(format!(
        "未找到内置的 Agent APK 文件。当前目录: {}，请确保 agent-apk/employee-agent.apk 存在。",
        cwd
    ))
}

pub fn init() -> TauriPlugin<Wry> {
    Builder::new("adb")
        .invoke_handler(tauri::generate_handler![
            execute,
            check_file,
            detect_ldplayer,
            detect_path,
            list_devices,
            version,
            start_server_simple,
            kill_server_simple,
            execute_simple,
            connect,
            disconnect,
            start_server,
            kill_server,
            get_properties,
            shell,
            push,
            dump_ui,
            tap,
            start_tracking,
            stop_tracking,
            get_tracking_list,
            list_apps,
            list_apps_paged,
            scan_apps,
            get_icon,
            validate_connection,
            get_ui_dump,
            search_apps,
            launch_app,
            get_cached_apps,
            get_popular_apps,
            capture_device_screenshot,
            get_device_ui_xml,
            get_current_app_info,
            get_screen_resolution,
            execute_ui_action,
            stop_device_mirror,
            stop_device_mirror_session,
            adb_swipe,
            adb_input_text,
            adb_screenshot,
            adb_press_key,
            adb_close_app,
            adb_install_apk,
            adb_uninstall_app,
            get_bundled_agent_apk
        ])
        .build()
}
