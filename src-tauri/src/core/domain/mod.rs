// src-tauri/src/core/domain/mod.rs
// module: core/domain | layer: domain | role: domain-root
// summary: 领域层根模块 - 纯业务逻辑，无 IO 依赖

pub mod script;
pub mod device;
pub mod agent;

// 导出核心类型
pub use script::{Script, ScriptStep, ScriptSummary, ScriptRepository};
pub use device::{Device, DeviceStatus};
pub use agent::{AgentSession, AgentMessage, AiProvider, ToolProvider, AiProviderConfig};
