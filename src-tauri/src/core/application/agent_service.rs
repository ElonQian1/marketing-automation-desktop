// src-tauri/src/core/application/agent_service.rs
// module: core/application | layer: application | role: agent-use-cases
// summary: AI Agent 应用服务 - 编排所有 AI 代理相关用例

use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, warn, error};

use crate::core::domain::agent::{
    AgentSession, AgentMessage, AgentTool, AiProvider, AiProviderConfig,
    ToolProvider, ToolCall, SessionStatus,
};
use crate::core::shared::{CoreError, CoreResult};

/// AI Agent 应用服务
/// 
/// 这是 AI 代理相关所有用例的统一入口。
/// 支持：
/// 1. 内嵌模式：程序内部调用 AI（混元/OpenAI）
/// 2. 外部模式：外部 AI 通过 MCP 调用程序
pub struct AgentAppService {
    /// AI 提供商（用于内嵌模式）
    ai_provider: Option<Arc<dyn AiProvider>>,
    
    /// 工具提供商（MCP 工具桥接）
    tool_provider: Arc<dyn ToolProvider>,
    
    /// 当前活动会话
    active_session: RwLock<Option<AgentSession>>,
}

impl AgentAppService {
    /// 创建新的 Agent 服务
    pub fn new(tool_provider: Arc<dyn ToolProvider>) -> Self {
        Self {
            ai_provider: None,
            tool_provider,
            active_session: RwLock::new(None),
        }
    }

    /// 设置 AI 提供商（启用内嵌模式）
    pub fn with_ai_provider(mut self, provider: Arc<dyn AiProvider>) -> Self {
        self.ai_provider = Some(provider);
        self
    }

    /// 配置 AI 提供商
    pub fn set_ai_provider(&mut self, provider: Arc<dyn AiProvider>) {
        self.ai_provider = Some(provider);
    }

    /// 获取可用工具列表
    pub fn get_available_tools(&self) -> Vec<AgentTool> {
        self.tool_provider.get_tools()
    }

    // ========================================================================
    // 会话管理
    // ========================================================================

    /// 创建新会话
    pub async fn create_session(&self, system_prompt: &str, model: &str) -> CoreResult<AgentSession> {
        let session = AgentSession::new(system_prompt, model);
        
        let mut active = self.active_session.write().await;
        *active = Some(session.clone());
        
        info!("📝 创建新 AI 会话: {}", session.id);
        Ok(session)
    }

    /// 获取当前会话
    pub async fn get_active_session(&self) -> Option<AgentSession> {
        self.active_session.read().await.clone()
    }

    /// 清除当前会话
    pub async fn clear_session(&self) {
        let mut active = self.active_session.write().await;
        *active = None;
        info!("🗑️ 已清除活动会话");
    }

    // ========================================================================
    // 对话用例（内嵌模式）
    // ========================================================================

    /// 发送消息并获取回复（自动处理工具调用）
    pub async fn chat(&self, user_message: &str) -> CoreResult<String> {
        let provider = self.ai_provider.as_ref()
            .ok_or_else(|| CoreError::not_configured("AI 提供商未配置"))?;

        // 获取或创建会话
        let mut session = {
            let active = self.active_session.read().await;
            match &*active {
                Some(s) => s.clone(),
                None => {
                    drop(active);
                    self.create_session(
                        &crate::core::adapters::outbound::ai_agent::mcp_tool_provider::get_script_debugger_prompt(),
                        provider.config().model.as_str(),
                    ).await?
                }
            }
        };

        // 添加用户消息
        session.add_user_message(user_message);
        session.auto_title();

        // 获取工具
        let tools = self.tool_provider.get_tools();

        // Agent 循环：持续处理直到 AI 不再请求工具
        let max_iterations = 10; // 防止无限循环
        let mut iterations = 0;

        loop {
            iterations += 1;
            if iterations > max_iterations {
                warn!("⚠️ AI Agent 达到最大迭代次数");
                break;
            }

            // 发送给 AI
            let messages = session.build_messages_for_ai();
            let response = provider.chat_with_tools(messages, tools.clone()).await?;

            // 检查是否有工具调用
            if let Some(tool_calls) = &response.tool_calls {
                if !tool_calls.is_empty() {
                    info!("🔧 AI 请求调用 {} 个工具", tool_calls.len());
                    
                    // 添加 AI 消息（包含工具调用）
                    session.add_assistant_with_tools(
                        if response.content.is_empty() { None } else { Some(response.content.clone()) },
                        tool_calls.clone(),
                    );

                    // 执行每个工具调用
                    for tool_call in tool_calls {
                        info!("  📌 执行工具: {}", tool_call.function.name);
                        let result = self.tool_provider.execute(tool_call).await;
                        session.add_tool_result(&tool_call.id, result);
                    }

                    // 继续循环，让 AI 处理工具结果
                    continue;
                }
            }

            // 没有工具调用，添加最终回复
            session.add_assistant_message(&response.content);
            
            // 保存会话状态
            let mut active = self.active_session.write().await;
            *active = Some(session.clone());

            return Ok(response.content);
        }

        Err(CoreError::internal("AI Agent 循环异常终止"))
    }

    // ========================================================================
    // 专用用例
    // ========================================================================

    /// 分析脚本问题
    pub async fn analyze_script(&self, script_id: &str) -> CoreResult<String> {
        let prompt = format!(
            "请帮我分析脚本 `{}` 的问题。先获取脚本内容，然后检查：\n\
            1. XPath 是否可能过时\n\
            2. 元素定位是否准确\n\
            3. 步骤顺序是否合理\n\
            4. 等待时间是否充足\n\
            5. 是否有其他潜在问题",
            script_id
        );
        
        self.chat(&prompt).await
    }

    /// 自动修复脚本
    pub async fn fix_script(&self, script_id: &str, issue_description: &str) -> CoreResult<String> {
        let prompt = format!(
            "请帮我修复脚本 `{}`。\n\n问题描述：{}\n\n\
            请先获取脚本内容，分析问题，然后进行修复。\
            修复前请说明你要做什么，修复后验证脚本语法。",
            script_id, issue_description
        );
        
        self.chat(&prompt).await
    }

    /// 执行自然语言任务
    pub async fn execute_task(&self, task_description: &str) -> CoreResult<String> {
        let prompt = format!(
            "请帮我完成以下任务：\n\n{}\n\n\
            请分析任务，制定计划，然后逐步执行。",
            task_description
        );
        
        self.chat(&prompt).await
    }

    /// 根据屏幕内容创建脚本
    pub async fn create_script_from_screen(&self, device_id: &str, script_name: &str, description: &str) -> CoreResult<String> {
        let prompt = format!(
            "请帮我创建一个名为 `{}` 的脚本。\n\n\
            描述：{}\n\n\
            请先获取设备 `{}` 的当前屏幕内容，分析 UI 结构，\
            然后创建脚本并添加合适的步骤。",
            script_name, description, device_id
        );
        
        self.chat(&prompt).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // 测试需要 mock 实现
}
