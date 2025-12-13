// src-tauri/src/core/adapters/outbound/ai_agent/openai_compatible_provider.rs
// module: core/adapters/outbound/ai_agent | layer: adapters | role: openai-provider
// summary: OpenAI 兼容 API 提供商实现 - 支持 OpenAI、混元、DeepSeek 等

use async_trait::async_trait;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tracing::{info, warn, error, debug};

use crate::core::domain::agent::{
    AgentMessage, AgentTool, AiProvider, AiProviderConfig,
    MessageRole, ToolCall, FunctionCall,
};
use crate::core::shared::{CoreError, CoreResult};

/// OpenAI 兼容 API 提供商
/// 
/// 支持所有 OpenAI API 兼容的服务：
/// - OpenAI
/// - 腾讯混元
/// - DeepSeek
/// - Azure OpenAI
/// - 本地 Ollama 等
pub struct OpenAiCompatibleProvider {
    config: AiProviderConfig,
    client: Client,
}

impl OpenAiCompatibleProvider {
    /// 创建新的提供商实例
    pub fn new(config: AiProviderConfig) -> Self {
        let client = Client::builder()
            .timeout(std::time::Duration::from_secs(120))
            .build()
            .expect("Failed to create HTTP client");
        
        Self { config, client }
    }

    /// 构建请求 body
    fn build_request_body(
        &self,
        messages: &[AgentMessage],
        tools: Option<&[AgentTool]>,
    ) -> Value {
        let mut body = json!({
            "model": self.config.model,
            "messages": messages.iter().map(|m| self.message_to_json(m)).collect::<Vec<_>>(),
        });

        if let Some(max_tokens) = self.config.max_tokens {
            body["max_tokens"] = json!(max_tokens);
        }

        if let Some(temperature) = self.config.temperature {
            body["temperature"] = json!(temperature);
        }

        if let Some(tools) = tools {
            if !tools.is_empty() {
                body["tools"] = json!(tools);
                body["tool_choice"] = json!("auto");
            }
        }

        body
    }

    /// 将 AgentMessage 转换为 JSON
    fn message_to_json(&self, message: &AgentMessage) -> Value {
        let mut msg = json!({
            "role": match message.role {
                MessageRole::System => "system",
                MessageRole::User => "user",
                MessageRole::Assistant => "assistant",
                MessageRole::Tool => "tool",
            },
            "content": message.content,
        });

        // 添加工具调用
        if let Some(tool_calls) = &message.tool_calls {
            msg["tool_calls"] = json!(tool_calls.iter().map(|tc| {
                json!({
                    "id": tc.id,
                    "type": tc.call_type,
                    "function": {
                        "name": tc.function.name,
                        "arguments": tc.function.arguments,
                    }
                })
            }).collect::<Vec<_>>());
        }

        // 添加工具调用 ID
        if let Some(tool_call_id) = &message.tool_call_id {
            msg["tool_call_id"] = json!(tool_call_id);
        }

        msg
    }

    /// 解析响应
    fn parse_response(&self, response: &ChatCompletionResponse) -> CoreResult<AgentMessage> {
        let choice = response.choices.first()
            .ok_or_else(|| CoreError::external_service("AI 返回空响应"))?;

        let message = &choice.message;

        // 检查是否有工具调用
        if let Some(tool_calls) = &message.tool_calls {
            if !tool_calls.is_empty() {
                let parsed_calls: Vec<ToolCall> = tool_calls.iter().map(|tc| {
                    ToolCall {
                        id: tc.id.clone(),
                        call_type: tc.r#type.clone(),
                        function: FunctionCall {
                            name: tc.function.name.clone(),
                            arguments: tc.function.arguments.clone(),
                        },
                    }
                }).collect();

                return Ok(AgentMessage::assistant_with_tools(
                    message.content.clone(),
                    parsed_calls,
                ));
            }
        }

        // 普通文本回复
        Ok(AgentMessage::assistant(
            message.content.clone().unwrap_or_default()
        ))
    }
}

#[async_trait]
impl AiProvider for OpenAiCompatibleProvider {
    fn name(&self) -> &str {
        &self.config.name
    }

    fn config(&self) -> &AiProviderConfig {
        &self.config
    }

    async fn chat(&self, messages: Vec<AgentMessage>) -> CoreResult<AgentMessage> {
        self.chat_with_tools(messages, vec![]).await
    }

    async fn chat_with_tools(
        &self,
        messages: Vec<AgentMessage>,
        tools: Vec<AgentTool>,
    ) -> CoreResult<AgentMessage> {
        let url = format!("{}/chat/completions", self.config.base_url);
        
        let body = self.build_request_body(
            &messages,
            if tools.is_empty() { None } else { Some(&tools) },
        );

        debug!("🤖 发送 AI 请求到 {}: {:?}", self.config.name, body);

        let response = self.client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.config.api_key))
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| CoreError::external_service(format!("请求失败: {}", e)))?;

        let status = response.status();
        
        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_default();
            error!("❌ AI API 错误 [{}]: {}", status, error_text);
            return Err(CoreError::external_service(format!(
                "AI API 错误 [{}]: {}",
                status, error_text
            )));
        }

        let response_body: ChatCompletionResponse = response.json().await
            .map_err(|e| CoreError::external_service(format!("解析响应失败: {}", e)))?;

        debug!("📥 AI 响应: {:?}", response_body);

        // 记录 token 使用
        if let Some(usage) = &response_body.usage {
            info!(
                "📊 Token 使用: prompt={}, completion={}, total={}",
                usage.prompt_tokens, usage.completion_tokens, usage.total_tokens
            );
        }

        self.parse_response(&response_body)
    }
}

// ============================================================================
// OpenAI API 响应结构
// ============================================================================

#[derive(Debug, Deserialize)]
struct ChatCompletionResponse {
    id: String,
    choices: Vec<Choice>,
    usage: Option<Usage>,
}

#[derive(Debug, Deserialize)]
struct Choice {
    index: u32,
    message: ResponseMessage,
    finish_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
struct ResponseMessage {
    role: String,
    content: Option<String>,
    tool_calls: Option<Vec<ResponseToolCall>>,
}

#[derive(Debug, Deserialize)]
struct ResponseToolCall {
    id: String,
    #[serde(rename = "type")]
    r#type: String,
    function: ResponseFunction,
}

#[derive(Debug, Deserialize)]
struct ResponseFunction {
    name: String,
    arguments: String,
}

#[derive(Debug, Deserialize)]
struct Usage {
    prompt_tokens: u32,
    completion_tokens: u32,
    total_tokens: u32,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_creation() {
        let config = AiProviderConfig::hunyuan("test-key");
        assert_eq!(config.name, "腾讯混元");
        assert!(config.base_url.contains("hunyuan"));
    }
}
