// src-tauri/src/core/domain/agent_runtime/agent_memory.rs
// module: agent_runtime | layer: domain | role: Agent 记忆系统
// summary: 定义短期记忆、工作记忆、长期记忆的核心概念

use serde::{Deserialize, Serialize};
use std::collections::VecDeque;
use std::time::SystemTime;

/// 记忆条目类型
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MemoryType {
    /// 用户指令
    UserInstruction,
    /// AI 思考
    AiThought,
    /// 执行的行动
    ActionExecuted,
    /// 观察到的结果
    Observation,
    /// 错误信息
    Error,
    /// 重要发现（可提升到长期记忆）
    Discovery,
    /// 学到的经验
    LessonLearned,
}

/// 单条记忆
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryEntry {
    /// 创建时间
    pub timestamp: SystemTime,
    /// 记忆类型
    pub memory_type: MemoryType,
    /// 内容摘要（用于展示和快速检索）
    pub summary: String,
    /// 详细内容（完整数据）
    pub content: serde_json::Value,
    /// 重要性评分（1-10，用于决定是否保留到长期记忆）
    pub importance: u8,
    /// 关联的目标 ID
    pub goal_id: Option<String>,
}

impl MemoryEntry {
    pub fn new(memory_type: MemoryType, summary: impl Into<String>) -> Self {
        Self {
            timestamp: SystemTime::now(),
            memory_type,
            summary: summary.into(),
            content: serde_json::Value::Null,
            importance: 5,
            goal_id: None,
        }
    }

    pub fn with_content(mut self, content: serde_json::Value) -> Self {
        self.content = content;
        self
    }

    pub fn with_importance(mut self, importance: u8) -> Self {
        self.importance = importance.min(10);
        self
    }

    pub fn with_goal(mut self, goal_id: impl Into<String>) -> Self {
        self.goal_id = Some(goal_id.into());
        self
    }
}

/// 短期记忆（当前会话，滑动窗口）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShortTermMemory {
    /// 记忆条目（最新的在后面）
    entries: VecDeque<MemoryEntry>,
    /// 最大条目数
    max_entries: usize,
}

impl ShortTermMemory {
    pub fn new(max_entries: usize) -> Self {
        Self {
            entries: VecDeque::new(),
            max_entries,
        }
    }

    /// 添加记忆
    pub fn add(&mut self, entry: MemoryEntry) {
        self.entries.push_back(entry);
        while self.entries.len() > self.max_entries {
            self.entries.pop_front();
        }
    }

    /// 获取最近 N 条记忆
    pub fn recent(&self, n: usize) -> Vec<&MemoryEntry> {
        self.entries.iter().rev().take(n).collect()
    }

    /// 获取所有记忆
    pub fn all(&self) -> Vec<&MemoryEntry> {
        self.entries.iter().collect()
    }

    /// 清空
    pub fn clear(&mut self) {
        self.entries.clear();
    }

    /// 转换为 AI 上下文字符串
    pub fn to_context_string(&self, max_tokens_estimate: usize) -> String {
        let mut context = String::new();
        let mut estimated_tokens = 0;

        for entry in self.entries.iter().rev() {
            let entry_str = format!(
                "[{:?}] {}\n",
                entry.memory_type, entry.summary
            );
            let entry_tokens = entry_str.len() / 4; // 粗略估算

            if estimated_tokens + entry_tokens > max_tokens_estimate {
                break;
            }

            context = entry_str + &context;
            estimated_tokens += entry_tokens;
        }

        context
    }
}

impl Default for ShortTermMemory {
    fn default() -> Self {
        Self::new(50) // 默认保留最近 50 条
    }
}

/// 工作记忆（当前任务上下文）
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct WorkingMemory {
    /// 当前目标
    pub current_goal: Option<String>,
    /// 当前计划步骤
    pub current_plan: Vec<String>,
    /// 当前步骤索引
    pub current_step_index: usize,
    /// 当前屏幕状态摘要
    pub screen_state: Option<String>,
    /// 上次行动
    pub last_action: Option<String>,
    /// 上次行动结果
    pub last_result: Option<String>,
    /// 累计尝试次数
    pub attempt_count: u32,
    /// 临时变量（AI 可存储中间结果）
    pub variables: std::collections::HashMap<String, serde_json::Value>,
}

impl WorkingMemory {
    pub fn new() -> Self {
        Self::default()
    }

    /// 重置（开始新任务时）
    pub fn reset(&mut self) {
        *self = Self::default();
    }

    /// 设置目标和计划
    pub fn set_goal_and_plan(&mut self, goal: impl Into<String>, plan: Vec<String>) {
        self.current_goal = Some(goal.into());
        self.current_plan = plan;
        self.current_step_index = 0;
        self.attempt_count = 0;
    }

    /// 前进到下一步
    pub fn advance_step(&mut self) -> bool {
        if self.current_step_index < self.current_plan.len() {
            self.current_step_index += 1;
            self.attempt_count = 0;
            true
        } else {
            false
        }
    }

    /// 获取当前步骤描述
    pub fn current_step(&self) -> Option<&String> {
        self.current_plan.get(self.current_step_index)
    }

    /// 记录行动结果
    pub fn record_action(&mut self, action: impl Into<String>, result: impl Into<String>) {
        self.last_action = Some(action.into());
        self.last_result = Some(result.into());
        self.attempt_count += 1;
    }
}

/// 长期记忆（跨会话，持久化）
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct LongTermMemory {
    /// 学到的经验（应用包名 → 操作技巧）
    pub app_knowledge: std::collections::HashMap<String, Vec<String>>,
    /// 常见错误及解决方案
    pub error_solutions: Vec<ErrorSolution>,
    /// 用户偏好
    pub user_preferences: std::collections::HashMap<String, String>,
    /// 成功的操作模式
    pub successful_patterns: Vec<SuccessPattern>,
}

/// 错误解决方案
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorSolution {
    /// 错误模式（描述或正则）
    pub error_pattern: String,
    /// 解决方案
    pub solution: String,
    /// 成功次数
    pub success_count: u32,
}

/// 成功模式
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SuccessPattern {
    /// 任务类型
    pub task_type: String,
    /// 应用
    pub app: String,
    /// 成功的步骤序列
    pub steps: Vec<String>,
    /// 使用次数
    pub usage_count: u32,
}

impl LongTermMemory {
    pub fn new() -> Self {
        Self::default()
    }

    /// 添加应用知识
    pub fn add_app_knowledge(&mut self, app: impl Into<String>, knowledge: impl Into<String>) {
        self.app_knowledge
            .entry(app.into())
            .or_default()
            .push(knowledge.into());
    }

    /// 获取应用相关知识
    pub fn get_app_knowledge(&self, app: &str) -> Vec<&String> {
        self.app_knowledge
            .get(app)
            .map(|v| v.iter().collect())
            .unwrap_or_default()
    }

    /// 记录成功模式
    pub fn record_success(&mut self, task_type: impl Into<String>, app: impl Into<String>, steps: Vec<String>) {
        self.successful_patterns.push(SuccessPattern {
            task_type: task_type.into(),
            app: app.into(),
            steps,
            usage_count: 1,
        });
    }
}

/// 完整记忆系统
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentMemory {
    pub short_term: ShortTermMemory,
    pub working: WorkingMemory,
    pub long_term: LongTermMemory,
}

impl Default for AgentMemory {
    fn default() -> Self {
        Self {
            short_term: ShortTermMemory::default(),
            working: WorkingMemory::default(),
            long_term: LongTermMemory::default(),
        }
    }
}

impl AgentMemory {
    pub fn new() -> Self {
        Self::default()
    }

    /// 生成 AI 可用的上下文
    pub fn to_ai_context(&self) -> String {
        let mut context = String::new();

        // 工作记忆
        if let Some(goal) = &self.working.current_goal {
            context.push_str(&format!("## 当前目标\n{}\n\n", goal));
        }

        if !self.working.current_plan.is_empty() {
            context.push_str("## 当前计划\n");
            for (i, step) in self.working.current_plan.iter().enumerate() {
                let marker = if i == self.working.current_step_index { "→" } else { " " };
                context.push_str(&format!("{} {}. {}\n", marker, i + 1, step));
            }
            context.push('\n');
        }

        if let Some(last_action) = &self.working.last_action {
            context.push_str(&format!("## 上次行动\n{}\n", last_action));
            if let Some(result) = &self.working.last_result {
                context.push_str(&format!("结果: {}\n\n", result));
            }
        }

        // 短期记忆摘要
        let recent = self.short_term.to_context_string(500);
        if !recent.is_empty() {
            context.push_str("## 近期记录\n");
            context.push_str(&recent);
        }

        context
    }
}
