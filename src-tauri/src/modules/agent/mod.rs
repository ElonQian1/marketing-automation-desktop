// src-tauri/src/modules/agent/lib.rs
// module: modules/agent | layer: adapters/inbound | role: tauri-plugin
// summary: AI Agent Tauri 插件 - 暴露 AI 代理功能给前端

use std::sync::Arc;
use tauri::{plugin::{Builder, TauriPlugin}, Runtime, Manager, State};
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};
use tracing::{info, error};

use crate::core::domain::agent::{AiProviderConfig, AgentSession, ToolProvider, AiProvider};
use crate::core::application::{AppContext, AgentAppService};
use crate::core::adapters::outbound::{OpenAiCompatibleProvider, McpToolProvider};

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
pub struct ChatResponse {
    pub success: bool,
    pub reply: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
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

    // 根据提供商类型创建配置
    let config = match request.provider.as_str() {
        "openai" => {
            let mut cfg = AiProviderConfig::openai(&request.api_key);
            if let Some(model) = request.model {
                cfg.model = model;
            }
            cfg
        }
        "hunyuan" => {
            let mut cfg = AiProviderConfig::hunyuan(&request.api_key);
            if let Some(model) = request.model {
                cfg.model = model;
            }
            cfg
        }
        "deepseek" => {
            let mut cfg = AiProviderConfig::deepseek(&request.api_key);
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
                &request.api_key,
                model,
            )
        }
        _ => return Err(format!("不支持的提供商: {}", request.provider)),
    };

    // 创建 AI 提供商
    let ai_provider: Arc<dyn AiProvider> = Arc::new(OpenAiCompatibleProvider::new(config));

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
            })
        }
        Err(e) => {
            error!("❌ AI 对话失败: {}", e);
            Ok(ChatResponse {
                success: false,
                reply: String::new(),
                error: Some(e.to_string()),
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
        }),
        Err(e) => Ok(ChatResponse {
            success: false,
            reply: String::new(),
            error: Some(e.to_string()),
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
        }),
        Err(e) => Ok(ChatResponse {
            success: false,
            reply: String::new(),
            error: Some(e.to_string()),
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
        }),
        Err(e) => Ok(ChatResponse {
            success: false,
            reply: String::new(),
            error: Some(e.to_string()),
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
        ])
        .setup(|app, _api| {
            app.manage(AgentState::new());
            info!("🤖 AI Agent 插件已初始化");
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
