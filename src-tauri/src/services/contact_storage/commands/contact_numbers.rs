/// 联系人号码命令
/// 
/// 提供联系人号码相关的 Tauri 命令处理函数

use tauri::{command, AppHandle};
use super::super::repositories::common::command_base::with_db_connection;
use super::super::repositories::contact_numbers_repo;
use super::super::models;

/// 列出联系人号码
#[command]
pub async fn list_contact_numbers(
    app_handle: AppHandle,
    limit: i64,
    offset: i64,
    search: Option<String>,
) -> Result<models::ContactNumberList, String> {
    with_db_connection(&app_handle, |conn| {
        contact_numbers_repo::list_numbers(conn, limit, offset, search)
    })
}

/// 获取联系人号码
#[command]
pub async fn fetch_contact_numbers(
    app_handle: AppHandle,
    count: i64,
) -> Result<Vec<models::ContactNumberDto>, String> {
    with_db_connection(&app_handle, |conn| {
        contact_numbers_repo::fetch_numbers(conn, count)
    })
}

/// 获取未分类的联系人号码
#[command]
pub async fn fetch_unclassified_contact_numbers(
    app_handle: AppHandle,
    count: i64,
    only_unconsumed: bool,
) -> Result<Vec<models::ContactNumberDto>, String> {
    with_db_connection(&app_handle, |conn| {
        contact_numbers_repo::fetch_unclassified_numbers(conn, count, only_unconsumed)
    })
}

/// 按ID区间获取联系人号码
#[command]
pub async fn fetch_contact_numbers_by_id_range(
    app_handle: AppHandle,
    start_id: i64,
    end_id: i64,
) -> Result<Vec<models::ContactNumberDto>, String> {
    with_db_connection(&app_handle, |conn| {
        contact_numbers_repo::fetch_numbers_by_id_range(conn, start_id, end_id)
    })
}

/// 按ID区间获取未消费的联系人号码
#[command]
pub async fn fetch_contact_numbers_by_id_range_unconsumed(
    app_handle: AppHandle,
    start_id: i64,
    end_id: i64,
) -> Result<Vec<models::ContactNumberDto>, String> {
    with_db_connection(&app_handle, |conn| {
        contact_numbers_repo::fetch_numbers_by_id_range_unconsumed(conn, start_id, end_id)
    })
}

/// 标记ID区间内的号码为已使用
#[command]
pub async fn mark_contact_numbers_used_by_id_range(
    app_handle: AppHandle,
    start_id: i64,
    end_id: i64,
    batch_id: String,
) -> Result<i64, String> {
    with_db_connection(&app_handle, |conn| {
        contact_numbers_repo::mark_numbers_used_by_id_range(conn, start_id, end_id, &batch_id)
    })
}

/// 标记指定ID的号码为未导入状态
#[command]
pub async fn mark_contact_numbers_as_not_imported_by_ids(
    app_handle: AppHandle,
    number_ids: Vec<i64>,
) -> Result<i64, String> {
    with_db_connection(&app_handle, |conn| {
        contact_numbers_repo::mark_numbers_as_not_imported_by_ids(conn, &number_ids)
    })
}

/// 获取联系人号码统计信息
#[command]
pub async fn get_contact_number_stats_cmd(
    app_handle: AppHandle,
) -> Result<models::ContactNumberStatsDto, String> {
    let stats = with_db_connection(&app_handle, |conn| {
        contact_numbers_repo::get_contact_number_stats(conn)
    })?;

    Ok(models::ContactNumberStatsDto {
        total: stats.total,
        used: stats.used,
        unused: stats.unused,
        vcf_generated: stats.vcf_generated,
        imported: stats.imported,
    })
}

/// 按ID区间设置号码的行业分类
#[command]
pub async fn set_contact_numbers_industry_by_id_range(
    app_handle: AppHandle,
    start_id: i64,
    end_id: i64,
    industry: String,
) -> Result<i64, String> {
    with_db_connection(&app_handle, |conn| {
        contact_numbers_repo::set_numbers_industry_by_id_range(conn, start_id, end_id, &industry)
    })
}

/// 列出未关联到任何批次的号码
#[command]
pub async fn list_contact_numbers_without_batch(
    app_handle: AppHandle,
    limit: i64,
    offset: i64,
) -> Result<models::ContactNumberList, String> {
    with_db_connection(&app_handle, |conn| {
        contact_numbers_repo::list_numbers_without_batch(conn, limit, offset)
    })
}

/// 列出未关联到任何批次的号码（带筛选）
#[command]
pub async fn list_contact_numbers_without_batch_filtered(
    app_handle: AppHandle,
    limit: i64,
    offset: i64,
    industry: Option<String>,
    status: Option<String>,
) -> Result<models::ContactNumberList, String> {
    with_db_connection(&app_handle, |conn| {
        contact_numbers_repo::list_numbers_without_batch_filtered(conn, limit, offset, industry, status)
    })
}

/// 获取所有行业分类
#[command]
pub async fn get_distinct_industries_cmd(
    app_handle: AppHandle,
) -> Result<Vec<String>, String> {
    with_db_connection(&app_handle, |conn| {
        contact_numbers_repo::get_distinct_industries(conn)
    })
}

/// 为设备分配联系人号码
#[command]
pub async fn allocate_contact_numbers_to_device(
    app_handle: AppHandle,
    device_id: String,
    count: i64,
    industry: Option<String>,
) -> Result<models::AllocationResultDto, String> {
    let (batch_id, vcf_file_path, number_ids, allocated_count) = with_db_connection(&app_handle, |conn| {
        contact_numbers_repo::allocate_numbers_to_device(conn, &device_id, count, industry.as_deref())
    })?;

    Ok(models::AllocationResultDto {
        batch_id,
        vcf_file_path,
        device_id,
        number_count: allocated_count,
        allocated_numbers: number_ids,
    })
}

/// 按批次列出联系人号码
#[command]
pub async fn list_contact_numbers_by_batch(
    app_handle: AppHandle,
    batch_id: String,
    only_used: Option<bool>,
    limit: i64,
    offset: i64,
) -> Result<models::ContactNumberList, String> {
    with_db_connection(&app_handle, |conn| {
        contact_numbers_repo::list_numbers_by_batch(conn, &batch_id, only_used, limit, offset)
    })
}

/// 按批次列出联系人号码（带行业筛选）
#[command]
pub async fn list_contact_numbers_by_batch_filtered(
    app_handle: AppHandle,
    batch_id: String,
    only_used: Option<bool>,
    industry: Option<String>,
    limit: i64,
    offset: i64,
) -> Result<models::ContactNumberList, String> {
    with_db_connection(&app_handle, |conn| {
        contact_numbers_repo::list_numbers_by_batch_filtered(conn, &batch_id, only_used, industry, limit, offset)
    })
}

/// 列出联系人号码（增强筛选版本）
#[command]
pub async fn list_contact_numbers_filtered(
    app_handle: AppHandle,
    limit: i64,
    offset: i64,
    search: Option<String>,
    industry: Option<String>,
    status: Option<String>,
) -> Result<models::ContactNumberList, String> {
    with_db_connection(&app_handle, |conn| {
        contact_numbers_repo::list_numbers_filtered(conn, limit, offset, search, industry, status)
    })
}

/// 为VCF批次列出联系人号码
#[command]
pub async fn list_contact_numbers_for_vcf_batch(
    app_handle: AppHandle,
    batch_id: String,
    limit: i64,
    offset: i64,
) -> Result<models::ContactNumberList, String> {
    with_db_connection(&app_handle, |conn| {
        contact_numbers_repo::list_numbers_for_vcf_batch(conn, &batch_id, limit, offset)
    })
}

/// 为VCF批次中的号码标记行业分类
#[command]
pub async fn tag_contact_numbers_industry_by_vcf_batch(
    app_handle: AppHandle,
    batch_id: String,
    industry: String,
) -> Result<i64, String> {
    with_db_connection(&app_handle, |conn| {
        contact_numbers_repo::tag_numbers_industry_by_vcf_batch(conn, &batch_id, &industry)
    })
}