// src-tauri/src/services/resource_monitor.rs
// module: services | layer: infrastructure | role: 开发模式资源泄漏监控
// summary: 监控内存/连接数，防止开发模式蓝屏

use tracing::{warn, error};
use std::time::{Duration, Instant};
use sysinfo::{System, SystemExt, ProcessExt};

/// 资源监控器配置
pub struct ResourceMonitorConfig {
    /// 内存警告阈值(MB)
    pub memory_warning_threshold_mb: u64,
    /// 内存危险阈值(MB)
    pub memory_danger_threshold_mb: u64,
    /// 检查间隔
    pub check_interval: Duration,
}

impl Default for ResourceMonitorConfig {
    fn default() -> Self {
        Self {
            memory_warning_threshold_mb: 800,  // 800MB警告
            memory_danger_threshold_mb: 1500,  // 1.5GB危险
            check_interval: Duration::from_secs(30),
        }
    }
}

/// 资源监控器
pub struct ResourceMonitor {
    config: ResourceMonitorConfig,
    system: System,
    last_check: Instant,
    warning_count: u32,
}

impl ResourceMonitor {
    pub fn new(config: ResourceMonitorConfig) -> Self {
        Self {
            config,
            system: System::new_all(),
            last_check: Instant::now(),
            warning_count: 0,
        }
    }

    /// 检查当前进程资源使用情况
    pub fn check_resources(&mut self) -> ResourceStatus {
        // 限制检查频率
        if self.last_check.elapsed() < self.check_interval {
            return ResourceStatus::Normal;
        }
        
        self.last_check = Instant::now();
        self.system.refresh_all();

        let current_pid = sysinfo::get_current_pid().ok();
        
        if let Some(pid) = current_pid {
            if let Some(process) = self.system.process(pid) {
                let memory_mb = process.memory() / 1024 / 1024;
                
                // 检查内存使用
                if memory_mb > self.config.memory_danger_threshold_mb {
                    error!(
                        "🚨 内存使用危险: {}MB (阈值: {}MB) - 建议重启应用",
                        memory_mb,
                        self.config.memory_danger_threshold_mb
                    );
                    return ResourceStatus::Danger { memory_mb };
                } else if memory_mb > self.config.memory_warning_threshold_mb {
                    self.warning_count += 1;
                    warn!(
                        "⚠️ 内存使用警告: {}MB (阈值: {}MB) - 第{}次警告",
                        memory_mb,
                        self.config.memory_warning_threshold_mb,
                        self.warning_count
                    );
                    return ResourceStatus::Warning { 
                        memory_mb,
                        warning_count: self.warning_count,
                    };
                } else {
                    // 重置警告计数
                    if self.warning_count > 0 {
                        self.warning_count = 0;
                    }
                }
            }
        }

        ResourceStatus::Normal
    }

    pub fn get_config(&self) -> &ResourceMonitorConfig {
        &self.config
    }
}

#[derive(Debug, Clone, PartialEq)]
pub enum ResourceStatus {
    Normal,
    Warning { memory_mb: u64, warning_count: u32 },
    Danger { memory_mb: u64 },
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_monitor_creation() {
        let monitor = ResourceMonitor::new(ResourceMonitorConfig::default());
        assert_eq!(monitor.warning_count, 0);
    }

    #[test]
    fn test_check_frequency_limit() {
        let mut monitor = ResourceMonitor::new(ResourceMonitorConfig {
            check_interval: Duration::from_secs(60),
            ..Default::default()
        });

        // 首次检查
        let status1 = monitor.check_resources();
        
        // 立即第二次检查应该被限制
        let status2 = monitor.check_resources();
        
        // 两次都应该返回Normal（第二次被跳过）
        assert_eq!(status2, ResourceStatus::Normal);
    }
}
