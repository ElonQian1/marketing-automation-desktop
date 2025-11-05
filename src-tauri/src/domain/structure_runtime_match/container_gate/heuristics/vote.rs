// src-tauri/src/domain/structure_runtime_match/container_gate/heuristics/vote.rs
// module: structure_runtime_match | layer: domain | role: 候选聚合投票
// summary: 候选聚合与排序，多启发式结果融合

use std::collections::HashMap;
use crate::domain::structure_runtime_match::container_gate::types::{HeuristicResult, UiTree, NodeId, ContainerConfig};
use crate::domain::structure_runtime_match::container_gate::scoring;

pub struct Picked {
    pub ranked: Vec<(NodeId, f32, String)>, // (id, score, merged_note)
}

pub fn aggregate_and_pick<T: UiTree>(
    tree: &T,
    mut all: Vec<HeuristicResult>,
    anchor: NodeId,
    cfg: &ContainerConfig,
) -> Picked {
    // 先做必要调权与"必须包含锚点"的过滤
    scoring::adjust_and_penalize(tree, &mut all, cfg);
    scoring::must_contain_anchor(tree, anchor, &mut all);

    // 聚合：同一 NodeId 的分数相加，note 合并
    let mut acc: HashMap<NodeId, (f32, Vec<String>)> = HashMap::new();
    for h in all {
        let e = acc.entry(h.node).or_insert((0.0, Vec::new()));
        e.0 += h.score;
        e.1.push(format!("[{}] {}", h.tag, h.note));
    }

    let mut ranked: Vec<(NodeId, f32, String)> = acc
        .into_iter()
        .map(|(id, (s, notes))| (id, s, notes.join(" | ")))
        .collect();

    // 排序
    ranked.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());

    Picked { ranked }
}