// src-tauri/src/domain/structure_runtime_match/container_gate/mod.rs
// module: structure_runtime_match | layer: domain | role: 容器限域模块
// summary: 统一"找对盒子"的第0步剪枝 - 通用容器限域系统

pub mod types;
pub mod resolver;
pub mod scoring;
pub mod detector; // 保留原有的简单检测器

pub mod heuristics {
    pub mod scrollable;
    pub mod semantic;
    pub mod geometry;
    pub mod exclusion;
    pub mod popup;
    pub mod vote;
}

pub mod providers {
    pub mod xpath_hint;
    pub mod element_id_hint;  // ✅ 新增: 元素ID精确定位
    pub mod bounds_hint;
    pub mod ancestor_chain;
}

// 便捷 re-export
pub use resolver::resolve_container_scope;
pub use types::{
    ContainerHints, ContainerConfig
};
