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
    ClickNormalizer,
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

/// 从StepCard快照解析四节点上下文的输入
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResolveFromSnapshotInput {
    /// 🎯 优先: 目标元素的绝对下标链 (从StepCard.staticLocator.indexPath获取)
    pub index_path: Option<Vec<usize>>,
    /// 🔄 回退: 目标元素的绝对xpath (从StepCard.elementContext.xpath获取)
    pub absolute_xpath: String,
    /// StepCard中的完整XML快照 (从StepCard.xmlSnapshot.xmlContent获取)
    pub xml_snapshot: String,
    /// 可选:容器xpath (从StepCard.containerXpath获取)
    pub container_xpath: Option<String>,
}

/// 解析后的四节点ID
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResolvedFourNodes {
    pub clicked_node: usize,
    pub container_node: usize,
    pub card_root_node: usize,
    pub clickable_parent_node: usize,
}

/// 推荐输入：支持双模式 (传统四节点ID 或 StepCard快照)
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FlexibleRecommendInput {
    // 方式1: 传统四节点ID (兼容现有代码)
    pub clicked_node: Option<usize>,
    pub container_node: Option<usize>,
    pub card_root_node: Option<usize>,
    pub clickable_parent_node: Option<usize>,
    
    // 方式2: StepCard快照模式
    /// 🎯 优先: 目标元素的绝对下标链 (性能优化: 直接定位，避免全树遍历)
    pub index_path: Option<Vec<usize>>,
    pub absolute_xpath: Option<String>,
    pub xml_snapshot: Option<String>,
    pub container_xpath: Option<String>,
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

/// Phase 1: 从StepCard快照解析四节点上下文
/// 
/// 解决问题: 前端使用 buildNodeId() 生成的临时哈希ID 与后端 XmlIndexer 的 usize 索引不兼容
/// 
/// # Arguments
/// * `input` - 包含 xpath + xml_snapshot 的快照输入
/// 
/// # Returns
/// * `ResolvedFourNodes` - 解析后的四个节点ID
#[tauri::command]
pub async fn resolve_from_stepcard_snapshot(
    input: ResolveFromSnapshotInput,
) -> Result<ResolvedFourNodes, String> {
    info!("🔍 [快照解析] 开始从StepCard快照解析四节点, xpath: {}", input.absolute_xpath);

    // 1. 从XML构建临时索引器
    let xml_indexer = XmlIndexer::build_from_xml(&input.xml_snapshot)
        .map_err(|e| {
            error!("❌ [快照解析] 构建XML索引失败: {}", e);
            format!("构建XML索引失败: {}", e)
        })?;
    
    debug!("✅ [快照解析] XML索引构建成功, 共 {} 个节点", xml_indexer.all_nodes.len());

    // 2. 🎯 优先使用 index_path 查找目标节点（更可靠）
    let clicked_node_idx = if let Some(ref index_path) = input.index_path {
        debug!("🎯 [快照解析] 使用 index_path 定位: {:?}", index_path);
        xml_indexer.find_node_by_index_path(index_path)
            .ok_or_else(|| {
                error!("❌ [快照解析] 通过 index_path 未找到目标元素: {:?}", index_path);
                // 🔄 如果 index_path 失败，尝试回退到 xpath
                debug!("🔄 [快照解析] index_path 失败，尝试回退到 xpath: {}", input.absolute_xpath);
                format!("通过 index_path 未找到目标元素: {:?}", index_path)
            })?
    } else {
        // 🔄 回退使用 xpath（兼容旧数据）
        debug!("🔄 [快照解析] 使用 xpath 定位（兼容模式）: {}", input.absolute_xpath);
        xml_indexer.find_node_by_xpath(&input.absolute_xpath)
            .ok_or_else(|| {
                error!("❌ [快照解析] 未找到目标元素, xpath: {}", input.absolute_xpath);
                format!("未找到目标元素, xpath: {}", input.absolute_xpath)
            })?
    };
    
    info!("✅ [快照解析] 找到目标节点, 索引: {}", clicked_node_idx);

    // 3. 使用ClickNormalizer推导四节点
    info!("🔧 [DEBUG] 创建ClickNormalizer...");
    let normalizer = ClickNormalizer::new(&xml_indexer);
    info!("🔧 [DEBUG] 获取点击节点: clicked_node_idx={}", clicked_node_idx);
    let clicked_node = &xml_indexer.all_nodes[clicked_node_idx];
    info!("🔧 [DEBUG] 开始normalize_click, bounds={:?}", clicked_node.bounds);
    let normalized = normalizer.normalize_click(clicked_node.bounds)
        .map_err(|e| {
            error!("❌ [快照解析] 四节点推导失败: {}", e);
            format!("四节点推导失败: {}", e)
        })?;
    info!("🔧 [DEBUG] normalize_click完成");
    
    // 4. 提取四节点索引
    info!("🔧 [DEBUG] 开始提取四节点索引...");
    info!("🔧 [DEBUG] normalized.original_clicked.node_index = {}", normalized.original_clicked.node_index);
    info!("🔧 [DEBUG] normalized.container.node_index = {}", normalized.container.node_index);
    info!("🔧 [DEBUG] normalized.card_root.node_index = {}", normalized.card_root.node_index);
    info!("🔧 [DEBUG] normalized.clickable_parent.node_index = {}", normalized.clickable_parent.node_index);
    
    let result = ResolvedFourNodes {
        clicked_node: normalized.original_clicked.node_index,
        container_node: normalized.container.node_index,
        card_root_node: normalized.card_root.node_index,
        clickable_parent_node: normalized.clickable_parent.node_index,
    };
    info!("🔧 [DEBUG] 四节点索引提取完成");
    
    info!("✅ [快照解析] 四节点推导完成: clicked={}, container={}, card_root={}, clickable_parent={}", 
        result.clicked_node, result.container_node, 
        result.card_root_node, result.clickable_parent_node);

    Ok(result)
}

/// Phase 2: 支持双输入模式的结构匹配推荐
/// 
/// 支持两种调用方式:
/// 1. 传统模式: 传入四节点ID (兼容现有代码)
/// 2. 快照模式: 传入 xpath + xml_snapshot
/// 
/// # Arguments
/// * `app` - Tauri应用句柄
/// * `input` - 双模式输入
/// 
/// # Returns
/// * `UiRecommendation` - 三路评分结果和推荐建议
#[tauri::command]
pub async fn recommend_structure_mode_v2(
    app: tauri::AppHandle,
    input: FlexibleRecommendInput,
) -> Result<UiRecommendation, String> {
    info!("🎯 [推荐] 开始智能推荐 (支持双输入模式)");

    // 检查输入模式并提取xml_snapshot(如果有)
    let xml_snapshot_opt = input.xml_snapshot.clone();
    
    // 根据输入模式选择处理流程
    let (clicked_node, container_node, card_root_node, clickable_parent_node) = 
        if let (Some(cn), Some(contn), Some(crn), Some(cpn)) = 
            (input.clicked_node, input.container_node, input.card_root_node, input.clickable_parent_node) {
            // 传统模式:直接使用传入的四节点ID
            info!("📌 [推荐] 使用传统模式 (四节点ID)");
            (cn, contn, crn, cpn)
        } else if let (Some(xpath), Some(xml)) = (&input.absolute_xpath, &xml_snapshot_opt) {
            // 快照模式:先解析四节点
            info!("📸 [推荐] 使用快照模式 (xpath + xml_snapshot)");
            info!("🔧 [DEBUG] 准备调用 resolve_from_stepcard_snapshot...");
            let resolved = resolve_from_stepcard_snapshot(ResolveFromSnapshotInput {
                index_path: input.index_path.clone(),  // ✅ 使用前端传来的 index_path（性能优化）
                absolute_xpath: xpath.clone(),
                xml_snapshot: xml.clone(),
                container_xpath: input.container_xpath.clone(),
            }).await?;
            info!("🔧 [DEBUG] resolve_from_stepcard_snapshot 返回成功");
            info!("🔧 [DEBUG] 准备解构四节点: clicked={}, container={}, card_root={}, clickable_parent={}", 
                resolved.clicked_node, resolved.container_node, 
                resolved.card_root_node, resolved.clickable_parent_node);
            let result = (resolved.clicked_node, resolved.container_node,
                         resolved.card_root_node, resolved.clickable_parent_node);
            info!("🔧 [DEBUG] 四节点解构完成");
            result
        } else {
            error!("❌ [推荐] 输入参数不完整");
            return Err("必须提供四节点ID 或 xpath+xml_snapshot".to_string());
        };
    
    info!("🎯 [推荐] 四节点确定: {} → {} → {} → {}", 
        clicked_node, container_node, card_root_node, clickable_parent_node);

    // 1. 获取XML索引器 (快照模式时需要重新构建)
    info!("🔧 [推荐] 准备获取XML索引器...");
    let xml_indexer_owned;
    let xml_indexer = if let Some(xml_content) = xml_snapshot_opt {
        // 快照模式: 使用快照中的XML重建索引
        info!("📸 [推荐] 快照模式:重建XML索引 (节点数: ~{})", xml_content.len() / 300);
        xml_indexer_owned = XmlIndexer::build_from_xml(&xml_content)
            .map_err(|e| format!("构建XML索引失败: {}", e))?;
        info!("✅ [推荐] XML索引重建完成: {} 个节点", xml_indexer_owned.all_nodes.len());
        &xml_indexer_owned
    } else {
        // 传统模式: 使用全局索引器
        info!("📌 [推荐] 传统模式:使用全局索引器");
        match app.try_state::<XmlIndexer>() {
            Some(indexer) => indexer.inner(),
            None => {
                error!("❌ [推荐] XML索引器未初始化");
                return Err("XML索引器未初始化 (请先执行页面分析)".to_string());
            }
        }
    };

    // 2. 创建自动推荐服务
    info!("🔧 [推荐] 创建自动推荐服务...");
    let service = AutoRecommendationService::with_default_config(xml_indexer);
    info!("✅ [推荐] 自动推荐服务创建完成");

    // 3. 生成推荐结果
    info!("🚀 [推荐] 开始生成推荐结果...");
    let auto_result = service.generate_auto_recommendation(
        clicked_node,
        card_root_node,
        clickable_parent_node,
    ).map_err(|e| {
        error!("❌ [推荐] 生成推荐失败: {}", e);
        format!("生成推荐失败: {}", e)
    })?;
    info!("✅ [推荐] 推荐结果生成完成");

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
            conf: (o.conf * 100.0).round() / 100.0,
            explain: o.explain,
            passed_gate: o.passed_gate,
        })
        .collect();

    let (plan_suggest, config_suggest, intent_suggest) = generate_step_suggestions(&recommended_str);
    let preview_target_node_ids = vec![clickable_parent_node];

    let confidence_level = if auto_result.mapping_summary.confidence_score >= 0.8 {
        "高"
    } else if auto_result.mapping_summary.confidence_score >= 0.6 {
        "中等"
    } else {
        "偏低"
    }.to_string();

    info!("✅ [推荐] 推荐完成: {} (置信度: {:.3})", 
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
