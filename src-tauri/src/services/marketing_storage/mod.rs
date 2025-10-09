//! Marketing Storage Module
//!
//! SQLite-backed persistence for marketing watch targets (精准获客候选池).

pub mod models;
pub mod repositories;
pub mod commands;

// Re-export commands for easy import in main.rs
pub use commands::{
    bulk_upsert_watch_targets,
    get_watch_target_by_dedup_key,
    list_watch_targets,
};
