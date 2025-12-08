/// 循环处理器实现
/// 
/// 专门处理各种类型的循环控制结构

use anyhow::{Result, anyhow};
use async_trait::async_trait;
use std::collections::HashMap;
use tracing::{info, warn};

use super::super::ast::{ControlFlowNode, ControlFlowType, LinearStep, StepContext};
use super::super::context::ExecutionContext;
use crate::services::execution::model::{SmartScriptStep, SmartActionType};
use super::base::{
    ControlStructureHandler, HandlerResult, HandlerConfig, HandlerStats, 
    ValidationResult, ValidationError, ValidationWarning, WarningSeverity,
    CostEstimate, ComplexityLevel, ResultMetadata, ResourceUsage, CpuIntensity
};

/// 循环处理器
pub struct LoopHandler {
    /// 处理器版本
    version: String,
}

impl LoopHandler {
    /// 创建新的循环处理器
    pub fn new() -> Self {
        Self {
            version: "1.0.0".to_string(),
        }
    }
    
    /// 展开循环为线性步骤列表
    fn expand_loop(
        &self,
        node: &ControlFlowNode,
        iterations: i32,
        context: &ExecutionContext,
        config: &HandlerConfig
    ) -> Result<Vec<LinearStep>> {
        let mut linear_steps = Vec::new();
        let effective_iterations = if let Some(max_iter) = config.max_iterations {
            iterations.min(max_iter)
        } else {
            iterations
        };
        
        info!("🔄 展开循环: {} 次迭代，{} 个子节点", 
              effective_iterations, node.children.len());
        
        for iteration in 1..=effective_iterations {
            for child in &node.children {
                self.expand_child_node(child, iteration, context, &mut linear_steps)?;
            }
        }
        
        Ok(linear_steps)
    }
    
    /// 展开子节点
    fn expand_child_node(
        &self,
        child: &ControlFlowNode,
        iteration: i32,
        context: &ExecutionContext,
        linear_steps: &mut Vec<LinearStep>
    ) -> Result<()> {
        match &child.flow_type {
            ControlFlowType::Sequential => {
                // 处理顺序执行的步骤
                let steps = &child.steps;
                let total_steps_in_loop = steps.len();
                
                for (step_index, step) in steps.iter().enumerate() {
                    let mut expanded_step = step.clone();
                    
                    // 为循环步骤生成唯一标识
                    expanded_step.id = format!("{}__iter_{}", step.id, iteration);
                    expanded_step.name = format!("{} (第{}次)", step.name, iteration);
                    expanded_step.order = linear_steps.len() as i32 + 1;
                    
                    // 获取上一步的类型和参数（用于智能推断）
                    let (prev_step_type, prev_step_params) = if step_index > 0 {
                        let prev_step = &steps[step_index - 1];
                        (Some(format!("{:?}", prev_step.step_type)), Some(prev_step.parameters.clone()))
                    } else {
                        (None, None)
                    };
                    
                    // 🔥 注入循环上下文信息（包含步骤位置和上一步参数）
                    self.inject_loop_context_enhanced(
                        &mut expanded_step,
                        iteration,
                        &child.id,
                        step_index,
                        total_steps_in_loop,
                        prev_step_type,
                        prev_step_params,
                    )?;
                    
                    let linear_step = LinearStep {
                        step: expanded_step,
                        context: StepContext {
                            source_node_id: child.id.clone(),
                            loop_iteration: Some(iteration),
                            conditional_path: None,
                            nesting_level: context.current_depth() + 1,
                        },
                    };
                    
                    linear_steps.push(linear_step);
                }
            }
            
            ControlFlowType::Loop { .. } => {
                // 嵌套循环：递归处理
                warn!("发现嵌套循环，当前处理器版本暂不支持");
                return Err(anyhow!("嵌套循环暂不支持，请使用专门的嵌套处理器"));
            }
            
            _ => {
                // 其他控制结构：跳过或警告
                warn!("循环中包含不支持的控制结构: {:?}", child.flow_type);
            }
        }
        
        Ok(())
    }
    
    /// 注入循环上下文信息到步骤参数中（旧版，保持兼容）
    #[allow(dead_code)]
    fn inject_loop_context(
        &self,
        step: &mut SmartScriptStep,
        iteration: i32,
        loop_node_id: &str
    ) -> Result<()> {
        self.inject_loop_context_enhanced(step, iteration, loop_node_id, 0, 1, None, None)
    }
    
    /// 🔥 增强版：注入循环上下文信息（包含步骤位置和上一步类型）
    fn inject_loop_context_enhanced(
        &self,
        step: &mut SmartScriptStep,
        iteration: i32,
        loop_node_id: &str,
        step_index: usize,
        total_steps: usize,
        prev_step_type: Option<String>,
        prev_step_params: Option<serde_json::Value>,
    ) -> Result<()> {
        // 解析现有参数
        let mut params = if let Ok(obj) = serde_json::from_value::<serde_json::Map<String, serde_json::Value>>(step.parameters.clone()) {
            obj
        } else {
            serde_json::Map::new()
        };
        
        // 基础循环上下文
        params.insert("__loop_iteration".to_string(), serde_json::Value::Number(serde_json::Number::from(iteration)));
        params.insert("__loop_node_id".to_string(), serde_json::Value::String(loop_node_id.to_string()));
        params.insert("__original_step_id".to_string(), serde_json::Value::String(step.id.clone()));
        params.insert("__expanded_at".to_string(), serde_json::Value::Number(serde_json::Number::from(chrono::Utc::now().timestamp_millis())));
        
        // 🔥 新增：步骤位置信息
        params.insert("__step_index_in_loop".to_string(), serde_json::Value::Number(serde_json::Number::from(step_index)));
        params.insert("__total_steps_in_loop".to_string(), serde_json::Value::Number(serde_json::Number::from(total_steps)));
        params.insert("__is_first_step_in_iteration".to_string(), serde_json::Value::Bool(step_index == 0));
        params.insert("__is_last_step_in_iteration".to_string(), serde_json::Value::Bool(step_index == total_steps - 1));
        
        // 🔥 新增：上一步类型（用于智能推断）
        if let Some(prev_type) = &prev_step_type {
            params.insert("__prev_step_type".to_string(), serde_json::Value::String(prev_type.clone()));
        }
        
        // 🔥 新增：当前步骤类型
        params.insert("__current_step_type".to_string(), serde_json::Value::String(format!("{:?}", step.step_type)));
        
        // 🔥 智能 dump 模式处理
        // 先提取需要的值，避免借用冲突
        let dump_mode = params.get("dump_mode")
            .and_then(|v| v.as_str())
            .unwrap_or("auto")
            .to_string();
        
        // 构建当前步骤参数的 Value 引用
        let step_params_value = serde_json::Value::Object(params.clone());
        
        let should_skip_dump = self.calculate_skip_dump(
            &dump_mode,
            iteration,
            step_index,
            &step.step_type,
            prev_step_type.as_deref(),
            &step_params_value,
            prev_step_params.as_ref(),
        );
        
        params.insert("__skip_dump".to_string(), serde_json::Value::Bool(should_skip_dump));
        params.insert("__dump_decision_reason".to_string(), serde_json::Value::String(
            self.get_dump_decision_reason(&dump_mode, iteration, step_index, should_skip_dump)
        ));
        
        // 更新步骤参数
        step.parameters = serde_json::Value::Object(params);
        
        Ok(())
    }
    
    /// 🔥 核心：计算是否应该跳过 dump
    fn calculate_skip_dump(
        &self,
        dump_mode: &str,
        iteration: i32,
        step_index: usize,
        step_type: &SmartActionType,
        prev_step_type: Option<&str>,
        step_params: &serde_json::Value,
        prev_step_params: Option<&serde_json::Value>,
    ) -> bool {
        match dump_mode {
            "always" => {
                // 保守策略：每次都 dump
                false
            }
            "skip" => {
                // 始终跳过
                true
            }
            "first_only" => {
                // 仅整个循环的第一次迭代的第一个步骤 dump
                !(iteration == 1 && step_index == 0)
            }
            "loop_entry" => {
                // 每次迭代的第一个步骤 dump
                step_index != 0
            }
            "auto" | _ => {
                // 🤖 智能推断逻辑
                self.auto_infer_skip_dump_enhanced(iteration, step_index, step_type, prev_step_type, step_params, prev_step_params)
            }
        }
    }
    
    /// 🤖 增强版智能推断是否跳过 dump
    /// 
    /// 考虑因素：
    /// 1. 当前步骤类型和参数
    /// 2. 上一步类型和参数（特别是 may_cause_page_change 标记）
    /// 3. 迭代位置
    fn auto_infer_skip_dump_enhanced(
        &self,
        iteration: i32,
        step_index: usize,
        step_type: &SmartActionType,
        prev_step_type: Option<&str>,
        step_params: &serde_json::Value,
        prev_step_params: Option<&serde_json::Value>,
    ) -> bool {
        // 规则1：当前步骤不需要元素定位 → 跳过 dump（但要检查参数）
        if step_type.can_skip_dump_with_params(step_params) {
            info!("🤖 智能推断：步骤类型 {:?} 不需要 dump", step_type);
            return true;
        }
        
        // 规则2：循环第一次迭代的第一个步骤 → 必须 dump（获取初始状态）
        if iteration == 1 && step_index == 0 {
            info!("🤖 智能推断：循环首次入口，必须 dump");
            return false;
        }
        
        // 规则3：每次迭代的第一个步骤 → dump（上次迭代结束后状态未知）
        if step_index == 0 {
            info!("🤖 智能推断：迭代入口（第{}次），执行 dump", iteration);
            return false;
        }
        
        // 规则4：检查上一步的 may_cause_page_change 参数标记
        if let Some(prev_params) = prev_step_params {
            if let Some(true) = prev_params.get("may_cause_page_change").and_then(|v| v.as_bool()) {
                info!("🤖 智能推断：上一步标记了 may_cause_page_change=true，执行 dump");
                return false;
            }
        }
        
        // 规则5：上一步是页面变化型操作 → 必须 dump
        if let Some(prev_type_str) = prev_step_type {
            let prev_causes_change = prev_type_str.contains("Swipe")
                || prev_type_str.contains("Scroll")
                || prev_type_str.contains("Navigation")
                || prev_type_str.contains("KeyEvent");
            
            if prev_causes_change {
                info!("🤖 智能推断：上一步 {} 会改变页面，执行 dump", prev_type_str);
                return false;
            }
        }
        
        // 规则6：当前步骤需要元素定位但上一步不改变页面 → 可以复用缓存
        if step_type.needs_element_locating() {
            info!("🤖 智能推断：步骤 {:?} 需要定位，但上一步未改变页面，复用缓存", step_type);
            return true;
        }
        
        // 默认：不跳过（保守）
        false
    }
    
    /// 🤖 智能推断是否跳过 dump（旧版兼容，内部调用增强版）
    #[allow(dead_code)]
    fn auto_infer_skip_dump(
        &self,
        iteration: i32,
        step_index: usize,
        step_type: &SmartActionType,
        prev_step_type: Option<&str>,
    ) -> bool {
        self.auto_infer_skip_dump_enhanced(
            iteration,
            step_index,
            step_type,
            prev_step_type,
            &serde_json::Value::Null,
            None,
        )
    }
    
    /// 获取 dump 决策原因（用于调试日志）
    fn get_dump_decision_reason(&self, dump_mode: &str, iteration: i32, step_index: usize, skip: bool) -> String {
        let action = if skip { "跳过" } else { "执行" };
        match dump_mode {
            "always" => format!("{}dump（模式: always）", action),
            "skip" => format!("{}dump（模式: skip）", action),
            "first_only" => format!("{}dump（模式: first_only，迭代{}，步骤{}）", action, iteration, step_index),
            "loop_entry" => format!("{}dump（模式: loop_entry，步骤{}）", action, step_index),
            "auto" => format!("{}dump（智能推断，迭代{}，步骤{}）", action, iteration, step_index),
            _ => format!("{}dump（未知模式: {}）", action, dump_mode),
        }
    }
    
    /// 优化循环展开
    fn optimize_expansion(
        &self,
        steps: &mut Vec<LinearStep>,
        config: &HandlerConfig
    ) -> bool {
        if !config.enable_optimization {
            return false;
        }
        
        let original_count = steps.len();
        
        // 优化1：去除重复的等待步骤
        self.deduplicate_wait_steps(steps);
        
        // 优化2：合并相同的操作
        self.merge_similar_operations(steps);
        
        let optimized_count = steps.len();
        let optimization_applied = original_count != optimized_count;
        
        if optimization_applied {
            info!("🚀 循环优化: {} -> {} 步骤", original_count, optimized_count);
        }
        
        optimization_applied
    }
    
    /// 去除重复的等待步骤
    fn deduplicate_wait_steps(&self, steps: &mut Vec<LinearStep>) {
        // 简单实现：移除连续的相同等待步骤
        let mut i = 0;
        while i < steps.len() - 1 {
            let current = &steps[i];
            let next = &steps[i + 1];
            
            if self.is_same_wait_step(&current.step, &next.step) {
                steps.remove(i + 1);
            } else {
                i += 1;
            }
        }
    }
    
    /// 合并相似的操作
    fn merge_similar_operations(&self, _steps: &mut Vec<LinearStep>) {
        // 这里可以实现更复杂的操作合并逻辑
        // 例如：连续的点击操作、批量输入等
    }
    
    /// 判断是否为相同的等待步骤
    fn is_same_wait_step(&self, step1: &SmartScriptStep, step2: &SmartScriptStep) -> bool {
        matches!(step1.step_type, SmartActionType::Wait) &&
        matches!(step2.step_type, SmartActionType::Wait) &&
        step1.parameters.get("duration") == step2.parameters.get("duration")
    }
}

#[async_trait]
impl ControlStructureHandler for LoopHandler {
    fn handler_type(&self) -> &'static str {
        "LoopHandler"
    }
    
    fn can_handle(&self, node: &ControlFlowNode) -> bool {
        matches!(node.flow_type, ControlFlowType::Loop { .. })
    }
    
    async fn handle(
        &self,
        node: &ControlFlowNode,
        context: &mut ExecutionContext,
        config: &HandlerConfig
    ) -> Result<HandlerResult> {
        let start_time = std::time::Instant::now();
        
        // 提取循环参数
        let (iterations, is_infinite) = match &node.flow_type {
            ControlFlowType::Loop { iterations, is_infinite, .. } => (*iterations, *is_infinite),
            _ => return Err(anyhow!("节点类型不匹配")),
        };
        
        // 处理无限循环
        let effective_iterations = if is_infinite {
            config.max_iterations.unwrap_or(1000)
        } else {
            iterations
        };
        
        info!("🔄 开始处理循环: {} 次迭代 (原始: {}, 无限: {})", 
              effective_iterations, iterations, is_infinite);
        
        // 展开循环
        let mut linear_steps = self.expand_loop(node, effective_iterations, context, config)?;
        
        // 应用优化
        let optimization_applied = self.optimize_expansion(&mut linear_steps, config);
        
        let processing_time = start_time.elapsed();
        
        // 构建统计信息
        let stats = HandlerStats {
            original_steps: node.children.iter().map(|c| c.steps.len()).sum(),
            expanded_steps: linear_steps.len(),
            processing_time_ms: processing_time.as_millis() as u64,
            optimization_applied,
            resource_usage: ResourceUsage {
                memory_bytes: (linear_steps.len() * std::mem::size_of::<LinearStep>()) as u64,
                cpu_intensity: if linear_steps.len() > 1000 { CpuIntensity::High } else { CpuIntensity::Medium },
                io_operations: 0,
            },
        };
        
        // 构建结果元数据
        let mut handler_specific = HashMap::new();
        handler_specific.insert("iterations".to_string(), serde_json::Value::Number(serde_json::Number::from(effective_iterations)));
        handler_specific.insert("is_infinite".to_string(), serde_json::Value::Bool(is_infinite));
        handler_specific.insert("original_iterations".to_string(), serde_json::Value::Number(serde_json::Number::from(iterations)));
        
        let metadata = ResultMetadata {
            handler_version: self.version.clone(),
            processed_at: chrono::Utc::now().timestamp_millis(),
            handler_specific,
        };
        
        info!("✅ 循环处理完成: {} 步骤，耗时 {}ms", 
              linear_steps.len(), processing_time.as_millis());
        
        Ok(HandlerResult {
            linear_steps,
            stats,
            metadata,
        })
    }
    
    fn validate(&self, node: &ControlFlowNode) -> Result<ValidationResult> {
        let mut errors = Vec::new();
        let mut warnings = Vec::new();
        
        // 验证循环类型
        let (iterations, is_infinite) = match &node.flow_type {
            ControlFlowType::Loop { iterations, is_infinite, .. } => (*iterations, *is_infinite),
            _ => {
                errors.push(ValidationError {
                    code: "INVALID_NODE_TYPE".to_string(),
                    message: "节点类型不是循环类型".to_string(),
                    location: Some(node.id.clone()),
                });
                return Ok(ValidationResult::failure(errors));
            }
        };
        
        // 验证迭代次数
        if !is_infinite && iterations <= 0 {
            errors.push(ValidationError {
                code: "INVALID_ITERATIONS".to_string(),
                message: format!("循环次数必须大于0，当前值: {}", iterations),
                location: Some(node.id.clone()),
            });
        }
        
        if iterations > 10000 {
            warnings.push(ValidationWarning {
                code: "HIGH_ITERATION_COUNT".to_string(),
                message: format!("循环次数过高 ({}), 可能影响性能", iterations),
                severity: WarningSeverity::Major,
            });
        }
        
        // 验证循环体
        if node.children.is_empty() {
            warnings.push(ValidationWarning {
                code: "EMPTY_LOOP_BODY".to_string(),
                message: "循环体为空".to_string(),
                severity: WarningSeverity::Minor,
            });
        }
        
        // 验证嵌套深度
        let max_depth = node.depth();
        if max_depth > 5 {
            warnings.push(ValidationWarning {
                code: "DEEP_NESTING".to_string(),
                message: format!("嵌套深度过深 ({}), 建议重构", max_depth),
                severity: WarningSeverity::Major,
            });
        }
        
        let result = if errors.is_empty() {
            ValidationResult::success().with_warnings(warnings)
        } else {
            ValidationResult::failure(errors).with_warnings(warnings)
        };
        
        Ok(result)
    }
    
    fn estimate_cost(&self, node: &ControlFlowNode) -> CostEstimate {
        let (iterations, is_infinite) = match &node.flow_type {
            ControlFlowType::Loop { iterations, is_infinite, .. } => (*iterations, *is_infinite),
            _ => (1, false),
        };
        
        let effective_iterations = if is_infinite { 1000 } else { iterations };
        let steps_per_iteration: usize = node.children.iter().map(|c| c.steps.len()).sum();
        let total_steps = steps_per_iteration * effective_iterations as usize;
        
        CostEstimate {
            execution_time_ms: (total_steps as u64) * 500, // 假设每步500ms
            memory_usage_bytes: total_steps as u64 * 1024, // 假设每步1KB
            complexity: if effective_iterations > 1000 {
                ComplexityLevel::ON2
            } else {
                ComplexityLevel::ON
            },
            parallelizable: false, // 循环通常需要顺序执行
        }
    }
}

impl Default for LoopHandler {
    fn default() -> Self {
        Self::new()
    }
}