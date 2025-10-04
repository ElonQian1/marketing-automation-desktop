/// 纯号码格式解析策略
/// 
/// 处理每行一个号码的简单格式

use super::super::{validators, normalizers};
use super::super::types::ParsedContact;

/// 解析单行纯号码
/// 
/// **支持格式：**
/// - `13912345678`
/// - `139 1234 5678` （带空格）
/// - `139-1234-5678` （带破折号）
pub fn parse_plain_line(line: &str) -> Vec<ParsedContact> {
    let trimmed = line.trim();
    
    if trimmed.is_empty() {
        return Vec::new();
    }
    
    // 提取纯数字
    let digits = normalizers::clean_phone_number(trimmed);
    
    // 验证
    if validators::is_valid_phone_number(&digits) {
        let phone = normalizers::normalize_phone_number(&digits);
        return vec![(phone, String::new())];
    }
    
    Vec::new()
}

/// 批量解析纯号码文本
pub fn parse_plain_text(content: &str) -> Vec<ParsedContact> {
    content
        .lines()
        .flat_map(parse_plain_line)
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_parse_plain_line() {
        assert_eq!(parse_plain_line("13912345678").len(), 1);
        assert_eq!(parse_plain_line("139 1234 5678").len(), 1);
        assert_eq!(parse_plain_line("139-1234-5678").len(), 1);
        assert_eq!(parse_plain_line("invalid").len(), 0);
    }
    
    #[test]
    fn test_parse_plain_text() {
        let content = "13912345678\n15800158001\n18600186001";
        let result = parse_plain_text(content);
        assert_eq!(result.len(), 3);
    }
}
