// src-tauri/src/engine/mod.rs
// 策略引擎模块导出：包含插件化决策链系统和Self-Anchor模块

pub mod strategy_engine;
pub mod self_anchor; // 🆕 新增：模块化Self-Anchor系统

// 🚀 新增：插件化决策链系统
pub mod strategy_plugin;
pub mod gating;
pub mod xml_indexer;
pub mod index_path_locator; // 🎯 新增：绝对路径定位模块

pub use strategy_engine::{
    StrategyEngine,
    Evidence,
    AnalysisContext,
    ContainerInfo,
};

// 🆕 导出Self-Anchor模块

// 🚀 导出新的插件化接口

pub use gating::FallbackController;

pub use xml_indexer::XmlIndexer;