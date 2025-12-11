// src-tauri/src/modules/ui_dump/ui_dump_config.rs
// module: ui_dump | layer: infrastructure | role: config-persistence
// summary: UI Dump 配置持久化 - 读写 dump_config.json，管理模式设置和设备兼容性缓存

use anyhow::{Context, Result};
use std::path::PathBuf;
use tokio::fs;
use tracing::{debug, info, warn};

use super::ui_dump_types::{DumpMode, UiDumpConfig};

/// 配置文件名
const CONFIG_FILE_NAME: &str = "dump_config.json";

/// UI Dump 配置管理器
/// 
/// 负责配置的读取、修改和持久化
pub struct UiDumpConfigManager {
    config: UiDumpConfig,
    config_path: Option<PathBuf>,
    dirty: bool, // 标记配置是否有未保存的修改
}

impl UiDumpConfigManager {
    /// 创建新的配置管理器并加载配置
    /// 
    /// # Arguments
    /// * `app_data_dir` - 应用数据目录路径
    pub async fn new(app_data_dir: PathBuf) -> Result<Self> {
        let config_path = app_data_dir.join(CONFIG_FILE_NAME);
        
        let config = if config_path.exists() {
            // 加载现有配置
            match Self::load_from_file(&config_path).await {
                Ok(cfg) => {
                    info!("📂 已加载 UI Dump 配置: {:?}", config_path);
                    cfg
                }
                Err(e) => {
                    warn!("⚠️ 加载配置失败，使用默认配置: {}", e);
                    UiDumpConfig::default()
                }
            }
        } else {
            // 使用默认配置
            info!("📂 配置文件不存在，使用默认配置");
            UiDumpConfig::default()
        };
        
        Ok(Self {
            config,
            config_path: Some(config_path),
            dirty: false,
        })
    }
    
    /// 创建仅内存的配置管理器（用于测试）
    pub fn new_memory() -> Self {
        Self {
            config: UiDumpConfig::default(),
            config_path: None,
            dirty: false,
        }
    }
    
    /// 从文件加载配置
    async fn load_from_file(path: &PathBuf) -> Result<UiDumpConfig> {
        let content = fs::read_to_string(path)
            .await
            .context("读取配置文件失败")?;
        
        let config: UiDumpConfig = serde_json::from_str(&content)
            .context("解析配置文件失败")?;
        
        Ok(config)
    }
    
    /// 保存配置到文件
    pub async fn save(&mut self) -> Result<()> {
        if !self.dirty {
            debug!("配置未修改，跳过保存");
            return Ok(());
        }
        
        if let Some(ref path) = self.config_path {
            // 确保目录存在
            if let Some(parent) = path.parent() {
                fs::create_dir_all(parent)
                    .await
                    .context("创建配置目录失败")?;
            }
            
            let content = serde_json::to_string_pretty(&self.config)
                .context("序列化配置失败")?;
            
            fs::write(path, content)
                .await
                .context("写入配置文件失败")?;
            
            self.dirty = false;
            info!("💾 配置已保存: {:?}", path);
        }
        
        Ok(())
    }
    
    /// 强制保存配置（不检查 dirty 标记）
    pub async fn force_save(&mut self) -> Result<()> {
        self.dirty = true;
        self.save().await
    }
    
    /// 获取配置的只读引用
    pub fn get_config(&self) -> &UiDumpConfig {
        &self.config
    }
    
    /// 获取配置的可变引用
    pub fn get_config_mut(&mut self) -> &mut UiDumpConfig {
        self.dirty = true;
        &mut self.config
    }
    
    /// 设置首选模式
    pub fn set_preferred_mode(&mut self, mode: DumpMode) {
        if self.config.preferred_mode != mode {
            self.config.preferred_mode = mode;
            self.dirty = true;
            info!("⚙️ 首选模式已更改为: {:?}", mode);
        }
    }
    
    /// 获取首选模式
    pub fn get_preferred_mode(&self) -> DumpMode {
        self.config.preferred_mode
    }
    
    /// 设置 ExecOut 超时时间
    pub fn set_exec_out_timeout(&mut self, timeout_ms: u64) {
        if self.config.exec_out_timeout_ms != timeout_ms {
            self.config.exec_out_timeout_ms = timeout_ms;
            self.dirty = true;
            info!("⚙️ ExecOut 超时已更改为: {}ms", timeout_ms);
        }
    }
    
    /// 设置 DumpPull 超时时间
    pub fn set_dump_pull_timeout(&mut self, timeout_ms: u64) {
        if self.config.dump_pull_timeout_ms != timeout_ms {
            self.config.dump_pull_timeout_ms = timeout_ms;
            self.dirty = true;
            info!("⚙️ DumpPull 超时已更改为: {}ms", timeout_ms);
        }
    }
    
    /// 设置 A11y 超时时间
    pub fn set_a11y_timeout(&mut self, timeout_ms: u64) {
        if self.config.a11y_timeout_ms != timeout_ms {
            self.config.a11y_timeout_ms = timeout_ms;
            self.dirty = true;
            info!("⚙️ A11y 超时已更改为: {}ms", timeout_ms);
        }
    }
    
    /// 设置详细日志开关
    pub fn set_verbose_logging(&mut self, enabled: bool) {
        if self.config.verbose_logging != enabled {
            self.config.verbose_logging = enabled;
            self.dirty = true;
            info!("⚙️ 详细日志已{}", if enabled { "启用" } else { "禁用" });
        }
    }
    
    /// 清除设备兼容性缓存
    pub fn clear_device_compat_cache(&mut self) {
        if !self.config.device_compat_cache.is_empty() {
            self.config.device_compat_cache.clear();
            self.dirty = true;
            info!("🗑️ 设备兼容性缓存已清除");
        }
    }
    
    /// 清除特定设备的兼容性缓存
    pub fn clear_device_compat(&mut self, device_id: &str) {
        if self.config.device_compat_cache.remove(device_id).is_some() {
            self.dirty = true;
            info!("🗑️ 设备 {} 的兼容性缓存已清除", device_id);
        }
    }
    
    /// 重置为默认配置
    pub fn reset_to_default(&mut self) {
        self.config = UiDumpConfig::default();
        self.dirty = true;
        info!("🔄 配置已重置为默认值");
    }
    
    /// 检查是否有未保存的修改
    pub fn is_dirty(&self) -> bool {
        self.dirty
    }
}

/// 获取配置摘要（用于前端显示）
#[derive(Debug, Clone, serde::Serialize)]
pub struct ConfigSummary {
    pub preferred_mode: DumpMode,
    pub exec_out_timeout_ms: u64,
    pub dump_pull_timeout_ms: u64,
    pub a11y_timeout_ms: u64,
    pub device_compat_count: usize,
    pub verbose_logging: bool,
}

impl From<&UiDumpConfig> for ConfigSummary {
    fn from(config: &UiDumpConfig) -> Self {
        Self {
            preferred_mode: config.preferred_mode,
            exec_out_timeout_ms: config.exec_out_timeout_ms,
            dump_pull_timeout_ms: config.dump_pull_timeout_ms,
            a11y_timeout_ms: config.a11y_timeout_ms,
            device_compat_count: config.device_compat_cache.len(),
            verbose_logging: config.verbose_logging,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_memory_config_manager() {
        let manager = UiDumpConfigManager::new_memory();
        assert_eq!(manager.get_preferred_mode(), DumpMode::Auto);
        assert!(!manager.is_dirty());
    }
    
    #[test]
    fn test_set_mode_marks_dirty() {
        let mut manager = UiDumpConfigManager::new_memory();
        manager.set_preferred_mode(DumpMode::ExecOut);
        assert!(manager.is_dirty());
        assert_eq!(manager.get_preferred_mode(), DumpMode::ExecOut);
    }
    
    #[test]
    fn test_config_summary() {
        let config = UiDumpConfig::default();
        let summary = ConfigSummary::from(&config);
        assert_eq!(summary.preferred_mode, DumpMode::Auto);
        assert_eq!(summary.exec_out_timeout_ms, 3000);
    }
    
    #[test]
    fn test_reset_to_default() {
        let mut manager = UiDumpConfigManager::new_memory();
        manager.set_preferred_mode(DumpMode::DumpPull);
        manager.set_exec_out_timeout(5000);
        
        manager.reset_to_default();
        
        assert_eq!(manager.get_preferred_mode(), DumpMode::Auto);
        assert!(manager.is_dirty());
    }
}
