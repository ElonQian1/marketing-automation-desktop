// src-tauri/src/core/domain/agent/agent_entity.rs
// module: core/domain/agent | layer: domain | role: agent-session-entity
// summary: AgentSession 聚合根 - 管理 AI 对话会话的生命周期

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::{AgentMessage, MessageRole, ToolCall, ToolResult as AgentToolResult};

/// AI Agent 会话（聚合根）
/// 
/// 一个会话代表用户与 AI 的一次完整交互，包含多轮对话。
/// 会话可以暂停、恢复、保存和加载。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentSession {
    /// 会话唯一标识
    pub id: String,
    
    /// 会话标题（可由 AI 自动生成）
    pub title: String,
    
    /// 系统提示词（定义 AI 的角色和能力）
    pub system_prompt: String,
    
    /// 对话历史
    pub messages: Vec<AgentMessage>,
    
    /// 会话状态
    pub status: SessionStatus,
    
    /// 当前待处理的工具调用
    pub pending_tool_calls: Vec<ToolCall>,
    
    /// 会话创建时间
    pub created_at: DateTime<Utc>,
    
    /// 最后活动时间
    pub updated_at: DateTime<Utc>,
    
    /// 使用的 AI 模型
    pub model: String,
    
    /// 累计消耗的 tokens
    pub total_tokens: u64,
}

/// 会话状态
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SessionStatus {
    /// 空闲，等待用户输入
    Idle,
    /// AI 正在思考/生成回复
    Thinking,
    /// AI 请求调用工具，等待工具执行结果
    WaitingForTools,
    /// 会话已暂停
    Paused,
    /// 会话已结束
    Completed,
    /// 发生错误
    Error(String),
}

impl AgentSession {
    /// 创建新会话
    pub fn new(system_prompt: impl Into<String>, model: impl Into<String>) -> Self {
        let now = Utc::now();
        Self {
            id: format!("session_{}", Uuid::new_v4().to_string().replace("-", "")),
            title: "新对话".to_string(),
            system_prompt: system_prompt.into(),
            messages: Vec::new(),
            status: SessionStatus::Idle,
            pending_tool_calls: Vec::new(),
            created_at: now,
            updated_at: now,
            model: model.into(),
            total_tokens: 0,
        }
    }

    /// 添加用户消息
    pub fn add_user_message(&mut self, content: impl Into<String>) {
        self.messages.push(AgentMessage::user(content));
        self.status = SessionStatus::Thinking;
        self.touch();
    }

    /// 添加 AI 回复
    pub fn add_assistant_message(&mut self, content: impl Into<String>) {
        self.messages.push(AgentMessage::assistant(content));
        self.status = SessionStatus::Idle;
        self.touch();
    }

    /// 添加带工具调用的 AI 回复
    pub fn add_assistant_with_tools(&mut self, content: Option<String>, tool_calls: Vec<ToolCall>) {
        self.messages.push(AgentMessage::assistant_with_tools(content, tool_calls.clone()));
        self.pending_tool_calls = tool_calls;
        self.status = SessionStatus::WaitingForTools;
        self.touch();
    }

    /// 添加工具执行结果
    pub fn add_tool_result(&mut self, tool_call_id: &str, result: AgentToolResult) {
        self.messages.push(AgentMessage::tool_result(tool_call_id, result));
        
        // 移除已处理的工具调用
        self.pending_tool_calls.retain(|tc| tc.id != tool_call_id);
        
        // 如果所有工具都执行完毕，切换状态
        if self.pending_tool_calls.is_empty() {
            self.status = SessionStatus::Thinking; // AI 需要继续处理
        }
        
        self.touch();
    }

    /// 获取所有待执行的工具调用
    pub fn get_pending_tools(&self) -> &[ToolCall] {
        &self.pending_tool_calls
    }

    /// 判断是否有待执行的工具
    pub fn has_pending_tools(&self) -> bool {
        !self.pending_tool_calls.is_empty()
    }

    /// 构建发送给 AI 的消息列表（包含系统提示）
    pub fn build_messages_for_ai(&self) -> Vec<AgentMessage> {
        let mut messages = vec![AgentMessage::system(&self.system_prompt)];
        messages.extend(self.messages.clone());
        messages
    }

    /// 设置错误状态
    pub fn set_error(&mut self, error: impl Into<String>) {
        self.status = SessionStatus::Error(error.into());
        self.touch();
    }

    /// 更新 tokens 消耗
    pub fn add_tokens(&mut self, tokens: u64) {
        self.total_tokens += tokens;
    }

    /// 自动生成标题（基于第一条用户消息）
    pub fn auto_title(&mut self) {
        if self.title == "新对话" {
            if let Some(first_user_msg) = self.messages.iter().find(|m| m.role == MessageRole::User) {
                let content = &first_user_msg.content;
                self.title = if content.len() > 30 {
                    format!("{}...", &content[..30])
                } else {
                    content.clone()
                };
            }
        }
    }

    fn touch(&mut self) {
        self.updated_at = Utc::now();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_session_lifecycle() {
        let mut session = AgentSession::new(
            "你是一个脚本调试助手",
            "gpt-4"
        );
        
        assert_eq!(session.status, SessionStatus::Idle);
        
        session.add_user_message("帮我分析这个脚本");
        assert_eq!(session.status, SessionStatus::Thinking);
        
        session.add_assistant_message("好的，我来分析一下...");
        assert_eq!(session.status, SessionStatus::Idle);
    }
}
