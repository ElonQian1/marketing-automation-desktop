// Centralized Tauri command module
// 分领域子模块：确保 main.rs 精简

pub mod action_execution; // 新增操作执行命令
pub mod step_execution; // 新增统一步骤执行命令
pub mod run_step_v2; // 🚀 新增 V2 统一步骤执行命令
pub mod app_lifecycle_commands; // 现有（保留）
pub mod employees;
pub mod adb;
pub mod files;
pub mod page_analysis;
pub mod logging;
pub mod xml_cache;
pub mod metrics;
pub mod strategy_matching; // 新增策略匹配命令
pub mod xpath_execution; // 新增XPath直接执行命令
pub mod intelligent_analysis; // ✅ 新增智能分析命令
pub mod health_check; // ✅ 新增后端健康检查命令
pub mod prospecting; // ✅ 新增精准获客命令
pub mod commands_lead_hunt; // ✅ 新增精准获客Lead Hunt命令
pub mod enhanced_location_commands; // 🆕 新增增强定位算法命令

// 可选：统一 re-export，方便 main.rs 引入
// pub use action_execution::*; // 操作执行命令（暂时注释）
pub use employees::*;
pub use adb::*;
pub use files::*;
pub use page_analysis::*;
pub use logging::*;
pub use xml_cache::*;
// pub use xpath_execution::*; // XPath执行命令（暂时注释）
pub use metrics::*;
pub use strategy_matching::*;
pub use run_step_v2::*; // 🚀 导出 V2 步骤执行命令
pub use intelligent_analysis::*; // ✅ 新增导出
pub use health_check::*; // ✅ 导出健康检查命令
pub use enhanced_location_commands::*; // 🆕 导出增强定位命令
pub use step_execution::*; // 🆕 导出统一步骤执行命令
pub use prospecting::*; // ✅ 导出精准获客命令
pub use commands_lead_hunt::*; // ✅ 导出Lead Hunt命令