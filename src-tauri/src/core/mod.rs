// src-tauri/src/core/mod.rs
// module: core | layer: root | role: hexagonal-architecture-root
// summary: 六边形架构核心 - 包含 domain/application/adapters/shared 四层

pub mod domain;
pub mod application;
pub mod adapters;
pub mod shared;
pub mod bootstrap;

// 重导出启动器
pub use bootstrap::{CoreBootstrap, quick_start, start_mcp_server};
