// src-tauri/src/core/adapters/inbound/mcp_server/server.rs
// module: core/adapters/inbound/mcp_server | layer: adapters | role: http-server
// summary: MCP HTTP 服务器 - 使用 axum 实现完整的 MCP 协议

use std::sync::Arc;
use std::net::SocketAddr;
use axum::{
    Router,
    routing::{get, post},
    extract::State,
    http::{StatusCode, Method, header},
    response::{IntoResponse, Response, Json},
};
use tower_http::cors::{CorsLayer, Any};
use serde_json::{json, Value};
use tokio::sync::RwLock;
use tracing::{info, warn, error, debug};

use super::protocol::{McpRequest, McpResponse, InitializeResult};
use super::tools::{register_tools, execute_tool};
use crate::core::application::AppContext;
use crate::core::shared::config::McpServerConfig;

/// MCP 服务器状态
pub struct McpServerState {
    pub ctx: Arc<AppContext>,
    pub initialized: RwLock<bool>,
}

/// MCP 服务器
pub struct McpServer {
    config: McpServerConfig,
    ctx: Arc<AppContext>,
}

impl McpServer {
    pub fn new(config: McpServerConfig, ctx: Arc<AppContext>) -> Self {
        Self { config, ctx }
    }

    /// 启动服务器（在后台运行）
    pub async fn start(&self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        if !self.config.enabled {
            info!("🔌 MCP 服务器已禁用，跳过启动");
            return Ok(());
        }

        let state = Arc::new(McpServerState {
            ctx: self.ctx.clone(),
            initialized: RwLock::new(false),
        });

        // 配置 CORS
        let cors = CorsLayer::new()
            .allow_origin(Any)
            .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
            .allow_headers([header::CONTENT_TYPE, header::ACCEPT]);

        // 构建路由
        let app = Router::new()
            // MCP 核心端点
            .route("/mcp", post(handle_mcp_request))
            .route("/mcp/sse", get(handle_sse))
            // 健康检查
            .route("/health", get(health_check))
            // 工具列表（方便调试）
            .route("/tools", get(list_tools))
            .layer(cors)
            .with_state(state);

        let addr = SocketAddr::from(([127, 0, 0, 1], self.config.port));
        
        info!("🚀 MCP 服务器启动中... http://{}", addr);

        // 在后台启动服务器
        let listener = tokio::net::TcpListener::bind(addr).await?;
        
        tokio::spawn(async move {
            if let Err(e) = axum::serve(listener, app).await {
                error!("❌ MCP 服务器错误: {}", e);
            }
        });

        info!("✅ MCP 服务器已启动: http://127.0.0.1:{}", self.config.port);
        info!("   📍 MCP 端点: POST http://127.0.0.1:{}/mcp", self.config.port);
        info!("   📍 SSE 端点: GET http://127.0.0.1:{}/mcp/sse", self.config.port);
        info!("   📍 工具列表: GET http://127.0.0.1:{}/tools", self.config.port);
        
        Ok(())
    }
}

/// 健康检查端点
async fn health_check() -> impl IntoResponse {
    Json(json!({
        "status": "ok",
        "service": "automation-mcp-server",
        "version": env!("CARGO_PKG_VERSION")
    }))
}

/// 列出所有工具（方便调试）
async fn list_tools() -> impl IntoResponse {
    let tools = register_tools();
    Json(json!({
        "tools": tools,
        "count": tools.len()
    }))
}

/// 处理 MCP 请求
async fn handle_mcp_request(
    State(state): State<Arc<McpServerState>>,
    Json(request): Json<McpRequest>,
) -> impl IntoResponse {
    debug!("📥 MCP 请求: {} (id={:?})", request.method, request.id);

    let response = match request.method.as_str() {
        "initialize" => {
            *state.initialized.write().await = true;
            info!("🤝 MCP 客户端已初始化");
            McpResponse::success(
                request.id,
                serde_json::to_value(InitializeResult::default()).unwrap(),
            )
        }
        
        "initialized" => {
            McpResponse::success(request.id, json!({}))
        }
        
        "tools/list" => {
            let tools = register_tools();
            McpResponse::success(request.id, json!({ "tools": tools }))
        }
        
        "tools/call" => {
            let tool_name = request.params
                .get("name")
                .and_then(|v| v.as_str())
                .unwrap_or("");
            
            let arguments = request.params
                .get("arguments")
                .cloned()
                .unwrap_or(json!({}));

            if tool_name.is_empty() {
                McpResponse::error(request.id, -32602, "缺少工具名称")
            } else {
                let result = execute_tool(tool_name, arguments, &state.ctx).await;
                McpResponse::success(request.id, serde_json::to_value(result).unwrap())
            }
        }
        
        "ping" => {
            McpResponse::success(request.id, json!({}))
        }
        
        "notifications/cancelled" => {
            // 客户端取消通知，忽略
            McpResponse::success(request.id, json!({}))
        }
        
        _ => {
            warn!("❓ 未知方法: {}", request.method);
            McpResponse::error(request.id, -32601, format!("未知方法: {}", request.method))
        }
    };

    Json(response)
}

/// SSE 端点（用于长连接场景）
async fn handle_sse(
    State(_state): State<Arc<McpServerState>>,
) -> impl IntoResponse {
    // 简单的 SSE 实现 - 返回服务器信息
    let body = format!(
        "data: {}\n\n",
        json!({
            "type": "connection",
            "status": "connected",
            "server": "automation-mcp-server"
        })
    );

    Response::builder()
        .status(StatusCode::OK)
        .header("Content-Type", "text/event-stream")
        .header("Cache-Control", "no-cache")
        .header("Connection", "keep-alive")
        .body(body)
        .unwrap()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mcp_response_success() {
        let resp = McpResponse::success(Some(json!(1)), json!({"result": "ok"}));
        assert!(resp.error.is_none());
        assert!(resp.result.is_some());
    }

    #[test]
    fn test_mcp_response_error() {
        let resp = McpResponse::error(Some(json!(1)), -32600, "Invalid Request");
        assert!(resp.error.is_some());
        assert!(resp.result.is_none());
    }
}
