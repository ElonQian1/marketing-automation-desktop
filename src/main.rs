// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// mod commands;
mod ai; // AI 模块
mod application; // expose new application
mod commands; // 新增：集中管理 Tauri 命令
mod config; // 配置模块
mod db;
mod device; // 设备提供者与回放编排器
mod domain; // expose domain DSL (actions, coords, direction)
mod engine; // 策略引擎
mod exec; // V3 统一执行协议模块
mod infra; // expose infra (adb injector, device metrics provider)
mod infrastructure; // 事件系统
mod new_backend; // 新后端（可灰度切换）
mod screenshot_service;
mod services;
mod types;
mod utils; // 数据库模块
           // pub mod xml_judgment_service; // 新模块化 XML 判断服务 (旧文件已弃用) - 暂时注释，文件不存在

// Universal UI Finder 模块桥接
// 注意：universal-ui-finder模块位于src/modules/，我们通过services层桥接
// use services::smart_element_finder_service::SmartElementFinderService; // 未直接使用类型
// 页面分析与 Universal UI 相关类型/服务已在 commands 模块中使用，不再直接在 main.rs 引入
// use services::page_analyzer_service::PageAnalyzerService;
// use types::page_analysis::{ PageAnalysisResult, PageAnalysisConfig, SelectedElementConfig };

use commands::*; // 引入拆分后的命令（所有 #[tauri::command] 均集中）
#[cfg(windows)]
// use std::os::windows::process::CommandExt; // 为 adb.rs 创建进程 flags 所需
use screenshot_service::*;
use std::sync::Mutex; // 为 .manage 使用
use tauri_plugin_dialog;
use tracing::info; // 引入info!宏
                   // use commands::app_lifecycle_commands::*;
use services::adb_activity::{adb_open_contacts_app, adb_start_activity, adb_view_file};
use services::adb_device_tracker::*;
use services::adb_service::AdbService;
use services::auth_service::*;
use services::commands::{
    execute_single_step_test, execute_smart_automation_script,
    execute_smart_automation_script_multi,
};
use services::contact_automation::*;
use services::contact_service::*;
use services::contact_storage::commands::{
    delete_txt_import_record_cmd, get_contact_number_stats_cmd, get_distinct_industries_cmd, get_numbers_by_files, get_numbers_by_files, get_numbers_by_files, get_numbers_by_files,
    list_txt_import_records_cmd, list_vcf_batch_records_cmd,
    set_contact_numbers_industry_by_id_range,
};
use services::contact_storage::*; // 导入号码存储命令（现在使用模块化版本）
use services::crash_debugger::*;
use services::device_contact_metrics::get_device_contact_count;
use services::employee_service::EmployeeService;
use services::log_bridge::LOG_COLLECTOR; // 仅用于设置 app handle
use services::navigation_bar_detector::{
    click_navigation_button, detect_navigation_bar, get_navigation_configs,
};
use services::safe_adb_manager::*;
use services::safe_adb_shell::safe_adb_shell_command;
use services::scrcpy_manager::{
    check_scrcpy_available, cleanup_all, get_scrcpy_capabilities, list_device_mirror_sessions,
    start_device_mirror, stop_device_mirror, stop_device_mirror_session,
};
use services::script_executor::*;
use services::script_manager::*; // 新增：脚本管理服务
use services::smart_app_service::*;
use services::smart_element_finder_service::{click_detected_element, smart_element_finder};
// 直接使用的其他命令函数（未在 commands::* re-export 中覆盖的服务命令）
use services::smart_vcf_opener::smart_vcf_opener;
use services::ui_reader_service::read_device_ui_state;
// 注意: write_file, delete_file, reveal_in_file_manager 已在 commands/files.rs 中定义
// use xml_judgment_service::{
//     get_device_ui_xml,
//     find_xml_ui_elements,
//     wait_for_ui_element,
//     check_device_page_state,
//     match_element_by_criteria,
// };
use services::marketing_storage::commands as marketing_commands; // 营销存储命令
use services::quick_ui_automation::*; // 新增：快速UI自动化命令
use services::universal_ui_page_analyzer::{
    analyze_universal_ui_page, classify_ui_elements, deduplicate_elements, extract_page_elements,
    identify_page_type,
};
use services::universal_ui_service::execute_universal_ui_click;
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

    info!("?? 启动EmployeeGUI应用程序");
    info!("?? 日志级别: DEBUG (开发模式)");

    let employee_service = EmployeeService::new().expect("Failed to initialize employee service");
    let adb_service = AdbService::new();
    let smart_app_service = SmartAppManagerState::new();
    let ai_state = ai::commands::AppState {
        settings: parking_lot::RwLock::new(ai::config::load_settings()),
    };
    let prospecting_state = commands::prospecting::ProspectingState::new();

    // ?? 初始化智能 XPath 生成器状态
    let xpath_generator_state = commands::enhanced_location_commands::XPathGeneratorState::new(
        services::execution::matching::SmartXPathGenerator::new(),
    );

    // 初始化实时设备跟踪器 (替代旧的轮询系统)
    initialize_device_tracker().expect("Failed to initialize device tracker");

    info!("? 所有服务初始化完成 (仅实时跟踪，无轮询)");

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
        .manage(xpath_generator_state) // ?? 注册 XPath 生成器状态
        // 应用关闭清理外部进程（scrcpy 等）
        .on_window_event(|_window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                cleanup_all();
            }
        })
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
            get_device_properties, // 添加设备属性获取命令
            // 基于host:track-devices的实时设备跟踪
            start_device_tracking, // 启动实时设备跟踪
            stop_device_tracking,  // 停止设备跟踪
            get_tracked_devices,   // 获取当前跟踪的设备
            start_adb_server_simple,
            kill_adb_server_simple,
            execute_adb_command_simple,
            clear_adb_keys,
            // 日志桥接命令
            get_logs,             // 来自 commands::logging
            get_adb_command_logs, // 来自 commands::logging
            get_filtered_logs,    // 来自 commands::logging
            clear_logs,           // 来自 commands::logging
            add_log_entry,        // 来自 commands::logging
            get_execution_context_metrics,
            employee_login,
            verify_token,
            get_current_user,
            employee_logout,
            refresh_token,
            change_password,
            parse_contact_file,
            get_contact_file_info,
            // 联系人号码存储（TXT -> DB）
            import_contact_numbers_from_file,
            import_contact_numbers_from_folder,
            list_contact_numbers,
            fetch_contact_numbers,
            fetch_unclassified_contact_numbers,
            fetch_contact_numbers_by_id_range,
            fetch_contact_numbers_by_id_range_unconsumed,
            mark_contact_numbers_used_by_id_range,
            // 批量将号码回滚为“未导入到任何手机”
            mark_contact_numbers_as_not_imported,
            delete_contact_numbers,`n            get_numbers_by_files,
            get_numbers_by_files,
            get_numbers_by_files,
            // 号码批次与导入追踪 (暂时注释，避免编译错误)
            // create_vcf_batch_record,         // 缺失
            // list_vcf_batch_records,          // 缺失
            // get_vcf_batch_record,            // 缺失
            // create_import_session_record,    // 缺失
            // finish_import_session_record,    // 缺失
            // list_import_session_records,     // 缺失
            // list_numbers_by_vcf_batch,       // 缺失
            // list_numbers_by_vcf_batch_filtered, // 缺失
            // list_numbers_without_vcf_batch,  // 缺失
            get_contact_number_stats_cmd,
            get_distinct_industries_cmd, get_numbers_by_files,
            set_contact_numbers_industry_by_id_range,
            create_vcf_batch_with_numbers_cmd,
            // TXT 导入记录管理
            list_txt_import_records_cmd,
            delete_txt_import_record_cmd,
            // VCF 批次记录管理
            list_vcf_batch_records_cmd,
            // list_numbers_for_vcf_batch_cmd,     // 缺失
            // tag_numbers_industry_by_vcf_batch_cmd, // 缺失
            // update_import_session_industry_cmd,    // 缺失
            // revert_import_session_to_failed_cmd,   // 缺失
            // delete_import_session_cmd,             // 缺失
            // list_import_session_events_cmd,        // 缺失
            // allocate_numbers_to_device_cmd,        // 缺失
            // 号码ID查询（全量按筛选）
            list_all_contact_number_ids,
            // 新增的VCF导入和小红书自动关注功能
            generate_vcf_file,
            import_vcf_contacts_multi_brand,     // 多品牌批量尝试导入
            import_vcf_contacts_huawei_enhanced, // 华为增强导入（基于Python成功经验）
            debug_vcf_import_with_crash_detection, // 详细崩溃调试命令
            // 通用文件操作
            write_file,
            save_file_dialog,
            read_file_content,
            reveal_in_file_manager,
            delete_file,
            read_file_as_data_url,
            // 联系人度量
            get_device_contact_count,
            // UI状态读取功能
            read_device_ui_state, // 实时读取设备UI状态
            // 智能VCF打开器
            smart_vcf_opener, // 基于UI状态的智能VCF打开
            // 安全ADB管理功能
            get_adb_devices_safe,   // 使用安全ADB检测设备
            safe_adb_push,          // 使用安全ADB传输文件
            safe_adb_shell_command, // 使用安全ADB执行Shell命令
            // ADB Activity 管理功能
            adb_start_activity,    // 启动Android Activity
            adb_open_contacts_app, // 打开联系人应用
            adb_view_file,         // 使用VIEW Intent打开文件
            // 快速UI自动化功能（新增）
            adb_dump_ui_xml,    // 快速抓取页面XML
            adb_click_element,  // 通过resource-id点击元素
            adb_tap_coordinate, // 通过坐标点击
            // 脚本执行器功能
            execute_automation_script,  // 执行自动化脚本
            validate_device_connection, // 验证设备连接
            // 智能脚本执行器功能
            execute_single_step_test,              // 执行单步测试
            execute_smart_automation_script,       // 执行智能脚本批量操作
            execute_smart_automation_script_multi, // 多设备执行智能脚本
            // 脚本管理功能
            save_smart_script,           // 保存智能脚本
            load_smart_script,           // 加载智能脚本
            delete_smart_script,         // 删除智能脚本
            list_smart_scripts,          // 列出所有脚本
            import_smart_script,         // 导入脚本
            export_smart_script,         // 导出脚本
            list_script_templates,       // 列出脚本模板
            create_script_from_template, // 从模板创建脚本
            // 截图服务功能
            capture_device_screenshot,    // 捕获设备截图
            get_device_screen_resolution, // 获取设备分辨率
            // XML判断服务功能 (模块缺失，暂时注释)
            // get_device_ui_xml,       // 获取UI XML结构
            // find_xml_ui_elements,    // 查找XML UI元素
            // wait_for_ui_element,     // 等待元素出现
            // check_device_page_state, // 检查页面状态
            match_element_by_criteria, // 按匹配条件查找元素 - 已修复
            run_step,                  // ?? 统一步骤执行命令（匹配+动作）
            run_step_v2,               // ?? V2 统一步骤执行命令（选择器优先+坐标兜底）
            // 智能应用管理功能
            get_device_apps,        // 获取设备应用列表
            get_device_apps_paged,  // 分页获取设备应用列表
            search_device_apps,     // 搜索设备应用
            launch_device_app,      // 启动应用
            get_cached_device_apps, // 获取缓存的应用列表
            get_popular_apps,       // 获取常用应用列表
            get_app_icon,           // 获取应用图标
            // 导航栏检测功能
            detect_navigation_bar,   // 检测导航栏
            click_navigation_button, // 点击导航按钮
            get_navigation_configs,  // 获取预设配置
            // 智能元素查找功能
            smart_element_finder,   // 智能元素查找
            click_detected_element, // 点击检测到的元素
            // Universal UI 智能导航功能
            execute_universal_ui_click, // 执行智能导航点击
            // Universal UI 页面分析功能
            analyze_universal_ui_page, // 分析Universal UI页面
            extract_page_elements,     // 提取页面元素（统一智能解析器）
            classify_ui_elements,      // 分类UI元素
            deduplicate_elements,      // 去重元素
            identify_page_type,        // 识别页面类型
            // 智能页面分析功能
            analyze_current_page,        // 分析当前页面获取可操作元素
            validate_element_config,     // 验证元素配置
            execute_page_element_action, // 来自 commands::page_analysis
            get_page_analysis_history,   // 来自 commands::page_analysis
            // 应用生命周期管理功能
            // ensure_app_running,              // 确保应用运行（独立模块）
            // detect_app_state                 // 检测应用状态（独立模块）
            // XML缓存管理功能
            list_xml_cache_files,       // 列出所有XML缓存文件
            read_xml_cache_file,        // 读取XML缓存文件内容
            get_xml_file_size,          // 获取XML文件大小
            get_xml_file_absolute_path, // 获取XML文件绝对路径
            delete_xml_cache_artifacts, // 删除XML及关联截图
            parse_cached_xml_to_elements, // 解析缓存XML为UI元素
            // 设备镜像（scrcpy）
            start_device_mirror,
            stop_device_mirror,
            stop_device_mirror_session,
            list_device_mirror_sessions,
            check_scrcpy_available,
            get_scrcpy_capabilities,
            // 后端健康检查命令
            backend_ping,
            analysis_health_check,
            // ========== 智能分析命令 (V2 → V3 迁移文档) ==========
            //
            // ?? [V2 传统智能分析系统 - 已修复可用]
            // V2 系统特点：
            // - 基于事件驱动 (analysis:progress, analysis:done)
            // - 完整UI数据传输（较大数据量）
            // - 逐步进度反馈
            // - 稳定可靠的后备方案
            start_intelligent_analysis,   // V2: 传统智能分析入口
            cancel_intelligent_analysis,  // V2: 取消分析操作
            bind_analysis_result_to_step, // V2: 手动绑定分析结果
            // ?? [V3 统一执行协议 - 新启用]
            // V3 系统优势：
            // - 90% 数据精简：by-ref模式，传递引用而非完整数据
            // - 智能短路：快速失败检测，避免无效重试
            // - 自动回退：V3失败时无缝降级到V2
            // - 统一接口：单一执行入口，支持多种策略
            //
            // V3 命令映射：
            exec::v3::commands::execute_single_step_test_v3, // 单步智能执行 (替代手动步骤)
            exec::v3::commands::execute_chain_test_v3, // 智能自动链 (替代 start_intelligent_analysis)
            exec::v3::commands::execute_static_strategy_test_v3, // 静态策略执行 (新功能)
            // ?? [迁移路径 - 渐进式过渡]
            // 1. V2/V3 并存阶段：特性开关控制 (src/config/feature-flags.ts)
            // 2. 前端服务层：IntelligentAnalysisBackendV3 (src/services/intelligent-analysis-backend-v3.ts)
            // 3. 健康监控：自动检测V3可用性，失败时回退V2
            // 4. A/B测试：渐进式验证V3性能优势
            // 5. 完全迁移：移除V2命令（预计下个版本）
            // V2→V3 切换：feature-flags.ts 控制
            // 详见：EXECUTION_V2_MIGRATION_GUIDE.md
            // ========================================

            // 精准获客模块命令
            init_precise_acquisition_storage,
            prospecting_save_comment,
            prospecting_get_comments,
            prospecting_get_comments_by_ids,
            prospecting_save_analysis,
            prospecting_save_reply_plan,
            prospecting_get_reply_plans,
            prospecting_get_reply_plans_by_ids,
            prospecting_execute_real_reply_plan,
            prospecting_get_statistics,
            // ?? 增强定位算法命令
            match_element_enhanced,
            generate_xpath_candidates,
            generate_best_xpath,
            validate_xpath,
            update_xpath_strategy_success_rate,
            // 营销存储模块命令（用于精准获客数据持久化）
            marketing_commands::bulk_upsert_watch_targets,
            marketing_commands::get_watch_target_by_dedup_key,
            marketing_commands::list_watch_targets,
            marketing_commands::get_watch_targets, // 新增：list_watch_targets 的别名
            marketing_commands::update_watch_target, // 新增：更新候选目标
            marketing_commands::insert_comment,
            marketing_commands::list_comments,
            marketing_commands::insert_task,
            marketing_commands::update_task_status,
            marketing_commands::list_tasks,
            marketing_commands::lock_next_ready_task,
            marketing_commands::mark_task_result,
            marketing_commands::insert_audit_log,
            marketing_commands::check_and_reserve_dedup,
            marketing_commands::query_audit_logs,
            marketing_commands::export_audit_logs,
            marketing_commands::cleanup_expired_audit_logs,
            marketing_commands::batch_store_audit_logs,
            marketing_commands::insert_reply_template, // 新增：插入回复模板
            marketing_commands::list_reply_templates,  // 新增：列出回复模板
            marketing_commands::get_reply_templates,   // 新增：list_reply_templates 的别名
            marketing_commands::update_reply_template, // 新增：更新回复模板
            marketing_commands::get_precise_acquisition_stats, // 新增：获取统计数据
            // Lead Hunt 模块命令（精准获客）
            commands::lh_save_comments,
            commands::lh_list_comments,
            commands::lh_import_comments,
            commands::lh_create_replay_plan,
            commands::lh_run_replay_plan,
            commands::lh_get_stats,
            commands::lh_analyze_comments,
            #[cfg(debug_assertions)]
            commands::lh_seed_database,
            // AI 模块命令
            ai::commands::get_ai_settings,
            ai::commands::save_ai_settings,
            ai::commands::list_models,
            ai::commands::ai_chat,
            ai::commands::ai_embed
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
