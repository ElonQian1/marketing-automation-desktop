// src-tauri/src/core/domain/mod.rs
// module: core/domain | layer: domain | role: domain-root
// summary: 领域层根模块 - 纯业务逻辑，无 IO 依赖

pub mod script;
pub mod device;
pub mod agent;
pub mod agent_runtime;
pub mod mde_extraction;

// 导出核心类型
pub use script::{Script, ScriptStep, ScriptSummary, ScriptRepository};
pub use device::{Device, DeviceStatus};
pub use agent::{AgentSession, AgentMessage, AiProvider, ToolProvider, AiProviderConfig};
pub use agent_runtime::{
    AgentConfig, AgentMode,
    Goal, GoalId, GoalPriority, GoalStatus, GoalTree, CompletionCriteria,
    AgentRunState, AgentStateSnapshot, AgentStateMachine, StateTransitionEvent,
    AgentMemory, ShortTermMemory, WorkingMemory, LongTermMemory, MemoryEntry, MemoryType,
    ActionType, ActionResult, ActionRecord, PlannedAction, RiskLevel,
};
