/// 联系人号码命令
/// 
/// 提供联系人号码相关的 Tauri 命令处理函数

use tauri::{command, AppHandle};
use super::super::repository_facade::ContactStorageFacade;
use super::super::models;
use super::super::parser::extract_numbers_from_text; // 使用 parser 模块的实现
use std::path::Path;
use std::fs;

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
    let total_lines = content.lines().count() as i64;
    let parse_result = extract_numbers_from_text(&content);
    let numbers = parse_result.contacts; // 提取联系人列表

    // 提取文件名（用于记录）
    let file_name = Path::new(&file_path)
        .file_name()
        .and_then(|f| f.to_str())
        .unwrap_or("unknown.txt")
        .to_string();

    let facade = ContactStorageFacade::new(&app_handle);
    let (inserted, duplicates, errors) = facade.insert_numbers(&numbers, &file_path)?;
    
    // 无论导入结果如何都记录到 txt_import_records 表（包括空文件和全部重复）
    let status = if errors.is_empty() { 
        if numbers.is_empty() {
            "empty"  // 空文件
        } else if inserted == 0 && duplicates > 0 {
            "all_duplicates"  // 全部重复
        } else {
            "success"
        }
    } else { 
        "partial" 
    };
    let error_message = if errors.is_empty() { 
        None 
    } else { 
        Some(errors.join("; ")) 
    };
    
    // 记录导入结果到 txt_import_records 表（使用 UPSERT 避免重复文件冲突）
    if let Err(e) = facade.create_txt_import_record(
        &file_path,
        total_lines,
        numbers.len() as i64,
        error_message.as_deref(),
        None, // batch_id
    ) {
        tracing::warn!("⚠️  创建/更新TXT导入记录失败: {}", e);
        eprintln!("⚠️  创建/更新TXT导入记录失败: {}", e);
    } else {
        tracing::info!("✅ 成功记录TXT导入: {} (导入{}/重复{})", file_name, inserted, duplicates);
    }
    
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

    let facade = ContactStorageFacade::new(&app_handle);
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
                    let file_path_str = path.to_string_lossy().to_string();
                    let file_name = path
                        .file_name()
                        .and_then(|f| f.to_str())
                        .unwrap_or("unknown.txt")
                        .to_string();
                    
                    match fs::read_to_string(&path) {
                        Ok(content) => {
                            let total_lines = content.lines().count() as i64;
                            let parse_result = extract_numbers_from_text(&content);
                            let numbers = parse_result.contacts; // 提取联系人列表
                            let (inserted, duplicates, mut errors) = facade.insert_numbers(&numbers, &file_path_str)?;
                            
                            total_numbers += numbers.len() as i64;
                            total_inserted += inserted;
                            total_duplicates += duplicates;
                            all_errors.append(&mut errors);
                            
                            // 记录导入结果
                            let status = if errors.is_empty() { "success" } else { "partial" };
                            let error_message = if errors.is_empty() { 
                                None 
                            } else { 
                                Some(errors.join("; ")) 
                            };
                            
                            let _ = facade.create_txt_import_record(
                                &file_path_str,
                                total_lines,
                                numbers.len() as i64, // valid_numbers
                                error_message.as_deref(),
                                None, // batch_id
                            );
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
    let facade = ContactStorageFacade::new(&app_handle);
    facade.mark_numbers_as_not_imported_by_ids(&number_ids)
}

/// 永久删除号码记录（物理删除）
#[command]
pub async fn delete_contact_numbers(
    app_handle: AppHandle,
    number_ids: Vec<i64>,
) -> Result<i64, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.delete_numbers_by_ids(&number_ids)
}

/// 列出联系人号码（支持搜索、行业、状态筛选）
#[command]
pub async fn list_contact_numbers(
    app_handle: AppHandle,
    limit: i64,
    offset: i64,
    search: Option<String>,
    industry: Option<String>,
    status: Option<String>,
) -> Result<models::ContactNumberList, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.list_numbers_with_filters(limit, offset, search, industry, status)
}

/// 获取满足筛选条件的所有号码ID（不分页）
#[command]
pub async fn list_all_contact_number_ids(
    app_handle: AppHandle,
    search: Option<String>,
    industry: Option<String>,
    status: Option<String>,
) -> Result<Vec<i64>, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.list_all_contact_number_ids(search, industry, status)
}

/// 获取联系人号码
#[command]
pub async fn fetch_contact_numbers(
    app_handle: AppHandle,
    count: i64,
) -> Result<Vec<models::ContactNumberDto>, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.fetch_numbers(count)
}

/// 获取未分类的联系人号码
#[command]
pub async fn fetch_unclassified_contact_numbers(
    app_handle: AppHandle,
    count: i64,
    only_unconsumed: bool,
) -> Result<Vec<models::ContactNumberDto>, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.fetch_unclassified_numbers(count, "")
}

/// 按ID区间获取联系人号码
#[command]
pub async fn fetch_contact_numbers_by_id_range(
    app_handle: AppHandle,
    start_id: i64,
    end_id: i64,
) -> Result<Vec<models::ContactNumberDto>, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.fetch_numbers_by_id_range(start_id, end_id)
}

/// 按ID区间获取未消费的联系人号码
#[command]
pub async fn fetch_contact_numbers_by_id_range_unconsumed(
    app_handle: AppHandle,
    start_id: i64,
    end_id: i64,
) -> Result<Vec<models::ContactNumberDto>, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.fetch_numbers_by_id_range_unconsumed(start_id, end_id)
}

/// 标记ID区间内的号码为已使用
#[command]
pub async fn mark_contact_numbers_used_by_id_range(
    app_handle: AppHandle,
    start_id: i64,
    end_id: i64,
    batch_id: String,
) -> Result<i64, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.mark_numbers_used_by_id_range(start_id, end_id, &batch_id)
}

/// 标记指定ID的号码为未导入状态
#[command]
pub async fn mark_contact_numbers_as_not_imported_by_ids(
    app_handle: AppHandle,
    number_ids: Vec<i64>,
) -> Result<i64, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.mark_numbers_as_not_imported_by_ids(&number_ids)
}

/// 获取联系人号码统计信息
#[command]
pub async fn get_contact_number_stats_cmd(
    app_handle: AppHandle,
) -> Result<models::ContactNumberStatsDto, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    let stats = facade.get_contact_number_stats()?;

    // 暂时使用空的行业统计，直到我们实现行业统计功能
    let per_industry = Vec::new();

    // 映射 ContactNumberStats 到 ContactNumberStatsDto
    Ok(models::ContactNumberStatsDto {
        total: stats.get("total").and_then(|v| v.as_i64()).unwrap_or(0),
        available: stats.get("available").and_then(|v| v.as_i64()).unwrap_or(0),
        assigned: stats.get("used").and_then(|v| v.as_i64()).unwrap_or(0),  // 暂时使用 used 作为 assigned
        imported: stats.get("imported").and_then(|v| v.as_i64()).unwrap_or(0),
        unclassified: stats.get("available").and_then(|v| v.as_i64()).unwrap_or(0), // 暂时使用 available 作为 unclassified
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
    let facade = ContactStorageFacade::new(&app_handle);
    facade.set_industry_by_id_range(start_id, end_id, &industry)
}

/// 列出未关联到任何批次的号码
#[command]
pub async fn list_contact_numbers_without_batch(
    app_handle: AppHandle,
    limit: i64,
    offset: i64,
) -> Result<models::ContactNumberList, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.list_numbers_without_batch(limit, offset)
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
    let facade = ContactStorageFacade::new(&app_handle);
    facade.list_numbers_without_batch_filtered(limit, offset, industry, status)
}

/// 获取所有行业分类
#[command]
pub async fn get_distinct_industries_cmd(
    app_handle: AppHandle,
) -> Result<Vec<String>, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.get_distinct_industries()
}

/// 为设备分配联系人号码
#[command]
pub async fn allocate_contact_numbers_to_device(
    app_handle: AppHandle,
    device_id: String,
    count: i64,
    industry: Option<String>,
) -> Result<models::AllocationResultDto, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    let result = facade.allocate_numbers_to_device(&device_id, count, industry)?;

    Ok(result)
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
    let facade = ContactStorageFacade::new(&app_handle);
    facade.list_numbers_by_batch(&batch_id, limit, offset)
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
    let facade = ContactStorageFacade::new(&app_handle);
    facade.list_numbers_by_batch_filtered(&batch_id, limit, offset, only_used.unwrap_or(false))
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
    let facade = ContactStorageFacade::new(&app_handle);
    facade.list_numbers_filtered(limit, offset, status.map(|s| s == "used"), industry, search)
}

/// 为VCF批次列出联系人号码
#[command]
pub async fn list_contact_numbers_for_vcf_batch(
    app_handle: AppHandle,
    batch_id: String,
    limit: i64,
    offset: i64,
) -> Result<models::ContactNumberList, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.list_numbers_for_vcf_batch(&batch_id, limit, offset)
}

/// 为VCF批次中的号码标记行业分类
#[command]
pub async fn tag_contact_numbers_industry_by_vcf_batch(
    app_handle: AppHandle,
    batch_id: String,
    industry: String,
) -> Result<i64, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.tag_numbers_industry_by_vcf_batch(&batch_id, &industry)
}

// ========== 文件相关命令 ==========

/// 获取所有已导入的文件列表
#[command]
pub async fn get_imported_file_list(
    app_handle: AppHandle,
) -> Result<Vec<models::FileInfoDto>, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.get_imported_file_list()
}

/// 根据文件路径列表获取号码
#[command]
pub async fn get_numbers_by_files(
    app_handle: AppHandle,
    file_paths: Vec<String>,
    only_available: Option<bool>,
) -> Result<Vec<models::ContactNumberDto>, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.get_numbers_by_files(&file_paths, only_available.unwrap_or(true))
}

/// 检查文件是否已导入
#[command]
pub async fn check_file_imported(
    app_handle: AppHandle,
    file_path: String,
) -> Result<bool, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.check_file_imported(&file_path)
}

/// 获取指定文件的统计信息
#[command]
pub async fn get_file_stats(
    app_handle: AppHandle,
    file_path: String,
) -> Result<Option<models::FileInfoDto>, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.get_file_stats(&file_path)
}