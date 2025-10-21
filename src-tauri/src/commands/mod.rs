// Centralized Tauri command module
// 分领域子模块：确保 main.rs 精简

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

// 可选：统一 re-export，方便 main.rs 引入
pub use employees::*;
pub use adb::*;
pub use files::*;
pub use page_analysis::*;
pub use logging::*;
pub use xml_cache::*;
pub use xpath_execution::*;
pub use metrics::*;
pub use strategy_matching::*;
pub use intelligent_analysis::*; // ✅ 新增导出
pub use health_check::*; // ✅ 导出健康检查命令
pub use prospecting::*; // ✅ 导出精准获客命令
pub use commands_lead_hunt::*; // ✅ 导出Lead Hunt命令