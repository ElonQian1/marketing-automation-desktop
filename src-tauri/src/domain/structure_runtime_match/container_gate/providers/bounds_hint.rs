// src-tauri/src/domain/structure_runtime_match/container_gate/providers/bounds_hint.rs
// module: structure_runtime_match | layer: domain | role: 边界弱提示处理器
// summary: bounds 作为弱提示（仅加分,不淘汰）- 兼容滚动/历史快照

use crate::domain::structure_runtime_match::container_gate::types::{UiTree, NodeId, ContainerHints, HeuristicResult};

pub fn propose<T: UiTree>(tree: &T, hints: &ContainerHints, anchor: NodeId) -> Vec<HeuristicResult> {
    let Some(hb) = hints.bounds else { 
        return vec![]; 
    };

    let mut candidates = Vec::new();
    
    // 遍历所有祖先,给IoU>0的都加分（而非只选最高的）
    for n in tree.walk_ancestors(anchor) {
        let nb = tree.bounds(n);
        let iou = nb.iou(&hb);
        
        // IoU > 0.02 才加分（避免噪声）
        if iou > 0.02 {
            // 🎯 关键修改：降低权重上限（0.25 而非 1.2）,避免bounds主导评分
            let score = (iou * 0.5).min(0.25);
            candidates.push(HeuristicResult {
                node: n,
                score,
                tag: "hint_bounds",
                note: format!("IoU={:.3} (弱提示,不主导)", iou),
            });
        }
        
        // 额外：中心距离也给点分（滚动后IoU=0仍有参考价值）
        let (cx, cy) = ((nb.l + nb.r) / 2, (nb.t + nb.b) / 2);
        let (hx, hy) = ((hb.l + hb.r) / 2, (hb.t + hb.b) / 2);
        let dist = (((cx - hx).pow(2) + (cy - hy).pow(2)) as f32).sqrt();
        let (sw, sh) = tree.screen_size();
        let diag = ((sw.pow(2) + sh.pow(2)) as f32).sqrt();
        let center_score = ((1.0 - (dist / diag).min(1.0)) * 0.10).max(0.0);
        
        if center_score > 0.01 {
            candidates.push(HeuristicResult {
                node: n,
                score: center_score,
                tag: "hint_center",
                note: format!("中心距离加分 dist={:.0}px", dist),
            });
        }
    }
    
    candidates
}