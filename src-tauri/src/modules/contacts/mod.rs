use tauri::{plugin::{Builder, TauriPlugin}, Runtime, AppHandle, Manager};
use crate::services::contact_storage::repository_facade::ContactStorageFacade;
use crate::services::contact_storage::models::{self, ContactStatus, ImportRecordStatus};
use crate::services::contact_storage::parser::extract_numbers_from_text;
use std::path::Path;
use std::fs;
use std::str::FromStr;

// ==================== Contact Numbers ====================

#[tauri::command]
async fn import_file(
    app_handle: tauri::AppHandle,
    file_path: String,
) -> Result<models::ImportNumbersResult, String> {
    if !Path::new(&file_path).exists() {
        return Err(format!("文件不存在: {}", file_path));
    }

    let content = fs::read_to_string(&file_path).map_err(|e| format!("读取文件失败: {}", e))?;
    let total_lines = content.lines().count() as i64;
    let parse_result = extract_numbers_from_text(&content);
    let numbers = parse_result.contacts;

    let file_name = Path::new(&file_path)
        .file_name()
        .and_then(|f| f.to_str())
        .unwrap_or("unknown.txt")
        .to_string();

    let facade = ContactStorageFacade::new(&app_handle);
    let (inserted, duplicates, errors) = facade.insert_numbers(&numbers, &file_path)?;
    
    let status_str = if errors.is_empty() { 
        if numbers.is_empty() { "empty" } else if inserted == 0 && duplicates > 0 { "all_duplicates" } else { "success" }
    } else { 
        "partial" 
    };
    
    let status_enum = ImportRecordStatus::from_str(status_str).unwrap_or(ImportRecordStatus::Pending);
    let error_message = if errors.is_empty() { None } else { Some(errors.join("; ")) };
    
    let _ = facade.create_txt_import_record(
        &file_path, total_lines, numbers.len() as i64, inserted, duplicates, status_enum, error_message.as_deref(),
    );
    
    Ok(models::ImportNumbersResult {
        success: true,
        total_files: 1,
        total_numbers: numbers.len() as i64,
        inserted,
        duplicates,
        errors,
    })
}

#[tauri::command]
async fn import_folder(
    app_handle: tauri::AppHandle,
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
                    
                    match fs::read_to_string(&path) {
                        Ok(content) => {
                            let total_lines = content.lines().count() as i64;
                            let parse_result = extract_numbers_from_text(&content);
                            let numbers = parse_result.contacts;
                            let (inserted, duplicates, mut errors) = facade.insert_numbers(&numbers, &file_path_str)?;
                            
                            total_numbers += numbers.len() as i64;
                            total_inserted += inserted;
                            total_duplicates += duplicates;
                            all_errors.append(&mut errors);
                            
                            let status_str = if errors.is_empty() { 
                                if numbers.is_empty() { "empty" } else if inserted == 0 && duplicates > 0 { "all_duplicates" } else { "success" }
                            } else { 
                                "partial" 
                            };
                            
                            let status_enum = ImportRecordStatus::from_str(status_str).unwrap_or(ImportRecordStatus::Pending);
                            let error_message = if errors.is_empty() { None } else { Some(errors.join("; ")) };
                            
                            let _ = facade.create_txt_import_record(
                                &file_path_str, total_lines, numbers.len() as i64, inserted, duplicates, status_enum, error_message.as_deref(),
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

#[tauri::command]
async fn list(
    app_handle: tauri::AppHandle,
    limit: i64,
    offset: i64,
    search: Option<String>,
    industry: Option<String>,
    status: Option<String>,
) -> Result<models::ContactNumberList, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    let status_enum = match status {
        Some(s) => Some(ContactStatus::from_str(&s)?),
        None => None,
    };
    facade.list_numbers_filtered(limit, offset, status_enum, industry, search)
}

#[tauri::command]
async fn list_without_batch(
    app_handle: tauri::AppHandle,
    limit: i64,
    offset: i64,
    industry: Option<String>,
    status: Option<String>,
) -> Result<models::ContactNumberList, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    let status_enum = if let Some(s) = status {
        if s.is_empty() { None } else { Some(ContactStatus::from_str(&s).map_err(|e| format!("Invalid status: {}", e))?) }
    } else {
        None
    };
    facade.list_numbers_without_batch_filtered(limit, offset, None, industry, status_enum)
}

#[tauri::command]
async fn list_by_batch(
    app_handle: tauri::AppHandle,
    batch_id: String,
    only_used: Option<bool>,
    limit: i64,
    offset: i64,
) -> Result<models::ContactNumberList, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.list_numbers_by_batch_filtered(&batch_id, limit, offset, only_used.unwrap_or(false))
}

#[tauri::command]
async fn list_for_vcf_batch(
    app_handle: tauri::AppHandle,
    batch_id: String,
    limit: i64,
    offset: i64,
) -> Result<models::ContactNumberList, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.list_numbers_for_vcf_batch(&batch_id, limit, offset)
}

#[tauri::command]
async fn get_stats(
    app_handle: tauri::AppHandle,
) -> Result<models::ContactNumberStatsDto, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    let stats = facade.get_contact_number_stats()?;
    let per_industry = Vec::new(); // Placeholder
    Ok(models::ContactNumberStatsDto {
        total: stats.get("total").and_then(|v| v.as_i64()).unwrap_or(0),
        available: stats.get("available").and_then(|v| v.as_i64()).unwrap_or(0),
        assigned: stats.get("used").and_then(|v| v.as_i64()).unwrap_or(0),
        imported: stats.get("imported").and_then(|v| v.as_i64()).unwrap_or(0),
        unclassified: stats.get("available").and_then(|v| v.as_i64()).unwrap_or(0),
        per_industry,
    })
}

#[tauri::command]
async fn get_distinct_industries(
    app_handle: tauri::AppHandle,
) -> Result<Vec<String>, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.get_distinct_industries()
}

#[tauri::command]
async fn set_industry_by_id_range(
    app_handle: tauri::AppHandle,
    start_id: i64,
    end_id: i64,
    industry: String,
) -> Result<i64, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.set_industry_by_id_range(start_id, end_id, &industry)
}

#[tauri::command]
async fn mark_as_not_imported(
    app_handle: tauri::AppHandle,
    number_ids: Vec<i64>,
) -> Result<i64, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.mark_numbers_as_not_imported_by_ids(&number_ids)
}

#[tauri::command]
async fn delete_numbers(
    app_handle: tauri::AppHandle,
    number_ids: Vec<i64>,
) -> Result<i64, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.delete_numbers_by_ids(&number_ids)
}

// ==================== Import Records ====================

#[tauri::command]
async fn list_import_records(
    app_handle: tauri::AppHandle,
    limit: Option<i64>, 
    offset: Option<i64>
) -> Result<models::TxtImportRecordList, String> {
    let limit = limit.unwrap_or(50);
    let offset = offset.unwrap_or(0);
    let facade = ContactStorageFacade::new(&app_handle);
    facade.list_txt_import_records(limit, offset, None)
}

#[tauri::command]
async fn delete_import_record(
    app_handle: tauri::AppHandle,
    record_id: i64, 
    archive_numbers: Option<bool>
) -> Result<models::DeleteTxtImportRecordResult, String> {
    let archive = archive_numbers.unwrap_or(false);
    let facade = ContactStorageFacade::new(&app_handle);
    let affected_rows = facade.delete_txt_import_record(record_id, archive)?;
    Ok(models::DeleteTxtImportRecordResult {
        record_id,
        archived_number_count: affected_rows,
        success: affected_rows > 0,
    })
}

// ==================== Files ====================

#[tauri::command]
async fn get_imported_files(
    app_handle: tauri::AppHandle,
) -> Result<Vec<models::FileInfoDto>, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.get_imported_file_list()
}

#[tauri::command]
async fn get_numbers_by_files(
    app_handle: tauri::AppHandle,
    file_paths: Vec<String>,
    only_available: Option<bool>,
) -> Result<Vec<models::ContactNumberDto>, String> {
    let only_available_value = only_available.unwrap_or(true);
    let facade = ContactStorageFacade::new(&app_handle);
    facade.get_numbers_by_files(&file_paths, only_available_value)
}

#[tauri::command]
async fn check_file_imported(
    app_handle: tauri::AppHandle,
    file_path: String,
) -> Result<bool, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.check_file_imported(&file_path)
}

#[tauri::command]
async fn get_file_stats(
    app_handle: tauri::AppHandle,
    file_path: String,
) -> Result<Option<models::FileInfoDto>, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.get_file_stats(&file_path)
}

// ==================== VCF Batches ====================

#[tauri::command]
async fn list_batches(
    app_handle: tauri::AppHandle,
    limit: i64,
    offset: i64,
) -> Result<models::VcfBatchList, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.list_vcf_batches(limit, offset)
}

#[tauri::command]
async fn create_batch_with_numbers(
    app_handle: tauri::AppHandle,
    batch_name: String,
    source_type: String,
    generation_method: String,
    _description: Option<String>,
    number_ids: Vec<i64>,
) -> Result<models::VcfBatchCreationResult, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.create_vcf_batch_with_numbers(&batch_name, number_ids.len() as i64, &source_type, &generation_method)
}

#[tauri::command]
async fn tag_numbers_industry_by_vcf_batch(
    app_handle: tauri::AppHandle,
    batch_id: String,
    industry: String,
) -> Result<i64, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.tag_numbers_industry_by_vcf_batch(&batch_id, &industry)
}

pub fn init() -> TauriPlugin<tauri::Wry> {
    Builder::new("contacts")
        .invoke_handler(tauri::generate_handler![
            import_file,
            import_folder,
            list,
            list_without_batch,
            list_by_batch,
            list_for_vcf_batch,
            get_stats,
            get_distinct_industries,
            set_industry_by_id_range,
            mark_as_not_imported,
            delete_numbers,
            list_import_records,
            delete_import_record,
            get_imported_files,
            get_numbers_by_files,
            check_file_imported,
            get_file_stats,
            list_batches,
            create_batch_with_numbers,
            tag_numbers_industry_by_vcf_batch
        ])
        .build()
}
