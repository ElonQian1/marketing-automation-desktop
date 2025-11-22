// src-tauri/src/exec/mod.rs
// module: exec | layer: application | role: 统一执行引擎根模块
// summary: 导出核心执行引擎组件 (原 v3)

pub mod types;
pub mod events;
pub mod commands;
pub mod chain_engine;
pub mod single_step;
pub mod unified_step_executor;
pub mod recovery_manager;
pub mod xpath_evaluator;
pub mod static_exec;
pub mod element_matching;
pub mod semantic_analyzer;
pub mod helpers;

// 重新导出常用类型
pub use types::*;
pub use events::*;
pub use commands::*;
pub use chain_engine::*;
pub use single_step::*;
pub use unified_step_executor::*;

