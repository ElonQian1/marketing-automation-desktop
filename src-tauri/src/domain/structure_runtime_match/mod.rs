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

// 🔥 新增：点击规范化模块
pub mod click_normalizer;

// 🔥 新增：三路评分器与自动选型系统
pub mod scorers;
pub mod auto_mode_selector;
pub mod execution_bridge;
pub mod execution_types;
pub mod auto_recommendation_service;

// 对外唯一入口
pub use orchestrator::sm_run_once;
pub use types::{SmBounds, SmContainerHit, SmItemHit, SmLayoutType, SmNodeId, SmResult, SmScores};
pub use config::{SmConfig, SmMode, SkeletonRules, FieldRule, FieldRules, ContainerHint};
pub use ports::xml_view::SmXmlView;
pub use ports::cache::SmCache;
pub use adapters::xml_indexer_adapter::XmlIndexerAdapter;

// 🔥 新增：点击规范化相关导出
pub use click_normalizer::{ClickNormalizer, ClickNormalizeResult, NormalizedNode, ColumnInfo, WaterfallColumn};

// 🔥 新增：自动选型系统导出
pub use auto_mode_selector::{AutoModeSelector, AutoPickConfig, AutoPickResult, RecommendationDetails};
pub use execution_bridge::{ExecutionBridge, ExecutionMapping, MappingSummary};
pub use execution_types::{ClickMode, ExecutionStrategy}; // 移除重复的 ColumnInfo
pub use auto_recommendation_service::{AutoRecommendationService, AutoRecommendationResult, AutoRecommendationConfig, RecommendationSummary, ValidationResult};
pub use scorers::types::{MatchMode, ScoreOutcome, SubtreeFeatures, ContextSig};
