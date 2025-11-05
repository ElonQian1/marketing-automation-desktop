// src-tauri/src/domain/structure_runtime_match/container_gate/providers/bounds_hint.rs
// module: structure_runtime_match | layer: domain | role: 边界强提示处理器
// summary: bounds 限定区域（优先在祖先中找与 bounds 高 IoU 的节点）

use crate::domain::structure_runtime_match::container_gate::types::{UiTree, NodeId, ContainerHints, HeuristicResult};

pub fn propose<T: UiTree>(tree: &T, hints: &ContainerHints, anchor: NodeId) -> Vec<HeuristicResult> {
    let Some(hb) = hints.bounds else { 
        return vec![]; 
    };

    let mut best: Option<(NodeId, f32)> = None;
    for n in tree.walk_ancestors(anchor) {
        let iou = tree.bounds(n).iou(&hb);
        let score = (iou * 1.5).min(1.2); // IoU 越高越好
        if best.map(|(_, s)| score > s).unwrap_or(true) {
            best = Some((n, score));
        }
    }
    
    if let Some((node, score)) = best {
        return vec![HeuristicResult {
            node,
            score,
            tag: "hint_bounds",
            note: format!("best IoU with hinted bounds: {:.2}", score),
        }];
    }
    vec![]
}