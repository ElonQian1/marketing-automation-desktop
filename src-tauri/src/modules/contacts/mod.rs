use tauri::{plugin::{Builder, TauriPlugin}, Runtime, AppHandle, Manager};
use crate::services::contact_storage::repository_facade::ContactStorageFacade;
use crate::services::contact_storage::models::{self, ContactStatus, ImportRecordStatus};
use crate::services::contact_storage::parser::extract_numbers_from_text;
use std::path::Path;
use std::fs;
use std::str::FromStr;
use tokio::process::Command as AsyncCommand;
use std::process::Command;
use serde::{Deserialize, Serialize};
use crate::utils::adb_utils::execute_adb_command;
use crate::services::vcf::{VcfOpenResult, MultiBrandVcfImporter, MultiBrandImportResult};
use tracing::{info, warn};

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

#[tauri::command]
pub async fn fetch_contact_numbers(
    app_handle: tauri::AppHandle,
    count: i64,
) -> Result<Vec<models::ContactNumberDto>, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.fetch_numbers(count)
}

#[tauri::command]
pub async fn fetch_unclassified_contact_numbers(
    app_handle: tauri::AppHandle,
    count: i64,
    _only_unconsumed: bool,
) -> Result<Vec<models::ContactNumberDto>, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.fetch_unclassified_numbers(count, "")
}

#[tauri::command]
pub async fn fetch_contact_numbers_by_id_range(
    app_handle: tauri::AppHandle,
    start_id: i64,
    end_id: i64,
) -> Result<Vec<models::ContactNumberDto>, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.fetch_numbers_by_id_range(start_id, end_id)
}

#[tauri::command]
pub async fn fetch_contact_numbers_by_id_range_unconsumed(
    app_handle: tauri::AppHandle,
    start_id: i64,
    end_id: i64,
) -> Result<Vec<models::ContactNumberDto>, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.fetch_numbers_by_id_range_unconsumed(start_id, end_id)
}

#[tauri::command]
pub async fn mark_contact_numbers_used_by_id_range(
    app_handle: tauri::AppHandle,
    start_id: i64,
    end_id: i64,
    batch_id: String,
) -> Result<i64, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.mark_numbers_used_by_id_range(start_id, end_id, &batch_id)
}

// ==================== Device Contact Metrics ====================

/// 执行 adb content query 并统计返回的行数（以 "Row " 开头的行）
fn count_rows_from_output(output: &str) -> i32 {
    output
        .lines()
        .filter(|line| line.trim_start().starts_with("Row "))
        .count() as i32
}

/// 尝试通过不同 URI 获取联系人数量
async fn try_query_contact_count(device_id: &str) -> Result<i32, String> {
    // 方案1：ContactsContract.Contacts 可见联系人
    let args1 = [
        "-s",
        device_id,
        "shell",
        "content",
        "query",
        "--uri",
        "content://com.android.contacts/contacts",
        "--projection",
        "_id",
    ];

    match execute_adb_command(&args1) {
        Ok(output) => {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout).to_string();
                let count = count_rows_from_output(&stdout);
                // 某些设备可能返回空，但命令成功；继续尝试 raw_contacts
                if count > 0 {
                    return Ok(count);
                }
            }
        }
        Err(e) => {
            warn!("Contacts query failed: {}", e);
        }
    }

    // 方案2：raw_contacts（过滤 deleted=0）
    let args2 = [
        "-s",
        device_id,
        "shell",
        "content",
        "query",
        "--uri",
        "content://com.android.contacts/raw_contacts",
        "--projection",
        "_id,deleted",
        "--where",
        "deleted=0",
    ];

    match execute_adb_command(&args2) {
        Ok(output) => {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout).to_string();
                let mut count = count_rows_from_output(&stdout);
                // 某些 ROM 仍会把 header 行或无关行算进去；这里保底非负
                if count < 0 { count = 0; }
                return Ok(count);
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr);
                return Err(format!("content query 失败: {}", stderr));
            }
        }
        Err(e) => Err(format!("执行ADB命令失败: {}", e)),
    }
}

/// 获取设备内联系人数量（兼容 `{ device_id }` 与 `{ deviceId }` 两种写法）
#[tauri::command]
#[allow(non_snake_case)]
pub async fn get_device_contact_count(
    device_id: Option<String>,
    deviceId: Option<String>,
) -> Result<i32, String> {
    let id = match (device_id.clone(), deviceId.clone()) {
        (Some(id), _) => id,
        (None, Some(id)) => id,
        (None, None) => {
            warn!("❌ get_device_contact_count 缺少参数: device_id/deviceId 皆为 None");
            return Err("缺少参数：device_id / deviceId".to_string());
        },
    };

    info!("📇 查询设备联系人数量: {} (raw inputs: device_id={:?}, deviceId={:?})", id, device_id, deviceId);
    
    match try_query_contact_count(&id).await {
        Ok(count) => {
            info!("✅ 设备 {} 联系人查询成功: {} 个", id, count);
            Ok(count)
        },
        Err(e) => {
            warn!("❌ 设备 {} 联系人查询失败: {}", id, e);
            Err(e)
        }
    }
}

// ==================== Contact Verification ====================

/// 验证结果
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct VerificationResult {
    pub success: bool,
    pub total_expected: i32,
    pub sampled_count: i32,
    pub found_count: i32,
    pub success_rate: f64,
    pub estimated_imported: i32,
    pub method: String,
    pub verified_phones: Vec<String>,
}

/// 🎯 智能选择验证样本
fn select_verification_samples(phones: &[String]) -> Vec<String> {
    if phones.len() <= 5 {
        // 少于5个，全部验证
        return phones.to_vec();
    }
    
    // 字典序排序（130开头 > 135开头 > 138开头...）
    let mut sorted = phones.to_vec();
    sorted.sort();
    
    // 取前5个（最容易在联系人列表首页找到）
    sorted.into_iter().take(5).collect()
}

/// 🚀 快速检查号码是否存在
async fn check_contact_exists_fast(device_id: &str, phone: &str) -> Result<bool, String> {
    // 规范化号码（去除空格、横线等）
    let normalized = phone.replace(&[' ', '-', '(', ')', '+'][..], "");
    
    // 构建ADB查询命令
    let adb_path = crate::utils::adb_utils::get_adb_path();
    
    let query = format!(
        "content query --uri content://com.android.contacts/data \
         --projection data1 \
         --where \"mimetype='vnd.android.cursor.item/phone_v2' AND data1 LIKE '%{}%'\"",
        normalized
    );
    
    // 执行ADB命令
    let output = Command::new(adb_path)
        .args(&["-s", device_id, "shell", &query])
        .output()
        .map_err(|e| format!("执行ADB命令失败: {}", e))?;
    
    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    
    // 检查是否找到号码
    let found = stdout.contains("data1=") || stdout.contains(&normalized);
    
    if !stderr.is_empty() && !stderr.contains("Row:") {
        warn!("ADB查询警告: {}", stderr);
    }
    
    Ok(found)
}

/// 🚀 快速验证联系人（Tauri命令）
#[tauri::command]
pub async fn verify_contacts_fast(
    device_id: String,
    phone_numbers: Vec<String>,
) -> Result<VerificationResult, String> {
    info!("🔍 开始快速验证 {} 个号码", phone_numbers.len());
    
    if phone_numbers.is_empty() {
        return Ok(VerificationResult {
            success: false,
            total_expected: 0,
            sampled_count: 0,
            found_count: 0,
            success_rate: 0.0,
            estimated_imported: 0,
            method: "empty_input".to_string(),
            verified_phones: vec![],
        });
    }
    
    // 步骤1: 智能选择样本
    let samples = select_verification_samples(&phone_numbers);
    info!("📊 从 {} 个中选择 {} 个样本进行验证", phone_numbers.len(), samples.len());
    
    // 步骤2: 快速检查每个样本
    let mut found_count = 0;
    for phone in &samples {
        match check_contact_exists_fast(&device_id, phone).await {
            Ok(true) => {
                found_count += 1;
                info!("✅ 找到号码: {}", phone);
            }
            Ok(false) => {
                info!("❌ 未找到号码: {}", phone);
            }
            Err(e) => {
                warn!("⚠️ 检查号码失败 {}: {}", phone, e);
            }
        }
    }
    
    // 步骤3: 计算结果
    let success_rate = found_count as f64 / samples.len() as f64;
    let estimated_imported = (phone_numbers.len() as f64 * success_rate) as i32;
    
    let method = match found_count {
        n if n == samples.len() => "fast_sample_all_success".to_string(),
        0 => "fast_sample_all_failed".to_string(),
        _ => "fast_sample_partial".to_string(),
    };
    
    info!(
        "📊 验证完成: {}/{} 成功, 成功率: {:.1}%, 推断导入: {} 个",
        found_count, samples.len(), success_rate * 100.0, estimated_imported
    );
    
    Ok(VerificationResult {
        success: found_count > 0,
        total_expected: phone_numbers.len() as i32,
        sampled_count: samples.len() as i32,
        found_count: found_count as i32,
        success_rate,
        estimated_imported,
        method,
        verified_phones: samples,
    })
}

// ==================== Smart VCF Opener ====================

#[derive(Debug)]
struct ActionResult {
    step_name: String,
    is_complete: bool,
}

/// 获取当前UI状态
async fn get_current_ui_state(device_id: &str) -> Result<String, String> {
    // 刷新UI dump
    let mut dump_cmd = AsyncCommand::new("adb");
    dump_cmd.args(&["-s", device_id, "shell", "uiautomator", "dump"]);
    
    #[cfg(windows)]
    {
        dump_cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }
    
    let _ = dump_cmd.output().await;
    
    tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;
    
    // 读取UI XML
    let mut read_cmd = AsyncCommand::new("adb");
    read_cmd.args(&["-s", device_id, "shell", "cat", "/sdcard/window_dump.xml"]);
    
    #[cfg(windows)]
    {
        read_cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }
    
    let result = read_cmd.output()
        .await
        .map_err(|e| format!("执行adb命令失败: {}", e))?;
    
    if !result.status.success() {
        let error = String::from_utf8_lossy(&result.stderr);
        return Err(format!("读取UI失败: {}", error));
    }
    
    let xml_content = String::from_utf8_lossy(&result.stdout).to_string();
    
    if xml_content.trim().is_empty() {
        return Err("UI内容为空".to_string());
    }
    
    Ok(xml_content)
}

/// 解析bounds字符串并返回中心坐标
fn parse_bounds_to_center(bounds_str: &str) -> Result<(i32, i32), String> {
    // bounds格式: "[left,top][right,bottom]"
    let parts: Vec<&str> = bounds_str.split("][").collect();
    
    if parts.len() != 2 {
        return Err("bounds格式错误".to_string());
    }
    
    let left_top = parts[0].trim_start_matches('[');
    let right_bottom = parts[1].trim_end_matches(']');
    
    let left_top_coords: Vec<i32> = left_top.split(',')
        .map(|s| s.parse().unwrap_or(0))
        .collect();
    
    let right_bottom_coords: Vec<i32> = right_bottom.split(',')
        .map(|s| s.parse().unwrap_or(0))
        .collect();
    
    if left_top_coords.len() != 2 || right_bottom_coords.len() != 2 {
        return Err("坐标解析错误".to_string());
    }
    
    let center_x = (left_top_coords[0] + right_bottom_coords[0]) / 2;
    let center_y = (left_top_coords[1] + right_bottom_coords[1]) / 2;
    
    Ok((center_x, center_y))
}

/// 从XML中查找文本的坐标
fn find_text_coordinates(xml_content: &str, text: &str) -> Result<(i32, i32), String> {
    // 查找包含指定文本的node
    for line in xml_content.lines() {
        if line.contains(&format!("text=\"{}\"", text)) && line.contains("bounds=") {
            if let Some(bounds_start) = line.find("bounds=\"") {
                let bounds_start = bounds_start + 8;
                if let Some(bounds_end) = line[bounds_start..].find('"') {
                    let bounds_str = &line[bounds_start..bounds_start + bounds_end];
                    return parse_bounds_to_center(bounds_str);
                }
            }
        }
    }
    
    Err(format!("未找到文本: {}", text))
}

/// 通过资源ID点击元素
async fn click_element_by_resource_id(device_id: &str, resource_id: &str) -> Result<(), String> {
    println!("👆 点击资源ID: {}", resource_id);
    
    let mut click_cmd = AsyncCommand::new("adb");
    click_cmd.args(&["-s", device_id, "shell", "uiautomator2", "clickById", resource_id]);
    
    #[cfg(windows)]
    {
        click_cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }
    
    let result = click_cmd.output().await;
    
    // 如果uiautomator2不可用，返回错误而不是使用硬编码坐标
    if result.is_err() {
        println!("⚠️ uiautomator2不可用，且无法获取按钮坐标，操作失败");
        return Err("无法点击按钮：uiautomator2不可用且无按钮坐标信息".to_string());
    }
    
    Ok(())
}

/// 点击指定坐标
async fn click_coordinates(device_id: &str, x: i32, y: i32) -> Result<(), String> {
    println!("👆 点击坐标: ({}, {})", x, y);
    // 走注入器优先助手，失败信息按旧风格返回
    let adb_path = crate::utils::adb_utils::get_adb_path();
    match crate::infra::adb::input_helper::tap_injector_first(&adb_path, device_id, x, y, None).await {
        Ok(()) => {
            println!("✅ 点击成功");
            Ok(())
        }
        Err(e) => Err(format!("点击失败: {}", e))
    }
}

/// 打开文件管理器
async fn open_file_manager(device_id: &str) -> Result<(), String> {
    println!("📂 打开文件管理器");
    
    let mut open_cmd = AsyncCommand::new("adb");
    open_cmd.args(&["-s", device_id, "shell", "am", "start", "-t", "text/vcard", "-d", "file:///sdcard/Download/contacts_import.vcf"]);
    
    #[cfg(windows)]
    {
        open_cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }
    
    let result = open_cmd.output()
        .await
        .map_err(|e| format!("打开文件管理器失败: {}", e))?;
    
    if !result.status.success() {
        let error = String::from_utf8_lossy(&result.stderr);
        return Err(format!("打开文件管理器失败: {}", error));
    }
    
    Ok(())
}

/// 分析UI状态并执行相应操作
async fn analyze_and_act(device_id: &str, ui_content: &str) -> Result<ActionResult, String> {
    println!("🧠 分析UI内容...");
    
    // 场景1: 应用选择对话框 - "使用通讯录打开"
    if ui_content.contains("使用通讯录打开") {
        println!("🎯 检测到: 应用选择对话框 - 通讯录选项");
        
        if ui_content.contains("始终") && ui_content.contains("button_always") {
            // 点击"始终"按钮
            click_element_by_resource_id(device_id, "android:id/button_always").await?;
            return Ok(ActionResult {
                step_name: "选择始终使用通讯录打开".to_string(),
                is_complete: false,
            });
        }
        
        if ui_content.contains("仅此一次") {
            // 点击"仅此一次"按钮
            click_element_by_resource_id(device_id, "android:id/button_once").await?;
            return Ok(ActionResult {
                step_name: "选择仅此一次使用通讯录".to_string(),
                is_complete: false,
            });
        }
    }
    
    // 场景2: 联系人应用 - 导入界面
    if ui_content.contains("package=\"com.android.contacts\"") {
        println!("🎯 检测到: 联系人应用界面");
        
        // 查找导入相关按钮
        if ui_content.contains("导入") || ui_content.contains("Import") {
            if let Ok(coords) = find_text_coordinates(ui_content, "导入") {
                click_coordinates(device_id, coords.0, coords.1).await?;
                return Ok(ActionResult {
                    step_name: "点击导入按钮".to_string(),
                    is_complete: false,
                });
            }
        }
        
        // 查找确认按钮
        if ui_content.contains("确定") || ui_content.contains("OK") {
            if let Ok(coords) = find_text_coordinates(ui_content, "确定") {
                click_coordinates(device_id, coords.0, coords.1).await?;
                return Ok(ActionResult {
                    step_name: "确认导入联系人".to_string(),
                    is_complete: true, // 导入完成
                });
            }
        }
        
        // 如果没有找到特定按钮，返回失败而不是盲目点击
        println!("⚠️  在联系人应用中未找到特定按钮，跳过盲目点击");
        return Ok(ActionResult {
            step_name: "在联系人应用中未找到可操作按钮".to_string(),
            is_complete: false,
        });
    }
    
    // 场景3: 文件管理器 - 需要打开VCF文件
    if ui_content.contains("package=\"com.android.documentsui\"") {
        println!("🎯 检测到: 文件管理器界面");
        
        // 查找VCF文件
        if ui_content.contains("contacts_import.vcf") || ui_content.contains(".vcf") {
            if let Ok(coords) = find_text_coordinates(ui_content, "contacts_import.vcf") {
                click_coordinates(device_id, coords.0, coords.1).await?;
                return Ok(ActionResult {
                    step_name: "点击VCF文件".to_string(),
                    is_complete: false,
                });
            }
        }
        
        // 如果在空目录，需要导航到下载文件夹
        if ui_content.contains("无任何文件") || ui_content.contains("No items") {
            // 尝试点击下载文件夹或导航按钮
            if let Ok(coords) = find_text_coordinates(ui_content, "下载") {
                click_coordinates(device_id, coords.0, coords.1).await?;
                return Ok(ActionResult {
                    step_name: "导航到下载文件夹".to_string(),
                    is_complete: false,
                });
            }
        }
    }
    
    // 场景4: 桌面 - 需要打开文件管理器
    if ui_content.contains("launcher") {
        println!("🎯 检测到: 桌面界面");
        
        // 打开文件管理器
        open_file_manager(device_id).await?;
        return Ok(ActionResult {
            step_name: "打开文件管理器".to_string(),
            is_complete: false,
        });
    }
    
    // 场景5: 权限对话框
    if ui_content.contains("权限") || ui_content.contains("Permission") {
        println!("🎯 检测到: 权限对话框");
        
        if ui_content.contains("允许") || ui_content.contains("Allow") {
            if let Ok(coords) = find_text_coordinates(ui_content, "允许") {
                click_coordinates(device_id, coords.0, coords.1).await?;
                return Ok(ActionResult {
                    step_name: "授予权限".to_string(),
                    is_complete: false,
                });
            }
        }
    }
    
    // 未知状态 - 等待或重试
    println!("❓ 未识别的UI状态，等待状态变化...");
    Ok(ActionResult {
        step_name: "等待UI状态更新".to_string(),
        is_complete: false,
    })
}

/// 基于实时UI状态的智能VCF打开器
/// 根据当前屏幕内容自动执行正确的操作
#[tauri::command]
pub async fn smart_vcf_opener(device_id: String) -> Result<VcfOpenResult, String> {
    println!("🤖 启动智能VCF打开器，设备: {}", device_id);
    
    let mut steps_completed = Vec::new();
    let mut attempts = 0;
    const MAX_ATTEMPTS: u32 = 10;
    
    while attempts < MAX_ATTEMPTS {
        attempts += 1;
        println!("📍 第 {} 次尝试分析UI状态", attempts);
        
        // 1. 获取当前UI状态
        let ui_state = match get_current_ui_state(&device_id).await {
            Ok(state) => state,
            Err(e) => {
                println!("❌ 获取UI状态失败: {}", e);
                continue;
            }
        };
        
        // 2. 分析当前状态并执行相应操作
        let action_result = match analyze_and_act(&device_id, &ui_state).await {
            Ok(result) => result,
            Err(e) => {
                println!("❌ 执行操作失败: {}", e);
                tokio::time::sleep(tokio::time::Duration::from_millis(2000)).await;
                continue;
            }
        };
        
        steps_completed.push(action_result.step_name);
        
        // 3. 检查是否完成
        if action_result.is_complete {
            return Ok(VcfOpenResult {
                success: true,
                message: "VCF文件打开和导入完成".to_string(),
                details: Some(format!("总共执行了 {} 个步骤", steps_completed.len())),
                steps_completed,
            });
        }
        
        // 等待UI更新
        tokio::time::sleep(tokio::time::Duration::from_millis(2000)).await;
    }
    
    Err(format!("超过最大尝试次数 ({})，操作未完成", MAX_ATTEMPTS))
}

#[tauri::command]
async fn import_vcf_contacts_multi_brand(
    device_id: String,
    contacts_file_path: String,
) -> Result<MultiBrandImportResult, String> {
    let mut importer = MultiBrandVcfImporter::new(device_id);
    importer.import_vcf_contacts_multi_brand(&contacts_file_path).await
        .map_err(|e| e.to_string())
}

pub fn init() -> TauriPlugin<tauri::Wry> {
    Builder::new("contacts")
        .invoke_handler(tauri::generate_handler![
            import_vcf_contacts_multi_brand,
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
            tag_numbers_industry_by_vcf_batch,
            fetch_contact_numbers,
            fetch_unclassified_contact_numbers,
            fetch_contact_numbers_by_id_range,
            fetch_contact_numbers_by_id_range_unconsumed,
            mark_contact_numbers_used_by_id_range,
            get_device_contact_count,
            verify_contacts_fast,
            smart_vcf_opener
        ])
        .build()
}
