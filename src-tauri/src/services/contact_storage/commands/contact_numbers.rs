/// 联系人号码命令
/// 
/// 提供联系人号码相关的 Tauri 命令处理函数

use tauri::{command, AppHandle};
use super::super::repositories::common::command_base::with_db_connection;
use super::super::repositories::contact_numbers_repo;
use super::super::models;
use std::path::Path;
use std::fs;

/// 从文本提取号码的简单函数（临时实现）
fn extract_numbers_from_text(content: &str) -> Vec<(String, String)> {
    let mut numbers = Vec::new();
    for line in content.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        
        // 简单的手机号匹配逻辑
        if let Some(phone_match) = line.split_whitespace().find(|s| s.len() >= 11 && s.chars().all(|c| c.is_ascii_digit())) {
            let name = line.replace(phone_match, "").trim().to_string();
            let name = if name.is_empty() { "未知".to_string() } else { name };
            numbers.push((phone_match.to_string(), name));
        }
    }
    numbers
}

/// 从文件导入联系人号码
#[command]
pub async fn import_contact_numbers_from_file(
    app_handle: AppHandle,
    file_path: String,
) -> Result<models::ImportNumbersResult, String> {
    if !Path::new(&file_path).exists() {
        return Err(format!("文件不存在: {}", file_path));
    }

    let content = fs::read_to_string(&file_path).map_err(|e| format!("读取文件失败: {}", e))?;
    let numbers = extract_numbers_from_text(&content);

    let (inserted, duplicates, errors) = with_db_connection(&app_handle, |conn| {
        contact_numbers_repo::insert_numbers(conn, &numbers, &file_path)
    })?;
    
    Ok(models::ImportNumbersResult {
        success: true,
        total_files: 1,
        total_numbers: numbers.len() as i64,
        inserted,
        duplicates,
        errors,
    })
}

/// 从文件夹批量导入联系人号码
#[command]
pub async fn import_contact_numbers_from_folder(
    app_handle: AppHandle,
    folder_path: String,
) -> Result<models::ImportNumbersResult, String> {
    let folder = Path::new(&folder_path);
    if !folder.exists() || !folder.is_dir() {
        return Err(format!("文件夹不存在或不是目录: {}", folder_path));
    }

    let mut total_files: i64 = 0;
    let mut total_numbers: i64 = 0;
    let mut total_inserted: i64 = 0;
    let mut total_duplicates: i64 = 0;
    let mut all_errors: Vec<String> = Vec::new();

    for entry in fs::read_dir(folder).map_err(|e| format!("读取目录失败: {}", e))? {
        let entry = entry.map_err(|e| format!("读取目录项失败: {}", e))?;
        let path = entry.path();
        if path.is_file() {
            if let Some(ext) = path.extension() {
                if ext.to_string_lossy().to_lowercase() == "txt" {
                    total_files += 1;
                    match fs::read_to_string(&path) {
                        Ok(content) => {
                            let numbers = extract_numbers_from_text(&content);
                            let (inserted, duplicates, mut errors) = with_db_connection(&app_handle, |conn| {
                                contact_numbers_repo::insert_numbers(conn, &numbers, &path.to_string_lossy())
                            })?;
                            
                            total_numbers += numbers.len() as i64;
                            total_inserted += inserted;
                            total_duplicates += duplicates;
                            all_errors.append(&mut errors);
                        }
                        Err(e) => {
                            let err_msg = format!("读取文件失败 {}: {}", path.to_string_lossy(), e);
                            all_errors.push(err_msg);
                        }
                    }
                }
            }
        }
    }

    Ok(models::ImportNumbersResult {
        success: true,
        total_files,
        total_numbers,
        inserted: total_inserted,
        duplicates: total_duplicates,
        errors: all_errors,
    })
}

/// 标记号码为未导入状态
#[command]
pub async fn mark_contact_numbers_as_not_imported(
    app_handle: AppHandle,
    number_ids: Vec<i64>,
) -> Result<i64, String> {
    with_db_connection(&app_handle, |conn| {
        contact_numbers_repo::mark_numbers_as_not_imported_by_ids(conn, &number_ids)
    })
}

/// 列出联系人号码
#[command]
pub async fn list_contact_numbers(
    app_handle: AppHandle,
    limit: i64,
    offset: i64,
    search: Option<String>,
) -> Result<models::ContactNumberList, String> {
    with_db_connection(&app_handle, |conn| {
        // 由于仓储层的list_numbers只接受3个参数，暂时忽略search参数
        contact_numbers_repo::list_numbers(conn, limit, offset)
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

    // 转换HashMap为Vec
    let per_industry = stats.per_industry.into_iter()
        .map(|(industry, count)| models::IndustryCountDto { industry, count })
        .collect();

    Ok(models::ContactNumberStatsDto {
        total: stats.total,
        used: stats.used,
        unused: stats.unused,
        vcf_generated: stats.vcf_generated,
        imported: stats.imported,
        unclassified: stats.unclassified,
        not_imported: stats.not_imported,
        per_industry,
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
        contact_numbers_repo::set_industry_by_id_range(conn, start_id, end_id, &industry)
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

    // 查询分配的号码详情
    let allocated_numbers = with_db_connection(&app_handle, |conn| {
        let mut nums = Vec::new();
        for id in &number_ids {
            if let Ok(Some(num)) = contact_numbers_repo::get_number_by_id(conn, *id) {
                nums.push(num);
            }
        }
        Ok::<Vec<models::ContactNumberDto>, rusqlite::Error>(nums)
    })?;

    Ok(models::AllocationResultDto {
        batch_id: batch_id.clone(),
        vcf_file_path,
        device_id,
        number_count: allocated_count,
        number_ids: number_ids.clone(),
        session_id: 0, // 临时值，需要创建session
        allocated_numbers,
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