// src-tauri/src/core/application/mod.rs
// module: core/application | layer: application | role: use-case-orchestration
// summary: 应用服务层 - 用例编排，协调 Domain 和 Adapter

pub mod script_service;
pub mod device_service;
pub mod agent_service;
pub mod agent_runtime_service;
pub mod agent_loop;
pub mod mde_extractor_service;
pub mod mde_storage_service;
pub mod mde_ai_extractor;

pub use script_service::ScriptAppService;
pub use device_service::DeviceAppService;
pub use agent_service::AgentAppService;
pub use agent_runtime_service::{
    AgentRuntime, AgentCommand, AgentEvent,
    SharedAgentRuntime, create_shared_runtime,
};
pub use agent_loop::{AgentLoop, AgentLoopConfig};
pub use mde_extractor_service::{MdeExtractorService, MdeXmlParser, MdeXmlNode};
pub use mde_storage_service::{MdeStorageService, MdeSaveResult, MdeSaveOptions};
pub use mde_ai_extractor::{MdeAiExtractorService, MdeAiConfig, MdeAiExtractionRequest};

use std::sync::Arc;
use std::path::PathBuf;
use crate::core::domain::script::{ScriptRepository, ScriptExecutor};

/// 应用上下文
/// 
/// 持有所有应用服务的引用，供入站适配器使用
pub struct AppContext {
    pub script_service: Arc<ScriptAppService>,
    pub device_service: Arc<DeviceAppService>,
    pub mde_storage: Arc<MdeStorageService>,
    pub mde_ai_extractor: Option<Arc<MdeAiExtractorService>>,
}

impl AppContext {
    pub fn new(
        script_repo: Arc<dyn ScriptRepository>,
        script_executor: Arc<dyn ScriptExecutor>,
    ) -> Self {
        // 默认数据目录
        let data_dir = std::env::current_dir()
            .unwrap_or_else(|_| PathBuf::from("."))
            .join("data");
        
        Self::with_data_dir(script_repo, script_executor, data_dir)
    }
    
    pub fn with_data_dir(
        script_repo: Arc<dyn ScriptRepository>,
        script_executor: Arc<dyn ScriptExecutor>,
        data_dir: PathBuf,
    ) -> Self {
        // 初始化 MDE 存储服务
        let mde_storage = Arc::new(MdeStorageService::new(data_dir));
        
        // 尝试初始化 AI 提取服务（如果配置了 API Key）
        let mde_ai_extractor = MdeAiExtractorService::from_env()
            .ok()
            .map(Arc::new);
        
        Self {
            script_service: Arc::new(ScriptAppService::new(
                script_repo.clone(),
                script_executor,
            )),
            device_service: Arc::new(DeviceAppService::new()),
            mde_storage,
            mde_ai_extractor,
        }
    }
}
