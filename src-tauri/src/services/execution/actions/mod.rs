mod basic;
mod smart;

use anyhow::Result;

use crate::services::contact::{run_generate_vcf_step, run_import_contacts_step};
use crate::services::execution::model::{SmartActionType, SmartScriptStep};
use crate::services::smart_script_executor::SmartScriptExecutor;
use crate::services::execution::loop_handler::{LoopHandler, LoopConfigParser};
use std::sync::Mutex;

pub struct SmartActionDispatcher<'a> {
    executor: &'a SmartScriptExecutor,
    /// 循环处理器（使用 Mutex 保证线程安全）
    loop_handler: Mutex<Option<LoopHandler<'static>>>,
}

impl<'a> SmartActionDispatcher<'a> {
    pub fn new(executor: &'a SmartScriptExecutor) -> Self {
        Self { 
            executor,
            loop_handler: Mutex::new(Some(LoopHandler::new())),
        }
    }



    /// 处理循环开始
    async fn handle_loop_start(&self, step: &SmartScriptStep, logs: &mut Vec<String>) -> Result<String> {
        
        logs.push("🔄 处理循环开始".to_string());
        
        // 解析循环配置
        let config = match LoopConfigParser::parse_from_step_parameters(&step.parameters) {
            Ok(config) => {
                logs.push(format!("✅ 循环配置解析成功: {}", config.loop_name));
                config
            }
            Err(e) => {
                let error_msg = format!("❌ 循环配置解析失败: {}", e);
                logs.push(error_msg.clone());
                return Err(anyhow::anyhow!(error_msg));
            }
        };

        // 开始循环 - 完全避免持有锁跨越 await
        let result = {
            let loop_handler = {
                let mut handler_guard = self.loop_handler.lock().map_err(|e| anyhow::anyhow!("锁定循环处理器失败: {}", e))?;
                handler_guard.take()
            };
            
            if let Some(mut handler) = loop_handler {
                let result = handler.handle_loop_start(config).await;
                // 重新放回 handler
                let mut handler_guard = self.loop_handler.lock().map_err(|e| anyhow::anyhow!("重新锁定循环处理器失败: {}", e))?;
                *handler_guard = Some(handler);
                result
            } else {
                return Err(anyhow::anyhow!("循环处理器未初始化"));
            }
        };
        
        match result {
            Ok(result) => {
                logs.push(format!("🎯 {}", result.get_message()));
                Ok(format!("循环已开始，进入步骤收集模式"))
            }
            Err(e) => {
                let error_msg = format!("❌ 循环开始失败: {}", e);
                logs.push(error_msg.clone());
                Err(anyhow::anyhow!(error_msg))
            }
        }
    }

    /// 处理循环结束
    async fn handle_loop_end(&self, _step: &SmartScriptStep, logs: &mut Vec<String>) -> Result<String> {
        
        logs.push("🏁 处理循环结束".to_string());

        // 检查是否在循环中并执行循环结束 - 完全避免持有锁跨越 await
        let result = {
            let loop_handler = {
                let mut handler_guard = self.loop_handler.lock().map_err(|e| anyhow::anyhow!("锁定循环处理器失败: {}", e))?;
                handler_guard.take()
            };
            
            if let Some(mut handler) = loop_handler {
                if !handler.is_in_loop() {
                    // 重新放回 handler
                    let mut handler_guard = self.loop_handler.lock().map_err(|e| anyhow::anyhow!("重新锁定循环处理器失败: {}", e))?;
                    *handler_guard = Some(handler);
                    
                    let error_msg = "❌ 当前没有活跃的循环，无法结束".to_string();
                    logs.push(error_msg.clone());
                    return Err(anyhow::anyhow!(error_msg));
                }

                // 结束循环并执行
                let result = handler.handle_loop_end().await;
                // 重新放回 handler
                let mut handler_guard = self.loop_handler.lock().map_err(|e| anyhow::anyhow!("重新锁定循环处理器失败: {}", e))?;
                *handler_guard = Some(handler);
                result
            } else {
                return Err(anyhow::anyhow!("循环处理器未初始化"));
            }
        };

        match result {
            Ok(result) => {
                logs.push(format!("🎉 {}", result.get_message()));
                
                // 输出执行统计
                if let Some(execution_result) = result.get_execution_result() {
                    logs.push(format!(
                        "📊 执行统计: 成功 {}/{} 次迭代，总耗时 {}ms", 
                        execution_result.successful_iterations,
                        execution_result.total_iterations,
                        execution_result.duration_ms
                    ));
                }
                
                Ok("循环执行完成".to_string())
            }
            Err(e) => {
                let error_msg = format!("❌ 循环结束失败: {}", e);
                logs.push(error_msg.clone());
                Err(anyhow::anyhow!(error_msg))
            }
        }
    }

    /// 添加循环体步骤（如果在收集模式）
    pub fn try_add_loop_step(&self, _step: &SmartScriptStep) -> bool {
        if let Ok(handler) = self.loop_handler.lock() {
            if let Some(handler_ref) = handler.as_ref() {
                if handler_ref.is_collecting() {
                    // 这里需要获取可变引用，但当前架构下比较困难
                    // 暂时返回true表示应该被收集
                    return true;
                }
            }
        }
        false
    }

    /// 检查是否在循环中
    pub fn is_in_loop(&self) -> bool {
        self.loop_handler.lock()
            .ok()
            .and_then(|h| h.as_ref().map(|h_ref| h_ref.is_in_loop()))
            .unwrap_or(false)
    }

    pub async fn execute(&self, step: &SmartScriptStep, logs: &mut Vec<String>) -> Result<String> {
        match step.step_type {
            SmartActionType::Tap => basic::handle_tap(self.executor, step, logs).await,
            SmartActionType::Wait => basic::handle_wait(step, logs).await,
            SmartActionType::Input => basic::handle_input(self.executor, step, logs).await,
            SmartActionType::Swipe => basic::handle_swipe(self.executor, step, logs).await,
            SmartActionType::SmartTap => smart::handle_smart_tap(self.executor, step, logs).await,
            SmartActionType::SmartFindElement => smart::handle_unified_match(self.executor, step, logs).await,
            SmartActionType::BatchMatch => smart::handle_batch_match(self.executor, step, logs).await,
            SmartActionType::RecognizePage => smart::handle_recognize_page(self.executor, step, logs).await,
            SmartActionType::VerifyAction => {
                logs.push("✅ 验证操作".to_string());
                Ok("验证操作模拟".to_string())
            }
            SmartActionType::WaitForPageState => {
                logs.push("⏳ 等待页面状态".to_string());
                Ok("等待页面状态模拟".to_string())
            }
            SmartActionType::ExtractElement => {
                logs.push("🧵 提取元素".to_string());
                Ok("提取元素模拟".to_string())
            }
            SmartActionType::SmartNavigation => {
                smart::handle_smart_navigation(self.executor, step, logs).await
            }
            SmartActionType::LoopStart => {
                self.handle_loop_start(step, logs).await
            }
            SmartActionType::LoopEnd => {
                self.handle_loop_end(step, logs).await
            }
            SmartActionType::ContactGenerateVcf => run_generate_vcf_step(step, logs).await,
            SmartActionType::ContactImportToDevice => run_import_contacts_step(step, logs).await,
            // 🆕 受控兜底：未知动作类型返回友好错误
            SmartActionType::Unknown => {
                let error_msg = format!(
                    "❌ 未知动作类型：步骤 '{}' 的类型无法识别。\n提示：请检查前端是否使用了正确的类型映射层。",
                    step.name
                );
                logs.push(error_msg.clone());
                Err(anyhow::anyhow!(error_msg))
            }
        }
    }
}
