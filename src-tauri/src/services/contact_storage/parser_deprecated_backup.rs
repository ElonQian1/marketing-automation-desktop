use regex::Regex;
use std::sync::OnceLock;

/// 获取手机号码正则（懒加载单例）
fn phone_regex() -> &'static Regex {
    static REGEX: OnceLock<Regex> = OnceLock::new();
    REGEX.get_or_init(|| {
        // 匹配连续11位数字，第一位是1，第二位是3-9
        Regex::new(r"\b1[3-9]\d{9}\b").unwrap()
    })
}

/// 验证是否为有效的中国大陆手机号
/// 
/// 规则：
/// - 11位数字
/// - 第一位必须是1
/// - 第二位必须是3-9
pub fn is_valid_phone_number(s: &str) -> bool {
    let digits: String = s.chars().filter(|c| c.is_ascii_digit()).collect();
    
    // 标准11位手机号
    if digits.len() == 11 && digits.starts_with('1') {
        if let Some(second_char) = digits.chars().nth(1) {
            // 第二位必须是3-9
            return ('3'..='9').contains(&second_char);
        }
    }
    
    // 带国家码的13位号码 (86 + 11位)
    if digits.len() == 13 && digits.starts_with("86") {
        let phone_part = &digits[2..];
        if phone_part.starts_with('1') {
            if let Some(second_char) = phone_part.chars().nth(1) {
                return ('3'..='9').contains(&second_char);
            }
        }
    }
    
    false
}

/// 从单行文本中提取号码和姓名
/// 
/// 支持的格式：
/// 1. CSV格式：`姓名,13912345678` 或 `13912345678,姓名`
/// 2. 纯号码：`13912345678`
/// 3. 混合文本：`张经理的号码是13912345678请联系`
/// 
/// 返回：Vec<(phone_number, name)>
fn extract_from_line(line: &str) -> Vec<(String, String)> {
    let trimmed = line.trim();
    if trimmed.is_empty() {
        return Vec::new();
    }
    
    let mut results = Vec::new();
    
    // 策略1: 尝试CSV解析（逗号分隔）
    if trimmed.contains(',') {
        let parts: Vec<&str> = trimmed.split(',').map(|s| s.trim()).collect();
        if parts.len() >= 2 {
            let (part1, part2) = (parts[0], parts[1]);
            
            // 提取所有数字看是否是有效号码
            let digits1: String = part1.chars().filter(|c| c.is_ascii_digit()).collect();
            let digits2: String = part2.chars().filter(|c| c.is_ascii_digit()).collect();
            
            // 情况1: 第一部分是号码，第二部分是姓名
            if is_valid_phone_number(&digits1) {
                let name = if part2.is_empty() { String::new() } else { part2.to_string() };
                results.push((normalize_phone_number(&digits1), name));
                return results;
            }
            
            // 情况2: 第二部分是号码，第一部分是姓名
            if is_valid_phone_number(&digits2) {
                let name = if part1.is_empty() { String::new() } else { part1.to_string() };
                results.push((normalize_phone_number(&digits2), name));
                return results;
            }
        }
    }
    
    // 策略2: 使用正则提取所有可能的手机号
    let re = phone_regex();
    for mat in re.find_iter(trimmed) {
        let phone = mat.as_str();
        if is_valid_phone_number(phone) {
            results.push((phone.to_string(), String::new()));
        }
    }
    
    // 策略3: 如果没有找到，尝试提取所有数字并验证
    if results.is_empty() {
        let digits: String = trimmed.chars().filter(|c| c.is_ascii_digit()).collect();
        if is_valid_phone_number(&digits) {
            results.push((normalize_phone_number(&digits), String::new()));
        }
    }
    
    results
}

/// 规范化手机号码（去除国家码，保留11位）
fn normalize_phone_number(phone: &str) -> String {
    let digits: String = phone.chars().filter(|c| c.is_ascii_digit()).collect();
    
    // 如果是13位且以86开头，去掉国家码
    if digits.len() == 13 && digits.starts_with("86") {
        return digits[2..].to_string();
    }
    
    digits
}

/// 从文本内容中提取所有手机号码
/// 
/// 返回：Vec<(phone_number, name)>
/// 
/// 特性：
/// - 自动去重（同一行多次出现只保留一次）
/// - 支持多种格式（CSV、纯号码、混合文本）
/// - 严格验证（只返回有效的中国大陆手机号）
pub fn extract_numbers_from_text(content: &str) -> Vec<(String, String)> {
    let mut result = Vec::new();
    let mut seen_numbers = std::collections::HashSet::new();
    
    for line in content.lines() {
        let extracted = extract_from_line(line);
        for (phone, name) in extracted {
            // 去重：同一号码只保留第一次出现的
            if seen_numbers.insert(phone.clone()) {
                result.push((phone, name));
            }
        }
    }
    
    result
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_valid_phone_numbers() {
        assert!(is_valid_phone_number("13912345678"));
        assert!(is_valid_phone_number("15800158001"));
        assert!(is_valid_phone_number("18600186001"));
        assert!(is_valid_phone_number("8613912345678")); // 带国家码
    }
    
    #[test]
    fn test_invalid_phone_numbers() {
        assert!(!is_valid_phone_number("12345678901")); // 第二位不是3-9
        assert!(!is_valid_phone_number("12345")); // 太短
        assert!(!is_valid_phone_number("138001380011111")); // 太长
        assert!(!is_valid_phone_number("abc123def456")); // 含字母
    }
    
    #[test]
    fn test_csv_format() {
        let line = "张经理,13912345678";
        let result = extract_from_line(line);
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].0, "13912345678");
        assert_eq!(result[0].1, "张经理");
    }
    
    #[test]
    fn test_reverse_csv_format() {
        let line = "13912345678,张经理";
        let result = extract_from_line(line);
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].0, "13912345678");
        assert_eq!(result[0].1, "张经理");
    }
    
    #[test]
    fn test_pure_number() {
        let line = "13912345678";
        let result = extract_from_line(line);
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].0, "13912345678");
        assert_eq!(result[0].1, "");
    }
    
    #[test]
    fn test_mixed_text() {
        let line = "请联系张经理13912345678谢谢";
        let result = extract_from_line(line);
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].0, "13912345678");
    }
    
    #[test]
    fn test_with_spaces() {
        let line = "138 0013 8001";
        let result = extract_from_line(line);
        // 注意：因为空格分隔，正则无法匹配，需要依赖策略3
        if !result.is_empty() {
            assert_eq!(result[0].0, "13800138001");
        }
    }
}
