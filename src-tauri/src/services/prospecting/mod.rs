// src-tauri/src/services/prospecting/mod.rs
pub mod types;
pub mod repository;
pub mod service;

pub use types::*;
pub use repository::ProspectingRepository;
pub use service::ProspectingService;