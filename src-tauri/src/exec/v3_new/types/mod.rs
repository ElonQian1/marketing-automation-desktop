// src-tauri/src/exec/v3_new/types/mod.rs
// module: exec | layer: domain | role: V3核心类型定义
// summary: 统一的类型系统，解决事件参数不匹配等问题

pub mod specs;
pub mod events;
pub mod results;
pub mod context;

// 重新导出所有类型
pub use specs::*;
pub use events::*;
pub use results::*;
pub use context::*;