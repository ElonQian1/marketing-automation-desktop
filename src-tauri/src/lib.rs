// src/lib.rs - Library interface for testing
// 为了支持集成测试，将主要模块重新导出

pub mod application;
pub mod domain;
pub mod infra;
pub mod infrastructure;
pub mod utils;
pub mod new_backend;
pub mod services;
pub mod commands;
pub mod types;
pub mod device;
pub mod exec;
pub mod ai;
pub mod db;
pub mod engine;
pub mod matchers;
pub mod screenshot_service;

// 重新导出常用类型
pub use exec::v3::{
    types::{StepRefOrInline, InlineStep, SingleStepAction},
    helpers::analysis_helpers::{should_trigger_intelligent_analysis, perform_intelligent_strategy_analysis_from_raw}
};

pub use services::intelligent_analysis_service::{
    IntelligentAnalysisRequest, IntelligentAnalysisResult
};