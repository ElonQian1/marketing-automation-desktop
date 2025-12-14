// src-tauri/src/core/application/agent_loop.rs
// module: core/application | layer: application | role: Agent 自主循环引擎
// summary: 实现 观察→思考→行动→评估 的自主循环

use crate::core::application::agent_runtime_service::*;
use crate::core::domain::agent_runtime::*;
use crate::core::domain::agent::{AiProvider, ToolProvider};
use std::sync::Arc;
use tokio::sync::{mpsc, watch};
use tokio::time::{Duration, timeout};
use tracing::{info, warn, error, debug};

/// Agent 循环配置
#[derive(Debug, Clone)]
pub struct AgentLoopConfig {
    /// 每次循环的最大等待时间
    pub max_iteration_timeout: Duration,
    /// AI 思考超时
    pub ai_thinking_timeout: Duration,
    /// 行动执行超时
    pub action_timeout: Duration,
    /// 观察间隔
    pub observation_interval: Duration,
}

impl Default for AgentLoopConfig {
    fn default() -> Self {
        Self {
            max_iteration_timeout: Duration::from_secs(60),
            ai_thinking_timeout: Duration::from_secs(30),
            action_timeout: Duration::from_secs(10),
            observation_interval: Duration::from_millis(500),
        }
    }
}

/// Agent 循环引擎
pub struct AgentLoop<AI, Tools>
where
    AI: AiProvider + Send + Sync + 'static,
    Tools: ToolProvider + Send + Sync + 'static,
{
    /// 共享运行时状态
    runtime: SharedAgentRuntime,
    /// AI 提供者
    ai_provider: Arc<AI>,
    /// 工具提供者
    tool_provider: Arc<Tools>,
    /// 循环配置
    config: AgentLoopConfig,
    /// 事件发送器
    event_tx: mpsc::Sender<AgentEvent>,
    /// 停止信号接收器
    stop_rx: watch::Receiver<bool>,
}

impl<AI, Tools> AgentLoop<AI, Tools>
where
    AI: AiProvider + Send + Sync + 'static,
    Tools: ToolProvider + Send + Sync + 'static,
{
    pub fn new(
        runtime: SharedAgentRuntime,
        ai_provider: Arc<AI>,
        tool_provider: Arc<Tools>,
        config: AgentLoopConfig,
        event_tx: mpsc::Sender<AgentEvent>,
        stop_rx: watch::Receiver<bool>,
    ) -> Self {
        Self {
            runtime,
            ai_provider,
            tool_provider,
            config,
            event_tx,
            stop_rx,
        }
    }

    /// 运行主循环
    pub async fn run(&mut self) -> Result<(), String> {
        info!("🤖 Agent 循环启动");

        loop {
            // 检查停止信号
            if *self.stop_rx.borrow() {
                info!("🛑 收到停止信号，退出循环");
                break;
            }

            // 获取当前状态
            let state = {
                let runtime = self.runtime.read().await;
                runtime.current_state()
            };

            match state {
                AgentRunState::Idle => {
                    // 空闲状态，等待新目标
                    tokio::time::sleep(Duration::from_millis(100)).await;
                    continue;
                }
                AgentRunState::Thinking => {
                    // 思考阶段：让 AI 决定下一步
                    if let Err(e) = self.think_phase().await {
                        error!("思考阶段错误: {}", e);
                        self.send_event(AgentEvent::Error { message: e.clone() }).await;
                        self.transition_to_recovering().await;
                    }
                }
                AgentRunState::Executing => {
                    // 执行阶段：执行 AI 决定的行动
                    if let Err(e) = self.execute_phase().await {
                        error!("执行阶段错误: {}", e);
                        self.send_event(AgentEvent::Error { message: e.clone() }).await;
                        self.transition_to_recovering().await;
                    }
                }
                AgentRunState::Observing => {
                    // 观察阶段：等待并检查结果
                    if let Err(e) = self.observe_phase().await {
                        error!("观察阶段错误: {}", e);
                        self.send_event(AgentEvent::Error { message: e.clone() }).await;
                    }
                }
                AgentRunState::WaitingForApproval => {
                    // 等待人工确认，不做任何事
                    tokio::time::sleep(Duration::from_millis(100)).await;
                    continue;
                }
                AgentRunState::Paused => {
                    // 暂停状态，等待恢复
                    tokio::time::sleep(Duration::from_millis(100)).await;
                    continue;
                }
                AgentRunState::Recovering => {
                    // 恢复阶段：尝试从错误中恢复
                    if let Err(e) = self.recovery_phase().await {
                        error!("恢复失败: {}", e);
                        // 恢复失败，暂停等待人工干预
                        let mut runtime = self.runtime.write().await;
                        let _ = runtime.handle_command(AgentCommand::Pause);
                    }
                }
                AgentRunState::Stopped => {
                    info!("🛑 Agent 已停止");
                    break;
                }
            }

            // 循环间隔
            tokio::time::sleep(self.config.observation_interval).await;
        }

        Ok(())
    }

    /// 思考阶段：让 AI 分析当前状态并决定下一步
    async fn think_phase(&mut self) -> Result<(), String> {
        debug!("🧠 进入思考阶段");

        // 获取上下文
        let (goal_description, device_id, memory_context) = {
            let runtime = self.runtime.read().await;
            let goal = runtime.get_active_goal_description().unwrap_or_default();
            let device = runtime.get_current_device_id().unwrap_or_default();
            let memory = runtime.get_ai_context();
            (goal, device, memory)
        };

        // 构建 AI 提示
        let prompt = format!(
            r#"## 当前任务
{}

## 设备
{}

## 上下文
{}

## 指令
分析当前情况，决定下一步行动。使用可用的工具执行操作。
如果任务已完成，回复 "[GOAL_COMPLETED]"。
如果无法继续，说明原因。"#,
            goal_description, device_id, memory_context
        );

        self.send_event(AgentEvent::AiThinking { thought: "正在分析情况...".to_string() }).await;

        // 调用 AI（这里需要实际实现）
        // let response = self.ai_provider.chat(&prompt).await?;
        
        // TODO: 解析 AI 响应，提取要执行的行动
        // 暂时模拟
        
        // 转换到执行阶段
        {
            let mut runtime = self.runtime.write().await;
            let _ = runtime.transition_action_decided();
        }

        self.send_event(AgentEvent::StateChanged { state: AgentRunState::Executing }).await;

        Ok(())
    }

    /// 执行阶段：执行决定的行动
    async fn execute_phase(&mut self) -> Result<(), String> {
        debug!("⚡ 进入执行阶段");

        // TODO: 获取待执行的行动并执行
        // 暂时模拟成功
        
        // 记录行动结果
        {
            let mut runtime = self.runtime.write().await;
            runtime.record_action_result("模拟行动", "成功", true);
        }

        // 转换到观察阶段
        {
            let mut runtime = self.runtime.write().await;
            let _ = runtime.transition_action_completed();
        }

        self.send_event(AgentEvent::StateChanged { state: AgentRunState::Observing }).await;
        self.send_event(AgentEvent::ActionExecuted {
            action: "模拟行动".to_string(),
            result: "成功".to_string(),
            success: true,
        }).await;

        Ok(())
    }

    /// 观察阶段：检查行动结果，决定是否继续
    async fn observe_phase(&mut self) -> Result<(), String> {
        debug!("👁️ 进入观察阶段");

        // 等待观察间隔
        tokio::time::sleep(self.config.observation_interval).await;

        // TODO: 获取屏幕状态，检查目标是否完成
        // 暂时直接回到思考阶段

        // 检查是否需要人工干预
        let needs_intervention = {
            let runtime = self.runtime.read().await;
            runtime.needs_human_intervention()
        };

        if needs_intervention {
            warn!("⚠️ 连续失败次数过多，需要人工干预");
            let mut runtime = self.runtime.write().await;
            let _ = runtime.handle_command(AgentCommand::Pause);
            return Ok(());
        }

        // 回到思考阶段
        {
            let mut runtime = self.runtime.write().await;
            let _ = runtime.transition_start_thinking();
        }

        self.send_event(AgentEvent::StateChanged { state: AgentRunState::Thinking }).await;

        Ok(())
    }

    /// 恢复阶段：尝试从错误中恢复
    async fn recovery_phase(&mut self) -> Result<(), String> {
        debug!("🔧 进入恢复阶段");

        // TODO: 实现恢复策略
        // - 重试上一个行动
        // - 回到上一个稳定状态
        // - 请求 AI 提供替代方案

        // 暂时直接标记恢复成功，回到思考阶段
        {
            let mut runtime = self.runtime.write().await;
            let _ = runtime.transition_recovery_success();
        }

        self.send_event(AgentEvent::StateChanged { state: AgentRunState::Thinking }).await;

        Ok(())
    }

    /// 辅助：转换到恢复状态
    async fn transition_to_recovering(&mut self) {
        let mut runtime = self.runtime.write().await;
        let _ = runtime.transition_error_occurred();
    }

    /// 辅助：发送事件
    async fn send_event(&self, event: AgentEvent) {
        if let Err(e) = self.event_tx.send(event).await {
            warn!("发送事件失败: {}", e);
        }
    }
}
