use tauri::{plugin::{Builder, TauriPlugin}, Runtime, Manager, State};
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
async fn start_tracking(device_id: String, app_handle: AppHandle) -> Result<(), String> {
    crate::services::adb::tracking::adb_device_tracker::start_device_tracking(device_id, app_handle).await
}

#[tauri::command]
async fn stop_tracking(device_id: String) -> Result<(), String> {
    crate::services::adb::tracking::adb_device_tracker::stop_device_tracking(device_id).await
}

#[tauri::command]
async fn get_tracking_list() -> Result<Vec<String>, String> {
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
async fn get_icon(
    device_id: String,
    package_name: String,
    force_refresh: Option<bool>,
) -> Result<Vec<u8>, String> {
    crate::commands::apps::get_app_icon(device_id, package_name, force_refresh).await
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
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
            get_icon
        ])
        .build()
}
