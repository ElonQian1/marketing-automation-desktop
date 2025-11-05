// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// mod commands;
mod application; // expose new application module (normalizer, device_metrics)
mod domain;      // expose domain DSL (actions, coords, direction)
mod infra;       // expose infra (adb injector, device metrics provider)
mod infrastructure; // 事件系统
mod engine;      // 策略引擎：插件化决策链系统
mod screenshot_service;
mod services;
mod commands; // 新增：集中管理 Tauri 命令
mod new_backend; // 新后端（可灰度切换）
mod types;
mod utils;
mod ai; // AI 模块
mod config; // 配置模块
mod device; // 设备提供者与回放编排器
mod exec; // V3 统一执行协议模块
mod db; // 数据库模块
// pub mod xml_judgment_service; // 新模块化 XML 判断服务 (旧文件已弃用) - 暂时注释，文件不存在

// Universal UI Finder 模块桥接
// 注意：universal-ui-finder模块位于src/modules/，我们通过services层桥接
// use services::smart_element_finder_service::SmartElementFinderService; // 未直接使用类型
// 页面分析与 Universal UI 相关类型/服务已在 commands 模块中使用，不再直接在 main.rs 引入
// use services::page_analyzer_service::PageAnalyzerService;
// use types::page_analysis::{ PageAnalysisResult, PageAnalysisConfig, SelectedElementConfig };

use tauri_plugin_dialog;
use std::sync::Mutex; // 为 .manage 使用
#[cfg(windows)]
// use std::os::windows::process::CommandExt; // 为 adb.rs 创建进程 flags 所需

use screenshot_service::*;
use commands::*; // 引入拆分后的命令（所有 #[tauri::command] 均集中）
use services::script_executor::validate_device_connection;
use services::smart_app_service::get_device_apps;
// Phase 3: 版本控制系统命令导入
use crate::domain::analysis_cache::version_commands::{
    init_version_control, create_version, query_versions, create_branch, 
    list_branches, compute_xml_diff, rebuild_version, get_version_storage_stats,
    check_version_integrity, delete_version, get_version_control_status
};
use tracing::info; // 引入info!宏
// use commands::app_lifecycle_commands::*;
use services::adb_device_tracker::*;
use services::adb_service::AdbService;
use services::auth_service::*;
use services::adb_activity::{adb_start_activity, adb_open_contacts_app, adb_view_file};
use services::contact_automation::*;
use services::contact_service::*;
use services::contact_storage::*; // 导入号码存储命令（现在使用模块化版本）
use services::contact_storage::commands::{
    get_contact_number_stats_cmd,
    get_distinct_industries_cmd,
    get_numbers_by_files,
    set_contact_numbers_industry_by_id_range,
    list_txt_import_records_cmd,
    delete_txt_import_record_cmd,
    list_vcf_batch_records_cmd,
    create_vcf_batch_with_numbers_cmd,
};
use services::contact_verification::verify_contacts_fast; // 新增：快速验证服务
use services::crash_debugger::*;
use services::diagnostic_service::{get_adb_path_cmd, get_environment_info, test_device_responsiveness, run_full_diagnostic}; // 新增：诊断服务
use services::employee_service::EmployeeService;
use services::log_bridge::LOG_COLLECTOR; // 仅用于设置 app handle
use services::navigation_bar_detector::{detect_navigation_bar, click_navigation_button, get_navigation_configs};
use services::safe_adb_manager::*;
use services::safe_adb_shell::safe_adb_shell_command;
use services::device_contact_metrics::get_device_contact_count;
use services::script_executor::*;
use services::script_manager::*;  // 新增：脚本管理服务
use services::smart_app_service::*;
use services::smart_element_finder_service::{smart_element_finder, click_detected_element};
use services::commands::{execute_single_step_test, execute_smart_automation_script, execute_smart_automation_script_multi};
use services::scrcpy_manager::{start_device_mirror, stop_device_mirror, stop_device_mirror_session, list_device_mirror_sessions, cleanup_all, check_scrcpy_available, get_scrcpy_capabilities};
// 直接使用的其他命令函数（未在 commands::* re-export 中覆盖的服务命令）
use services::ui_reader_service::read_device_ui_state;
use services::smart_vcf_opener::smart_vcf_opener;
// 注意: write_file, delete_file, reveal_in_file_manager 已在 commands/files.rs 中定义
// use xml_judgment_service::{
//     get_device_ui_xml,
//     find_xml_ui_elements,
//     wait_for_ui_element,
//     check_device_page_state,
//     match_element_by_criteria,
// };
use services::universal_ui_service::execute_universal_ui_click;
use services::universal_ui_page_analyzer::{
    analyze_universal_ui_page,
    extract_page_elements,
    classify_ui_elements,
    deduplicate_elements,
    identify_page_type,
};
use services::quick_ui_automation::*; // 新增：快速UI自动化命令
use services::marketing_storage::commands as marketing_commands; // 营销存储命令
use services::execution_abort_service::{abort_script_execution, cancel_current_operation, force_stop_all_adb_operations}; // 新增：真正的执行中止服务
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

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
    let ai_state = ai::commands::AppState {
        settings: parking_lot::RwLock::new(ai::config::load_settings()),
    };
    let prospecting_state = commands::prospecting::ProspectingState::new();
    
    // 🆕 初始化智能 XPath 生成器状态
    let xpath_generator_state = commands::enhanced_location_commands::XPathGeneratorState::new(
        services::execution::matching::SmartXPathGenerator::new()
    );
    
    // 🆕 智能选择系统状态
    let smart_selection_state = commands::smart_selection::SmartSelectionState::new();
    
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
            
            // 初始化 Lead Hunt 数据库
            if let Err(e) = db::initialize(app.handle()) {
                eprintln!("[DB] Failed to initialize database: {}", e);
            }
            
            Ok(())
        })
        .manage(Mutex::new(employee_service))
        .manage(Mutex::new(adb_service))
        .manage(smart_app_service)
        .manage(ai_state)
        .manage(prospecting_state)
        .manage(xpath_generator_state) // 🆕 注册 XPath 生成器状态
        .manage(smart_selection_state) // 🆕 注册智能选择系统状态
        // 应用关闭清理外部进程（scrcpy 等）
        .on_window_event(|_window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                cleanup_all();
            }
        })
        .invoke_handler(tauri::generate_handler![
            // 现有命令（保持原有的大量命令...）
            get_employees,
            add_employee,
            update_employee,
            delete_employee,
            // ADB 相关命令
            validate_device_connection,
            get_device_apps,
            test_device_responsiveness,
            get_adb_path_cmd,
            get_environment_info,
            run_full_diagnostic,
            // Phase 3: 版本控制系统命令
            init_version_control,
            create_version,
            query_versions,
            create_branch,
            list_branches,
            compute_xml_diff,
            rebuild_version,
            get_version_storage_stats,
            check_version_integrity,
            delete_version,
            get_version_control_status
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}