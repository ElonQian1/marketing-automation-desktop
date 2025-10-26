pub mod action_executor; // 新增：统一操作执行器
pub mod action_recommender; // 新增：操作推荐引擎
pub mod adb_activity; // 新增：ADB Activity 管理
pub mod adb_device_tracker;
pub mod adb_service; // 现在是模块化的文件夹结构
pub mod adb_session_manager; // 新增：ADB会话管理器
pub mod adb_shell_session;
pub mod app_detection_framework; // 新增：应用检测框架
pub mod app_lifecycle_manager; // 新增：应用生命周期管理器
pub mod app_state_detector;
pub mod auth_service;
pub mod contact;
pub mod contact_automation;
pub mod error_handling; // 新增：错误处理模块
pub mod navigation_bar_detector; // 新增：通用导航栏检测器
pub mod page_analyzer_service; // 新增：页面分析服务
pub mod prospecting; // 新增：精准获客模块
pub mod lead_hunt; // 新增：精准获客Lead Hunt服务
pub mod batch_analysis; // 新增：批量AI分析服务
pub mod universal_ui_page_analyzer; // 新增：Universal UI 页面分析器
                                    // pub mod simple_xml_parser;  // 已删除：简化XML解析器，统一使用智能解析器
pub mod commands; // Tauri 命令封装
pub mod contact_service;
pub mod contact_storage; // 新增：联系人号码存储（TXT导入到SQLite）
pub mod contact_verification; // 新增：快速号码验证服务
pub mod crash_debugger;
pub mod diagnostic_service; // 新增：系统诊断服务
pub mod device_contact_metrics;
pub mod duplication_guard; // 新增：查重防护服务（内存态）
pub mod employee_service;
pub mod execution; // 新增：执行分层骨架 (模型/重试/快照)
pub mod huawei_enhanced_importer; // 基于Python成功经验的华为增强导入器
pub mod ldplayer_vcf_opener;
pub mod log_bridge;
pub mod multi_brand_vcf_importer; // 新增：多品牌VCF导入器
pub mod multi_brand_vcf_strategies; // 新增：多品牌策略模块
pub mod multi_brand_vcf_types; // 新增：多品牌导入类型定义
pub mod quick_ui_automation; // 新增：快速UI自动化模块
pub mod safe_adb_manager;
pub mod safe_adb_shell; // 新增：安全ADB Shell命令执行器
pub mod scrcpy_manager;
pub mod script_execution; // 新增：脚本执行模块（控制流处理系统）
pub mod script_executor;
pub mod script_manager; // 新增：智能脚本管理服务
pub mod smart_app; // 新增：智能应用服务
pub mod smart_app_manager;
pub mod smart_app_service;
pub mod smart_element_finder_service; // 新增：智能元素查找服务
pub mod legacy_simple_selection_engine; // 已弃用：简化选择引擎（使用V3智能策略）
pub mod smart_script_executor;
pub mod smart_script_executor_actions; // 公开基础操作实现（点击/滑动/输入/等待等）
pub mod smart_vcf_opener;
pub mod ui_reader_service;
pub mod universal_ui_finder; // Universal UI Finder 核心模块
pub mod universal_ui_service; // Universal UI Finder 服务桥接
pub mod vcf_importer;
pub mod vcf_importer_async;
pub mod vcf_importer_optimized;
pub mod vcf_utils; // 新增：VCF 工具函数 // 设备镜像（外部 scrcpy 进程控制）
                   // 注意：util_fs 模块已迁移到 commands/files.rs，避免重复定义
                   // 已移除：xiaohongshu_* 系列模块（自动关注/长连接/服务），按照需求删除
pub mod marketing_storage; // 新增：精准获客候选池存储
pub mod xml_judgment_service; // 新增：XML 判定服务
