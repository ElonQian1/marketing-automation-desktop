// src-tauri/src/modules/ui_dump/ui_dump_diagnostics.rs
// module: ui_dump | layer: infrastructure | role: diagnostics-buffer
// summary: UI Dump 诊断系统 - 50条环形缓冲区，记录每次dump的模式/耗时/结果

use std::collections::VecDeque;
use tracing::debug;

use super::ui_dump_types::DiagnosticEntry;

/// 诊断日志环形缓冲区
/// 
/// 保留最近 N 条诊断记录，超出后自动丢弃最旧的记录。
/// 用于 AI 代理监控和用户调试。
pub struct DiagnosticsBuffer {
    buffer: VecDeque<DiagnosticEntry>,
    max_size: usize,
}

impl DiagnosticsBuffer {
    /// 创建新的诊断缓冲区
    /// 
    /// # Arguments
    /// * `max_size` - 最大保留条数（默认 50）
    pub fn new(max_size: usize) -> Self {
        Self {
            buffer: VecDeque::with_capacity(max_size),
            max_size,
        }
    }
    
    /// 添加诊断条目
    /// 
    /// 如果缓冲区已满，自动丢弃最旧的条目
    pub fn push(&mut self, entry: DiagnosticEntry) {
        // 如果已满，移除最旧的
        if self.buffer.len() >= self.max_size {
            self.buffer.pop_front();
        }
        
        debug!(
            "📊 诊断日志: [{:?}] {}",
            entry.level,
            entry.message
        );
        
        self.buffer.push_back(entry);
    }
    
    /// 获取所有诊断条目（从旧到新）
    pub fn get_all(&self) -> Vec<DiagnosticEntry> {
        self.buffer.iter().cloned().collect()
    }
    
    /// 获取最近 N 条诊断条目
    pub fn get_recent(&self, count: usize) -> Vec<DiagnosticEntry> {
        let len = self.buffer.len();
        let start = if len > count { len - count } else { 0 };
        self.buffer.iter().skip(start).cloned().collect()
    }
    
    /// 获取最新的一条诊断条目
    pub fn get_latest(&self) -> Option<&DiagnosticEntry> {
        self.buffer.back()
    }
    
    /// 获取当前条目数量
    pub fn len(&self) -> usize {
        self.buffer.len()
    }
    
    /// 检查是否为空
    pub fn is_empty(&self) -> bool {
        self.buffer.is_empty()
    }
    
    /// 清空所有诊断条目
    pub fn clear(&mut self) {
        self.buffer.clear();
        debug!("🗑️ 诊断日志已清空");
    }
    
    /// 获取最大容量
    pub fn capacity(&self) -> usize {
        self.max_size
    }
    
    /// 按设备 ID 过滤
    pub fn filter_by_device(&self, device_id: &str) -> Vec<DiagnosticEntry> {
        self.buffer
            .iter()
            .filter(|e| e.device_id.as_deref() == Some(device_id))
            .cloned()
            .collect()
    }
    
    /// 获取错误级别的条目
    pub fn get_errors(&self) -> Vec<DiagnosticEntry> {
        use super::ui_dump_types::DiagnosticLevel;
        self.buffer
            .iter()
            .filter(|e| e.level == DiagnosticLevel::Error)
            .cloned()
            .collect()
    }
    
    /// 获取警告级别的条目
    pub fn get_warnings(&self) -> Vec<DiagnosticEntry> {
        use super::ui_dump_types::DiagnosticLevel;
        self.buffer
            .iter()
            .filter(|e| e.level == DiagnosticLevel::Warn)
            .cloned()
            .collect()
    }
    
    /// 生成诊断摘要（用于 AI 代理）
    pub fn generate_summary(&self) -> DiagnosticSummary {
        use super::ui_dump_types::DiagnosticLevel;
        
        let total = self.buffer.len();
        let errors = self.buffer.iter().filter(|e| e.level == DiagnosticLevel::Error).count();
        let warnings = self.buffer.iter().filter(|e| e.level == DiagnosticLevel::Warn).count();
        let infos = self.buffer.iter().filter(|e| e.level == DiagnosticLevel::Info).count();
        
        // 计算平均耗时
        let elapsed_times: Vec<u64> = self.buffer
            .iter()
            .filter_map(|e| e.elapsed_ms)
            .collect();
        
        let avg_elapsed_ms = if elapsed_times.is_empty() {
            0.0
        } else {
            elapsed_times.iter().sum::<u64>() as f64 / elapsed_times.len() as f64
        };
        
        // 统计模式使用情况
        let mut mode_counts = std::collections::HashMap::new();
        for entry in &self.buffer {
            if let Some(mode) = entry.mode {
                *mode_counts.entry(mode).or_insert(0) += 1;
            }
        }
        
        DiagnosticSummary {
            total_entries: total,
            error_count: errors,
            warning_count: warnings,
            info_count: infos,
            avg_elapsed_ms,
            mode_usage: mode_counts,
            has_recent_errors: self.buffer.iter().rev().take(5).any(|e| e.level == DiagnosticLevel::Error),
        }
    }
}

/// 诊断摘要（用于前端显示和 AI 代理分析）
#[derive(Debug, Clone, serde::Serialize)]
pub struct DiagnosticSummary {
    /// 总条目数
    pub total_entries: usize,
    
    /// 错误数量
    pub error_count: usize,
    
    /// 警告数量
    pub warning_count: usize,
    
    /// 信息数量
    pub info_count: usize,
    
    /// 平均耗时（毫秒）
    pub avg_elapsed_ms: f64,
    
    /// 模式使用统计
    pub mode_usage: std::collections::HashMap<super::ui_dump_types::DumpMode, usize>,
    
    /// 最近5条是否有错误
    pub has_recent_errors: bool,
}

impl Default for DiagnosticsBuffer {
    fn default() -> Self {
        Self::new(50)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use super::super::ui_dump_types::{DiagnosticEntry, DiagnosticLevel, DumpMode};
    
    #[test]
    fn test_buffer_creation() {
        let buffer = DiagnosticsBuffer::new(50);
        assert_eq!(buffer.capacity(), 50);
        assert!(buffer.is_empty());
    }
    
    #[test]
    fn test_push_and_get() {
        let mut buffer = DiagnosticsBuffer::new(50);
        
        buffer.push(DiagnosticEntry::info("Test message 1"));
        buffer.push(DiagnosticEntry::warn("Test message 2"));
        buffer.push(DiagnosticEntry::error("Test message 3"));
        
        assert_eq!(buffer.len(), 3);
        
        let all = buffer.get_all();
        assert_eq!(all.len(), 3);
        assert_eq!(all[0].message, "Test message 1");
        assert_eq!(all[2].message, "Test message 3");
    }
    
    #[test]
    fn test_ring_buffer_overflow() {
        let mut buffer = DiagnosticsBuffer::new(3);
        
        buffer.push(DiagnosticEntry::info("Message 1"));
        buffer.push(DiagnosticEntry::info("Message 2"));
        buffer.push(DiagnosticEntry::info("Message 3"));
        buffer.push(DiagnosticEntry::info("Message 4"));
        
        assert_eq!(buffer.len(), 3);
        
        let all = buffer.get_all();
        assert_eq!(all[0].message, "Message 2");
        assert_eq!(all[2].message, "Message 4");
    }
    
    #[test]
    fn test_get_recent() {
        let mut buffer = DiagnosticsBuffer::new(10);
        
        for i in 1..=5 {
            buffer.push(DiagnosticEntry::info(format!("Message {}", i)));
        }
        
        let recent = buffer.get_recent(3);
        assert_eq!(recent.len(), 3);
        assert_eq!(recent[0].message, "Message 3");
        assert_eq!(recent[2].message, "Message 5");
    }
    
    #[test]
    fn test_filter_by_device() {
        let mut buffer = DiagnosticsBuffer::new(10);
        
        buffer.push(DiagnosticEntry::info("Message 1").with_device("device-a"));
        buffer.push(DiagnosticEntry::info("Message 2").with_device("device-b"));
        buffer.push(DiagnosticEntry::info("Message 3").with_device("device-a"));
        
        let filtered = buffer.filter_by_device("device-a");
        assert_eq!(filtered.len(), 2);
    }
    
    #[test]
    fn test_get_errors() {
        let mut buffer = DiagnosticsBuffer::new(10);
        
        buffer.push(DiagnosticEntry::info("Info"));
        buffer.push(DiagnosticEntry::error("Error 1"));
        buffer.push(DiagnosticEntry::warn("Warning"));
        buffer.push(DiagnosticEntry::error("Error 2"));
        
        let errors = buffer.get_errors();
        assert_eq!(errors.len(), 2);
    }
    
    #[test]
    fn test_summary() {
        let mut buffer = DiagnosticsBuffer::new(10);
        
        buffer.push(DiagnosticEntry::info("Info").with_mode(DumpMode::ExecOut).with_elapsed(100));
        buffer.push(DiagnosticEntry::error("Error").with_mode(DumpMode::ExecOut).with_elapsed(200));
        buffer.push(DiagnosticEntry::warn("Warn").with_mode(DumpMode::DumpPull).with_elapsed(300));
        
        let summary = buffer.generate_summary();
        assert_eq!(summary.total_entries, 3);
        assert_eq!(summary.error_count, 1);
        assert_eq!(summary.warning_count, 1);
        assert_eq!(summary.info_count, 1);
        assert!((summary.avg_elapsed_ms - 200.0).abs() < 0.01);
    }
    
    #[test]
    fn test_clear() {
        let mut buffer = DiagnosticsBuffer::new(10);
        buffer.push(DiagnosticEntry::info("Test"));
        assert!(!buffer.is_empty());
        
        buffer.clear();
        assert!(buffer.is_empty());
    }
}
