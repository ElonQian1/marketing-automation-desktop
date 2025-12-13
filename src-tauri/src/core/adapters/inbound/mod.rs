// src-tauri/src/core/adapters/inbound/mod.rs
// module: core/adapters/inbound | layer: adapters | role: inbound-adapters
// summary: 入站适配器 - 处理外部请求（Tauri 插件、MCP 服务器）

pub mod mcp_server;

// Tauri 插件适配器暂时不放这里，因为需要逐步迁移
// 后续可添加: pub mod tauri_adapter;
