/// 联系人存储数据库管理命令
/// 
/// 提供数据库初始化、文件导入等基础管理功能的 Tauri 命令
use std::path::Path;
use tauri::{command, AppHandle};
use super::super::models;
use super::super::repository_facade::ContactStorageFacade;

/// 初始化联系人存储数据库
#[command]
pub async fn init_contact_storage_cmd(app_handle: AppHandle) -> Result<String, String> {
    // 使用新的统一数据库连接方式
    use super::super::repositories::common::database;
    database::get_connection(&app_handle).map_err(|e| format!("数据库初始化失败: {}", e))?;
    Ok("联系人存储数据库初始化成功".to_string())
}

/// 获取数据库信息
#[command]
pub async fn get_database_info_cmd(
    app_handle: AppHandle,
) -> Result<models::DatabaseInfoDto, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    let stats = facade.get_contact_number_stats()?;
    
    Ok(models::DatabaseInfoDto {
        contact_numbers_count: stats.get("total").and_then(|v| v.as_i64()).unwrap_or(0),
        vcf_batches_count: 0, // TODO: 从facade获取
        import_sessions_count: 0, // TODO: 从facade获取  
        database_size_bytes: 0, // TODO: 计算文件大小
    })
}

/// 导入 TXT 文件到联系人号码
#[command]
pub async fn import_txt_to_contact_numbers_cmd(
    app_handle: AppHandle,
    file_path: String,
) -> Result<models::ImportResultDto, String> {
    // 验证文件存在性
    if !Path::new(&file_path).exists() {
        return Err(format!("文件不存在: {}", file_path));
    }

    // 读取文件内容
    let content =
        std::fs::read_to_string(&file_path).map_err(|e| format!("读取文件失败: {}", e))?;

    // 解析电话号码
    let lines: Vec<&str> = content.lines().collect();
    let mut phone_numbers = Vec::new();
    let mut invalid_lines = Vec::new();

    for (line_num, line) in lines.iter().enumerate() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }

        // 简单的电话号码验证（可根据需要调整）
        if trimmed.len() >= 7
            && trimmed
                .chars()
                .all(|c| c.is_ascii_digit() || c == '+' || c == '-' || c == ' ')
        {
            // 清理号码格式
            let cleaned = trimmed.replace(['+', '-', ' '], "");
            if cleaned.len() >= 7 && cleaned.chars().all(|c| c.is_ascii_digit()) {
                phone_numbers.push(cleaned);
            } else {
                invalid_lines.push(line_num + 1);
            }
        } else {
            invalid_lines.push(line_num + 1);
        }
    }

    if phone_numbers.is_empty() {
        return Err("文件中没有找到有效的电话号码".to_string());
    }

    // 批量插入到数据库
    let facade = ContactStorageFacade::new(&app_handle);
    let phone_pairs: Vec<(String, String)> = phone_numbers
        .iter()
        .enumerate()
        .map(|(i, phone)| (phone.clone(), format!("联系人{}", i + 1)))
        .collect();

    let source_file = std::path::Path::new(&file_path)
        .file_name()
        .and_then(|f| f.to_str())
        .unwrap_or("unknown.txt");

    let (inserted_count, _duplicate_count, _error_numbers) = facade.insert_numbers(&phone_pairs, source_file)?;

    Ok(models::ImportResultDto {
        total_lines: lines.len() as i64,
        valid_numbers: phone_numbers.len() as i64,
        inserted_count,
        invalid_lines,
        file_path,
    })
}

/// 清理数据库（删除所有数据）
#[command]
pub async fn cleanup_database_cmd(
    app_handle: AppHandle,
    confirm_token: String,
) -> Result<String, String> {
    // 安全检查：要求用户提供确认令牌
    if confirm_token != "CONFIRM_DELETE_ALL_DATA" {
        return Err("无效的确认令牌，操作已取消".to_string());
    }

    let facade = ContactStorageFacade::new(&app_handle);
    facade.cleanup_all_data()?;
    Ok("数据库清理完成，所有数据已删除".to_string())
}

/// 执行数据库维护操作
#[command]
pub async fn maintain_database_cmd(
    app_handle: AppHandle,
) -> Result<models::MaintenanceResultDto, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    let _message = facade.maintain_database()?;
    
    Ok(models::MaintenanceResultDto {
        operations: vec!["VACUUM".to_string(), "REINDEX".to_string()],
        timestamp: chrono::Utc::now().to_rfc3339(),
    })
}

/// 备份数据库
#[command]
pub async fn backup_database_cmd(
    app_handle: AppHandle,
    backup_path: String,
) -> Result<String, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.backup_database(&backup_path)?;
    Ok(format!("数据库已备份到: {}", backup_path))
}

/// 从备份恢复数据库
#[command]
pub async fn restore_database_cmd(
    app_handle: AppHandle,
    backup_path: String,
    confirm_token: String,
) -> Result<String, String> {
    // 安全检查：要求用户提供确认令牌
    if confirm_token != "CONFIRM_RESTORE_DATABASE" {
        return Err("无效的确认令牌，操作已取消".to_string());
    }

    let facade = ContactStorageFacade::new(&app_handle);
    facade.restore_database(&backup_path)?;
    Ok(format!("数据库已从备份恢复: {}", backup_path))
}
