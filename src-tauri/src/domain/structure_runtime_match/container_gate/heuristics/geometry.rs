// src-tauri/src/domain/structure_runtime_match/container_gate/heuristics/geometry.rs
// module: structure_runtime_match | layer: domain | role: 几何启发式
// summary: 面积/包含关系/孩子数等几何特征分析

use crate::domain::structure_runtime_match::container_gate::types::{UiTree, NodeId, HeuristicResult};

pub fn propose<T: UiTree>(tree: &T, anchor: NodeId) -> Vec<HeuristicResult> {
    let mut out = Vec::new();
    let a_bounds = tree.bounds(anchor);
    for n in tree.walk_ancestors(anchor) {
        let b = tree.bounds(n);
        if !b.contains(&a_bounds) { 
            continue; 
        }
        let ar = tree.area_ratio(n);
        // 经验：容器面积在 [5%, 95%] 区间更合理
        if ar >= 0.05 && ar <= 0.95 {
            let children = tree.children(n).len();
            if children >= 2 {
                out.push(HeuristicResult {
                    node: n,
                    score: 0.60,
                    tag: "geometry",
                    note: format!("geom ok (area={:.2}%, children={})", ar * 100.0, children),
                });
            }
        }
    }
    out
}