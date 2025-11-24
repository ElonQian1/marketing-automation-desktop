//! AI automation workspace scaffold.
//!
//! Organizes domain models, service traits, and adapters that support
//! the AI-powered monitoring and response workflows documented under
//! `docs/AI_AUTOMATION_MODULE`.

pub mod domain;
pub mod services;
pub mod adapters;
pub mod pipeline;
pub mod types;
pub mod events;

// ✅ New Device Automation Core
pub mod actions;
pub mod matching;
pub mod engine;
// pub mod matching;
