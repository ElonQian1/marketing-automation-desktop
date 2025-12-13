// src-tauri/src/core/domain/agent/agent_ports.rs
// module: core/domain/agent | layer: domain | role: agent-ports
// summary: AI Agent 端口定义 - 定义 AI 提供商和工具提供商的抽象接口

use async_trait::async_trait;
use serde_json::Value;

use super::{AgentMessage, AgentTool, AiProviderConfig, ToolCall, ToolResult};
use crate::core::shared::CoreResult;

/// AI 提供商端口（出站）
/// 
/// 定义与 AI 服务通信的抽象接口。
/// 实现可以是 OpenAI、混元、DeepSeek 或任何 OpenAI 兼容的服务。
#[async_trait]
pub trait AiProvider: Send + Sync {
    /// 获取提供商名称
    fn name(&self) -> &str;

    /// 获取当前配置
    fn config(&self) -> &AiProviderConfig;

    /// 发送对话请求（不带工具）
    async fn chat(&self, messages: Vec<AgentMessage>) -> CoreResult<AgentMessage>;

    /// 发送对话请求（带工具调用能力）
    async fn chat_with_tools(
        &self,
        messages: Vec<AgentMessage>,
        tools: Vec<AgentTool>,
    ) -> CoreResult<AgentMessage>;

    /// 流式对话（可选实现）
    async fn chat_stream(
        &self,
        messages: Vec<AgentMessage>,
        tools: Vec<AgentTool>,
        callback: Box<dyn Fn(StreamEvent) + Send>,
    ) -> CoreResult<()> {
        // 默认实现：不支持流式
        let response = self.chat_with_tools(messages, tools).await?;
        callback(StreamEvent::Message(response));
        callback(StreamEvent::Done);
        Ok(())
    }

    /// 测试连接
    async fn test_connection(&self) -> CoreResult<bool> {
        let test_messages = vec![AgentMessage::user("Hello")];
        match self.chat(test_messages).await {
            Ok(_) => Ok(true),
            Err(_) => Ok(false),
        }
    }
}

/// 流式事件
#[derive(Debug, Clone)]
pub enum StreamEvent {
    /// 增量文本
    Delta(String),
    /// 工具调用开始
    ToolCallStart(ToolCall),
    /// 完整消息
    Message(AgentMessage),
    /// 流结束
    Done,
    /// 错误
    Error(String),
}

/// 工具提供商端口（出站）
/// 
/// 定义工具注册和执行的抽象接口。
/// MCP 工具会通过这个接口暴露给 AI。
#[async_trait]
pub trait ToolProvider: Send + Sync {
    /// 获取所有可用工具
    fn get_tools(&self) -> Vec<AgentTool>;

    /// 执行工具调用
    async fn execute(&self, tool_call: &ToolCall) -> ToolResult;

    /// 按名称获取工具
    fn get_tool(&self, name: &str) -> Option<AgentTool> {
        self.get_tools().into_iter().find(|t| t.function.name == name)
    }

    /// 判断是否支持某工具
    fn has_tool(&self, name: &str) -> bool {
        self.get_tool(name).is_some()
    }
}

/// 会话存储端口（出站）
/// 
/// 定义会话持久化的抽象接口
#[async_trait]
pub trait SessionRepository: Send + Sync {
    /// 保存会话
    async fn save(&self, session: &super::AgentSession) -> CoreResult<String>;

    /// 加载会话
    async fn load(&self, session_id: &str) -> CoreResult<super::AgentSession>;

    /// 删除会话
    async fn delete(&self, session_id: &str) -> CoreResult<()>;

    /// 列出所有会话
    async fn list(&self) -> CoreResult<Vec<SessionSummary>>;

    /// 判断会话是否存在
    async fn exists(&self, session_id: &str) -> CoreResult<bool>;
}

/// 会话摘要
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SessionSummary {
    pub id: String,
    pub title: String,
    pub message_count: usize,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

impl From<&super::AgentSession> for SessionSummary {
    fn from(session: &super::AgentSession) -> Self {
        Self {
            id: session.id.clone(),
            title: session.title.clone(),
            message_count: session.messages.len(),
            created_at: session.created_at,
            updated_at: session.updated_at,
        }
    }
}
