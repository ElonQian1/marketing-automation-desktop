// src-tauri/src/core/bootstrap.rs
// module: core | layer: infrastructure | role: application-bootstrap
// summary: 应用启动器 - 初始化六边形架构组件和 MCP 服务器

use std::sync::Arc;
use tracing::{info, error};

use crate::core::application::AppContext;
use crate::core::adapters::outbound::{FileScriptRepository, LegacyScriptExecutor};
use crate::core::adapters::inbound::mcp_server::McpServer;
use crate::core::shared::config::{CoreConfig, McpServerConfig};

/// 六边形架构启动器
pub struct CoreBootstrap {
    ctx: Option<Arc<AppContext>>,
    mcp_server: Option<McpServer>,
}

impl CoreBootstrap {
    pub fn new() -> Self {
        Self {
            ctx: None,
            mcp_server: None,
        }
    }

    /// 初始化所有组件
    pub async fn initialize(&mut self, config: CoreConfig) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        info!("🏛️ 初始化六边形架构核心...");

        // 1. 创建出站适配器
        let script_repo = Arc::new(FileScriptRepository::new(&config.script_storage.scripts_dir));
        let script_executor = Arc::new(LegacyScriptExecutor::new());

        info!("   ✅ 出站适配器已创建 (FileScriptRepository, LegacyScriptExecutor)");

        // 2. 创建应用上下文
        let ctx = Arc::new(AppContext::new(script_repo, script_executor));
        self.ctx = Some(ctx.clone());

        info!("   ✅ 应用上下文已创建");

        // 3. 创建 MCP 服务器
        let mcp_server = McpServer::new(config.mcp, ctx);
        self.mcp_server = Some(mcp_server);

        info!("   ✅ MCP 服务器已配置");

        Ok(())
    }

    /// 启动所有服务
    pub async fn start(&self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        info!("🚀 启动六边形架构服务...");

        // 启动 MCP 服务器
        if let Some(ref server) = self.mcp_server {
            server.start().await?;
        }

        Ok(())
    }

    /// 获取应用上下文（供其他模块使用）
    pub fn get_context(&self) -> Option<Arc<AppContext>> {
        self.ctx.clone()
    }
}

impl Default for CoreBootstrap {
    fn default() -> Self {
        Self::new()
    }
}

/// 快速启动函数 - 使用默认配置
pub async fn quick_start() -> Result<Arc<AppContext>, Box<dyn std::error::Error + Send + Sync>> {
    let mut bootstrap = CoreBootstrap::new();
    
    let config = CoreConfig::default();
    bootstrap.initialize(config).await?;
    bootstrap.start().await?;
    
    bootstrap.get_context().ok_or_else(|| "上下文初始化失败".into())
}

/// 启动 MCP 服务器（供 main.rs 调用）
pub async fn start_mcp_server() {
    info!("🔌 正在启动 MCP 服务器...");
    
    match quick_start().await {
        Ok(_ctx) => {
            info!("✅ 六边形架构核心已启动");
        }
        Err(e) => {
            error!("❌ 六边形架构启动失败: {}", e);
        }
    }
}
