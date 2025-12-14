// src-tauri/src/modules/agent/mod.rs
// module: modules/agent | layer: adapters/inbound | role: tauri-plugin
// summary: AI Agent Tauri 插件 - 暴露 AI 代理功能给前端

mod agent_config;

use std::sync::Arc;
use tauri::{plugin::{Builder, TauriPlugin}, Runtime, Manager, State};
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};
use tracing::{info, warn, error};

use crate::core::domain::agent::{AiProviderConfig, AgentSession, ToolProvider, AiProvider};
use crate::core::application::{AppContext, AgentAppService};
use crate::core::adapters::outbound::{OpenAiCompatibleProvider, McpToolProvider};

pub use agent_config::{AgentConfig, FullAgentConfig};

/// Agent 插件状态
pub struct AgentState {
    service: RwLock<Option<AgentAppService>>,
    app_context: RwLock<Option<Arc<AppContext>>>,
}

impl AgentState {
    pub fn new() -> Self {
        Self {
            service: RwLock::new(None),
            app_context: RwLock::new(None),
        }
    }

    /// 设置应用上下文
    pub async fn set_app_context(&self, ctx: Arc<AppContext>) {
        let mut context = self.app_context.write().await;
        *context = Some(ctx);
    }

    /// 公共接口：发送消息给 AI（供其他模块调用）
    pub async fn chat_with_ai(&self, message: &str) -> Result<String, String> {
        let service = self.service.read().await;
        let agent = service.as_ref()
            .ok_or("AI Agent 未配置，请先调用 configure")?;

        agent.chat(message).await.map_err(|e| e.to_string())
    }

    /// 公共接口：检查 AI 是否已配置
    pub async fn is_configured(&self) -> bool {
        self.service.read().await.is_some()
    }
}

// ============================================================================
// 命令数据结构
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct ConfigureAgentRequest {
    /// AI 提供商类型: "openai", "hunyuan", "deepseek", "custom"
    pub provider: String,
    /// API Key
    pub api_key: String,
    /// 自定义 base_url（仅 custom 模式需要）
    pub base_url: Option<String>,
    /// 自定义模型名（可选）
    pub model: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct AgentResponse {
    pub success: bool,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub session_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatResponse {
    pub success: bool,
    pub reply: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    /// Token 使用统计
    #[serde(skip_serializing_if = "Option::is_none")]
    pub token_usage: Option<TokenUsage>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TokenUsage {
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub total_tokens: u32,
}

#[derive(Debug, Serialize)]
pub struct ToolInfo {
    pub name: String,
    pub description: String,
}

// ============================================================================
// Tauri 命令
// ============================================================================

/// 配置 AI 提供商
#[tauri::command]
async fn configure(
    request: ConfigureAgentRequest,
    state: State<'_, AgentState>,
) -> Result<AgentResponse, String> {
    info!("🔧 配置 AI Agent: provider={}", request.provider);

    // 清理和验证 API Key
    let api_key = request.api_key.trim();
    if api_key.is_empty() {
        return Err("API Key 不能为空".to_string());
    }
    
    // 检测重复粘贴的 API Key (如 sk-xxx...sk-xxx...)
    if api_key.len() > 60 && api_key.starts_with("sk-") {
        // 尝试检测是否是两个相同的 key 拼接
        let half_len = api_key.len() / 2;
        let first_half = &api_key[..half_len];
        let second_half = &api_key[half_len..];
        if first_half == second_half {
            return Err("检测到 API Key 重复粘贴，请检查输入".to_string());
        }
    }

    // 保存配置到文件和 API Key 到 keyring
    let config = agent_config::AgentConfig {
        provider: request.provider.clone(),
        base_url: request.base_url.clone(),
        model: request.model.clone(),
    };
    
    agent_config::save_config(&config)
        .map_err(|e| format!("保存配置失败: {}", e))?;
    
    agent_config::save_api_key(&request.provider, api_key)
        .map_err(|e| format!("保存 API Key 失败: {}", e))?;

    // 根据提供商类型创建配置
    let ai_config = match request.provider.as_str() {
        "openai" => {
            let mut cfg = AiProviderConfig::openai(api_key);
            if let Some(model) = request.model {
                cfg.model = model;
            }
            cfg
        }
        "hunyuan" => {
            let mut cfg = AiProviderConfig::hunyuan(api_key);
            if let Some(model) = request.model {
                cfg.model = model;
            }
            cfg
        }
        "deepseek" => {
            let mut cfg = AiProviderConfig::deepseek(api_key);
            if let Some(model) = request.model {
                cfg.model = model;
            }
            cfg
        }
        "custom" => {
            let base_url = request.base_url
                .ok_or("自定义模式需要提供 base_url")?;
            let model = request.model
                .ok_or("自定义模式需要提供 model")?;
            AiProviderConfig::custom(
                "自定义",
                base_url,
                api_key,
                model,
            )
        }
        _ => return Err(format!("不支持的提供商: {}", request.provider)),
    };

    // 创建 AI 提供商
    let ai_provider: Arc<dyn AiProvider> = Arc::new(OpenAiCompatibleProvider::new(ai_config));

    // 获取 AppContext
    let context = state.app_context.read().await;
    let ctx = context.as_ref()
        .ok_or("应用上下文未初始化")?
        .clone();

    // 创建工具提供商
    let tool_provider: Arc<dyn ToolProvider> = Arc::new(McpToolProvider::new(ctx));

    // 创建 Agent 服务
    let agent_service = AgentAppService::new(tool_provider)
        .with_ai_provider(ai_provider);

    // 保存服务
    let mut service = state.service.write().await;
    *service = Some(agent_service);

    info!("✅ AI Agent 配置成功");

    Ok(AgentResponse {
        success: true,
        message: format!("AI Agent 已配置 ({})", request.provider),
        session_id: None,
        error: None,
    })
}

/// 发送消息给 AI
#[tauri::command]
async fn chat(
    message: String,
    state: State<'_, AgentState>,
) -> Result<ChatResponse, String> {
    info!("💬 用户消息: {}", message);

    let service = state.service.read().await;
    let agent = service.as_ref()
        .ok_or("AI Agent 未配置，请先调用 configure")?;

    match agent.chat(&message).await {
        Ok(reply) => {
            info!("🤖 AI 回复: {}", &reply[..reply.len().min(100)]);
            Ok(ChatResponse {
                success: true,
                reply,
                error: None,
                token_usage: None, // TODO: 从 AI 响应中获取
            })
        }
        Err(e) => {
            error!("❌ AI 对话失败: {}", e);
            Ok(ChatResponse {
                success: false,
                reply: String::new(),
                error: Some(e.to_string()),
                token_usage: None,
            })
        }
    }
}

/// 分析脚本问题
#[tauri::command]
async fn analyze_script(
    script_id: String,
    state: State<'_, AgentState>,
) -> Result<ChatResponse, String> {
    info!("🔍 分析脚本: {}", script_id);

    let service = state.service.read().await;
    let agent = service.as_ref()
        .ok_or("AI Agent 未配置")?;

    match agent.analyze_script(&script_id).await {
        Ok(analysis) => Ok(ChatResponse {
            success: true,
            reply: analysis,
            error: None,
            token_usage: None,
        }),
        Err(e) => Ok(ChatResponse {
            success: false,
            reply: String::new(),
            error: Some(e.to_string()),
            token_usage: None,
        }),
    }
}

/// 修复脚本问题
#[tauri::command]
async fn fix_script(
    script_id: String,
    issue: String,
    state: State<'_, AgentState>,
) -> Result<ChatResponse, String> {
    info!("🔧 修复脚本: {} - {}", script_id, issue);

    let service = state.service.read().await;
    let agent = service.as_ref()
        .ok_or("AI Agent 未配置")?;

    match agent.fix_script(&script_id, &issue).await {
        Ok(result) => Ok(ChatResponse {
            success: true,
            reply: result,
            error: None,
            token_usage: None,
        }),
        Err(e) => Ok(ChatResponse {
            success: false,
            reply: String::new(),
            error: Some(e.to_string()),
            token_usage: None,
        }),
    }
}

/// 执行自然语言任务
#[tauri::command]
async fn execute_task(
    task: String,
    state: State<'_, AgentState>,
) -> Result<ChatResponse, String> {
    info!("📋 执行任务: {}", task);

    let service = state.service.read().await;
    let agent = service.as_ref()
        .ok_or("AI Agent 未配置")?;

    match agent.execute_task(&task).await {
        Ok(result) => Ok(ChatResponse {
            success: true,
            reply: result,
            error: None,
            token_usage: None,
        }),
        Err(e) => Ok(ChatResponse {
            success: false,
            reply: String::new(),
            error: Some(e.to_string()),
            token_usage: None,
        }),
    }
}

/// 获取当前会话
#[tauri::command]
async fn get_session(
    state: State<'_, AgentState>,
) -> Result<Option<AgentSession>, String> {
    let service = state.service.read().await;
    match &*service {
        Some(agent) => Ok(agent.get_active_session().await),
        None => Ok(None),
    }
}

/// 清除会话
#[tauri::command]
async fn clear_session(
    state: State<'_, AgentState>,
) -> Result<AgentResponse, String> {
    let service = state.service.read().await;
    if let Some(agent) = &*service {
        agent.clear_session().await;
    }
    
    Ok(AgentResponse {
        success: true,
        message: "会话已清除".to_string(),
        session_id: None,
        error: None,
    })
}

/// 获取可用工具列表
#[tauri::command]
async fn list_tools(
    state: State<'_, AgentState>,
) -> Result<Vec<ToolInfo>, String> {
    let service = state.service.read().await;
    let agent = service.as_ref()
        .ok_or("AI Agent 未配置")?;

    let tools = agent.get_available_tools();
    
    Ok(tools.iter().map(|t| ToolInfo {
        name: t.function.name.clone(),
        description: t.function.description.clone(),
    }).collect())
}

/// 测试 AI 连接
#[tauri::command]
async fn test_connection(
    state: State<'_, AgentState>,
) -> Result<AgentResponse, String> {
    // 简单测试：尝试发送一条消息
    let service = state.service.read().await;
    let agent = service.as_ref()
        .ok_or("AI Agent 未配置")?;

    match agent.chat("Hello, this is a connection test.").await {
        Ok(_) => Ok(AgentResponse {
            success: true,
            message: "连接测试成功".to_string(),
            session_id: None,
            error: None,
        }),
        Err(e) => Ok(AgentResponse {
            success: false,
            message: "连接测试失败".to_string(),
            session_id: None,
            error: Some(e.to_string()),
        }),
    }
}

/// 获取配置状态
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfigStatus {
    pub has_saved_config: bool,
    pub provider: Option<String>,
    pub is_configured: bool,
}

#[tauri::command]
async fn get_config_status(
    state: State<'_, AgentState>,
) -> Result<ConfigStatus, String> {
    let service = state.service.read().await;
    let is_configured = service.is_some();
    
    let (has_saved, provider) = if let Some(config) = agent_config::load_config() {
        (agent_config::load_api_key(&config.provider).is_ok(), Some(config.provider))
    } else {
        (false, None)
    };
    
    Ok(ConfigStatus {
        has_saved_config: has_saved,
        provider,
        is_configured,
    })
}

/// 从保存的配置自动恢复（用于热重载后自动恢复）
#[tauri::command]
async fn restore_config(
    state: State<'_, AgentState>,
) -> Result<AgentResponse, String> {
    info!("🔄 尝试恢复 Agent 配置...");
    
    // 检查是否有保存的配置
    let full_config = agent_config::load_full_config()
        .ok_or("没有保存的配置")?;
    
    info!("📂 找到保存的配置: provider={}", full_config.provider);
    
    // 创建 AI 配置
    let ai_config = match full_config.provider.as_str() {
        "openai" => {
            let mut cfg = AiProviderConfig::openai(&full_config.api_key);
            if let Some(model) = &full_config.model {
                cfg.model = model.clone();
            }
            cfg
        }
        "hunyuan" => {
            let mut cfg = AiProviderConfig::hunyuan(&full_config.api_key);
            if let Some(model) = &full_config.model {
                cfg.model = model.clone();
            }
            cfg
        }
        "deepseek" => {
            let mut cfg = AiProviderConfig::deepseek(&full_config.api_key);
            if let Some(model) = &full_config.model {
                cfg.model = model.clone();
            }
            cfg
        }
        "custom" => {
            let base_url = full_config.base_url
                .ok_or("自定义模式需要 base_url")?;
            let model = full_config.model
                .ok_or("自定义模式需要 model")?;
            AiProviderConfig::custom(
                "自定义",
                base_url,
                &full_config.api_key,
                model,
            )
        }
        _ => return Err(format!("不支持的提供商: {}", full_config.provider)),
    };

    // 创建 AI 提供商
    let ai_provider: Arc<dyn AiProvider> = Arc::new(OpenAiCompatibleProvider::new(ai_config));

    // 获取 AppContext
    let context = state.app_context.read().await;
    let ctx = context.as_ref()
        .ok_or("应用上下文未初始化")?
        .clone();

    // 创建工具提供商
    let tool_provider: Arc<dyn ToolProvider> = Arc::new(McpToolProvider::new(ctx));

    // 创建 Agent 服务
    let agent_service = AgentAppService::new(tool_provider)
        .with_ai_provider(ai_provider);

    // 保存服务
    let mut service = state.service.write().await;
    *service = Some(agent_service);

    info!("✅ AI Agent 配置已自动恢复 ({})", full_config.provider);

    Ok(AgentResponse {
        success: true,
        message: format!("配置已自动恢复 ({})", full_config.provider),
        session_id: None,
        error: None,
    })
}

/// 清除保存的配置
#[tauri::command]
async fn clear_saved_config(
    state: State<'_, AgentState>,
) -> Result<AgentResponse, String> {
    // 获取当前配置以知道要删除哪个 API Key
    if let Some(config) = agent_config::load_config() {
        let _ = agent_config::delete_api_key(&config.provider);
    }
    
    // 清除内存中的服务
    let mut service = state.service.write().await;
    *service = None;
    
    info!("🗑️ 已清除保存的 Agent 配置");
    
    Ok(AgentResponse {
        success: true,
        message: "配置已清除".to_string(),
        session_id: None,
        error: None,
    })
}

// ============================================================================
// 插件初始化
// ============================================================================

/// 初始化 AI Agent 插件
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("agent")
        .invoke_handler(tauri::generate_handler![
            configure,
            chat,
            analyze_script,
            fix_script,
            execute_task,
            get_session,
            clear_session,
            list_tools,
            test_connection,
            get_config_status,
            restore_config,
            clear_saved_config,
        ])
        .setup(|app, _api| {
            app.manage(AgentState::new());
            info!("🤖 AI Agent 插件已初始化");
            
            // 检查是否有保存的配置
            if agent_config::has_saved_config() {
                info!("📂 检测到保存的 Agent 配置，前端可调用 restore_config 恢复");
            }
            
            Ok(())
        })
        .build()
}

/// 设置 Agent 的 AppContext（在 bootstrap 中调用）
pub async fn set_app_context<R: Runtime>(app: &tauri::AppHandle<R>, ctx: Arc<AppContext>) {
    if let Some(state) = app.try_state::<AgentState>() {
        state.set_app_context(ctx).await;
        info!("✅ Agent AppContext 已设置");
    }
}
