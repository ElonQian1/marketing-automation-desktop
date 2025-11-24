// src-tauri/src/exec/mod.rs
// module: exec | layer: application | role: 统一执行引擎根模块
// summary: 导出核心执行引擎组件 (原 v3)

// pub mod types; // Moved to automation
pub use crate::automation::types;
// pub mod events; // Moved to automation
pub use crate::automation::events;
// pub mod commands; // Moved to commands/automation_commands.rs
// pub mod chain_engine; // Moved
// pub mod single_step; // Moved
pub use crate::automation::pipeline::executor as unified_step_executor;
pub use crate::automation::matching::recovery as recovery_manager;
pub use crate::automation::matching::evaluator as xpath_evaluator;
// pub mod static_exec; // Moved
pub use crate::automation::matching::element_matching;
pub use crate::automation::analysis::semantic as semantic_analyzer;
pub mod helpers;

// 重新导出常用类型
pub use types::*;
pub use events::*;
// pub use commands::*;
pub use crate::automation::pipeline::chain as chain_engine;
pub use crate::automation::pipeline::single_step;
pub use crate::automation::pipeline::static_exec;
pub use crate::automation::pipeline::executor::*;

