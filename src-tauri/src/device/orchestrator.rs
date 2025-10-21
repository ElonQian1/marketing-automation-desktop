// src-tauri/src/device/orchestrator.rs
// module: device | layer: application | role: 回放编排器
// summary: 读取回放计划并逐步执行，发射执行状态事件

use super::provider::{DeviceAction, DumpProvider};
use crate::services::lead_hunt::ReplayPlan;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::time::{sleep, Duration};

/// 执行步骤定义
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecutionStep {
    /// 步骤名称
    pub name: String,
    /// 步骤描述
    pub description: String,
    /// 要执行的动作
    pub action: DeviceAction,
}

/// 执行状态事件
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecutionStatusEvent {
    /// 计划ID
    pub plan_id: String,
    /// 当前步骤索引
    pub current_step: usize,
    /// 总步骤数
    pub total_steps: usize,
    /// 步骤名称
    pub step_name: String,
    /// 步骤描述
    pub step_description: String,
    /// 状态: "running" | "success" | "error"
    pub status: String,
    /// 错误信息（如果有）
    pub error: Option<String>,
}

/// 回放编排器
pub struct ReplayOrchestrator {
    /// 设备提供者
    provider: Arc<dyn DumpProvider>,
    /// Tauri 应用句柄
    app_handle: AppHandle,
}

impl ReplayOrchestrator {
    pub fn new(provider: Arc<dyn DumpProvider>, app_handle: AppHandle) -> Self {
        Self { provider, app_handle }
    }

    /// 从 ReplayPlan 生成执行步骤
    fn generate_steps(&self, plan: &ReplayPlan) -> Vec<ExecutionStep> {
        vec![
            ExecutionStep {
                name: "打开私信入口".to_string(),
                description: format!("在 {} 平台找到 {} 的私信入口", plan.platform, plan.author),
                action: DeviceAction::Click { x: 200, y: 300 },
            },
            ExecutionStep {
                name: "等待私信页面加载".to_string(),
                description: "等待进入私信对话页面".to_string(),
                action: DeviceAction::Sleep { ms: 1500 },
            },
            ExecutionStep {
                name: "点击输入框".to_string(),
                description: "激活输入框".to_string(),
                action: DeviceAction::Click { x: 400, y: 2150 },
            },
            ExecutionStep {
                name: "输入回复内容".to_string(),
                description: format!(
                    "输入建议回复: {}",
                    plan.suggested_reply.as_deref().unwrap_or("您好！我们这边可以提供...")
                ),
                action: DeviceAction::Input {
                    text: plan.suggested_reply.clone().unwrap_or_else(|| {
                        "您好！我们这边可以提供详细的产品信息，请问您需要什么帮助？".to_string()
                    }),
                },
            },
            ExecutionStep {
                name: "点击发送按钮".to_string(),
                description: "点击发送按钮".to_string(),
                action: DeviceAction::Click { x: 900, y: 2250 },
            },
            ExecutionStep {
                name: "等待发送完成".to_string(),
                description: "等待消息发送完成".to_string(),
                action: DeviceAction::Sleep { ms: 1000 },
            },
            ExecutionStep {
                name: "返回".to_string(),
                description: "返回上一页".to_string(),
                action: DeviceAction::Back,
            },
        ]
    }

    /// 发射执行状态事件
    fn emit_status(&self, event: ExecutionStatusEvent) {
        if let Err(e) = self.app_handle.emit("orchestrator://status", event.clone()) {
            eprintln!("[Orchestrator] 发射事件失败: {:?}", e);
        }
    }

    /// 执行单个回放计划
    pub async fn execute_plan(&self, plan: ReplayPlan) -> Result<(), String> {
        let steps = self.generate_steps(&plan);
        let total_steps = steps.len();

        println!("[Orchestrator] 开始执行计划: {} (共{}步)", plan.id, total_steps);

        for (index, step) in steps.iter().enumerate() {
            let current_step = index + 1;

            // 发射"运行中"状态
            self.emit_status(ExecutionStatusEvent {
                plan_id: plan.id.clone(),
                current_step,
                total_steps,
                step_name: step.name.clone(),
                step_description: step.description.clone(),
                status: "running".to_string(),
                error: None,
            });

            println!(
                "[Orchestrator] [{}/{}] {} - {}",
                current_step, total_steps, step.name, step.description
            );

            // 执行动作
            match self.provider.perform_action(&step.action).await {
                Ok(_) => {
                    // 发射"成功"状态
                    self.emit_status(ExecutionStatusEvent {
                        plan_id: plan.id.clone(),
                        current_step,
                        total_steps,
                        step_name: step.name.clone(),
                        step_description: step.description.clone(),
                        status: "success".to_string(),
                        error: None,
                    });
                }
                Err(e) => {
                    // 发射"错误"状态
                    self.emit_status(ExecutionStatusEvent {
                        plan_id: plan.id.clone(),
                        current_step,
                        total_steps,
                        step_name: step.name.clone(),
                        step_description: step.description.clone(),
                        status: "error".to_string(),
                        error: Some(e.clone()),
                    });
                    return Err(format!("步骤 {} 失败: {}", step.name, e));
                }
            }

            // 步骤间延迟（避免操作过快）
            sleep(Duration::from_millis(500)).await;
        }

        println!("[Orchestrator] 计划 {} 执行完成", plan.id);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::device::mock::MockDumpProvider;

    #[tokio::test]
    async fn test_orchestrator_execution() {
        // 注意：这个测试需要 AppHandle，在单元测试中无法完全运行
        // 这里只是展示如何构造和使用
        let mock_provider = Arc::new(MockDumpProvider::new("test_device".to_string()));
        
        let plan = ReplayPlan {
            id: "test_plan_001".to_string(),
            platform: "douyin".to_string(),
            video_url: "https://example.com/video".to_string(),
            author: "测试用户".to_string(),
            comment: "这个产品多少钱？".to_string(),
            suggested_reply: Some("我们的产品价格是...".to_string()),
        };

        // 实际测试需要在集成测试中完成
        println!("Orchestrator test plan created: {:?}", plan);
    }
}
