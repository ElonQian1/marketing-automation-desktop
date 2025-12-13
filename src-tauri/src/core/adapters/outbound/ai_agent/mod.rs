// src-tauri/src/core/adapters/outbound/ai_agent/mod.rs
// module: core/adapters/outbound/ai_agent | layer: adapters | role: ai-agent-integration
// summary: AI Agent 出站适配器 - 集成 OpenAI 兼容 API（支持混元、OpenAI、DeepSeek等）

mod openai_compatible_provider;
pub mod mcp_tool_provider;

pub use openai_compatible_provider::OpenAiCompatibleProvider;
pub use mcp_tool_provider::McpToolProvider;
