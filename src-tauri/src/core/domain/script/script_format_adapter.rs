// src-tauri/src/core/domain/script/script_format_adapter.rs
// module: core/domain/script | layer: domain | role: format-adapter
// summary: 脚本格式适配器 - 处理 GUI 格式(SmartScript) 与核心域格式(Script) 之间的双向转换

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tracing::{debug, warn};

use super::script_entity::{Script, ScriptConfig, ScriptSummary};
use super::step_value_object::{
    ClickTarget, CustomCommand, InputContent, ScriptStep, 
    StepAction, StepType, SwipeParams, WaitCondition, WaitParams,
};
use crate::core::shared::{CoreError, CoreResult};

// ============================================================================
// GUI 格式数据结构定义 (SmartScript)
// ============================================================================

/// GUI 构建器创建的脚本格式
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmartScript {
    pub id: String,
    pub name: String,
    pub description: String,
    pub version: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub author: String,
    pub category: String,
    pub tags: Vec<String>,
    pub steps: Vec<SmartScriptStepRaw>,
    #[serde(default)]
    pub config: Option<SmartScriptConfig>,
}

/// GUI 脚本配置
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SmartScriptConfig {
    #[serde(default = "default_true")]
    pub continue_on_error: bool,
    #[serde(default = "default_true")]
    pub auto_verification_enabled: bool,
    #[serde(default = "default_true")]
    pub smart_recovery_enabled: bool,
    #[serde(default = "default_true")]
    pub detailed_logging: bool,
}

fn default_true() -> bool { true }

/// GUI 格式的步骤 (原始 JSON 结构)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmartScriptStepRaw {
    pub id: String,
    /// GUI 使用 step_type 字段存放动作类型，如 "smart_find_element", "tap", "input" 等
    pub step_type: String,
    pub name: String,
    #[serde(default)]
    pub description: String,
    /// GUI 步骤的所有参数都存放在这个 JSON 对象中
    pub parameters: serde_json::Value,
    #[serde(default = "default_true")]
    pub enabled: bool,
    #[serde(default)]
    pub order: i32,
}

// ============================================================================
// 格式检测
// ============================================================================

/// 检测脚本格式
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ScriptFormat {
    /// 核心域格式 (六边形架构)
    Core,
    /// GUI 构建器格式 (SmartScript)
    Smart,
    /// AI Agent 脚本格式 (MCP 工具创建)
    AiAgent,
    /// 未知格式
    Unknown,
}

impl ScriptFormat {
    /// 从 JSON 内容检测脚本格式
    pub fn detect(content: &str) -> Self {
        // 尝试解析为 JSON Value
        let value: serde_json::Value = match serde_json::from_str(content) {
            Ok(v) => v,
            Err(_) => return ScriptFormat::Unknown,
        };

        // 1. 检查是否是 AI Agent 脚本格式
        if let Some(format) = value.get("format").and_then(|f| f.as_str()) {
            if format == "ai_agent_script" {
                return ScriptFormat::AiAgent;
            }
        }
        // 兼容检查: type 字段
        if let Some(script_type) = value.get("type").and_then(|t| t.as_str()) {
            if script_type == "ai_agent_script" {
                return ScriptFormat::AiAgent;
            }
        }
        // 兼容检查: metadata.type 字段 + goal 字段
        if let Some(meta_type) = value.get("metadata").and_then(|m| m.get("type")).and_then(|t| t.as_str()) {
            if meta_type == "algorithm" && value.get("goal").is_some() {
                return ScriptFormat::AiAgent;
            }
        }

        // 2. 检查 steps 数组中的第一个步骤
        if let Some(steps) = value.get("steps").and_then(|s| s.as_array()) {
            if let Some(first_step) = steps.first() {
                // AI Agent 格式：steps 中的步骤有 action 字段（字符串如 "launch_app", "tap"）
                // 且没有 step_type 字段
                if first_step.get("action").is_some() && first_step.get("step_type").is_none() {
                    if let Some(action) = first_step.get("action").and_then(|a| a.as_str()) {
                        let ai_agent_actions = [
                            "launch_app", "tap", "tap_relative", "tap_element",
                            "swipe_screen", "swipe", "input_text", "press_key",
                            "find_elements", "extract_comments", "wait",
                        ];
                        if ai_agent_actions.contains(&action) {
                            return ScriptFormat::AiAgent;
                        }
                    }
                }
                
                // GUI 格式：steps 中的每个步骤有 step_type 是字符串 (如 "smart_find_element")
                if let Some(step_type) = first_step.get("step_type") {
                    if let Some(type_str) = step_type.as_str() {
                        let smart_types = [
                            "smart_find_element", "smart_tap", "smart_scroll",
                            "batch_match", "recognize_page", "verify_action",
                            "wait_for_page_state", "extract_element", "smart_navigation",
                            "loop_start", "loop_end", "contact_generate_vcf", "contact_import_to_device",
                        ];
                        
                        if smart_types.contains(&type_str) {
                            return ScriptFormat::Smart;
                        }
                    }
                }
                
                // Core 格式：有 action 对象（不是字符串）
                if let Some(action) = first_step.get("action") {
                    if action.is_object() {
                        return ScriptFormat::Core;
                    }
                }
                
                // 检查 parameters 字段 (GUI 格式特有)
                if first_step.get("parameters").is_some() {
                    return ScriptFormat::Smart;
                }
            }
        }

        ScriptFormat::Unknown
    }
}

// ============================================================================
// SmartScript -> Script 转换 (GUI -> Core)
// ============================================================================

impl SmartScript {
    /// 将 GUI 格式脚本转换为核心域格式
    pub fn to_core_script(&self) -> CoreResult<Script> {
        let steps: Vec<ScriptStep> = self.steps
            .iter()
            .enumerate()
            .filter_map(|(idx, step)| {
                match convert_smart_step_to_core(step, idx) {
                    Ok(s) => Some(s),
                    Err(e) => {
                        warn!("⚠️ 步骤转换失败 [{}]: {} - {}", idx, step.name, e);
                        None
                    }
                }
            })
            .collect();

        let config = match &self.config {
            Some(c) => ScriptConfig {
                continue_on_error: c.continue_on_error,
                auto_verification_enabled: c.auto_verification_enabled,
                smart_recovery_enabled: c.smart_recovery_enabled,
                detailed_logging: c.detailed_logging,
            },
            None => ScriptConfig::default(),
        };

        Ok(Script {
            id: self.id.clone(),
            name: self.name.clone(),
            description: self.description.clone(),
            version: self.version.clone(),
            created_at: self.created_at,
            updated_at: self.updated_at,
            author: self.author.clone(),
            category: self.category.clone(),
            tags: self.tags.clone(),
            steps,
            config,
            metadata: HashMap::new(),
        })
    }
}

/// 将单个 GUI 步骤转换为核心域步骤
fn convert_smart_step_to_core(step: &SmartScriptStepRaw, order: usize) -> CoreResult<ScriptStep> {
    let params = &step.parameters;
    
    // 根据 step_type 决定转换逻辑
    let (step_type, action) = match step.step_type.as_str() {
        // 智能查找元素 -> 点击操作
        "smart_find_element" => {
            let target = extract_click_target_from_smart(params)?;
            (StepType::Normal, StepAction::Click(target))
        }
        
        // 基础点击
        "tap" | "smart_tap" => {
            let target = extract_click_target_from_tap(params)?;
            (StepType::Normal, StepAction::Click(target))
        }
        
        // 输入操作
        "input" => {
            let content = extract_input_content(params)?;
            (StepType::Normal, StepAction::Input(content))
        }
        
        // 滑动操作
        "swipe" | "smart_scroll" => {
            let swipe = extract_swipe_params(params)?;
            (StepType::Normal, StepAction::Swipe(swipe))
        }
        
        // 等待操作
        "wait" | "wait_for_page_state" => {
            let wait = extract_wait_params(params)?;
            (StepType::Wait, StepAction::Wait(wait))
        }
        
        // 按键事件 (返回键等)
        "key_event" => {
            let key_code = params.get("key_code")
                .and_then(|v| v.as_i64())
                .unwrap_or(4) as i32; // 默认返回键
            
            if key_code == 4 {
                (StepType::Normal, StepAction::Back)
            } else {
                // 其他按键作为自定义命令
                (StepType::Normal, StepAction::Custom(CustomCommand {
                    command_type: "key_event".to_string(),
                    params: serde_json::json!({ "key_code": key_code }),
                }))
            }
        }
        
        // 长按操作 -> 转换为带有长按标记的点击
        "long_press" => {
            let target = extract_click_target_from_tap(params)?;
            (StepType::Normal, StepAction::Custom(CustomCommand {
                command_type: "long_press".to_string(),
                params: serde_json::json!({
                    "target": target,
                    "duration_ms": params.get("duration_ms").and_then(|v| v.as_u64()).unwrap_or(1000)
                }),
            }))
        }
        
        // 批量匹配 -> 自定义命令 (保留原始参数)
        "batch_match" => {
            (StepType::Normal, StepAction::Custom(CustomCommand {
                command_type: "batch_match".to_string(),
                params: params.clone(),
            }))
        }
        
        // 页面识别 -> 自定义命令
        "recognize_page" => {
            (StepType::Normal, StepAction::Custom(CustomCommand {
                command_type: "recognize_page".to_string(),
                params: params.clone(),
            }))
        }
        
        // 验证操作 -> 自定义命令
        "verify_action" => {
            (StepType::Normal, StepAction::Custom(CustomCommand {
                command_type: "verify_action".to_string(),
                params: params.clone(),
            }))
        }
        
        // 提取元素 -> 自定义命令
        "extract_element" => {
            (StepType::Normal, StepAction::Custom(CustomCommand {
                command_type: "extract_element".to_string(),
                params: params.clone(),
            }))
        }
        
        // 智能导航 -> 自定义命令
        "smart_navigation" => {
            (StepType::Normal, StepAction::Custom(CustomCommand {
                command_type: "smart_navigation".to_string(),
                params: params.clone(),
            }))
        }
        
        // 循环开始
        "loop_start" => {
            (StepType::Loop, StepAction::Custom(CustomCommand {
                command_type: "loop_start".to_string(),
                params: params.clone(),
            }))
        }
        
        // 循环结束
        "loop_end" => {
            (StepType::Loop, StepAction::Custom(CustomCommand {
                command_type: "loop_end".to_string(),
                params: params.clone(),
            }))
        }
        
        // 通讯录操作
        "contact_generate_vcf" | "contact_import_to_device" => {
            (StepType::Normal, StepAction::Custom(CustomCommand {
                command_type: step.step_type.clone(),
                params: params.clone(),
            }))
        }
        
        // 未知类型 -> 保留为自定义命令
        unknown => {
            warn!("⚠️ 未知的步骤类型: {}, 保留为自定义命令", unknown);
            (StepType::Normal, StepAction::Custom(CustomCommand {
                command_type: unknown.to_string(),
                params: params.clone(),
            }))
        }
    };
    
    // 提取超时和重试配置
    let timeout_ms = params.get("timeout_ms")
        .and_then(|v| v.as_u64())
        .unwrap_or(30000);
    
    let retry_count = params.get("retry_count")
        .and_then(|v| v.as_u64())
        .unwrap_or(3) as u32;
    
    let delay_after_ms = params.get("delay_after_ms")
        .and_then(|v| v.as_u64())
        .unwrap_or(500);

    Ok(ScriptStep {
        id: step.id.clone(),
        name: step.name.clone(),
        description: step.description.clone(),
        step_type,
        action,
        enabled: step.enabled,
        timeout_ms,
        retry_count,
        delay_after_ms,
    })
}

// ============================================================================
// 参数提取辅助函数
// ============================================================================

/// 从 smart_find_element 参数中提取点击目标
fn extract_click_target_from_smart(params: &serde_json::Value) -> CoreResult<ClickTarget> {
    // 优先级：bounds > element_selector > text match > content_desc
    
    // 1. 尝试从 bounds 提取坐标 (格式: "[864,2240][1080,2358]")
    let coordinates = if let Some(bounds_str) = params.get("bounds").and_then(|v| v.as_str()) {
        parse_bounds_to_center(bounds_str)
    } else {
        None
    };
    
    // 2. XPath 选择器
    let xpath = params.get("element_selector")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    
    // 3. 文本匹配 (从 smartSelection 或 matching 中提取)
    let text_match = params.get("smartSelection")
        .and_then(|s| s.get("targetText"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .or_else(|| {
            params.get("matching")
                .and_then(|m| m.get("values"))
                .and_then(|v| v.get("text"))
                .and_then(|t| t.as_str())
                .filter(|s| !s.is_empty())
                .map(|s| s.to_string())
        })
        .or_else(|| {
            params.get("content_desc")
                .and_then(|v| v.as_str())
                .filter(|s| !s.is_empty())
                .map(|s| s.to_string())
        });
    
    // 4. 资源 ID
    let resource_id = params.get("resource_id")
        .and_then(|v| v.as_str())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string());
    
    Ok(ClickTarget {
        xpath,
        coordinates,
        text_match,
        resource_id,
    })
}

/// 从 tap 参数中提取点击目标
fn extract_click_target_from_tap(params: &serde_json::Value) -> CoreResult<ClickTarget> {
    let x = params.get("x").and_then(|v| v.as_i64()).map(|v| v as i32);
    let y = params.get("y").and_then(|v| v.as_i64()).map(|v| v as i32);
    let coordinates = match (x, y) {
        (Some(x), Some(y)) => Some((x, y)),
        _ => None,
    };
    
    let xpath = params.get("xpath")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    
    let text_match = params.get("text")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    
    let resource_id = params.get("resource_id")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    
    Ok(ClickTarget {
        xpath,
        coordinates,
        text_match,
        resource_id,
    })
}

/// 提取输入内容
fn extract_input_content(params: &serde_json::Value) -> CoreResult<InputContent> {
    let text = params.get("text")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    
    let clear_first = params.get("clear_first")
        .and_then(|v| v.as_bool())
        .unwrap_or(true);
    
    let target = extract_click_target_from_tap(params)?;
    
    Ok(InputContent {
        target,
        text,
        clear_first,
    })
}

/// 提取滑动参数
fn extract_swipe_params(params: &serde_json::Value) -> CoreResult<SwipeParams> {
    // 支持两种格式：
    // 1. start_x, start_y, end_x, end_y
    // 2. direction (up, down, left, right)
    
    if let Some(direction) = params.get("direction").and_then(|v| v.as_str()) {
        // 基于方向的滑动 (屏幕中心为基准)
        let (start, end) = match direction {
            "up" => ((540, 1500), (540, 500)),
            "down" => ((540, 500), (540, 1500)),
            "left" => ((800, 1000), (200, 1000)),
            "right" => ((200, 1000), (800, 1000)),
            _ => ((540, 1500), (540, 500)), // 默认向上
        };
        
        return Ok(SwipeParams {
            start,
            end,
            duration_ms: params.get("duration_ms").and_then(|v| v.as_u64()).unwrap_or(300),
        });
    }
    
    // 精确坐标滑动
    let start_x = params.get("start_x").and_then(|v| v.as_i64()).unwrap_or(540) as i32;
    let start_y = params.get("start_y").and_then(|v| v.as_i64()).unwrap_or(1500) as i32;
    let end_x = params.get("end_x").and_then(|v| v.as_i64()).unwrap_or(540) as i32;
    let end_y = params.get("end_y").and_then(|v| v.as_i64()).unwrap_or(500) as i32;
    let duration_ms = params.get("duration_ms").and_then(|v| v.as_u64()).unwrap_or(300);
    
    Ok(SwipeParams {
        start: (start_x, start_y),
        end: (end_x, end_y),
        duration_ms,
    })
}

/// 提取等待参数
fn extract_wait_params(params: &serde_json::Value) -> CoreResult<WaitParams> {
    let duration_ms = params.get("duration_ms")
        .or_else(|| params.get("wait_ms"))
        .and_then(|v| v.as_u64())
        .unwrap_or(1000);
    
    // 检查是否有等待条件
    let condition = if let Some(xpath) = params.get("wait_for_element").and_then(|v| v.as_str()) {
        Some(WaitCondition::ElementAppear { xpath: xpath.to_string() })
    } else if let Some(text) = params.get("wait_for_text").and_then(|v| v.as_str()) {
        Some(WaitCondition::TextAppear { text: text.to_string() })
    } else {
        None
    };
    
    Ok(WaitParams {
        duration_ms,
        condition,
    })
}

/// 解析 bounds 字符串为中心点坐标
/// 格式: "[left,top][right,bottom]" -> (center_x, center_y)
fn parse_bounds_to_center(bounds: &str) -> Option<(i32, i32)> {
    // 使用正则解析 "[864,2240][1080,2358]"
    let re = regex::Regex::new(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]").ok()?;
    let caps = re.captures(bounds)?;
    
    let left: i32 = caps.get(1)?.as_str().parse().ok()?;
    let top: i32 = caps.get(2)?.as_str().parse().ok()?;
    let right: i32 = caps.get(3)?.as_str().parse().ok()?;
    let bottom: i32 = caps.get(4)?.as_str().parse().ok()?;
    
    let center_x = (left + right) / 2;
    let center_y = (top + bottom) / 2;
    
    Some((center_x, center_y))
}

// ============================================================================
// Script -> SmartScript 转换 (Core -> GUI) 反向转换
// ============================================================================

impl Script {
    /// 将核心域格式脚本转换为 GUI 格式 (用于导出或兼容)
    pub fn to_smart_script(&self) -> SmartScript {
        let steps: Vec<SmartScriptStepRaw> = self.steps
            .iter()
            .enumerate()
            .map(|(idx, step)| convert_core_step_to_smart(step, idx))
            .collect();

        SmartScript {
            id: self.id.clone(),
            name: self.name.clone(),
            description: self.description.clone(),
            version: self.version.clone(),
            created_at: self.created_at,
            updated_at: self.updated_at,
            author: self.author.clone(),
            category: self.category.clone(),
            tags: self.tags.clone(),
            steps,
            config: Some(SmartScriptConfig {
                continue_on_error: self.config.continue_on_error,
                auto_verification_enabled: self.config.auto_verification_enabled,
                smart_recovery_enabled: self.config.smart_recovery_enabled,
                detailed_logging: self.config.detailed_logging,
            }),
        }
    }
}

/// 将核心域步骤转换为 GUI 格式步骤
fn convert_core_step_to_smart(step: &ScriptStep, order: usize) -> SmartScriptStepRaw {
    let (step_type, parameters) = match &step.action {
        StepAction::Click(target) => {
            let mut params = serde_json::Map::new();
            if let Some(ref xpath) = target.xpath {
                params.insert("xpath".to_string(), serde_json::json!(xpath));
            }
            if let Some((x, y)) = target.coordinates {
                params.insert("x".to_string(), serde_json::json!(x));
                params.insert("y".to_string(), serde_json::json!(y));
            }
            if let Some(ref text) = target.text_match {
                params.insert("text".to_string(), serde_json::json!(text));
            }
            if let Some(ref res_id) = target.resource_id {
                params.insert("resource_id".to_string(), serde_json::json!(res_id));
            }
            ("tap".to_string(), serde_json::Value::Object(params))
        }
        StepAction::Input(input) => {
            let mut params = serde_json::Map::new();
            params.insert("text".to_string(), serde_json::json!(input.text));
            params.insert("clear_first".to_string(), serde_json::json!(input.clear_first));
            if let Some(ref xpath) = input.target.xpath {
                params.insert("xpath".to_string(), serde_json::json!(xpath));
            }
            if let Some((x, y)) = input.target.coordinates {
                params.insert("x".to_string(), serde_json::json!(x));
                params.insert("y".to_string(), serde_json::json!(y));
            }
            ("input".to_string(), serde_json::Value::Object(params))
        }
        StepAction::Swipe(swipe) => {
            let params = serde_json::json!({
                "start_x": swipe.start.0,
                "start_y": swipe.start.1,
                "end_x": swipe.end.0,
                "end_y": swipe.end.1,
                "duration_ms": swipe.duration_ms
            });
            ("swipe".to_string(), params)
        }
        StepAction::Wait(wait) => {
            let params = serde_json::json!({
                "duration_ms": wait.duration_ms
            });
            ("wait".to_string(), params)
        }
        StepAction::Back => {
            let params = serde_json::json!({
                "key_code": 4
            });
            ("key_event".to_string(), params)
        }
        StepAction::Screenshot => {
            ("screenshot".to_string(), serde_json::json!({}))
        }
        StepAction::Custom(cmd) => {
            (cmd.command_type.clone(), cmd.params.clone())
        }
    };

    SmartScriptStepRaw {
        id: step.id.clone(),
        step_type,
        name: step.name.clone(),
        description: step.description.clone(),
        parameters,
        enabled: step.enabled,
        order: order as i32,
    }
}

// ============================================================================
// 统一加载函数
// ============================================================================

/// 从 JSON 内容加载脚本 (自动检测格式)
pub fn load_script_from_json(content: &str) -> CoreResult<Script> {
    let format = ScriptFormat::detect(content);
    
    match format {
        ScriptFormat::Core => {
            // 直接反序列化为核心格式
            debug!("📂 检测到 Core 格式脚本");
            let script: Script = serde_json::from_str(content)?;
            Ok(script)
        }
        ScriptFormat::Smart => {
            // 反序列化为 GUI 格式，然后转换
            debug!("📂 检测到 Smart (GUI) 格式脚本，执行转换");
            let smart: SmartScript = serde_json::from_str(content)?;
            smart.to_core_script()
        }
        ScriptFormat::AiAgent => {
            // 反序列化为 AI Agent 格式，然后转换
            debug!("📂 检测到 AI Agent 格式脚本，执行转换");
            convert_ai_agent_script_to_core(content)
        }
        ScriptFormat::Unknown => {
            // 尝试所有格式
            debug!("📂 未知格式，尝试逐一解析");
            
            // 先尝试核心格式
            if let Ok(script) = serde_json::from_str::<Script>(content) {
                return Ok(script);
            }
            
            // 再尝试 GUI 格式
            if let Ok(smart) = serde_json::from_str::<SmartScript>(content) {
                return smart.to_core_script();
            }
            
            // 最后尝试 AI Agent 格式
            if let Ok(script) = convert_ai_agent_script_to_core(content) {
                return Ok(script);
            }
            
            Err(CoreError::invalid_input("无法识别的脚本格式"))
        }
    }
}

// ============================================================================
// AI Agent 脚本格式转换
// ============================================================================

/// 将 AI Agent 脚本格式转换为核心域格式
fn convert_ai_agent_script_to_core(content: &str) -> CoreResult<Script> {
    let value: serde_json::Value = serde_json::from_str(content)?;
    
    let id = value.get("id")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .unwrap_or_else(|| format!("ai_script_{}", chrono::Utc::now().timestamp_millis()));
    
    let name = value.get("name")
        .and_then(|v| v.as_str())
        .unwrap_or("AI Agent 脚本")
        .to_string();
    
    let description = value.get("description")
        .or_else(|| value.get("goal"))
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    
    let created_at = value.get("created_at")
        .and_then(|v| v.as_str())
        .and_then(|s| DateTime::parse_from_rfc3339(s).ok())
        .map(|dt| dt.with_timezone(&Utc))
        .unwrap_or_else(Utc::now);
    
    // 转换步骤
    let steps: Vec<ScriptStep> = value.get("steps")
        .and_then(|s| s.as_array())
        .map(|arr| {
            arr.iter()
                .enumerate()
                .filter_map(|(idx, step)| convert_ai_agent_step_to_core(step, idx).ok())
                .collect()
        })
        .unwrap_or_default();
    
    Ok(Script {
        id,
        name,
        description,
        version: value.get("version").and_then(|v| v.as_str()).unwrap_or("1.0.0").to_string(),
        created_at,
        updated_at: Utc::now(),
        author: value.get("author").and_then(|v| v.as_str()).unwrap_or("AI Agent").to_string(),
        category: value.get("category").and_then(|v| v.as_str()).unwrap_or("AI脚本").to_string(),
        tags: vec!["ai_agent".to_string(), "自动化".to_string()],
        steps,
        config: ScriptConfig::default(),
        metadata: HashMap::new(),
    })
}

/// 将单个 AI Agent 步骤转换为核心域步骤
fn convert_ai_agent_step_to_core(step: &serde_json::Value, order: usize) -> CoreResult<ScriptStep> {
    let action_type = step.get("action")
        .and_then(|v| v.as_str())
        .ok_or_else(|| CoreError::invalid_input("AI Agent 步骤缺少 action 字段"))?;
    
    let step_name = step.get("step_name")
        .or_else(|| step.get("name"))
        .and_then(|v| v.as_str())
        .unwrap_or("AI Agent 步骤")
        .to_string();
    
    let description = step.get("description")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    
    let wait_after = step.get("wait_after")
        .and_then(|v| v.as_u64())
        .unwrap_or(1000) as u32;
    
    // 根据 action 类型转换
    let (step_type, action) = match action_type {
        "launch_app" => {
            // 🎯 修复：从 params 对象中获取 package_name
            let params = step.get("params").unwrap_or(step);
            let package = params.get("package_name")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            (StepType::Normal, StepAction::Custom(CustomCommand {
                command_type: "launch_app".to_string(),
                params: serde_json::json!({ "package_name": package }),
            }))
        }
        
        "tap" | "tap_element" => {
            let params = step.get("params").unwrap_or(step);
            let x = params.get("x").and_then(|v| v.as_i64()).unwrap_or(0) as i32;
            let y = params.get("y").and_then(|v| v.as_i64()).unwrap_or(0) as i32;
            (StepType::Normal, StepAction::Click(ClickTarget::coordinates(x, y)))
        }
        
        "tap_relative" => {
            // 相对点击 - 保存为自定义命令以保留参数
            (StepType::Normal, StepAction::Custom(CustomCommand {
                command_type: "tap_relative".to_string(),
                params: step.clone(),
            }))
        }
        
        "swipe_screen" | "swipe" => {
            let params = step.get("params").unwrap_or(step);
            let direction = params.get("direction")
                .and_then(|v| v.as_str())
                .unwrap_or("up");
            let distance = params.get("distance")
                .and_then(|v| v.as_str())
                .unwrap_or("medium");
            
            // 根据方向和距离计算滑动坐标
            let (start, end) = calculate_swipe_coords(direction, distance);
            let duration = params.get("duration_ms")
                .and_then(|v| v.as_u64())
                .unwrap_or(300);
            
            (StepType::Normal, StepAction::Swipe(SwipeParams {
                start,
                end,
                duration_ms: duration,
            }))
        }
        
        "input_text" => {
            let params = step.get("params").unwrap_or(step);
            let text = params.get("text")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            (StepType::Normal, StepAction::Input(InputContent {
                target: ClickTarget::xpath(""),  // 默认空 xpath，需要从其他字段获取
                text,
                clear_first: true,
            }))
        }
        
        "press_key" => {
            let params = step.get("params").unwrap_or(step);
            let key = params.get("key")
                .and_then(|v| v.as_str())
                .unwrap_or("back");
            if key == "back" {
                (StepType::Normal, StepAction::Back)
            } else {
                (StepType::Normal, StepAction::Custom(CustomCommand {
                    command_type: "press_key".to_string(),
                    params: serde_json::json!({ "key": key }),
                }))
            }
        }
        
        "wait" => {
            let params = step.get("params").unwrap_or(step);
            let duration = params.get("duration_ms")
                .or_else(|| step.get("wait_after"))
                .and_then(|v| v.as_u64())
                .unwrap_or(1000);
            (StepType::Wait, StepAction::Wait(WaitParams {
                duration_ms: duration,
                condition: None,
            }))
        }
        
        "find_elements" | "extract_comments" => {
            // 这些是 AI Agent 专用的智能查找工具，保存为自定义命令
            (StepType::Normal, StepAction::Custom(CustomCommand {
                command_type: action_type.to_string(),
                params: step.clone(),
            }))
        }
        
        _ => {
            // 未知类型保存为自定义命令
            warn!("⚠️ AI Agent 未知步骤类型: {}", action_type);
            (StepType::Normal, StepAction::Custom(CustomCommand {
                command_type: action_type.to_string(),
                params: step.clone(),
            }))
        }
    };
    
    Ok(ScriptStep {
        id: format!("ai_step_{}_{}", order, chrono::Utc::now().timestamp_millis()),
        step_type,
        name: step_name,
        description,
        action,
        enabled: true,
        timeout_ms: wait_after as u64,
        retry_count: step.get("retry_count").and_then(|v| v.as_u64()).unwrap_or(3) as u32,
        delay_after_ms: step.get("delay_after_ms").and_then(|v| v.as_u64()).unwrap_or(500),
    })
}

/// 根据方向和距离计算滑动坐标（假设屏幕分辨率 1080x1920）
fn calculate_swipe_coords(direction: &str, distance: &str) -> ((i32, i32), (i32, i32)) {
    let screen_width = 1080;
    let screen_height = 1920;
    let center_x = screen_width / 2;
    let center_y = screen_height / 2;
    
    let dist = match distance {
        "small" => 200,
        "large" => 600,
        _ => 400, // medium
    };
    
    match direction {
        "up" => ((center_x, center_y + dist / 2), (center_x, center_y - dist / 2)),
        "down" => ((center_x, center_y - dist / 2), (center_x, center_y + dist / 2)),
        "left" => ((center_x + dist / 2, center_y), (center_x - dist / 2, center_y)),
        "right" => ((center_x - dist / 2, center_y), (center_x + dist / 2, center_y)),
        _ => ((center_x, center_y + dist / 2), (center_x, center_y - dist / 2)), // default up
    }
}

// ============================================================================
// 测试
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_bounds() {
        let bounds = "[864,2240][1080,2358]";
        let center = parse_bounds_to_center(bounds);
        assert_eq!(center, Some((972, 2299)));
    }

    #[test]
    fn test_format_detection_smart() {
        let content = r#"{
            "id": "test",
            "name": "test",
            "steps": [{"step_type": "smart_find_element", "parameters": {}}]
        }"#;
        assert_eq!(ScriptFormat::detect(content), ScriptFormat::Smart);
    }

    #[test]
    fn test_format_detection_core() {
        let content = r#"{
            "id": "test",
            "name": "test",
            "steps": [{"action": {"type": "click"}}]
        }"#;
        assert_eq!(ScriptFormat::detect(content), ScriptFormat::Core);
    }
}
