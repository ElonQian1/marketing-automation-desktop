// src-tauri/src/domain/structure_runtime_match/scoring/combiner.rs
// module: structure_runtime_match | layer: domain | role: 分数合成器
// summary: 按权重合成各维度分数为总分

use super::weights::SmWeights;
use crate::domain::structure_runtime_match::types::SmItemHit;

pub fn combine(items: &mut [SmItemHit], w: &SmWeights) {
    for it in items {
        it.scores.total = w.geom * it.scores.geom
            + w.tpl * it.scores.tpl
            + w.skeleton * it.scores.skeleton
            + w.subtree * it.scores.subtree
            + w.field * it.scores.field;
    }
}
