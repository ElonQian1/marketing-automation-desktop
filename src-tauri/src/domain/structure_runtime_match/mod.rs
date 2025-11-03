// src-tauri/src/domain/structure_runtime_match/mod.rs
// module: structure_runtime_match | layer: domain | role: 模块根入口
// summary: 结构匹配运行时模块 - 真机ADB dump匹配算法的完整实现

pub mod types;
pub mod config;
pub mod orchestrator;

pub mod ports {
    pub mod xml_view;
    pub mod cache;
}

pub mod adapters;

pub mod container_gate;
pub mod layout_gate;
pub mod signature;
pub mod skeleton;
pub mod field_refine;
pub mod scoring;

// 对外唯一入口
pub use orchestrator::sm_run_once;
pub use types::{SmBounds, SmContainerHit, SmItemHit, SmLayoutType, SmNodeId, SmResult, SmScores};
pub use config::{SmConfig, SmMode, SkeletonRules, FieldRule, FieldRules, ContainerHint};
pub use ports::xml_view::SmXmlView;
pub use ports::cache::SmCache;
pub use adapters::xml_indexer_adapter::XmlIndexerAdapter;
