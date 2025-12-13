// src-tauri/src/core/adapters/outbound/mod.rs
// module: core/adapters/outbound | layer: adapters | role: outbound-adapters
// summary: 出站适配器 - 实现 Domain 层定义的 Repository/Executor 接口

mod file_script_repository;
mod legacy_script_executor;
pub mod ai_agent;

pub use file_script_repository::FileScriptRepository;
pub use legacy_script_executor::LegacyScriptExecutor;
pub use ai_agent::{OpenAiCompatibleProvider, McpToolProvider};
