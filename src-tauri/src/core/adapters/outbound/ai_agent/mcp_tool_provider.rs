// src-tauri/src/core/adapters/outbound/ai_agent/mcp_tool_provider.rs
// module: core/adapters/outbound/ai_agent | layer: adapters | role: mcp-tool-bridge
// summary: MCP 工具提供商 - 将 MCP 工具暴露给 AI Agent 使用

use std::sync::Arc;
use async_trait::async_trait;
use serde_json::json;
use tracing::{info, error};

use crate::core::domain::agent::{AgentTool, ToolCall, ToolProvider, ToolResult};
use crate::core::application::AppContext;
use crate::core::adapters::inbound::mcp_server::tools::{register_tools, execute_tool};

/// MCP 工具提供商
/// 
/// 这个适配器将 MCP 工具转换为 AI Agent 可用的工具格式。
/// 实现了双向桥接：
/// 1. 将 MCP 工具定义转换为 OpenAI Function Calling 格式
/// 2. 将 AI 的工具调用请求转发到 MCP 工具执行
pub struct McpToolProvider {
    ctx: Arc<AppContext>,
}

impl McpToolProvider {
    pub fn new(ctx: Arc<AppContext>) -> Self {
        Self { ctx }
    }

    /// 将 MCP 工具转换为 AI Agent 工具格式
    fn convert_mcp_tools(&self) -> Vec<AgentTool> {
        let mcp_tools = register_tools();
        
        mcp_tools.iter().map(|mcp_tool| {
            AgentTool::from_mcp(
                &mcp_tool.name,
                &mcp_tool.description,
                mcp_tool.input_schema.clone(),
            )
        }).collect()
    }
}

#[async_trait]
impl ToolProvider for McpToolProvider {
    fn get_tools(&self) -> Vec<AgentTool> {
        self.convert_mcp_tools()
    }

    async fn execute(&self, tool_call: &ToolCall) -> ToolResult {
        info!("🔧 执行 AI 工具调用: {}", tool_call.function.name);

        // 解析参数
        let params = match tool_call.parse_arguments() {
            Ok(p) => p,
            Err(e) => {
                error!("❌ 解析工具参数失败: {}", e);
                return ToolResult::error(format!("参数解析失败: {}", e));
            }
        };

        // 调用 MCP 工具执行
        let mcp_result = execute_tool(&tool_call.function.name, params, &self.ctx).await;

        // 转换结果：从 MCP ToolResult 到 Agent ToolResult
        // MCP 的 content 是 Vec<ToolContent>，需要提取文本
        let content_text = mcp_result.content.iter()
            .filter_map(|c| {
                match c {
                    crate::core::adapters::inbound::mcp_server::protocol::ToolContent::Text { text } => Some(text.clone()),
                }
            })
            .collect::<Vec<_>>()
            .join("\n");

        if mcp_result.is_error {
            ToolResult::error(content_text)
        } else {
            ToolResult::success(content_text)
        }
    }
}

/// 获取脚本调试助手的系统提示词（精简版，减少 Token 消耗）
pub fn get_script_debugger_prompt() -> String {
    r#"你是 Android 自动化脚本调试助手。用中文回复。

**可用工具**：
- 脚本管理：list_scripts, get_script, create_script, delete_script, duplicate_script
- 步骤编辑：add_step, update_step, remove_step, reorder_steps, validate_script
- 设备操作：list_devices, get_screen, launch_app, run_adb_command, execute_script

**常用应用包名**：
- 微信: com.tencent.mm
- 小红书: com.xingin.xhs
- 抖音: com.ss.android.ugc.aweme

**工作流程**：
1. 了解问题 → 2. get_script 获取内容 → 3. 分析 → 4. 如需要可 get_screen 验证 → 5. 提出修复 → 6. 确认后执行

**注意**：修改前先 duplicate_script 备份。"#.to_string()
}

/// 获取任务执行助手的系统提示词
pub fn get_task_executor_prompt() -> String {
    r#"你是一个智能任务执行助手，可以理解用户的自然语言指令并自动执行相应的操作。

## 你的能力

你可以：
1. 理解用户的任务描述
2. 分解任务为具体步骤
3. 使用工具执行每个步骤
4. 报告执行结果

## 可用工具

所有脚本管理和设备操作工具都可使用，参见工具列表。

## 工作模式

1. **分析任务**：理解用户想要完成什么
2. **制定计划**：列出需要执行的步骤
3. **逐步执行**：使用工具完成每个步骤
4. **报告结果**：总结完成情况

请用中文回复用户。"#.to_string()
}
