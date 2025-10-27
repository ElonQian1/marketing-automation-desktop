/// Loop Handler 主模块
/// module: adb | layer: services | role: 循环处理器统一入口
/// summary: 提供后端原生循环处理能力，支持嵌套循环、状态管理、执行控制

// 导入所有子模块
pub mod types;
pub mod state;
pub mod executor;
pub mod parser;

// 重新导出主要类型
pub use types::{LoopConfig, LoopContext, LoopHandleResult, LoopExecutionResult, LoopState};
pub use state::LoopStateManager;
pub use executor::LoopExecutor;
pub use parser::LoopConfigParser;

use anyhow::{Result, anyhow};
use tracing::{info, error, debug};

use crate::services::execution::model::SmartScriptStep;
use crate::services::execution::SmartScriptOrchestrator;

/// 主循环处理器
pub struct LoopHandler<'a> {
    /// 状态管理器
    state_manager: LoopStateManager,
    /// 执行器
    executor: LoopExecutor<'a>,
    /// 是否在收集模式
    collecting_mode: bool,
}

impl<'a> LoopHandler<'a> {
    /// 创建新的循环处理器
    pub fn new() -> Self {
        Self {
            state_manager: LoopStateManager::new(),
            executor: LoopExecutor::new(),
            collecting_mode: false,
        }
    }

    /// 设置编排器引用
    pub fn set_orchestrator(&mut self, orchestrator: &'a SmartScriptOrchestrator<'a>) {
        self.executor.set_orchestrator(orchestrator);
    }

    /// 处理循环开始
    pub async fn handle_loop_start(&mut self, config: LoopConfig) -> Result<LoopHandleResult> {
        info!("🔄 开始处理循环: {}", config.loop_name);
        
        // 验证配置
        debug!("📋 验证循环配置...");
        
        // 使用状态管理器开始循环
        let context = self.state_manager.start_loop(config)?;
        
        // 清空执行器的步骤收集
        self.executor.clear_steps();
        self.collecting_mode = true;
        
        info!("✅ 循环已开始，进入步骤收集模式");

        Ok(LoopHandleResult::LoopStarted {
            context,
            message: format!("循环 {} 已开始，正在收集步骤...", self.state_manager.current_loop().unwrap().loop_name),
        })
    }

    /// 处理循环结束
    pub async fn handle_loop_end(&mut self) -> Result<LoopHandleResult> {
        if !self.state_manager.is_in_loop() {
            return Err(anyhow!("当前没有活跃的循环"));
        }

        let loop_name = self.state_manager.current_loop().unwrap().loop_name.clone();
        info!("🏁 结束循环: {}", loop_name);
        
        // 退出收集模式，开始执行
        self.collecting_mode = false;
        
        // 获取当前循环上下文
        let context = self.state_manager.current_loop()
            .ok_or_else(|| anyhow!("没有活跃的循环上下文"))?
            .clone();
        
        info!("🚀 开始执行循环，共收集到 {} 个步骤", self.executor.step_count());
        
        // 执行完整循环
        let execution_result = self.executor.execute_loop(&context).await?;
        
        // 结束循环状态
        self.state_manager.end_loop()?;
        
        info!("🎉 循环执行完成: {} - 成功迭代: {}/{}", 
              execution_result.loop_name, 
              execution_result.successful_iterations,
              execution_result.total_iterations);

        Ok(LoopHandleResult::LoopCompleted {
            result: execution_result,
            message: format!("循环 {} 执行完成", loop_name),
        })
    }

    /// 添加循环体步骤
    pub fn add_loop_step(&mut self, step: SmartScriptStep) -> Result<()> {
        if !self.collecting_mode {
            return Err(anyhow!("当前不在步骤收集模式"));
        }

        if !self.state_manager.is_in_loop() {
            return Err(anyhow!("当前没有活跃的循环"));
        }

        debug!("📝 添加循环步骤: {}", step.name);
        self.executor.add_step(step);
        
        Ok(())
    }

    /// 检查是否在循环中
    pub fn is_in_loop(&self) -> bool {
        self.state_manager.is_in_loop()
    }

    /// 检查是否在收集模式
    pub fn is_collecting(&self) -> bool {
        self.collecting_mode && self.state_manager.is_in_loop()
    }

    /// 获取当前循环上下文
    pub fn current_loop(&self) -> Option<&LoopContext> {
        self.state_manager.current_loop()
    }

    /// 获取当前状态
    pub fn current_state(&self) -> &LoopState {
        self.state_manager.current_state()
    }

    /// 获取嵌套深度
    pub fn nest_depth(&self) -> usize {
        self.state_manager.nest_depth()
    }

    /// 错误恢复：清空所有状态
    pub fn reset(&mut self) {
        info!("🔄 重置循环处理器状态");
        self.state_manager.clear_all();
        self.executor.clear_steps();
        self.collecting_mode = false;
    }

    /// 从前端数据创建配置并开始循环
    pub async fn start_loop_from_data(&mut self, loop_data: &serde_json::Value) -> Result<LoopHandleResult> {
        let config = LoopConfigParser::parse_from_loop_data(loop_data)?;
        self.handle_loop_start(config).await
    }

    /// 从步骤参数创建配置并开始循环
    pub async fn start_loop_from_step(&mut self, parameters: &serde_json::Value) -> Result<LoopHandleResult> {
        let config = LoopConfigParser::parse_from_step_parameters(parameters)?;
        self.handle_loop_start(config).await
    }
}

impl<'a> Default for LoopHandler<'a> {
    fn default() -> Self {
        Self::new()
    }
}