// src-tauri/src/commands/structure_recommend.rs
// module: commands | layer: commands | role: 结构匹配智能推荐命令
// summary: 暴露三路评分器自动选型功能给前端，提供UI友好的推荐结果和StepCard建议

use serde::{Serialize, Deserialize};
use anyhow::Result;
use tauri::Manager;
use crate::domain::structure_runtime_match::{
    AutoRecommendationService, 
    AutoRecommendationConfig,
    MatchMode,
    ScoreOutcome,
};
use crate::engine::xml_indexer::XmlIndexer;
use tracing::{info, debug, error};

#[derive(Debug, Serialize)]
pub struct UiOutcome {
    /// 模式名称：CardSubtree | LeafContext | TextExact
    pub mode: String,
    /// 置信度 (0..1)，已保留2位小数
    pub conf: f32,
    /// 评分解释，UI显示于高级折叠
    pub explain: String,
    /// 是否通过统一闸门
    pub passed_gate: bool,
}

#[derive(Debug, Serialize)]
pub struct UiRecommendation {
    /// 系统推荐模式
    pub recommended: String,
    /// 三路评分详情
    pub outcomes: Vec<UiOutcome>,
    /// 建议写入StepCard的字段
    pub step_plan_mode: String,
    pub plan_suggest: serde_json::Value,
    pub config_suggest: serde_json::Value,
    pub intent_suggest: serde_json::Value,
    /// 预览目标节点ID列表（用于试算高亮）
    pub preview_target_node_ids: Vec<usize>,
    /// 推荐置信度级别
    pub confidence_level: String,
    /// 推荐解释
    pub recommendation_reason: String,
}

#[derive(Debug, Deserialize)]
pub struct RecommendInput {
    pub clicked_node: usize,
    pub container_node: usize,
    pub card_root_node: usize,
    pub clickable_parent_node: usize,
}

#[tauri::command]
pub async fn recommend_structure_mode(
    app: tauri::AppHandle, 
    input: RecommendInput
) -> Result<UiRecommendation, String> {
    info!("🎯 [推荐命令] 开始智能推荐，节点: {} → {} → {} → {}", 
        input.clicked_node, input.container_node, input.card_root_node, input.clickable_parent_node);

    // 1. 获取XML索引器
    let xml_indexer = match app.try_state::<XmlIndexer>() {
        Some(indexer) => indexer.inner().clone(),
        None => {
            error!("❌ [推荐命令] XML索引器未初始化");
            return Err("XML索引器未初始化".to_string());
        }
    };

    // 2. 创建自动推荐服务
    let service = AutoRecommendationService::with_default_config(&xml_indexer);

    // 3. 生成完整推荐结果
    let auto_result = service.generate_auto_recommendation(
        input.clicked_node,
        input.card_root_node,
        input.clickable_parent_node,
    ).map_err(|e| {
        error!("❌ [推荐命令] 生成推荐失败: {}", e);
        format!("生成推荐失败: {}", e)
    })?;

    // 4. 转换为UI友好格式
    let recommended_str = match auto_result.auto_pick_result.recommended {
        MatchMode::CardSubtree => "CardSubtree",
        MatchMode::LeafContext => "LeafContext", 
        MatchMode::TextExact => "TextExact",
    }.to_string();

    let ui_outcomes: Vec<UiOutcome> = auto_result.auto_pick_result.outcomes
        .into_iter()
        .map(|o| UiOutcome {
            mode: match o.mode {
                MatchMode::CardSubtree => "CardSubtree".to_string(),
                MatchMode::LeafContext => "LeafContext".to_string(),
                MatchMode::TextExact => "TextExact".to_string(),
            },
            conf: (o.conf * 100.0).round() / 100.0, // 保留2位小数
            explain: o.explain,
            passed_gate: o.passed_gate,
        })
        .collect();

    // 5. 生成StepCard建议
    let (plan_suggest, config_suggest, intent_suggest) = generate_step_suggestions(&recommended_str);

    // 6. 生成预览目标（用于试算高亮）
    let preview_target_node_ids = vec![input.clickable_parent_node]; // 简化实现，后续可扩展

    let confidence_level = if auto_result.mapping_summary.confidence_score >= 0.8 {
        "高"
    } else if auto_result.mapping_summary.confidence_score >= 0.6 {
        "中等"
    } else {
        "偏低"
    }.to_string();

    info!("✅ [推荐命令] 推荐完成: {} (置信度: {:.3})", 
        recommended_str, auto_result.mapping_summary.confidence_score);

    Ok(UiRecommendation {
        recommended: recommended_str,
        outcomes: ui_outcomes,
        step_plan_mode: "structure_match".to_string(),
        plan_suggest,
        config_suggest,
        intent_suggest,
        preview_target_node_ids,
        confidence_level,
        recommendation_reason: auto_result.auto_pick_result.recommendation_reason,
    })
}

#[tauri::command]
pub async fn dry_run_structure_match(
    app: tauri::AppHandle,
    input: RecommendInput,
    mode: String, // "CardSubtree" | "LeafContext" | "TextExact"
) -> Result<Vec<usize>, String> {
    info!("🧪 [试算命令] 开始试算高亮，模式: {}", mode);

    let xml_indexer = match app.try_state::<XmlIndexer>() {
        Some(indexer) => indexer.inner().clone(),
        None => return Err("XML索引器未初始化".to_string()),
    };

    // 简化实现：返回预计的目标节点列表
    let target_nodes = match mode.as_str() {
        "CardSubtree" => vec![input.card_root_node],
        "LeafContext" => vec![input.clickable_parent_node, input.clicked_node],
        "TextExact" => vec![input.clicked_node],
        _ => vec![input.clicked_node],
    };

    info!("✅ [试算命令] 试算完成，预计目标节点: {:?}", target_nodes);
    Ok(target_nodes)
}

/// 根据推荐模式生成StepCard建议配置
fn generate_step_suggestions(mode: &str) -> (serde_json::Value, serde_json::Value, serde_json::Value) {
    match mode {
        "LeafContext" => (
            serde_json::json!({
                "mode": "LeafContext",
                "slot": {
                    "slot_id": "Like.Control",
                    "fallback": ["LikeCountText", "BottomBarContainer", "CardOpenDetail"]
                },
                "card_signature": {
                    "shape": "masonry-card",
                    "flags": ["hasBottomBar", "hasImageArea"]
                },
                "text": { "eq": "NonEmpty" }
            }),
            serde_json::json!({
                "prefer_context_for_leaf": true,
                "card_use_subtree_shape": true,
                "enable_smart_fallback": true
            }),
            serde_json::json!({
                "action": "like",
                "scope": "all",
                "click_interval_ms": 160
            })
        ),
        "TextExact" => (
            serde_json::json!({
                "mode": "TextExact", 
                "text": { "eq": "Exact" },
                "text_stability_check": true
            }),
            serde_json::json!({
                "prefer_context_for_leaf": false,
                "card_use_subtree_shape": false,
                "text_match_timeout_ms": 3000
            }),
            serde_json::json!({
                "action": "follow_user",
                "scope": "match-original", 
                "click_interval_ms": 120
            })
        ),
        _ => ( // CardSubtree
            serde_json::json!({
                "mode": "CardSubtree",
                "card_signature": {
                    "shape": "masonry-card",
                    "flags": ["hasBottomBar", "hasImageArea"]
                },
                "hierarchy_matching": true
            }),
            serde_json::json!({
                "prefer_context_for_leaf": true,
                "card_use_subtree_shape": true,
                "structural_tolerance": 0.8
            }),
            serde_json::json!({
                "action": "open_detail",
                "scope": "first",
                "click_interval_ms": 120
            })
        ),
    }
}