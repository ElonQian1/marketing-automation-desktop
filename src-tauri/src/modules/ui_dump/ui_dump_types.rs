// src-tauri/src/modules/ui_dump/ui_dump_types.rs
// module: ui_dump | layer: domain | role: types
// summary: UI Dump 模块核心类型定义 - DumpMode枚举、结果结构体、诊断条目、配置

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::{Duration, SystemTime};

// ============================================================================
// DumpMode - UI Dump 模式枚举
// ============================================================================

/// UI Dump 执行模式
/// 
/// 优先级顺序（Auto模式）: A11y > ExecOut > DumpPull
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, Default)]
#[serde(rename_all = "snake_case")]
pub enum DumpMode {
    /// 自动模式 - 按优先级尝试，失败自动降级
    #[default]
    Auto,
    
    /// ExecOut 快速模式 - `adb exec-out uiautomator dump /dev/stdout`
    /// 跳过文件 I/O，直接输出到 stdout，约快 30-40%
    ExecOut,
    
    /// DumpPull 传统模式 - `uiautomator dump /sdcard/ui_dump.xml && cat`
    /// 兼容性最好，作为兜底方案
    DumpPull,
    
    /// AccessibilityService 模式 - 通过 Android App 实时推送
    /// 最快速度，需要 Android 端 App 支持（预留）
    #[serde(rename = "a11y")]
    A11y,
}

impl DumpMode {
    /// 获取模式的显示名称
    pub fn display_name(&self) -> &'static str {
        match self {
            DumpMode::Auto => "自动 (推荐)",
            DumpMode::ExecOut => "ExecOut 快速模式",
            DumpMode::DumpPull => "DumpPull 兼容模式",
            DumpMode::A11y => "AccessibilityService (预留)",
        }
    }
    
    /// 获取模式的简短描述
    pub fn description(&self) -> &'static str {
        match self {
            DumpMode::Auto => "自动选择最优模式，失败时自动降级",
            DumpMode::ExecOut => "跳过文件I/O，直接输出到stdout，速度快30-40%",
            DumpMode::DumpPull => "传统方式，兼容性最好",
            DumpMode::A11y => "通过Android App实时获取，速度最快（需安装辅助App）",
        }
    }
    
    /// 是否已实现
    pub fn is_implemented(&self) -> bool {
        match self {
            DumpMode::Auto | DumpMode::ExecOut | DumpMode::DumpPull | DumpMode::A11y => true,
        }
    }
    
    /// 获取 Auto 模式的尝试顺序
    pub fn auto_priority_order() -> Vec<DumpMode> {
        vec![
            DumpMode::A11y,      // 最优先（如果可用）
            DumpMode::ExecOut,   // 次优先
            DumpMode::DumpPull,  // 兜底
        ]
    }
}

impl std::fmt::Display for DumpMode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.display_name())
    }
}

// ============================================================================
// DumpResult - Dump 执行结果
// ============================================================================

/// UI Dump 执行结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DumpResult {
    /// 是否成功
    pub success: bool,
    
    /// 实际使用的模式
    pub mode_used: DumpMode,
    
    /// XML 内容（成功时）
    pub xml_content: Option<String>,
    
    /// 错误信息（失败时）
    pub error: Option<String>,
    
    /// 执行耗时（毫秒）
    pub elapsed_ms: u64,
    
    /// 时间戳
    #[serde(with = "timestamp_serde")]
    pub timestamp: SystemTime,
    
    /// 设备 ID
    pub device_id: String,
    
    /// XML 内容长度（字符数）
    pub xml_length: usize,
}

impl DumpResult {
    /// 创建成功结果
    pub fn success(
        device_id: String,
        mode_used: DumpMode,
        xml_content: String,
        elapsed_ms: u64,
    ) -> Self {
        let xml_length = xml_content.len();
        Self {
            success: true,
            mode_used,
            xml_content: Some(xml_content),
            error: None,
            elapsed_ms,
            timestamp: SystemTime::now(),
            device_id,
            xml_length,
        }
    }
    
    /// 创建失败结果
    pub fn failure(
        device_id: String,
        mode_used: DumpMode,
        error: String,
        elapsed_ms: u64,
    ) -> Self {
        Self {
            success: false,
            mode_used,
            xml_content: None,
            error: Some(error),
            elapsed_ms,
            timestamp: SystemTime::now(),
            device_id,
            xml_length: 0,
        }
    }
}

// ============================================================================
// DumpAndSaveResult - Dump并保存结果
// ============================================================================

/// UI Dump 并保存的结果
/// 
/// 结合 exec-out 快速模式和文件保存机制
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DumpAndSaveResult {
    /// Dump 执行结果
    pub dump_result: DumpResult,
    
    /// XML 是否已保存
    pub xml_saved: bool,
    
    /// XML 文件保存路径
    pub xml_path: Option<String>,
    
    /// 截图是否已保存
    pub screenshot_saved: bool,
    
    /// 截图文件保存路径
    pub screenshot_path: Option<String>,
    
    /// 总耗时（毫秒）
    pub total_elapsed_ms: u64,
}

impl DumpAndSaveResult {
    /// 从 Dump 失败创建结果
    pub fn from_dump_failure(dump_result: DumpResult) -> Self {
        Self {
            total_elapsed_ms: dump_result.elapsed_ms,
            dump_result,
            xml_saved: false,
            xml_path: None,
            screenshot_saved: false,
            screenshot_path: None,
        }
    }
    
    /// 整体是否成功
    pub fn is_success(&self) -> bool {
        self.dump_result.success && self.xml_saved
    }
    
    /// 获取 XML 内容
    pub fn xml_content(&self) -> Option<&String> {
        self.dump_result.xml_content.as_ref()
    }
}

// ============================================================================
// DiagnosticEntry - 诊断日志条目
// ============================================================================

/// 诊断日志级别
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DiagnosticLevel {
    Info,
    Warn,
    Error,
    Debug,
}

/// 诊断日志条目
/// 用于 AI 代理监控和用户调试
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiagnosticEntry {
    /// 日志级别
    pub level: DiagnosticLevel,
    
    /// 日志消息
    pub message: String,
    
    /// 相关设备 ID
    pub device_id: Option<String>,
    
    /// 使用的模式
    pub mode: Option<DumpMode>,
    
    /// 执行耗时（毫秒）
    pub elapsed_ms: Option<u64>,
    
    /// 时间戳
    #[serde(with = "timestamp_serde")]
    pub timestamp: SystemTime,
    
    /// 上下文数据（用于 AI 代理分析）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context: Option<HashMap<String, String>>,
}

impl DiagnosticEntry {
    /// 创建信息级别日志
    pub fn info(message: impl Into<String>) -> Self {
        Self {
            level: DiagnosticLevel::Info,
            message: message.into(),
            device_id: None,
            mode: None,
            elapsed_ms: None,
            timestamp: SystemTime::now(),
            context: None,
        }
    }
    
    /// 创建警告级别日志
    pub fn warn(message: impl Into<String>) -> Self {
        Self {
            level: DiagnosticLevel::Warn,
            message: message.into(),
            device_id: None,
            mode: None,
            elapsed_ms: None,
            timestamp: SystemTime::now(),
            context: None,
        }
    }
    
    /// 创建错误级别日志
    pub fn error(message: impl Into<String>) -> Self {
        Self {
            level: DiagnosticLevel::Error,
            message: message.into(),
            device_id: None,
            mode: None,
            elapsed_ms: None,
            timestamp: SystemTime::now(),
            context: None,
        }
    }
    
    /// 设置设备 ID
    pub fn with_device(mut self, device_id: impl Into<String>) -> Self {
        self.device_id = Some(device_id.into());
        self
    }
    
    /// 设置模式
    pub fn with_mode(mut self, mode: DumpMode) -> Self {
        self.mode = Some(mode);
        self
    }
    
    /// 设置耗时
    pub fn with_elapsed(mut self, elapsed_ms: u64) -> Self {
        self.elapsed_ms = Some(elapsed_ms);
        self
    }
    
    /// 添加上下文
    pub fn with_context(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.context
            .get_or_insert_with(HashMap::new)
            .insert(key.into(), value.into());
        self
    }
}

// ============================================================================
// UiDumpConfig - 配置结构体
// ============================================================================

/// 设备兼容性缓存条目
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceCompatEntry {
    /// 上次成功的模式
    pub last_successful_mode: DumpMode,
    
    /// 上次更新时间
    #[serde(with = "timestamp_serde")]
    pub last_updated: SystemTime,
    
    /// 连续成功次数
    pub success_count: u32,
    
    /// 连续失败次数（用于判断是否需要重新探测）
    pub failure_count: u32,
}

impl DeviceCompatEntry {
    pub fn new(mode: DumpMode) -> Self {
        Self {
            last_successful_mode: mode,
            last_updated: SystemTime::now(),
            success_count: 1,
            failure_count: 0,
        }
    }
    
    /// 记录成功
    pub fn record_success(&mut self, mode: DumpMode) {
        self.last_successful_mode = mode;
        self.last_updated = SystemTime::now();
        self.success_count += 1;
        self.failure_count = 0;
    }
    
    /// 记录失败
    pub fn record_failure(&mut self) {
        self.failure_count += 1;
        self.last_updated = SystemTime::now();
    }
    
    /// 是否需要重新探测（连续失败3次后）
    pub fn needs_reprobing(&self) -> bool {
        self.failure_count >= 3
    }
}

/// UI Dump 配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UiDumpConfig {
    /// 用户选择的首选模式
    #[serde(default)]
    pub preferred_mode: DumpMode,
    
    /// ExecOut 超时时间（毫秒）- 超时后降级到 DumpPull
    #[serde(default = "default_exec_out_timeout")]
    pub exec_out_timeout_ms: u64,
    
    /// DumpPull 超时时间（毫秒）
    #[serde(default = "default_dump_pull_timeout")]
    pub dump_pull_timeout_ms: u64,
    
    /// A11y 超时时间（毫秒）
    #[serde(default = "default_a11y_timeout")]
    pub a11y_timeout_ms: u64,
    
    /// 设备兼容性缓存
    #[serde(default)]
    pub device_compat_cache: HashMap<String, DeviceCompatEntry>,
    
    /// 诊断日志保留条数
    #[serde(default = "default_diagnostic_buffer_size")]
    pub diagnostic_buffer_size: usize,
    
    /// 是否启用详细日志
    #[serde(default)]
    pub verbose_logging: bool,
}

fn default_exec_out_timeout() -> u64 { 3000 }   // 3秒
fn default_dump_pull_timeout() -> u64 { 15000 } // 15秒
fn default_a11y_timeout() -> u64 { 2000 }       // 2秒
fn default_diagnostic_buffer_size() -> usize { 50 }

impl Default for UiDumpConfig {
    fn default() -> Self {
        Self {
            preferred_mode: DumpMode::Auto,
            exec_out_timeout_ms: default_exec_out_timeout(),
            dump_pull_timeout_ms: default_dump_pull_timeout(),
            a11y_timeout_ms: default_a11y_timeout(),
            device_compat_cache: HashMap::new(),
            diagnostic_buffer_size: default_diagnostic_buffer_size(),
            verbose_logging: false,
        }
    }
}

// ============================================================================
// 辅助模块 - 时间戳序列化
// ============================================================================

mod timestamp_serde {
    use serde::{Deserialize, Deserializer, Serialize, Serializer};
    use std::time::{Duration, SystemTime, UNIX_EPOCH};
    
    pub fn serialize<S>(time: &SystemTime, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let duration = time.duration_since(UNIX_EPOCH).unwrap_or_default();
        duration.as_millis().serialize(serializer)
    }
    
    pub fn deserialize<'de, D>(deserializer: D) -> Result<SystemTime, D::Error>
    where
        D: Deserializer<'de>,
    {
        let millis = u128::deserialize(deserializer)?;
        Ok(UNIX_EPOCH + Duration::from_millis(millis as u64))
    }
}

// ============================================================================
// 测试
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_dump_mode_priority() {
        let order = DumpMode::auto_priority_order();
        assert_eq!(order[0], DumpMode::A11y);
        assert_eq!(order[1], DumpMode::ExecOut);
        assert_eq!(order[2], DumpMode::DumpPull);
    }
    
    #[test]
    fn test_dump_result_success() {
        let result = DumpResult::success(
            "device123".to_string(),
            DumpMode::ExecOut,
            "<xml>content</xml>".to_string(),
            150,
        );
        assert!(result.success);
        assert_eq!(result.mode_used, DumpMode::ExecOut);
        assert_eq!(result.xml_length, 18);
    }
    
    #[test]
    fn test_diagnostic_entry_builder() {
        let entry = DiagnosticEntry::info("Test message")
            .with_device("device123")
            .with_mode(DumpMode::ExecOut)
            .with_elapsed(150)
            .with_context("key", "value");
        
        assert_eq!(entry.level, DiagnosticLevel::Info);
        assert_eq!(entry.device_id, Some("device123".to_string()));
        assert_eq!(entry.mode, Some(DumpMode::ExecOut));
    }
    
    #[test]
    fn test_config_serialization() {
        let config = UiDumpConfig::default();
        let json = serde_json::to_string_pretty(&config).unwrap();
        let parsed: UiDumpConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.preferred_mode, DumpMode::Auto);
        assert_eq!(parsed.exec_out_timeout_ms, 3000);
    }
}
