// src-tauri/src/modules/ui_dump/ui_dump_legacy.rs
// module: ui_dump | layer: infrastructure | role: dump-pull-mode
// summary: DumpPull 传统模式实现 - 使用 uiautomator dump + cat 方式，兼容性最好

use anyhow::{Context, Result};
use std::time::{Duration, Instant};
use tokio::time::timeout;
use tracing::{debug, info, warn};

use super::ui_dump_types::{DiagnosticEntry, DumpMode, DumpResult};
use crate::services::adb::get_device_session;

/// DumpPull 传统模式执行器
/// 
/// 使用 `uiautomator dump /sdcard/ui_dump.xml && cat /sdcard/ui_dump.xml` 命令，
/// 先写入设备文件再读取内容。兼容性最好，作为 ExecOut 失败时的兜底方案。
pub struct DumpPullExecutor {
    timeout_ms: u64,
}

/// 统一的设备端临时文件路径
pub const DUMP_FILE_PATH: &str = "/sdcard/ui_dump.xml";

impl DumpPullExecutor {
    /// 创建新的 DumpPull 执行器
    pub fn new(timeout_ms: u64) -> Self {
        Self { timeout_ms }
    }
    
    /// 执行 DumpPull 模式的 UI Dump
    /// 
    /// # Arguments
    /// * `device_id` - ADB 设备 ID
    /// 
    /// # Returns
    /// * `Ok(DumpResult)` - 包含 XML 内容或错误信息的结果
    pub async fn execute(&self, device_id: &str) -> Result<DumpResult> {
        let start = Instant::now();
        
        debug!("📦 DumpPull 模式开始: device={}, timeout={}ms", device_id, self.timeout_ms);
        
        // 获取设备会话
        let session = match get_device_session(device_id).await {
            Ok(s) => s,
            Err(e) => {
                let elapsed_ms = start.elapsed().as_millis() as u64;
                warn!("❌ DumpPull 无法获取设备会话: {}", e);
                return Ok(DumpResult::failure(
                    device_id.to_string(),
                    DumpMode::DumpPull,
                    format!("无法获取设备会话: {}", e),
                    elapsed_ms,
                ));
            }
        };
        
        // 执行命令并设置超时
        let result = timeout(
            Duration::from_millis(self.timeout_ms),
            self.execute_dump(&session, device_id),
        )
        .await;
        
        let elapsed_ms = start.elapsed().as_millis() as u64;
        
        match result {
            Ok(Ok(xml_content)) => {
                // 验证 XML 内容
                if let Err(validation_error) = self.validate_xml(&xml_content) {
                    warn!("❌ DumpPull XML 验证失败: {}", validation_error);
                    return Ok(DumpResult::failure(
                        device_id.to_string(),
                        DumpMode::DumpPull,
                        validation_error,
                        elapsed_ms,
                    ));
                }
                
                info!("✅ DumpPull 成功: {}ms, {} 字符", elapsed_ms, xml_content.len());
                Ok(DumpResult::success(
                    device_id.to_string(),
                    DumpMode::DumpPull,
                    xml_content,
                    elapsed_ms,
                ))
            }
            Ok(Err(e)) => {
                warn!("❌ DumpPull 执行失败: {} ({}ms)", e, elapsed_ms);
                Ok(DumpResult::failure(
                    device_id.to_string(),
                    DumpMode::DumpPull,
                    format!("执行失败: {}", e),
                    elapsed_ms,
                ))
            }
            Err(_) => {
                warn!("⏱️ DumpPull 超时: {}ms", elapsed_ms);
                Ok(DumpResult::failure(
                    device_id.to_string(),
                    DumpMode::DumpPull,
                    format!("超时 ({}ms)", self.timeout_ms),
                    elapsed_ms,
                ))
            }
        }
    }
    
    /// 执行实际的 dump 命令
    async fn execute_dump(
        &self,
        session: &crate::services::adb::session::AdbShellSession,
        _device_id: &str,
    ) -> Result<String> {
        // 构建命令：dump 到文件然后读取
        // 使用 > /dev/null 抑制 dump 命令的输出信息
        let command = format!(
            "uiautomator dump {} > /dev/null && cat {}",
            DUMP_FILE_PATH, DUMP_FILE_PATH
        );
        
        let output = session.execute_command(&command).await
            .context("执行 uiautomator dump 命令失败")?;
        
        Ok(output)
    }
    
    /// 验证 XML 内容
    fn validate_xml(&self, content: &str) -> Result<(), String> {
        let trimmed = content.trim();
        
        // 检查是否为空
        if trimmed.is_empty() {
            return Err("XML 内容为空".to_string());
        }
        
        // 检查 XML 头
        if !trimmed.starts_with("<?xml") {
            // 检查常见错误
            if trimmed.contains("ERROR:") {
                return Err(format!("uiautomator 错误: {}", 
                    trimmed.lines().next().unwrap_or(trimmed)));
            }
            if trimmed.contains("could not get idle state") {
                return Err("应用反自动化保护：无法获取 idle 状态".to_string());
            }
            if trimmed.contains("null root node") {
                return Err("UI 树根节点为空".to_string());
            }
            if trimmed.contains("Permission denied") {
                return Err("权限被拒绝".to_string());
            }
            if trimmed.contains("UI hierchary dumped to:") {
                // 这是 dump 命令的输出，不是 XML 内容
                return Err("获取到的是 dump 命令输出而非 XML 内容".to_string());
            }
            
            return Err(format!(
                "无效的 XML 格式，前100字符: {}",
                trimmed.chars().take(100).collect::<String>()
            ));
        }
        
        // 检查是否包含 hierarchy 节点
        if !trimmed.contains("<hierarchy") {
            return Err("XML 不包含 hierarchy 节点".to_string());
        }
        
        Ok(())
    }
    
    /// 清理设备上的临时文件
    pub async fn cleanup(&self, device_id: &str) -> Result<()> {
        if let Ok(session) = get_device_session(device_id).await {
            let _ = session.execute_command(&format!("rm -f {}", DUMP_FILE_PATH)).await;
        }
        Ok(())
    }
    
    /// 生成诊断条目
    pub fn create_diagnostic(&self, result: &DumpResult) -> DiagnosticEntry {
        if result.success {
            DiagnosticEntry::info(format!(
                "DumpPull 成功: {} 字符, {}ms",
                result.xml_length,
                result.elapsed_ms
            ))
            .with_device(&result.device_id)
            .with_mode(DumpMode::DumpPull)
            .with_elapsed(result.elapsed_ms)
        } else {
            DiagnosticEntry::error(format!(
                "DumpPull 失败: {}",
                result.error.as_deref().unwrap_or("未知错误")
            ))
            .with_device(&result.device_id)
            .with_mode(DumpMode::DumpPull)
            .with_elapsed(result.elapsed_ms)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_validate_xml_valid() {
        let executor = DumpPullExecutor::new(15000);
        let valid_xml = r#"<?xml version="1.0" encoding="UTF-8"?><hierarchy rotation="0"></hierarchy>"#;
        assert!(executor.validate_xml(valid_xml).is_ok());
    }
    
    #[test]
    fn test_validate_xml_empty() {
        let executor = DumpPullExecutor::new(15000);
        assert!(executor.validate_xml("").is_err());
    }
    
    #[test]
    fn test_validate_xml_dump_output() {
        let executor = DumpPullExecutor::new(15000);
        let dump_output = "UI hierchary dumped to: /sdcard/ui_dump.xml";
        assert!(executor.validate_xml(dump_output).is_err());
    }
    
    #[test]
    fn test_dump_file_path() {
        assert_eq!(DUMP_FILE_PATH, "/sdcard/ui_dump.xml");
    }
}
