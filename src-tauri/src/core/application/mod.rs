// src-tauri/src/core/application/mod.rs
// module: core/application | layer: application | role: use-case-orchestration
// summary: 应用服务层 - 用例编排，协调 Domain 和 Adapter

pub mod script_service;
pub mod device_service;
pub mod agent_service;

pub use script_service::ScriptAppService;
pub use device_service::DeviceAppService;
pub use agent_service::AgentAppService;

use std::sync::Arc;
use crate::core::domain::script::{ScriptRepository, ScriptExecutor};

/// 应用上下文
/// 
/// 持有所有应用服务的引用，供入站适配器使用
pub struct AppContext {
    pub script_service: Arc<ScriptAppService>,
    pub device_service: Arc<DeviceAppService>,
}

impl AppContext {
    pub fn new(
        script_repo: Arc<dyn ScriptRepository>,
        script_executor: Arc<dyn ScriptExecutor>,
    ) -> Self {
        Self {
            script_service: Arc::new(ScriptAppService::new(
                script_repo.clone(),
                script_executor,
            )),
            device_service: Arc::new(DeviceAppService::new()),
        }
    }
}
