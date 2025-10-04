/// 解析器相关类型定义
/// 
/// 提供号码解析所需的基础数据结构

use serde::{Deserialize, Serialize};

/// 解析结果：(号码, 姓名)
pub type ParsedContact = (String, String);

/// 解析统计信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParseStats {
    /// 总行数
    pub total_lines: usize,
    /// 解析成功的号码数
    pub parsed_count: usize,
    /// 无效号码数
    pub invalid_count: usize,
    /// 重复号码数
    pub duplicate_count: usize,
}

impl ParseStats {
    pub fn new() -> Self {
        Self {
            total_lines: 0,
            parsed_count: 0,
            invalid_count: 0,
            duplicate_count: 0,
        }
    }
}

/// 解析结果（带统计）
#[derive(Debug, Clone)]
pub struct ParseResult {
    /// 成功解析的联系人列表
    pub contacts: Vec<ParsedContact>,
    /// 统计信息
    pub stats: ParseStats,
}

impl ParseResult {
    pub fn new(contacts: Vec<ParsedContact>) -> Self {
        let stats = ParseStats {
            total_lines: contacts.len(),
            parsed_count: contacts.len(),
            invalid_count: 0,
            duplicate_count: 0,
        };
        Self { contacts, stats }
    }
    
    pub fn with_stats(contacts: Vec<ParsedContact>, stats: ParseStats) -> Self {
        Self { contacts, stats }
    }
}
