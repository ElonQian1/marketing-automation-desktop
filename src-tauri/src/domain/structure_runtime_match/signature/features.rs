// src-tauri/src/domain/structure_runtime_match/signature/features.rs
// module: structure_runtime_match | layer: domain | role: 特征提取器
// summary: 从节点提取结构特征（宽度桶/图文线索等）

use crate::domain::structure_runtime_match::ports::xml_view::SmXmlView;
use crate::domain::structure_runtime_match::types::SmNodeId;

/// 最小特征：相对宽桶 + 是否含图/文（后续可替换更强版本）
pub struct SmFeat {
    pub width_bucket: u8,
    pub has_image_hint: bool,
    pub has_text_hint: bool,
}

pub fn extract<V: SmXmlView>(view: &V, container: SmNodeId, item: SmNodeId) -> SmFeat {
    let cb = view.bounds(container);
    let ib = view.bounds(item);
    let w_ratio = ib.width().max(1) as f32 / cb.width().max(1) as f32; // 0..1
    let width_bucket = ((w_ratio * 20.0).round() as i32).clamp(0, 20) as u8;

    let cls = view.class(item).to_ascii_lowercase();
    let has_image_hint = cls.contains("image");
    let has_text_hint = cls.contains("text") || !view.text(item).is_empty();

    SmFeat {
        width_bucket,
        has_image_hint,
        has_text_hint,
    }
}

