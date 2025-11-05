// src-tauri/src/domain/structure_runtime_match/container_gate/providers/ancestor_chain.rs
// module: structure_runtime_match | layer: domain | role: 祖先链弱提示处理器
// summary: 祖先签名链（字符串片段，如类名/语义片段）匹配

use crate::domain::structure_runtime_match::container_gate::types::{UiTree, NodeId, ContainerHints, HeuristicResult};

pub fn propose<T: UiTree>(tree: &T, hints: &ContainerHints, anchor: NodeId) -> Vec<HeuristicResult> {
    if hints.ancestor_sign_chain.is_empty() { 
        return vec![]; 
    }
    
    let mut out = Vec::new();
    let chain = tree.walk_ancestors(anchor);
    for (depth, n) in chain.iter().enumerate() {
        let class = tree.class(*n);
        let rid = tree.resource_id(*n).unwrap_or_default();
        let hit = hints.ancestor_sign_chain.iter().any(|sig| {
            class.contains(sig) || rid.contains(sig)
        });
        
        if hit {
            // 越靠上（depth 大）分越轻
            let base = 0.75f32 * (1.0 / (1.0 + depth as f32 * 0.25));
            out.push(HeuristicResult {
                node: *n,
                score: base,
                tag: "hint_ancestor",
                note: format!("hit ancestor sig at depth {} (class='{}')", depth, class),
            });
        }
    }
    out
}