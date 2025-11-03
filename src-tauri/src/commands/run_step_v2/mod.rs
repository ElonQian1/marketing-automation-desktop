// src-tauri/src/commands/run_step_v2/mod.rs
// module: v2-execution | layer: commands | role: V2统一执行协议入口
// summary: 实现三条执行链(static/step/chain)的真机执行，支持完整的V2协议

// 🏗️ 子模块声明
mod sm_integration;
mod validation;
mod types;
mod matching;
mod execution;
mod utils;
mod legacy;

// 重导出 types 模块的公共类型（供外部模块使用）
pub use types::*;

// 重导出 matching 模块的功能
use matching::{UnifiedScoringCore, resolve_selector_with_priority, SelectorSource, coord_fallback_hit_test};

// 重导出 execution 模块的功能
use execution::{execute_v2_action_with_coords, run_decision_chain_v2 as run_decision_chain_v2_impl};

// 重导出 utils 模块的功能
use utils::{
    generate_disambiguation_suggestions,
    expand_coordinate_params,
    is_selector_free_action,
    is_coordinate_swipe,
    create_dummy_candidate,
    check_safety_gates,
    safety_result_to_response,
    SafetyGateResult,
};

// 重导出 legacy 模块的废弃功能
pub use legacy::run_step_v2_legacy;

use tauri::{command, AppHandle};
use serde::{Deserialize, Serialize};
use anyhow::Result;
use regex;

use crate::services::ui_reader_service::{get_ui_dump, UIElement};
use crate::infra::adb::input_helper::{tap_injector_first, input_text_injector_first, swipe_injector_first};
use crate::infra::adb::keyevent_helper::keyevent_code_injector_first;
use crate::engine::{FallbackController, XmlIndexer};
use crate::engine::strategy_plugin::{StrategyRegistry, ExecutionEnvironment};

// 导入 validation 模块的安全检查函数
use validation::{check_fullscreen_node, check_container_node, parse_xml_attribute, parse_bounds_from_string};

// V2 执行模式（匹配前端枚举）
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum StepRunMode { 
    MatchOnly,
    ExecuteStep,
}

impl Default for StepRunMode {
    fn default() -> Self { StepRunMode::ExecuteStep }
}

// V2 策略类型（匹配前端）
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum StrategyKind {
    Intelligent,
    Standard,
    Absolute,
    Custom,
}


// ========== V2 运行时专用类型（不在 types 模块中） ==========

#[derive(Debug, Clone, Deserialize)]
pub struct RunStepRequestV2 {
    pub device_id: String,
    pub mode: StepRunMode,
    pub strategy: StrategyKind,
    pub step: serde_json::Value, // StepPayload 复杂结构，暂用 Value
}

fn default_true() -> bool { true }

// 旧版兼容结构体（保持兼容性）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StepAction {
    pub action_type: ActionType,
    pub target_element: Option<ElementCriteria>,
    pub input_text: Option<String>,
    pub coordinates: Option<(f64, f64)>,
    pub swipe_direction: Option<SwipeDirection>,
    pub key_code: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ActionType {
    Tap,
    DoubleTap, 
    LongPress,
    Swipe,
    Type,
    Wait,
    Back,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ElementCriteria {
    pub text: Option<String>,
    pub resource_id: Option<String>,
    pub class_name: Option<String>,
    pub content_desc: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SwipeDirection {
    pub from_x: f64,
    pub from_y: f64,
    pub to_x: f64,
    pub to_y: f64,
}

// V2 响应结构体（匹配前端 RunStepResponseV2）
#[derive(Debug, Clone, Serialize)]
pub struct MatchCandidate {
    pub id: String,
    pub score: f64,
    pub confidence: f64,
    pub bounds: Bounds,
    pub text: Option<String>,
    pub class_name: Option<String>,
    pub package_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bounds {
    pub left: i32,
    pub top: i32,
    pub right: i32,
    pub bottom: i32,
}

#[derive(Debug, Clone, Serialize)]
pub struct ExecInfo { 
    pub ok: bool, 
    pub action: String,
    pub execution_time_ms: u64,
}

#[derive(Debug, Serialize)]
pub struct StepResponseV2 {
    pub ok: bool,
    pub message: String,
    pub matched: Option<MatchCandidate>,
    pub executed_action: Option<String>,
    pub verify_passed: Option<bool>,
    pub error_code: Option<String>,
    pub raw_logs: Option<Vec<String>>,
}

// 内部匹配信息（用于日志）
#[derive(Debug, Clone)]
pub struct MatchInfo { 
    pub uniqueness: i32, 
    pub confidence: f32,
    pub elements_found: i32,
}

// 旧版兼容结构体
#[derive(Debug, Serialize)]
pub struct StepExecutionResult {
    pub success: bool,
    pub message: String,
    pub execution_time_ms: u64,
    pub verification_passed: bool,
    pub found_elements: Vec<UIElement>,
}

// V2 统一执行入口（前端兼容接口）
#[command]
pub async fn run_step_v2(app_handle: AppHandle, request: RunStepRequestV2) -> Result<StepResponseV2, String> {
    tracing::info!(
        "engine=v2 device_id={} mode={:?} strategy={:?}",
        request.device_id, request.mode, request.strategy
    );
    tracing::info!("bridge=ADB shadow=false dump_source=Device");
    
    // 简化处理：当前只实现 step 执行链.
    execute_v2_step(app_handle, &request).await
}
 

// V2 步骤执行（匹配前端数据结构）
async fn execute_v2_step(app_handle: AppHandle, req: &RunStepRequestV2) -> Result<StepResponseV2, String> {
    // 🎯 处理coordinateParams参数展开
    let step_with_coords = expand_coordinate_params(&req.step);
    
    let action_type = step_with_coords.get("action").and_then(|v| v.as_str()).unwrap_or("tap");
    
    // 🎯 检测无需选择器的操作类型（系统按键、输入等）
    if is_selector_free_action(action_type) {
        tracing::info!("🎯 检测到无选择器操作: {}, 跳过元素匹配直接执行", action_type);
        
        let dummy_candidate = create_dummy_candidate(action_type);
        
        // 直接执行操作
        match execute_v2_action_with_coords(&step_with_coords, &req.device_id, &dummy_candidate).await {
            Ok(exec_info) => {
                tracing::info!("✅ {}执行成功: {}", action_type, exec_info.action);
                return Ok(StepResponseV2 {
                    ok: true,
                    message: exec_info.action,
                    matched: Some(dummy_candidate),
                    executed_action: Some(action_type.to_string()),
                    verify_passed: Some(true),
                    error_code: None,
                    raw_logs: Some(vec![format!("{}执行成功", action_type)]),
                });
            },
            Err(e) => {
                tracing::error!("❌ {}执行失败: {}", action_type, e);
                return Ok(StepResponseV2 {
                    ok: false,
                    message: format!("{}执行失败: {}", action_type, e),
                    matched: None,
                    executed_action: None,
                    verify_passed: Some(false),
                    error_code: Some(format!("{}_EXEC_FAILED", action_type.to_uppercase())),
                    raw_logs: Some(vec![format!("{}失败: {}", action_type, e)]),
                });
            }
        }
    }
    
    // 🎯 检测坐标滑动操作
    if is_coordinate_swipe(&step_with_coords, action_type) {
        tracing::info!("🎯 检测到坐标滑动操作，跳过元素匹配直接执行");
        tracing::info!("📐 坐标参数: start_x={:?}, start_y={:?}, end_x={:?}, end_y={:?}", 
                      step_with_coords.get("start_x"), 
                      step_with_coords.get("start_y"),
                      step_with_coords.get("end_x"), 
                      step_with_coords.get("end_y"));
        
        let dummy_candidate = create_dummy_candidate("坐标滑动");
        
        // 直接执行坐标操作
        match execute_v2_action_with_coords(&step_with_coords, &req.device_id, &dummy_candidate).await {
            Ok(exec_info) => {
                tracing::info!("✅ 坐标滑动执行成功: {}", exec_info.action);
                return Ok(StepResponseV2 {
                    ok: true,
                    message: exec_info.action,
                    matched: Some(dummy_candidate),
                    executed_action: Some("swipe".to_string()),
                    verify_passed: Some(true),
                    error_code: None,
                    raw_logs: Some(vec!["坐标滑动执行成功".to_string()]),
                });
            },
            Err(e) => {
                tracing::error!("❌ 坐标滑动执行失败: {}", e);
                return Ok(StepResponseV2 {
                    ok: false,
                    message: format!("坐标滑动执行失败: {}", e),
                    matched: None,
                    executed_action: None,
                    verify_passed: Some(false),
                    error_code: Some("COORD_EXEC_FAILED".to_string()),
                    raw_logs: Some(vec![format!("坐标滑动失败: {}", e)]),
                });
            }
        }
    }
    
    // � 创建使用修改后步骤的请求对象，用于后续函数调用
    let req_with_coords = RunStepRequestV2 {
        device_id: req.device_id.clone(),
        mode: req.mode.clone(), 
        strategy: req.strategy.clone(),
        step: step_with_coords,
    };
    
    // �🔍 第一步：查询 selection_mode 和 batch_config
    let selector_id = req_with_coords.step.get("step_id").and_then(|v| v.as_str())
        .or_else(|| req_with_coords.step.get("selector").and_then(|v| v.as_str()));

    let (selection_mode, batch_config) = if let Some(id) = selector_id {
        let mut strategy_opt = crate::commands::intelligent_analysis::get_step_strategy(id.to_string()).await.ok().flatten();
        
        // 尝试用 selector 查询（兜底）
        if strategy_opt.is_none() {
            if let Some(selector) = req_with_coords.step.get("selector").and_then(|v| v.as_str()) {
                if selector != id {
                    strategy_opt = crate::commands::intelligent_analysis::get_step_strategy(selector.to_string()).await.ok().flatten();
                }
            }
        }
        
        match strategy_opt {
            Some(strategy) => {
                tracing::info!("🎯 从Store获取执行模式: selection_mode={:?}, has_batch_config={}", 
                              strategy.selection_mode, strategy.batch_config.is_some());
                (strategy.selection_mode.clone(), strategy.batch_config.clone())
            }
            None => (None, None)
        }
    } else {
        (None, None)
    };
    
    // 获取真实的UI dump
    tracing::info!("🔍 开始获取设备UI dump...");
    let ui_dump_result = get_ui_dump(&req.device_id).await;
    
    let (match_info, candidates) = match ui_dump_result {
        Ok(ui_xml) => {
            tracing::info!("✅ UI dump获取成功，大小: {} 字符", ui_xml.len());
            
            // 进行真实的元素匹配，传递 selection_mode
            match find_element_in_ui(&ui_xml, &req_with_coords, selection_mode.clone()).await {
                Ok((info, cands)) => {
                    tracing::info!("matched: uniq={} conf={:.2} candidates={}", info.uniqueness, info.confidence, cands.len());
                    (info, cands)
                },
                Err(e) => {
                    tracing::error!("❌ 元素匹配失败: {}", e);
                    return Ok(StepResponseV2 {
                        ok: false,
                        message: format!("元素匹配失败: {}", e),
                        matched: None,
                        executed_action: None,
                        verify_passed: Some(false),
                        error_code: Some("MATCH_FAILED".to_string()),
                        raw_logs: Some(vec![format!("匹配失败: {}", e)]),
                    });
                }
            }
        },
        Err(e) => {
            tracing::error!("❌ UI dump获取失败: {}", e);
            return Ok(StepResponseV2 {
                ok: false,
                message: format!("UI dump获取失败: {}", e),
                matched: None,
                executed_action: None,
                verify_passed: Some(false),
                error_code: Some("UI_DUMP_FAILED".to_string()),
                raw_logs: Some(vec![format!("UI dump失败: {}", e)]),
            });
        }
    };
    
    // 检查是否有候选
    if candidates.is_empty() {
        return Ok(StepResponseV2 {
            ok: false,
            message: "未找到匹配的元素".to_string(),
            matched: None,
            executed_action: None,
            verify_passed: Some(false),
            error_code: Some("NO_MATCH".to_string()),
            raw_logs: Some(vec!["未找到匹配元素".to_string()]),
        });
    }
    
    // 🎯 根据 selection_mode 决定执行策略
    let is_batch_mode = selection_mode.as_deref() == Some("all");
    
    if is_batch_mode {
        tracing::info!("� 批量执行模式：将依次点击 {} 个元素", candidates.len());
        
        // 获取批量配置
        let interval_ms = batch_config.as_ref()
            .and_then(|cfg| cfg.get("interval_ms"))
            .and_then(|v| v.as_u64())
            .unwrap_or(500);
        
        let mut success_count = 0;
        let mut failed_count = 0;
        let mut logs = Vec::new();
        
        // 获取 ADB 路径
        let adb_path = if std::path::Path::new("platform-tools/adb.exe").exists() {
            "platform-tools/adb.exe"
        } else if std::path::Path::new("D:\\leidian\\LDPlayer9\\adb.exe").exists() {
            "D:\\leidian\\LDPlayer9\\adb.exe"
        } else {
            "adb"
        };
        
        for (index, candidate) in candidates.iter().enumerate() {
            tracing::info!("📍 批量执行 {}/{}: bounds=({},{},{},{})", 
                          index + 1, candidates.len(),
                          candidate.bounds.left, candidate.bounds.top,
                          candidate.bounds.right, candidate.bounds.bottom);
            
            // 计算点击坐标（元素中心点）
            let x = (candidate.bounds.left + candidate.bounds.right) / 2;
            let y = (candidate.bounds.top + candidate.bounds.bottom) / 2;
            
            tracing::info!("🎯 批量点击坐标: ({}, {})", x, y);
            
            // 执行点击
            let tap_result = tap_injector_first(adb_path, &req.device_id, x, y, None).await;
            
            match tap_result {
                Ok(_) => {
                    success_count += 1;
                    logs.push(format!("✅ 第{}个元素点击成功 ({}, {})", index + 1, x, y));
                }
                Err(e) => {
                    failed_count += 1;
                    logs.push(format!("❌ 第{}个元素点击失败: {}", index + 1, e));
                    tracing::warn!("❌ 批量执行失败: {}", e);
                }
            }
            
            // 间隔延迟
            if index < candidates.len() - 1 {
                tokio::time::sleep(tokio::time::Duration::from_millis(interval_ms)).await;
            }
        }
        
        return Ok(StepResponseV2 {
            ok: success_count > 0,
            message: format!("批量执行完成：成功 {}/{}，失败 {}", success_count, candidates.len(), failed_count),
            matched: candidates.first().cloned(),
            executed_action: Some("batch_tap".to_string()),
            verify_passed: Some(success_count == candidates.len()),
            error_code: if failed_count > 0 { Some("PARTIAL_FAILURE".to_string()) } else { None },
            raw_logs: Some(logs),
        });
    }
    
    // 非批量模式：使用第一个候选
    let match_candidate = candidates.into_iter().next().unwrap();

    // 安全闸门检查
    let safety_result = check_safety_gates(&match_info, &match_candidate);
    if let Some(error_response) = safety_result_to_response(safety_result, match_candidate.clone()) {
        return Ok(error_response);
    }

    if matches!(req.mode, StepRunMode::MatchOnly) {
        return Ok(StepResponseV2 {
            ok: true,
            message: "仅匹配模式，未执行操作".to_string(),
            matched: Some(match_candidate),
            executed_action: None,
            verify_passed: None,
            error_code: None,
            raw_logs: Some(vec!["匹配成功".to_string()]),
        });
    }
    
    // 执行操作
    let exec_result = execute_v2_action_with_coords(&req_with_coords.step, &req_with_coords.device_id, &match_candidate).await?;
    let action_type = req_with_coords.step.get("action").and_then(|v| v.as_str()).unwrap_or("unknown");
    
    Ok(StepResponseV2 {
        ok: exec_result.ok,
        message: "V2执行成功".to_string(),
        matched: Some(match_candidate),
        executed_action: Some(action_type.to_string()),
        verify_passed: Some(true),
        error_code: None,
        raw_logs: Some(vec![
            format!("匹配: 置信度{:.1}%", match_info.confidence * 100.0),
            format!("执行: {} ({}ms)", exec_result.action, exec_result.execution_time_ms),
        ]),
    })
}

// 在UI dump中查找匹配的元素
async fn find_element_in_ui(ui_xml: &str, req: &RunStepRequestV2, selection_mode: Option<String>) -> Result<(MatchInfo, Vec<MatchCandidate>), String> {
    // 🔥 关键调试：输出接收到的selection_mode
    tracing::info!("🔥 [find_element_in_ui] 接收到 selection_mode: {:?}", selection_mode);
    
    // 🏗️ 【Phase 4 新增】结构匹配优先策略
    // 如果步骤数据包含 structural_signatures，优先使用 sm_match_once
    if let Some(structural_sigs_value) = req.step.get("structural_signatures") {
        tracing::info!("🏗️ [SM Integration] 检测到结构签名，优先使用结构匹配Runtime");
        
        // 尝试反序列化 structural_signatures
        if let Ok(structural_sigs) = serde_json::from_value::<StructuralSignatures>(structural_sigs_value.clone()) {
            // 构建 SmStaticEvidence（简化版）
            let sm_evidence = sm_integration::SmStaticEvidence {
                resource_id: req.step.get("resource_id").and_then(|v| v.as_str()).map(String::from),
                text: req.step.get("text").and_then(|v| v.as_str()).map(String::from),
                content_desc: req.step.get("content_desc").and_then(|v| v.as_str()).map(String::from),
                class: req.step.get("class").and_then(|v| v.as_str()).map(String::from),
                bounds: req.step.get("bounds").and_then(|v| {
                    if let Some(arr) = v.as_array() {
                        if arr.len() == 4 {
                            Some(Bounds {
                                left: arr[0].as_i64().unwrap_or(0) as i32,
                                top: arr[1].as_i64().unwrap_or(0) as i32,
                                right: arr[2].as_i64().unwrap_or(0) as i32,
                                bottom: arr[3].as_i64().unwrap_or(0) as i32,
                            })
                        } else {
                            None
                        }
                    } else {
                        None
                    }
                }),
                xpath: req.step.get("xpath").and_then(|v| v.as_str()).map(String::from),
                leaf_index: req.step.get("leaf_index").and_then(|v| v.as_i64()).map(|i| i as i32),
                structural_signatures: Some(structural_sigs),
            };
            
            // 🎯 调用结构匹配集成
            match sm_integration::match_with_structural_matching(&req.device_id, ui_xml, &sm_evidence).await {
                Ok(candidates) if !candidates.is_empty() => {
                    let match_info = MatchInfo {
                        uniqueness: if candidates.len() == 1 { 1 } else { 0 },
                        confidence: candidates.first().map(|c| c.score).unwrap_or(0.0) as f32,
                        elements_found: candidates.len() as i32,
                    };
                    
                    tracing::info!(
                        "✅ [SM Integration] 结构匹配成功 | 候选数={} | 最高分={:.2} | 唯一性={}",
                        candidates.len(),
                        match_info.confidence,
                        match_info.uniqueness
                    );
                    
                    return Ok((match_info, candidates));
                }
                Ok(_) => {
                    tracing::info!("🔄 [SM Integration] 结构匹配无结果，fallback到传统评分");
                }
                Err(e) => {
                    tracing::warn!("⚠️ [SM Integration] 结构匹配失败: {} | fallback到传统评分", e);
                }
            }
        } else {
            tracing::warn!("⚠️ [SM Integration] structural_signatures 反序列化失败，fallback到传统评分");
        }
    }
    
    // 🔄 Fallback：传统匹配流程
    tracing::info!("🔄 [Fallback] 使用传统tristate评分匹配");
    
    // 解析步骤中的匹配条件
    // 输出完整的步骤参数用于调试
    tracing::info!("🔍 V2引擎收到的完整步骤参数: {:?}", req.step);
    
    // 选择器解析：优先级 Inline > Store > CoordFallback
    let (selector_source, target_text, target_xpath, target_resource_id, target_class, target_content_desc) = 
        resolve_selector_with_priority(req).await?;
    
    tracing::info!("🎯 selector_source={:?}", selector_source);
    
    // 🔍 关键自测点1：选择器来源跟踪
    match selector_source {
        SelectorSource::Inline => tracing::info!("✅ 使用卡片内联selector"),
        SelectorSource::Store => tracing::info!("✅ 从step_id查询store获得selector"),  
        SelectorSource::CoordFallback => tracing::info!("⚠️ 启用坐标兜底模式"),
        SelectorSource::None => tracing::error!("❌ 无任何有效selector来源"),
    }    tracing::info!("🔍 最终搜索条件: text={:?}, xpath={:?}, resourceId={:?}, className={:?}, contentDesc={:?}", 
                   target_text, target_xpath, target_resource_id, target_class, target_content_desc);
    
    // 🔍 关键自测点2：选择器字段验证  
    let has_selector_fields = target_text.is_some() || target_xpath.is_some() || 
                             target_resource_id.is_some() || target_class.is_some() || 
                             target_content_desc.is_some();
    if !has_selector_fields {
        tracing::error!("❌ 自测失败: 所有selector字段均为None - 必定触发NO_SELECTOR");
    } else {
        tracing::info!("✅ 自测通过: 至少有一个selector字段非None");
    }
    
    // 🎯 处理坐标兜底场景
    if matches!(selector_source, SelectorSource::CoordFallback) {
        tracing::info!("🎯 执行坐标Hit-Test");
        match coord_fallback_hit_test(ui_xml, req).await {
            Ok(candidate) => {
                let match_info = MatchInfo {
                    uniqueness: 1, // Hit-Test保证唯一性
                    confidence: candidate.confidence as f32,
                    elements_found: 1,
                };
                return Ok((match_info, vec![candidate])); // 返回Vec而不是单个
            }
            Err(e) => {
                return Err(format!("坐标兜底失败: {}", e));
            }
        }
    }
    
    // 🛡️ 检查是否有任何选择器（非坐标兜底情况）
    let has_any_selector = target_text.is_some() || target_xpath.is_some() || 
                           target_resource_id.is_some() || target_class.is_some() || 
                           target_content_desc.is_some();
    
    if !has_any_selector {
        tracing::error!("❌ 没有提供任何选择器条件，拒绝执行");
        return Err("NO_SELECTOR: 必须提供至少一个选择器条件 (text/xpath/resourceId/className/contentDesc)".to_string());
    }
    
    // 简单的XML解析 - 查找匹配的节点
    let mut best_match: Option<MatchCandidate> = None;
    let mut best_score = 0.0f64;
    let mut elements_found = 0;
    let mut matching_candidates = Vec::new(); // 收集所有匹配的候选
    
    // 使用正则表达式解析XML节点
    let node_regex = regex::Regex::new(r#"<node[^>]*>"#).unwrap();
    
    for node_match in node_regex.find_iter(ui_xml) {
        elements_found += 1;
        let node_str = node_match.as_str();
        
        let mut score = 0.0f64;
        let mut matches = 0;
        
        // 提取节点属性
        let text = parse_xml_attribute(node_str, "text");
        let resource_id = parse_xml_attribute(node_str, "resource-id");
        let class_name = parse_xml_attribute(node_str, "class");
        let content_desc = parse_xml_attribute(node_str, "content-desc");
        let bounds_str = parse_xml_attribute(node_str, "bounds");
        
        // 一致性评分：考虑与静态分析结果的一致性
        let mut successful_matches = 0;
        
        // 🔥 强锚点匹配 - ResourceId & XPath 同等权重（P0级别）
        
        // Resource ID匹配 - 强证据（通常跨版本稳定）
        if let Some(ref target) = target_resource_id {
            match &resource_id {
                Some(node_id) if node_id.contains(target.as_str()) || target.contains(node_id.as_str()) => {
                    score += 0.85; // ResourceId完全匹配 - 强锚点
                    successful_matches += 1;
                    tracing::debug!("🎯 ResourceId强匹配: {} <-> {}", target, node_id);
                }
                Some(node_id) => {
                    score -= 0.50; // 不一致扣分 - 严重失配
                    tracing::debug!("❌ ResourceId不一致: {} <-> {}", target, node_id);
                }
                None => {
                    score -= 0.35; // 从有到缺失 - 失去强锚点
                    tracing::debug!("⚠️ ResourceId退化: 静态有({}) → 真机缺失", target);
                }
            }
        } else {
            // 静态分析时ResourceId就缺失 - 中性处理
            match &resource_id {
                Some(_) => {
                    // 从缺失到出现新值 - 不确定是好是坏，微弱扣分
                    score -= 0.08;
                    tracing::debug!("⚪ ResourceId意外出现: 静态缺失 → 真机有值");
                }
                None => {
                    // 保持缺失一致性 - 极弱奖励
                    score += 0.02;
                    tracing::debug!("✓ ResourceId一致缺失");
                }
            }
        }
        
        // XPath匹配 - 强证据（与ResourceId同等权重）
        if let Some(ref target) = target_xpath {
            if target.starts_with('/') || target.starts_with("//") {
                // 简化XPath匹配：检查路径中的关键类名
                match &class_name {
                    Some(node_class) if target.contains(node_class) => {
                        score += 0.85; // XPath匹配 - 强锚点（与ResourceId同级）
                        successful_matches += 1;
                        tracing::debug!("🎯 XPath强匹配: {} 包含 {}", target, node_class);
                    }
                    Some(node_class) => {
                        score -= 0.45; // 不一致扣分 - XPath路径失效
                        tracing::debug!("❌ XPath不一致: {} 不包含 {}", target, node_class);
                    }
                    None => {
                        score -= 0.30; // 从有xpath到缺失class - 路径退化
                        tracing::debug!("⚠️ XPath退化: 预期类名缺失");
                    }
                }
            }
        } else {
            // 静态分析时XPath就缺失 - 中性处理
            match &class_name {
                Some(_) => {
                    score -= 0.05; // 意外出现类名，轻微不确定
                    tracing::debug!("⚪ 类名意外出现: 静态无XPath → 真机有类名");
                }
                None => {
                    score += 0.01; // 保持路径缺失一致
                    tracing::debug!("✓ XPath一致缺失");
                }
            }
        }
        
        // 文本匹配 - P2级别证据
        if let Some(ref target) = target_text {
            match &text {
                Some(node_text) if node_text.contains(target.as_str()) || target.contains(node_text.as_str()) => {
                    score += 0.70; // 文本完全匹配
                    successful_matches += 1;
                    tracing::debug!("✅ 文本匹配: {} <-> {}", target, node_text);
                }
                Some(node_text) => {
                    score -= 0.25; // 文本不匹配
                    tracing::debug!("❌ 文本不匹配: {} <-> {}", target, node_text);
                }
                None => {
                    score -= 0.20; // 从有文本到缺失
                    tracing::debug!("⚠️ 文本从有到缺失: 目标={}", target);
                }
            }
        } else {
            // 静态分析时文本就缺失
            match &text {
                Some(_) => {
                    score -= 0.03; // 从缺失到有值，轻微不一致
                    tracing::debug!("⚪ 文本从缺失到有值，轻微不一致");
                }
                None => {
                    score += 0.02; // 保持缺失一致性
                    tracing::debug!("✓ 文本保持缺失一致");
                }
            }
        }
        
        // 类名匹配 - P3级别弱证据
        if let Some(ref target) = target_class {
            match &class_name {
                Some(node_class) if node_class.contains(target.as_str()) || target.contains(node_class.as_str()) => {
                    score += 0.30; // 类名匹配
                    successful_matches += 1;
                    tracing::debug!("✅ 类名匹配: {} <-> {}", target, node_class);
                }
                Some(node_class) => {
                    score -= 0.15; // 类名不匹配
                    tracing::debug!("❌ 类名不匹配: {} <-> {}", target, node_class);
                }
                None => {
                    score -= 0.10; // 从有类名到缺失
                    tracing::debug!("⚠️ 类名从有到缺失: 目标={}", target);
                }
            }
        } else {
            // 静态分析时类名就缺失  
            match &class_name {
                Some(_) => {
                    score -= 0.02; // 从缺失到有值，轻微不一致
                    tracing::debug!("⚪ 类名从缺失到有值，轻微不一致");
                }
                None => {
                    score += 0.01; // 保持缺失一致性
                    tracing::debug!("✓ 类名保持缺失一致");
                }
            }
        }
        
        // Content Description匹配 - P2级别证据
        if let Some(ref target) = target_content_desc {
            match &content_desc {
                Some(node_desc) if node_desc.contains(target.as_str()) || target.contains(node_desc.as_str()) => {
                    score += 0.60; // Content-desc匹配
                    successful_matches += 1;
                    tracing::debug!("✅ Content-desc匹配: {} <-> {}", target, node_desc);
                }
                Some(node_desc) => {
                    score -= 0.20; // Content-desc不匹配
                    tracing::debug!("❌ Content-desc不匹配: {} <-> {}", target, node_desc);
                }
                None => {
                    score -= 0.15; // 从有content-desc到缺失
                    tracing::debug!("⚠️ Content-desc从有到缺失: 目标={}", target);
                }
            }
        } else {
            // 静态分析时content-desc就缺失
            match &content_desc {
                Some(_) => {
                    score -= 0.02; // 从缺失到有值，轻微不一致
                    tracing::debug!("⚪ Content-desc从缺失到有值，轻微不一致");
                }
                None => {
                    score += 0.01; // 保持缺失一致性
                    tracing::debug!("✓ Content-desc保持缺失一致");
                }
            }
        }
        
        // 如果没有任何成功匹配，跳过这个元素
        if successful_matches == 0 {
            continue; // 没有任何条件匹配
        }
        
        // 🛡️ 容器类节点降权处理
        if check_container_node(&class_name) {
            tracing::debug!("🔻 容器类节点降权: {} -> {:.2} * 0.1", class_name.as_deref().unwrap_or("unknown"), score);
            score *= 0.1; // 容器类节点大幅降权
        }
        
        // 解析bounds
        let bounds = if let Some(bounds_str) = bounds_str {
            parse_bounds_from_string(&bounds_str).unwrap_or(Bounds { left: 0, top: 0, right: 100, bottom: 100 })
        } else {
            Bounds { left: 0, top: 0, right: 100, bottom: 100 }
        };
        
        // 收集所有有效匹配
        let candidate = MatchCandidate {
            id: format!("element_{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis()),
            score: score,
            confidence: score,
            bounds,
            text: text.clone(),
            class_name: class_name.clone(),
            package_name: resource_id.clone().or_else(|| Some("unknown.package".to_string())),
        };
        
        matching_candidates.push(candidate.clone());
        
        // 更新最佳匹配
        if score > best_score {
            best_score = score;
            best_match = Some(candidate);
        }
    }
    
    if let Some(candidate) = best_match {
        // 📊 双重唯一性标准：置信度阈值 + Top1-Top2间隔
        matching_candidates.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap());
        
        let high_quality_matches = matching_candidates.iter()
            .filter(|c| c.confidence >= 0.70)
            .count();
        
        // 计算Top1-Top2间隔
        let confidence_gap = if matching_candidates.len() >= 2 {
            matching_candidates[0].confidence - matching_candidates[1].confidence
        } else {
            1.0 // 只有一个候选，间隔为最大
        };
        
        // 双重唯一性检查
        let is_unique_by_confidence = high_quality_matches == 1;
        let is_unique_by_gap = confidence_gap >= 0.15; // Top1领先Top2至少15%
        
        let uniqueness = if is_unique_by_confidence || is_unique_by_gap {
            1 
        } else {
            high_quality_matches.max(2) as i32
        };
        
        tracing::info!("🔍 双重唯一性: 总候选={}, 高质量(≥0.70)={}, Top1={:.3}, Gap={:.3}, 唯一性={} (conf:{} gap:{})", 
                      matching_candidates.len(), high_quality_matches, 
                      matching_candidates.get(0).map(|c| c.confidence).unwrap_or(0.0),
                      confidence_gap, uniqueness, is_unique_by_confidence, is_unique_by_gap);
        
        // 🛡️ 双阶段容器拦截检查
        let is_container = check_container_node(&candidate.class_name);
        let is_fullscreen = check_fullscreen_node(&(candidate.bounds.left, candidate.bounds.top, candidate.bounds.right, candidate.bounds.bottom));
        
        if is_container || is_fullscreen {
            let block_type = if is_container { "容器" } else { "整屏" };
            tracing::error!("🛡️ 双阶段容器拦截: {}节点被阻止 class={:?} bounds=({},{},{},{})",
                          block_type, candidate.class_name, 
                          candidate.bounds.left, candidate.bounds.top,
                          candidate.bounds.right, candidate.bounds.bottom);
            return Err(format!("CONTAINER_BLOCKED: {}节点不允许直接点击", block_type));
        } else {
            tracing::info!("✅ 自测通过: 非容器/整屏节点 class={:?} bounds=({},{},{},{})",
                          candidate.class_name, candidate.bounds.left, candidate.bounds.top,
                          candidate.bounds.right, candidate.bounds.bottom);
        }
        
        let match_info = MatchInfo {
            uniqueness,
            confidence: best_score as f32,
            elements_found,
        };
        
        // �️ 安全检查：最低置信度
        let min_confidence = req.step.get("min_confidence")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.70); // 提升默认阈值到0.70
            
        if best_score < min_confidence {
            tracing::warn!("⚠️ 最佳匹配置信度({:.2})低于阈值({:.2})", best_score, min_confidence);
            return Err(format!("LOW_CONFIDENCE: 最佳置信度{:.2}低于阈值{:.2}", best_score, min_confidence));
        }
        
        // 🛡️ 安全检查：整屏/容器拒绝（双阶段拦截）
        let forbid_containers = req.step.get("forbid_fullscreen_or_container")
            .and_then(|v| v.as_bool())
            .unwrap_or(true);
            
        if forbid_containers {
            let candidate_bounds = (candidate.bounds.left, candidate.bounds.top, candidate.bounds.right, candidate.bounds.bottom);
            
            // 🔍 关键自测点4：容器/整屏拦截验证
            if check_fullscreen_node(&candidate_bounds) {
                tracing::warn!("🚫 自测检查: 整屏节点被拦截 bounds=({},{},{},{})", 
                              candidate.bounds.left, candidate.bounds.top, candidate.bounds.right, candidate.bounds.bottom);
                return Err("FULLSCREEN_BLOCKED: 匹配到整屏节点，拒绝执行".to_string());
            }
            
            if check_container_node(&candidate.class_name) {
                tracing::warn!("🚫 自测检查: 容器节点被拦截 class={:?}", candidate.class_name);
                return Err(format!("CONTAINER_BLOCKED: 匹配到容器节点({:?})，拒绝执行", candidate.class_name.as_deref().unwrap_or("unknown")));
            }
            
            tracing::info!("✅ 自测通过: 非容器/整屏节点 class={:?} bounds=({},{},{},{})",
                          candidate.class_name, candidate.bounds.left, candidate.bounds.top, candidate.bounds.right, candidate.bounds.bottom);
        }
        
        // 🔍 检查唯一性约束（批量模式除外）
        let require_uniqueness = req.step.get("require_uniqueness")
            .and_then(|v| v.as_bool())
            .unwrap_or(true);
        
        let is_batch_mode = selection_mode.as_deref() == Some("all");
        
        tracing::info!("🔥 [唯一性检查] selection_mode={:?}, is_batch_mode={}, require_uniqueness={}, uniqueness={}", 
                      selection_mode, is_batch_mode, require_uniqueness, uniqueness);
            
        if require_uniqueness && !is_batch_mode && uniqueness > 1 {
            // 生成解歧建议
            let disambiguation_suggestions = generate_disambiguation_suggestions(&matching_candidates, req);
            tracing::warn!("⚠️ 匹配到{}个元素，违反唯一性约束。建议: {:?}", uniqueness, disambiguation_suggestions);
            return Err(format!("NON_UNIQUE: 匹配到{}个元素。建议添加: {}", uniqueness, disambiguation_suggestions.join(", ")));
        }
        
        if is_batch_mode {
            tracing::info!("🔄 批量模式：返回所有 {} 个高质量候选", matching_candidates.len());
            // 返回所有高质量候选（置信度 >= 0.70）
            let high_quality_candidates: Vec<MatchCandidate> = matching_candidates.into_iter()
                .filter(|c| c.confidence >= 0.70)
                .collect();
            
            let match_info = MatchInfo {
                uniqueness: high_quality_candidates.len() as i32,
                confidence: high_quality_candidates.get(0).map(|c| c.confidence as f32).unwrap_or(0.0),
                elements_found,
            };
            
            return Ok((match_info, high_quality_candidates));
        }
        
        // 非批量模式：返回最佳匹配
        let match_info = MatchInfo {
            uniqueness,
            confidence: best_score as f32,
            elements_found,
        };
        
        Ok((match_info, vec![candidate]))
    } else {
        // 检查是否没有提供匹配条件
        if target_text.is_none() && target_xpath.is_none() && target_resource_id.is_none() && 
           target_class.is_none() && target_content_desc.is_none() {
            return Err("❌ 没有提供任何匹配条件 (text, xpath, resourceId, className, contentDesc)。请在步骤中指定至少一个匹配条件。".to_string());
        }
        Err(format!("❌ 未找到匹配的元素。搜索条件: text={:?}, xpath={:?}, resourceId={:?}, className={:?}, contentDesc={:?}",
                   target_text, target_xpath, target_resource_id, target_class, target_content_desc))
    }
}

// 子锚点→父执行的增强选择器结构
#[derive(Debug, Clone)]
struct EnhancedSelectorInfo {
    source: SelectorSource,
    text: Option<String>,
    xpath: Option<String>, 
    resource_id: Option<String>,
    class_name: Option<String>,
    content_desc: Option<String>,
    // 子锚点→父执行专用字段
    target_node_type: Option<String>,
    anchor_xpath: Option<String>,
    parent_constraint: Option<String>,
    container_xpath: Option<String>,
    i18n_text_variants: Option<Vec<String>>,
}

// 🚀 新增：插件化决策链执行入口（Command 包装器）
#[command]
pub async fn run_decision_chain_v2(app_handle: AppHandle, plan_json: String, device_id: String) -> Result<serde_json::Value, String> {
    // 委托给 execution 模块的实现
    run_decision_chain_v2_impl(app_handle, plan_json, device_id).await
}

// 📊 决策链统计和健康检查
#[command]
pub async fn get_decision_chain_stats() -> Result<serde_json::Value, String> {
    let registry = StrategyRegistry::new();
    
    let stats = serde_json::json!({
        "plugin_system": {
            "total_plugins": registry.list_strategies().len(),
            "available_strategies": registry.list_strategies(),
        },
        "contract": {
            "supported_version": "v2",
            "schema_location": "/shared/plan_schema.json"
        },
        "safety_gates": {
            "uniqueness_validation": true,
            "container_blocking": true,
            "light_checks": true,
            "confidence_threshold": 0.70
        },
        "performance": {
            "default_time_budget_ms": 1200,
            "per_candidate_budget_ms": 180,
            "xml_indexing": "enabled"
        }
    });
    
    Ok(stats)
}
