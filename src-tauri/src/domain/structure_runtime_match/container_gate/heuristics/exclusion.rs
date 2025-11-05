// src-tauri/src/domain/structure_runtime_match/container_gate/heuristics/exclusion.rs
// module: structure_runtime_match | layer: domain | role: 排除规则启发式
// summary: Toolbar/TabBar/整屏/薄壳等不合适容器的排除逻辑

use crate::domain::structure_runtime_match::container_gate::types::{UiTree, NodeId};

const AVOID_CLASSES: &[&str] = &[
    "Toolbar", "ActionBar", "TabLayout", "BottomNavigationView",
];

pub fn should_exclude<T: UiTree>(tree: &T, cfg_max_fullscreen_ratio: f32, id: NodeId) -> bool {
    let class = tree.class(id);
    if AVOID_CLASSES.iter().any(|k| class.contains(k)) { 
        return true; 
    }

    // 过薄/过小：
    let ar = tree.area_ratio(id);
    if ar < 0.02 { 
        return true; 
    }

    // 整屏（强排除在大多数场景；若确实需要，将由上层兜底处理）
    if ar > cfg_max_fullscreen_ratio { 
        return true; 
    }

    // 只有一个孩子且不可滚（常见包裹壳）
    if !tree.is_scrollable(id) && tree.children(id).len() <= 1 { 
        return true; 
    }

    false
}