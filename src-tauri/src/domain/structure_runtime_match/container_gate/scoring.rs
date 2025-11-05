// src-tauri/src/domain/structure_runtime_match/container_gate/scoring.rs
// module: structure_runtime_match | layer: domain | role: 容器评分调权
// summary: 最终打分调权与过滤

use super::types::{UiTree, NodeId, HeuristicResult, ContainerConfig};

pub fn adjust_and_penalize<T: UiTree>(
    tree: &T,
    cand: &mut Vec<HeuristicResult>,
    cfg: &ContainerConfig,
) {
    // 偏好：滚动容器加权
    if cfg.prefer_scrollable {
        for c in cand.iter_mut() {
            if tree.is_scrollable(c.node) { 
                c.score += 0.20; 
            }
        }
    }

    // 类似 Dialog/Sheet 给点加权（更可能是"当前业务面板"）
    for c in cand.iter_mut() {
        if tree.is_dialog_like(c.node) { 
            c.score += 0.15; 
        }
    }

    // 面积极端的惩罚（整屏 or 过薄/过小）
    for c in cand.iter_mut() {
        let ar = tree.area_ratio(c.node);
        if ar > cfg.max_fullscreen_ratio { 
            c.score -= 0.50; // 尽量避免整屏
        }
        if ar < cfg.min_area_ratio { 
            c.score -= 0.30; // 排除薄壳
        }
    }
}

/// 决定性过滤：容器必须包含锚点（结构意义上的祖先关系）
pub fn must_contain_anchor<T: UiTree>(tree: &T, anchor: NodeId, cand: &mut Vec<HeuristicResult>) {
    cand.retain(|c| tree.is_ancestor_of(c.node, anchor));
}