/// 基础管理命令
/// 
/// 提供数据库初始化、文件导入等基础管理功能的 Tauri 命令

use std::path::Path;
use tauri::{command, AppHandle};
use super::super::repositories::common::command_base::with_db_connection;
use super::super::repositories::contact_numbers_repo;
use super::super::models;

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
    let content = std::fs::read_to_string(&file_path)
        .map_err(|e| format!("读取文件失败: {}", e))?;

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
        if trimmed.len() >= 7 && trimmed.chars().all(|c| c.is_ascii_digit() || c == '+' || c == '-' || c == ' ') {
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
    let inserted_count = with_db_connection(&app_handle, |conn| {
        contact_numbers_repo::insert_numbers(conn, &phone_numbers)
    })?;

    Ok(models::ImportResultDto {
        total_lines: lines.len() as i64,
        valid_numbers: phone_numbers.len() as i64,
        inserted_count,
        invalid_lines,
        file_path,
    })
}

/// 初始化联系人存储数据库
#[command]
pub async fn init_contact_storage_cmd(
    app_handle: AppHandle,
) -> Result<String, String> {
    // 这个函数通过尝试连接数据库来触发初始化
    with_db_connection(&app_handle, |_conn| {
        Ok("数据库初始化成功".to_string())
    })
}

/// 获取数据库信息
#[command]
pub async fn get_database_info_cmd(
    app_handle: AppHandle,
) -> Result<models::DatabaseInfoDto, String> {
    with_db_connection(&app_handle, |conn| {
        // 获取各个表的记录数
        let contact_numbers_count: i64 = conn
            .prepare("SELECT COUNT(*) FROM contact_numbers")?
            .query_row([], |row| row.get(0))
            .unwrap_or(0);

        let vcf_batches_count: i64 = conn
            .prepare("SELECT COUNT(*) FROM vcf_batches")?
            .query_row([], |row| row.get(0))
            .unwrap_or(0);

        let import_sessions_count: i64 = conn
            .prepare("SELECT COUNT(*) FROM import_sessions")?
            .query_row([], |row| row.get(0))
            .unwrap_or(0);

        // 获取数据库文件大小（近似）
        let db_size: i64 = conn
            .prepare("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()")?
            .query_row([], |row| row.get(0))
            .unwrap_or(0);

        Ok(models::DatabaseInfoDto {
            contact_numbers_count,
            vcf_batches_count,
            import_sessions_count,
            database_size_bytes: db_size,
        })
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

    with_db_connection(&app_handle, |conn| {
        let tx = conn.unchecked_transaction()?;

        // 删除所有表数据（按依赖关系倒序）
        tx.execute("DELETE FROM import_events", [])?;
        tx.execute("DELETE FROM import_sessions", [])?;
        tx.execute("DELETE FROM contact_number_vcf_batches", [])?;
        tx.execute("DELETE FROM vcf_batches", [])?;
        tx.execute("DELETE FROM contact_numbers", [])?;

        // 重置自增序列
        tx.execute("DELETE FROM sqlite_sequence", [])?;

        tx.commit()?;

        Ok("数据库清理完成，所有数据已删除".to_string())
    })
}

/// 执行数据库维护操作
#[command]
pub async fn maintain_database_cmd(
    app_handle: AppHandle,
) -> Result<models::MaintenanceResultDto, String> {
    with_db_connection(&app_handle, |conn| {
        let mut operations = Vec::new();

        // VACUUM - 重建数据库，回收空间
        match conn.execute("VACUUM", []) {
            Ok(_) => operations.push("VACUUM: 成功".to_string()),
            Err(e) => operations.push(format!("VACUUM: 失败 - {}", e)),
        }

        // ANALYZE - 更新查询优化器的统计信息
        match conn.execute("ANALYZE", []) {
            Ok(_) => operations.push("ANALYZE: 成功".to_string()),
            Err(e) => operations.push(format!("ANALYZE: 失败 - {}", e)),
        }

        // PRAGMA integrity_check - 完整性检查
        let integrity_result: Result<String, _> = conn
            .prepare("PRAGMA integrity_check")?
            .query_row([], |row| row.get(0));

        match integrity_result {
            Ok(result) => {
                if result == "ok" {
                    operations.push("完整性检查: 通过".to_string());
                } else {
                    operations.push(format!("完整性检查: 发现问题 - {}", result));
                }
            }
            Err(e) => operations.push(format!("完整性检查: 失败 - {}", e)),
        }

        Ok(models::MaintenanceResultDto {
            operations,
            timestamp: chrono::Utc::now().to_rfc3339(),
        })
    })
}

/// 备份数据库
#[command]
pub async fn backup_database_cmd(
    app_handle: AppHandle,
    backup_path: String,
) -> Result<String, String> {
    use std::fs;

    // 获取数据库文件路径
    let app_data_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or("无法获取应用数据目录")?;

    let db_path = app_data_dir.join("contact_storage.db");

    if !db_path.exists() {
        return Err("数据库文件不存在".to_string());
    }

    // 复制数据库文件
    fs::copy(&db_path, &backup_path)
        .map_err(|e| format!("备份失败: {}", e))?;

    Ok(format!("数据库已备份到: {}", backup_path))
}

/// 从备份恢复数据库
#[command]
pub async fn restore_database_cmd(
    app_handle: AppHandle,
    backup_path: String,
    confirm_token: String,
) -> Result<String, String> {
    use std::fs;

    // 安全检查：要求用户提供确认令牌
    if confirm_token != "CONFIRM_RESTORE_DATABASE" {
        return Err("无效的确认令牌，操作已取消".to_string());
    }

    // 检查备份文件是否存在
    if !Path::new(&backup_path).exists() {
        return Err(format!("备份文件不存在: {}", backup_path));
    }

    // 获取数据库文件路径
    let app_data_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or("无法获取应用数据目录")?;

    let db_path = app_data_dir.join("contact_storage.db");

    // 复制备份文件覆盖当前数据库
    fs::copy(&backup_path, &db_path)
        .map_err(|e| format!("恢复失败: {}", e))?;

    Ok(format!("数据库已从备份恢复: {}", backup_path))
}