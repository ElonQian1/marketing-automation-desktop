// src-tauri/src/core/domain/agent/mod.rs
// module: core/domain/agent | layer: domain | role: agent-domain
// summary: AI Agent 领域模块 - 定义 AI 代理的核心实体、值对象和端口

mod agent_entity;
mod agent_value_objects;
mod agent_ports;

pub use agent_entity::*;
pub use agent_value_objects::*;
pub use agent_ports::*;
