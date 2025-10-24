// src-tauri/src/engine/mod.rs
// 策略引擎模块导出：包含插件化决策链系统

pub mod strategy_engine;

// 🚀 新增：插件化决策链系统
pub mod strategy_plugin;
pub mod gating;
pub mod xml_indexer;

pub use strategy_engine::{
    StrategyEngine,
    Evidence,
    CandidateScore,
    StepResult,
    AnalysisContext,
    ContainerInfo,
    EngineWeights,
};

// 🚀 导出新的插件化接口
pub use strategy_plugin::{
    StrategyExecutor,
    StrategyRegistry,
    ExecutionEnvironment,
    MatchSet,
    ExecutionResult,
    STRATEGY_REGISTRY,
};

pub use gating::{
    SafetyGatekeeper,
    FallbackController,
};

pub use xml_indexer::{
    XmlIndexer,
    SearchInterface,
    IndexedNode,
};