// Centralized Tauri command
// 分领域子模块：确保 main.rs 精简

pub mod macros; // 🎯 命令注册宏系统
pub mod action_execution; // 新增操作执行命令
pub mod step_execution; // 新增统一步骤执行命令
pub mod run_step_v2; // 🚀 新增 V2 统一步骤执行命令
pub mod app_lifecycle_commands; // 现有（保留）
pub mod employees;
pub mod adb;
// pub mod files; // Moved to plugin:file_manager
pub mod page_analysis;
pub mod logging;
pub mod xml_cache;
pub mod metrics;
pub mod strategy_matching; // 新增策略匹配命令
pub mod xpath_execution; // 新增XPath直接执行命令
pub mod intelligent_analysis; // ✅ 新增智能分析命令
// pub mod health_check; // ✅ 新增后端健康检查命令 - Moved to plugin:system_diagnostic
pub mod prospecting; // ✅ 新增精准获客命令
pub mod legacy_smart_finder; // ✅ 新增：兼容旧版智能查找命令
// pub mod image_optimization; // ✅ 新增：图片优化命令 - Moved to plugin:image_optimization
pub mod click_normalizer_test; // 🆕 新增点击规范化测试命令
pub mod structure_recommend; // 🎯 新增结构匹配智能推荐命令
pub mod execute_structure_match; // 🚀 新增结构匹配真机执行命令
pub mod apps; // ✅ 新增应用管理命令
// pub mod universal_ui; // 🆕 Universal UI分析命令（采集当前页面） - Moved to plugin:universal_ui

pub mod enhanced_location_commands;
pub mod commands_lead_hunt;
// pub mod smart_selection; // Moved to modules/smart_selection
pub mod semantic_analyzer_config;
pub mod structure_match_runtime;
pub mod ui_dump;
pub mod analysis_cache;
pub mod automation_commands;

// 可选：统一 re-export，方便 main.rs 引入
// pub use action_execution::*; // 操作执行命令（暂时注释）
pub use employees::*;
pub use adb::*;
// pub use files::*; // Moved to plugin:file_manager
pub use xml_cache::*;
// pub use xpath_execution::*; // XPath执行命令（暂时注释）
pub use run_step_v2::*; // 🚀 导出 V2 步骤执行命令
pub use intelligent_analysis::*; // ✅ 新增导出
// pub use health_check::*; // ✅ 导出健康检查命令 - Moved to plugin:system_diagnostic
 // 🆕 导出增强定位命令
 // 🆕 导出统一步骤执行命令
 // ✅ 导出精准获客命令
 // ✅ 导出Lead Hunt命令
// pub use smart_selection::*; // 🆕 导出智能选择命令 (Moved to modules)
 // 🆕 导出语义分析器配置命令
 // 🚀 导出结构匹配运行时命令
pub use ui_dump::*; // 🆕 导出UI Dump命令
pub use analysis_cache::*; // 🆕 导出分析缓存命令
pub use click_normalizer_test::*; // 🆕 导出点击规范化测试命令
pub use structure_recommend::*; // 🎯 导出结构匹配智能推荐命令
pub use execute_structure_match::*; // 🚀 导出结构匹配真机执行命令
pub use apps::*; // ✅ 导出应用管理命令
// pub use universal_ui::*; // 🆕 导出Universal UI分析命令 - Moved to plugin:universal_ui