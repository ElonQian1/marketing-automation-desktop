// src-tauri/src/core/adapters/inbound/mcp_server/mod.rs
// module: core/adapters/inbound/mcp_server | layer: adapters | role: mcp-adapter
// summary: MCP (Model Context Protocol) 服务器 - 供 AI 代理调用

mod server;
mod protocol;
mod tools;

pub use server::McpServer;
pub use protocol::{McpRequest, McpResponse, McpTool, ToolResult};
pub use tools::register_tools;
