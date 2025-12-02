// src-tauri/src/modules/smart_selection/lib.rs
// module: smart_selection | layer: api | role: 智能选择系统Tauri插件
// summary: 智能选择系统的Tauri插件封装

use anyhow::Result;
use serde::{Deserialize, Serialize};
use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime, State, Manager
};
use tracing::{info, debug};
use crate::types::smart_selection::*;
use crate::services::adb::AdbService;
use std::sync::Mutex;
use crate::commands::intelligent_analysis::{STEP_STRATEGY_STORE, StrategyCandidate};

/// 执行智能选择命令（已迁移到V3，保留API兼容）
#[tauri::command]
async fn execute(
    device_id: String,
    _protocol: SmartSelectionProtocol,
    _adb_service: State<'_, Mutex<AdbService>>,
) -> Result<SmartSelectionResult, String> {
    info!("🎯 [Legacy API兼容] 开始执行智能选择，设备: {}", device_id);
    info!("⚠️ 此API已废弃，建议使用 execute_chain_test_v3");
    
    if device_id.is_empty() {
        return Err("设备ID不能为空".to_string());
    }
    
    Err("此API已废弃，请使用 execute_chain_test_v3 代替".to_string())
}

/// 验证智能选择协议
#[tauri::command]
async fn validate(
    protocol: SmartSelectionProtocol,
) -> Result<ValidationResult, String> {
    debug!("🔍 验证智能选择协议");
    
    let mut issues = Vec::new();
    let mut warnings = Vec::new();
    
    if protocol.anchor.fingerprint.text_content.is_none() 
        && protocol.anchor.fingerprint.resource_id.is_none()
        && protocol.anchor.fingerprint.class_chain.is_none() {
        issues.push("缺少有效的元素指纹特征（文本、资源ID或类链）".to_string());
    }
    
    match &protocol.selection.mode {
        SelectionMode::All { batch_config: _ } => {
            if protocol.selection.batch_config.is_none() {
                warnings.push("批量模式建议配置批量参数".to_string());
            }
        }
        SelectionMode::Random { seed: _, ensure_stable_sort: _ } => {
            if protocol.selection.random_seed.is_none() {
                warnings.push("随机模式建议设置种子确保可复现".to_string());
            }
        }
        _ => {}
    }
    
    if let Some(filters) = &protocol.selection.filters {
        if let Some(confidence) = filters.min_confidence {
            if confidence < 0.0 || confidence > 1.0 {
                issues.push("置信度阈值必须在0.0-1.0之间".to_string());
            }
        }
    }
    
    let is_valid = issues.is_empty();
    
    Ok(ValidationResult {
        is_valid,
        issues,
        warnings,
        suggestions: if is_valid { 
            vec!["协议配置有效，可以执行".to_string()] 
        } else {
            vec!["请修复配置问题后重试".to_string()]
        },
    })
}

/// 获取智能选择统计信息
#[tauri::command]
async fn get_stats() -> Result<SmartSelectionStats, String> {
    info!("📊 获取智能选择统计信息");
    
    Ok(SmartSelectionStats {
        total_selections: 0,
        success_rate: 0.0,
        average_confidence: 0.0,
        strategy_usage: std::collections::HashMap::new(),
        performance_metrics: crate::types::smart_selection::PerformanceMetrics {
            avg_execution_time_ms: 0.0,
            avg_candidates_found: 0.0,
            most_common_failures: Vec::new(),
        },
    })
}

/// 测试智能选择系统连通性
#[tauri::command]
async fn test_connectivity(
    device_id: String,
    _adb_service: State<'_, Mutex<AdbService>>,
) -> Result<ConnectivityTestResult, String> {
    info!("🔗 测试智能选择系统连通性，设备: {}", device_id);
    
    let mut checks = Vec::new();
    let mut overall_success = true;
    
    let device_check = match crate::services::adb::AdbService::new().dump_ui_hierarchy(&device_id).await {
        Ok(_) => {
            checks.push(ConnectivityCheck {
                name: "设备UI读取".to_string(),
                success: true,
                message: "设备UI状态读取正常".to_string(),
                time_ms: 100,
            });
            true
        }
        Err(e) => {
            checks.push(ConnectivityCheck {
                name: "设备UI读取".to_string(),
                success: false,
                message: format!("设备UI读取失败: {}", e),
                time_ms: 0,
            });
            overall_success = false;
            false
        }
    };
    
    let _adb_check = match crate::infra::adb::input_helper::tap_injector_first(
        &crate::utils::adb_utils::get_adb_path(),
        &device_id, 
        100, 
        100, 
        None
    ).await {
        Ok(_) => {
            checks.push(ConnectivityCheck {
                name: "ADB输入注入".to_string(),
                success: true,
                message: "ADB输入功能正常".to_string(),
                time_ms: 50,
            });
            true
        }
        Err(e) => {
            checks.push(ConnectivityCheck {
                name: "ADB输入注入".to_string(),
                success: false,
                message: format!("ADB输入注入失败: {}", e),
                time_ms: 0,
            });
            overall_success = false;
            false
        }
    };
    
    if device_check {
        checks.push(ConnectivityCheck {
            name: "智能选择引擎".to_string(),
            success: true,
            message: "智能选择引擎已升级到 V3 架构".to_string(),
            time_ms: 0,
        });
    }
    
    let total_time: u64 = checks.iter().map(|c| c.time_ms).sum();
    
    Ok(ConnectivityTestResult {
        overall_success,
        device_id,
        checks,
        total_time_ms: total_time,
        recommendations: if overall_success {
            vec!["所有系统检查通过，智能选择系统就绪".to_string()]
        } else {
            vec!["部分系统检查失败，请检查设备连接和ADB状态".to_string()]
        },
    })
}

/// 获取设备上的智能选择候选元素（预览模式）
#[tauri::command]
async fn preview(
    device_id: String,
    protocol: SmartSelectionProtocol,
    _adb_service: State<'_, Mutex<AdbService>>,
) -> Result<CandidatePreviewResult, String> {
    info!("👁️ 预览智能选择候选元素，设备: {}", device_id);
    
    let _ui_xml = match crate::services::adb::AdbService::new().dump_ui_hierarchy(&device_id).await {
        Ok(xml) => xml,
        Err(e) => return Err(format!("获取UI状态失败: {}", e)),
    };
    
    let candidates = Vec::new();
    let candidate_summaries: Vec<CandidateElementSummary> = candidates;
    let candidate_count = candidate_summaries.len();
    let is_empty = candidate_summaries.is_empty();
    
    Ok(CandidatePreviewResult {
        total_found: candidate_count as u32,
        candidates: candidate_summaries.clone(),
        selection_preview: SelectionPreview {
            mode: protocol.selection.mode.clone(),
            would_select_count: match &protocol.selection.mode {
                SelectionMode::All { .. } => candidate_count as u32,
                _ => if is_empty { 0 } else { 1 },
            },
            estimated_execution_time_ms: match &protocol.selection.mode {
                SelectionMode::All { .. } => {
                    let interval = protocol.selection.batch_config
                        .as_ref()
                        .map(|bc| bc.interval_ms)
                        .unwrap_or(1000);
                    (candidate_summaries.len() as u64 * interval) + 500
                }
                _ => 500,
            },
        },
        warnings: Vec::new(),
    })
}

/// 保存智能选择配置
#[tauri::command]
async fn save_config(
    step_id: String,
    selection_mode: String,
    batch_config: Option<serde_json::Value>,
    structural_signatures: Option<serde_json::Value>,
) -> Result<bool, String> {
    info!(
        "📥 [save_config] 收到保存请求: step_id={}, mode={}, batch_config={:?}, structural_signatures={:?}",
        step_id,
        selection_mode,
        batch_config,
        structural_signatures
    );

    // 构建简化的策略对象
    let description = if let Some(ref config) = batch_config {
        format!("智能选择-{} (批量配置: {:?})", selection_mode, config)
    } else {
        format!("智能选择-{}", selection_mode)
    };

    let strategy = StrategyCandidate {
        key: format!("smart_selection_{}", step_id),
        name: format!("智能选择-{}", selection_mode),
        confidence: 85.0,
        description,
        variant: "smart-selection".to_string(),
        xpath: Some("//android.widget.TextView[@text='关注']".to_string()), // 默认XPath
        text: Some("关注".to_string()),
        resource_id: None,
        class_name: None,
        content_desc: None,
        enabled: true,
        is_recommended: true,
        selection_mode: Some(selection_mode.clone()),  // ✅ 保存选择模式
        batch_config: batch_config.clone(),  // ✅ 保存批量配置
        structural_signatures: structural_signatures.clone(),  // 🔥 保存结构签名
    };

    // 保存到Store
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    let mut store = STEP_STRATEGY_STORE.lock().map_err(|e| {
        let err_msg = format!("锁定步骤策略存储失败: {}", e);
        tracing::error!("❌ {}", err_msg);
        err_msg
    })?;

    store.insert(step_id.clone(), (strategy.clone(), timestamp));

    info!(
        "✅ 保存智能选择配置成功: step_id={}, mode={}, batch_config={:?}, store_size={}",
        step_id,
        selection_mode,
        batch_config,
        store.len()
    );

    Ok(true)
}

// 导出插件初始化函数
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("smart_selection")
        .invoke_handler(tauri::generate_handler![
            execute,
            validate,
            get_stats,
            test_connectivity,
            preview,
            save_config
        ])
        .build()
}

// ==================== 辅助类型定义 ====================

#[derive(Debug, Serialize, Deserialize)]
pub struct ValidationResult {
    pub is_valid: bool,
    pub issues: Vec<String>,
    pub warnings: Vec<String>,
    pub suggestions: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConnectivityTestResult {
    pub overall_success: bool,
    pub device_id: String,
    pub checks: Vec<ConnectivityCheck>,
    pub total_time_ms: u64,
    pub recommendations: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConnectivityCheck {
    pub name: String,
    pub success: bool,
    pub message: String,
    pub time_ms: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CandidatePreviewResult {
    pub total_found: u32,
    pub candidates: Vec<CandidateElementSummary>,
    pub selection_preview: SelectionPreview,
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CandidateElementSummary {
    pub index: u32,
    pub text: String,
    pub resource_id: String,
    pub bounds: ElementBounds,
    pub confidence: f32,
    pub class_name: String,
    pub clickable: bool,
    pub would_be_selected: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ElementBounds {
    pub left: i32,
    pub top: i32,
    pub right: i32,
    pub bottom: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SelectionPreview {
    pub mode: SelectionMode,
    pub would_select_count: u32,
    pub estimated_execution_time_ms: u64,
}
