// src-tauri/src/core/domain/agent/agent_value_objects.rs
// module: core/domain/agent | layer: domain | role: agent-value-objects
// summary: AI Agent 值对象 - 消息、工具调用、工具结果等不可变数据结构

use serde::{Deserialize, Serialize};
use serde_json::Value;

/// 消息角色
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum MessageRole {
    /// 系统消息（定义 AI 行为）
    System,
    /// 用户消息
    User,
    /// AI 助手消息
    Assistant,
    /// 工具执行结果
    Tool,
}

/// Agent 消息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentMessage {
    /// 消息角色
    pub role: MessageRole,
    
    /// 消息内容
    pub content: String,
    
    /// 工具调用（仅 Assistant 消息可能包含）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_calls: Option<Vec<ToolCall>>,
    
    /// 工具调用 ID（仅 Tool 消息包含）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_call_id: Option<String>,
}

impl AgentMessage {
    /// 创建系统消息
    pub fn system(content: impl Into<String>) -> Self {
        Self {
            role: MessageRole::System,
            content: content.into(),
            tool_calls: None,
            tool_call_id: None,
        }
    }

    /// 创建用户消息
    pub fn user(content: impl Into<String>) -> Self {
        Self {
            role: MessageRole::User,
            content: content.into(),
            tool_calls: None,
            tool_call_id: None,
        }
    }

    /// 创建 AI 助手消息
    pub fn assistant(content: impl Into<String>) -> Self {
        Self {
            role: MessageRole::Assistant,
            content: content.into(),
            tool_calls: None,
            tool_call_id: None,
        }
    }

    /// 创建带工具调用的 AI 助手消息
    pub fn assistant_with_tools(content: Option<String>, tool_calls: Vec<ToolCall>) -> Self {
        Self {
            role: MessageRole::Assistant,
            content: content.unwrap_or_default(),
            tool_calls: Some(tool_calls),
            tool_call_id: None,
        }
    }

    /// 创建工具结果消息
    pub fn tool_result(tool_call_id: impl Into<String>, result: ToolResult) -> Self {
        Self {
            role: MessageRole::Tool,
            content: result.to_string(),
            tool_calls: None,
            tool_call_id: Some(tool_call_id.into()),
        }
    }
}

/// 工具调用请求（AI 发起）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolCall {
    /// 调用 ID（用于匹配结果）
    pub id: String,
    
    /// 工具类型（通常是 "function"）
    #[serde(rename = "type")]
    pub call_type: String,
    
    /// 函数调用详情
    pub function: FunctionCall,
}

/// 函数调用详情
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FunctionCall {
    /// 函数名称（对应 MCP 工具名）
    pub name: String,
    
    /// 函数参数（JSON 格式）
    pub arguments: String,
}

impl ToolCall {
    /// 创建新的工具调用
    pub fn new(id: impl Into<String>, name: impl Into<String>, arguments: Value) -> Self {
        Self {
            id: id.into(),
            call_type: "function".to_string(),
            function: FunctionCall {
                name: name.into(),
                arguments: arguments.to_string(),
            },
        }
    }

    /// 解析参数为 JSON Value
    pub fn parse_arguments(&self) -> Result<Value, serde_json::Error> {
        serde_json::from_str(&self.function.arguments)
    }
}

/// 工具执行结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolResult {
    /// 是否成功
    pub success: bool,
    
    /// 结果内容
    pub content: String,
    
    /// 错误信息（如果失败）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

impl ToolResult {
    /// 创建成功结果
    pub fn success(content: impl Into<String>) -> Self {
        Self {
            success: true,
            content: content.into(),
            error: None,
        }
    }

    /// 创建 JSON 成功结果
    pub fn success_json<T: Serialize>(data: &T) -> Self {
        Self {
            success: true,
            content: serde_json::to_string_pretty(data).unwrap_or_default(),
            error: None,
        }
    }

    /// 创建错误结果
    pub fn error(message: impl Into<String>) -> Self {
        let msg = message.into();
        Self {
            success: false,
            content: String::new(),
            error: Some(msg),
        }
    }
}

impl std::fmt::Display for ToolResult {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        if self.success {
            write!(f, "{}", self.content)
        } else {
            write!(f, "Error: {}", self.error.as_deref().unwrap_or("Unknown error"))
        }
    }
}

/// AI 工具定义（用于告诉 AI 有哪些工具可用）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentTool {
    /// 工具类型
    #[serde(rename = "type")]
    pub tool_type: String,
    
    /// 函数定义
    pub function: AgentToolFunction,
}

/// 工具函数定义
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentToolFunction {
    /// 函数名称
    pub name: String,
    
    /// 函数描述
    pub description: String,
    
    /// 参数 schema（JSON Schema 格式）
    pub parameters: Value,
}

impl AgentTool {
    /// 从 MCP 工具定义创建
    pub fn from_mcp(name: &str, description: &str, parameters: Value) -> Self {
        Self {
            tool_type: "function".to_string(),
            function: AgentToolFunction {
                name: name.to_string(),
                description: description.to_string(),
                parameters,
            },
        }
    }
}

/// AI 提供商配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiProviderConfig {
    /// 提供商名称
    pub name: String,
    
    /// API Base URL
    pub base_url: String,
    
    /// API Key
    pub api_key: String,
    
    /// 默认模型
    pub model: String,
    
    /// 最大 tokens
    pub max_tokens: Option<u32>,
    
    /// Temperature
    pub temperature: Option<f32>,
}

impl AiProviderConfig {
    /// OpenAI 配置
    pub fn openai(api_key: impl Into<String>) -> Self {
        Self {
            name: "OpenAI".to_string(),
            base_url: "https://api.openai.com/v1".to_string(),
            api_key: api_key.into(),
            model: "gpt-4o".to_string(),
            max_tokens: Some(4096),
            temperature: Some(0.7),
        }
    }

    /// 腾讯混元配置（OpenAI 兼容模式）
    pub fn hunyuan(api_key: impl Into<String>) -> Self {
        Self {
            name: "腾讯混元".to_string(),
            base_url: "https://api.hunyuan.cloud.tencent.com/v1".to_string(),
            api_key: api_key.into(),
            model: "hunyuan-pro".to_string(),
            max_tokens: Some(4096),
            temperature: Some(0.7),
        }
    }

    /// DeepSeek 配置
    pub fn deepseek(api_key: impl Into<String>) -> Self {
        Self {
            name: "DeepSeek".to_string(),
            base_url: "https://api.deepseek.com/v1".to_string(),
            api_key: api_key.into(),
            model: "deepseek-chat".to_string(),
            max_tokens: Some(4096),
            temperature: Some(0.7),
        }
    }

    /// 自定义配置
    pub fn custom(
        name: impl Into<String>,
        base_url: impl Into<String>,
        api_key: impl Into<String>,
        model: impl Into<String>,
    ) -> Self {
        Self {
            name: name.into(),
            base_url: base_url.into(),
            api_key: api_key.into(),
            model: model.into(),
            max_tokens: Some(4096),
            temperature: Some(0.7),
        }
    }
}
