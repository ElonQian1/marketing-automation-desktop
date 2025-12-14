// src-tauri/src/modules/agent_runtime/mod.rs
// module: agent_runtime | layer: tauri-plugin | role: Agent 运行时插件
// summary: 暴露 Agent 自主运行控制命令给前端

use crate::core::application::{
    AgentRuntime, AgentCommand, AgentEvent,
    SharedAgentRuntime, create_shared_runtime,
};
use crate::core::domain::agent_runtime::{
    AgentConfig, AgentMode, AgentRunState, AgentStateSnapshot,
};
use crate::modules::agent::AgentState;
use tauri::{
    plugin::{Builder, TauriPlugin},
    AppHandle, Manager, Runtime, State,
};
use tokio::sync::{mpsc, watch, RwLock};
use std::sync::Arc;
use tracing::{info, warn, error};
use serde::{Deserialize, Serialize};

/// AI 聊天接口（用于跨模块调用）
type AiChatFn = Arc<dyn Fn(String) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<String, String>> + Send>> + Send + Sync>;

/// 插件状态
pub struct AgentRuntimeState {
    /// 共享运行时
    runtime: SharedAgentRuntime,
    /// 停止信号发送器
    stop_tx: watch::Sender<bool>,
    /// 循环是否正在运行
    loop_running: Arc<RwLock<bool>>,
    /// 事件日志（供前端轮询）
    event_log: Arc<RwLock<Vec<AgentEvent>>>,
    /// AI 聊天函数（延迟初始化）
    ai_chat_fn: Arc<RwLock<Option<AiChatFn>>>,
}

impl AgentRuntimeState {
    fn new() -> Self {
        let (stop_tx, _) = watch::channel(false);
        Self {
            runtime: create_shared_runtime(AgentConfig::default(), AgentMode::SemiAutonomous),
            stop_tx,
            loop_running: Arc::new(RwLock::new(false)),
            event_log: Arc::new(RwLock::new(Vec::new())),
            ai_chat_fn: Arc::new(RwLock::new(None)),
        }
    }
}

/// 启动参数
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StartAgentParams {
    /// 目标描述
    pub goal: String,
    /// 设备 ID
    pub device_id: String,
    /// 运行模式（可选）: "autonomous", "semi", "supervised"
    pub mode: Option<String>,
}

/// 状态响应
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentStatusResponse {
    pub success: bool,
    pub state: String,
    pub snapshot: Option<AgentStateSnapshot>,
    pub is_running: bool,
    pub error: Option<String>,
}

/// 通用响应
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentResponse {
    pub success: bool,
    pub message: String,
    pub error: Option<String>,
}

/// 事件响应
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentEventsResponse {
    pub success: bool,
    pub events: Vec<AgentEvent>,
}

// ========== Tauri 命令 ==========

/// 启动 Agent 执行目标
#[tauri::command]
async fn start<R: Runtime>(
    app: AppHandle<R>,
    params: StartAgentParams,
    state: State<'_, AgentRuntimeState>,
) -> Result<AgentResponse, String> {
    info!("🚀 启动 Agent: goal={}, device={}", params.goal, params.device_id);

    // 检查 AI Agent 是否已配置
    let agent_state: tauri::State<'_, AgentState> = app.try_state::<AgentState>()
        .ok_or("AI Agent 未初始化，请先配置 API Key")?;
    
    // 检查 AI 是否真正配置好了
    if !agent_state.is_configured().await {
        return Err("AI Agent 未配置，请先配置 API Key".to_string());
    }

    // 重置停止信号
    let _ = state.stop_tx.send(false);

    // 发送启动命令
    {
        let mut runtime = state.runtime.write().await;
        runtime.handle_command(AgentCommand::Start {
            goal: params.goal.clone(),
            device_id: params.device_id.clone(),
        }).map_err(|e| e.to_string())?;
    }

    // 清空事件日志
    {
        let mut log = state.event_log.write().await;
        log.clear();
    }

    // 检查是否需要启动循环
    let already_running = *state.loop_running.read().await;
    if !already_running {
        // 启动 Agent 循环（在后台任务中）
        let runtime = state.runtime.clone();
        let stop_rx = state.stop_tx.subscribe();
        let loop_running = state.loop_running.clone();
        let event_log = state.event_log.clone();
        let goal = params.goal.clone();
        let device_id = params.device_id.clone();
        
        // 创建 AI 调用闭包（通过 AppHandle 在 spawn 中获取 AgentState）
        let app_handle = app.app_handle().clone();

        tokio::spawn(async move {
            *loop_running.write().await = true;
            info!("🔄 Agent 循环启动");

            // 运行 Agent 循环（集成真正的 AI）
            run_agent_loop(runtime, stop_rx, event_log, app_handle, goal, device_id).await;

            *loop_running.write().await = false;
            info!("🛑 Agent 循环结束");
        });
    }

    Ok(AgentResponse {
        success: true,
        message: format!("Agent 已启动，目标: {}", params.goal),
        error: None,
    })
}

/// 暂停 Agent
#[tauri::command]
async fn pause(state: State<'_, AgentRuntimeState>) -> Result<AgentResponse, String> {
    info!("⏸️ 暂停 Agent");
    let mut runtime = state.runtime.write().await;
    runtime.handle_command(AgentCommand::Pause)
        .map_err(|e| e.to_string())?;

    Ok(AgentResponse {
        success: true,
        message: "Agent 已暂停".to_string(),
        error: None,
    })
}

/// 恢复 Agent
#[tauri::command]
async fn resume(state: State<'_, AgentRuntimeState>) -> Result<AgentResponse, String> {
    info!("▶️ 恢复 Agent");
    let mut runtime = state.runtime.write().await;
    runtime.handle_command(AgentCommand::Resume)
        .map_err(|e| e.to_string())?;

    Ok(AgentResponse {
        success: true,
        message: "Agent 已恢复".to_string(),
        error: None,
    })
}

/// 停止 Agent
#[tauri::command]
async fn stop(state: State<'_, AgentRuntimeState>) -> Result<AgentResponse, String> {
    info!("🛑 停止 Agent");
    
    // 发送停止信号
    let _ = state.stop_tx.send(true);
    
    // 发送停止命令
    let mut runtime = state.runtime.write().await;
    let _ = runtime.handle_command(AgentCommand::Stop);

    Ok(AgentResponse {
        success: true,
        message: "Agent 已停止".to_string(),
        error: None,
    })
}

/// 批准待定行动
#[tauri::command]
async fn approve(state: State<'_, AgentRuntimeState>) -> Result<AgentResponse, String> {
    info!("✅ 批准行动");
    let mut runtime = state.runtime.write().await;
    runtime.handle_command(AgentCommand::Approve)
        .map_err(|e| e.to_string())?;

    Ok(AgentResponse {
        success: true,
        message: "行动已批准".to_string(),
        error: None,
    })
}

/// 拒绝待定行动
#[tauri::command]
async fn reject(state: State<'_, AgentRuntimeState>) -> Result<AgentResponse, String> {
    info!("❌ 拒绝行动");
    let mut runtime = state.runtime.write().await;
    runtime.handle_command(AgentCommand::Reject)
        .map_err(|e| e.to_string())?;

    Ok(AgentResponse {
        success: true,
        message: "行动已拒绝，Agent 将重新思考".to_string(),
        error: None,
    })
}

/// 获取 Agent 状态
#[tauri::command]
async fn status(state: State<'_, AgentRuntimeState>) -> Result<AgentStatusResponse, String> {
    let runtime = state.runtime.read().await;
    let snapshot = runtime.snapshot();
    let state_str = format!("{:?}", snapshot.run_state);
    let is_running = *state.loop_running.read().await;

    Ok(AgentStatusResponse {
        success: true,
        state: state_str,
        snapshot: Some(snapshot),
        is_running,
        error: None,
    })
}

/// 获取最新事件（轮询模式）
#[tauri::command]
async fn get_events(state: State<'_, AgentRuntimeState>) -> Result<AgentEventsResponse, String> {
    let mut log = state.event_log.write().await;
    let events = std::mem::take(&mut *log);

    Ok(AgentEventsResponse {
        success: true,
        events,
    })
}

// ========== Agent 循环实现 ==========

/// Agent 自主循环（集成真正的 AI 调用）
async fn run_agent_loop<R: Runtime>(
    runtime: SharedAgentRuntime,
    mut stop_rx: watch::Receiver<bool>,
    event_log: Arc<RwLock<Vec<AgentEvent>>>,
    app_handle: AppHandle<R>,
    goal: String,
    device_id: String,
) {
    use tokio::time::Duration;

    async fn add_event(log: &Arc<RwLock<Vec<AgentEvent>>>, event: AgentEvent) {
        let mut l = log.write().await;
        // 限制日志大小
        if l.len() > 100 {
            l.drain(0..50);
        }
        l.push(event);
    }

    // 构建系统提示词
    let system_prompt = format!(
        r#"你是一个自主执行任务的 AI Agent。你的当前目标是：{goal}
设备 ID：{device_id}

## 📱 Android 设备控制工具
- tap: 点击坐标 {{"x": 540, "y": 960}}
- tap_element: 点击元素 {{"text": "微信"}}
- swipe: 滑动屏幕 {{"direction": "up|down|left|right", "distance": "short|medium|long"}}
- input_text: 输入文字 {{"text": "你好"}}
- press_key: 按键 {{"key": "back|home|enter|delete"}}
- launch_app: 打开应用 {{"package_name": "com.tencent.mm"}}
- get_screen: 获取屏幕 UI 结构

## 💻 PC 命令行工具（谨慎使用）
- run_command: 执行命令 {{"command": "dir"}} 
- read_file: 读取文件 {{"path": "C:\\test.txt"}}
- list_dir: 列出目录 {{"path": "."}}

## ⏱️ 其他
- wait: 等待 {{"milliseconds": 1000}}

请分析当前情况，决定下一步行动。以 JSON 格式回复：
{{
    "thought": "你的思考过程",
    "action": "工具名称",
    "params": {{ 工具参数 }},
    "is_complete": false
}}

目标完成时设置 "is_complete": true 并省略 action/params。"#,
        goal = goal,
        device_id = device_id
    );

    // 记录历史对话用于上下文
    let mut conversation_history: Vec<String> = vec![system_prompt.clone()];

    loop {
        // 检查停止信号
        if *stop_rx.borrow() {
            break;
        }

        // 获取当前状态
        let state = {
            let rt = runtime.read().await;
            rt.current_state()
        };

        match state {
            AgentRunState::Idle | AgentRunState::Stopped => {
                break;
            }
            AgentRunState::Paused | AgentRunState::WaitingForApproval => {
                tokio::time::sleep(Duration::from_millis(100)).await;
            }
            AgentRunState::Thinking => {
                // ========== 思考阶段：调用真正的 AI ==========
                add_event(&event_log, AgentEvent::AiThinking {
                    thought: "正在调用 AI 分析情况...".to_string(),
                }).await;

                // 获取 AgentState 并调用 AI
                let ai_response = if let Some(agent_state) = app_handle.try_state::<AgentState>() {
                    // 构建上下文消息
                    let context_message = conversation_history.join("\n---\n");
                    
                    match agent_state.chat_with_ai(&context_message).await {
                        Ok(response) => {
                            info!("🧠 AI 响应: {}", &response[..response.len().min(200)]);
                            Some(response)
                        }
                        Err(e) => {
                            error!("❌ AI 调用失败: {}", e);
                            add_event(&event_log, AgentEvent::Error {
                                message: format!("AI 调用失败: {}", e),
                            }).await;
                            None
                        }
                    }
                } else {
                    error!("❌ AgentState 不可用");
                    None
                };

                // 解析 AI 响应
                if let Some(response) = ai_response {
                    // 将响应添加到历史
                    conversation_history.push(format!("AI: {}", response));

                    // 尝试解析 JSON 响应
                    if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(&response) {
                        let thought = parsed.get("thought")
                            .and_then(|v| v.as_str())
                            .unwrap_or("思考中...");
                        
                        let is_complete = parsed.get("is_complete")
                            .and_then(|v| v.as_bool())
                            .unwrap_or(false);

                        add_event(&event_log, AgentEvent::AiThinking {
                            thought: thought.to_string(),
                        }).await;

                        if is_complete {
                            // 目标完成
                            let mut rt = runtime.write().await;
                            rt.complete_current_goal();
                            add_event(&event_log, AgentEvent::GoalCompleted {
                                goal_id: "current".to_string(),
                            }).await;
                            break;
                        }

                        // 有行动需要执行
                        if let Some(action) = parsed.get("action").and_then(|v| v.as_str()) {
                            // 保存待执行的动作到 runtime
                            let params = parsed.get("params").cloned().unwrap_or(serde_json::Value::Null);
                            {
                                let mut rt = runtime.write().await;
                                rt.set_pending_action(action.to_string(), params.to_string());
                                let _ = rt.transition_action_decided();
                            }
                            add_event(&event_log, AgentEvent::StateChanged {
                                state: AgentRunState::Executing,
                            }).await;
                        } else {
                            // 没有行动，继续思考
                            tokio::time::sleep(Duration::from_secs(1)).await;
                        }
                    } else {
                        // JSON 解析失败，记录错误并重试
                        warn!("⚠️ AI 响应非 JSON 格式: {}", &response[..response.len().min(100)]);
                        conversation_history.push("System: 请用 JSON 格式回复。".to_string());
                        tokio::time::sleep(Duration::from_secs(1)).await;
                    }
                } else {
                    // AI 调用失败，进入恢复模式
                    let mut rt = runtime.write().await;
                    let _ = rt.transition_action_failed();
                }
            }
            AgentRunState::Executing => {
                // ========== 执行阶段：调用 MCP 工具 ==========
                let (action, params_str) = {
                    let rt = runtime.read().await;
                    rt.get_pending_action()
                };

                if let Some(action_name) = action {
                    add_event(&event_log, AgentEvent::ActionExecuted {
                        action: action_name.clone(),
                        result: "执行中...".to_string(),
                        success: true,
                    }).await;

                    // 解析参数 JSON
                    let params: serde_json::Value = params_str
                        .as_deref()
                        .and_then(|s| serde_json::from_str(s).ok())
                        .unwrap_or(serde_json::json!({}));

                    // 调用实际的工具执行器
                    info!("🎯 执行动作: {} params={}", action_name, params);
                    let result = execute_agent_tool(&action_name, &params, &device_id).await;

                    // 记录结果到对话历史
                    let result_text = if result.success {
                        format!("动作 {} 执行成功: {}", action_name, result.message)
                    } else {
                        format!("动作 {} 执行失败: {}", action_name, result.message)
                    };
                    conversation_history.push(format!("System: {}", result_text));

                    {
                        let mut rt = runtime.write().await;
                        rt.record_action_result(&action_name, &result_text, result.success);
                        let _ = rt.transition_action_completed();
                    }

                    add_event(&event_log, AgentEvent::ActionExecuted {
                        action: action_name,
                        result: result.message,
                        success: result.success,
                    }).await;

                    add_event(&event_log, AgentEvent::StateChanged {
                        state: AgentRunState::Observing,
                    }).await;
                } else {
                    // 没有待执行动作，返回思考
                    let mut rt = runtime.write().await;
                    let _ = rt.transition_start_thinking();
                }
            }
            AgentRunState::Observing => {
                // ========== 观察阶段：获取屏幕状态并反馈给 AI ==========
                tokio::time::sleep(Duration::from_millis(300)).await;

                // 获取当前屏幕状态
                let adb_path = crate::utils::adb_utils::get_adb_path();
                let screen_info = match get_screen_xml(&adb_path, &device_id).await {
                    Ok(xml) => {
                        // 提取关键 UI 元素信息（避免发送完整 XML 给 AI）
                        let summary = extract_screen_summary(&xml);
                        format!("当前屏幕状态：\n{}", summary)
                    }
                    Err(e) => {
                        format!("无法获取屏幕状态: {}", e)
                    }
                };

                // 添加屏幕状态到对话历史
                conversation_history.push(format!("System: {}", screen_info));

                let progress = {
                    let rt = runtime.read().await;
                    rt.snapshot().current_goal_progress
                };

                // 更新进度并继续思考
                {
                    let mut rt = runtime.write().await;
                    rt.update_goal_progress((progress + 5).min(95));
                    let _ = rt.transition_start_thinking();
                }

                add_event(&event_log, AgentEvent::GoalProgress {
                    goal_id: "current".to_string(),
                    progress: (progress + 5).min(95),
                    description: screen_info[..screen_info.len().min(100)].to_string(),
                }).await;

                add_event(&event_log, AgentEvent::StateChanged {
                    state: AgentRunState::Thinking,
                }).await;
            }
            AgentRunState::Recovering => {
                // 恢复阶段
                tokio::time::sleep(Duration::from_millis(500)).await;
                
                let mut rt = runtime.write().await;
                let _ = rt.transition_recovery_success();

                add_event(&event_log, AgentEvent::StateChanged {
                    state: AgentRunState::Thinking,
                }).await;
            }
        }

        // 循环间隔
        tokio::time::sleep(Duration::from_millis(50)).await;
    }
}

// ========== 工具执行器 ==========

/// Agent 工具执行结果
struct ToolExecutionResult {
    success: bool,
    message: String,
}

/// 执行 Agent 工具调用
async fn execute_agent_tool(
    action: &str,
    params: &serde_json::Value,
    device_id: &str,
) -> ToolExecutionResult {
    use std::process::Command;
    
    let adb_path = crate::utils::adb_utils::get_adb_path();
    
    info!("🔧 执行工具: {} params={:?} device={}", action, params, device_id);
    
    match action {
        "direct_tap" | "tap" => {
            let x = params.get("x").and_then(|v| v.as_i64()).unwrap_or(0) as i32;
            let y = params.get("y").and_then(|v| v.as_i64()).unwrap_or(0) as i32;
            execute_shell_command(&adb_path, device_id, &format!("input tap {} {}", x, y)).await
        }
        "direct_tap_element" | "tap_element" => {
            let text = params.get("text").and_then(|v| v.as_str()).unwrap_or("");
            // 先获取屏幕 XML，查找元素位置
            match get_screen_xml(&adb_path, device_id).await {
                Ok(xml) => {
                    if let Some((x, y)) = find_element_center(&xml, text) {
                        execute_shell_command(&adb_path, device_id, &format!("input tap {} {}", x, y)).await
                    } else {
                        ToolExecutionResult {
                            success: false,
                            message: format!("未找到包含 '{}' 的元素", text),
                        }
                    }
                }
                Err(e) => ToolExecutionResult {
                    success: false,
                    message: format!("获取屏幕失败: {}", e),
                },
            }
        }
        "direct_swipe" | "swipe" | "swipe_screen" => {
            let direction = params.get("direction").and_then(|v| v.as_str()).unwrap_or("up");
            let distance = params.get("distance").and_then(|v| v.as_str()).unwrap_or("medium");
            let (x1, y1, x2, y2) = calculate_swipe_coords(direction, distance);
            execute_shell_command(&adb_path, device_id, &format!("input swipe {} {} {} {} 300", x1, y1, x2, y2)).await
        }
        "direct_input_text" | "input_text" => {
            let text = params.get("text").and_then(|v| v.as_str()).unwrap_or("");
            // 转义特殊字符
            let escaped = text.replace(' ', "%s")
                .replace('&', "\\&")
                .replace('<', "\\<")
                .replace('>', "\\>")
                .replace('\'', "\\'")
                .replace('"', "\\\"");
            execute_shell_command(&adb_path, device_id, &format!("input text '{}'", escaped)).await
        }
        "direct_press_key" | "press_key" => {
            let key = params.get("key").and_then(|v| v.as_str()).unwrap_or("back");
            let keycode = match key {
                "back" => "KEYCODE_BACK",
                "home" => "KEYCODE_HOME",
                "menu" => "KEYCODE_MENU",
                "enter" => "KEYCODE_ENTER",
                "delete" => "KEYCODE_DEL",
                _ => "KEYCODE_BACK",
            };
            execute_shell_command(&adb_path, device_id, &format!("input keyevent {}", keycode)).await
        }
        "direct_open_app" | "launch_app" => {
            let package = params.get("package_name")
                .or_else(|| params.get("package"))
                .and_then(|v| v.as_str())
                .unwrap_or("");
            execute_shell_command(&adb_path, device_id, &format!("monkey -p {} -c android.intent.category.LAUNCHER 1", package)).await
        }
        "direct_screenshot" | "get_screen" | "adb_get_screen_xml" => {
            match get_screen_xml(&adb_path, device_id).await {
                Ok(xml) => {
                    // 截断过长的 XML 以便 AI 处理
                    let truncated = if xml.len() > 8000 {
                        format!("{}...(截断，共{}字符)", &xml[..8000], xml.len())
                    } else {
                        xml
                    };
                    ToolExecutionResult {
                        success: true,
                        message: truncated,
                    }
                }
                Err(e) => ToolExecutionResult {
                    success: false,
                    message: format!("获取屏幕失败: {}", e),
                },
            }
        }
        "wait" => {
            let ms = params.get("milliseconds").and_then(|v| v.as_u64()).unwrap_or(1000);
            tokio::time::sleep(tokio::time::Duration::from_millis(ms)).await;
            ToolExecutionResult {
                success: true,
                message: format!("已等待 {}ms", ms),
            }
        }
        // ========== 通用 CLI 命令（带安全限制）==========
        "run_command" | "execute_command" | "shell" => {
            let command = params.get("command").and_then(|v| v.as_str()).unwrap_or("");
            execute_cli_command(command).await
        }
        "read_file" => {
            let path = params.get("path").and_then(|v| v.as_str()).unwrap_or("");
            read_local_file(path).await
        }
        "list_dir" | "ls" => {
            let path = params.get("path").and_then(|v| v.as_str()).unwrap_or(".");
            list_directory(path).await
        }
        _ => {
            ToolExecutionResult {
                success: false,
                message: format!("未知工具: {}", action),
            }
        }
    }
}

/// 执行 ADB shell 命令
async fn execute_shell_command(adb_path: &str, device_id: &str, shell_cmd: &str) -> ToolExecutionResult {
    let mut command = std::process::Command::new(adb_path);
    command.args(&["-s", device_id, "shell", shell_cmd]);
    
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }
    
    match command.output() {
        Ok(output) => {
            if output.status.success() {
                ToolExecutionResult {
                    success: true,
                    message: "✅ 操作成功".to_string(),
                }
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr);
                ToolExecutionResult {
                    success: false,
                    message: format!("操作失败: {}", stderr),
                }
            }
        }
        Err(e) => ToolExecutionResult {
            success: false,
            message: format!("执行ADB失败: {}", e),
        },
    }
}

// ========== 通用 CLI 命令执行（带安全限制）==========

/// 危险命令黑名单
const DANGEROUS_COMMANDS: &[&str] = &[
    "rm -rf", "del /f", "format", "mkfs",          // 删除/格式化
    "shutdown", "reboot", "poweroff",               // 系统控制
    "reg delete", "reg add",                        // 注册表
    "net user", "net localgroup",                   // 用户管理
    "taskkill /f", "kill -9",                       // 强制杀进程
    "curl", "wget", "Invoke-WebRequest",            // 网络下载（防止恶意下载）
    "powershell -enc", "cmd /c",                    // 编码执行
    ":(){:|:&};:",                                  // Fork bomb
];

/// 允许的安全命令前缀（白名单模式更安全）
const SAFE_COMMAND_PREFIXES: &[&str] = &[
    "echo", "type", "cat", "head", "tail",          // 读取
    "dir", "ls", "Get-ChildItem",                   // 列目录
    "cd", "pwd", "Get-Location",                    // 导航
    "findstr", "grep", "Select-String",             // 搜索
    "date", "time", "Get-Date",                     // 时间
    "hostname", "whoami",                           // 系统信息
    "ping", "nslookup",                             // 网络诊断
    "node", "npm", "python", "cargo",               // 开发工具
    "git status", "git log", "git diff",            // Git 只读
];

/// 执行通用 CLI 命令（带安全检查）
async fn execute_cli_command(command: &str) -> ToolExecutionResult {
    let command_lower = command.to_lowercase();
    
    // 1. 黑名单检查
    for dangerous in DANGEROUS_COMMANDS {
        if command_lower.contains(&dangerous.to_lowercase()) {
            return ToolExecutionResult {
                success: false,
                message: format!("🚫 安全限制：禁止执行危险命令 '{}'", dangerous),
            };
        }
    }
    
    // 2. 白名单检查（可选：启用后只允许白名单命令）
    // let is_safe = SAFE_COMMAND_PREFIXES.iter().any(|prefix| 
    //     command_lower.starts_with(&prefix.to_lowercase())
    // );
    // if !is_safe {
    //     return ToolExecutionResult {
    //         success: false,
    //         message: format!("🚫 命令不在白名单中: {}", command),
    //     };
    // }
    
    info!("💻 执行 CLI 命令: {}", command);
    
    // 3. 执行命令
    #[cfg(windows)]
    let output = {
        use std::os::windows::process::CommandExt;
        std::process::Command::new("powershell")
            .args(&["-NoProfile", "-Command", command])
            .creation_flags(0x08000000) // CREATE_NO_WINDOW
            .output()
    };
    
    #[cfg(not(windows))]
    let output = {
        std::process::Command::new("sh")
            .args(&["-c", command])
            .output()
    };
    
    match output {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let stderr = String::from_utf8_lossy(&output.stderr);
            
            // 截断过长输出
            let result = if stdout.len() > 4000 {
                format!("{}...(截断，共{}字符)", &stdout[..4000], stdout.len())
            } else if stdout.is_empty() && !stderr.is_empty() {
                stderr.to_string()
            } else if stdout.is_empty() {
                "命令执行完成（无输出）".to_string()
            } else {
                stdout.to_string()
            };
            
            ToolExecutionResult {
                success: output.status.success(),
                message: result,
            }
        }
        Err(e) => ToolExecutionResult {
            success: false,
            message: format!("命令执行失败: {}", e),
        },
    }
}

/// 读取本地文件（带安全限制）
async fn read_local_file(path: &str) -> ToolExecutionResult {
    use std::path::Path;
    
    let path = Path::new(path);
    
    // 安全检查：禁止读取敏感路径
    let path_str = path.to_string_lossy().to_lowercase();
    let forbidden_paths = [
        "c:\\windows", "/etc/passwd", "/etc/shadow",
        ".ssh", ".gnupg", "credentials", "secrets",
        "password", "token", "api_key",
    ];
    
    for forbidden in forbidden_paths {
        if path_str.contains(forbidden) {
            return ToolExecutionResult {
                success: false,
                message: format!("🚫 安全限制：禁止访问敏感路径 '{}'", forbidden),
            };
        }
    }
    
    match std::fs::read_to_string(path) {
        Ok(content) => {
            let truncated = if content.len() > 8000 {
                format!("{}...(截断，共{}字符)", &content[..8000], content.len())
            } else {
                content
            };
            ToolExecutionResult {
                success: true,
                message: truncated,
            }
        }
        Err(e) => ToolExecutionResult {
            success: false,
            message: format!("读取文件失败: {}", e),
        },
    }
}

/// 列出目录内容
async fn list_directory(path: &str) -> ToolExecutionResult {
    use std::path::Path;
    
    let path = Path::new(path);
    
    match std::fs::read_dir(path) {
        Ok(entries) => {
            let mut items: Vec<String> = Vec::new();
            for entry in entries.take(100) {  // 限制最多100项
                if let Ok(entry) = entry {
                    let name = entry.file_name().to_string_lossy().to_string();
                    let file_type = if entry.path().is_dir() { "📁" } else { "📄" };
                    items.push(format!("{} {}", file_type, name));
                }
            }
            ToolExecutionResult {
                success: true,
                message: if items.is_empty() {
                    "目录为空".to_string()
                } else {
                    items.join("\n")
                },
            }
        }
        Err(e) => ToolExecutionResult {
            success: false,
            message: format!("读取目录失败: {}", e),
        },
    }
}

/// 获取设备屏幕 XML
async fn get_screen_xml(adb_path: &str, device_id: &str) -> Result<String, String> {
    // Dump UI
    let mut dump_cmd = std::process::Command::new(adb_path);
    dump_cmd.args(&["-s", device_id, "shell", "uiautomator dump /sdcard/window_dump.xml"]);
    
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        dump_cmd.creation_flags(0x08000000);
    }
    
    dump_cmd.output().map_err(|e| e.to_string())?;
    
    // Cat the file
    let mut cat_cmd = std::process::Command::new(adb_path);
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

/// 从 XML 中查找元素中心坐标
fn find_element_center(xml: &str, text: &str) -> Option<(i32, i32)> {
    for line in xml.lines() {
        // 检查是否包含目标文本
        if let Some(start) = line.find("text=\"") {
            let text_start = start + 6;
            if let Some(end) = line[text_start..].find('"') {
                let text_value = &line[text_start..text_start + end];
                if text_value.contains(text) {
                    // 找到元素，解析 bounds
                    if let Some(bounds_start) = line.find("bounds=\"[") {
                        let bounds_str = &line[bounds_start + 8..];
                        if let Some(coords) = parse_bounds(bounds_str) {
                            return Some(coords);
                        }
                    }
                }
            }
        }
    }
    None
}

/// 解析 bounds 属性 "[left,top][right,bottom]" 返回中心点
fn parse_bounds(bounds_str: &str) -> Option<(i32, i32)> {
    let coords = &bounds_str[1..]; // 跳过 '['
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
    None
}

/// 计算滑动坐标
fn calculate_swipe_coords(direction: &str, distance: &str) -> (i32, i32, i32, i32) {
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

/// 从屏幕 XML 提取关键元素摘要（供 AI 分析）
fn extract_screen_summary(xml: &str) -> String {
    let mut elements: Vec<String> = Vec::new();
    let mut element_count = 0;
    
    for line in xml.lines() {
        // 提取有文本的元素
        if let Some(start) = line.find("text=\"") {
            let text_start = start + 6;
            if let Some(end) = line[text_start..].find('"') {
                let text_value = &line[text_start..text_start + end];
                if !text_value.is_empty() && element_count < 30 {
                    // 提取类名
                    let class = if let Some(class_start) = line.find("class=\"") {
                        let cs = class_start + 7;
                        if let Some(ce) = line[cs..].find('"') {
                            let full_class = &line[cs..cs + ce];
                            // 简化类名（只保留最后一部分）
                            full_class.rsplit('.').next().unwrap_or(full_class)
                        } else {
                            "?"
                        }
                    } else {
                        "?"
                    };
                    
                    // 检查是否可点击
                    let clickable = line.contains("clickable=\"true\"");
                    let click_mark = if clickable { "🔘" } else { "  " };
                    
                    elements.push(format!("{} [{}] \"{}\"", click_mark, class, text_value));
                    element_count += 1;
                }
            }
        }
    }
    
    if elements.is_empty() {
        "屏幕上没有检测到文本元素".to_string()
    } else {
        format!("可见元素（🔘=可点击）:\n{}", elements.join("\n"))
    }
}

// ========== 插件初始化 ==========

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("agent-runtime")
        .invoke_handler(tauri::generate_handler![
            start,
            pause,
            resume,
            stop,
            approve,
            reject,
            status,
            get_events,
        ])
        .setup(|app, _| {
            app.manage(AgentRuntimeState::new());
            info!("🤖 Agent Runtime 插件已初始化");
            Ok(())
        })
        .build()
}
