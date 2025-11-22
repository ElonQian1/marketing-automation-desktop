/// CSV 格式解析策略
/// 
/// 专门处理 `姓名,号码` 或 `号码,姓名` 格式

use super::super::{validators, normalizers};
use super::super::types::ParsedContact;

/// 解析单行 CSV 格式
/// 
/// **支持格式：**
/// - `张经理,13912345678`
/// - `13912345678,张经理`
/// - `,13912345678` （逗号开头）
/// - `13912345678,` （逗号结尾）
pub fn parse_csv_line(line: &str) -> Vec<ParsedContact> {
    let trimmed = line.trim();
    
    if trimmed.is_empty() || !trimmed.contains(',') {
        return Vec::new();
    }
    
    let parts: Vec<&str> = trimmed.split(',').map(|s| s.trim()).collect();
    
    if parts.len() < 2 {
        return Vec::new();
    }
    
    let (part1, part2) = (parts[0], parts[1]);
    
    // 提取纯数字
    let digits1 = normalizers::clean_phone_number(part1);
    let digits2 = normalizers::clean_phone_number(part2);
    
    // 情况1: 第一部分是号码，第二部分是姓名
    if validators::is_valid_phone_number(&digits1) {
        let name = if part2.is_empty() { String::new() } else { part2.to_string() };
        let phone = normalizers::normalize_phone_number(&digits1);
        return vec![(phone, name)];
    }
    
    // 情况2: 第二部分是号码，第一部分是姓名
    if validators::is_valid_phone_number(&digits2) {
        let name = if part1.is_empty() { String::new() } else { part1.to_string() };
        let phone = normalizers::normalize_phone_number(&digits2);
        return vec![(phone, name)];
    }
    
    Vec::new()
}

/// 批量解析 CSV 格式文本
pub fn parse_csv_text(content: &str) -> Vec<ParsedContact> {
    content
        .lines()
        .flat_map(parse_csv_line)
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_parse_csv_line() {
        // 姓名在前
        let result = parse_csv_line("张经理,13912345678");
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].0, "13912345678");
        assert_eq!(result[0].1, "张经理");
        
        // 号码在前
        let result = parse_csv_line("13912345678,张经理");
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].0, "13912345678");
        assert_eq!(result[0].1, "张经理");
        
        // 逗号开头
        let result = parse_csv_line(",15800158020");
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].0, "15800158020");
        assert_eq!(result[0].1, "");
    }
    
    #[test]
    fn test_parse_csv_text() {
        let content = "张经理,13912345678\n李总监,13823456789\n王部长,13734567890";
        let result = parse_csv_text(content);
        assert_eq!(result.len(), 3);
    }
}
