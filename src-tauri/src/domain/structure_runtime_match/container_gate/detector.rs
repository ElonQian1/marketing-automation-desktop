// src-tauri/src/domain/structure_runtime_match/container_gate/detector.rs
// module: structure_runtime_match | layer: domain | role: 容器检测器
// summary: 选面积最大的候选容器（简化版，后续可按滚动属性/指纹增强）

use crate::domain::structure_runtime_match::ports::xml_view::SmXmlView;
use crate::domain::structure_runtime_match::types::{SmBounds, SmContainerHit, SmLayoutType, SmNodeId};

/// 选面积最大的候选容器（优先选择 RecyclerView/GridView 等列表容器）
pub fn pick_container<V: SmXmlView>(view: &V) -> Option<SmContainerHit> {
    let mut best: Option<(SmNodeId, SmBounds, i64, u8)> = None; // (node, bounds, area, priority)
    
    for n in view.container_candidates() {
        let b = view.bounds(n);
        let area = b.area();
        let class = view.class(n).to_lowercase();
        
        // 🎯 容器优先级逻辑
        // 1. 列表容器 (RecyclerView/GridView/ListView) -> 优先级 3
        // 2. 滚动容器 (ScrollView) -> 优先级 2
        // 3. 分页容器 (ViewPager) -> 优先级 1 (通常是外层容器，容易误选)
        // 4. 其他 -> 优先级 0
        let priority = if class.contains("recyclerview") 
            || class.contains("gridview") 
            || class.contains("listview") 
            || class.contains("staggeredgrid") {
            3
        } else if class.contains("scrollview") {
            2
        } else if class.contains("viewpager") {
            1
        } else {
            0
        };

        // 择优逻辑：优先级高者胜；优先级相同，面积大者胜
        let is_better = match best {
            None => true,
            Some((_, _, best_area, best_priority)) => {
                if priority > best_priority {
                    true
                } else if priority == best_priority {
                    area > best_area
                } else {
                    false
                }
            }
        };

        if is_better {
            best = Some((n, b, area, priority));
        }
    }
    
    best.map(|(node, bounds, _, _)| SmContainerHit {
        node,
        bounds,
        layout: SmLayoutType::Unknown,
    })
}
