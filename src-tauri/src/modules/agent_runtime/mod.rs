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
use crate::screenshot_service::ScreenshotService;
use tauri::{
    plugin::{Builder, TauriPlugin},
    AppHandle, Emitter, Manager, Runtime, State,
};
use tokio::sync::{mpsc, watch, RwLock};
use std::sync::Arc;
use std::path::PathBuf;
use tracing::{info, warn, error};
use serde::{Deserialize, Serialize};
use base64::{Engine as _, engine::general_purpose};

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

// ========== P2: 任务分解规划器 ==========

mod agent_runtime_planner {
    use super::*;
    use std::collections::VecDeque;
    
    /// 子任务状态
    #[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
    #[serde(rename_all = "snake_case")]
    pub enum SubTaskStatus {
        Pending,
        InProgress,
        Completed,
        Failed,
        Skipped,
    }
    
    /// 子任务定义
    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub struct SubTask {
        pub id: String,
        pub description: String,
        pub action_hint: Option<String>,  // 可选的动作提示
        pub status: SubTaskStatus,
        pub result: Option<String>,
        pub retries: u32,
        pub max_retries: u32,
    }
    
    impl SubTask {
        pub fn new(id: impl Into<String>, description: impl Into<String>) -> Self {
            Self {
                id: id.into(),
                description: description.into(),
                action_hint: None,
                status: SubTaskStatus::Pending,
                result: None,
                retries: 0,
                max_retries: 3,
            }
        }
        
        pub fn with_hint(mut self, hint: impl Into<String>) -> Self {
            self.action_hint = Some(hint.into());
            self
        }
    }
    
    /// 执行计划
    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub struct ExecutionPlan {
        pub goal: String,
        pub tasks: VecDeque<SubTask>,
        pub completed_tasks: Vec<SubTask>,
        pub current_task_index: usize,
        pub total_tasks: usize,
    }
    
    impl ExecutionPlan {
        pub fn new(goal: String, tasks: Vec<SubTask>) -> Self {
            let total = tasks.len();
            Self {
                goal,
                tasks: VecDeque::from(tasks),
                completed_tasks: Vec::new(),
                current_task_index: 0,
                total_tasks: total,
            }
        }
        
        /// 获取当前任务
        pub fn current_task(&self) -> Option<&SubTask> {
            self.tasks.front()
        }
        
        /// 标记当前任务完成
        pub fn complete_current(&mut self, result: String) {
            if let Some(mut task) = self.tasks.pop_front() {
                task.status = SubTaskStatus::Completed;
                task.result = Some(result);
                self.completed_tasks.push(task);
                self.current_task_index += 1;
            }
        }
        
        /// 标记当前任务失败
        pub fn fail_current(&mut self, reason: String) -> bool {
            if let Some(task) = self.tasks.front_mut() {
                task.retries += 1;
                if task.retries >= task.max_retries {
                    let mut failed_task = self.tasks.pop_front().unwrap();
                    failed_task.status = SubTaskStatus::Failed;
                    failed_task.result = Some(reason);
                    self.completed_tasks.push(failed_task);
                    self.current_task_index += 1;
                    return false; // 任务彻底失败
                }
                return true; // 可以重试
            }
            false
        }
        
        /// 跳过当前任务
        pub fn skip_current(&mut self, reason: String) {
            if let Some(mut task) = self.tasks.pop_front() {
                task.status = SubTaskStatus::Skipped;
                task.result = Some(reason);
                self.completed_tasks.push(task);
                self.current_task_index += 1;
            }
        }
        
        /// 是否全部完成
        pub fn is_complete(&self) -> bool {
            self.tasks.is_empty()
        }
        
        /// 计算进度百分比
        pub fn progress_percent(&self) -> u8 {
            if self.total_tasks == 0 { return 100; }
            ((self.current_task_index as f32 / self.total_tasks as f32) * 100.0) as u8
        }
        
        /// 生成进度摘要
        pub fn summary(&self) -> String {
            let completed = self.completed_tasks.iter()
                .filter(|t| t.status == SubTaskStatus::Completed)
                .count();
            let failed = self.completed_tasks.iter()
                .filter(|t| t.status == SubTaskStatus::Failed)
                .count();
            format!(
                "进度: {}/{} | 完成: {} | 失败: {} | 当前: {}",
                self.current_task_index,
                self.total_tasks,
                completed,
                failed,
                self.current_task().map(|t| t.description.as_str()).unwrap_or("无")
            )
        }
    }
    
    /// AI 任务分解提示词
    pub fn build_planning_prompt(goal: &str) -> String {
        format!(r#"请将以下目标分解为具体的操作步骤。

## 目标
{goal}

## 要求
1. 每个步骤应该是一个原子操作（点击、输入、滑动等）
2. 步骤之间有明确的先后顺序
3. 每个步骤应该可验证完成状态

## 输出格式（JSON）
{{
    "tasks": [
        {{
            "id": "1",
            "description": "步骤描述",
            "action_hint": "tap_element/swipe/input_text 等"
        }}
    ]
}}

请直接返回 JSON，不要包含其他内容。"#, goal = goal)
    }
    
    /// 从 AI 响应解析任务列表
    pub fn parse_planning_response(response: &str) -> Result<Vec<SubTask>, String> {
        // 尝试提取 JSON
        let json_str = if let Some(start) = response.find('{') {
            if let Some(end) = response.rfind('}') {
                &response[start..=end]
            } else {
                return Err("未找到完整的 JSON".to_string());
            }
        } else {
            return Err("响应中没有 JSON".to_string());
        };
        
        let parsed: serde_json::Value = serde_json::from_str(json_str)
            .map_err(|e| format!("JSON 解析失败: {}", e))?;
        
        let tasks_array = parsed.get("tasks")
            .and_then(|v| v.as_array())
            .ok_or("未找到 tasks 数组")?;
        
        let mut tasks = Vec::new();
        for (i, item) in tasks_array.iter().enumerate() {
            let id = item.get("id")
                .and_then(|v| v.as_str())
                .unwrap_or(&format!("{}", i + 1))
                .to_string();
            let description = item.get("description")
                .and_then(|v| v.as_str())
                .ok_or(format!("任务 {} 缺少 description", i))?;
            let action_hint = item.get("action_hint")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());
            
            let mut task = SubTask::new(id, description);
            if let Some(hint) = action_hint {
                task = task.with_hint(hint);
            }
            tasks.push(task);
        }
        
        if tasks.is_empty() {
            return Err("任务列表为空".to_string());
        }
        
        Ok(tasks)
    }
    
    /// 构建子任务执行提示词
    pub fn build_task_execution_prompt(
        task: &SubTask, 
        plan_summary: &str,
        screen_context: &str
    ) -> String {
        build_task_execution_prompt_with_memory(task, plan_summary, screen_context, &[], &[])
    }
    
    /// 构建子任务执行提示词（带记忆系统经验）
    pub fn build_task_execution_prompt_with_memory(
        task: &SubTask, 
        plan_summary: &str,
        screen_context: &str,
        success_examples: &[String],
        failure_lessons: &[String],
    ) -> String {
        let memory_section = if success_examples.is_empty() && failure_lessons.is_empty() {
            String::new()
        } else {
            let mut section = "\n## 历史经验\n".to_string();
            if !success_examples.is_empty() {
                section.push_str("### 成功案例\n");
                for ex in success_examples {
                    section.push_str(&format!("{}\n", ex));
                }
            }
            if !failure_lessons.is_empty() {
                section.push_str("### 避免重蹈覆辙\n");
                for lesson in failure_lessons {
                    section.push_str(&format!("{}\n", lesson));
                }
            }
            section
        };
        
        format!(r#"你正在执行一个分步计划。

## 当前计划状态
{plan_summary}

## 当前子任务
- ID: {id}
- 描述: {description}
{action_hint}

## 当前屏幕状态
{screen_context}
{memory_section}
## 要求
1. 只执行当前子任务，不要跳步
2. 执行一个动作后观察结果
3. 如果子任务完成，返回 "task_complete": true
4. 参考历史经验，避免已知的失败模式

## 输出格式
{{
    "thought": "思考过程",
    "action": "工具名称",
    "params": {{ 参数 }},
    "task_complete": false
}}

或者任务完成时：
{{
    "thought": "任务完成原因",
    "task_complete": true,
    "task_result": "完成结果描述"
}}"#,
            plan_summary = plan_summary,
            id = task.id,
            description = task.description,
            action_hint = task.action_hint.as_ref()
                .map(|h| format!("- 动作提示: {}", h))
                .unwrap_or_default(),
            screen_context = screen_context,
            memory_section = memory_section
        )
    }
}

pub use agent_runtime_planner::*;

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

// ========== PC-手机协同命令 ==========

/// 协同状态响应
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CollaborationStatusResponse {
    pub success: bool,
    pub connection_state: String,
    pub phone_address: Option<String>,
    pub mode: String,
    pub error: Option<String>,
}

/// 连接到手机
#[tauri::command]
async fn connect_phone(
    phone_ip: String,
    port: Option<u16>,
) -> Result<CollaborationStatusResponse, String> {
    let port = port.unwrap_or(8765);
    info!("📱 尝试连接手机: {}:{}", phone_ip, port);
    
    // 创建协同管理器（实际使用时应该是单例状态）
    let manager = CollaborationManager::new();
    
    match manager.connect(&phone_ip, port).await {
        Ok(_) => {
            let session = manager.get_session().await;
            Ok(CollaborationStatusResponse {
                success: true,
                connection_state: format!("{:?}", session.connection_state),
                phone_address: session.phone_address,
                mode: format!("{:?}", session.mode),
                error: None,
            })
        }
        Err(e) => {
            Ok(CollaborationStatusResponse {
                success: false,
                connection_state: "Disconnected".to_string(),
                phone_address: None,
                mode: "PcAsBrain".to_string(),
                error: Some(e),
            })
        }
    }
}

/// 断开手机连接
#[tauri::command]
async fn disconnect_phone() -> Result<AgentResponse, String> {
    info!("📱 断开手机连接");
    // TODO: 实际断开连接
    Ok(AgentResponse {
        success: true,
        message: "已断开手机连接".to_string(),
        error: None,
    })
}

/// 发送目标到手机执行
#[tauri::command]
async fn send_goal_to_phone(
    goal: String,
    max_steps: Option<u32>,
    timeout_seconds: Option<u32>,
) -> Result<AgentResponse, String> {
    let max_steps = max_steps.unwrap_or(20);
    let timeout = timeout_seconds.unwrap_or(60);
    
    info!("📱 发送目标到手机: {} (最大步骤: {}, 超时: {}s)", goal, max_steps, timeout);
    
    let manager = CollaborationManager::new();
    match manager.send_goal(&goal, max_steps, timeout).await {
        Ok(_) => Ok(AgentResponse {
            success: true,
            message: format!("目标已发送到手机: {}", goal),
            error: None,
        }),
        Err(e) => Ok(AgentResponse {
            success: false,
            message: "发送目标失败".to_string(),
            error: Some(e),
        }),
    }
}

/// 请求手机执行动作（PC 决策后）
#[tauri::command]
async fn execute_action_on_phone(
    action_type: String,
    target: String,
    params: Option<serde_json::Value>,
) -> Result<AgentResponse, String> {
    let params = params.unwrap_or(serde_json::Value::Null);
    
    info!("📱 请求手机执行: {} -> {}", action_type, target);
    
    let manager = CollaborationManager::new();
    match manager.execute_on_phone(&action_type, &target, params).await {
        Ok(_) => Ok(AgentResponse {
            success: true,
            message: format!("动作已发送: {} -> {}", action_type, target),
            error: None,
        }),
        Err(e) => Ok(AgentResponse {
            success: false,
            message: "执行动作失败".to_string(),
            error: Some(e),
        }),
    }
}

// ========== Agent 对话历史管理 ==========

/// 对话历史配置（使用 agent_runtime_ 前缀避免命名冲突）
mod agent_runtime_history {
    /// 最大历史条数（超过后滑动窗口）
    pub const MAX_HISTORY_SIZE: usize = 20;
    /// 保留的最近消息数（滑动时保留）
    pub const KEEP_RECENT_COUNT: usize = 15;
    /// 单条消息最大字符数（超过截断）
    pub const MAX_MESSAGE_LENGTH: usize = 2000;
    
    /// 截断过长消息
    pub fn truncate_message(msg: &str) -> String {
        if msg.len() > MAX_MESSAGE_LENGTH {
            format!("{}...(已截断，原长度:{})", &msg[..MAX_MESSAGE_LENGTH], msg.len())
        } else {
            msg.to_string()
        }
    }
    
    /// 维护对话历史大小（滑动窗口）
    pub fn maintain_history(history: &mut Vec<String>, system_prompt: &str) {
        if history.len() > MAX_HISTORY_SIZE {
            // 保留系统提示词 + 最近的消息
            let keep_start = history.len() - KEEP_RECENT_COUNT;
            let recent: Vec<String> = history.drain(keep_start..).collect();
            history.clear();
            history.push(system_prompt.to_string());
            history.push("[...历史消息已压缩...]".to_string());
            history.extend(recent);
            tracing::info!("📜 对话历史已压缩: 保留最近 {} 条", KEEP_RECENT_COUNT);
        }
    }
}

use agent_runtime_history::*;

// ========== 多模态屏幕分析（P1 改进）==========

mod agent_runtime_vision {
    use super::*;
    
    /// 截图并转为 Base64（用于 Vision API）
    pub fn capture_screenshot_base64(device_id: &str) -> Result<String, String> {
        let temp_path = std::env::temp_dir().join(format!("agent_screenshot_{}.png", device_id));
        
        ScreenshotService::capture_screenshot_to_path(device_id, &temp_path)?;
        
        let bytes = std::fs::read(&temp_path)
            .map_err(|e| format!("读取截图失败: {}", e))?;
        
        // 清理临时文件
        let _ = std::fs::remove_file(&temp_path);
        
        Ok(general_purpose::STANDARD.encode(&bytes))
    }
    
    /// 构建多模态分析消息（XML + 截图描述）
    pub fn build_multimodal_context(xml_summary: &str, has_vision: bool) -> String {
        if has_vision {
            format!(
                "当前屏幕状态（融合 UI 树 + 视觉分析）：\n{}\n[注: 已同时分析截图]",
                xml_summary
            )
        } else {
            format!("当前屏幕状态：\n{}", xml_summary)
        }
    }
}

use agent_runtime_vision::*;

// ========== 智能错误恢复（P1 改进）==========

mod agent_runtime_recovery {
    use super::*;
    
    /// 错误类型分类（用于选择恢复策略）
    #[derive(Debug, Clone)]
    pub enum AgentRuntimeErrorType {
        /// AI 调用失败（网络/API 错误）
        AiCallFailed,
        /// 元素未找到
        ElementNotFound,
        /// 设备连接断开
        DeviceDisconnected,
        /// 动作执行超时
        ActionTimeout,
        /// 页面卡住/无响应
        PageStuck,
        /// 未知错误
        Unknown,
    }
    
    /// 根据错误消息分类错误类型
    pub fn classify_error(error_msg: &str) -> AgentRuntimeErrorType {
        let msg = error_msg.to_lowercase();
        
        if msg.contains("ai") || msg.contains("api") || msg.contains("network") || msg.contains("timeout") && msg.contains("request") {
            AgentRuntimeErrorType::AiCallFailed
        } else if msg.contains("not found") || msg.contains("未找到") || msg.contains("no such element") {
            AgentRuntimeErrorType::ElementNotFound
        } else if msg.contains("device") || msg.contains("offline") || msg.contains("disconnected") {
            AgentRuntimeErrorType::DeviceDisconnected
        } else if msg.contains("timeout") || msg.contains("超时") {
            AgentRuntimeErrorType::ActionTimeout
        } else if msg.contains("stuck") || msg.contains("frozen") || msg.contains("卡住") {
            AgentRuntimeErrorType::PageStuck
        } else {
            AgentRuntimeErrorType::Unknown
        }
    }
    
    /// 根据错误类型返回恢复策略
    pub fn get_recovery_strategy(error_type: &AgentRuntimeErrorType, retry_count: u32) -> RecoveryAction {
        match error_type {
            AgentRuntimeErrorType::AiCallFailed => {
                // AI 失败：指数退避重试
                let delay_ms = 1000 * (2_u64.pow(retry_count.min(4)));
                RecoveryAction::RetryWithDelay(delay_ms)
            }
            AgentRuntimeErrorType::ElementNotFound => {
                // 元素未找到：滚动屏幕或返回
                if retry_count < 2 {
                    RecoveryAction::ScrollAndRetry
                } else {
                    RecoveryAction::PressBackAndRetry
                }
            }
            AgentRuntimeErrorType::DeviceDisconnected => {
                // 设备断开：停止并报错
                RecoveryAction::StopWithError("设备连接已断开".to_string())
            }
            AgentRuntimeErrorType::ActionTimeout => {
                // 超时：等待后重试
                RecoveryAction::RetryWithDelay(2000)
            }
            AgentRuntimeErrorType::PageStuck => {
                // 页面卡住：按返回键
                RecoveryAction::PressBackAndRetry
            }
            AgentRuntimeErrorType::Unknown => {
                if retry_count < 3 {
                    RecoveryAction::RetryWithDelay(1000)
                } else {
                    RecoveryAction::StopWithError("多次重试失败".to_string())
                }
            }
        }
    }
    
    /// 恢复动作
    #[derive(Debug, Clone)]
    pub enum RecoveryAction {
        /// 延迟后重试
        RetryWithDelay(u64),
        /// 滚动屏幕后重试
        ScrollAndRetry,
        /// 按返回键后重试
        PressBackAndRetry,
        /// 停止并报错
        StopWithError(String),
    }
}

use agent_runtime_recovery::*;

// ========== Tauri 事件推送（替代轮询）==========

/// Agent 事件名称常量（使用 agent_runtime_ 前缀避免冲突）
mod agent_runtime_events {
    pub const EVENT_STATE_CHANGED: &str = "agent_runtime:state_changed";
    pub const EVENT_PROGRESS: &str = "agent_runtime:progress";
    pub const EVENT_ACTION: &str = "agent_runtime:action";
    pub const EVENT_THINKING: &str = "agent_runtime:thinking";
    pub const EVENT_ERROR: &str = "agent_runtime:error";
    pub const EVENT_COMPLETED: &str = "agent_runtime:completed";
}

use agent_runtime_events::*;

/// 向前端推送事件（替代轮询）
fn emit_agent_event<R: Runtime>(app: &AppHandle<R>, event: &AgentEvent) {
    let event_name = match event {
        AgentEvent::StateChanged { .. } => EVENT_STATE_CHANGED,
        AgentEvent::GoalProgress { .. } => EVENT_PROGRESS,
        AgentEvent::ActionExecuted { .. } => EVENT_ACTION,
        AgentEvent::AiThinking { .. } => EVENT_THINKING,
        AgentEvent::Error { .. } => EVENT_ERROR,
        AgentEvent::GoalCompleted { .. } | AgentEvent::GoalFailed { .. } => EVENT_COMPLETED,
        _ => EVENT_STATE_CHANGED,
    };
    
    if let Err(e) = app.emit(event_name, event) {
        tracing::warn!("发送事件失败: {}", e);
    }
}

// ========== Agent 循环实现 ==========

/// 发送事件的辅助函数
async fn send_agent_event<R: Runtime>(
    event_log: &Arc<RwLock<Vec<AgentEvent>>>,
    app_handle: &AppHandle<R>,
    event: AgentEvent,
) {
    // 推送给前端（实时）
    emit_agent_event(app_handle, &event);
    // 同时记录到日志
    let mut l = event_log.write().await;
    if l.len() > 100 { l.drain(0..50); }
    l.push(event);
}

/// Agent 自主循环（集成任务规划器）
async fn run_agent_loop<R: Runtime>(
    runtime: SharedAgentRuntime,
    mut stop_rx: watch::Receiver<bool>,
    event_log: Arc<RwLock<Vec<AgentEvent>>>,
    app_handle: AppHandle<R>,
    goal: String,
    device_id: String,
) {
    use tokio::time::Duration;

    info!("🚀 启动带规划的 Agent 循环: goal={}", goal);

    // ========== 阶段1: 任务规划 ==========
    send_agent_event(&event_log, &app_handle, AgentEvent::AiThinking {
        thought: "正在分析目标并制定执行计划...".to_string(),
    }).await;

    // 调用 AI 进行任务分解
    let execution_plan = if let Some(agent_state) = app_handle.try_state::<AgentState>() {
        let planning_prompt = build_planning_prompt(&goal);
        
        match agent_state.chat_with_ai(&planning_prompt).await {
            Ok(response) => {
                info!("📋 收到规划响应: {}", &response[..response.len().min(300)]);
                match parse_planning_response(&response) {
                    Ok(tasks) => {
                        info!("✅ 任务分解成功: {} 个子任务", tasks.len());
                        Some(ExecutionPlan::new(goal.clone(), tasks))
                    }
                    Err(e) => {
                        warn!("⚠️ 任务解析失败，使用单任务模式: {}", e);
                        // 降级：把整个目标作为一个任务
                        Some(ExecutionPlan::new(
                            goal.clone(),
                            vec![SubTask::new("1", &goal)]
                        ))
                    }
                }
            }
            Err(e) => {
                error!("❌ 规划 AI 调用失败: {}", e);
                send_agent_event(&event_log, &app_handle, AgentEvent::Error {
                    message: format!("规划失败: {}", e),
                }).await;
                None
            }
        }
    } else {
        error!("❌ AgentState 不可用");
        None
    };

    let mut plan = match execution_plan {
        Some(p) => p,
        None => {
            send_agent_event(&event_log, &app_handle, AgentEvent::GoalFailed {
                goal_id: "current".to_string(),
                reason: "无法创建执行计划".to_string(),
            }).await;
            return;
        }
    };

    // 通知前端计划已创建
    send_agent_event(&event_log, &app_handle, AgentEvent::AiThinking {
        thought: format!("计划已创建: {} 个步骤\n{}", plan.total_tasks, plan.summary()),
    }).await;

    // ========== 阶段2: 逐任务执行 ==========
    let adb_path = crate::utils::adb_utils::get_adb_path();
    
    while !plan.is_complete() && !*stop_rx.borrow() {
        let current_task = match plan.current_task() {
            Some(t) => t.clone(),
            None => break,
        };

        info!("📌 执行子任务 {}: {}", current_task.id, current_task.description);
        
        send_agent_event(&event_log, &app_handle, AgentEvent::GoalProgress {
            goal_id: "current".to_string(),
            progress: plan.progress_percent(),
            description: format!("步骤 {}/{}: {}", 
                plan.current_task_index + 1, 
                plan.total_tasks,
                current_task.description
            ),
        }).await;

        // 获取屏幕上下文
        let screen_context = match get_screen_xml(&adb_path, &device_id).await {
            Ok(xml) => extract_screen_summary(&xml),
            Err(e) => format!("无法获取屏幕: {}", e),
        };

        // 构建子任务执行提示词
        let task_prompt = build_task_execution_prompt(
            &current_task,
            &plan.summary(),
            &screen_context
        );

        // 调用 AI 决定动作
        let ai_response = if let Some(agent_state) = app_handle.try_state::<AgentState>() {
            match agent_state.chat_with_ai(&task_prompt).await {
                Ok(r) => Some(r),
                Err(e) => {
                    error!("❌ AI 调用失败: {}", e);
                    None
                }
            }
        } else {
            None
        };

        // 处理 AI 响应
        if let Some(response) = ai_response {
            info!("🤖 AI 响应: {}", &response[..response.len().min(200)]);
            
            if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(&response) {
                let thought = parsed.get("thought")
                    .and_then(|v| v.as_str())
                    .unwrap_or("");
                
                send_agent_event(&event_log, &app_handle, AgentEvent::AiThinking {
                    thought: thought.to_string(),
                }).await;

                let task_complete = parsed.get("task_complete")
                    .and_then(|v| v.as_bool())
                    .unwrap_or(false);

                if task_complete {
                    // 子任务完成
                    let result = parsed.get("task_result")
                        .and_then(|v| v.as_str())
                        .unwrap_or("完成")
                        .to_string();
                    
                    info!("✅ 子任务 {} 完成: {}", current_task.id, result);
                    plan.complete_current(result);
                    
                    send_agent_event(&event_log, &app_handle, AgentEvent::ActionExecuted {
                        action: format!("完成子任务: {}", current_task.description),
                        result: "成功".to_string(),
                        success: true,
                    }).await;
                } else if let Some(action) = parsed.get("action").and_then(|v| v.as_str()) {
                    // 执行动作
                    let params = parsed.get("params").cloned()
                        .unwrap_or(serde_json::json!({}));
                    
                    send_agent_event(&event_log, &app_handle, AgentEvent::ActionExecuted {
                        action: action.to_string(),
                        result: "执行中...".to_string(),
                        success: true,
                    }).await;

                    let result = execute_agent_tool(action, &params, &device_id).await;
                    
                    send_agent_event(&event_log, &app_handle, AgentEvent::ActionExecuted {
                        action: action.to_string(),
                        result: result.message.clone(),
                        success: result.success,
                    }).await;

                    if !result.success {
                        // 动作失败，尝试重试
                        if !plan.fail_current(result.message) {
                            warn!("⚠️ 子任务 {} 多次失败，跳过", current_task.id);
                        }
                    }
                    
                    // 等待动作生效
                    tokio::time::sleep(Duration::from_millis(500)).await;
                }
            } else {
                warn!("⚠️ AI 响应非 JSON: {}", &response[..response.len().min(100)]);
                plan.fail_current("AI 响应格式错误".to_string());
            }
        } else {
            // AI 调用失败
            if !plan.fail_current("AI 调用失败".to_string()) {
                warn!("⚠️ 子任务 {} 因 AI 失败而跳过", current_task.id);
            }
        }

        // 检查运行状态
        let state = {
            let rt = runtime.read().await;
            rt.current_state()
        };
        
        match state {
            AgentRunState::Paused | AgentRunState::WaitingForApproval => {
                // 等待用户操作
                while {
                    let s = runtime.read().await.current_state();
                    s == AgentRunState::Paused || s == AgentRunState::WaitingForApproval
                } {
                    tokio::time::sleep(Duration::from_millis(100)).await;
                    if *stop_rx.borrow() { break; }
                }
            }
            AgentRunState::Stopped => break,
            _ => {}
        }

        // 循环间隔
        tokio::time::sleep(Duration::from_millis(100)).await;
    }

    // ========== 阶段3: 完成处理 ==========
    if plan.is_complete() {
        let completed_count = plan.completed_tasks.iter()
            .filter(|t| t.status == SubTaskStatus::Completed)
            .count();
        let failed_count = plan.completed_tasks.iter()
            .filter(|t| t.status == SubTaskStatus::Failed)
            .count();
        
        if failed_count == 0 {
            info!("🎉 目标完成: {} 个子任务全部成功", completed_count);
            send_agent_event(&event_log, &app_handle, AgentEvent::GoalCompleted {
                goal_id: "current".to_string(),
            }).await;
        } else {
            info!("⚠️ 目标部分完成: {}/{} 成功", completed_count, plan.total_tasks);
            send_agent_event(&event_log, &app_handle, AgentEvent::GoalCompleted {
                goal_id: "current".to_string(),
            }).await;
        }
        
        let mut rt = runtime.write().await;
        rt.complete_current_goal();
    } else if *stop_rx.borrow() {
        info!("🛑 用户停止执行");
    }
}

/// 旧版 Agent 循环（保留兼容）
#[allow(dead_code)]
async fn run_agent_loop_legacy<R: Runtime>(
    runtime: SharedAgentRuntime,
    mut stop_rx: watch::Receiver<bool>,
    event_log: Arc<RwLock<Vec<AgentEvent>>>,
    app_handle: AppHandle<R>,
    goal: String,
    device_id: String,
) {
    use tokio::time::Duration;

    // 同时记录日志并推送事件给前端
    let add_and_emit_event = |log: &Arc<RwLock<Vec<AgentEvent>>>, app: &AppHandle<R>, event: AgentEvent| {
        let log = log.clone();
        let app = app.clone();
        let event_clone = event.clone();
        async move {
            // 推送给前端（实时）
            emit_agent_event(&app, &event);
            // 同时记录到日志（兼容旧的轮询方式）
            let mut l = log.write().await;
            if l.len() > 100 {
                l.drain(0..50);
            }
            l.push(event_clone);
        }
    };

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
                add_and_emit_event(&event_log, &app_handle, AgentEvent::AiThinking {
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
                            add_and_emit_event(&event_log, &app_handle, AgentEvent::Error {
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
                    // 将响应添加到历史（截断过长内容）
                    conversation_history.push(truncate_message(&format!("AI: {}", response)));
                    // 维护历史大小（滑动窗口）
                    maintain_history(&mut conversation_history, &system_prompt);

                    // 尝试解析 JSON 响应
                    if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(&response) {
                        let thought = parsed.get("thought")
                            .and_then(|v| v.as_str())
                            .unwrap_or("思考中...");
                        
                        let is_complete = parsed.get("is_complete")
                            .and_then(|v| v.as_bool())
                            .unwrap_or(false);

                        add_and_emit_event(&event_log, &app_handle, AgentEvent::AiThinking {
                            thought: thought.to_string(),
                        }).await;

                        if is_complete {
                            // 目标完成
                            let mut rt = runtime.write().await;
                            rt.complete_current_goal();
                            add_and_emit_event(&event_log, &app_handle, AgentEvent::GoalCompleted {
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
                            add_and_emit_event(&event_log, &app_handle, AgentEvent::StateChanged {
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
                    add_and_emit_event(&event_log, &app_handle, AgentEvent::ActionExecuted {
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
                    conversation_history.push(truncate_message(&format!("System: {}", result_text)));
                    maintain_history(&mut conversation_history, &system_prompt);

                    {
                        let mut rt = runtime.write().await;
                        rt.record_action_result(&action_name, &result_text, result.success);
                        let _ = rt.transition_action_completed();
                    }

                    add_and_emit_event(&event_log, &app_handle, AgentEvent::ActionExecuted {
                        action: action_name,
                        result: result.message,
                        success: result.success,
                    }).await;

                    add_and_emit_event(&event_log, &app_handle, AgentEvent::StateChanged {
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

                // 添加屏幕状态到对话历史（截断过长内容）
                conversation_history.push(truncate_message(&format!("System: {}", screen_info)));
                maintain_history(&mut conversation_history, &system_prompt);

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

                add_and_emit_event(&event_log, &app_handle, AgentEvent::GoalProgress {
                    goal_id: "current".to_string(),
                    progress: (progress + 5).min(95),
                    description: screen_info[..screen_info.len().min(100)].to_string(),
                }).await;

                add_and_emit_event(&event_log, &app_handle, AgentEvent::StateChanged {
                    state: AgentRunState::Thinking,
                }).await;
            }
            AgentRunState::Recovering => {
                // ========== 智能错误恢复阶段 ==========
                let (last_error, retry_count) = {
                    let rt = runtime.read().await;
                    (
                        rt.last_error().unwrap_or_default(),
                        rt.consecutive_failures() as u32
                    )
                };
                
                let error_type = classify_error(&last_error);
                let recovery_action = get_recovery_strategy(&error_type, retry_count);
                
                info!("🔄 智能恢复: 错误类型={:?}, 重试次数={}, 策略={:?}", 
                    error_type, retry_count, recovery_action);
                
                match recovery_action {
                    RecoveryAction::RetryWithDelay(delay_ms) => {
                        add_and_emit_event(&event_log, &app_handle, AgentEvent::AiThinking {
                            thought: format!("等待 {}ms 后重试...", delay_ms),
                        }).await;
                        tokio::time::sleep(Duration::from_millis(delay_ms)).await;
                        
                        let mut rt = runtime.write().await;
                        let _ = rt.transition_recovery_success();
                    }
                    RecoveryAction::ScrollAndRetry => {
                        add_and_emit_event(&event_log, &app_handle, AgentEvent::AiThinking {
                            thought: "尝试滚动屏幕查找元素...".to_string(),
                        }).await;
                        
                        // 执行滚动
                        let adb_path = crate::utils::adb_utils::get_adb_path();
                        let _ = execute_shell_command(&adb_path, &device_id, "input swipe 540 1500 540 500 300").await;
                        tokio::time::sleep(Duration::from_millis(500)).await;
                        
                        let mut rt = runtime.write().await;
                        let _ = rt.transition_recovery_success();
                    }
                    RecoveryAction::PressBackAndRetry => {
                        add_and_emit_event(&event_log, &app_handle, AgentEvent::AiThinking {
                            thought: "尝试按返回键...".to_string(),
                        }).await;
                        
                        let adb_path = crate::utils::adb_utils::get_adb_path();
                        let _ = execute_shell_command(&adb_path, &device_id, "input keyevent KEYCODE_BACK").await;
                        tokio::time::sleep(Duration::from_millis(500)).await;
                        
                        let mut rt = runtime.write().await;
                        let _ = rt.transition_recovery_success();
                    }
                    RecoveryAction::StopWithError(msg) => {
                        add_and_emit_event(&event_log, &app_handle, AgentEvent::Error {
                            message: msg.clone(),
                        }).await;
                        add_and_emit_event(&event_log, &app_handle, AgentEvent::GoalFailed {
                            goal_id: "current".to_string(),
                            reason: msg,
                        }).await;
                        
                        let mut rt = runtime.write().await;
                        let _ = rt.handle_command(AgentCommand::Stop);
                        break;
                    }
                }
                
                add_and_emit_event(&event_log, &app_handle, AgentEvent::StateChanged {
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

// ========== P2: PC-手机 Agent 协同模块 ==========

/// PC-手机协同模块
/// 
/// 职责：
/// - PC 作为 WebSocket 客户端连接手机（手机是服务端）
/// - 发送目标/命令给手机执行
/// - 接收手机的状态、屏幕、日志等反馈
/// - 实现"大脑(PC) + 执行器(手机)"的分离架构
mod agent_runtime_collaboration {
    use serde::{Deserialize, Serialize};
    use std::sync::Arc;
    use tokio::sync::RwLock;
    
    /// 协同模式
    #[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
    pub enum CollaborationMode {
        /// PC 主导：PC 做 AI 决策，手机只执行动作
        PcAsBrain,
        /// 手机主导：手机有本地 AI，PC 只监控
        PhoneAutonomous,
        /// 混合模式：两端都参与决策
        Hybrid,
    }
    
    impl Default for CollaborationMode {
        fn default() -> Self { Self::PcAsBrain }
    }
    
    /// PC → 手机 消息类型
    #[derive(Debug, Clone, Serialize, Deserialize)]
    #[serde(tag = "type", content = "payload")]
    pub enum PcToPhoneMessage {
        /// 设置目标
        Goal {
            description: String,
            max_steps: u32,
            timeout_seconds: u32,
        },
        /// 发送命令
        Command {
            command: PhoneCommand,
            params: serde_json::Value,
        },
        /// 请求截图
        RequestScreen {
            include_screenshot: bool,
        },
        /// 直接执行动作（PC 做决策后）
        ExecuteAction {
            action_type: String,  // "click", "swipe", "input", etc.
            target: String,       // 目标描述或坐标
            params: serde_json::Value,
        },
        /// 查询状态
        Query,
    }
    
    /// 手机命令
    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub enum PhoneCommand {
        Pause,
        Resume,
        Stop,
        GetStatus,
        GetScreen,
        Screenshot,
    }
    
    /// 手机 → PC 消息类型
    #[derive(Debug, Clone, Serialize, Deserialize)]
    #[serde(tag = "type", content = "payload")]
    pub enum PhoneTopcMessage {
        /// 状态更新
        Status {
            state: String,
            current_goal: Option<String>,
            progress: f32,
        },
        /// 进度更新
        Progress {
            step_number: u32,
            total_steps: u32,
            current_task: String,
            task_status: String,
            progress_percent: u8,
        },
        /// 屏幕状态
        Screen {
            app_package: Option<String>,
            activity: Option<String>,
            visible_texts: Vec<String>,
            clickable_elements: Vec<String>,
            screenshot_base64: Option<String>,
        },
        /// 执行结果
        Result {
            goal_id: String,
            success: bool,
            steps_executed: u32,
            message: String,
            duration_ms: u64,
        },
        /// 错误
        Error {
            code: String,
            message: String,
            details: Option<String>,
        },
        /// 日志
        Log {
            level: String,
            tag: String,
            message: String,
        },
        /// AI 思考过程（手机本地 AI）
        Thinking {
            thought: String,
            decision: Option<String>,
            action: Option<String>,
        },
    }
    
    /// 连接状态
    #[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
    pub enum PhoneConnectionState {
        Disconnected,
        Connecting,
        Connected,
        Reconnecting,
    }
    
    /// 协同会话状态
    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub struct CollaborationSession {
        /// 连接状态
        pub connection_state: PhoneConnectionState,
        /// 手机 IP:Port
        pub phone_address: Option<String>,
        /// 协同模式
        pub mode: CollaborationMode,
        /// 最后一次心跳
        pub last_heartbeat: Option<u64>,
        /// 当前手机状态
        pub phone_status: Option<PhoneTopcMessage>,
        /// 待发送消息队列
        pub pending_messages: Vec<PcToPhoneMessage>,
    }
    
    impl Default for CollaborationSession {
        fn default() -> Self {
            Self {
                connection_state: PhoneConnectionState::Disconnected,
                phone_address: None,
                mode: CollaborationMode::default(),
                last_heartbeat: None,
                phone_status: None,
                pending_messages: Vec::new(),
            }
        }
    }
    
    /// 协同管理器（单例）
    pub struct CollaborationManager {
        session: Arc<RwLock<CollaborationSession>>,
        // TODO: 添加 WebSocket 客户端
    }
    
    impl CollaborationManager {
        pub fn new() -> Self {
            Self {
                session: Arc::new(RwLock::new(CollaborationSession::default())),
            }
        }
        
        /// 连接到手机
        pub async fn connect(&self, phone_ip: &str, port: u16) -> Result<(), String> {
            let address = format!("{}:{}", phone_ip, port);
            
            {
                let mut session = self.session.write().await;
                session.connection_state = PhoneConnectionState::Connecting;
                session.phone_address = Some(address.clone());
            }
            
            // TODO: 实现实际的 WebSocket 连接
            // let ws = tokio_tungstenite::connect_async(&format!("ws://{}", address)).await?;
            
            {
                let mut session = self.session.write().await;
                session.connection_state = PhoneConnectionState::Connected;
                session.last_heartbeat = Some(std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs());
            }
            
            Ok(())
        }
        
        /// 断开连接
        pub async fn disconnect(&self) {
            let mut session = self.session.write().await;
            session.connection_state = PhoneConnectionState::Disconnected;
            session.phone_address = None;
        }
        
        /// 发送目标到手机
        pub async fn send_goal(&self, description: &str, max_steps: u32, timeout: u32) -> Result<(), String> {
            let session = self.session.read().await;
            if session.connection_state != PhoneConnectionState::Connected {
                return Err("未连接到手机".to_string());
            }
            
            let msg = PcToPhoneMessage::Goal {
                description: description.to_string(),
                max_steps,
                timeout_seconds: timeout,
            };
            
            // TODO: 发送到 WebSocket
            tracing::info!("📱 发送目标到手机: {:?}", msg);
            
            Ok(())
        }
        
        /// 发送命令到手机
        pub async fn send_command(&self, command: PhoneCommand) -> Result<(), String> {
            let session = self.session.read().await;
            if session.connection_state != PhoneConnectionState::Connected {
                return Err("未连接到手机".to_string());
            }
            
            let msg = PcToPhoneMessage::Command {
                command,
                params: serde_json::Value::Null,
            };
            
            tracing::info!("📱 发送命令到手机: {:?}", msg);
            
            Ok(())
        }
        
        /// 请求手机执行动作（PC 做决策后）
        pub async fn execute_on_phone(
            &self,
            action_type: &str,
            target: &str,
            params: serde_json::Value,
        ) -> Result<(), String> {
            let session = self.session.read().await;
            if session.connection_state != PhoneConnectionState::Connected {
                return Err("未连接到手机".to_string());
            }
            
            let msg = PcToPhoneMessage::ExecuteAction {
                action_type: action_type.to_string(),
                target: target.to_string(),
                params,
            };
            
            tracing::info!("📱 请求手机执行动作: {:?}", msg);
            
            Ok(())
        }
        
        /// 获取会话状态
        pub async fn get_session(&self) -> CollaborationSession {
            self.session.read().await.clone()
        }
    }
}

// 导出协同模块类型
pub use agent_runtime_collaboration::{
    CollaborationMode, CollaborationManager, CollaborationSession,
    PhoneConnectionState, PcToPhoneMessage, PhoneTopcMessage, PhoneCommand,
};

// ========== P3: 持久化记忆系统 ==========

/// Agent 记忆系统
/// 
/// 职责：
/// - 记录成功的操作路径（可复用的经验）
/// - 记录失败的尝试（避免重蹈覆辙）
/// - 提供上下文检索（根据当前屏幕找到相关经验）
/// - 跨会话持久化（使用 JSON 文件存储，未来可升级到 SQLite）
mod agent_runtime_memory {
    use serde::{Deserialize, Serialize};
    use std::collections::HashMap;
    use std::path::PathBuf;
    
    /// 操作记录
    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub struct ActionRecord {
        /// 唯一 ID
        pub id: String,
        /// 时间戳
        pub timestamp: u64,
        /// 目标描述
        pub goal: String,
        /// 屏幕上下文（app/activity/关键元素）
        pub screen_context: ScreenContext,
        /// 执行的动作
        pub action: ActionDetail,
        /// 结果
        pub outcome: ActionOutcome,
        /// 重要性评分（0-100，越高越重要）
        pub importance: u8,
        /// 使用次数（复用计数）
        pub use_count: u32,
    }
    
    /// 屏幕上下文
    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub struct ScreenContext {
        /// 当前应用包名
        pub app_package: Option<String>,
        /// 当前 Activity
        pub activity: Option<String>,
        /// 关键可见文本（用于匹配）
        pub key_texts: Vec<String>,
        /// 关键可点击元素
        pub key_elements: Vec<String>,
        /// 上下文哈希（用于快速匹配）
        pub context_hash: String,
    }
    
    impl ScreenContext {
        /// 计算上下文哈希
        pub fn compute_hash(app: Option<&str>, texts: &[String], elements: &[String]) -> String {
            use std::collections::hash_map::DefaultHasher;
            use std::hash::{Hash, Hasher};
            
            let mut hasher = DefaultHasher::new();
            app.hash(&mut hasher);
            // 只取前 5 个文本和元素
            for t in texts.iter().take(5) {
                t.hash(&mut hasher);
            }
            for e in elements.iter().take(5) {
                e.hash(&mut hasher);
            }
            format!("{:x}", hasher.finish())
        }
        
        /// 计算与另一个上下文的相似度 (0.0-1.0)
        pub fn similarity(&self, other: &ScreenContext) -> f32 {
            let mut score = 0.0;
            let mut total_weight = 0.0;
            
            // 1. 应用匹配（权重 0.3）
            if self.app_package == other.app_package {
                score += 0.3;
            }
            total_weight += 0.3;
            
            // 2. Activity 匹配（权重 0.2）
            if self.activity == other.activity {
                score += 0.2;
            }
            total_weight += 0.2;
            
            // 3. 文本重叠（权重 0.3）
            let text_overlap = self.key_texts.iter()
                .filter(|t| other.key_texts.contains(t))
                .count();
            let max_texts = self.key_texts.len().max(other.key_texts.len()).max(1);
            score += 0.3 * (text_overlap as f32 / max_texts as f32);
            total_weight += 0.3;
            
            // 4. 元素重叠（权重 0.2）
            let elem_overlap = self.key_elements.iter()
                .filter(|e| other.key_elements.contains(e))
                .count();
            let max_elems = self.key_elements.len().max(other.key_elements.len()).max(1);
            score += 0.2 * (elem_overlap as f32 / max_elems as f32);
            total_weight += 0.2;
            
            score / total_weight
        }
    }
    
    /// 动作详情
    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub struct ActionDetail {
        /// 动作类型
        pub action_type: String,
        /// 目标元素/位置
        pub target: String,
        /// 额外参数
        pub params: Option<serde_json::Value>,
        /// AI 的推理过程
        pub reasoning: Option<String>,
    }
    
    /// 动作结果
    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub enum ActionOutcome {
        /// 成功
        Success {
            /// 结果描述
            description: String,
            /// 后续屏幕变化
            screen_changed: bool,
        },
        /// 失败
        Failure {
            /// 错误类型
            error_type: String,
            /// 错误描述
            description: String,
        },
        /// 部分成功
        Partial {
            description: String,
        },
    }
    
    impl ActionOutcome {
        pub fn is_success(&self) -> bool {
            matches!(self, ActionOutcome::Success { .. })
        }
    }
    
    /// 记忆存储
    #[derive(Debug, Clone, Serialize, Deserialize, Default)]
    pub struct MemoryStore {
        /// 所有记录（按 ID 索引）
        pub records: HashMap<String, ActionRecord>,
        /// 上下文哈希索引（快速查找）
        pub context_index: HashMap<String, Vec<String>>,
        /// 目标关键词索引
        pub goal_index: HashMap<String, Vec<String>>,
        /// 统计信息
        pub stats: MemoryStats,
    }
    
    /// 统计信息
    #[derive(Debug, Clone, Serialize, Deserialize, Default)]
    pub struct MemoryStats {
        pub total_records: u32,
        pub success_count: u32,
        pub failure_count: u32,
        pub last_updated: u64,
    }
    
    impl MemoryStore {
        /// 最大记录数
        const MAX_RECORDS: usize = 1000;
        
        /// 添加记录
        pub fn add_record(&mut self, record: ActionRecord) {
            let id = record.id.clone();
            let context_hash = record.screen_context.context_hash.clone();
            
            // 更新统计
            if record.outcome.is_success() {
                self.stats.success_count += 1;
            } else {
                self.stats.failure_count += 1;
            }
            self.stats.total_records += 1;
            self.stats.last_updated = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs();
            
            // 添加到索引
            self.context_index
                .entry(context_hash)
                .or_default()
                .push(id.clone());
            
            // 目标关键词索引（简单分词）
            for word in record.goal.split_whitespace() {
                if word.len() >= 2 {
                    self.goal_index
                        .entry(word.to_lowercase())
                        .or_default()
                        .push(id.clone());
                }
            }
            
            // 存储记录
            self.records.insert(id, record);
            
            // 如果超过最大数量，清理旧记录
            if self.records.len() > Self::MAX_RECORDS {
                self.cleanup_old_records();
            }
        }
        
        /// 清理旧记录（保留重要的和常用的）
        fn cleanup_old_records(&mut self) {
            let mut records: Vec<_> = self.records.values().cloned().collect();
            
            // 按重要性 + 使用次数排序
            records.sort_by(|a, b| {
                let score_a = (a.importance as u32) * 10 + a.use_count;
                let score_b = (b.importance as u32) * 10 + b.use_count;
                score_b.cmp(&score_a)
            });
            
            // 保留前 80%
            let keep_count = (Self::MAX_RECORDS as f32 * 0.8) as usize;
            let to_remove: Vec<_> = records.iter()
                .skip(keep_count)
                .map(|r| r.id.clone())
                .collect();
            
            for id in to_remove {
                self.records.remove(&id);
                // TODO: 也从索引中移除
            }
            
            tracing::info!("🧹 清理记忆: 移除 {} 条旧记录", records.len() - keep_count);
        }
        
        /// 根据当前屏幕上下文查找相关经验
        pub fn find_relevant(&self, context: &ScreenContext, limit: usize) -> Vec<&ActionRecord> {
            let mut candidates: Vec<(&ActionRecord, f32)> = Vec::new();
            
            // 1. 先用哈希快速匹配
            if let Some(ids) = self.context_index.get(&context.context_hash) {
                for id in ids {
                    if let Some(record) = self.records.get(id) {
                        candidates.push((record, 1.0));
                    }
                }
            }
            
            // 2. 如果精确匹配不足，用相似度匹配
            if candidates.len() < limit {
                for record in self.records.values() {
                    let sim = context.similarity(&record.screen_context);
                    if sim > 0.5 {
                        // 避免重复
                        if !candidates.iter().any(|(r, _)| r.id == record.id) {
                            candidates.push((record, sim));
                        }
                    }
                }
            }
            
            // 按相似度 + 成功率排序
            candidates.sort_by(|a, b| {
                let score_a = a.1 * (if a.0.outcome.is_success() { 1.5 } else { 0.5 });
                let score_b = b.1 * (if b.0.outcome.is_success() { 1.5 } else { 0.5 });
                score_b.partial_cmp(&score_a).unwrap()
            });
            
            candidates.into_iter()
                .take(limit)
                .map(|(r, _)| r)
                .collect()
        }
        
        /// 根据目标描述查找相关经验
        pub fn find_by_goal(&self, goal: &str, limit: usize) -> Vec<&ActionRecord> {
            let mut matched_ids: HashMap<String, u32> = HashMap::new();
            
            // 分词匹配
            for word in goal.split_whitespace() {
                let word_lower = word.to_lowercase();
                if let Some(ids) = self.goal_index.get(&word_lower) {
                    for id in ids {
                        *matched_ids.entry(id.clone()).or_default() += 1;
                    }
                }
            }
            
            // 按匹配度排序
            let mut results: Vec<_> = matched_ids.into_iter()
                .filter_map(|(id, count)| {
                    self.records.get(&id).map(|r| (r, count))
                })
                .collect();
            
            results.sort_by(|a, b| b.1.cmp(&a.1));
            
            results.into_iter()
                .take(limit)
                .map(|(r, _)| r)
                .collect()
        }
        
        /// 获取成功经验（用于构建提示词）
        pub fn get_success_examples(&self, context: &ScreenContext, limit: usize) -> Vec<String> {
            self.find_relevant(context, limit * 2)
                .into_iter()
                .filter(|r| r.outcome.is_success())
                .take(limit)
                .map(|r| {
                    format!(
                        "- 目标「{}」在类似屏幕上，执行 {}({}) 成功",
                        r.goal, r.action.action_type, r.action.target
                    )
                })
                .collect()
        }
        
        /// 获取失败教训（用于避免重蹈覆辙）
        pub fn get_failure_lessons(&self, context: &ScreenContext, limit: usize) -> Vec<String> {
            self.find_relevant(context, limit * 2)
                .into_iter()
                .filter(|r| !r.outcome.is_success())
                .take(limit)
                .map(|r| {
                    let reason = match &r.outcome {
                        ActionOutcome::Failure { description, .. } => description.as_str(),
                        _ => "未知原因",
                    };
                    format!(
                        "- ⚠️ 避免: {}({}) 失败，原因: {}",
                        r.action.action_type, r.action.target, reason
                    )
                })
                .collect()
        }
    }
    
    /// 记忆管理器
    pub struct MemoryManager {
        store: tokio::sync::RwLock<MemoryStore>,
        file_path: PathBuf,
    }
    
    impl MemoryManager {
        /// 创建记忆管理器
        pub fn new(data_dir: PathBuf) -> Self {
            let file_path = data_dir.join("agent_memory.json");
            let store = if file_path.exists() {
                match std::fs::read_to_string(&file_path) {
                    Ok(json) => serde_json::from_str(&json).unwrap_or_default(),
                    Err(_) => MemoryStore::default(),
                }
            } else {
                MemoryStore::default()
            };
            
            tracing::info!("📚 记忆系统加载: {} 条记录", store.stats.total_records);
            
            Self {
                store: tokio::sync::RwLock::new(store),
                file_path,
            }
        }
        
        /// 记录一次操作
        pub async fn record_action(
            &self,
            goal: &str,
            context: ScreenContext,
            action: ActionDetail,
            outcome: ActionOutcome,
        ) {
            let record = ActionRecord {
                id: uuid::Uuid::new_v4().to_string(),
                timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
                goal: goal.to_string(),
                screen_context: context,
                action,
                outcome,
                importance: 50, // 默认中等重要性
                use_count: 0,
            };
            
            let mut store = self.store.write().await;
            store.add_record(record);
            
            // 异步保存（不阻塞）
            let _ = self.save_async().await;
        }
        
        /// 查询相关经验
        pub async fn query_experience(
            &self,
            context: &ScreenContext,
            goal: Option<&str>,
        ) -> (Vec<String>, Vec<String>) {
            let store = self.store.read().await;
            
            let successes = store.get_success_examples(context, 3);
            let failures = store.get_failure_lessons(context, 2);
            
            // 如果有目标，也按目标查询
            if let Some(goal) = goal {
                let goal_matches = store.find_by_goal(goal, 2);
                let extra_successes: Vec<String> = goal_matches.iter()
                    .filter(|r| r.outcome.is_success())
                    .take(1)
                    .map(|r| format!("- 相似目标「{}」成功经验: {}", r.goal, r.action.action_type))
                    .collect();
                
                let mut all_successes = successes;
                all_successes.extend(extra_successes);
                return (all_successes, failures);
            }
            
            (successes, failures)
        }
        
        /// 保存到文件
        async fn save_async(&self) -> Result<(), String> {
            let store = self.store.read().await;
            let json = serde_json::to_string_pretty(&*store)
                .map_err(|e| e.to_string())?;
            
            std::fs::write(&self.file_path, json)
                .map_err(|e| e.to_string())?;
            
            Ok(())
        }
        
        /// 获取统计信息
        pub async fn get_stats(&self) -> MemoryStats {
            self.store.read().await.stats.clone()
        }
    }
}

// 导出记忆模块类型
pub use agent_runtime_memory::{
    MemoryManager, MemoryStore, ActionRecord, ActionDetail, 
    ActionOutcome, ScreenContext, MemoryStats,
};

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
            // PC-手机协同命令
            connect_phone,
            disconnect_phone,
            send_goal_to_phone,
            execute_action_on_phone,
        ])
        .setup(|app, _| {
            app.manage(AgentRuntimeState::new());
            info!("🤖 Agent Runtime 插件已初始化（含 PC-手机协同）");
            Ok(())
        })
        .build()
}



