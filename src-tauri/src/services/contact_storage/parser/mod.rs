/// 号码解析器模块
/// 
/// 提供统一的号码解析 API，内部使用策略模式处理多种格式

pub mod types;
pub mod validators;
pub mod normalizers;
pub mod deduplicator;
pub mod strategies;

use types::{ParseStats, ParseResult};
use deduplicator::deduplicate_by_phone;
use strategies::StrategyChainParser;

/// 主解析函数：从文本中提取联系人号码
/// 
/// 自动检测格式并使用最合适的解析策略
/// 
/// # 参数
/// - `content`: 输入文本内容
/// 
/// # 返回
/// - `ParseResult`: 包含解析出的联系人列表和统计信息
/// 
/// # 示例
/// ```
/// let result = extract_numbers_from_text("张经理,13912345678\n李总监,13823456789");
/// assert_eq!(result.contacts.len(), 2);
/// ```
pub fn extract_numbers_from_text(content: &str) -> ParseResult {
    let start_time = std::time::Instant::now();
    
    // 使用策略链解析器智能解析
    let parser = StrategyChainParser::new();
    let mut contacts = parser.parse_smart(content);
    
    // 记录解析前的数量
    let before_dedup = contacts.len();
    
    // 去重（保留第一个）
    contacts = deduplicate_by_phone(contacts);
    
    let after_dedup = contacts.len();
    let duplicates_removed = before_dedup.saturating_sub(after_dedup);
    
    let elapsed = start_time.elapsed();
    
    let stats = ParseStats {
        total_lines: before_dedup, // 原始解析数量
        parsed_count: after_dedup,  // 去重后数量
        invalid_count: 0, // 已在策略中过滤
        duplicate_count: duplicates_removed,
    };
    
    tracing::info!(
        "解析完成: {} 个号码, 耗时 {}ms, 去重 {} 个",
        stats.parsed_count, elapsed.as_millis(), stats.duplicate_count
    );
    
    ParseResult { contacts, stats }
}

/// 贪婪解析：尝试所有策略并合并结果
/// 
/// 适用于格式混合的复杂文本
pub fn extract_numbers_greedy(content: &str) -> ParseResult {
    let start_time = std::time::Instant::now();
    
    let parser = StrategyChainParser::new();
    let mut contacts = parser.parse_greedy(content);
    
    let before_dedup = contacts.len();
    contacts = deduplicate_by_phone(contacts);
    let after_dedup = contacts.len();
    
    let elapsed = start_time.elapsed();
    
    let stats = ParseStats {
        total_lines: before_dedup,
        parsed_count: after_dedup,
        invalid_count: 0,
        duplicate_count: before_dedup.saturating_sub(after_dedup),
    };
    
    ParseResult { contacts, stats }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_extract_csv_format() {
        let content = "张三,13912345678\n李四,13823456789";
        let result = extract_numbers_from_text(content);
        assert_eq!(result.contacts.len(), 2);
        assert_eq!(result.stats.parsed_count, 2);
    }
    
    #[test]
    fn test_extract_plain_format() {
        let content = "13912345678\n13823456789\n15800158001";
        let result = extract_numbers_from_text(content);
        assert_eq!(result.contacts.len(), 3);
    }
    
    #[test]
    fn test_extract_mixed_format() {
        let content = "客户号码：13912345678，请联系";
        let result = extract_numbers_from_text(content);
        assert!(result.contacts.len() >= 1);
    }
    
    #[test]
    fn test_deduplication() {
        let content = "13912345678\n13912345678\n13823456789";
        let result = extract_numbers_from_text(content);
        assert_eq!(result.contacts.len(), 2);
        assert_eq!(result.stats.duplicate_count, 1);
    }
    
    #[test]
    fn test_greedy_mode() {
        let content = "张三,13912345678\n15800158001\n客户：13823456789";
        let result = extract_numbers_greedy(content);
        assert!(result.contacts.len() >= 3);
    }
}
