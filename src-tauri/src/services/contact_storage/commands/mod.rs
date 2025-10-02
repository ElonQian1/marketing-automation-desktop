/// 联系人存储模块的命令层
/// 
/// 本模块组织所有 Tauri 命令处理函数，按功能分组到子模块中

// 子模块声明
pub mod txt_import_records;

// 重新导出 TXT 导入记录相关命令
pub use txt_import_records::{list_txt_import_records_cmd, delete_txt_import_record_cmd};

// 临时兼容层：重新导出旧仓储中的所有命令函数
// TODO: 这些函数应该逐步模块化重构到对应的子模块中

use crate::services::contact_storage::repo;
use tauri::{command, AppHandle};

/// 从文件导入联系人号码
#[command]
pub async fn import_contact_numbers_from_file(
    _app_handle: AppHandle,
    _file_path: String,
) -> Result<super::models::ImportNumbersResult, String> {
    // TODO: 实现文件导入功能
    Ok(super::models::ImportNumbersResult {
        success: false,
        total_files: 0,
        total_numbers: 0,
        inserted: 0,
        duplicates: 0,
        errors: vec!["功能暂未实现".to_string()],
    })
}

/// 从文件夹导入联系人号码
#[command]
pub async fn import_contact_numbers_from_folder(
    _app_handle: AppHandle,
    _folder_path: String,
) -> Result<super::models::ImportNumbersResult, String> {
    // TODO: 实现文件夹导入功能
    Ok(super::models::ImportNumbersResult {
        success: false,
        total_files: 0,
        total_numbers: 0,
        inserted: 0,
        duplicates: 0,
        errors: vec!["功能暂未实现".to_string()],
    })
}

/// 列出联系人号码
#[command]
pub async fn list_contact_numbers(
    app_handle: AppHandle,
    limit: i64,
    offset: i64,
    search: Option<String>,
) -> Result<super::models::ContactNumberList, String> {
    let conn = super::repositories::common::database::get_connection(&app_handle)
        .map_err(|e| format!("数据库连接失败: {}", e))?;
    
    repo::list_numbers(&conn, limit, offset, search)
        .map_err(|e| format!("查询失败: {}", e))
}

/// 获取联系人号码
#[command]
pub async fn fetch_contact_numbers(
    app_handle: AppHandle,
    count: i64,
) -> Result<Vec<super::models::ContactNumberDto>, String> {
    let conn = super::repositories::common::database::get_connection(&app_handle)
        .map_err(|e| format!("数据库连接失败: {}", e))?;
    
    repo::fetch_numbers(&conn, count)
        .map_err(|e| format!("查询失败: {}", e))
}

/// 获取未分类的联系人号码
#[command]
pub async fn fetch_unclassified_contact_numbers(
    app_handle: AppHandle,
    count: i64,
    only_unconsumed: bool,
) -> Result<Vec<super::models::ContactNumberDto>, String> {
    let conn = super::repositories::common::database::get_connection(&app_handle)
        .map_err(|e| format!("数据库连接失败: {}", e))?;
    
    repo::fetch_unclassified_numbers(&conn, count, only_unconsumed)
        .map_err(|e| format!("查询失败: {}", e))
}

/// 按ID区间获取联系人号码
#[command]
pub async fn fetch_contact_numbers_by_id_range(
    app_handle: AppHandle,
    start_id: i64,
    end_id: i64,
) -> Result<Vec<super::models::ContactNumberDto>, String> {
    let conn = super::repositories::common::database::get_connection(&app_handle)
        .map_err(|e| format!("数据库连接失败: {}", e))?;
    
    repo::fetch_numbers_by_id_range(&conn, start_id, end_id)
        .map_err(|e| format!("查询失败: {}", e))
}

/// 按ID区间获取未消费的联系人号码
#[command]
pub async fn fetch_contact_numbers_by_id_range_unconsumed(
    app_handle: AppHandle,
    start_id: i64,
    end_id: i64,
) -> Result<Vec<super::models::ContactNumberDto>, String> {
    let conn = super::repositories::common::database::get_connection(&app_handle)
        .map_err(|e| format!("数据库连接失败: {}", e))?;
    
    repo::fetch_numbers_by_id_range_unconsumed(&conn, start_id, end_id)
        .map_err(|e| format!("查询失败: {}", e))
}

/// 标记号码为已使用
#[command]
pub async fn mark_contact_numbers_used_by_id_range(
    app_handle: AppHandle,
    start_id: i64,
    end_id: i64,
    batch_id: String,
) -> Result<i64, String> {
    let conn = super::repositories::common::database::get_connection(&app_handle)
        .map_err(|e| format!("数据库连接失败: {}", e))?;
    
    repo::mark_numbers_used_by_id_range(&conn, start_id, end_id, &batch_id)
        .map_err(|e| format!("操作失败: {}", e))
}

/// 标记号码为未导入
#[command]
pub async fn mark_contact_numbers_as_not_imported(
    app_handle: AppHandle,
    number_ids: Vec<i64>,
) -> Result<i64, String> {
    let conn = super::repositories::common::database::get_connection(&app_handle)
        .map_err(|e| format!("数据库连接失败: {}", e))?;
    
    repo::mark_numbers_as_not_imported_by_ids(&conn, &number_ids)
        .map_err(|e| format!("操作失败: {}", e))
}

/// 创建 VCF 批次记录
#[command]
pub async fn create_vcf_batch_record(
    app_handle: AppHandle,
    batch_id: String,
    vcf_file_path: String,
    source_start_id: Option<i64>,
    source_end_id: Option<i64>,
) -> Result<(), String> {
    let conn = super::repositories::common::database::get_connection(&app_handle)
        .map_err(|e| format!("数据库连接失败: {}", e))?;
    
    repo::create_vcf_batch(&conn, &batch_id, &vcf_file_path, source_start_id, source_end_id)
        .map_err(|e| format!("创建失败: {}", e))
}

/// 列出 VCF 批次记录
#[command]
pub async fn list_vcf_batch_records(
    app_handle: AppHandle,
    limit: i64,
    offset: i64,
) -> Result<super::models::VcfBatchList, String> {
    let conn = super::repositories::common::database::get_connection(&app_handle)
        .map_err(|e| format!("数据库连接失败: {}", e))?;
    
    repo::list_vcf_batches(&conn, limit, offset)
        .map_err(|e| format!("查询失败: {}", e))
}

/// 获取 VCF 批次记录
#[command]
pub async fn get_vcf_batch_record(
    app_handle: AppHandle,
    batch_id: String,
) -> Result<Option<super::models::VcfBatchDto>, String> {
    let conn = super::repositories::common::database::get_connection(&app_handle)
        .map_err(|e| format!("数据库连接失败: {}", e))?;
    
    repo::get_vcf_batch(&conn, &batch_id)
        .map_err(|e| format!("查询失败: {}", e))
}

/// 创建导入会话记录
#[command]
pub async fn create_import_session_record(
    app_handle: AppHandle,
    batch_id: String,
    device_id: String,
) -> Result<i64, String> {
    let conn = super::repositories::common::database::get_connection(&app_handle)
        .map_err(|e| format!("数据库连接失败: {}", e))?;
    
    repo::create_import_session(&conn, &batch_id, &device_id)
        .map_err(|e| format!("创建失败: {}", e))
}

/// 完成导入会话记录
#[command]
pub async fn finish_import_session_record(
    app_handle: AppHandle,
    session_id: i64,
    status: String,
    imported_count: i64,
    failed_count: i64,
    error_message: Option<String>,
) -> Result<(), String> {
    let conn = super::repositories::common::database::get_connection(&app_handle)
        .map_err(|e| format!("数据库连接失败: {}", e))?;
    
    repo::finish_import_session(&conn, session_id, &status, imported_count, failed_count, error_message.as_deref())
        .map_err(|e| format!("操作失败: {}", e))
}

/// 列出导入会话记录
#[command]
pub async fn list_import_session_records(
    app_handle: AppHandle,
    device_id: Option<String>,
    batch_id: Option<String>,
    industry: Option<String>,
    limit: i64,
    offset: i64,
) -> Result<super::models::ImportSessionList, String> {
    let conn = super::repositories::common::database::get_connection(&app_handle)
        .map_err(|e| format!("数据库连接失败: {}", e))?;
    
    repo::list_import_sessions(&conn, device_id.as_deref(), batch_id.as_deref(), industry.as_deref(), limit, offset)
        .map_err(|e| format!("查询失败: {}", e))
}

/// 按批次列出号码
#[command]
pub async fn list_numbers_by_vcf_batch(
    app_handle: AppHandle,
    batch_id: String,
    only_used: Option<bool>,
    limit: i64,
    offset: i64,
) -> Result<super::models::ContactNumberList, String> {
    let conn = super::repositories::common::database::get_connection(&app_handle)
        .map_err(|e| format!("数据库连接失败: {}", e))?;
    
    repo::list_numbers_by_batch(&conn, &batch_id, only_used, limit, offset)
        .map_err(|e| format!("查询失败: {}", e))
}

/// 按批次列出号码（支持过滤）
#[command]
pub async fn list_numbers_by_vcf_batch_filtered(
    app_handle: AppHandle,
    batch_id: String,
    industry: Option<String>,
    status: Option<String>,
    limit: i64,
    offset: i64,
) -> Result<super::models::ContactNumberList, String> {
    let conn = super::repositories::common::database::get_connection(&app_handle)
        .map_err(|e| format!("数据库连接失败: {}", e))?;
    
    repo::list_numbers_by_batch_filtered(&conn, &batch_id, industry, status, limit, offset)
        .map_err(|e| format!("查询失败: {}", e))
}

/// 列出未分配批次的号码
#[command]
pub async fn list_numbers_without_vcf_batch(
    app_handle: AppHandle,
    limit: i64,
    offset: i64,
) -> Result<super::models::ContactNumberList, String> {
    let conn = super::repositories::common::database::get_connection(&app_handle)
        .map_err(|e| format!("数据库连接失败: {}", e))?;
    
    repo::list_numbers_without_batch(&conn, limit, offset)
        .map_err(|e| format!("查询失败: {}", e))
}

/// 获取联系人号码统计
#[command]
pub async fn get_contact_number_stats_cmd(
    app_handle: AppHandle,
) -> Result<super::models::ContactNumberStatsDto, String> {
    let conn = super::repositories::common::database::get_connection(&app_handle)
        .map_err(|e| format!("数据库连接失败: {}", e))?;
    
    let stats = repo::get_contact_number_stats(&conn)
        .map_err(|e| format!("查询失败: {}", e))?;
        
    Ok(super::models::ContactNumberStatsDto {
        total: stats.total,
        unclassified: stats.unclassified,
        not_imported: stats.not_imported,
        per_industry: stats.per_industry.into_iter()
            .map(|(industry, count)| super::models::IndustryCountDto { industry, count })
            .collect(),
    })
}

/// 获取去重的行业列表
#[command]
pub async fn get_distinct_industries_cmd(
    app_handle: AppHandle,
) -> Result<Vec<String>, String> {
    let conn = super::repositories::common::database::get_connection(&app_handle)
        .map_err(|e| format!("数据库连接失败: {}", e))?;
    
    repo::get_distinct_industries(&conn)
        .map_err(|e| format!("查询失败: {}", e))
}

/// 设置号码行业标签
#[command]
pub async fn set_contact_numbers_industry_by_id_range(
    app_handle: AppHandle,
    start_id: i64,
    end_id: i64,
    industry: String,
) -> Result<i64, String> {
    let conn = super::repositories::common::database::get_connection(&app_handle)
        .map_err(|e| format!("数据库连接失败: {}", e))?;
    
    repo::set_numbers_industry_by_id_range(&conn, start_id, end_id, &industry)
        .map_err(|e| format!("操作失败: {}", e))
}

/// 为设备分配号码
#[command]
pub async fn allocate_numbers_to_device_cmd(
    app_handle: AppHandle,
    device_id: String,
    count: i64,
    industry: Option<String>,
) -> Result<super::models::AllocationResultDto, String> {
    let conn = super::repositories::common::database::get_connection(&app_handle)
        .map_err(|e| format!("数据库连接失败: {}", e))?;
    
    let (batch_id, vcf_file_path, number_ids, session_id) = 
        repo::allocate_numbers_to_device(&conn, &device_id, count, industry.as_deref())
        .map_err(|e| format!("分配失败: {}", e))?;
        
    let number_count = number_ids.len() as i64;
        
    Ok(super::models::AllocationResultDto {
        batch_id,
        vcf_file_path,
        number_ids,
        session_id,
        device_id: device_id.clone(),
        number_count,
    })
}

/// 创建 VCF 批次并关联号码
#[command]
pub async fn create_vcf_batch_with_numbers_cmd(
    app_handle: AppHandle,
    batch_id: String,
    vcf_file_path: String,
    source_start_id: Option<i64>,
    source_end_id: Option<i64>,
    number_ids: Vec<i64>,
) -> Result<usize, String> {
    let conn = super::repositories::common::database::get_connection(&app_handle)
        .map_err(|e| format!("数据库连接失败: {}", e))?;
    
    repo::create_vcf_batch_with_numbers(&conn, &batch_id, &vcf_file_path, source_start_id, source_end_id, &number_ids)
        .map_err(|e| format!("创建失败: {}", e))
}

/// 列出批次包含的号码
#[command]
pub async fn list_numbers_for_vcf_batch_cmd(
    app_handle: AppHandle,
    batch_id: String,
    limit: i64,
    offset: i64,
) -> Result<super::models::ContactNumberList, String> {
    let conn = super::repositories::common::database::get_connection(&app_handle)
        .map_err(|e| format!("数据库连接失败: {}", e))?;
    
    repo::list_numbers_for_vcf_batch(&conn, &batch_id, limit, offset)
        .map_err(|e| format!("查询失败: {}", e))
}

/// 为批次包含的号码设置行业标签
#[command]
pub async fn tag_numbers_industry_by_vcf_batch_cmd(
    app_handle: AppHandle,
    batch_id: String,
    industry: String,
) -> Result<i64, String> {
    let conn = super::repositories::common::database::get_connection(&app_handle)
        .map_err(|e| format!("数据库连接失败: {}", e))?;
    
    repo::tag_numbers_industry_by_vcf_batch(&conn, &batch_id, &industry)
        .map_err(|e| format!("操作失败: {}", e))
}

/// 更新导入会话行业标签
#[command]
pub async fn update_import_session_industry_cmd(
    app_handle: AppHandle,
    session_id: i64,
    industry: Option<String>,
) -> Result<(), String> {
    let conn = super::repositories::common::database::get_connection(&app_handle)
        .map_err(|e| format!("数据库连接失败: {}", e))?;
    
    repo::update_import_session_industry(&conn, session_id, industry.as_deref())
        .map_err(|e| format!("操作失败: {}", e))
}

/// 将成功会话回滚为失败
#[command]
pub async fn revert_import_session_to_failed_cmd(
    app_handle: AppHandle,
    session_id: i64,
    reason: Option<String>,
) -> Result<i64, String> {
    let conn = super::repositories::common::database::get_connection(&app_handle)
        .map_err(|e| format!("数据库连接失败: {}", e))?;
    
    repo::revert_import_session_to_failed(&conn, session_id, reason.as_deref())
        .map_err(|e| format!("操作失败: {}", e))
}

/// 删除导入会话
#[command]
pub async fn delete_import_session_cmd(
    app_handle: AppHandle,
    session_id: i64,
    archive_numbers: bool,
) -> Result<super::models::DeleteImportSessionResultDto, String> {
    let conn = super::repositories::common::database::get_connection(&app_handle)
        .map_err(|e| format!("数据库连接失败: {}", e))?;
    
    let result = repo::delete_import_session(&conn, session_id, archive_numbers)
        .map_err(|e| format!("删除失败: {}", e))?;
        
    // 转换为正确的 DTO 类型
    Ok(super::models::DeleteImportSessionResultDto {
        session_id: result.session_id,
        archived_number_count: result.archived_number_count,
        removed_event_count: result.removed_event_count,
        removed_batch_link_count: result.removed_batch_link_count,
        removed_batch_record: result.removed_batch_record,
    })
}

/// 列出导入会话事件
#[command]
pub async fn list_import_session_events_cmd(
    app_handle: AppHandle,
    session_id: i64,
    limit: i64,
    offset: i64,
) -> Result<super::models::ImportSessionEventList, String> {
    let conn = super::repositories::common::database::get_connection(&app_handle)
        .map_err(|e| format!("数据库连接失败: {}", e))?;
    
    repo::list_import_session_events(&conn, session_id, limit, offset)
        .map_err(|e| format!("查询失败: {}", e))
}

/// 列出所有联系人号码ID
#[command]
pub async fn list_all_contact_number_ids(
    app_handle: AppHandle,
) -> Result<Vec<i64>, String> {
    let conn = super::repositories::common::database::get_connection(&app_handle)
        .map_err(|e| format!("数据库连接失败: {}", e))?;
    
    // 简单实现：获取所有号码的ID
    let mut stmt = conn.prepare("SELECT id FROM contact_numbers ORDER BY id ASC")
        .map_err(|e| format!("查询失败: {}", e))?;
    let rows = stmt.query_map([], |row| {
        Ok(row.get::<_, i64>(0)?)
    }).map_err(|e| format!("查询失败: {}", e))?;
    
    let mut ids = Vec::new();
    for id_result in rows {
        ids.push(id_result.map_err(|e| format!("读取数据失败: {}", e))?);
    }
    
    Ok(ids)
}