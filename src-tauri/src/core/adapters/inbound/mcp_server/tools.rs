// src-tauri/src/core/adapters/inbound/mcp_server/tools.rs
// module: core/adapters/inbound/mcp_server | layer: adapters | role: mcp-tools
// summary: MCP 工具注册 - 定义 AI 可调用的工具，委托给 Application Service

use std::sync::Arc;
use serde_json::{json, Value};
use tracing::{info, error};

use super::protocol::{McpTool, ToolResult};
use crate::core::application::AppContext;
use crate::core::domain::script::{Script, ScriptStep, ClickTarget, StepAction, InputContent, WaitParams};

/// 注册所有 MCP 工具
pub fn register_tools() -> Vec<McpTool> {
    vec![
        // ====== 脚本管理工具 ======
        McpTool::new(
            "list_scripts",
            "列出所有可用的自动化脚本",
            json!({
                "type": "object",
                "properties": {},
                "required": []
            }),
        ),
        McpTool::new(
            "get_script",
            "获取指定脚本的详细内容",
            json!({
                "type": "object",
                "properties": {
                    "script_id": {
                        "type": "string",
                        "description": "脚本ID"
                    }
                },
                "required": ["script_id"]
            }),
        ),
        McpTool::new(
            "create_script",
            "创建新的自动化脚本",
            json!({
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "脚本名称"
                    },
                    "description": {
                        "type": "string",
                        "description": "脚本描述"
                    }
                },
                "required": ["name"]
            }),
        ),
        McpTool::new(
            "add_step",
            "向脚本添加一个步骤",
            json!({
                "type": "object",
                "properties": {
                    "script_id": {
                        "type": "string",
                        "description": "脚本ID"
                    },
                    "step_name": {
                        "type": "string",
                        "description": "步骤名称"
                    },
                    "action_type": {
                        "type": "string",
                        "enum": ["click", "input", "wait", "back", "swipe"],
                        "description": "动作类型"
                    },
                    "target_text": {
                        "type": "string",
                        "description": "目标元素文本（用于点击）"
                    },
                    "target_xpath": {
                        "type": "string",
                        "description": "目标元素XPath"
                    },
                    "input_text": {
                        "type": "string",
                        "description": "输入文本（用于input动作）"
                    },
                    "wait_ms": {
                        "type": "integer",
                        "description": "等待时间（毫秒）"
                    }
                },
                "required": ["script_id", "step_name", "action_type"]
            }),
        ),
        McpTool::new(
            "execute_script",
            "在指定设备上执行脚本",
            json!({
                "type": "object",
                "properties": {
                    "script_id": {
                        "type": "string",
                        "description": "脚本ID"
                    },
                    "device_id": {
                        "type": "string",
                        "description": "设备ID"
                    }
                },
                "required": ["script_id", "device_id"]
            }),
        ),
        McpTool::new(
            "delete_script",
            "删除指定脚本",
            json!({
                "type": "object",
                "properties": {
                    "script_id": {
                        "type": "string",
                        "description": "脚本ID"
                    }
                },
                "required": ["script_id"]
            }),
        ),
        
        // ====== 设备工具 ======
        McpTool::new(
            "list_devices",
            "列出所有已连接的Android设备",
            json!({
                "type": "object",
                "properties": {},
                "required": []
            }),
        ),
        McpTool::new(
            "get_screen",
            "获取设备当前屏幕的UI结构（XML格式）",
            json!({
                "type": "object",
                "properties": {
                    "device_id": {
                        "type": "string",
                        "description": "设备ID"
                    }
                },
                "required": ["device_id"]
            }),
        ),
    ]
}

/// 执行工具调用
pub async fn execute_tool(
    tool_name: &str,
    params: Value,
    ctx: &Arc<AppContext>,
) -> ToolResult {
    info!("🔧 MCP 工具调用: {} with {:?}", tool_name, params);

    match tool_name {
        "list_scripts" => handle_list_scripts(ctx).await,
        "get_script" => handle_get_script(params, ctx).await,
        "create_script" => handle_create_script(params, ctx).await,
        "add_step" => handle_add_step(params, ctx).await,
        "execute_script" => handle_execute_script(params, ctx).await,
        "delete_script" => handle_delete_script(params, ctx).await,
        "list_devices" => handle_list_devices(ctx).await,
        "get_screen" => handle_get_screen(params, ctx).await,
        _ => ToolResult::error(format!("未知工具: {}", tool_name)),
    }
}

// ============================================================================
// 工具处理函数
// ============================================================================

async fn handle_list_scripts(ctx: &Arc<AppContext>) -> ToolResult {
    match ctx.script_service.list_scripts().await {
        Ok(scripts) => ToolResult::success_json(&scripts),
        Err(e) => ToolResult::error(format!("列出脚本失败: {}", e)),
    }
}

async fn handle_get_script(params: Value, ctx: &Arc<AppContext>) -> ToolResult {
    let script_id = match params.get("script_id").and_then(|v| v.as_str()) {
        Some(id) => id,
        None => return ToolResult::error("缺少参数: script_id"),
    };

    match ctx.script_service.load_script(script_id).await {
        Ok(script) => ToolResult::success_json(&script),
        Err(e) => ToolResult::error(format!("加载脚本失败: {}", e)),
    }
}

async fn handle_create_script(params: Value, ctx: &Arc<AppContext>) -> ToolResult {
    let name = match params.get("name").and_then(|v| v.as_str()) {
        Some(n) => n.to_string(),
        None => return ToolResult::error("缺少参数: name"),
    };
    
    let description = params
        .get("description")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    match ctx.script_service.create_script(name, description).await {
        Ok(script) => ToolResult::success_json(&json!({
            "success": true,
            "script_id": script.id,
            "message": format!("脚本 '{}' 创建成功", script.name)
        })),
        Err(e) => ToolResult::error(format!("创建脚本失败: {}", e)),
    }
}

async fn handle_add_step(params: Value, ctx: &Arc<AppContext>) -> ToolResult {
    let script_id = match params.get("script_id").and_then(|v| v.as_str()) {
        Some(id) => id,
        None => return ToolResult::error("缺少参数: script_id"),
    };
    
    let step_name = match params.get("step_name").and_then(|v| v.as_str()) {
        Some(n) => n.to_string(),
        None => return ToolResult::error("缺少参数: step_name"),
    };
    
    let action_type = match params.get("action_type").and_then(|v| v.as_str()) {
        Some(t) => t,
        None => return ToolResult::error("缺少参数: action_type"),
    };

    // 构建步骤动作
    let action = match action_type {
        "click" => {
            let target = if let Some(text) = params.get("target_text").and_then(|v| v.as_str()) {
                ClickTarget::text(text)
            } else if let Some(xpath) = params.get("target_xpath").and_then(|v| v.as_str()) {
                ClickTarget::xpath(xpath)
            } else {
                return ToolResult::error("点击动作需要 target_text 或 target_xpath");
            };
            StepAction::Click(target)
        }
        "input" => {
            let text = match params.get("input_text").and_then(|v| v.as_str()) {
                Some(t) => t.to_string(),
                None => return ToolResult::error("输入动作需要 input_text"),
            };
            let target = if let Some(xpath) = params.get("target_xpath").and_then(|v| v.as_str()) {
                ClickTarget::xpath(xpath)
            } else {
                return ToolResult::error("输入动作需要 target_xpath");
            };
            StepAction::Input(InputContent {
                target,
                text,
                clear_first: true,
            })
        }
        "wait" => {
            let duration_ms = params
                .get("wait_ms")
                .and_then(|v| v.as_u64())
                .unwrap_or(1000);
            StepAction::Wait(WaitParams {
                duration_ms,
                condition: None,
            })
        }
        "back" => StepAction::Back,
        _ => return ToolResult::error(format!("不支持的动作类型: {}", action_type)),
    };

    let step = ScriptStep::new(step_name.clone(), action);

    match ctx.script_service.add_step(script_id, step).await {
        Ok(script) => ToolResult::success_json(&json!({
            "success": true,
            "message": format!("步骤 '{}' 已添加到脚本", step_name),
            "total_steps": script.steps.len()
        })),
        Err(e) => ToolResult::error(format!("添加步骤失败: {}", e)),
    }
}

async fn handle_execute_script(params: Value, ctx: &Arc<AppContext>) -> ToolResult {
    let script_id = match params.get("script_id").and_then(|v| v.as_str()) {
        Some(id) => id,
        None => return ToolResult::error("缺少参数: script_id"),
    };
    
    let device_id = match params.get("device_id").and_then(|v| v.as_str()) {
        Some(id) => id,
        None => return ToolResult::error("缺少参数: device_id"),
    };

    match ctx.script_service.execute_script(script_id, device_id).await {
        Ok(result) => ToolResult::success_json(&result),
        Err(e) => ToolResult::error(format!("执行脚本失败: {}", e)),
    }
}

async fn handle_delete_script(params: Value, ctx: &Arc<AppContext>) -> ToolResult {
    let script_id = match params.get("script_id").and_then(|v| v.as_str()) {
        Some(id) => id,
        None => return ToolResult::error("缺少参数: script_id"),
    };

    match ctx.script_service.delete_script(script_id).await {
        Ok(()) => ToolResult::success_json(&json!({
            "success": true,
            "message": format!("脚本 {} 已删除", script_id)
        })),
        Err(e) => ToolResult::error(format!("删除脚本失败: {}", e)),
    }
}

async fn handle_list_devices(ctx: &Arc<AppContext>) -> ToolResult {
    match ctx.device_service.list_devices().await {
        Ok(devices) => ToolResult::success_json(&devices),
        Err(e) => ToolResult::error(format!("获取设备列表失败: {}", e)),
    }
}

async fn handle_get_screen(params: Value, ctx: &Arc<AppContext>) -> ToolResult {
    let device_id = match params.get("device_id").and_then(|v| v.as_str()) {
        Some(id) => id,
        None => return ToolResult::error("缺少参数: device_id"),
    };

    match ctx.device_service.get_screen_content(device_id).await {
        Ok(xml) => ToolResult::success(xml),
        Err(e) => ToolResult::error(format!("获取屏幕内容失败: {}", e)),
    }
}
