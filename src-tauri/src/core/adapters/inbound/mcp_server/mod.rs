// src-tauri/src/core/adapters/inbound/mcp_server/mod.rs
// module: core/adapters/inbound/mcp_server | layer: adapters | role: mcp-adapter
// summary: MCP (Model Context Protocol) 服务器 - 供 AI 代理调用

mod server;
pub mod protocol;  // 公开以供 ai_agent 使用
pub mod tools;     // 公开以供 ai_agent 使用
pub mod mde_tools; // MDE 数据提取工具

pub use server::McpServer;
pub use protocol::{McpRequest, McpResponse, McpTool, ToolResult, ToolContent};
pub use tools::{register_tools, execute_tool};
pub use mde_tools::{register_mde_tools, execute_mde_tool};
