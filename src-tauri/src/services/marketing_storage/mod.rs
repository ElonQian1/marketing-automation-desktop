//! Marketing Storage Module
//!
//! SQLite-backed persistence for marketing watch targets (精准获客候选池).

pub mod models;
pub mod repositories;
pub mod facade;
pub mod commands;

// Re-export commands for easy import in main.rs
