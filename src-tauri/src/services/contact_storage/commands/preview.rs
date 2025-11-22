use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use tauri::command;
use uuid::Uuid;
use chrono::Utc;

use crate::services::contact_storage::parser::extract_numbers_from_text;

// ==================== DTO Definitions (Mirroring legacy contact_service.rs) ====================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PreviewContact {
    pub id: String,
    pub name: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PreviewDocument {
    pub id: String,
    pub filename: String,
    pub filepath: String,
    pub upload_time: String,
    pub total_contacts: usize,
    pub processed_contacts: usize,
    pub status: String,
    pub format: String,
    pub contacts: Vec<PreviewContact>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PreviewResult {
    pub success: bool,
    pub document: Option<PreviewDocument>,
    pub error: Option<String>,
}

// ==================== Commands ====================

/// 获取联系人文件信息（不解析内容）
/// 替代原 services::contact_service::get_contact_file_info
#[command]
pub async fn get_contact_file_info(file_path: String) -> Result<serde_json::Value, String> {
    if !Path::new(&file_path).exists() {
        return Err("文件不存在".to_string());
    }

    let filename = Path::new(&file_path)
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("unknown")
        .to_string();

    let file_size = fs::metadata(&file_path)
        .map_err(|e| format!("获取文件信息失败: {}", e))?
        .len();

    Ok(serde_json::json!({
        "filename": filename,
        "filepath": file_path,
        "size": file_size,
        "exists": true
    }))
}

/// 解析联系人文件预览
/// 替代原 services::contact_service::parse_contact_file
/// 使用 contact_storage 模块的统一解析引擎
#[command]
pub async fn parse_contact_file(file_name: String, content: String) -> Result<PreviewResult, String> {
    tracing::info!("正在解析联系人文件预览: {}", file_name);

    // 检查文件内容是否为空
    if content.trim().is_empty() {
        return Ok(PreviewResult {
            success: false,
            document: None,
            error: Some("文件内容为空".to_string()),
        });
    }

    // 使用统一解析引擎提取号码
    // extract_numbers_from_text 内部使用了 ContactFormatParser (CSV -> Plain -> Mixed)
    // 并且已经包含了去重逻辑
    let parse_stats = extract_numbers_from_text(&content);
    
    // 将解析结果转换为预览格式
    let contacts: Vec<PreviewContact> = parse_stats.contacts.into_iter().enumerate().map(|(idx, (phone, name))| {
        PreviewContact {
            id: Uuid::new_v4().to_string(),
            name: if name.is_empty() { format!("联系人{}", idx + 1) } else { name },
            phone: Some(phone),
            email: None, // 目前解析器主要关注手机号，暂不提取邮箱
            notes: None,
        }
    }).collect();

    if contacts.is_empty() {
        return Ok(PreviewResult {
            success: false,
            document: None,
            error: Some("文件中没有找到有效的联系人数据".to_string()),
        });
    }

    // 创建文档对象
    let document = PreviewDocument {
        id: Uuid::new_v4().to_string(),
        filename: file_name.clone(),
        filepath: format!("C:\\Documents\\{}", file_name), // 模拟路径，保持兼容
        upload_time: Utc::now().to_rfc3339(),
        total_contacts: contacts.len(),
        processed_contacts: contacts.len(),
        status: "completed".to_string(),
        format: get_file_format(&file_name),
        contacts,
    };

    tracing::info!("成功解析预览 {} 个联系人", document.total_contacts);

    Ok(PreviewResult {
        success: true,
        document: Some(document),
        error: None,
    })
}

/// 根据文件名获取文件格式
fn get_file_format(filename: &str) -> String {
    let ext = filename.split('.').last().unwrap_or("txt").to_lowercase();
    match ext.as_str() {
        "csv" => "csv".to_string(),
        "txt" => "txt".to_string(),
        "xlsx" | "xls" => "excel".to_string(),
        "vcf" => "vcf".to_string(),
        "json" => "json".to_string(),
        _ => "txt".to_string(),
    }
}
