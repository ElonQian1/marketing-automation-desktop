// src-tauri/src/domain/structure_runtime_match/container_gate/providers/element_id_hint.rs
// module: structure_runtime_match | layer: domain | role: 元素ID强提示处理器
// summary: 使用selected_element_id进行精确定位（最高优先级）

use crate::domain::structure_runtime_match::container_gate::types::{UiTree, NodeId, ContainerHints, HeuristicResult};

/// 🎯 最高优先级：如果hints中有selected_element_id，直接定位到该元素
/// 
/// 工作原理:
/// 1. 从hints中提取selected_element_id (如"element_32")
/// 2. 在XML树中查找id属性匹配的节点
/// 3. 如果找到,给予极高分数(0.95)确保优先选中
/// 4. 如果没找到,返回空列表让其他启发式接管
pub fn propose<T: UiTree>(tree: &T, hints: &ContainerHints, _anchor: NodeId) -> Vec<HeuristicResult> {
    let Some(element_id) = &hints.selected_element_id else {
        return vec![];
    };

    tracing::debug!("🔍 [element_id_hint] 尝试定位元素: {}", element_id);

    // 🎯 核心：通过索引号匹配，兼容前后端ID格式差异
    // 前端: "element_32" → 提取数字 32
    // 后端: "node_32"    → 提取数字 32
    // 只要数字相同，就是同一个节点
    let mut candidates = Vec::new();
    
    // 从前端传来的 element_id 提取索引号
    // "element_32" → 32
    let target_index = if let Some(stripped) = element_id.strip_prefix("element_") {
        stripped.parse::<u32>().ok()
    } else {
        // 也兼容后端格式 "node_32"
        element_id.strip_prefix("node_")
            .and_then(|s| s.parse::<u32>().ok())
    };
    
    let Some(target_idx) = target_index else {
        tracing::warn!(
            "⚠️ [element_id_hint] 无法解析element_id: {}",
            element_id
        );
        return vec![];
    };
    
    // 直接通过索引号定位节点
    if target_idx < tree.node_count() as u32 {
        tracing::info!(
            "✅ [element_id_hint] 通过索引匹配元素: {} → node_id={}",
            element_id,
            target_idx
        );
        
        candidates.push(HeuristicResult {
            node: target_idx,
            score: 0.95,  // 极高分数,确保优先选中
            tag: "hint_element_id",
            note: format!("索引匹配: {} → node[{}]", element_id, target_idx),
        });
    } else {
        tracing::warn!(
            "⚠️ [element_id_hint] 索引超出范围: {} (节点总数: {})",
            target_idx,
            tree.node_count()
        );
    }

    if candidates.is_empty() {
        tracing::warn!(
            "⚠️ [element_id_hint] 未找到匹配的元素ID: {}",
            element_id
        );
    }

    candidates
}
