// src-tauri/src/exec/v3/mod.rs
// module: exec | layer: application | role: V3 执行模块入口
// summary: 导出 V3 执行协议的所有组件

pub mod types;
pub mod events;
pub mod commands;
pub mod single_step;
pub mod chain_engine; // 已完成重构，支持 by-ref 模式
pub mod static_exec;

// 重新导出常用类型
pub use types::*;
pub use commands::*;
