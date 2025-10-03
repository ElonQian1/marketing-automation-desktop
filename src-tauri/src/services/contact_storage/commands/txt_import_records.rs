use tauri::AppHandle;

use crate::services::contact_storage::models::{
    TxtImportRecordList, DeleteTxtImportRecordResult
};
use crate::services::contact_storage::repositories::txt_import_records_repo::{
    create_txt_import_record, list_txt_import_records, delete_txt_import_record
};
use crate::services::contact_storage::repositories::common::database::get_connection;

/// TXT文件导入记录命令
/// 负责处理前端请求，调用仓储层进行具体操作

/// 获取TXT文件导入记录列表
#[tauri::command]
pub async fn list_txt_import_records_cmd(
    app_handle: AppHandle,
    limit: Option<i64>, 
    offset: Option<i64>
) -> Result<TxtImportRecordList, String> {
    let limit = limit.unwrap_or(50);
    let offset = offset.unwrap_or(0);
    
    tracing::debug!("获取TXT导入记录列表: limit={}, offset={}", limit, offset);
    
    let conn = get_connection(&app_handle).map_err(|e| {
        tracing::error!("数据库连接失败: {:?}", e);
        format!("数据库连接失败: {}", e)
    })?;
    
    list_txt_import_records(&conn, limit, offset, None)
        .map_err(|e| {
            tracing::error!("获取TXT导入记录列表失败: {:?}", e);
            format!("获取TXT导入记录列表失败: {}", e)
        })
}

/// 删除TXT文件导入记录（可选择是否归档相关号码）
#[tauri::command]
pub async fn delete_txt_import_record_cmd(
    app_handle: AppHandle,
    record_id: i64, 
    archive_numbers: Option<bool>
) -> Result<DeleteTxtImportRecordResult, String> {
    let archive = archive_numbers.unwrap_or(false);
    
    tracing::info!("删除TXT导入记录: record_id={}, archive_numbers={}", record_id, archive);
    
    let conn = get_connection(&app_handle).map_err(|e| {
        tracing::error!("数据库连接失败: {:?}", e);
        format!("数据库连接失败: {}", e)
    })?;
    
    let affected_rows = delete_txt_import_record(&conn, record_id, archive)
        .map_err(|e| {
            tracing::error!("删除TXT导入记录失败: {:?}", e);
            format!("删除TXT导入记录失败: {}", e)
        })?;
        
    Ok(DeleteTxtImportRecordResult {
        record_id,
        archived_number_count: affected_rows,
        success: affected_rows > 0,
    })
}

/// 内部辅助函数：创建TXT导入记录
/// 这个函数主要在import_numbers_from_txt_files_cmd等函数中内部使用
pub async fn create_txt_import_record_internal(
    app_handle: &AppHandle,
    file_path: &str,
    file_name: &str,
    total_numbers: i64,
    imported_numbers: i64,
    duplicate_numbers: i64,
    status: &str,
    error_message: Option<&str>,
) -> Result<i64, String> {
    tracing::debug!(
        "创建TXT导入记录: file={}, total={}, imported={}, duplicates={}",
        file_name, total_numbers, imported_numbers, duplicate_numbers
    );
    
    let conn = get_connection(app_handle).map_err(|e| {
        tracing::error!("数据库连接失败: {:?}", e);
        format!("数据库连接失败: {}", e)
    })?;
    
    create_txt_import_record(
        &conn,
        file_path,
        file_name,
        total_numbers,
        imported_numbers,
        duplicate_numbers,
        status,
        error_message,
    )
    .map_err(|e| {
        tracing::error!("创建TXT导入记录失败: {:?}", e);
        format!("创建TXT导入记录失败: {}", e)
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_txt_import_record_commands() {
        // 单元测试可以在这里添加
        // 目前保持简单
    }
}