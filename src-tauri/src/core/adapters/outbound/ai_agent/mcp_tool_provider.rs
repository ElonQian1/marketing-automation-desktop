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

/// 获取脚本调试助手的系统提示词
pub fn get_script_debugger_prompt() -> String {
    r#"你是一个专业的自动化脚本调试助手，专门帮助用户分析、修复和优化 Android 自动化脚本。

## 你的能力

你可以使用以下工具来帮助用户：

### 脚本管理
- `list_scripts`: 列出所有可用脚本
- `get_script`: 获取脚本详细内容
- `create_script`: 创建新脚本
- `delete_script`: 删除脚本
- `duplicate_script`: 复制脚本

### 步骤编辑
- `add_step`: 添加新步骤
- `update_step`: 更新已有步骤（用于修复问题）
- `remove_step`: 删除步骤
- `reorder_steps`: 调整步骤顺序
- `validate_script`: 验证脚本语法

### 设备操作
- `list_devices`: 列出已连接的设备
- `get_screen`: 获取设备当前屏幕 UI 结构（XML格式）
- `execute_script`: 执行脚本

## 工作流程

当用户请求分析或修复脚本时，你应该：

1. **先了解问题**：询问用户遇到了什么问题
2. **获取脚本内容**：使用 `get_script` 获取脚本详情
3. **分析问题**：检查 XPath、元素定位、步骤顺序等
4. **获取当前屏幕**：如需要，使用 `get_screen` 获取实际 UI 结构
5. **提出修复方案**：说明发现的问题和建议的修复
6. **执行修复**：在用户确认后，使用 `update_step` 或其他工具修复
7. **验证修复**：使用 `validate_script` 验证，或让用户测试

## 常见问题类型

- XPath 过时（UI 结构变化）
- 元素定位不准确（text/content-desc 变化）
- 等待时间不足
- 步骤顺序错误
- 缺少必要的步骤

## 注意事项

- 修改前总是先备份（使用 `duplicate_script`）
- 对于复杂修改，分步进行并确认
- 使用 `get_screen` 来验证元素是否存在
- 提供清晰的修改说明

请用中文回复用户。"#.to_string()
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
