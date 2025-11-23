// src-tauri/src/exec/v3/helpers/mod.rs
// module: exec/v3/helpers | layer: infrastructure | role: 子模块聚合
// summary: 统一导出所有辅助功能模块


pub mod intelligent_analysis;
pub mod protocol_builders;
pub mod strategy_generation;
pub mod step_optimization;
pub mod execution_tracker;
pub mod config_loader;
pub mod action_dispatcher;
pub mod legacy_matcher;
pub mod device_manager;
pub mod step_executor;
pub mod analysis_helpers;
pub mod step_scoring;
pub mod phase_handlers;
pub mod intelligent_preprocessing;
pub mod element_hierarchy_analyzer;
pub mod batch_executor;  // 🆕 批量执行引擎
pub mod sm_integration;  // 🏗️ 结构匹配Runtime集成（V3专用）
pub mod xml_source_resolver;  // 🎯 XML数据源三级降级解析器

// 统一导出常用类型和函数
pub use element_hierarchy_analyzer::*;
  // 🆕 批量执行引擎
  // 🎯 XML数据源解析器


