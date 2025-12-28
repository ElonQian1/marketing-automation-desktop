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
        // ====== AI Agent 智能查找和数据提取工具 ======
        McpTool::new(
            "find_elements",
            "在屏幕上查找所有匹配条件的元素。支持正则表达式匹配和数值条件过滤。用于 AI Agent 动态查找元素，如\"找到所有点赞超过1万的卡片\"",
            json!({
                "type": "object",
                "properties": {
                    "device_id": {
                        "type": "string",
                        "description": "设备ID"
                    },
                    "pattern": {
                        "type": "string",
                        "description": "正则表达式模式，如 '\\\\d+(\\\\.\\\\d+)?万赞' 匹配万赞元素，'\\\\d+赞' 匹配所有带赞的元素"
                    },
                    "search_in": {
                        "type": "string",
                        "enum": ["text", "content-desc", "both"],
                        "description": "搜索范围：text=文本属性，content-desc=描述属性，both=两者都搜索。默认both"
                    },
                    "min_value": {
                        "type": "number",
                        "description": "最小数值过滤（可选）。如设置为10000，则只返回数值>=10000的元素（用于\"点赞上万\"这类条件）"
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "最多返回几个结果。默认10"
                    }
                },
                "required": ["device_id", "pattern"]
            }),
        ),
        McpTool::new(
            "extract_comments",
            "从当前屏幕提取评论列表。返回结构化的评论数据（用户名、内容、点赞数、时间）",
            json!({
                "type": "object",
                "properties": {
                    "device_id": {
                        "type": "string",
                        "description": "设备ID"
                    },
                    "max_count": {
                        "type": "integer",
                        "description": "最多提取几条评论。默认5"
                    }
                },
                "required": ["device_id"]
            }),
        ),
        McpTool::new(
            "save_agent_script",
            "将 AI Agent 的操作流程保存为可重复执行的算法脚本。脚本使用通用条件而非固定值，其他 AI Agent 也能执行",
            json!({
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "脚本名称"
                    },
                    "description": {
                        "type": "string",
                        "description": "脚本描述，说明这个脚本做什么"
                    },
                    "goal": {
                        "type": "string",
                        "description": "任务目标的自然语言描述，如\"找到点赞上万的笔记并获取前5条评论\""
                    },
                    "steps": {
                        "type": "array",
                        "description": "步骤列表",
                        "items": {
                            "type": "object",
                            "properties": {
                                "name": { "type": "string", "description": "步骤名称" },
                                "action": { 
                                    "type": "string", 
                                    "enum": ["find_and_tap", "tap", "swipe", "wait", "extract_comments", "back"],
                                    "description": "动作类型"
                                },
                                "condition": {
                                    "type": "object",
                                    "description": "查找条件（用于 find_and_tap）",
                                    "properties": {
                                        "pattern": { "type": "string", "description": "正则表达式" },
                                        "min_value": { "type": "number", "description": "最小数值" }
                                    }
                                },
                                "params": {
                                    "type": "object",
                                    "description": "其他参数（坐标、方向、等待时间等）"
                                }
                            }
                        }
                    },
                    "output": {
                        "type": "object",
                        "description": "期望输出格式",
                        "properties": {
                            "type": { "type": "string", "enum": ["comments", "posts", "users", "custom"] },
                            "fields": { "type": "array", "items": { "type": "string" } }
                        }
                    }
                },
                "required": ["name", "goal", "steps"]
            }),
        ),
        // ====== AI 代理智能分析与脚本生成工具 ======
        McpTool::new(
            "analyze_screen",
            "AI 代理智能分析当前屏幕。不仅获取 UI 结构，还会自动识别页面类型、可交互元素、数据元素等，返回结构化的分析结论",
            json!({
                "type": "object",
                "properties": {
                    "device_id": {
                        "type": "string",
                        "description": "设备ID"
                    },
                    "focus": {
                        "type": "string",
                        "enum": ["all", "interactive", "data", "navigation"],
                        "description": "分析重点：all=全面分析，interactive=可点击元素，data=数据元素（点赞数、评论等），navigation=导航结构。默认all"
                    }
                },
                "required": ["device_id"]
            }),
        ),
        McpTool::new(
            "generate_script",
            "AI 代理根据任务目标自动生成脚本。会先分析当前屏幕状态，然后规划步骤并生成可执行脚本",
            json!({
                "type": "object",
                "properties": {
                    "device_id": {
                        "type": "string",
                        "description": "设备ID"
                    },
                    "goal": {
                        "type": "string",
                        "description": "任务目标的自然语言描述，如\"找到点赞上万的笔记，点击进去获取前5条评论\""
                    },
                    "app_context": {
                        "type": "string",
                        "enum": ["xiaohongshu", "weixin", "douyin", "weibo", "other"],
                        "description": "应用上下文，帮助 AI 理解界面结构。默认根据当前屏幕自动识别"
                    }
                },
                "required": ["device_id", "goal"]
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
        // AI 代理智能查找和数据提取工具
        "find_elements" => handle_find_elements(params).await,
        "extract_comments" => handle_extract_comments(params).await,
        "save_agent_script" => handle_save_agent_script(params, ctx).await,
        // AI 代理智能分析与脚本生成工具
        "analyze_screen" => handle_analyze_screen(params, ctx).await,
        "generate_script" => handle_generate_script(params, ctx).await,
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
/// 支持搜索 text 和 content-desc 两个属性
fn find_element_by_text(xml: &str, text: &str, exact: bool) -> Option<(i32, i32)> {
    // 解析：查找包含指定 text 或 content-desc 属性的节点，提取 bounds
    // bounds 格式: [left,top][right,bottom]
    
    for line in xml.lines() {
        // 检查 text 属性
        let text_matches = check_attribute_match(line, "text", text, exact);
        // 检查 content-desc 属性（小红书的点赞数等信息通常在这里）
        let desc_matches = check_attribute_match(line, "content-desc", text, exact);
        
        if text_matches || desc_matches {
            // 提取 bounds
            if let Some(coords) = extract_bounds(line) {
                return Some(coords);
            }
        }
    }
    
    None
}

/// 检查 XML 行中指定属性是否匹配文本
fn check_attribute_match(line: &str, attr_name: &str, text: &str, exact: bool) -> bool {
    let pattern = format!("{}=\"", attr_name);
    if let Some(start) = line.find(&pattern) {
        let attr_start = start + pattern.len();
        if let Some(end) = line[attr_start..].find('"') {
            let attr_value = &line[attr_start..attr_start + end];
            if exact {
                return attr_value == text;
            } else {
                return attr_value.contains(text);
            }
        }
    }
    false
}

/// 从 XML 行中提取 bounds 并计算中心坐标
fn extract_bounds(line: &str) -> Option<(i32, i32)> {
    if let Some(bounds_start) = line.find("bounds=\"[") {
        let bounds_str = &line[bounds_start + 8..];
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

// ============================================================================
// AI Agent 智能查找和数据提取工具
// ============================================================================

use regex::Regex;

/// 表示找到的元素
#[derive(serde::Serialize)]
struct FoundElement {
    text: String,
    content_desc: String,
    bounds: String,
    center_x: i32,
    center_y: i32,
    numeric_value: Option<f64>,
}

/// 表示提取的评论
#[derive(serde::Serialize)]
struct ExtractedComment {
    username: String,
    content: String,
    likes: String,
    time_location: String,
}

/// 查找所有匹配条件的元素
async fn handle_find_elements(params: Value) -> ToolResult {
    let device_id = match params.get("device_id").and_then(|v| v.as_str()) {
        Some(id) => id,
        None => return ToolResult::error("缺少 device_id"),
    };
    
    let pattern = match params.get("pattern").and_then(|v| v.as_str()) {
        Some(p) => p,
        None => return ToolResult::error("缺少 pattern"),
    };
    
    let search_in = params.get("search_in")
        .and_then(|v| v.as_str())
        .unwrap_or("both");
    
    let min_value = params.get("min_value")
        .and_then(|v| v.as_f64());
    
    let max_results = params.get("max_results")
        .and_then(|v| v.as_u64())
        .unwrap_or(10) as usize;

    info!("🔍 AI Agent 查找元素: pattern='{}', min_value={:?}", pattern, min_value);

    // 获取屏幕 XML
    let xml = match get_device_screen_xml(device_id).await {
        Ok(xml) => xml,
        Err(e) => return ToolResult::error(format!("获取屏幕失败: {}", e)),
    };

    // 编译正则表达式
    let regex = match Regex::new(pattern) {
        Ok(r) => r,
        Err(e) => return ToolResult::error(format!("无效的正则表达式: {}", e)),
    };

    let mut results: Vec<FoundElement> = Vec::new();

    // 按 <node 标签分割 XML（因为 uiautomator dump 输出是单行 XML）
    // 这样每个 node 都能独立处理
    let nodes: Vec<&str> = xml.split("<node ").collect();
    info!("🔍 XML 分割为 {} 个节点", nodes.len());

    for node_str in nodes.iter().skip(1) { // 跳过第一个（空或 header）
        // 重建完整的节点字符串以便提取属性
        let line = format!("<node {}", node_str);
        
        // 提取 text 和 content-desc 属性
        let text = extract_attribute(&line, "text").unwrap_or_default();
        let content_desc = extract_attribute(&line, "content-desc").unwrap_or_default();
        
        // 根据 search_in 参数决定搜索哪个字段
        let search_text = match search_in {
            "text" => text.clone(),
            "content-desc" => content_desc.clone(),
            _ => format!("{} {}", text, content_desc), // both
        };

        // 检查是否匹配正则
        if let Some(mat) = regex.find(&search_text) {
            let matched_str = mat.as_str();
            
            // 提取数值（如 "1.8万" -> 18000, "2475" -> 2475）
            let numeric_value = parse_chinese_number(matched_str);
            
            // 如果设置了 min_value，检查数值条件
            if let Some(min) = min_value {
                if let Some(val) = numeric_value {
                    if val < min {
                        continue; // 不满足最小值条件，跳过
                    }
                } else {
                    continue; // 无法解析数值，跳过
                }
            }
            
            // 提取坐标
            if let Some((cx, cy)) = extract_bounds(&line) {
                let bounds = extract_attribute(&line, "bounds").unwrap_or_default();
                
                results.push(FoundElement {
                    text,
                    content_desc,
                    bounds,
                    center_x: cx,
                    center_y: cy,
                    numeric_value,
                });
                
                if results.len() >= max_results {
                    break;
                }
            }
        }
    }

    if results.is_empty() {
        ToolResult::success_json(&json!({
            "found": false,
            "count": 0,
            "elements": [],
            "message": format!("未找到匹配 '{}' 的元素", pattern)
        }))
    } else {
        info!("✅ 找到 {} 个匹配元素", results.len());
        ToolResult::success_json(&json!({
            "found": true,
            "count": results.len(),
            "elements": results,
            "message": format!("找到 {} 个匹配元素", results.len())
        }))
    }
}

/// 从当前屏幕提取评论
async fn handle_extract_comments(params: Value) -> ToolResult {
    let device_id = match params.get("device_id").and_then(|v| v.as_str()) {
        Some(id) => id,
        None => return ToolResult::error("缺少 device_id"),
    };
    
    let max_count = params.get("max_count")
        .and_then(|v| v.as_u64())
        .unwrap_or(5) as usize;

    info!("📝 提取评论，最多 {} 条", max_count);

    // 获取屏幕 XML
    let xml = match get_device_screen_xml(device_id).await {
        Ok(xml) => xml,
        Err(e) => return ToolResult::error(format!("获取屏幕失败: {}", e)),
    };

    // 使用 catch_unwind 捕获任何 panic
    let comments = match std::panic::catch_unwind(|| {
        extract_comments_from_xml(&xml, max_count)
    }) {
        Ok(c) => c,
        Err(e) => {
            let msg = if let Some(s) = e.downcast_ref::<&str>() {
                s.to_string()
            } else if let Some(s) = e.downcast_ref::<String>() {
                s.clone()
            } else {
                "Unknown panic".to_string()
            };
            tracing::error!("📝 提取评论时发生 panic: {}", msg);
            return ToolResult::error(format!("提取评论时发生错误: {}", msg));
        }
    };
    
    info!("📝 返回 {} 条评论", comments.len());

    ToolResult::success_json(&json!({
        "success": true,
        "count": comments.len(),
        "comments": comments
    }))
}

/// 从 XML 提取评论（小红书评论格式）
fn extract_comments_from_xml(xml: &str, max_count: usize) -> Vec<ExtractedComment> {
    let mut comments = Vec::new();
    
    // 按 <node 分割 XML（因为是单行 XML）
    let nodes: Vec<&str> = xml.split("<node ").collect();
    tracing::info!("📝 extract_comments: 找到 {} 个 node 分段", nodes.len());
    
    // 小红书评论的模式：用户名 + 内容（包含时间地点和"回复"）
    // 格式如: "好 昨天 22:10 山西 回复" 或 "[赞R]  3小时前 山东 回复"
    let reply_pattern = Regex::new(r"(\d+分钟前|\d+小时前|昨天|前天|\d+天前)").ok();
    
    // 收集所有文本节点
    let mut text_nodes: Vec<(usize, String)> = Vec::new();
    for (i, node_str) in nodes.iter().enumerate() {
        let line = format!("<node {}", node_str);
        if let Some(text) = extract_attribute(&line, "text") {
            if !text.is_empty() {
                text_nodes.push((i, text));
            }
        }
    }
    
    tracing::info!("📝 extract_comments: 收集到 {} 个文本节点", text_nodes.len());
    
    // 遍历文本节点，查找包含时间和"回复"的行
    for (idx, (_node_idx, text)) in text_nodes.iter().enumerate() {
        if comments.len() >= max_count {
            break;
        }
        
        // 检查是否是评论行（包含时间词和"回复"）
        if let Some(ref pattern) = reply_pattern {
            if pattern.is_match(text) && text.contains("回复") {
                // 这是评论内容行，向前查找用户名
                let mut username = String::new();
                
                // 向前搜索用户名（在前几个文本节点中）
                for j in (0..idx).rev().take(5) {
                    let prev_text = &text_nodes[j].1;
                    
                    // 用户名通常是短文本，不包含时间词和特殊词
                    // 也排除纯数字（点赞数）
                    if prev_text.len() < 30 
                       && prev_text.len() > 0
                       && !prev_text.contains("分钟前")
                       && !prev_text.contains("小时前")
                       && !prev_text.contains("昨天")
                       && !prev_text.contains("回复")
                       && !prev_text.contains("展开")
                       && !prev_text.contains("条评论")
                       && !prev_text.starts_with('[')
                       && !prev_text.contains("关注")
                       && prev_text.parse::<i32>().is_err() {  // 排除纯数字
                        username = prev_text.clone();
                        break;
                    }
                }
                
                // 解析内容和时间
                let (content, time_location) = parse_comment_text(text);
                
                // 向后查找点赞数
                let mut likes = String::new();
                for j in idx+1..std::cmp::min(idx+5, text_nodes.len()) {
                    let next_text = &text_nodes[j].1;
                    if let Ok(_num) = next_text.parse::<i32>() {
                        likes = next_text.clone();
                        break;
                    }
                }
                
                // 过滤无意义的评论
                if !username.is_empty() && is_meaningful_comment(&content) {
                    tracing::info!("📝 ✅ 添加评论: {} -> {} (👍{})", username, content, likes);
                    comments.push(ExtractedComment {
                        username,
                        content,
                        likes,
                        time_location,
                    });
                } else if !username.is_empty() {
                    tracing::debug!("📝 ⏭️ 跳过无意义评论: {} -> '{}'", username, content);
                }
            }
        }
    }
    
    tracing::info!("📝 提取完成，共 {} 条评论", comments.len());
    comments
}

/// 判断评论内容是否有意义
fn is_meaningful_comment(content: &str) -> bool {
    let trimmed = content.trim();
    
    // 1. 空内容无意义
    if trimmed.is_empty() {
        tracing::debug!("📝 过滤: '{}' -> 空内容", content);
        return false;
    }
    
    // 2. 去除所有表情后检查是否还有内容
    let without_emoji = Regex::new(r"\[[^\]]*R?\]")
        .map(|re| re.replace_all(trimmed, "").to_string())
        .unwrap_or_else(|_| trimmed.to_string());
    
    let cleaned = without_emoji.trim();
    tracing::debug!("📝 过滤检查: '{}' -> 去除表情后: '{}'", trimmed, cleaned);
    
    // 3. 纯表情无意义
    if cleaned.is_empty() {
        tracing::debug!("📝 过滤: '{}' -> 纯表情", content);
        return false;
    }
    
    // 4. 过短无意义（去除表情后少于2个字符）
    let actual_chars: Vec<char> = cleaned.chars().collect();
    if actual_chars.len() < 2 {
        tracing::debug!("📝 过滤: '{}' -> 过短 ({}字符)", content, actual_chars.len());
        return false;
    }
    
    // 5. 纯数字无意义
    if trimmed.parse::<i64>().is_ok() {
        tracing::debug!("📝 过滤: '{}' -> 纯数字", content);
        return false;
    }
    
    // 6. 纯标点符号无意义
    let has_meaningful_char = actual_chars.iter().any(|c| {
        c.is_alphanumeric() || (*c >= '\u{4E00}' && *c <= '\u{9FFF}')  // 中文字符范围
    });
    if !has_meaningful_char {
        tracing::debug!("📝 过滤: '{}' -> 无有效字符", content);
        return false;
    }
    
    true
}

/// 解析评论文本，分离内容和时间地点
/// 输入格式: "评论内容 时间 地点 回复" 或 "[表情R] 时间 地点 回复"
fn parse_comment_text(text: &str) -> (String, String) {
    // 时间模式正则：匹配 "数字分钟前/小时前/天前" 或 "昨天/前天 时:分"
    let time_regex = Regex::new(
        r"(\d+分钟前|\d+小时前|\d+天前|昨天\s*\d{1,2}:\d{2}|前天\s*\d{1,2}:\d{2}|昨天|前天)"
    ).ok();
    
    if let Some(ref regex) = time_regex {
        if let Some(m) = regex.find(text) {
            // 时间之前的是内容
            let content = text[..m.start()].trim();
            // 时间及之后的是时间地点（去掉"回复"）
            let time_loc = text[m.start()..].trim()
                .trim_end_matches("回复")
                .trim();
            
            return (content.to_string(), time_loc.to_string());
        }
    }
    
    // 如果没有匹配到时间模式，返回原文
    (text.trim_end_matches("回复").trim().to_string(), String::new())
}

/// 保存 AI Agent 脚本
async fn handle_save_agent_script(params: Value, ctx: &Arc<AppContext>) -> ToolResult {
    let name = match params.get("name").and_then(|v| v.as_str()) {
        Some(n) => n.to_string(),
        None => return ToolResult::error("缺少 name"),
    };
    
    let goal = match params.get("goal").and_then(|v| v.as_str()) {
        Some(g) => g.to_string(),
        None => return ToolResult::error("缺少 goal"),
    };
    
    let description = params.get("description")
        .and_then(|v| v.as_str())
        .unwrap_or(&goal)
        .to_string();
    
    let steps = params.get("steps")
        .cloned()
        .unwrap_or(json!([]));
    
    let output = params.get("output")
        .cloned()
        .unwrap_or(json!({}));

    // 创建 AI Agent 脚本格式
    let agent_script = json!({
        "format": "ai_agent_script",
        "version": "1.0.0",
        "name": name,
        "description": description,
        "goal": goal,
        "steps": steps,
        "output": output,
        "created_at": chrono::Utc::now().to_rfc3339(),
        "metadata": {
            "type": "algorithm",
            "reusable": true,
            "requires_ai": true
        }
    });

    // 保存到文件
    let script_id = format!("agent_script_{}", chrono::Utc::now().timestamp_millis());
    let scripts_dir = std::path::Path::new("data/scripts");
    
    if !scripts_dir.exists() {
        std::fs::create_dir_all(scripts_dir).ok();
    }
    
    let file_path = scripts_dir.join(format!("{}.json", script_id));
    
    match std::fs::write(&file_path, serde_json::to_string_pretty(&agent_script).unwrap()) {
        Ok(_) => {
            info!("✅ AI Agent 脚本已保存: {}", script_id);
            ToolResult::success_json(&json!({
                "success": true,
                "script_id": script_id,
                "file_path": file_path.to_string_lossy(),
                "message": format!("AI Agent 脚本 '{}' 已保存", name)
            }))
        }
        Err(e) => ToolResult::error(format!("保存脚本失败: {}", e))
    }
}

/// 提取 XML 属性值
fn extract_attribute(line: &str, attr_name: &str) -> Option<String> {
    let pattern = format!("{}=\"", attr_name);
    if let Some(start) = line.find(&pattern) {
        let attr_start = start + pattern.len();
        if let Some(end) = line[attr_start..].find('"') {
            return Some(line[attr_start..attr_start + end].to_string());
        }
    }
    None
}

/// 解析中文数字（如 "1.8万" -> 18000, "2475" -> 2475）
fn parse_chinese_number(s: &str) -> Option<f64> {
    // 去除非数字字符（保留数字和小数点）
    let clean: String = s.chars()
        .filter(|c| c.is_ascii_digit() || *c == '.')
        .collect();
    
    if clean.is_empty() {
        return None;
    }
    
    let base_num: f64 = clean.parse().ok()?;
    
    // 检查单位
    if s.contains("万") {
        Some(base_num * 10000.0)
    } else if s.contains("千") {
        Some(base_num * 1000.0)
    } else if s.contains("亿") {
        Some(base_num * 100000000.0)
    } else {
        Some(base_num)
    }
}

// ============================================================================
// AI 代理智能分析与脚本生成工具
// ============================================================================

/// AI 代理智能分析屏幕
/// 返回结构化的分析结论，而非原始 XML
async fn handle_analyze_screen(params: Value, ctx: &Arc<AppContext>) -> ToolResult {
    let device_id = match params.get("device_id").and_then(|v| v.as_str()) {
        Some(id) => id.to_string(),
        None => return ToolResult::error("缺少 device_id"),
    };
    
    let focus = params.get("focus")
        .and_then(|v| v.as_str())
        .unwrap_or("all");

    info!("🔍 AI 代理分析屏幕 - 设备: {}, 重点: {}", device_id, focus);

    // 1. 获取屏幕 XML (通过 device_service)
    let xml = match ctx.device_service.get_screen_content(&device_id).await {
        Ok(xml) => xml,
        Err(e) => return ToolResult::error(format!("获取屏幕失败: {}", e)),
    };

    // 2. 解析 UI 树 (使用 XmlIndexer)
    let indexer = match crate::engine::xml_indexer::XmlIndexer::build_from_xml(&xml) {
        Ok(idx) => idx,
        Err(e) => return ToolResult::error(format!("解析 UI 树失败: {}", e)),
    };

    // 3. 智能分析
    let analysis = analyze_ui_tree(&indexer, &xml, focus);
    
    info!("✅ 屏幕分析完成: 页面类型={}, 发现{}个可交互元素, {}个数据元素", 
        analysis["page_type"].as_str().unwrap_or("unknown"),
        analysis["interactive_elements"].as_array().map(|a| a.len()).unwrap_or(0),
        analysis["data_elements"].as_array().map(|a| a.len()).unwrap_or(0)
    );

    ToolResult::success_json(&analysis)
}

/// 分析 UI 树，提取结构化信息
/// 使用 XmlIndexer 的 all_nodes 列表遍历
fn analyze_ui_tree(indexer: &crate::engine::xml_indexer::XmlIndexer, xml: &str, focus: &str) -> Value {
    let mut result = json!({
        "page_type": "unknown",
        "app_context": detect_app_context(xml),
        "interactive_elements": [],
        "data_elements": [],
        "navigation": {},
        "hot_content": [],
        "summary": ""
    });

    let mut interactive: Vec<Value> = vec![];
    let mut data_elements: Vec<Value> = vec![];
    let mut hot_content: Vec<Value> = vec![];
    let mut nav_elements: Vec<Value> = vec![];

    // 遍历所有节点
    for node in &indexer.all_nodes {
        // 分析当前节点
        let is_clickable = node.element.clickable;
        let text = &node.element.text;
        let desc = &node.element.content_desc;
        let resource_id = node.element.resource_id.as_deref().unwrap_or("");
        let class_name = node.element.class_name.as_deref().unwrap_or("");
        let display_text = if !text.is_empty() { text.as_str() } else { desc.as_str() };
        
        // 可交互元素
        if is_clickable && !display_text.is_empty() {
            interactive.push(json!({
                "type": "clickable",
                "text": display_text,
                "bounds": [node.bounds.0, node.bounds.1, node.bounds.2, node.bounds.3],
                "resource_id": resource_id,
                "class": class_name
            }));
        }

        // 数据元素（点赞数、评论数等）
        if let Some(num) = extract_engagement_number(display_text) {
            let element_type = classify_engagement_type(display_text, resource_id);
            data_elements.push(json!({
                "type": element_type,
                "raw_text": display_text,
                "value": num,
                "bounds": [node.bounds.0, node.bounds.1, node.bounds.2, node.bounds.3]
            }));

            // 高热度内容（点赞 > 10000）
            if element_type == "likes" && num >= 10000.0 {
                hot_content.push(json!({
                    "text": display_text,
                    "value": num,
                    "bounds": [node.bounds.0, node.bounds.1, node.bounds.2, node.bounds.3],
                    "clickable": is_clickable
                }));
            }
        }

        // 导航元素（底部 Tab、顶部标签等）
        let y = node.bounds.1;  // bounds.1 是顶部 y 坐标
        let class_lower = class_name.to_lowercase();
        if (y > 1800 || y < 200) && is_clickable && !display_text.is_empty() {
            if class_lower.contains("tab") || class_lower.contains("button") || 
               resource_id.contains("tab") || resource_id.contains("nav") {
                nav_elements.push(json!({
                    "text": display_text,
                    "bounds": [node.bounds.0, node.bounds.1, node.bounds.2, node.bounds.3],
                    "position": if y < 200 { "top" } else { "bottom" }
                }));
            }
        }
    }

    // 根据 focus 过滤结果
    match focus {
        "interactive" => {
            result["interactive_elements"] = json!(interactive);
        }
        "data" => {
            result["data_elements"] = json!(data_elements);
            result["hot_content"] = json!(hot_content);
        }
        "navigation" => {
            result["navigation"] = json!({
                "elements": nav_elements
            });
        }
        _ => {
            // all - 返回所有
            result["interactive_elements"] = json!(interactive);
            result["data_elements"] = json!(data_elements);
            result["hot_content"] = json!(hot_content);
            result["navigation"] = json!({
                "elements": nav_elements
            });
        }
    }

    // 推断页面类型
    result["page_type"] = json!(infer_page_type(&interactive, &data_elements, &nav_elements));
    
    // 生成摘要
    let hot_count = hot_content.len();
    let interactive_count = interactive.len();
    result["summary"] = json!(format!(
        "发现 {} 个可交互元素，{} 个数据元素，其中 {} 个高热度内容（点赞过万）",
        interactive_count,
        data_elements.len(),
        hot_count
    ));

    result
}

/// 检测应用上下文
fn detect_app_context(xml: &str) -> &'static str {
    if xml.contains("com.xingin.xhs") {
        "xiaohongshu"
    } else if xml.contains("com.tencent.mm") {
        "weixin"
    } else if xml.contains("com.ss.android.ugc.aweme") {
        "douyin"
    } else if xml.contains("com.sina.weibo") {
        "weibo"
    } else {
        "other"
    }
}

/// 提取互动数据（点赞数、评论数等）
fn extract_engagement_number(text: &str) -> Option<f64> {
    // 匹配：1.8万、2475、10w+、1000+ 等
    let patterns = [
        r"(\d+\.?\d*)\s*[万w]",  // 万/w
        r"(\d+\.?\d*)\s*[千k]",  // 千/k
        r"^(\d+)\+?$",           // 纯数字
        r"(\d+)\s*(?:赞|评|藏|转)",  // 点赞/评论/收藏/转发
    ];
    
    for pattern in patterns {
        if let Ok(re) = Regex::new(pattern) {
            if let Some(caps) = re.captures(text) {
                if let Some(m) = caps.get(1) {
                    let num: f64 = m.as_str().parse().ok()?;
                    if text.contains("万") || text.to_lowercase().contains("w") {
                        return Some(num * 10000.0);
                    } else if text.contains("千") || text.to_lowercase().contains("k") {
                        return Some(num * 1000.0);
                    } else {
                        return Some(num);
                    }
                }
            }
        }
    }
    None
}

/// 分类互动数据类型
fn classify_engagement_type(text: &str, resource_id: &str) -> &'static str {
    let combined = format!("{} {}", text.to_lowercase(), resource_id.to_lowercase());
    if combined.contains("like") || combined.contains("赞") || combined.contains("❤") {
        "likes"
    } else if combined.contains("comment") || combined.contains("评论") {
        "comments"
    } else if combined.contains("collect") || combined.contains("收藏") || combined.contains("⭐") {
        "favorites"
    } else if combined.contains("share") || combined.contains("转发") || combined.contains("分享") {
        "shares"
    } else {
        "unknown"
    }
}

/// 推断页面类型
fn infer_page_type(interactive: &[Value], data_elements: &[Value], nav_elements: &[Value]) -> &'static str {
    // 简单启发式规则
    let has_bottom_nav = nav_elements.iter().any(|e| e["position"] == "bottom");
    let has_many_data = data_elements.len() > 5;
    let has_engagement = data_elements.iter().any(|e| 
        e["type"] == "likes" || e["type"] == "comments"
    );
    
    if has_bottom_nav && has_many_data {
        "feed_list"  // 信息流/首页
    } else if has_engagement && !has_bottom_nav {
        "detail_page"  // 详情页
    } else if nav_elements.len() > 3 {
        "navigation_page"
    } else {
        "unknown"
    }
}

/// AI 代理根据目标生成脚本
async fn handle_generate_script(params: Value, ctx: &Arc<AppContext>) -> ToolResult {
    let device_id = match params.get("device_id").and_then(|v| v.as_str()) {
        Some(id) => id.to_string(),
        None => return ToolResult::error("缺少 device_id"),
    };
    
    let goal = match params.get("goal").and_then(|v| v.as_str()) {
        Some(g) => g.to_string(),
        None => return ToolResult::error("缺少 goal"),
    };
    
    let _app_context = params.get("app_context")
        .and_then(|v| v.as_str())
        .unwrap_or("auto");

    info!("🤖 AI 代理生成脚本 - 目标: {}", goal);

    // 1. 先分析当前屏幕状态 (通过 device_service)
    let analysis = match ctx.device_service.get_screen_content(&device_id).await {
        Ok(xml) => {
            match crate::engine::xml_indexer::XmlIndexer::build_from_xml(&xml) {
                Ok(indexer) => analyze_ui_tree(&indexer, &xml, "all"),
                Err(_) => json!({"error": "无法解析屏幕"})
            }
        }
        Err(e) => {
            return ToolResult::error(format!("获取屏幕失败: {}", e));
        }
    };

    let app_context = analysis["app_context"].as_str().unwrap_or("unknown");
    let page_type = analysis["page_type"].as_str().unwrap_or("unknown");
    let hot_content = analysis["hot_content"].as_array();

    // 2. 根据目标和上下文生成脚本
    let script = generate_script_for_goal(&goal, app_context, page_type, hot_content, &device_id);

    info!("✅ 脚本生成完成: {} 步", script["steps"].as_array().map(|a| a.len()).unwrap_or(0));

    ToolResult::success_json(&json!({
        "script": script,
        "analysis": analysis,
        "generation_context": {
            "goal": goal,
            "app_context": app_context,
            "page_type": page_type,
            "hot_content_found": hot_content.map(|a| a.len()).unwrap_or(0)
        }
    }))
}

/// 根据目标生成脚本
fn generate_script_for_goal(
    goal: &str,
    app_context: &str,
    page_type: &str,
    hot_content: Option<&Vec<Value>>,
    _device_id: &str
) -> Value {
    let goal_lower = goal.to_lowercase();
    
    // 解析目标中的关键词
    let wants_hot_content = goal_lower.contains("热") || goal_lower.contains("万") || 
                           goal_lower.contains("高赞") || goal_lower.contains("点赞");
    let wants_comments = goal_lower.contains("评论");
    let wants_xiaohongshu = goal_lower.contains("小红书") || app_context == "xiaohongshu";
    
    // 解析数量
    let comment_count = extract_number_from_goal(&goal_lower, "评论").unwrap_or(5.0) as i32;
    let like_threshold = extract_number_from_goal(&goal_lower, "万").map(|n| n * 10000.0).unwrap_or(10000.0);

    let mut steps = vec![];
    let mut step_id = 1;

    // 步骤 1：启动应用（如果需要）
    if wants_xiaohongshu && page_type != "feed_list" {
        steps.push(json!({
            "step_id": step_id,
            "action": "launch_app",
            "params": {
                "package": "com.xingin.xhs",
                "activity": "com.xingin.xhs.index.v2.IndexActivityV2"
            },
            "description": "启动小红书"
        }));
        step_id += 1;
    }

    // 步骤 2：查找高热度内容（如果需要）
    if wants_hot_content {
        // 检查是否已有热门内容
        if let Some(hot) = hot_content {
            if !hot.is_empty() {
                // 直接使用已发现的热门内容
                let first_hot = &hot[0];
                let bounds = first_hot["bounds"].as_array();
                if let Some(b) = bounds {
                    let center_x = (b[0].as_i64().unwrap_or(0) + b[2].as_i64().unwrap_or(0)) / 2;
                    let center_y = (b[1].as_i64().unwrap_or(0) + b[3].as_i64().unwrap_or(0)) / 2;
                    
                    steps.push(json!({
                        "step_id": step_id,
                        "action": "tap",
                        "params": {
                            "x": center_x,
                            "y": center_y
                        },
                        "description": format!("点击高热度内容 ({}赞)", first_hot["value"].as_f64().unwrap_or(0.0))
                    }));
                    step_id += 1;
                }
            } else {
                // 需要查找
                steps.push(json!({
                    "step_id": step_id,
                    "action": "find_elements",
                    "params": {
                        "selector": {
                            "type": "engagement",
                            "min_value": like_threshold,
                            "metric": "likes"
                        },
                        "limit": 1
                    },
                    "output_key": "hot_notes",
                    "description": format!("查找点赞超过{}的笔记", like_threshold)
                }));
                step_id += 1;

                steps.push(json!({
                    "step_id": step_id,
                    "action": "tap_relative",
                    "params": {
                        "relative_to": "hot_notes[0]",
                        "position": "center"
                    },
                    "description": "点击找到的高热度笔记"
                }));
                step_id += 1;
            }
        }
    }

    // 步骤 3：等待页面加载
    steps.push(json!({
        "step_id": step_id,
        "action": "wait",
        "params": {
            "duration_ms": 2000
        },
        "description": "等待详情页加载"
    }));
    step_id += 1;

    // 步骤 4：提取评论（如果需要）
    if wants_comments {
        steps.push(json!({
            "step_id": step_id,
            "action": "extract_comments",
            "params": {
                "count": comment_count,
                "scroll_if_needed": true,
                "filter": {
                    "min_length": 5,
                    "exclude_author": true
                }
            },
            "output_key": "extracted_comments",
            "description": format!("提取前{}条有意义评论", comment_count)
        }));
    }

    json!({
        "format": "ai_agent_script",
        "version": "1.0.0",
        "name": format!("auto_generated_{}", chrono::Utc::now().timestamp()),
        "description": format!("AI 自动生成的脚本，目标：{}", goal),
        "goal": goal,
        "steps": steps,
        "output": {
            "primary_key": if wants_comments { "extracted_comments" } else { "hot_notes" }
        },
        "metadata": {
            "generated_by": "ai_agent",
            "app_context": app_context,
            "page_context": page_type
        }
    })
}

/// 从目标描述中提取数字
fn extract_number_from_goal(goal: &str, context: &str) -> Option<f64> {
    // 查找 context 附近的数字
    if let Some(idx) = goal.find(context) {
        // 向前查找数字
        let before = &goal[..idx];
        let re = Regex::new(r"(\d+)").ok()?;
        if let Some(caps) = re.captures_iter(before).last() {
            return caps.get(1)?.as_str().parse().ok();
        }
    }
    None
}