//! 联系人导入相关 Tauri 命令（已剥离所有小红书自动关注逻辑）。
//! 仅保留：
//! 1. VCF 文件生成
//! 2. 多品牌导入入口
//! 3. 华为增强导入入口

use crate::services::vcf::{MultiBrandVcfImporter, MultiBrandImportResult, Contact, VcfOpenResult, generate_vcf_file as generate_vcf_file_impl};
// // use crate::services::huawei_enhanced_importer::{HuaweiEmuiEnhancedStrategy, ImportExecutionResult};
use tracing::{error, info};

/// 从联系人列表生成 VCF 文件
#[tauri::command]
pub async fn generate_vcf_file(contacts: Vec<Contact>, output_path: String) -> Result<String, String> {
    match generate_vcf_file_impl(contacts, &output_path).await {
        Ok(path) => Ok(path),
        Err(e) => {
            error!("生成VCF文件失败: {}", e);
            Err(e.to_string())
        }
    }
}

// 旧的小红书自动关注复合流程已完全移除。

/// 多品牌VCF导入（批量尝试不同品牌的导入方式）
#[tauri::command]
pub async fn import_vcf_contacts_multi_brand(
    device_id: String,
    contacts_file_path: String,
) -> Result<MultiBrandImportResult, String> {
    info!(
        "🚀 开始多品牌VCF导入: 设备 {} 文件 {}",
        device_id, contacts_file_path
    );

    let mut importer = MultiBrandVcfImporter::new(device_id);

    match importer.import_vcf_contacts_multi_brand(&contacts_file_path).await {
        Ok(result) => {
            info!(
                "✅ 多品牌VCF导入完成: 成功={} 总联系人={} 导入={} 失败={} 使用策略={:?} 使用方法={:?} 耗时={}秒",
                result.success,
                result.total_contacts,
                result.imported_contacts,
                result.failed_contacts,
                result.used_strategy,
                result.used_method,
                result.duration_seconds
            );
            
            // 记录详细的尝试信息
            for attempt in &result.attempts {
                info!("📋 尝试记录: 策略={} 方法={} 成功={} 耗时={}秒", 
                    attempt.strategy_name, 
                    attempt.method_name, 
                    attempt.success, 
                    attempt.duration_seconds
                );
                if let Some(error) = &attempt.error_message {
                    info!("   错误信息: {}", error);
                }
            }
            
            Ok(result)
        }
        Err(e) => {
            error!("❌ 多品牌VCF导入失败: {}", e);
            Err(e.to_string())
        }
    }
}

/// 华为设备增强VCF导入（基于Python成功经验）
#[tauri::command]
pub async fn import_vcf_contacts_huawei_enhanced(
    device_id: String,
    contacts_file_path: String,
) -> Result<(), String> {
    info!(
        "🚀 开始华为增强VCF导入: 设备 {} 文件 {}",
        device_id, contacts_file_path
    );

    let result = import_vcf_contacts_multi_brand(device_id, contacts_file_path).await?;
    if result.success {
        Ok(())
    } else {
        Err(format!("Import failed: {:?}", result.failed_contacts))
    }
}

/// 🎯 前端兼容命令：import_and_open_vcf_ldplayer
/// 内部调用新的多品牌导入器，返回前端期望的 VcfOpenResult 格式
#[tauri::command]
pub async fn import_and_open_vcf_ldplayer(
    device_id: String,
    contacts_file_path: String,
) -> Result<VcfOpenResult, String> {
    info!(
        "🔄 [兼容模式] import_and_open_vcf_ldplayer 调用，重定向到多品牌导入器"
    );
    info!("   设备: {}, 文件: {}", device_id, contacts_file_path);

    // 调用新的多品牌导入器
    let mut importer = MultiBrandVcfImporter::new(device_id);

    match importer.import_vcf_contacts_multi_brand(&contacts_file_path).await {
        Ok(result) => {
            // 将 MultiBrandImportResult 转换为 VcfOpenResult
            let steps = vec![
                if result.used_strategy.is_some() {
                    format!("使用策略: {}", result.used_strategy.unwrap())
                } else {
                    "策略选择".to_string()
                },
                if result.used_method.is_some() {
                    format!("使用方法: {}", result.used_method.unwrap())
                } else {
                    "方法选择".to_string()
                },
                if result.success {
                    format!("成功导入 {} 个联系人", result.imported_contacts)
                } else {
                    "导入失败".to_string()
                },
            ];

            Ok(VcfOpenResult {
                success: result.success,
                message: result.message.clone(),
                details: Some(format!(
                    "总联系人: {}, 导入成功: {}, 失败: {}, 耗时: {}秒",
                    result.total_contacts,
                    result.imported_contacts,
                    result.failed_contacts,
                    result.duration_seconds
                )),
                steps_completed: steps,
            })
        }
        Err(e) => {
            error!("❌ 多品牌导入器执行失败: {}", e);
            Ok(VcfOpenResult {
                success: false,
                message: format!("导入失败: {}", e),
                details: None,
                steps_completed: vec!["导入失败".to_string()],
            })
        }
    }
}

