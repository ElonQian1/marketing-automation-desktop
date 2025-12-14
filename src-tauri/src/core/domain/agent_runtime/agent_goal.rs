// src-tauri/src/core/domain/agent_runtime/agent_goal.rs
// module: agent_runtime | layer: domain | role: 目标管理领域模型
// summary: 定义目标、子目标、完成条件的核心概念

use serde::{Deserialize, Serialize};
use std::time::SystemTime;
use uuid::Uuid;

/// 目标 ID
pub type GoalId = String;

/// 目标优先级
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum GoalPriority {
    Low = 0,
    Normal = 1,
    High = 2,
    Critical = 3,
}

/// 目标状态
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum GoalStatus {
    /// 等待执行
    Pending,
    /// 正在执行
    InProgress,
    /// 暂停（等待人工干预或条件满足）
    Paused,
    /// 成功完成
    Completed,
    /// 失败
    Failed,
    /// 被取消
    Cancelled,
}

/// 目标完成条件类型
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CompletionCriteria {
    /// 屏幕上出现指定文本
    ScreenContainsText(String),
    /// 屏幕上出现指定元素
    ElementExists { text: Option<String>, description: Option<String> },
    /// 执行了指定次数的操作
    ActionCount(u32),
    /// AI 自行判断是否完成
    AiJudgment,
    /// 组合条件：全部满足
    All(Vec<CompletionCriteria>),
    /// 组合条件：任一满足
    Any(Vec<CompletionCriteria>),
}

/// 目标定义
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Goal {
    /// 唯一 ID
    pub id: GoalId,
    /// 目标描述（自然语言）
    pub description: String,
    /// 优先级
    pub priority: GoalPriority,
    /// 当前状态
    pub status: GoalStatus,
    /// 完成条件
    pub completion_criteria: CompletionCriteria,
    /// 父目标 ID（如果是子目标）
    pub parent_id: Option<GoalId>,
    /// 子目标 IDs
    pub sub_goal_ids: Vec<GoalId>,
    /// 创建时间
    pub created_at: SystemTime,
    /// 开始执行时间
    pub started_at: Option<SystemTime>,
    /// 完成时间
    pub completed_at: Option<SystemTime>,
    /// 失败原因
    pub failure_reason: Option<String>,
    /// 进度（0-100）
    pub progress: u8,
    /// 关联的设备 ID
    pub device_id: Option<String>,
    /// 额外上下文（AI 可用）
    pub context: serde_json::Value,
}

impl Goal {
    /// 创建新目标
    pub fn new(description: impl Into<String>) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            description: description.into(),
            priority: GoalPriority::Normal,
            status: GoalStatus::Pending,
            completion_criteria: CompletionCriteria::AiJudgment,
            parent_id: None,
            sub_goal_ids: Vec::new(),
            created_at: SystemTime::now(),
            started_at: None,
            completed_at: None,
            failure_reason: None,
            progress: 0,
            device_id: None,
            context: serde_json::Value::Null,
        }
    }

    /// 设置设备
    pub fn with_device(mut self, device_id: impl Into<String>) -> Self {
        self.device_id = Some(device_id.into());
        self
    }

    /// 设置完成条件
    pub fn with_criteria(mut self, criteria: CompletionCriteria) -> Self {
        self.completion_criteria = criteria;
        self
    }

    /// 设置优先级
    pub fn with_priority(mut self, priority: GoalPriority) -> Self {
        self.priority = priority;
        self
    }

    /// 开始执行
    pub fn start(&mut self) {
        self.status = GoalStatus::InProgress;
        self.started_at = Some(SystemTime::now());
    }

    /// 标记完成
    pub fn complete(&mut self) {
        self.status = GoalStatus::Completed;
        self.completed_at = Some(SystemTime::now());
        self.progress = 100;
    }

    /// 标记失败
    pub fn fail(&mut self, reason: impl Into<String>) {
        self.status = GoalStatus::Failed;
        self.completed_at = Some(SystemTime::now());
        self.failure_reason = Some(reason.into());
    }

    /// 暂停
    pub fn pause(&mut self) {
        self.status = GoalStatus::Paused;
    }

    /// 是否已终止（成功、失败或取消）
    pub fn is_terminal(&self) -> bool {
        matches!(
            self.status,
            GoalStatus::Completed | GoalStatus::Failed | GoalStatus::Cancelled
        )
    }
}

/// 目标树（管理目标层级关系）
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct GoalTree {
    /// 所有目标
    pub goals: std::collections::HashMap<GoalId, Goal>,
    /// 根目标 IDs（没有父目标的目标）
    pub root_goal_ids: Vec<GoalId>,
    /// 当前活跃目标 ID
    pub active_goal_id: Option<GoalId>,
}

impl GoalTree {
    pub fn new() -> Self {
        Self::default()
    }

    /// 添加根目标
    pub fn add_root_goal(&mut self, goal: Goal) -> GoalId {
        let id = goal.id.clone();
        self.root_goal_ids.push(id.clone());
        self.goals.insert(id.clone(), goal);
        id
    }

    /// 添加子目标
    pub fn add_sub_goal(&mut self, parent_id: &GoalId, mut goal: Goal) -> Option<GoalId> {
        goal.parent_id = Some(parent_id.clone());
        let id = goal.id.clone();

        if let Some(parent) = self.goals.get_mut(parent_id) {
            parent.sub_goal_ids.push(id.clone());
            self.goals.insert(id.clone(), goal);
            Some(id)
        } else {
            None
        }
    }

    /// 获取当前活跃目标
    pub fn get_active_goal(&self) -> Option<&Goal> {
        self.active_goal_id.as_ref().and_then(|id| self.goals.get(id))
    }

    /// 获取当前活跃目标（可变）
    pub fn get_active_goal_mut(&mut self) -> Option<&mut Goal> {
        if let Some(id) = self.active_goal_id.clone() {
            self.goals.get_mut(&id)
        } else {
            None
        }
    }

    /// 设置活跃目标
    pub fn set_active_goal(&mut self, goal_id: GoalId) {
        self.active_goal_id = Some(goal_id);
    }

    /// 获取下一个待执行的目标
    pub fn next_pending_goal(&self) -> Option<&Goal> {
        // 优先级排序：高优先级优先
        let mut pending: Vec<_> = self
            .goals
            .values()
            .filter(|g| g.status == GoalStatus::Pending)
            .collect();

        pending.sort_by(|a, b| b.priority.cmp(&a.priority));
        pending.first().copied()
    }
}
