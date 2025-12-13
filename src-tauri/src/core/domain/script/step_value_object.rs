// src-tauri/src/core/domain/script/step_value_object.rs
// module: core/domain/script | layer: domain | role: value-object
// summary: ScriptStep 值对象 - 脚本步骤的业务规则

use serde::{Deserialize, Serialize};
use crate::core::shared::{CoreError, CoreResult, error::ErrorCode};

/// 脚本步骤值对象
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScriptStep {
    /// 步骤 ID
    pub id: String,
    /// 步骤名称
    pub name: String,
    /// 步骤描述
    pub description: String,
    /// 步骤类型
    pub step_type: StepType,
    /// 步骤动作
    pub action: StepAction,
    /// 是否启用
    pub enabled: bool,
    /// 超时时间（毫秒）
    pub timeout_ms: u64,
    /// 重试次数
    pub retry_count: u32,
    /// 执行后延迟（毫秒）
    pub delay_after_ms: u64,
}

/// 步骤类型
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum StepType {
    /// 普通步骤
    Normal,
    /// 循环步骤
    Loop,
    /// 条件步骤
    Conditional,
    /// 等待步骤
    Wait,
}

/// 步骤动作
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum StepAction {
    /// 点击操作
    Click(ClickTarget),
    /// 输入操作
    Input(InputContent),
    /// 滑动操作
    Swipe(SwipeParams),
    /// 等待操作
    Wait(WaitParams),
    /// 返回操作
    Back,
    /// 截图操作
    Screenshot,
    /// 自定义命令
    Custom(CustomCommand),
}

/// 点击目标
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClickTarget {
    /// XPath 选择器
    pub xpath: Option<String>,
    /// 坐标 (x, y)
    pub coordinates: Option<(i32, i32)>,
    /// 元素文本匹配
    pub text_match: Option<String>,
    /// 资源 ID
    pub resource_id: Option<String>,
}

/// 输入内容
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InputContent {
    /// 目标元素
    pub target: ClickTarget,
    /// 输入文本
    pub text: String,
    /// 是否先清空
    pub clear_first: bool,
}

/// 滑动参数
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SwipeParams {
    /// 起点
    pub start: (i32, i32),
    /// 终点
    pub end: (i32, i32),
    /// 持续时间（毫秒）
    pub duration_ms: u64,
}

/// 等待参数
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WaitParams {
    /// 等待时间（毫秒）
    pub duration_ms: u64,
    /// 等待条件（可选）
    pub condition: Option<WaitCondition>,
}

/// 等待条件
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum WaitCondition {
    /// 元素出现
    ElementAppear { xpath: String },
    /// 元素消失
    ElementDisappear { xpath: String },
    /// 文本出现
    TextAppear { text: String },
}

/// 自定义命令
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomCommand {
    /// 命令类型
    pub command_type: String,
    /// 命令参数
    pub params: serde_json::Value,
}

impl ScriptStep {
    /// 创建新步骤
    pub fn new(name: impl Into<String>, action: StepAction) -> Self {
        Self {
            id: format!("step_{}", chrono::Utc::now().timestamp_millis()),
            name: name.into(),
            description: String::new(),
            step_type: StepType::Normal,
            action,
            enabled: true,
            timeout_ms: 30000,
            retry_count: 3,
            delay_after_ms: 500,
        }
    }

    /// 创建点击步骤
    pub fn click(name: impl Into<String>, target: ClickTarget) -> Self {
        Self::new(name, StepAction::Click(target))
    }

    /// 创建输入步骤
    pub fn input(name: impl Into<String>, target: ClickTarget, text: impl Into<String>) -> Self {
        Self::new(name, StepAction::Input(InputContent {
            target,
            text: text.into(),
            clear_first: true,
        }))
    }

    /// 创建等待步骤
    pub fn wait(name: impl Into<String>, duration_ms: u64) -> Self {
        Self::new(name, StepAction::Wait(WaitParams {
            duration_ms,
            condition: None,
        }))
    }

    /// 验证步骤是否有效
    pub fn validate(&self) -> CoreResult<()> {
        // 规则1: 名称不能为空
        if self.name.trim().is_empty() {
            return Err(CoreError::invalid_input("步骤名称不能为空"));
        }

        // 规则2: 验证动作参数
        match &self.action {
            StepAction::Click(target) => {
                if target.xpath.is_none() 
                    && target.coordinates.is_none() 
                    && target.text_match.is_none()
                    && target.resource_id.is_none() 
                {
                    return Err(CoreError::invalid_input(
                        "点击操作必须指定 xpath、坐标、文本或资源ID 之一",
                    ));
                }
            }
            StepAction::Input(content) => {
                if content.text.is_empty() {
                    return Err(CoreError::invalid_input("输入操作的文本不能为空"));
                }
            }
            StepAction::Swipe(params) => {
                if params.start == params.end {
                    return Err(CoreError::invalid_input("滑动起点和终点不能相同"));
                }
            }
            _ => {}
        }

        Ok(())
    }

    /// 是否为控制流步骤
    pub fn is_control_flow(&self) -> bool {
        matches!(self.step_type, StepType::Loop | StepType::Conditional)
    }
}

impl ClickTarget {
    /// 通过 XPath 创建
    pub fn xpath(xpath: impl Into<String>) -> Self {
        Self {
            xpath: Some(xpath.into()),
            coordinates: None,
            text_match: None,
            resource_id: None,
        }
    }

    /// 通过坐标创建
    pub fn coordinates(x: i32, y: i32) -> Self {
        Self {
            xpath: None,
            coordinates: Some((x, y)),
            text_match: None,
            resource_id: None,
        }
    }

    /// 通过文本匹配创建
    pub fn text(text: impl Into<String>) -> Self {
        Self {
            xpath: None,
            coordinates: None,
            text_match: Some(text.into()),
            resource_id: None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_step_creation() {
        let step = ScriptStep::click("点击按钮", ClickTarget::text("确定"));
        assert_eq!(step.name, "点击按钮");
        assert!(step.enabled);
    }

    #[test]
    fn test_step_validation_empty_name() {
        let step = ScriptStep::new("", StepAction::Back);
        assert!(step.validate().is_err());
    }

    #[test]
    fn test_click_target_validation() {
        let step = ScriptStep::click("无效点击", ClickTarget {
            xpath: None,
            coordinates: None,
            text_match: None,
            resource_id: None,
        });
        assert!(step.validate().is_err());
    }
}
