// src-tauri/src/domain/structure_runtime_match/scoring/gates.rs
// module: structure_runtime_match | layer: domain | role: 闸门过滤器
// summary: 根据最小置信度过滤候选/排序

use crate::domain::structure_runtime_match::types::SmItemHit;

pub fn retain_passed(mut items: Vec<SmItemHit>, min_conf: f32) -> Vec<SmItemHit> {
    items.retain(|it| it.scores.total >= min_conf);
    items
}

pub fn sort_desc(items: &mut Vec<SmItemHit>) {
    items.sort_by(|a, b| b.scores.total.partial_cmp(&a.scores.total).unwrap());
}
