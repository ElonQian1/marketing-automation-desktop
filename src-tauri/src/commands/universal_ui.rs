// src-tauri/src/commands/universal_ui.rs
// module: commands | layer: application | role: Universal UI分析命令
// summary: 重导出Universal UI页面分析相关的Tauri命令

// 🎯 从 services 层重导出命令，避免代码重复
// 这是良好架构的过渡方案：命令定义在 services 层，通过 commands 层统一导出
pub use crate::services::universal_ui_page_analyzer::{
    analyze_universal_ui_page,
    extract_page_elements,
    classify_ui_elements,
    deduplicate_elements,
    identify_page_type,
};

