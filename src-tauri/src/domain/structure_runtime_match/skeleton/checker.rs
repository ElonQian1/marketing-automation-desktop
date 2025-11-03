// src-tauri/src/domain/structure_runtime_match/skeleton/checker.rs
// module: structure_runtime_match | layer: domain | role: 骨架检查器
// summary: 根据骨架规则对候选节点进行结构校验

use super::dsl::SmSkeletonRulesDsl;
use crate::domain::structure_runtime_match::ports::xml_view::SmXmlView;
use crate::domain::structure_runtime_match::types::SmItemHit;

/// 极简实现：同时具有"图/文"线索则高分（可逐步替换为真实骨架规则）
pub fn score_skeleton<V: SmXmlView>(
    view: &V,
    rules: &SmSkeletonRulesDsl,
    items: &mut [SmItemHit],
) {
    for it in items {
        let cls = view.class(it.node).to_ascii_lowercase();
        let has_img = cls.contains("image");
        let has_txt = cls.contains("text") || !view.text(it.node).is_empty();

        it.scores.skeleton = if rules.require_image_above_text {
            if has_img && has_txt {
                0.9
            } else {
                0.3
            }
        } else if has_img || has_txt {
            0.6
        } else {
            0.0
        };
    }
}
