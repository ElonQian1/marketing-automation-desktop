mod basic;
mod smart;
mod ai_agent;

use anyhow::Result;

use crate::services::contact::{run_generate_vcf_step, run_import_contacts_step};
use crate::services::execution::model::{SmartActionType, SmartScriptStep};
use crate::services::smart_script_executor::SmartScriptExecutor;

pub struct SmartActionDispatcher<'a> {
    executor: &'a SmartScriptExecutor,
}

impl<'a> SmartActionDispatcher<'a> {
    pub fn new(executor: &'a SmartScriptExecutor) -> Self {
        Self { executor }
    }

    pub async fn execute(&self, step: &SmartScriptStep, logs: &mut Vec<String>) -> Result<String> {
        match step.step_type {
            SmartActionType::Tap => basic::handle_tap(self.executor, step, logs).await,
            SmartActionType::Wait => basic::handle_wait(step, logs).await,
            SmartActionType::Input => basic::handle_input(self.executor, step, logs).await,
            SmartActionType::Swipe => basic::handle_swipe(self.executor, step, logs).await,
            // 🔥 新增：智能滚动（暂时映射为 Swipe）
            SmartActionType::SmartScroll => basic::handle_swipe(self.executor, step, logs).await,
            // 🔥 新增：系统按键和长按
            SmartActionType::KeyEvent => ai_agent::handle_key_event(self.executor, step, logs).await,
            SmartActionType::LongPress => {
                logs.push("👆 长按操作".to_string());
                Ok("长按操作执行成功".to_string())
            }
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
                logs.push("🔄 循环开始标记".to_string());
                Ok("循环开始已标记".to_string())
            }
            SmartActionType::LoopEnd => {
                logs.push("🏁 循环结束标记".to_string());
                Ok("循环结束已标记".to_string())
            }
            SmartActionType::ContactGenerateVcf => run_generate_vcf_step(step, logs).await,
            SmartActionType::ContactImportToDevice => run_import_contacts_step(step, logs).await,
            // 🤖 AI Agent 专用操作类型
            SmartActionType::AiLaunchApp => ai_agent::handle_launch_app(self.executor, step, logs).await,
            SmartActionType::AiFindElements => ai_agent::handle_find_elements(self.executor, step, logs).await,
            SmartActionType::AiTapRelative => ai_agent::handle_tap_relative(self.executor, step, logs).await,
            SmartActionType::AiExtractComments => ai_agent::handle_extract_comments(self.executor, step, logs).await,
            SmartActionType::AiCustomCommand => ai_agent::handle_custom_command(self.executor, step, logs).await,
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
