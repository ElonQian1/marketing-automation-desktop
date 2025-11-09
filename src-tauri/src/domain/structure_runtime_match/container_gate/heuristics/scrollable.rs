// src-tauri/src/domain/structure_runtime_match/container_gate/heuristics/scrollable.rs
// module: structure_runtime_match | layer: domain | role: 可滚容器启发式
// summary: 沿祖先寻找 Scroll 容器（按深度递减权重）

use crate::domain::structure_runtime_match::container_gate::types::{UiTree, NodeId, HeuristicResult};

const SCROLL_CLASSES: &[&str] = &[
    "RecyclerView", "ListView", "ScrollView", "NestedScrollView", "ViewPager", "ViewPager2",
    "LazyColumn", "LazyRow", // Compose 容器
];

pub fn propose<T: UiTree>(tree: &T, anchor: NodeId) -> Vec<HeuristicResult> {
    let mut out = Vec::new();
    let ancestors = tree.walk_ancestors(anchor);
    
    for (depth_from_anchor, n) in ancestors.iter().enumerate() {
        let class = tree.class(*n);
        let is_scroll = tree.is_scrollable(*n) || SCROLL_CLASSES.iter().any(|k| class.contains(k));
        
        if is_scroll {
            // 🎯 关键修改：越近的容器得分越高（距离衰减）
            let base = 0.50;
            let decay = (0.10 / (1.0 + depth_from_anchor as f32)).min(0.10);
            let score = base + decay;
            
            out.push(HeuristicResult {
                node: *n,
                score,
                tag: "scrollable",
                note: format!("scrollable depth={} class={}", depth_from_anchor, class),
            });
            
            // 继续查找更外层的,但优先级降低
            if depth_from_anchor >= 3 { break; } // 最多找3层
        }
    }
    out
}