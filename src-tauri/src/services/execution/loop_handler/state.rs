/// 循环状态管理器
/// 
/// 职责：
/// - 维护循环栈，支持嵌套循环
/// - 管理循环上下文和状态
/// - 提供循环生命周期管理

use anyhow::{Result, anyhow};
use std::collections::VecDeque;
use tracing::{info, warn, debug};

use super::types::{LoopConfig, LoopContext, LoopState};

/// 循环状态管理器
pub struct LoopStateManager {
    /// 循环栈，支持嵌套循环
    loop_stack: VecDeque<LoopContext>,
    /// 当前状态
    current_state: LoopState,
    /// 最大嵌套深度
    max_nest_depth: usize,
}

impl LoopStateManager {
    /// 创建新的状态管理器
    pub fn new() -> Self {
        Self {
            loop_stack: VecDeque::new(),
            current_state: LoopState::Idle,
            max_nest_depth: 10, // 防止无限递归
        }
    }

    /// 开始新循环
    pub fn start_loop(&mut self, config: LoopConfig) -> Result<LoopContext> {
        // 检查嵌套深度
        if self.loop_stack.len() >= self.max_nest_depth {
            return Err(anyhow!("循环嵌套深度超过限制: {}", self.max_nest_depth));
        }

        let context = LoopContext {
            loop_id: config.loop_id.clone(),
            loop_name: config.loop_name.clone(),
            current_iteration: 0,
            max_iterations: config.max_iterations,
            is_infinite: config.is_infinite,
            start_time: std::time::Instant::now(),
            interval_ms: config.interval_ms,
            continue_on_error: config.continue_on_error,
            variables: std::collections::HashMap::new(),
        };

        info!("🔄 开始循环: {} (ID: {}), 最大迭代: {}", 
              config.loop_name, config.loop_id, config.max_iterations);

        self.loop_stack.push_back(context.clone());
        self.current_state = LoopState::Collecting;

        Ok(context)
    }

    /// 结束当前循环
    pub fn end_loop(&mut self) -> Result<Option<LoopContext>> {
        if let Some(context) = self.loop_stack.pop_back() {
            let elapsed = context.start_time.elapsed();
            info!("🏁 循环结束: {} (ID: {}), 总耗时: {:?}", 
                  context.loop_name, context.loop_id, elapsed);

            // 如果还有外层循环，恢复到收集状态；否则回到空闲状态
            self.current_state = if self.loop_stack.is_empty() {
                LoopState::Idle
            } else {
                LoopState::Collecting
            };

            Ok(Some(context))
        } else {
            warn!("⚠️ 尝试结束循环但栈为空");
            Ok(None)
        }
    }

    /// 获取当前循环上下文
    pub fn current_loop(&self) -> Option<&LoopContext> {
        self.loop_stack.back()
    }

    /// 获取可变的当前循环上下文
    pub fn current_loop_mut(&mut self) -> Option<&mut LoopContext> {
        self.loop_stack.back_mut()
    }

    /// 检查是否在循环中
    pub fn is_in_loop(&self) -> bool {
        !self.loop_stack.is_empty()
    }

    /// 获取当前状态
    pub fn current_state(&self) -> &LoopState {
        &self.current_state
    }

    /// 设置状态
    pub fn set_state(&mut self, state: LoopState) {
        debug!("循环状态变更: {:?} -> {:?}", self.current_state, state);
        self.current_state = state;
    }

    /// 获取嵌套深度
    pub fn nest_depth(&self) -> usize {
        self.loop_stack.len()
    }

    /// 开始迭代
    pub fn start_iteration(&mut self) -> Result<u32> {
        let iteration_number = if let Some(context) = self.current_loop_mut() {
            context.current_iteration += 1;
            let iteration = context.current_iteration;
            let loop_name = context.loop_name.clone();
            
            debug!("🔄 开始第 {} 次迭代 (循环: {})", iteration, loop_name);
            iteration
        } else {
            return Err(anyhow!("没有活跃的循环"));
        };
        
        self.current_state = LoopState::Executing;
        Ok(iteration_number)
    }

    /// 完成迭代
    pub fn complete_iteration(&mut self) -> Result<bool> {
        if let Some(context) = self.current_loop() {
            let should_continue = if context.is_infinite {
                true // 无限循环总是继续
            } else {
                context.current_iteration < context.max_iterations
            };

            if should_continue {
                self.current_state = LoopState::Collecting;
            } else {
                self.current_state = LoopState::Completed;
            }

            Ok(should_continue)
        } else {
            Err(anyhow!("没有活跃的循环"))
        }
    }

    /// 设置循环变量
    pub fn set_loop_variable(&mut self, key: String, value: serde_json::Value) -> Result<()> {
        if let Some(context) = self.current_loop_mut() {
            context.variables.insert(key, value);
            Ok(())
        } else {
            Err(anyhow!("没有活跃的循环"))
        }
    }

    /// 获取循环变量
    pub fn get_loop_variable(&self, key: &str) -> Option<&serde_json::Value> {
        self.current_loop()?.variables.get(key)
    }

    /// 获取所有循环信息（用于调试）
    pub fn debug_info(&self) -> serde_json::Value {
        serde_json::json!({
            "state": format!("{:?}", self.current_state),
            "nest_depth": self.nest_depth(),
            "max_nest_depth": self.max_nest_depth,
            "loops": self.loop_stack.iter().map(|ctx| {
                serde_json::json!({
                    "id": ctx.loop_id,
                    "name": ctx.loop_name,
                    "current_iteration": ctx.current_iteration,
                    "max_iterations": ctx.max_iterations,
                    "is_infinite": ctx.is_infinite,
                    "elapsed_ms": ctx.start_time.elapsed().as_millis(),
                })
            }).collect::<Vec<_>>()
        })
    }

    /// 清空所有循环状态（错误恢复用）
    pub fn clear_all(&mut self) {
        warn!("🧹 清空所有循环状态");
        self.loop_stack.clear();
        self.current_state = LoopState::Idle;
    }
}

impl Default for LoopStateManager {
    fn default() -> Self {
        Self::new()
    }
}