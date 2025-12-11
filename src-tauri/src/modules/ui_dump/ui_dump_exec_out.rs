// src-tauri/src/modules/ui_dump/ui_dump_exec_out.rs
// module: ui_dump | layer: infrastructure | role: exec-out-mode
// summary: ExecOut 快速模式实现 - 通过 exec-out 直接输出到 stdout，跳过文件 I/O

use anyhow::{Context, Result};
use std::process::Stdio;
use std::time::{Duration, Instant};
use tokio::io::AsyncReadExt;
use tokio::process::Command;
use tokio::time::timeout;
use tracing::{debug, info, warn};

use super::ui_dump_types::{DiagnosticEntry, DumpMode, DumpResult};
use crate::utils::adb_utils::get_adb_path;

/// ExecOut 模式执行器
/// 
/// 使用 `adb exec-out uiautomator dump /dev/stdout` 命令直接获取 XML 内容，
/// 跳过设备端文件写入和 adb pull 步骤，速度约快 30-40%。
pub struct ExecOutExecutor {
    timeout_ms: u64,
}

impl ExecOutExecutor {
    /// 创建新的 ExecOut 执行器
    pub fn new(timeout_ms: u64) -> Self {
        Self { timeout_ms }
    }
    
    /// 执行 ExecOut 模式的 UI Dump
    /// 
    /// # Arguments
    /// * `device_id` - ADB 设备 ID
    /// 
    /// # Returns
    /// * `Ok(DumpResult)` - 包含 XML 内容或错误信息的结果
    pub async fn execute(&self, device_id: &str) -> Result<DumpResult> {
        let start = Instant::now();
        let adb_path = get_adb_path();
        
        debug!("🚀 ExecOut 模式开始: device={}, timeout={}ms", device_id, self.timeout_ms);
        
        // 构建命令: adb -s <device_id> exec-out uiautomator dump /dev/stdout
        let mut cmd = Command::new(&adb_path);
        cmd.args(&["-s", device_id, "exec-out", "uiautomator", "dump", "/dev/stdout"])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());
        
        // Windows 隐藏控制台窗口
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
        }
        
        // 执行命令并设置超时
        let result = timeout(
            Duration::from_millis(self.timeout_ms),
            self.execute_command(cmd),
        )
        .await;
        
        let elapsed_ms = start.elapsed().as_millis() as u64;
        
        match result {
            Ok(Ok(xml_content)) => {
                // 验证 XML 内容
                if let Err(validation_error) = self.validate_xml(&xml_content) {
                    warn!("❌ ExecOut XML 验证失败: {}", validation_error);
                    return Ok(DumpResult::failure(
                        device_id.to_string(),
                        DumpMode::ExecOut,
                        validation_error,
                        elapsed_ms,
                    ));
                }
                
                info!("✅ ExecOut 成功: {}ms, {} 字符", elapsed_ms, xml_content.len());
                Ok(DumpResult::success(
                    device_id.to_string(),
                    DumpMode::ExecOut,
                    xml_content,
                    elapsed_ms,
                ))
            }
            Ok(Err(e)) => {
                warn!("❌ ExecOut 执行失败: {} ({}ms)", e, elapsed_ms);
                Ok(DumpResult::failure(
                    device_id.to_string(),
                    DumpMode::ExecOut,
                    format!("执行失败: {}", e),
                    elapsed_ms,
                ))
            }
            Err(_) => {
                warn!("⏱️ ExecOut 超时: {}ms", elapsed_ms);
                Ok(DumpResult::failure(
                    device_id.to_string(),
                    DumpMode::ExecOut,
                    format!("超时 ({}ms)", self.timeout_ms),
                    elapsed_ms,
                ))
            }
        }
    }
    
    /// 执行命令并读取输出
    async fn execute_command(&self, mut cmd: Command) -> Result<String> {
        let mut child = cmd.spawn()
            .context("启动 adb exec-out 进程失败")?;
        
        let mut stdout = child.stdout.take()
            .context("无法获取 stdout")?;
        
        let mut stderr = child.stderr.take()
            .context("无法获取 stderr")?;
        
        // 读取 stdout
        let mut stdout_content = Vec::new();
        stdout.read_to_end(&mut stdout_content).await
            .context("读取 stdout 失败")?;
        
        // 读取 stderr
        let mut stderr_content = Vec::new();
        stderr.read_to_end(&mut stderr_content).await
            .context("读取 stderr 失败")?;
        
        // 等待进程结束
        let status = child.wait().await
            .context("等待进程结束失败")?;
        
        // 检查退出状态
        if !status.success() {
            let stderr_str = String::from_utf8_lossy(&stderr_content);
            return Err(anyhow::anyhow!(
                "adb exec-out 失败 (exit code: {:?}): {}",
                status.code(),
                stderr_str.trim()
            ));
        }
        
        // 转换输出
        let content = String::from_utf8(stdout_content)
            .context("UTF-8 解码失败")?;
        
        Ok(content)
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
    
    /// 生成诊断条目
    pub fn create_diagnostic(&self, result: &DumpResult) -> DiagnosticEntry {
        if result.success {
            DiagnosticEntry::info(format!(
                "ExecOut 成功: {} 字符, {}ms",
                result.xml_length,
                result.elapsed_ms
            ))
            .with_device(&result.device_id)
            .with_mode(DumpMode::ExecOut)
            .with_elapsed(result.elapsed_ms)
        } else {
            DiagnosticEntry::error(format!(
                "ExecOut 失败: {}",
                result.error.as_deref().unwrap_or("未知错误")
            ))
            .with_device(&result.device_id)
            .with_mode(DumpMode::ExecOut)
            .with_elapsed(result.elapsed_ms)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_validate_xml_valid() {
        let executor = ExecOutExecutor::new(3000);
        let valid_xml = r#"<?xml version="1.0" encoding="UTF-8"?><hierarchy rotation="0"></hierarchy>"#;
        assert!(executor.validate_xml(valid_xml).is_ok());
    }
    
    #[test]
    fn test_validate_xml_empty() {
        let executor = ExecOutExecutor::new(3000);
        assert!(executor.validate_xml("").is_err());
        assert!(executor.validate_xml("   ").is_err());
    }
    
    #[test]
    fn test_validate_xml_error() {
        let executor = ExecOutExecutor::new(3000);
        let error_content = "ERROR: could not get idle state";
        let result = executor.validate_xml(error_content);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("idle"));
    }
    
    #[test]
    fn test_validate_xml_no_hierarchy() {
        let executor = ExecOutExecutor::new(3000);
        let no_hierarchy = r#"<?xml version="1.0"?><root></root>"#;
        assert!(executor.validate_xml(no_hierarchy).is_err());
    }
}
