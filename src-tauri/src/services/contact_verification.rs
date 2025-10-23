// src-tauri/src/services/contact_verification.rs
// module: contact-verification | layer: services | role: 快速号码验证服务
// summary: 实现智能采样验证，提供高效的联系人导入验证功能

use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::process::Command;
use tracing::{info, warn};

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
async fn check_contact_exists_fast(device_id: &str, phone: &str) -> Result<bool> {
    // 规范化号码（去除空格、横线等）
    let normalized = phone.replace(&[' ', '-', '(', ')', '+'][..], "");
    
    // 构建ADB查询命令
    let adb_path = get_adb_path()?;
    
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
        .map_err(|e| anyhow::anyhow!("执行ADB命令失败: {}", e))?;
    
    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    
    // 检查是否找到号码
    let found = stdout.contains("data1=") || stdout.contains(&normalized);
    
    if !stderr.is_empty() && !stderr.contains("Row:") {
        warn!("ADB查询警告: {}", stderr);
    }
    
    Ok(found)
}

/// 获取ADB路径
fn get_adb_path() -> Result<String> {
    // 尝试多个可能的路径
    let possible_paths = vec![
        "D:\\开发\\marketing-automation-desktop\\platform-tools\\adb.exe",
        "platform-tools/adb.exe",
        "adb.exe",
        "adb",
    ];
    
    for path in possible_paths {
        if std::path::Path::new(path).exists() {
            return Ok(path.to_string());
        }
    }
    
    // 如果都不存在，尝试从PATH中找
    Ok("adb".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_select_verification_samples() {
        let phones = vec![
            "13912345678".to_string(),
            "13012345678".to_string(),
            "15912345678".to_string(),
            "13512345678".to_string(),
            "13812345678".to_string(),
            "18612345678".to_string(),
        ];
        
        let samples = select_verification_samples(&phones);
        
        assert_eq!(samples.len(), 5);
        // 应该按字典序排列
        assert_eq!(samples[0], "13012345678");
        assert_eq!(samples[1], "13512345678");
    }
    
    #[test]
    fn test_select_verification_samples_small() {
        let phones = vec![
            "13912345678".to_string(),
            "13012345678".to_string(),
        ];
        
        let samples = select_verification_samples(&phones);
        
        // 少于5个，应该全部返回
        assert_eq!(samples.len(), 2);
    }
}
