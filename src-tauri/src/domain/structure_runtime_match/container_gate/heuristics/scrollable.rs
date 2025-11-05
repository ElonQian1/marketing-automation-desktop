// src-tauri/src/domain/structure_runtime_match/container_gate/heuristics/scrollable.rs
// module: structure_runtime_match | layer: domain | role: 可滚容器启发式
// summary: 沿祖先寻找最近的 Scroll 容器

use crate::domain::structure_runtime_match::container_gate::types::{UiTree, NodeId, HeuristicResult};

const SCROLL_CLASSES: &[&str] = &[
    "RecyclerView", "ListView", "ScrollView", "NestedScrollView", "ViewPager", "ViewPager2"
];

pub fn propose<T: UiTree>(tree: &T, anchor: NodeId) -> Vec<HeuristicResult> {
    let mut out = Vec::new();
    for n in tree.walk_ancestors(anchor) {
        let class = tree.class(n);
        let is_scroll = tree.is_scrollable(n) || SCROLL_CLASSES.iter().any(|k| class.contains(k));
        if is_scroll {
            out.push(HeuristicResult {
                node: n,
                score: 0.90,
                tag: "scrollable",
                note: format!("scrollable ancestor: {}", class),
            });
            break; // 最近的即可
        }
    }
    out
}