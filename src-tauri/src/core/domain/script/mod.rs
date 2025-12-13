// src-tauri/src/core/domain/script/mod.rs
// module: core/domain/script | layer: domain | role: script-aggregate
// summary: 脚本领域聚合根 - Script 实体、Step 值对象、Repository 接口

mod script_entity;
mod step_value_object;
pub mod script_repository;  // 公开模块供外部访问

pub use script_entity::{Script, ScriptSummary, ScriptMetadata, ScriptConfig};
pub use step_value_object::{ScriptStep, StepType, StepAction, ClickTarget, InputContent, WaitParams, SwipeParams, WaitCondition, CustomCommand};
pub use script_repository::{ScriptRepository, ScriptExecutor, ScriptExecutionResult, StepExecutionResult, ExecutionStatus};
