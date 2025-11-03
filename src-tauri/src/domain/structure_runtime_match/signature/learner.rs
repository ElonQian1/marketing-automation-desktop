// src-tauri/src/domain/structure_runtime_match/signature/learner.rs
// module: structure_runtime_match | layer: domain | role: 模板学习器
// summary: 从容器子节点中学习重复性模板

use super::features::{extract, SmFeat};
use crate::domain::structure_runtime_match::ports::xml_view::SmXmlView;
use crate::domain::structure_runtime_match::types::{SmLayoutType, SmNodeId};
use std::collections::HashMap;

#[derive(Clone, Debug)]
pub struct SmTemplate {
    pub width_bucket: u8,
    pub image_flag: bool,
    pub text_flag: bool,
    pub support: usize,
}

pub fn learn_or_load<V: SmXmlView>(
    view: &V,
    container: SmNodeId,
    _layout: SmLayoutType,
) -> Vec<SmTemplate> {
    // 简化策略：取 container 的前 24 个子节点做"众数模板"
    let mut counter: HashMap<(u8, bool, bool), usize> = HashMap::new();
    for it in view.children(container).into_iter().take(24) {
        let f = extract(view, container, it);
        *counter
            .entry((f.width_bucket, f.has_image_hint, f.has_text_hint))
            .or_insert(0) += 1;
    }
    let mut v: Vec<SmTemplate> = counter
        .into_iter()
        .map(|((w, i, t), c)| SmTemplate {
            width_bucket: w,
            image_flag: i,
            text_flag: t,
            support: c,
        })
        .collect();
    v.sort_by_key(|t| std::cmp::Reverse(t.support));
    v.truncate(3);
    v
}
