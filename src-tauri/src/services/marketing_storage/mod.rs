//! Marketing Storage Module
//!
//! SQLite-backed persistence for marketing watch targets (精准获客候选池).

pub mod models;
pub mod repositories;
pub mod commands;

// Re-export commands for easy import in main.rs
pub use commands::{
    // 候选池相关
    bulk_upsert_watch_targets,
    get_watch_target_by_dedup_key,
    list_watch_targets,
    // 评论相关
    insert_comment,
    list_comments,
    // 任务相关
    insert_task,
    update_task_status,
    list_tasks,
    // 审计日志相关
    insert_audit_log,
    query_audit_logs,
    export_audit_logs,
    cleanup_expired_audit_logs,
    batch_store_audit_logs,
    check_and_reserve_dedup,
};
