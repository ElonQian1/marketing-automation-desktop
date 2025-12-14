// src-tauri/src/core/domain/agent_runtime/agent_state.rs
// module: agent_runtime | layer: domain | role: Agent 状态机
// summary: 定义 Agent 的运行状态和状态转换规则

use serde::{Deserialize, Serialize};
use std::time::SystemTime;

/// Agent 运行状态
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum AgentRunState {
    /// 空闲：没有目标，等待用户指令
    Idle,
    /// 思考中：AI 正在分析情况并决定下一步
    Thinking,
    /// 执行中：正在执行某个行动
    Executing,
    /// 观察中：等待并观察行动结果
    Observing,
    /// 等待确认：需要人工确认才能继续
    WaitingForApproval,
    /// 暂停：用户主动暂停
    Paused,
    /// 错误恢复中：正在尝试从错误中恢复
    Recovering,
    /// 已停止：Agent 已停止运行
    Stopped,
}

impl AgentRunState {
    /// 是否可以接受新目标
    pub fn can_accept_goal(&self) -> bool {
        matches!(self, Self::Idle | Self::Paused)
    }

    /// 是否正在运行（非终态）
    pub fn is_running(&self) -> bool {
        matches!(
            self,
            Self::Thinking | Self::Executing | Self::Observing | Self::Recovering
        )
    }

    /// 是否可以暂停
    pub fn can_pause(&self) -> bool {
        self.is_running()
    }

    /// 是否可以恢复
    pub fn can_resume(&self) -> bool {
        matches!(self, Self::Paused | Self::WaitingForApproval)
    }
}

/// Agent 状态快照
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentStateSnapshot {
    /// 运行状态
    pub run_state: AgentRunState,
    /// 当前设备 ID
    pub current_device_id: Option<String>,
    /// 当前目标描述
    pub current_goal_description: Option<String>,
    /// 当前目标进度
    pub current_goal_progress: u8,
    /// 已完成目标数
    pub completed_goals_count: u32,
    /// 失败目标数
    pub failed_goals_count: u32,
    /// 连续失败次数
    pub consecutive_failures: u32,
    /// 最近一次行动
    pub last_action: Option<String>,
    /// 最近一次行动结果
    pub last_action_result: Option<String>,
    /// 运行开始时间
    pub started_at: Option<SystemTime>,
    /// 总运行时间（秒）
    pub total_runtime_secs: u64,
    /// 等待审批的行动描述
    pub pending_approval_action: Option<String>,
}

impl Default for AgentStateSnapshot {
    fn default() -> Self {
        Self {
            run_state: AgentRunState::Idle,
            current_device_id: None,
            current_goal_description: None,
            current_goal_progress: 0,
            completed_goals_count: 0,
            failed_goals_count: 0,
            consecutive_failures: 0,
            last_action: None,
            last_action_result: None,
            started_at: None,
            total_runtime_secs: 0,
            pending_approval_action: None,
        }
    }
}

/// 状态转换事件
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StateTransitionEvent {
    /// 接收到新目标
    GoalReceived,
    /// 开始思考
    StartThinking,
    /// 思考完成，决定行动
    ActionDecided,
    /// 行动执行完成
    ActionCompleted,
    /// 行动执行失败
    ActionFailed,
    /// 需要人工审批
    ApprovalRequired,
    /// 人工批准
    Approved,
    /// 人工拒绝
    Rejected,
    /// 用户暂停
    UserPause,
    /// 用户恢复
    UserResume,
    /// 目标完成
    GoalCompleted,
    /// 目标失败
    GoalFailed,
    /// 用户停止
    UserStop,
    /// 错误发生
    ErrorOccurred,
    /// 恢复成功
    RecoverySuccess,
    /// 恢复失败
    RecoveryFailed,
}

/// 状态机：管理状态转换
pub struct AgentStateMachine {
    current: AgentRunState,
}

impl AgentStateMachine {
    pub fn new() -> Self {
        Self {
            current: AgentRunState::Idle,
        }
    }

    pub fn current(&self) -> AgentRunState {
        self.current
    }

    /// 尝试状态转换，返回是否成功
    pub fn transition(&mut self, event: StateTransitionEvent) -> Result<AgentRunState, String> {
        use AgentRunState::*;
        use StateTransitionEvent::*;

        let next = match (&self.current, &event) {
            // Idle 状态转换
            (Idle, GoalReceived) => Thinking,
            
            // Thinking 状态转换
            (Thinking, ActionDecided) => Executing,
            (Thinking, ApprovalRequired) => WaitingForApproval,
            (Thinking, GoalCompleted) => Idle,
            (Thinking, GoalFailed) => Idle,
            (Thinking, UserPause) => Paused,
            (Thinking, UserStop) => Stopped,
            
            // Executing 状态转换
            (Executing, ActionCompleted) => Observing,
            (Executing, ActionFailed) => Recovering,
            (Executing, UserPause) => Paused,
            (Executing, UserStop) => Stopped,
            
            // Observing 状态转换
            (Observing, StartThinking) => Thinking,
            (Observing, GoalCompleted) => Idle,
            (Observing, ErrorOccurred) => Recovering,
            (Observing, UserPause) => Paused,
            (Observing, UserStop) => Stopped,
            
            // WaitingForApproval 状态转换
            (WaitingForApproval, Approved) => Executing,
            (WaitingForApproval, Rejected) => Thinking, // 重新思考
            (WaitingForApproval, UserStop) => Stopped,
            
            // Paused 状态转换
            (Paused, UserResume) => Thinking,
            (Paused, UserStop) => Stopped,
            
            // Recovering 状态转换
            (Recovering, RecoverySuccess) => Thinking,
            (Recovering, RecoveryFailed) => Paused, // 恢复失败，暂停等待人工干预
            (Recovering, UserStop) => Stopped,
            
            // Stopped 是终态，只能重新开始
            (Stopped, GoalReceived) => Thinking,
            
            // 无效转换
            (current, event) => {
                return Err(format!(
                    "Invalid transition: {:?} + {:?}",
                    current, event
                ));
            }
        };

        self.current = next;
        Ok(next)
    }

    /// 强制设置状态（仅用于恢复/初始化）
    pub fn force_set(&mut self, state: AgentRunState) {
        self.current = state;
    }
}

impl Default for AgentStateMachine {
    fn default() -> Self {
        Self::new()
    }
}
