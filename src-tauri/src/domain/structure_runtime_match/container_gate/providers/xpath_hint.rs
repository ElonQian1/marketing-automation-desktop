// src-tauri/src/domain/structure_runtime_match/container_gate/providers/xpath_hint.rs
// module: structure_runtime_match | layer: domain | role: XPath强提示处理器
// summary: container_xpath 直接定位

use crate::domain::structure_runtime_match::container_gate::types::{UiTree, NodeId, ContainerHints, HeuristicResult};

pub fn propose<T: UiTree>(tree: &T, hints: &ContainerHints, anchor: NodeId) -> Vec<HeuristicResult> {
    let Some(xpath) = &hints.container_xpath else { 
        return vec![]; 
    };
    
    if let Some(n) = tree.node_by_xpath(xpath) {
        // 要求至少是锚点祖先
        if tree.is_ancestor_of(n, anchor) {
            return vec![HeuristicResult {
                node: n,
                score: 2.0, // 强提示高权重
                tag: "hint_xpath",
                note: format!("by container_xpath {}", xpath),
            }];
        }
    }
    vec![]
}