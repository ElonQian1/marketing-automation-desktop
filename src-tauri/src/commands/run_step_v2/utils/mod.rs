// src-tauri/src/commands/run_step_v2/utils/mod.rs
// module: run_step_v2 | layer: utils | role: 工具函数统一导出
// summary: 导出辅助工具函数模块

mod disambiguation;
mod step_processor;
mod safety_gates;
mod sm_matcher;
mod strategy_resolver;

pub use disambiguation::generate_disambiguation_suggestions;
pub use step_processor::{
    expand_coordinate_params,
    is_selector_free_action,
    is_coordinate_swipe,
    create_dummy_candidate,
};
pub use safety_gates::{check_safety_gates, safety_result_to_response, SafetyGateResult};
pub use sm_matcher::try_structural_matching;
pub use strategy_resolver::resolve_step_strategy;
