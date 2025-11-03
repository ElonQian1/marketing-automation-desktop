// src-tauri/src/domain/structure_runtime_match/signature/matcher.rs
// module: structure_runtime_match | layer: domain | role: 模板匹配器
// summary: 将候选节点与学习到的模板进行匹配评分

use super::features::extract;
use super::learner::SmTemplate;
use crate::domain::structure_runtime_match::ports::xml_view::SmXmlView;
use crate::domain::structure_runtime_match::types::SmItemHit;

pub fn score_tpl<V: SmXmlView>(
    view: &V,
    container: u32,
    tpls: &[SmTemplate],
    items: &mut [SmItemHit],
) {
    for it in items {
        let f = extract(view, container, it.node);
        let mut s = 0.0f32;
        for t in tpls {
            if t.width_bucket == f.width_bucket
                && t.image_flag == f.has_image_hint
                && t.text_flag == f.has_text_hint
            {
                s = 1.0; // 命中模板=1（后续可做相似度）
                break;
            }
        }
        it.scores.tpl = s;
    }
}
