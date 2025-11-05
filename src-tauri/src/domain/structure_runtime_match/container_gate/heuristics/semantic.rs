// src-tauri/src/domain/structure_runtime_match/container_gate/heuristics/semantic.rs
// module: structure_runtime_match | layer: domain | role: 语义面板启发式
// summary: *_container/*_panel/*_content/*_root 等语义识别

use crate::domain::structure_runtime_match::container_gate::types::{UiTree, NodeId, HeuristicResult};

const SEM_KEYS: &[&str] = &["container", "panel", "content", "root", "sheet", "dialog"];

pub fn propose<T: UiTree>(tree: &T, anchor: NodeId) -> Vec<HeuristicResult> {
    let mut out = Vec::new();
    for n in tree.walk_ancestors(anchor) {
        let rid = tree.resource_id(n).unwrap_or_default();
        let desc = tree.content_desc(n).unwrap_or_default();
        let class = tree.class(n);
        let hit = SEM_KEYS.iter().any(|k| rid.contains(k) || desc.contains(k));
        if hit {
            out.push(HeuristicResult {
                node: n,
                score: 0.80,
                tag: "semantic",
                note: format!("semantic container: rid='{}' class='{}'", rid, class),
            });
            // 不 break：可能更近处还有更合适的
        }
    }
    out
}