// src-tauri/src/core/shared/mod.rs
// module: core/shared | layer: shared | role: common-utilities
// summary: 共享工具层 - 统一错误类型、配置、工具函数

pub mod error;
pub mod config;

pub use error::{CoreError, CoreResult};
