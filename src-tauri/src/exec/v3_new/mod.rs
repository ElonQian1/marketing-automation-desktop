// src-tauri/src/exec/v3_new/mod.rs
// module: exec | layer: application | role: V3执行协议新架构根模块
// summary: 重新设计的V3统一执行协议，解决类型不匹配和接口不一致问题

pub mod types;
pub mod core;
// pub mod engines; // TODO: 待实现
// pub mod commands; // TODO: 待实现

// 重新导出主要API
// pub use engines::*;
// pub use commands::*;