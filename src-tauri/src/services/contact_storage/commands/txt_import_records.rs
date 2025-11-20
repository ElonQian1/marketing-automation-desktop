use tauri::AppHandle;
use std::str::FromStr;

use crate::services::contact_storage::models::{
    TxtImportRecordList, DeleteTxtImportRecordResult, ImportRecordStatus
};
use crate::services::contact_storage::repository_facade::ContactStorageFacade;

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
    
    let facade = ContactStorageFacade::new(&app_handle);
    facade.list_txt_import_records(limit, offset, None)
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
    
    let facade = ContactStorageFacade::new(&app_handle);
    let affected_rows = facade.delete_txt_import_record(record_id, archive)?;
        
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
    total_lines: i64,
    valid_numbers: i64,
    imported_numbers: i64,
    duplicate_numbers: i64,
    status: &str,
    error_message: Option<&str>,
) -> Result<i64, String> {
    tracing::debug!(
        "创建TXT导入记录: file={}, total={}, imported={}, duplicates={}",
        file_name, total_lines, imported_numbers, duplicate_numbers
    );
    
    let status_enum = ImportRecordStatus::from_str(status)
        .map_err(|e| format!("Invalid status: {}", e))?;

    let facade = ContactStorageFacade::new(app_handle);
    let result = facade.create_txt_import_record(
        file_path,
        total_lines,
        valid_numbers,
        imported_numbers,
        duplicate_numbers,
        status_enum,
        error_message,
    )?;
    Ok(result.id)
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