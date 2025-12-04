//! High-level orchestrators that glue ingestion, AI enrichment and execution.

pub mod scheduler;
pub mod policies;
pub mod config;
pub mod dispatcher;
pub mod batch;
pub mod chain;
pub mod static_exec;
pub mod single_step;
pub mod executor;
pub mod tracker;
pub mod phases;
pub mod protocol;
pub mod execution_gate;

pub use execution_gate::{ExecutionGate, GateConfig, GateVerification, GateRecommendation};
