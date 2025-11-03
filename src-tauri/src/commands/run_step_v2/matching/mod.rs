// src-tauri/src/commands/run_step_v2/matching/mod.rs
// module: step-execution | layer: matching | role: 匹配模块入口
// summary: 聚合所有匹配逻辑 - 评分、选择器解析、坐标测试

pub mod tristate_scorer;
pub mod selector_resolver;
pub mod coord_hit_tester;

// 重导出核心功能
pub use tristate_scorer::UnifiedScoringCore;
pub use selector_resolver::{resolve_selector_with_priority, SelectorSource};
pub use coord_hit_tester::coord_fallback_hit_test;
