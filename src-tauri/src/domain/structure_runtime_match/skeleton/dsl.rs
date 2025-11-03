// src-tauri/src/domain/structure_runtime_match/skeleton/dsl.rs
// module: structure_runtime_match | layer: domain | role: 骨架规则DSL
// summary: 骨架规则的内部表示（图上文下/层级弹性等）

#[derive(Clone, Debug)]
pub struct SmSkeletonRulesDsl {
    pub require_image_above_text: bool,
    pub allow_depth_flex: i32,
}
