// src-tauri/src/domain/structure_runtime_match/container_gate/detector.rs
// module: structure_runtime_match | layer: domain | role: 容器检测器
// summary: 选面积最大的候选容器（简化版，后续可按滚动属性/指纹增强）

use crate::domain::structure_runtime_match::ports::xml_view::SmXmlView;
use crate::domain::structure_runtime_match::types::{SmBounds, SmContainerHit, SmLayoutType, SmNodeId};

/// 选面积最大的候选容器（简化版，够用；后续可按滚动属性/指纹增强）
pub fn pick_container<V: SmXmlView>(view: &V) -> Option<SmContainerHit> {
    let mut best: Option<(SmNodeId, SmBounds, i64)> = None;
    for n in view.container_candidates() {
        let b = view.bounds(n);
        let area = b.area();
        if best.map_or(true, |(_, _, a)| area > a) {
            best = Some((n, b, area));
        }
    }
    best.map(|(node, bounds, _)| SmContainerHit {
        node,
        bounds,
        layout: SmLayoutType::Unknown,
    })
}
