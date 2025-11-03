// src-tauri/src/commands/run_step_v2/validation/mod.rs
// module: step-execution | layer: validation | role: 模块入口
// summary: 步骤执行安全验证模块 - XML解析、安全检查、边界验证

pub mod xml_parser;
pub mod safety_checker;
pub mod bounds_validator;
pub mod disambiguation;

// 重导出公开API
pub use xml_parser::{parse_xml_attribute, parse_bounds_from_string};
pub use safety_checker::{check_fullscreen_node, check_container_node, validate_target_safety};
pub use bounds_validator::validate_bounds_within_screen;
pub use disambiguation::generate_disambiguation_suggestions;
