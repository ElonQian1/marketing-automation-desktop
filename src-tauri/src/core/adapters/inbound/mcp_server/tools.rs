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
    let mut tools = vec![
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
        McpTool::new(
            "launch_app",
            "在设备上启动指定应用",
            json!({
                "type": "object",
                "properties": {
                    "device_id": {
                        "type": "string",
                        "description": "设备ID"
                    },
                    "package_name": {
                        "type": "string",
                        "description": "应用包名，如 com.tencent.mm (微信), com.xingin.xhs (小红书)"
                    }
                },
                "required": ["device_id", "package_name"]
            }),
        ),
        McpTool::new(
            "run_adb_command",
            "在设备上执行ADB shell命令（谨慎使用）",
            json!({
                "type": "object",
                "properties": {
                    "device_id": {
                        "type": "string",
                        "description": "设备ID"
                    },
                    "command": {
                        "type": "string",
                        "description": "要执行的 shell 命令"
                    }
                },
                "required": ["device_id", "command"]
            }),
        ),
        // ====== 直接设备控制工具（AI Agent 实时操作）======
        McpTool::new(
            "tap",
            "点击屏幕指定坐标",
            json!({
                "type": "object",
                "properties": {
                    "device_id": {
                        "type": "string",
                        "description": "设备ID"
                    },
                    "x": {
                        "type": "integer",
                        "description": "X坐标"
                    },
                    "y": {
                        "type": "integer",
                        "description": "Y坐标"
                    }
                },
                "required": ["device_id", "x", "y"]
            }),
        ),
        McpTool::new(
            "tap_element",
            "点击屏幕上的元素（通过文本匹配）。先调用 get_screen 获取元素，再用此工具点击",
            json!({
                "type": "object",
                "properties": {
                    "device_id": {
                        "type": "string",
                        "description": "设备ID"
                    },
                    "text": {
                        "type": "string",
                        "description": "要点击的元素文本（精确匹配或包含）"
                    },
                    "match_type": {
                        "type": "string",
                        "enum": ["exact", "contains"],
                        "description": "匹配类型：exact=精确匹配，contains=包含匹配。默认contains"
                    }
                },
                "required": ["device_id", "text"]
            }),
        ),
        McpTool::new(
            "swipe_screen",
            "在屏幕上滑动",
            json!({
                "type": "object",
                "properties": {
                    "device_id": {
                        "type": "string",
                        "description": "设备ID"
                    },
                    "direction": {
                        "type": "string",
                        "enum": ["up", "down", "left", "right"],
                        "description": "滑动方向"
                    },
                    "distance": {
                        "type": "string",
                        "enum": ["short", "medium", "long"],
                        "description": "滑动距离。默认medium"
                    }
                },
                "required": ["device_id", "direction"]
            }),
        ),
        McpTool::new(
            "input_text",
            "在当前焦点输入文本",
            json!({
                "type": "object",
                "properties": {
                    "device_id": {
                        "type": "string",
                        "description": "设备ID"
                    },
                    "text": {
                        "type": "string",
                        "description": "要输入的文本"
                    }
                },
                "required": ["device_id", "text"]
            }),
        ),
        McpTool::new(
            "press_key",
            "按下设备按键",
            json!({
                "type": "object",
                "properties": {
                    "device_id": {
                        "type": "string",
                        "description": "设备ID"
                    },
                    "key": {
                        "type": "string",
                        "enum": ["back", "home", "menu", "enter", "delete"],
                        "description": "按键名称"
                    }
                },
                "required": ["device_id", "key"]
            }),
        ),
        McpTool::new(
            "wait",
            "等待指定时间",
            json!({
                "type": "object",
                "properties": {
                    "milliseconds": {
                        "type": "integer",
                        "description": "等待时间（毫秒）"
                    }
                },
                "required": ["milliseconds"]
            }),
        ),
    ];
    
    // 添加 MDE 数据提取工具
    let mde_tools = super::mde_tools::register_mde_tools();
    tools.extend(mde_tools);
    
    tools
}

/// 执行工具调用
pub async fn execute_tool(
    tool_name: &str,
    params: Value,
    ctx: &Arc<AppContext>,
) -> ToolResult {
    info!("🔧 MCP 工具调用: {} with {:?}", tool_name, params);

    // 先尝试 MDE 工具
    if let Some(result) = super::mde_tools::execute_mde_tool(tool_name, params.clone(), ctx).await {
        return result;
    }

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
        "launch_app" => handle_launch_app(params, ctx).await,
        "run_adb_command" => handle_run_adb_command(params, ctx).await,
        // 直接设备控制工具
        "tap" => handle_tap(params).await,
        "tap_element" => handle_tap_element(params).await,
        "swipe_screen" => handle_swipe_screen(params).await,
        "input_text" => handle_input_text(params).await,
        "press_key" => handle_press_key(params).await,
        "wait" => handle_wait(params).await,
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

// ====== 新增的 ADB 直接命令工具 ======

/// 启动应用
async fn handle_launch_app(params: Value, _ctx: &Arc<AppContext>) -> ToolResult {
    let device_id = params
        .get("device_id")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "缺少 device_id 参数".to_string());
    
    let package_name = params
        .get("package_name")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "缺少 package_name 参数".to_string());

    match (device_id, package_name) {
        (Ok(device_id), Ok(package_name)) => {
            info!("🚀 启动应用: {} on {}", package_name, device_id);
            
            let adb_path = crate::utils::adb_utils::get_adb_path();
            
            // 使用 monkey 命令启动应用（简单可靠）
            let cmd = format!(
                "monkey -p {} -c android.intent.category.LAUNCHER 1",
                package_name
            );
            
            let mut command = std::process::Command::new(&adb_path);
            command.args(&["-s", device_id, "shell", &cmd]);
            
            #[cfg(windows)]
            {
                use std::os::windows::process::CommandExt;
                command.creation_flags(0x08000000); // CREATE_NO_WINDOW
            }
            
            match command.output() {
                Ok(output) => {
                    if output.status.success() {
                        ToolResult::success(format!("✅ 已启动应用: {}", package_name))
                    } else {
                        let stderr = String::from_utf8_lossy(&output.stderr);
                        ToolResult::error(format!("启动失败: {}", stderr))
                    }
                }
                Err(e) => ToolResult::error(format!("执行ADB失败: {}", e)),
            }
        }
        (Err(e), _) | (_, Err(e)) => ToolResult::error(e),
    }
}

/// 执行 ADB shell 命令
async fn handle_run_adb_command(params: Value, _ctx: &Arc<AppContext>) -> ToolResult {
    let device_id = params
        .get("device_id")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "缺少 device_id 参数".to_string());
    
    let shell_command = params
        .get("command")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "缺少 command 参数".to_string());

    match (device_id, shell_command) {
        (Ok(device_id), Ok(shell_command)) => {
            info!("🔧 执行 ADB 命令: {} on {}", shell_command, device_id);
            
            // 安全检查：禁止危险命令
            let dangerous_commands = ["rm -rf", "format", "factory_reset", "reboot"];
            for dangerous in dangerous_commands {
                if shell_command.contains(dangerous) {
                    return ToolResult::error(format!(
                        "安全限制：禁止执行危险命令 '{}'", dangerous
                    ));
                }
            }
            
            let adb_path = crate::utils::adb_utils::get_adb_path();
            
            let mut command = std::process::Command::new(&adb_path);
            command.args(&["-s", device_id, "shell", shell_command]);
            
            #[cfg(windows)]
            {
                use std::os::windows::process::CommandExt;
                command.creation_flags(0x08000000); // CREATE_NO_WINDOW
            }
            
            match command.output() {
                Ok(output) => {
                    let stdout = String::from_utf8_lossy(&output.stdout);
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    
                    if output.status.success() {
                        let result = if stdout.is_empty() { 
                            "命令执行成功（无输出）".to_string() 
                        } else { 
                            stdout.to_string() 
                        };
                        ToolResult::success(result)
                    } else {
                        ToolResult::error(format!("命令失败: {}", stderr))
                    }
                }
                Err(e) => ToolResult::error(format!("执行ADB失败: {}", e)),
            }
        }
        (Err(e), _) | (_, Err(e)) => ToolResult::error(e),
    }
}

// ============================================================================
// 直接设备控制工具处理函数
// ============================================================================

/// 点击屏幕坐标
async fn handle_tap(params: Value) -> ToolResult {
    let device_id = params.get("device_id")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "缺少 device_id".to_string());
    let x = params.get("x")
        .and_then(|v| v.as_i64())
        .ok_or_else(|| "缺少 x 坐标".to_string());
    let y = params.get("y")
        .and_then(|v| v.as_i64())
        .ok_or_else(|| "缺少 y 坐标".to_string());

    match (device_id, x, y) {
        (Ok(device_id), Ok(x), Ok(y)) => {
            info!("👆 点击坐标: ({}, {}) on {}", x, y, device_id);
            execute_adb_command(device_id, &format!("input tap {} {}", x, y)).await
        }
        (Err(e), _, _) | (_, Err(e), _) | (_, _, Err(e)) => ToolResult::error(e),
    }
}

/// 点击元素（通过文本匹配）
async fn handle_tap_element(params: Value) -> ToolResult {
    let device_id = params.get("device_id")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "缺少 device_id".to_string());
    let text = params.get("text")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "缺少 text".to_string());
    let match_type = params.get("match_type")
        .and_then(|v| v.as_str())
        .unwrap_or("contains");

    match (device_id, text) {
        (Ok(device_id), Ok(text)) => {
            info!("🔍 查找并点击元素: '{}' (match: {}) on {}", text, match_type, device_id);
            
            // 1. 获取屏幕 UI 结构
            let xml = match get_device_screen_xml(device_id).await {
                Ok(xml) => xml,
                Err(e) => return ToolResult::error(format!("获取屏幕失败: {}", e)),
            };
            
            // 2. 解析 XML 查找元素
            match find_element_by_text(&xml, text, match_type == "exact") {
                Some((center_x, center_y)) => {
                    info!("✅ 找到元素 '{}' 中心坐标: ({}, {})", text, center_x, center_y);
                    execute_adb_command(device_id, &format!("input tap {} {}", center_x, center_y)).await
                }
                None => ToolResult::error(format!(
                    "未找到包含 '{}' 的元素。请用 get_screen 查看可用元素", text
                )),
            }
        }
        (Err(e), _) | (_, Err(e)) => ToolResult::error(e),
    }
}

/// 滑动屏幕
async fn handle_swipe_screen(params: Value) -> ToolResult {
    let device_id = params.get("device_id")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "缺少 device_id".to_string());
    let direction = params.get("direction")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "缺少 direction".to_string());
    let distance = params.get("distance")
        .and_then(|v| v.as_str())
        .unwrap_or("medium");

    match (device_id, direction) {
        (Ok(device_id), Ok(direction)) => {
            info!("👆 滑动屏幕: {} ({}) on {}", direction, distance, device_id);
            
            // 基于屏幕中心计算滑动坐标（假设 1080x1920 屏幕）
            let (start_x, start_y, end_x, end_y) = calculate_swipe_coords(direction, distance);
            
            let cmd = format!("input swipe {} {} {} {} 300", start_x, start_y, end_x, end_y);
            execute_adb_command(device_id, &cmd).await
        }
        (Err(e), _) | (_, Err(e)) => ToolResult::error(e),
    }
}

/// 输入文本
async fn handle_input_text(params: Value) -> ToolResult {
    let device_id = params.get("device_id")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "缺少 device_id".to_string());
    let text = params.get("text")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "缺少 text".to_string());

    match (device_id, text) {
        (Ok(device_id), Ok(text)) => {
            info!("⌨️ 输入文本: '{}' on {}", text, device_id);
            // 转义特殊字符
            let escaped = text.replace(' ', "%s")
                              .replace('&', "\\&")
                              .replace('<', "\\<")
                              .replace('>', "\\>")
                              .replace('\'', "\\'")
                              .replace('"', "\\\"");
            execute_adb_command(device_id, &format!("input text '{}'", escaped)).await
        }
        (Err(e), _) | (_, Err(e)) => ToolResult::error(e),
    }
}

/// 按下按键
async fn handle_press_key(params: Value) -> ToolResult {
    let device_id = params.get("device_id")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "缺少 device_id".to_string());
    let key = params.get("key")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "缺少 key".to_string());

    match (device_id, key) {
        (Ok(device_id), Ok(key)) => {
            let keycode = match key {
                "back" => "KEYCODE_BACK",
                "home" => "KEYCODE_HOME",
                "menu" => "KEYCODE_MENU",
                "enter" => "KEYCODE_ENTER",
                "delete" => "KEYCODE_DEL",
                _ => return ToolResult::error(format!("不支持的按键: {}", key)),
            };
            info!("🔘 按键: {} on {}", keycode, device_id);
            execute_adb_command(device_id, &format!("input keyevent {}", keycode)).await
        }
        (Err(e), _) | (_, Err(e)) => ToolResult::error(e),
    }
}

/// 等待
async fn handle_wait(params: Value) -> ToolResult {
    let ms = params.get("milliseconds")
        .and_then(|v| v.as_u64())
        .unwrap_or(1000);

    info!("⏳ 等待 {}ms", ms);
    tokio::time::sleep(tokio::time::Duration::from_millis(ms)).await;
    ToolResult::success(format!("已等待 {}ms", ms))
}

// ============================================================================
// 辅助函数
// ============================================================================

/// 执行 ADB 命令
async fn execute_adb_command(device_id: &str, shell_command: &str) -> ToolResult {
    let adb_path = crate::utils::adb_utils::get_adb_path();
    
    let mut command = std::process::Command::new(&adb_path);
    command.args(&["-s", device_id, "shell", shell_command]);
    
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }
    
    match command.output() {
        Ok(output) => {
            if output.status.success() {
                ToolResult::success("✅ 操作成功")
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr);
                ToolResult::error(format!("操作失败: {}", stderr))
            }
        }
        Err(e) => ToolResult::error(format!("执行ADB失败: {}", e)),
    }
}

/// 获取设备屏幕 XML
async fn get_device_screen_xml(device_id: &str) -> Result<String, String> {
    let adb_path = crate::utils::adb_utils::get_adb_path();
    
    // 先 dump UI
    let mut dump_cmd = std::process::Command::new(&adb_path);
    dump_cmd.args(&["-s", device_id, "shell", "uiautomator dump /sdcard/window_dump.xml"]);
    
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        dump_cmd.creation_flags(0x08000000);
    }
    
    dump_cmd.output().map_err(|e| e.to_string())?;
    
    // 读取内容
    let mut cat_cmd = std::process::Command::new(&adb_path);
    cat_cmd.args(&["-s", device_id, "shell", "cat /sdcard/window_dump.xml"]);
    
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cat_cmd.creation_flags(0x08000000);
    }
    
    let output = cat_cmd.output().map_err(|e| e.to_string())?;
    
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err("无法读取屏幕 XML".to_string())
    }
}

/// 从 XML 中查找元素并返回中心坐标
fn find_element_by_text(xml: &str, text: &str, exact: bool) -> Option<(i32, i32)> {
    // 简单解析：查找包含指定 text 属性的节点，提取 bounds
    // bounds 格式: [left,top][right,bottom]
    
    for line in xml.lines() {
        let matches = if exact {
            line.contains(&format!("text=\"{}\"", text))
        } else {
            // 检查 text 属性是否包含目标文本
            if let Some(start) = line.find("text=\"") {
                let text_start = start + 6;
                if let Some(end) = line[text_start..].find('"') {
                    let text_value = &line[text_start..text_start + end];
                    text_value.contains(text)
                } else {
                    false
                }
            } else {
                false
            }
        };
        
        if matches {
            // 提取 bounds
            if let Some(bounds_start) = line.find("bounds=\"[") {
                let bounds_str = &line[bounds_start + 8..];
                if let Some(bounds_end) = bounds_str.find(']') {
                    // 解析 [left,top][right,bottom]
                    let coords = &bounds_str[1..];
                    if let Some(mid) = coords.find("][") {
                        let first = &coords[..mid];
                        let second = &coords[mid + 2..];
                        if let Some(second_end) = second.find(']') {
                            let second = &second[..second_end];
                            
                            let first_parts: Vec<&str> = first.split(',').collect();
                            let second_parts: Vec<&str> = second.split(',').collect();
                            
                            if first_parts.len() == 2 && second_parts.len() == 2 {
                                if let (Ok(left), Ok(top), Ok(right), Ok(bottom)) = (
                                    first_parts[0].parse::<i32>(),
                                    first_parts[1].parse::<i32>(),
                                    second_parts[0].parse::<i32>(),
                                    second_parts[1].parse::<i32>(),
                                ) {
                                    let center_x = (left + right) / 2;
                                    let center_y = (top + bottom) / 2;
                                    return Some((center_x, center_y));
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    None
}

/// 计算滑动坐标
fn calculate_swipe_coords(direction: &str, distance: &str) -> (i32, i32, i32, i32) {
    // 假设屏幕 1080x1920，从中心开始滑动
    let center_x = 540;
    let center_y = 960;
    
    let offset = match distance {
        "short" => 200,
        "long" => 600,
        _ => 400, // medium
    };
    
    match direction {
        "up" => (center_x, center_y + offset, center_x, center_y - offset),
        "down" => (center_x, center_y - offset, center_x, center_y + offset),
        "left" => (center_x + offset, center_y, center_x - offset, center_y),
        "right" => (center_x - offset, center_y, center_x + offset, center_y),
        _ => (center_x, center_y, center_x, center_y),
    }
}
