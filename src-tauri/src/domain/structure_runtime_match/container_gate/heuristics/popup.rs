// src-tauri/src/domain/structure_runtime_match/container_gate/heuristics/popup.rs
// module: structure_runtime_match | layer: domain | role: 弹层优先启发式
// summary: Dialog/BottomSheet 命中时优先提名

use crate::domain::structure_runtime_match::container_gate::types::{UiTree, NodeId, HeuristicResult};

pub fn propose<T: UiTree>(tree: &T, anchor: NodeId) -> Vec<HeuristicResult> {
    for n in tree.walk_ancestors(anchor) {
        if tree.is_dialog_like(n) {
            return vec![HeuristicResult {
                node: n,
                score: 1.00,
                tag: "popup",
                note: format!("dialog-like container: {}", tree.class(n)),
            }];
        }
    }
    vec![]
}