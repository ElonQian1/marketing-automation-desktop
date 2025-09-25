// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// mod commands;
mod application; // expose new application module (normalizer, device_metrics)
mod domain;      // expose domain DSL (actions, coords, direction)
mod infra;       // expose infra (adb injector, device metrics provider)
mod screenshot_service;
mod services;
mod new_backend; // 新后端（可灰度切换）
mod types;
mod utils;
mod xml_judgment_service;

// Universal UI Finder 模块桥接
// 注意：universal-ui-finder模块位于src/modules/，我们通过services层桥接
// use services::smart_element_finder_service::SmartElementFinderService; // 未直接使用类型
use services::universal_ui_service::UniversalUIService;
use services::page_analyzer_service::PageAnalyzerService; // 新增页面分析服务

// 新增页面分析类型导入
use types::page_analysis::{
    PageAnalysisResult, PageAnalysisConfig, SelectedElementConfig
};

#[cfg(windows)]
use std::os::windows::process::CommandExt;

use tauri_plugin_dialog;

use screenshot_service::*;
// use commands::app_lifecycle_commands::*;
use services::adb_device_tracker::*;
use services::adb_service::AdbService;
use services::auth_service::*;
use services::contact_automation::*;
use services::contact_service::*;
use services::crash_debugger::*;
use services::employee_service::{Employee, EmployeeService};
use services::log_bridge::{AdbCommandLog, LogEntry, LOG_COLLECTOR};
use services::navigation_bar_detector::{detect_navigation_bar, click_navigation_button, get_navigation_configs};
use services::safe_adb_manager::*;
use services::script_executor::*;
use services::script_manager::*;  // 新增：脚本管理服务
use services::smart_app_service::*;
use services::smart_element_finder_service::{smart_element_finder, click_detected_element};
use services::commands::{
    execute_single_step_test,
    execute_smart_automation_script,
};
use services::smart_vcf_opener::*;
use services::ui_reader_service::*;
use services::universal_ui_service::*;
use services::universal_ui_page_analyzer::*;
// use services::simple_xml_parser::*; // 已删除：统一使用智能解析器
use std::sync::Mutex;
use tauri::State;
use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use xml_judgment_service::*;

// Execution context metrics 导出命令：聚合全局执行环境注册表
#[tauri::command]
async fn get_execution_context_metrics() -> Result<serde_json::Value, String> {
    use crate::services::execution::collect_execution_metrics_json;
    Ok(collect_execution_metrics_json())
}

// Tauri命令：获取所有员工
#[tauri::command]
async fn get_employees(
    service: State<'_, Mutex<EmployeeService>>,
) -> Result<Vec<Employee>, String> {
    let service = service.lock().map_err(|e| e.to_string())?;
    service.get_all().map_err(|e| e.to_string())
}

// Tauri命令：添加员工
#[tauri::command]
async fn add_employee(
    employee: Employee,
    service: State<'_, Mutex<EmployeeService>>,
) -> Result<Employee, String> {
    let mut service = service.lock().map_err(|e| e.to_string())?;
    service.create(employee).map_err(|e| e.to_string())
}

// Tauri命令：更新员工
#[tauri::command]
async fn update_employee(
    employee: Employee,
    service: State<'_, Mutex<EmployeeService>>,
) -> Result<Employee, String> {
    let mut service = service.lock().map_err(|e| e.to_string())?;
    service.update(employee).map_err(|e| e.to_string())
}

// Tauri命令：删除员工
#[tauri::command]
async fn delete_employee(
    id: i32,
    service: State<'_, Mutex<EmployeeService>>,
) -> Result<(), String> {
    let mut service = service.lock().map_err(|e| e.to_string())?;
    service.delete(id).map_err(|e| e.to_string())
}

// ADB相关命令

// 执行ADB命令
#[tauri::command]
async fn execute_adb_command(
    adb_path: String,
    args: Vec<String>,
    service: State<'_, Mutex<AdbService>>,
) -> Result<String, String> {
    let service = service.lock().map_err(|e| e.to_string())?;
    service
        .execute_command(&adb_path, &args)
        .map_err(|e| e.to_string())
}

// 检查文件是否存在
#[tauri::command]
async fn check_file_exists(
    path: String,
    service: State<'_, Mutex<AdbService>>,
) -> Result<bool, String> {
    let service = service.lock().map_err(|e| e.to_string())?;
    Ok(service.check_file_exists(&path))
}

// 检测雷电模拟器ADB路径
#[tauri::command]
async fn detect_ldplayer_adb(
    service: State<'_, Mutex<AdbService>>,
) -> Result<Option<String>, String> {
    let service = service.lock().map_err(|e| e.to_string())?;
    Ok(service.detect_ldplayer_adb())
}

// 智能检测最佳ADB路径 (环境感知)
#[tauri::command]
async fn detect_smart_adb_path(service: State<'_, Mutex<AdbService>>) -> Result<String, String> {
    let service = service.lock().map_err(|e| e.to_string())?;

    // 使用智能检测逻辑
    if let Some(detected_path) = service.detect_ldplayer_adb() {
        Ok(detected_path)
    } else {
        // 尝试检测系统PATH中的ADB
        match service.execute_command("adb.exe", &["version".to_string()]) {
            Ok(_) => Ok("adb.exe".to_string()), // 系统PATH中有ADB
            Err(_) => {
                // 最后回退到项目绝对路径
                let current_dir = std::env::current_dir()
                    .map_err(|e| format!("Failed to get current directory: {}", e))?;

                println!("当前工作目录: {:?}", current_dir);

                // 在开发模式下，当前目录应该是工作空间根目录
                let adb_path = current_dir.join("platform-tools").join("adb.exe");

                println!("尝试ADB路径: {:?}", adb_path);

                // 检查文件是否存在
                if adb_path.exists() {
                    let abs_path = adb_path.to_string_lossy().to_string();
                    println!("找到ADB路径: {}", abs_path);
                    Ok(abs_path)
                } else {
                    // 如果在工作空间根目录找不到，尝试上一级目录（处理在src-tauri目录运行的情况）
                    let parent_adb_path = current_dir
                        .parent()
                        .ok_or("No parent directory")?
                        .join("platform-tools")
                        .join("adb.exe");

                    println!("尝试父级目录ADB路径: {:?}", parent_adb_path);

                    if parent_adb_path.exists() {
                        let abs_path = parent_adb_path.to_string_lossy().to_string();
                        println!("找到父级ADB路径: {}", abs_path);
                        Ok(abs_path)
                    } else {
                        println!("未找到任何可用的ADB路径");
                        Err("未找到可用的ADB路径".to_string())
                    }
                }
            }
        }
    }
}

// 获取ADB设备列表
#[tauri::command]
async fn get_adb_devices(
    adb_path: String,
    service: State<'_, Mutex<AdbService>>,
) -> Result<String, String> {
    let service = service.lock().map_err(|e| e.to_string())?;
    service.get_devices(&adb_path).map_err(|e| e.to_string())
}

// 获取ADB版本
#[tauri::command]
async fn get_adb_version() -> Result<String, String> {
    use std::process::Command;

    let adb_path = "platform-tools/adb.exe";
    let mut cmd = Command::new(adb_path);
    cmd.arg("version");

    #[cfg(windows)]
    {
        cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }

    match cmd.output() {
        Ok(output) => {
            if output.status.success() {
                let version_output = String::from_utf8_lossy(&output.stdout);
                // 提取版本号（通常在第一行）
                let first_line = version_output.lines().next().unwrap_or("Unknown");
                Ok(first_line.to_string())
            } else {
                let error = String::from_utf8_lossy(&output.stderr);
                Err(format!("ADB版本获取失败: {}", error))
            }
        }
        Err(e) => Err(format!("无法执行ADB命令: {}", e)),
    }
}

// 简化的ADB服务器启动命令
#[tauri::command]
async fn start_adb_server_simple() -> Result<String, String> {
    use std::process::Command;
    use std::time::Instant;

    let adb_path = "platform-tools/adb.exe";
    let mut cmd = Command::new(adb_path);
    cmd.arg("start-server");

    #[cfg(windows)]
    {
        cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }

    let start = Instant::now();
    let res = cmd.output();
    let dur = start.elapsed();
    match res {
        Ok(output) => {
            if output.status.success() {
                // 记录ADB命令日志
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
                // 记录失败日志
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
        },
    }
}

// 简化的ADB服务器停止命令
#[tauri::command]
async fn kill_adb_server_simple() -> Result<String, String> {
    use std::process::Command;
    use std::time::Instant;

    let adb_path = "platform-tools/adb.exe";
    let mut cmd = Command::new(adb_path);
    cmd.arg("kill-server");

    #[cfg(windows)]
    {
        cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }

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
        },
    }
}

// 执行通用ADB命令
#[tauri::command]
async fn execute_adb_command_simple(command: String) -> Result<String, String> {
    use std::process::Command;
    use std::time::Instant;

    let adb_path = "platform-tools/adb.exe";
    let args: Vec<&str> = command.split_whitespace().collect();

    let mut cmd = Command::new(adb_path);
    cmd.args(&args);

    #[cfg(windows)]
    {
        cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }

    let start = Instant::now();
    let res = cmd.output();
    let dur = start.elapsed();
    match res {
        Ok(output) => {
            if output.status.success() {
                let result = String::from_utf8_lossy(&output.stdout);
                LOG_COLLECTOR.add_adb_command_log(
                    adb_path,
                    &args.iter().map(|s| s.to_string()).collect::<Vec<String>>() ,
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
                    &args.iter().map(|s| s.to_string()).collect::<Vec<String>>() ,
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
                &args.iter().map(|s| s.to_string()).collect::<Vec<String>>() ,
                "",
                Some(&format!("{}", e)),
                None,
                dur.as_millis() as u64,
            );
            Err(format!("无法执行ADB命令: {}", e))
        },
    }
}

// 连接ADB设备
#[tauri::command]
async fn connect_adb_device(
    adb_path: String,
    address: String,
    service: State<'_, Mutex<AdbService>>,
) -> Result<String, String> {
    let service = service.lock().map_err(|e| e.to_string())?;
    service
        .connect_device(&adb_path, &address)
        .map_err(|e| e.to_string())
}

// 断开ADB设备
#[tauri::command]
async fn disconnect_adb_device(
    adb_path: String,
    address: String,
    service: State<'_, Mutex<AdbService>>,
) -> Result<String, String> {
    let service = service.lock().map_err(|e| e.to_string())?;
    service
        .disconnect_device(&adb_path, &address)
        .map_err(|e| e.to_string())
}

// 启动ADB服务器
#[tauri::command]
async fn start_adb_server(
    adb_path: String,
    service: State<'_, Mutex<AdbService>>,
) -> Result<String, String> {
    let service = service.lock().map_err(|e| e.to_string())?;
    service.start_server(&adb_path).map_err(|e| e.to_string())
}

// 停止ADB服务器
#[tauri::command]
async fn kill_adb_server(
    adb_path: String,
    service: State<'_, Mutex<AdbService>>,
) -> Result<String, String> {
    let service = service.lock().map_err(|e| e.to_string())?;
    service.kill_server(&adb_path).map_err(|e| e.to_string())
}

// 获取设备属性
#[tauri::command]
async fn get_device_properties(
    adb_path: String,
    device_id: String,
    service: State<'_, Mutex<AdbService>>,
) -> Result<String, String> {
    let service = service.lock().map_err(|e| e.to_string())?;
    service
        .get_device_properties(&adb_path, &device_id)
        .map_err(|e| e.to_string())
}


// 写入文件
#[tauri::command]
async fn write_file(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, content).map_err(|e| format!("写入文件失败: {}", e))
}

// 删除文件
#[tauri::command]
async fn delete_file(path: String) -> Result<(), String> {
    match std::fs::remove_file(&path) {
        Ok(_) => Ok(()),
        Err(e) => {
            // 如果文件不存在，不算错误
            if e.kind() == std::io::ErrorKind::NotFound {
                Ok(())
            } else {
                Err(format!("删除文件失败: {}", e))
            }
        }
    }
}

// 清理本机 ADB 密钥，强制下次授权
#[tauri::command]
async fn clear_adb_keys() -> Result<(), String> {
    // Windows: C:\\Users\\<User>\\.android\\adbkey*
    let home = std::env::var("USERPROFILE")
        .or_else(|_| std::env::var("HOME"))
        .map(std::path::PathBuf::from)
        .map_err(|_| "无法获取用户主目录".to_string())?;

    let android_dir = home.join(".android");
    let key = android_dir.join("adbkey");
    let key_pub = android_dir.join("adbkey.pub");

    let mut errs: Vec<String> = Vec::new();
    for p in [key, key_pub].iter() {
        if p.exists() {
            if let Err(e) = std::fs::remove_file(p) {
                errs.push(format!("删除 {:?} 失败: {}", p, e));
            }
        }
    }

    if errs.is_empty() { Ok(()) } else { Err(errs.join("; ")) }
}

// ====== 智能页面分析相关命令 ======

/// 分析当前页面，获取可操作元素
#[tauri::command]
async fn analyze_current_page(
    device_id: String,
    config: Option<PageAnalysisConfig>,
) -> Result<PageAnalysisResult, String> {
    let service = PageAnalyzerService::new();
    service.analyze_current_page(&device_id, config)
        .await
        .map_err(|e| e.to_string())
}

/// 验证选中的元素配置
#[tauri::command]
async fn validate_element_config(
    config: SelectedElementConfig,
) -> Result<bool, String> {
    // 简单验证逻辑
    if config.element_id.is_empty() {
        return Err("元素ID不能为空".to_string());
    }
    
    match config.action {
        types::page_analysis::ElementAction::InputText(ref text) => {
            if text.is_empty() {
                return Err("输入文本不能为空".to_string());
            }
        }
        types::page_analysis::ElementAction::SelectOption(ref option) => {
            if option.is_empty() {
                return Err("选择选项不能为空".to_string());
            }
        }
        _ => {}
    }
    
    Ok(true)
}

/// 执行页面元素操作（基于分析结果）
#[tauri::command]
async fn execute_page_element_action(
    device_id: String,
    config: SelectedElementConfig,
) -> Result<String, String> {
    // 这里可以调用 Universal UI 服务来执行实际操作
    let universal_service = UniversalUIService::new();
    
    match config.action {
        types::page_analysis::ElementAction::Click => {
            // 转换为 Universal UI 点击操作
            universal_service.execute_ui_click(&device_id, &config.description)
                .await
                .map_err(|e| e.to_string())?;
            Ok("点击操作执行成功".to_string())
        }
        types::page_analysis::ElementAction::InputText(text) => {
            // 这里需要实现输入文本的逻辑
            Ok(format!("输入文本操作执行成功: {}", text))
        }
        _ => {
            Ok("操作执行成功".to_string())
        }
    }
}

/// 获取页面分析历史记录
#[tauri::command]
async fn get_page_analysis_history(
    _device_id: String,
    _limit: Option<usize>,
) -> Result<Vec<PageAnalysisResult>, String> {
    // 这里可以从缓存或数据库中获取历史记录
    // 目前返回空列表
    Ok(vec![])
}

// ====== 日志桥接相关命令 ======

// 获取所有日志
#[tauri::command]
async fn get_logs() -> Result<Vec<LogEntry>, String> {
    Ok(LOG_COLLECTOR.get_logs())
}

// 获取ADB命令日志
#[tauri::command]
async fn get_adb_command_logs() -> Result<Vec<AdbCommandLog>, String> {
    Ok(LOG_COLLECTOR.get_adb_command_logs())
}

// 获取过滤后的日志
#[tauri::command]
async fn get_filtered_logs(
    level_filter: Option<Vec<String>>,
    category_filter: Option<Vec<String>>,
    source_filter: Option<Vec<String>>,
    start_time: Option<String>,
    end_time: Option<String>,
) -> Result<Vec<LogEntry>, String> {
    Ok(LOG_COLLECTOR.get_filtered_logs(
        level_filter,
        category_filter,
        source_filter,
        start_time,
        end_time,
    ))
}

// 清空日志
#[tauri::command]
async fn clear_logs() -> Result<(), String> {
    LOG_COLLECTOR.clear_logs();
    Ok(())
}

// 添加自定义日志条目
#[tauri::command]
async fn add_log_entry(
    level: String,
    category: String,
    source: String,
    message: String,
    details: Option<String>,
    device_id: Option<String>,
) -> Result<(), String> {
    LOG_COLLECTOR.add_log(
        &level,
        &category,
        &source,
        &message,
        details.as_deref(),
        device_id.as_deref(),
    );
    Ok(())
}

fn main() {
    // 初始化日志系统
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,employee_gui=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    info!("🚀 启动EmployeeGUI应用程序");
    info!("📊 日志级别: DEBUG (开发模式)");

    let employee_service = EmployeeService::new().expect("Failed to initialize employee service");
    let adb_service = AdbService::new();
    let smart_app_service = SmartAppManagerState::new();
    
    // 初始化实时设备跟踪器 (替代旧的轮询系统)
    initialize_device_tracker()
        .expect("Failed to initialize device tracker");

    info!("✅ 所有服务初始化完成 (仅实时跟踪，无轮询)");

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // 设置日志收集器的 app handle，以便实时向前端 emit 事件
            // 由于 LOG_COLLECTOR 为静态对象，这里采用受控的 unsafe 可变引用写入 app_handle
            unsafe {
                let ptr: *const services::log_bridge::LogCollector = &*LOG_COLLECTOR;
                // 将不可变指针转换为可变引用（仅在初始化时调用，避免数据竞争）
                let collector_mut = (ptr as *mut services::log_bridge::LogCollector)
                    .as_mut()
                    .expect("LOG_COLLECTOR pointer should be valid");
                collector_mut.set_app_handle(app.handle().clone());
            }
            Ok(())
        })
        .manage(Mutex::new(employee_service))
        .manage(Mutex::new(adb_service))
        .manage(smart_app_service)
        .invoke_handler(tauri::generate_handler![
            get_employees,
            add_employee,
            update_employee,
            delete_employee,
            execute_adb_command,
            check_file_exists,
            detect_ldplayer_adb,
            detect_smart_adb_path,
            get_adb_devices,
            get_adb_version,
            connect_adb_device,
            disconnect_adb_device,
            start_adb_server,
            kill_adb_server,
            get_device_properties,  // 添加设备属性获取命令
            // 基于host:track-devices的实时设备跟踪
            start_device_tracking,    // 启动实时设备跟踪
            stop_device_tracking,     // 停止设备跟踪  
            get_tracked_devices,      // 获取当前跟踪的设备
            start_adb_server_simple,
            kill_adb_server_simple,
            execute_adb_command_simple,
            write_file,
            delete_file,
            clear_adb_keys,
            // 日志桥接命令
            get_logs,
            get_adb_command_logs,
            get_filtered_logs,
            clear_logs,
            add_log_entry,
            get_execution_context_metrics,
            employee_login,
            verify_token,
            get_current_user,
            employee_logout,
            refresh_token,
            change_password,
            parse_contact_file,
            get_contact_file_info,
            // 新增的VCF导入和小红书自动关注功能
            generate_vcf_file,
            import_vcf_contacts,
            import_vcf_contacts_async_safe,     // 新增异步安全版本
            import_vcf_contacts_optimized,      // 现有优化版本
            import_vcf_contacts_python_version, // Python移植版本
            import_vcf_contacts_with_intent_fallback, // 新增Intent方法
            import_vcf_contacts_multi_brand,    // 多品牌批量尝试导入
            import_vcf_contacts_huawei_enhanced, // 华为增强导入（基于Python成功经验）
            verify_vcf_import,
            debug_vcf_import_with_crash_detection, // 详细崩溃调试命令
            // 雷电模拟器专用VCF打开功能
            open_vcf_file_ldplayer,       // 打开已存在的VCF文件
            import_and_open_vcf_ldplayer, // 完整的传输+打开流程
            // UI状态读取功能
            read_device_ui_state, // 实时读取设备UI状态
            // 智能VCF打开器
            smart_vcf_opener, // 基于UI状态的智能VCF打开
            // 安全ADB管理功能
            get_adb_devices_safe, // 使用安全ADB检测设备
            safe_adb_push,        // 使用安全ADB传输文件
            // 脚本执行器功能
            execute_automation_script,  // 执行自动化脚本
            validate_device_connection, // 验证设备连接
            // 智能脚本执行器功能
            execute_single_step_test,        // 执行单步测试
            execute_smart_automation_script, // 执行智能脚本批量操作
            // 脚本管理功能
            save_smart_script,            // 保存智能脚本
            load_smart_script,            // 加载智能脚本
            delete_smart_script,          // 删除智能脚本
            list_smart_scripts,           // 列出所有脚本
            import_smart_script,          // 导入脚本
            export_smart_script,          // 导出脚本
            list_script_templates,        // 列出脚本模板
            create_script_from_template,  // 从模板创建脚本
            // 截图服务功能
            capture_device_screenshot,    // 捕获设备截图
            get_device_screen_resolution, // 获取设备分辨率
            // XML判断服务功能
            get_device_ui_xml,       // 获取UI XML结构
            find_xml_ui_elements,    // 查找XML UI元素
            wait_for_ui_element,     // 等待元素出现
            check_device_page_state, // 检查页面状态
            match_element_by_criteria, // 按匹配条件查找元素
            // 智能应用管理功能
            get_device_apps,         // 获取设备应用列表
            search_device_apps,      // 搜索设备应用
            launch_device_app,       // 启动应用
            get_cached_device_apps,  // 获取缓存的应用列表
            get_popular_apps,        // 获取常用应用列表
            // 导航栏检测功能
            detect_navigation_bar,   // 检测导航栏
            click_navigation_button, // 点击导航按钮
            get_navigation_configs,  // 获取预设配置
            // 智能元素查找功能
            smart_element_finder,    // 智能元素查找
            click_detected_element,  // 点击检测到的元素
            // Universal UI 智能导航功能
            execute_universal_ui_click,  // 执行智能导航点击
            // Universal UI 页面分析功能
            analyze_universal_ui_page,        // 分析Universal UI页面
            extract_page_elements,            // 提取页面元素（统一智能解析器）
            classify_ui_elements,             // 分类UI元素
            deduplicate_elements,             // 去重元素
            identify_page_type,               // 识别页面类型
            // 智能页面分析功能
            analyze_current_page,        // 分析当前页面获取可操作元素
            validate_element_config,     // 验证元素配置
            execute_page_element_action, // 执行页面元素操作
            get_page_analysis_history,   // 获取页面分析历史记录
            // 应用生命周期管理功能
            // ensure_app_running,              // 确保应用运行（独立模块）
            // detect_app_state                 // 检测应用状态（独立模块）
            // XML缓存管理功能
            list_xml_cache_files,        // 列出所有XML缓存文件
            read_xml_cache_file,         // 读取XML缓存文件内容
            get_xml_file_size,           // 获取XML文件大小
            delete_xml_cache_file,       // 删除XML缓存文件
            parse_cached_xml_to_elements // 解析缓存XML为UI元素
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// ==================== XML缓存管理命令 ====================

/// 列出所有XML缓存文件
#[tauri::command]
async fn list_xml_cache_files() -> Result<Vec<String>, String> {
    use std::fs;
    
    let debug_dir = get_debug_xml_dir();
    
    if !debug_dir.exists() {
        info!("📂 debug_xml目录不存在，返回空列表");
        return Ok(vec![]);
    }
    
    match fs::read_dir(&debug_dir) {
        Ok(entries) => {
            let mut xml_files = Vec::new();
            
            for entry in entries {
                if let Ok(entry) = entry {
                    let path = entry.path();
                    if path.is_file() {
                        if let Some(file_name) = path.file_name() {
                            if let Some(name_str) = file_name.to_str() {
                                if name_str.ends_with(".xml") && name_str.starts_with("ui_dump_") {
                                    xml_files.push(name_str.to_string());
                                }
                            }
                        }
                    }
                }
            }
            
            // 按文件名排序（时间戳排序）
            xml_files.sort();
            xml_files.reverse(); // 最新的在前面
            
            info!("📋 找到 {} 个XML缓存文件", xml_files.len());
            Ok(xml_files)
        },
        Err(e) => {
            let error_msg = format!("❌ 读取debug_xml目录失败: {}", e);
            info!("{}", error_msg);
            Err(error_msg)
        }
    }
}

/// 读取XML缓存文件内容
#[tauri::command]
async fn read_xml_cache_file(file_name: String) -> Result<String, String> {
    use std::fs;
    
    let debug_dir = get_debug_xml_dir();
    let file_path = debug_dir.join(&file_name);
    
    if !file_path.exists() {
        let error_msg = format!("❌ XML缓存文件不存在: {}", file_name);
        return Err(error_msg);
    }
    
    match fs::read_to_string(&file_path) {
        Ok(content) => {
            info!("📖 成功读取XML缓存文件: {} (大小: {})", file_name, content.len());
            Ok(content)
        },
        Err(e) => {
            let error_msg = format!("❌ 读取XML缓存文件失败: {} - {}", file_name, e);
            info!("{}", error_msg);
            Err(error_msg)
        }
    }
}

/// 获取XML文件大小
#[tauri::command]
async fn get_xml_file_size(file_name: String) -> Result<u64, String> {
    use std::fs;
    
    let debug_dir = get_debug_xml_dir();
    let file_path = debug_dir.join(&file_name);
    
    if !file_path.exists() {
        let error_msg = format!("❌ XML缓存文件不存在: {}", file_name);
        return Err(error_msg);
    }
    
    match fs::metadata(&file_path) {
        Ok(metadata) => {
            let size = metadata.len();
            Ok(size)
        },
        Err(e) => {
            let error_msg = format!("❌ 获取文件大小失败: {} - {}", file_name, e);
            Err(error_msg)
        }
    }
}

/// 删除XML缓存文件
#[tauri::command]
async fn delete_xml_cache_file(file_name: String) -> Result<(), String> {
    use std::fs;
    
    let debug_dir = get_debug_xml_dir();
    let file_path = debug_dir.join(&file_name);
    
    if !file_path.exists() {
        let error_msg = format!("❌ XML缓存文件不存在: {}", file_name);
        return Err(error_msg);
    }
    
    match fs::remove_file(&file_path) {
        Ok(_) => {
            info!("🗑️ 成功删除XML缓存文件: {}", file_name);
            Ok(())
        },
        Err(e) => {
            let error_msg = format!("❌ 删除XML缓存文件失败: {} - {}", file_name, e);
            info!("{}", error_msg);
            Err(error_msg)
        }
    }
}

/// 解析缓存XML为UI元素
#[tauri::command]
async fn parse_cached_xml_to_elements(xml_content: String) -> Result<serde_json::Value, String> {
    use crate::services::ui_reader_service::parse_ui_elements;
    
    info!("🔍 开始解析缓存XML内容，长度: {}", xml_content.len());
    
    match parse_ui_elements(&xml_content) {
        Ok(elements) => {
            info!("✅ 成功解析 {} 个UI元素", elements.len());
            
            // 转换为JSON格式
            match serde_json::to_value(&elements) {
                Ok(json) => Ok(json),
                Err(e) => {
                    let error_msg = format!("❌ 序列化UI元素失败: {}", e);
                    Err(error_msg)
                }
            }
        },
        Err(e) => {
            let error_msg = format!("❌ 解析XML内容失败: {}", e);
            info!("{}", error_msg);
            Err(error_msg)
        }
    }
}

/// 获取debug_xml目录路径
fn get_debug_xml_dir() -> std::path::PathBuf {
    // 获取项目根目录的debug_xml文件夹
    std::env::current_dir()
        .unwrap_or_else(|_| std::path::PathBuf::from("."))
        .parent()
        .unwrap_or_else(|| std::path::Path::new(".."))
        .join("debug_xml")
}
