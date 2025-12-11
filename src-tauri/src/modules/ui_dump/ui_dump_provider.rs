// src-tauri/src/modules/ui_dump/ui_dump_provider.rs
// module: ui_dump | layer: application | role: unified-provider
// summary: UI Dump 统一提供器 - Auto模式优先级调度、超时降级、设备兼容性缓存

use anyhow::Result;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Instant;
use tokio::sync::RwLock;
use tracing::{debug, info, warn};

use super::ui_dump_config::UiDumpConfigManager;
use super::ui_dump_diagnostics::DiagnosticsBuffer;
use super::ui_dump_types::{DeviceCompatEntry, DiagnosticEntry, DumpMode, DumpResult, DumpAndSaveResult, UiDumpConfig};
use super::domain::capturer_trait::ScreenCapturer;
use super::strategies::adb_file::AdbFileStrategy;
use super::strategies::adb_stream::AdbStreamStrategy;
use super::strategies::android_service::AndroidServiceStrategy;

/// UI Dump 统一提供器
/// 
/// 作为所有 UI Dump 调用的统一入口，实现：
/// 1. Auto 模式的优先级调度（A11y > ExecOut > DumpPull）
/// 2. 超时自动降级机制
/// 3. 设备兼容性缓存（避免重复探测）
/// 4. 诊断日志记录
pub struct UiDumpProvider {
    config_manager: Arc<RwLock<UiDumpConfigManager>>,
    diagnostics: Arc<RwLock<DiagnosticsBuffer>>,
}

impl UiDumpProvider {
    /// 创建新的 Provider
    pub fn new(
        config_manager: Arc<RwLock<UiDumpConfigManager>>,
        diagnostics: Arc<RwLock<DiagnosticsBuffer>>,
    ) -> Self {
        Self {
            config_manager,
            diagnostics,
        }
    }
    
    /// 执行 UI Dump（统一入口）
    /// 
    /// 根据配置和设备兼容性自动选择最优模式执行
    pub async fn dump(&self, device_id: &str) -> Result<DumpResult> {
        let start = Instant::now();
        
        // 读取配置
        let config = {
            let manager = self.config_manager.read().await;
            manager.get_config().clone()
        };
        
        let preferred_mode = config.preferred_mode;
        
        info!("🎯 UI Dump 开始: device={}, mode={:?}", device_id, preferred_mode);
        
        // 记录开始诊断
        self.log_diagnostic(
            DiagnosticEntry::info(format!("开始 UI Dump, 模式: {:?}", preferred_mode))
                .with_device(device_id)
        ).await;
        
        // 根据模式执行
        let result = match preferred_mode {
            DumpMode::Auto => self.execute_auto_mode(device_id, &config).await?,
            DumpMode::ExecOut => self.execute_exec_out(device_id, &config).await?,
            DumpMode::DumpPull => self.execute_dump_pull(device_id, &config).await?,
            DumpMode::A11y => self.execute_a11y(device_id, &config).await?,
        };
        
        // 更新设备兼容性缓存
        self.update_device_compat(device_id, &result).await;
        
        // 记录结果诊断
        let elapsed = start.elapsed().as_millis() as u64;
        if result.success {
            self.log_diagnostic(
                DiagnosticEntry::info(format!(
                    "UI Dump 成功: 模式={:?}, 耗时={}ms, 大小={}字符",
                    result.mode_used, elapsed, result.xml_length
                ))
                .with_device(device_id)
                .with_mode(result.mode_used)
                .with_elapsed(elapsed)
            ).await;
        } else {
            self.log_diagnostic(
                DiagnosticEntry::error(format!(
                    "UI Dump 失败: 模式={:?}, 错误={}",
                    result.mode_used, result.error.as_deref().unwrap_or("未知")
                ))
                .with_device(device_id)
                .with_mode(result.mode_used)
                .with_elapsed(elapsed)
            ).await;
        }
        
        Ok(result)
    }
    
    /// 执行 Auto 模式
    /// 
    /// 按优先级尝试：先检查设备兼容性缓存，否则按 A11y > ExecOut > DumpPull 顺序
    async fn execute_auto_mode(&self, device_id: &str, config: &UiDumpConfig) -> Result<DumpResult> {
        // 1. 检查设备兼容性缓存
        if let Some(cached_mode) = self.get_cached_mode(device_id, config).await {
            info!("📋 使用缓存模式: {:?} (device={})", cached_mode, device_id);
            
            // 使用缓存的模式
            let result = match cached_mode {
                DumpMode::ExecOut => self.execute_exec_out(device_id, config).await?,
                DumpMode::DumpPull => self.execute_dump_pull(device_id, config).await?,
                DumpMode::A11y => self.execute_a11y(device_id, config).await?,
                DumpMode::Auto => {
                    // 不应该缓存 Auto 模式，走正常探测流程
                    return self.probe_best_mode(device_id, config).await;
                }
            };
            
            // 如果缓存模式成功，直接返回
            if result.success {
                return Ok(result);
            }
            
            // 缓存模式失败，记录并继续探测
            self.log_diagnostic(
                DiagnosticEntry::warn(format!(
                    "缓存模式 {:?} 失败，开始重新探测",
                    cached_mode
                ))
                .with_device(device_id)
            ).await;
        }
        
        // 2. 没有缓存或缓存模式失败，按优先级探测
        self.probe_best_mode(device_id, config).await
    }
    
    /// 按优先级探测最佳模式
    async fn probe_best_mode(&self, device_id: &str, config: &UiDumpConfig) -> Result<DumpResult> {
        let priority_order = DumpMode::auto_priority_order();
        
        for mode in priority_order {
            // 跳过未实现的模式
            if !mode.is_implemented() {
                debug!("⏭️ 跳过未实现模式: {:?}", mode);
                continue;
            }
            
            info!("🔍 尝试模式: {:?}", mode);
            
            let result = match mode {
                DumpMode::ExecOut => self.execute_exec_out(device_id, config).await?,
                DumpMode::DumpPull => self.execute_dump_pull(device_id, config).await?,
                DumpMode::A11y => self.execute_a11y(device_id, config).await?,
                DumpMode::Auto => continue, // 跳过
            };
            
            if result.success {
                info!("✅ 模式 {:?} 成功", mode);
                return Ok(result);
            }
            
            warn!("⚠️ 模式 {:?} 失败: {}", mode, result.error.as_deref().unwrap_or("未知"));
        }
        
        // 所有模式都失败
        Ok(DumpResult::failure(
            device_id.to_string(),
            DumpMode::Auto,
            "所有模式均已失败".to_string(),
            0,
        ))
    }
    
    /// 执行 ExecOut 模式
    async fn execute_exec_out(&self, device_id: &str, config: &UiDumpConfig) -> Result<DumpResult> {
        let strategy = AdbStreamStrategy::new(config.exec_out_timeout_ms);
        strategy.capture(device_id).await
    }
    
    /// 执行 DumpPull 模式
    async fn execute_dump_pull(&self, device_id: &str, config: &UiDumpConfig) -> Result<DumpResult> {
        let strategy = AdbFileStrategy::new(config.dump_pull_timeout_ms);
        strategy.capture(device_id).await
    }
    
    /// 执行 A11y 模式
    async fn execute_a11y(&self, device_id: &str, config: &UiDumpConfig) -> Result<DumpResult> {
        // 端口暂时硬编码为 11451，后续可放入配置
        // 复用 exec_out_timeout_ms 作为超时时间
        let strategy = AndroidServiceStrategy::new(11451, config.exec_out_timeout_ms);
        strategy.capture(device_id).await
    }
    
    /// 获取设备缓存的模式
    async fn get_cached_mode(&self, device_id: &str, config: &UiDumpConfig) -> Option<DumpMode> {
        if let Some(entry) = config.device_compat_cache.get(device_id) {
            // 检查是否需要重新探测
            if entry.needs_reprobing() {
                debug!("🔄 设备 {} 需要重新探测（连续失败{}次）", device_id, entry.failure_count);
                return None;
            }
            
            return Some(entry.last_successful_mode);
        }
        None
    }
    
    /// 更新设备兼容性缓存
    async fn update_device_compat(&self, device_id: &str, result: &DumpResult) {
        let mut manager = self.config_manager.write().await;
        let config = manager.get_config_mut();
        
        if result.success {
            // 记录成功
            config.device_compat_cache
                .entry(device_id.to_string())
                .and_modify(|e| e.record_success(result.mode_used))
                .or_insert_with(|| DeviceCompatEntry::new(result.mode_used));
            
            debug!("💾 更新设备兼容性缓存: {} -> {:?}", device_id, result.mode_used);
        } else {
            // 记录失败
            if let Some(entry) = config.device_compat_cache.get_mut(device_id) {
                entry.record_failure();
            }
        }
        
        // 保存配置（异步，不阻塞）
        if let Err(e) = manager.save().await {
            warn!("⚠️ 保存配置失败: {}", e);
        }
    }
    
    /// 记录诊断日志
    async fn log_diagnostic(&self, entry: DiagnosticEntry) {
        let mut diagnostics = self.diagnostics.write().await;
        diagnostics.push(entry);
    }
    
    /// 测试指定模式
    pub async fn test_mode(&self, device_id: &str, mode: DumpMode) -> Result<DumpResult> {
        let config = {
            let manager = self.config_manager.read().await;
            manager.get_config().clone()
        };
        
        info!("🧪 测试模式: {:?}, device={}", mode, device_id);
        
        self.log_diagnostic(
            DiagnosticEntry::info(format!("开始测试模式: {:?}", mode))
                .with_device(device_id)
                .with_mode(mode)
        ).await;
        
        let result = match mode {
            DumpMode::Auto => self.execute_auto_mode(device_id, &config).await?,
            DumpMode::ExecOut => self.execute_exec_out(device_id, &config).await?,
            DumpMode::DumpPull => self.execute_dump_pull(device_id, &config).await?,
            DumpMode::A11y => self.execute_a11y(device_id, &config).await?,
        };
        
        // 记录测试结果
        let diag = if result.success {
            DiagnosticEntry::info(format!(
                "测试成功: 模式={:?}, 耗时={}ms, 大小={}字符",
                mode, result.elapsed_ms, result.xml_length
            ))
        } else {
            DiagnosticEntry::error(format!(
                "测试失败: 模式={:?}, 错误={}",
                mode, result.error.as_deref().unwrap_or("未知")
            ))
        };
        
        self.log_diagnostic(
            diag.with_device(device_id).with_mode(mode).with_elapsed(result.elapsed_ms)
        ).await;
        
        Ok(result)
    }
    
    /// 获取诊断日志
    pub async fn get_diagnostics(&self) -> Vec<DiagnosticEntry> {
        let diagnostics = self.diagnostics.read().await;
        diagnostics.get_all()
    }
    
    /// 清空诊断日志
    pub async fn clear_diagnostics(&self) {
        let mut diagnostics = self.diagnostics.write().await;
        diagnostics.clear();
    }
    
    /// 执行 UI Dump 并保存到文件
    /// 
    /// 结合 exec-out 快速模式和文件保存机制：
    /// 1. 使用首选模式（或 Auto）获取 XML
    /// 2. 将 XML 内容保存到 debug_xml 目录
    /// 3. 可选截图保存
    pub async fn dump_and_save(
        &self,
        device_id: &str,
        save_dir: Option<PathBuf>,
        take_screenshot: bool,
    ) -> Result<DumpAndSaveResult> {
        let start = Instant::now();
        
        info!("📦 UI Dump & Save 开始: device={}, screenshot={}", device_id, take_screenshot);
        
        self.log_diagnostic(
            DiagnosticEntry::info("开始 UI Dump & Save".to_string())
                .with_device(device_id)
        ).await;
        
        // 1. 执行 dump
        let dump_result = self.dump(device_id).await?;
        
        if !dump_result.success {
            return Ok(DumpAndSaveResult::from_dump_failure(dump_result));
        }
        
        // 2. 确定保存目录
        let save_dir = save_dir.unwrap_or_else(|| {
            crate::services::universal_ui_page_analyzer::get_debug_xml_dir()
        });
        
        // 确保目录存在
        if let Err(e) = std::fs::create_dir_all(&save_dir) {
            warn!("⚠️ 创建保存目录失败: {}", e);
            return Ok(DumpAndSaveResult {
                dump_result,
                xml_saved: false,
                xml_path: None,
                screenshot_saved: false,
                screenshot_path: None,
                total_elapsed_ms: start.elapsed().as_millis() as u64,
            });
        }
        
        // 3. 生成文件名
        let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S").to_string();
        let device_safe_id = device_id.replace(":", "_").replace(" ", "_");
        let xml_file_name = format!("ui_dump_{}_{}.xml", device_safe_id, timestamp);
        let xml_path = save_dir.join(&xml_file_name);
        
        // 4. 保存 XML 文件
        let xml_saved = if let Some(ref xml_content) = dump_result.xml_content {
            match std::fs::write(&xml_path, xml_content) {
                Ok(_) => {
                    info!("💾 XML 已保存: {}", xml_path.display());
                    true
                }
                Err(e) => {
                    warn!("⚠️ 保存 XML 失败: {}", e);
                    false
                }
            }
        } else {
            false
        };
        
        // 5. 可选截图
        let (screenshot_saved, screenshot_path) = if take_screenshot {
            let screenshot_file_name = format!("ui_dump_{}_{}.png", device_safe_id, timestamp);
            let screenshot_full_path = save_dir.join(&screenshot_file_name);
            
            match crate::screenshot_service::ScreenshotService::capture_screenshot_to_path(
                device_id,
                &screenshot_full_path,
            ) {
                Ok(abs_path) => {
                    info!("📸 截图已保存: {}", abs_path.display());
                    (true, Some(abs_path.to_string_lossy().to_string()))
                }
                Err(e) => {
                    warn!("⚠️ 截图失败: {}", e);
                    (false, None)
                }
            }
        } else {
            (false, None)
        };
        
        let total_elapsed = start.elapsed().as_millis() as u64;
        
        self.log_diagnostic(
            DiagnosticEntry::info(format!(
                "UI Dump & Save 完成: xml_saved={}, screenshot={}, 耗时={}ms",
                xml_saved, screenshot_saved, total_elapsed
            ))
            .with_device(device_id)
            .with_mode(dump_result.mode_used)
            .with_elapsed(total_elapsed)
        ).await;
        
        Ok(DumpAndSaveResult {
            dump_result,
            xml_saved,
            xml_path: if xml_saved { Some(xml_path.to_string_lossy().to_string()) } else { None },
            screenshot_saved,
            screenshot_path,
            total_elapsed_ms: total_elapsed,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_provider_creation() {
        let config_manager = Arc::new(RwLock::new(UiDumpConfigManager::new_memory()));
        let diagnostics = Arc::new(RwLock::new(DiagnosticsBuffer::new(50)));
        
        let provider = UiDumpProvider::new(config_manager, diagnostics);
        
        // 测试获取诊断日志（应该为空）
        let logs = provider.get_diagnostics().await;
        assert!(logs.is_empty());
    }
}
