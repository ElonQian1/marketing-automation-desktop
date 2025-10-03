/// VCF 批次命令
/// 
/// 提供 VCF 批次相关的 Tauri 命令处理函数

use tauri::{command, AppHandle};
use super::super::repositories::common::command_base::with_db_connection;
use super::super::repositories::vcf_batches_repo;
use super::super::models;

/// 创建 VCF 批次
#[command]
pub async fn create_vcf_batch_cmd(
    app_handle: AppHandle,
    batch_name: String,
    source_type: String,
    generation_method: String,
    description: Option<String>,
) -> Result<models::VcfBatchDto, String> {
    with_db_connection(&app_handle, |conn| {
        vcf_batches_repo::create_vcf_batch(conn, &batch_name, &source_type, &generation_method, description.as_deref())
    })
}

/// 列出 VCF 批次
#[command]
pub async fn list_vcf_batches_cmd(
    app_handle: AppHandle,
    limit: i64,
    offset: i64,
    search: Option<String>,
) -> Result<models::VcfBatchList, String> {
    with_db_connection(&app_handle, |conn| {
        vcf_batches_repo::list_vcf_batches(conn, limit, offset, search)
    })
}

/// 列出 VCF 批次记录（兼容前端调用）
#[command]
pub async fn list_vcf_batch_records_cmd(
    app_handle: AppHandle,
    limit: i64,
    offset: i64,
) -> Result<models::VcfBatchList, String> {
    with_db_connection(&app_handle, |conn| {
        vcf_batches_repo::list_vcf_batches(conn, limit, offset, None)
    })
}

/// 获取 VCF 批次详情
#[command]
pub async fn get_vcf_batch_cmd(
    app_handle: AppHandle,
    batch_id: String,
) -> Result<Option<models::VcfBatchDto>, String> {
    with_db_connection(&app_handle, |conn| {
        vcf_batches_repo::get_vcf_batch(conn, &batch_id)
    })
}

/// 更新 VCF 批次
#[command]
pub async fn update_vcf_batch_cmd(
    app_handle: AppHandle,
    batch_id: String,
    batch_name: Option<String>,
    description: Option<String>,
) -> Result<bool, String> {
    with_db_connection(&app_handle, |conn| {
        vcf_batches_repo::update_vcf_batch(conn, &batch_id, batch_name.as_deref(), description.as_deref())
    })
}

/// 删除 VCF 批次
#[command]
pub async fn delete_vcf_batch_cmd(
    app_handle: AppHandle,
    batch_id: String,
) -> Result<bool, String> {
    with_db_connection(&app_handle, |conn| {
        vcf_batches_repo::delete_vcf_batch(conn, &batch_id)
    })
}

/// 获取最近的 VCF 批次
#[command]
pub async fn get_recent_vcf_batches_cmd(
    app_handle: AppHandle,
    limit: i64,
) -> Result<Vec<models::VcfBatchDto>, String> {
    with_db_connection(&app_handle, |conn| {
        vcf_batches_repo::get_recent_vcf_batches(conn, limit)
    })
}

/// 创建 VCF 批次并关联号码
#[command]
pub async fn create_vcf_batch_with_numbers_cmd(
    app_handle: AppHandle,
    batch_name: String,
    source_type: String,
    generation_method: String,
    description: Option<String>,
    number_ids: Vec<i64>,
) -> Result<models::VcfBatchCreationResult, String> {
    with_db_connection(&app_handle, |conn| {
        vcf_batches_repo::create_vcf_batch_with_numbers(conn, &batch_name, &source_type, &generation_method, description.as_deref(), &number_ids)
    })
}

/// 获取 VCF 批次统计信息
#[command]
pub async fn get_vcf_batch_stats_cmd(
    app_handle: AppHandle,
    batch_id: String,
) -> Result<models::VcfBatchStatsDto, String> {
    with_db_connection(&app_handle, |conn| {
        vcf_batches_repo::get_vcf_batch_stats(conn, &batch_id)
    })
}

/// 设置 VCF 批次文件路径
#[command]
pub async fn set_vcf_batch_file_path_cmd(
    app_handle: AppHandle,
    batch_id: String,
    file_path: String,
) -> Result<bool, String> {
    with_db_connection(&app_handle, |conn| {
        vcf_batches_repo::set_vcf_batch_file_path(conn, &batch_id, &file_path)
    })
}

/// 批量删除 VCF 批次
#[command]
pub async fn batch_delete_vcf_batches_cmd(
    app_handle: AppHandle,
    batch_ids: Vec<String>,
) -> Result<i64, String> {
    with_db_connection(&app_handle, |conn| {
        vcf_batches_repo::batch_delete_vcf_batches(conn, &batch_ids)
    })
}

/// 按名称搜索 VCF 批次
#[command]
pub async fn search_vcf_batches_by_name_cmd(
    app_handle: AppHandle,
    name_pattern: String,
    limit: i64,
    offset: i64,
) -> Result<models::VcfBatchList, String> {
    with_db_connection(&app_handle, |conn| {
        vcf_batches_repo::search_vcf_batches_by_name(conn, &name_pattern, limit, offset)
    })
}

/// 获取批次号码计数
#[command]
pub async fn get_vcf_batch_number_count_cmd(
    app_handle: AppHandle,
    batch_id: String,
) -> Result<i64, String> {
    with_db_connection(&app_handle, |conn| {
        vcf_batches_repo::get_vcf_batch_number_count(conn, &batch_id)
    })
}

/// 标记 VCF 批次已完成
#[command]
pub async fn mark_vcf_batch_completed_cmd(
    app_handle: AppHandle,
    batch_id: String,
    file_path: Option<String>,
) -> Result<bool, String> {
    with_db_connection(&app_handle, |conn| {
        vcf_batches_repo::mark_vcf_batch_completed(conn, &batch_id, file_path.as_deref())
    })
}

/// 获取批次的所有行业分类
#[command]
pub async fn get_industries_for_vcf_batch_cmd(
    app_handle: AppHandle,
    batch_id: String,
) -> Result<Vec<String>, String> {
    with_db_connection(&app_handle, |conn| {
        vcf_batches_repo::get_industries_for_vcf_batch(conn, &batch_id)
    })
}

/// 按设备获取最近使用的批次
#[command]
pub async fn get_recent_vcf_batches_by_device_cmd(
    app_handle: AppHandle,
    device_id: String,
    limit: i64,
) -> Result<Vec<models::VcfBatchDto>, String> {
    with_db_connection(&app_handle, |conn| {
        vcf_batches_repo::get_recent_vcf_batches_by_device(conn, &device_id, limit)
    })
}