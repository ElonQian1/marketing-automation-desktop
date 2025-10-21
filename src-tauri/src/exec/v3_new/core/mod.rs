// src-tauri/src/exec/v3_new/core/mod.rs
// module: exec | layer: application | role: V3核心执行引擎
// summary: 定义统一的执行器接口和核心逻辑

pub mod executor;
// pub mod factory; // TODO: 待实现

// 重新导出核心接口
pub use executor::*;
// pub use factory::*;