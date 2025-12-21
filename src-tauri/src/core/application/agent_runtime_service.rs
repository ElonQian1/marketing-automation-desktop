// src-tauri/src/core/application/agent_runtime_service.rs
// module: core/application | layer: application | role: Agent 运行时服务
// summary: Agent 自主运行循环的核心实现

use crate::core::domain::agent_runtime::*;
use crate::core::domain::agent::{AgentSession, AiProvider, ToolProvider};
use std::sync::Arc;
use tokio::sync::{mpsc, RwLock, watch};
use tracing::{info, warn, error};

/// Agent 控制命令
#[derive(Debug, Clone)]
pub enum AgentCommand {
    /// 启动并执行目标
    Start { goal: String, device_id: String },
    /// 暂停
    Pause,
    /// 恢复
    Resume,
    /// 停止
    Stop,
    /// 批准待定行动
    Approve,
    /// 拒绝待定行动
    Reject,
}

/// Agent 事件（用于通知前端）
#[derive(Debug, Clone, serde::Serialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum AgentEvent {
    /// 状态变化
    StateChanged { state: AgentRunState },
    /// 目标进度更新
    GoalProgress { goal_id: String, progress: u8, description: String },
    /// 行动执行
    ActionExecuted { action: String, result: String, success: bool },
    /// 需要人工确认
    ApprovalRequired { action: String, risk_level: String },
    /// 目标完成
    GoalCompleted { goal_id: String },
    /// 目标失败
    GoalFailed { goal_id: String, reason: String },
    /// AI 思考
    AiThinking { thought: String },
    /// 错误
    Error { message: String },
}

/// Agent 运行时核心
pub struct AgentRuntime {
    /// 配置
    config: AgentConfig,
    /// 运行模式
    mode: AgentMode,
    /// 状态机
    state_machine: AgentStateMachine,
    /// 目标树
    goals: GoalTree,
    /// 记忆系统
    memory: AgentMemory,
    /// 当前设备 ID
    current_device_id: Option<String>,
    /// AI 会话
    ai_session: Option<AgentSession>,
    /// 连续失败计数
    consecutive_failures: u32,
    /// 待执行的动作名称
    pending_action_name: Option<String>,
    /// 待执行的动作参数（JSON 字符串）
    pending_action_params: Option<String>,
}

impl AgentRuntime {
    pub fn new(config: AgentConfig, mode: AgentMode) -> Self {
        Self {
            config,
            mode,
            state_machine: AgentStateMachine::new(),
            goals: GoalTree::new(),
            memory: AgentMemory::new(),
            current_device_id: None,
            ai_session: None,
            consecutive_failures: 0,
            pending_action_name: None,
            pending_action_params: None,
        }
    }

    /// 获取当前状态快照
    pub fn snapshot(&self) -> AgentStateSnapshot {
        AgentStateSnapshot {
            run_state: self.state_machine.current(),
            current_device_id: self.current_device_id.clone(),
            current_goal_description: self.goals.get_active_goal().map(|g| g.description.clone()),
            current_goal_progress: self.goals.get_active_goal().map(|g| g.progress).unwrap_or(0),
            completed_goals_count: self.goals.goals.values().filter(|g| g.status == GoalStatus::Completed).count() as u32,
            failed_goals_count: self.goals.goals.values().filter(|g| g.status == GoalStatus::Failed).count() as u32,
            consecutive_failures: self.consecutive_failures,
            last_action: self.memory.working.last_action.clone(),
            last_action_result: self.memory.working.last_result.clone(),
            started_at: None, // TODO: track
            total_runtime_secs: 0, // TODO: track
            pending_approval_action: None, // TODO: track
        }
    }

    /// 设置目标
    pub fn set_goal(&mut self, description: impl Into<String>, device_id: impl Into<String>) -> GoalId {
        let goal = Goal::new(description).with_device(device_id);
        let goal_id = self.goals.add_root_goal(goal);
        self.current_device_id = self.goals.goals.get(&goal_id).and_then(|g| g.device_id.clone());
        goal_id
    }

    /// 处理命令
    pub fn handle_command(&mut self, command: AgentCommand) -> Result<(), String> {
        match command {
            AgentCommand::Start { goal, device_id } => {
                if !self.state_machine.current().can_accept_goal() {
                    return Err("当前状态无法接受新目标".to_string());
                }
                let goal_id = self.set_goal(goal, device_id);
                self.goals.set_active_goal(goal_id);
                self.state_machine.transition(StateTransitionEvent::GoalReceived)?;
                self.memory.working.reset();
                Ok(())
            }
            AgentCommand::Pause => {
                if !self.state_machine.current().can_pause() {
                    return Err("当前状态无法暂停".to_string());
                }
                self.state_machine.transition(StateTransitionEvent::UserPause)?;
                Ok(())
            }
            AgentCommand::Resume => {
                if !self.state_machine.current().can_resume() {
                    return Err("当前状态无法恢复".to_string());
                }
                self.state_machine.transition(StateTransitionEvent::UserResume)?;
                Ok(())
            }
            AgentCommand::Stop => {
                self.state_machine.transition(StateTransitionEvent::UserStop)?;
                Ok(())
            }
            AgentCommand::Approve => {
                if self.state_machine.current() != AgentRunState::WaitingForApproval {
                    return Err("当前没有待审批的行动".to_string());
                }
                self.state_machine.transition(StateTransitionEvent::Approved)?;
                Ok(())
            }
            AgentCommand::Reject => {
                if self.state_machine.current() != AgentRunState::WaitingForApproval {
                    return Err("当前没有待审批的行动".to_string());
                }
                self.state_machine.transition(StateTransitionEvent::Rejected)?;
                Ok(())
            }
        }
    }

    /// 获取当前运行状态
    pub fn current_state(&self) -> AgentRunState {
        self.state_machine.current()
    }

    /// 记录行动结果
    pub fn record_action_result(&mut self, action: &str, result: &str, success: bool) {
        use crate::core::domain::agent_runtime::MemoryType;
        
        self.memory.working.record_action(action, result);
        
        let memory_entry = MemoryEntry::new(
            if success { MemoryType::ActionExecuted } else { MemoryType::Error },
            format!("{}: {}", action, result)
        );
        self.memory.short_term.add(memory_entry);

        if success {
            self.consecutive_failures = 0;
        } else {
            self.consecutive_failures += 1;
        }
    }

    /// 检查是否需要人工干预
    pub fn needs_human_intervention(&self) -> bool {
        self.consecutive_failures >= self.config.max_consecutive_failures
    }

    /// 检查行动是否需要审批
    pub fn needs_approval(&self, action: &ActionType) -> bool {
        match self.mode {
            AgentMode::Supervised => true, // 监督模式：所有行动都需要确认
            AgentMode::SemiAutonomous => {
                // 半自主：高风险及以上需要确认
                self.config.require_human_approval_for_risky 
                    && action.risk_level() >= RiskLevel::High
            }
            AgentMode::Autonomous => false, // 完全自主：不需要确认
        }
    }

    /// 获取 AI 上下文
    pub fn get_ai_context(&self) -> String {
        self.memory.to_ai_context()
    }

    /// 更新目标进度
    pub fn update_goal_progress(&mut self, progress: u8) {
        if let Some(goal) = self.goals.get_active_goal_mut() {
            goal.progress = progress.min(100);
        }
    }

    /// 完成当前目标
    pub fn complete_current_goal(&mut self) {
        if let Some(goal) = self.goals.get_active_goal_mut() {
            goal.complete();
        }
        let _ = self.state_machine.transition(StateTransitionEvent::GoalCompleted);
    }

    /// 标记当前目标失败
    pub fn fail_current_goal(&mut self, reason: impl Into<String>) {
        if let Some(goal) = self.goals.get_active_goal_mut() {
            goal.fail(reason);
        }
        let _ = self.state_machine.transition(StateTransitionEvent::GoalFailed);
    }

    // ========== Agent Loop 专用方法 ==========

    /// 获取当前目标描述
    pub fn get_active_goal_description(&self) -> Option<String> {
        self.goals.get_active_goal().map(|g| g.description.clone())
    }

    /// 获取当前设备 ID
    pub fn get_current_device_id(&self) -> Option<String> {
        self.current_device_id.clone()
    }

    /// 状态转换：行动已决定
    pub fn transition_action_decided(&mut self) -> Result<AgentRunState, String> {
        self.state_machine.transition(StateTransitionEvent::ActionDecided)
    }

    /// 状态转换：行动已完成
    pub fn transition_action_completed(&mut self) -> Result<AgentRunState, String> {
        self.state_machine.transition(StateTransitionEvent::ActionCompleted)
    }

    /// 状态转换：开始思考
    pub fn transition_start_thinking(&mut self) -> Result<AgentRunState, String> {
        self.state_machine.transition(StateTransitionEvent::StartThinking)
    }

    /// 状态转换：恢复成功
    pub fn transition_recovery_success(&mut self) -> Result<AgentRunState, String> {
        self.state_machine.transition(StateTransitionEvent::RecoverySuccess)
    }

    /// 状态转换：错误发生
    pub fn transition_error_occurred(&mut self) -> Result<AgentRunState, String> {
        self.state_machine.transition(StateTransitionEvent::ErrorOccurred)
    }

    /// 状态转换：需要审批
    pub fn transition_approval_required(&mut self) -> Result<AgentRunState, String> {
        self.state_machine.transition(StateTransitionEvent::ApprovalRequired)
    }

    /// 状态转换：行动失败
    pub fn transition_action_failed(&mut self) -> Result<AgentRunState, String> {
        self.consecutive_failures += 1;
        self.state_machine.transition(StateTransitionEvent::ErrorOccurred)
    }

    /// 设置待执行的动作
    pub fn set_pending_action(&mut self, action_name: String, params: String) {
        self.pending_action_name = Some(action_name);
        self.pending_action_params = Some(params);
    }

    /// 获取并清除待执行的动作
    pub fn get_pending_action(&self) -> (Option<String>, Option<String>) {
        (self.pending_action_name.clone(), self.pending_action_params.clone())
    }

    /// 清除待执行的动作
    pub fn clear_pending_action(&mut self) {
        self.pending_action_name = None;
        self.pending_action_params = None;
    }

    /// 获取连续失败次数
    pub fn consecutive_failures(&self) -> u32 {
        self.consecutive_failures
    }

    /// 获取最后一次错误信息
    pub fn last_error(&self) -> Option<String> {
        // 从工作记忆中获取最后的失败结果
        if let Some(result) = &self.memory.working.last_result {
            if result.contains("失败") || result.contains("error") || result.contains("Error") {
                return Some(result.clone());
            }
        }
        None
    }
}

/// 共享的 Agent 运行时状态
pub type SharedAgentRuntime = Arc<RwLock<AgentRuntime>>;

/// 创建新的共享运行时
pub fn create_shared_runtime(config: AgentConfig, mode: AgentMode) -> SharedAgentRuntime {
    Arc::new(RwLock::new(AgentRuntime::new(config, mode)))
}
