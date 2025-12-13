// src-tauri/src/core/domain/script/script_repository.rs
// module: core/domain/script | layer: domain | role: repository-interface
// summary: ScriptRepository trait - 脚本仓储接口（领域层定义，适配层实现）

use async_trait::async_trait;
use crate::core::shared::CoreResult;
use super::{Script, ScriptSummary};

/// 脚本仓储接口
/// 
/// 这是领域层定义的接口，具体实现由 adapters/outbound 层提供。
/// 遵循依赖倒置原则：高层模块（Domain）不依赖低层模块（IO），两者都依赖抽象。
#[async_trait]
pub trait ScriptRepository: Send + Sync {
    /// 保存脚本
    /// 
    /// 如果脚本已存在则更新，否则创建新脚本
    async fn save(&self, script: &Script) -> CoreResult<String>;

    /// 加载脚本
    async fn load(&self, id: &str) -> CoreResult<Script>;

    /// 删除脚本
    async fn delete(&self, id: &str) -> CoreResult<()>;

    /// 列出所有脚本摘要
    async fn list(&self) -> CoreResult<Vec<ScriptSummary>>;

    /// 检查脚本是否存在
    async fn exists(&self, id: &str) -> CoreResult<bool>;

    /// 搜索脚本
    async fn search(&self, query: &str) -> CoreResult<Vec<ScriptSummary>>;

    /// 按分类列出脚本
    async fn list_by_category(&self, category: &str) -> CoreResult<Vec<ScriptSummary>>;
}

/// 脚本执行器接口
/// 
/// 负责实际执行脚本步骤
#[async_trait]
pub trait ScriptExecutor: Send + Sync {
    /// 执行脚本
    async fn execute(
        &self,
        script: &Script,
        device_id: &str,
    ) -> CoreResult<ScriptExecutionResult>;

    /// 执行单个步骤
    async fn execute_step(
        &self,
        step: &super::ScriptStep,
        device_id: &str,
    ) -> CoreResult<StepExecutionResult>;

    /// 停止执行
    async fn stop(&self) -> CoreResult<()>;

    /// 获取执行状态
    async fn get_status(&self) -> ExecutionStatus;
}

/// 脚本执行结果
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ScriptExecutionResult {
    pub script_id: String,
    pub device_id: String,
    pub success: bool,
    pub total_steps: usize,
    pub completed_steps: usize,
    pub failed_step: Option<usize>,
    pub elapsed_ms: u64,
    pub error: Option<String>,
    pub step_results: Vec<StepExecutionResult>,
}

/// 步骤执行结果
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct StepExecutionResult {
    pub step_id: String,
    pub step_name: String,
    pub success: bool,
    pub elapsed_ms: u64,
    pub error: Option<String>,
    pub screenshot: Option<String>,
}

/// 执行状态
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ExecutionStatus {
    Idle,
    Running,
    Paused,
    Stopping,
}
