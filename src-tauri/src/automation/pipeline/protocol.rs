// src-tauri/src/exec/v3/helpers/protocol_builders.rs
// module: exec/v3 | layer: helpers | role: SmartSelection协议构建器
// summary: 提供评分和执行阶段的SmartSelection协议构建功能，配置元素匹配策略

use crate::types::smart_selection::{
    SmartSelectionProtocol, ElementFingerprint, AnchorInfo, SelectionConfig, SelectionMode,
};
use crate::types::{FilterConfig, SortOrder, ExecutionLimits};

/// 创建用于评分阶段的SmartSelection协议
/// 
/// 评分阶段特点：
/// - 使用传入的min_confidence阈值(默认0.8,而非固定0.3)
/// - 只检查第一个匹配（SelectionMode::First）
/// - 较短的时间预算（3000ms）
/// - 同时匹配text_content和content_desc
/// 
/// 参数：
/// - target_text: 目标文本
/// - min_confidence: 最小置信度阈值(None时使用默认0.8)
pub fn create_smart_selection_protocol_for_scoring(
    target_text: &str,
    min_confidence: Option<f64>,
) -> Result<SmartSelectionProtocol, String> {
    // ✅ 使用传入的min_confidence,默认0.8而非0.3
    let min_conf = min_confidence.unwrap_or(0.8) as f32;
    
    // 🔧 修复：同时使用text_content和content_desc进行匹配，提高匹配成功率
    let fingerprint = ElementFingerprint {
        text_content: Some(target_text.to_string()),
        text_hash: None,
        class_chain: None,
        resource_id: None,
        resource_id_suffix: None,
        bounds_signature: None,
        parent_class: None,
        sibling_count: None,
        child_count: None,
        depth_level: None,
        relative_index: None,
        clickable: Some(true), // 🎯 评分时也优先考虑可点击元素
        enabled: None,         // 评分时不强制enabled，避免过于严格
        selected: None,
        content_desc: Some(target_text.to_string()), // 同时设置content_desc
        package_name: None,
    };
    
    // 🎯 评分阶段使用传入的置信度阈值
    let filters = Some(FilterConfig {
        exclude_states: Some(vec!["invisible".to_string()]),
        min_confidence: Some(min_conf), // ✅ 使用传入的阈值
        position_tolerance: Some(20),
    });
    
    let protocol = SmartSelectionProtocol {
        anchor: AnchorInfo {
            container_xpath: None,
            clickable_parent_xpath: None,
            fingerprint,
        },
        selection: SelectionConfig {
            mode: SelectionMode::First, // 评分时只需要检查第一个匹配
            order: Some(SortOrder::VisualYx), // 保持与执行阶段一致的排序
            random_seed: None,
            batch_config: None,
            filters,
        },
        matching_context: None,
        strategy_plan: None,
        limits: Some(ExecutionLimits {
            allow_backend_fallback: true,
            time_budget_ms: 3000,     // 评分时间预算更短
            per_candidate_budget_ms: 500,
            strict_mode: false,
            max_retry_count: 1,
        }),
        fallback: None,
    };
    
    tracing::info!("📊 [评分协议] 目标文本: '{}', clickable=true, min_confidence={:.2}", target_text, min_conf);
    Ok(protocol)
}

/// 创建用于实际执行的SmartSelection协议
/// 
/// 执行阶段特点：
/// - 更严格的过滤条件（min_confidence=0.7）
/// - 支持多种选择模式（first/last/random/all/auto等）
/// - 较长的时间预算（5000ms）
/// - 优先选择clickable=true和enabled=true的元素
/// 
/// 🎯 关键修复：优先选择可点击的、位置合理的目标元素
pub fn create_smart_selection_protocol_for_execution(target_text: &str, mode: &str) -> Result<SmartSelectionProtocol, String> {
    let selection_mode = match mode {
        "first" => SelectionMode::First,
        "last" => SelectionMode::Last,
        "random" => SelectionMode::Random { seed: 12345, ensure_stable_sort: true },
        "all" => SelectionMode::All { 
            batch_config: Some(crate::types::smart_selection::BatchConfigV2 {
                interval_ms: 1000,
                jitter_ms: 200,
                max_per_session: 50,
                cooldown_ms: 5000,
                continue_on_error: true,
                show_progress: true,
                refresh_policy: crate::types::smart_selection::RefreshPolicy::OnMutation,
                requery_by_fingerprint: true,
                force_light_validation: true,
            })
        },
        "match-original" => SelectionMode::MatchOriginal {
            min_confidence: 0.8,
            fallback_to_first: true,
        },
        "auto" => SelectionMode::Auto {
            single_min_confidence: Some(0.8),
            batch_config: None, // 🔧 修复：auto模式默认不使用批量配置，避免单个执行变成批量
            fallback_to_first: Some(true),
        },
        _ => {
            tracing::warn!("⚠️ 未知的选择模式: {}, 默认使用 First", mode);
            SelectionMode::First
        },
    };
    
    // 🔧 修复：设置更严格的元素筛选条件，优先选择可点击的按钮
    let fingerprint = ElementFingerprint {
        text_content: Some(target_text.to_string()),
        text_hash: None,
        class_chain: None,
        resource_id: None,
        resource_id_suffix: None,
        bounds_signature: None,
        parent_class: None,
        sibling_count: None,
        child_count: None,
        depth_level: None,
        relative_index: None,
        clickable: Some(true), // 🎯 关键修复：优先选择可点击的元素
        enabled: Some(true),   // 🎯 关键修复：优先选择可用的元素
        selected: None,
        content_desc: Some(target_text.to_string()), // 🎯 修复：同时匹配content-desc，提高匹配成功率
        package_name: None,
    };
    
    // 🎯 修复：添加基础过滤器，提高匹配质量
    let filters = Some(FilterConfig {
        exclude_states: Some(vec![
            "disabled".to_string(),
            "invisible".to_string(),
        ]),
        min_confidence: Some(0.7), // 提高最小置信度要求
        position_tolerance: Some(10), // 位置容差
    });
    
    let protocol = SmartSelectionProtocol {
        anchor: AnchorInfo {
            container_xpath: None,
            clickable_parent_xpath: None,
            fingerprint,
        },
        selection: SelectionConfig {
            mode: selection_mode,
            order: Some(SortOrder::VisualYx), // 🎯 修复：按视觉位置排序，优先选择上方的元素
            random_seed: None,
            batch_config: None,
            filters,
        },
        matching_context: None,
        strategy_plan: None,
        limits: Some(ExecutionLimits {
            allow_backend_fallback: true,
            time_budget_ms: 5000,
            per_candidate_budget_ms: 1000,
            strict_mode: false,
            max_retry_count: 2,
        }),
        fallback: None,
    };
    
    tracing::info!("🎯 [执行协议] 目标文本: '{}', 模式: {}, clickable=true, enabled=true, min_confidence=0.7", target_text, mode);
    Ok(protocol)
}
