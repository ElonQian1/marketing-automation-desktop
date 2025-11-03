// src-tauri/src/domain/structure_runtime_match/field_refine/scorer.rs
// module: structure_runtime_match | layer: domain | role: 字段评分器
// summary: 根据字段规则（class/text/presence）对节点进行精调评分

use crate::domain::structure_runtime_match::config::FieldRules;
use crate::domain::structure_runtime_match::ports::xml_view::SmXmlView;
use crate::domain::structure_runtime_match::types::SmItemHit;

/// 字段/文本细则：presence_only / class_contains / must_equal_text
pub fn score_fields<V: SmXmlView>(view: &V, fr: &FieldRules, items: &mut [SmItemHit]) {
    for it in items {
        let mut score = 0.0f32;
        let mut cnt = 0.0f32;

        for r in &fr.rules {
            cnt += 1.0;
            let mut ok = true;
            if let Some(cls) = &r.class_contains {
                ok &= view.class(it.node).contains(cls);
            }
            if let Some(t) = &r.must_equal_text {
                ok &= view.text(it.node) == t;
            }
            if r.presence_only {
                ok &= !view.text(it.node).is_empty();
            }
            score += if ok { 1.0 } else { 0.0 };
        }

        it.scores.field = if cnt > 0.0 { score / cnt } else { 0.5 };
    }
}
