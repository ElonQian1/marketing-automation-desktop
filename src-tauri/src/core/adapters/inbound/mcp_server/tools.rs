// src-tauri/src/core/adapters/inbound/mcp_server/tools.rs
// module: core/adapters/inbound/mcp_server | layer: adapters | role: mcp-tools
// summary: MCP 工具注册 - 定义 AI 可调用的工具，委托给 Application Service

use std::sync::Arc;
use serde_json::{json, Value};
use tracing::{info, error};

use super::protocol::{McpTool, ToolResult};
use crate::core::application::AppContext;
use crate::core::domain::script::{Script, ScriptStep, ClickTarget, StepAction, InputContent, WaitParams, SwipeParams};

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
                    },
                    "swipe_direction": {
                        "type": "string",
                        "enum": ["up", "down", "left", "right"],
                        "description": "滑动方向（用于swipe动作）"
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
        
        // ====== 步骤编辑工具（用于 AI 修正脚本） ======
        McpTool::new(
            "update_step",
            "更新脚本中的某个步骤（用于修正问题）",
            json!({
                "type": "object",
                "properties": {
                    "script_id": {
                        "type": "string",
                        "description": "脚本ID"
                    },
                    "step_index": {
                        "type": "integer",
                        "description": "步骤索引（从0开始）"
                    },
                    "step_name": {
                        "type": "string",
                        "description": "新的步骤名称"
                    },
                    "action_type": {
                        "type": "string",
                        "enum": ["click", "input", "wait", "back", "swipe"],
                        "description": "动作类型"
                    },
                    "target_text": {
                        "type": "string",
                        "description": "目标元素文本"
                    },
                    "target_xpath": {
                        "type": "string",
                        "description": "目标元素XPath"
                    },
                    "input_text": {
                        "type": "string",
                        "description": "输入文本"
                    },
                    "wait_ms": {
                        "type": "integer",
                        "description": "等待时间（毫秒）"
                    },
                    "swipe_direction": {
                        "type": "string",
                        "enum": ["up", "down", "left", "right"],
                        "description": "滑动方向"
                    }
                },
                "required": ["script_id", "step_index", "step_name", "action_type"]
            }),
        ),
        McpTool::new(
            "remove_step",
            "删除脚本中的某个步骤",
            json!({
                "type": "object",
                "properties": {
                    "script_id": {
                        "type": "string",
                        "description": "脚本ID"
                    },
                    "step_index": {
                        "type": "integer",
                        "description": "要删除的步骤索引（从0开始）"
                    }
                },
                "required": ["script_id", "step_index"]
            }),
        ),
        McpTool::new(
            "reorder_steps",
            "调整步骤顺序",
            json!({
                "type": "object",
                "properties": {
                    "script_id": {
                        "type": "string",
                        "description": "脚本ID"
                    },
                    "from_index": {
                        "type": "integer",
                        "description": "原位置索引"
                    },
                    "to_index": {
                        "type": "integer",
                        "description": "目标位置索引"
                    }
                },
                "required": ["script_id", "from_index", "to_index"]
            }),
        ),
        McpTool::new(
            "duplicate_script",
            "复制一个脚本作为新脚本",
            json!({
                "type": "object",
                "properties": {
                    "script_id": {
                        "type": "string",
                        "description": "要复制的脚本ID"
                    }
                },
                "required": ["script_id"]
            }),
        ),
        McpTool::new(
            "validate_script",
            "验证脚本是否有语法或逻辑错误",
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
        "update_step" => handle_update_step(params, ctx).await,
        "remove_step" => handle_remove_step(params, ctx).await,
        "reorder_steps" => handle_reorder_steps(params, ctx).await,
        "duplicate_script" => handle_duplicate_script(params, ctx).await,
        "validate_script" => handle_validate_script(params, ctx).await,
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

    // 构建步骤动作（使用辅助函数）
    let action = match build_step_action(action_type, &params) {
        Ok(a) => a,
        Err(e) => return ToolResult::error(e),
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

// ============================================================================
// AI 脚本修正工具处理函数
// ============================================================================

async fn handle_update_step(params: Value, ctx: &Arc<AppContext>) -> ToolResult {
    let script_id = match params.get("script_id").and_then(|v| v.as_str()) {
        Some(id) => id,
        None => return ToolResult::error("缺少参数: script_id"),
    };
    
    let step_index = match params.get("step_index").and_then(|v| v.as_u64()) {
        Some(idx) => idx as usize,
        None => return ToolResult::error("缺少参数: step_index"),
    };
    
    let step_name = match params.get("step_name").and_then(|v| v.as_str()) {
        Some(n) => n.to_string(),
        None => return ToolResult::error("缺少参数: step_name"),
    };
    
    let action_type = match params.get("action_type").and_then(|v| v.as_str()) {
        Some(t) => t,
        None => return ToolResult::error("缺少参数: action_type"),
    };

    // 构建新的步骤动作（复用 add_step 的逻辑）
    let action = match build_step_action(action_type, &params) {
        Ok(a) => a,
        Err(e) => return ToolResult::error(e),
    };

    let step = ScriptStep::new(step_name.clone(), action);

    match ctx.script_service.update_step(script_id, step_index, step).await {
        Ok(script) => ToolResult::success_json(&json!({
            "success": true,
            "message": format!("步骤 {} 已更新为 '{}'", step_index, step_name),
            "total_steps": script.steps.len()
        })),
        Err(e) => ToolResult::error(format!("更新步骤失败: {}", e)),
    }
}

async fn handle_remove_step(params: Value, ctx: &Arc<AppContext>) -> ToolResult {
    let script_id = match params.get("script_id").and_then(|v| v.as_str()) {
        Some(id) => id,
        None => return ToolResult::error("缺少参数: script_id"),
    };
    
    let step_index = match params.get("step_index").and_then(|v| v.as_u64()) {
        Some(idx) => idx as usize,
        None => return ToolResult::error("缺少参数: step_index"),
    };

    match ctx.script_service.remove_step(script_id, step_index).await {
        Ok(script) => ToolResult::success_json(&json!({
            "success": true,
            "message": format!("步骤 {} 已删除", step_index),
            "remaining_steps": script.steps.len()
        })),
        Err(e) => ToolResult::error(format!("删除步骤失败: {}", e)),
    }
}

async fn handle_reorder_steps(params: Value, ctx: &Arc<AppContext>) -> ToolResult {
    let script_id = match params.get("script_id").and_then(|v| v.as_str()) {
        Some(id) => id,
        None => return ToolResult::error("缺少参数: script_id"),
    };
    
    let from_index = match params.get("from_index").and_then(|v| v.as_u64()) {
        Some(idx) => idx as usize,
        None => return ToolResult::error("缺少参数: from_index"),
    };
    
    let to_index = match params.get("to_index").and_then(|v| v.as_u64()) {
        Some(idx) => idx as usize,
        None => return ToolResult::error("缺少参数: to_index"),
    };

    match ctx.script_service.reorder_steps(script_id, from_index, to_index).await {
        Ok(script) => ToolResult::success_json(&json!({
            "success": true,
            "message": format!("步骤已从位置 {} 移动到位置 {}", from_index, to_index),
            "total_steps": script.steps.len()
        })),
        Err(e) => ToolResult::error(format!("重排步骤失败: {}", e)),
    }
}

async fn handle_duplicate_script(params: Value, ctx: &Arc<AppContext>) -> ToolResult {
    let script_id = match params.get("script_id").and_then(|v| v.as_str()) {
        Some(id) => id,
        None => return ToolResult::error("缺少参数: script_id"),
    };

    match ctx.script_service.duplicate_script(script_id).await {
        Ok(new_script) => ToolResult::success_json(&json!({
            "success": true,
            "message": format!("脚本已复制为 '{}'", new_script.name),
            "new_script_id": new_script.id,
            "new_script_name": new_script.name
        })),
        Err(e) => ToolResult::error(format!("复制脚本失败: {}", e)),
    }
}

async fn handle_validate_script(params: Value, ctx: &Arc<AppContext>) -> ToolResult {
    let script_id = match params.get("script_id").and_then(|v| v.as_str()) {
        Some(id) => id,
        None => return ToolResult::error("缺少参数: script_id"),
    };

    // 加载脚本
    let script = match ctx.script_service.load_script(script_id).await {
        Ok(s) => s,
        Err(e) => return ToolResult::error(format!("加载脚本失败: {}", e)),
    };

    // 验证脚本
    match script.validate() {
        Ok(()) => ToolResult::success_json(&json!({
            "valid": true,
            "message": "脚本验证通过",
            "script_id": script_id,
            "step_count": script.steps.len()
        })),
        Err(e) => ToolResult::success_json(&json!({
            "valid": false,
            "message": format!("脚本验证失败: {}", e),
            "script_id": script_id,
            "error": e.to_string()
        })),
    }
}

// ============================================================================
// 辅助函数
// ============================================================================

/// 从参数构建步骤动作
fn build_step_action(action_type: &str, params: &Value) -> Result<StepAction, String> {
    match action_type {
        "click" => {
            let target = if let Some(text) = params.get("target_text").and_then(|v| v.as_str()) {
                ClickTarget::text(text)
            } else if let Some(xpath) = params.get("target_xpath").and_then(|v| v.as_str()) {
                ClickTarget::xpath(xpath)
            } else {
                return Err("点击动作需要 target_text 或 target_xpath".to_string());
            };
            Ok(StepAction::Click(target))
        }
        "input" => {
            let text = match params.get("input_text").and_then(|v| v.as_str()) {
                Some(t) => t.to_string(),
                None => return Err("输入动作需要 input_text".to_string()),
            };
            let target = if let Some(xpath) = params.get("target_xpath").and_then(|v| v.as_str()) {
                ClickTarget::xpath(xpath)
            } else {
                return Err("输入动作需要 target_xpath".to_string());
            };
            Ok(StepAction::Input(InputContent {
                target,
                text,
                clear_first: true,
            }))
        }
        "wait" => {
            let duration_ms = params
                .get("wait_ms")
                .and_then(|v| v.as_u64())
                .unwrap_or(1000);
            Ok(StepAction::Wait(WaitParams {
                duration_ms,
                condition: None,
            }))
        }
        "back" => Ok(StepAction::Back),
        "swipe" => {
            let direction = params
                .get("swipe_direction")
                .and_then(|v| v.as_str())
                .unwrap_or("up");
            
            let (start, end) = match direction {
                "up" => ((540, 1800), (540, 800)),
                "down" => ((540, 800), (540, 1800)),
                "left" => ((900, 1200), (180, 1200)),
                "right" => ((180, 1200), (900, 1200)),
                _ => ((540, 1800), (540, 800)),
            };
            
            Ok(StepAction::Swipe(SwipeParams {
                start,
                end,
                duration_ms: 300,
            }))
        }
        _ => Err(format!("不支持的动作类型: {}", action_type)),
    }
}
