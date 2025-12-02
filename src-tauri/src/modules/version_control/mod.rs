use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};

use crate::domain::analysis_cache::version_commands::{
    self, BranchRequest, ComputeDiffRequest, CreateVersionRequest, InitVersionControlRequest,
    RebuildVersionRequest, VersionQueryRequest,
};
use crate::domain::analysis_cache::version_control::{
    Branch, IntegrityReport, StorageStats, XmlDelta, XmlVersion,
};

// 1. Wrapper Functions

#[tauri::command]
async fn init_version_control(request: InitVersionControlRequest) -> Result<String, String> {
    version_commands::init_version_control(request).await
}

#[tauri::command]
async fn create_version(request: CreateVersionRequest) -> Result<String, String> {
    version_commands::create_version(request).await
}

#[tauri::command]
async fn query_versions(request: VersionQueryRequest) -> Result<Vec<XmlVersion>, String> {
    version_commands::query_versions(request).await
}

#[tauri::command]
async fn create_branch(request: BranchRequest) -> Result<Branch, String> {
    version_commands::create_branch(request).await
}

#[tauri::command]
async fn list_branches() -> Result<Vec<Branch>, String> {
    version_commands::list_branches().await
}

#[tauri::command]
async fn compute_xml_diff(request: ComputeDiffRequest) -> Result<XmlDelta, String> {
    version_commands::compute_xml_diff(request).await
}

#[tauri::command]
async fn rebuild_version(request: RebuildVersionRequest) -> Result<String, String> {
    version_commands::rebuild_version(request).await
}

#[tauri::command]
async fn get_version_storage_stats() -> Result<StorageStats, String> {
    version_commands::get_version_storage_stats().await
}

#[tauri::command]
async fn check_version_integrity() -> Result<IntegrityReport, String> {
    version_commands::check_version_integrity().await
}

#[tauri::command]
async fn delete_version(version_id: String) -> Result<String, String> {
    version_commands::delete_version(version_id).await
}

// 2. Plugin Initialization
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("version_control")
        .invoke_handler(tauri::generate_handler![
            init_version_control,
            create_version,
            query_versions,
            create_branch,
            list_branches,
            compute_xml_diff,
            rebuild_version,
            get_version_storage_stats,
            check_version_integrity,
            delete_version
        ])
        .build()
}
