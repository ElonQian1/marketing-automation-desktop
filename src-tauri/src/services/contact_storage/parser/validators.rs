/// 手机号码验证模块
/// 
/// 提供严格的中国大陆手机号码验证功能

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
/// **规则：**
/// - 11位数字
/// - 第一位必须是1
/// - 第二位必须是3-9
/// 
/// **支持格式：**
/// - 标准11位：`13912345678`
/// - 带国家码13位：`8613912345678`
/// 
/// # Examples
/// 
/// ```
/// use contact_storage::parser::validators::is_valid_phone_number;
/// 
/// assert!(is_valid_phone_number("13912345678"));
/// assert!(is_valid_phone_number("8613912345678"));
/// assert!(!is_valid_phone_number("12345678901")); // 第二位不是3-9
/// ```
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

/// 严格验证：确保号码符合所有规范
/// 
/// 比 `is_valid_phone_number` 更严格，会额外检查：
/// - 不包含非法字符
/// - 不包含过多分隔符
pub fn strict_validate(phone: &str) -> bool {
    // 首先提取纯数字
    let digits: String = phone.chars().filter(|c| c.is_ascii_digit()).collect();
    
    // 不能为空
    if digits.is_empty() {
        return false;
    }
    
    // 基础验证
    if !is_valid_phone_number(&digits) {
        return false;
    }
    
    // 检查原始字符串是否包含过多非数字字符（超过50%）
    let non_digit_count = phone.chars().filter(|c| !c.is_ascii_digit()).count();
    let digit_count = digits.len();
    
    // 如果非数字字符超过一半，可能是错误输入
    if non_digit_count > digit_count {
        return false;
    }
    
    true
}

/// 使用正则快速检测号码
/// 
/// 比完整验证更快，适合初步筛选
pub fn regex_detect(text: &str) -> bool {
    phone_regex().is_match(text)
}

/// 从文本中提取所有可能的号码片段
/// 
/// 返回所有匹配 11 位手机号模式的字符串
/// 
/// **智能处理：**
/// - 去除常见分隔符（空格、破折号、点号、括号、tab）
/// - 支持 emoji 和中文前缀
/// - 支持格式化号码如 `138-0013-8001`
pub fn extract_candidates(text: &str) -> Vec<String> {
    use std::collections::HashSet;
    
    let mut candidates = HashSet::new();
    
    // 策略1: 直接匹配（处理纯数字）
    for mat in phone_regex().find_iter(text) {
        let phone = mat.as_str();
        if is_valid_phone_number(phone) {
            candidates.insert(phone.to_string());
        }
    }
    
    // 策略2: 清理分隔符后匹配（处理格式化号码）
    // 替换所有分隔符为空格，然后提取连续数字
    let cleaned = text
        .chars()
        .map(|c| match c {
            '-' | '.' | '(' | ')' | '/' | '\\' | '\t' => ' ',
            _ => c,
        })
        .collect::<String>();
    
    // 从清理后的文本中提取连续数字串
    let digit_regex = Regex::new(r"\d+").unwrap();
    for mat in digit_regex.find_iter(&cleaned) {
        let digits = mat.as_str();
        
        // 提取11位数字（可能被分隔符打断）
        if digits.len() >= 11 {
            // 尝试所有可能的11位组合
            for i in 0..=digits.len().saturating_sub(11) {
                let candidate = &digits[i..i+11];
                if is_valid_phone_number(candidate) {
                    candidates.insert(candidate.to_string());
                    break; // 每个数字串只取第一个有效号码
                }
            }
        }
    }
    
    candidates.into_iter().collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_valid_numbers() {
        assert!(is_valid_phone_number("13912345678"));
        assert!(is_valid_phone_number("15800158001"));
        assert!(is_valid_phone_number("18600186001"));
        assert!(is_valid_phone_number("8613912345678")); // 带国家码
    }
    
    #[test]
    fn test_invalid_numbers() {
        assert!(!is_valid_phone_number("12345678901")); // 第二位不是3-9
        assert!(!is_valid_phone_number("12345")); // 太短
        assert!(!is_valid_phone_number("138001380011111")); // 太长
        assert!(!is_valid_phone_number("abc123def456")); // 含字母
        assert!(!is_valid_phone_number("10012345678")); // 第二位是0
    }
    
    #[test]
    fn test_strict_validate() {
        assert!(strict_validate("13912345678"));
        assert!(strict_validate("139-1234-5678")); // 允许少量分隔符
        assert!(!strict_validate("abc13912345678def")); // 过多非数字
        assert!(!strict_validate("😀13912345678😀😀")); // emoji
    }
    
    #[test]
    fn test_extract_candidates() {
        let text = "请联系张经理13912345678或李总15800158001";
        let numbers = extract_candidates(text);
        assert_eq!(numbers.len(), 2);
        assert!(numbers.contains(&"13912345678".to_string()));
        assert!(numbers.contains(&"15800158001".to_string()));
    }
    
    #[test]
    fn test_extract_with_separators() {
        // 测试各种分隔符格式
        let text = "138-0013-8001";
        let numbers = extract_candidates(text);
        assert_eq!(numbers.len(), 1);
        assert!(numbers.contains(&"13800138001".to_string()));
        
        let text = "138.001.38001";
        let numbers = extract_candidates(text);
        assert_eq!(numbers.len(), 1);
        
        let text = "(138)0013-8001";
        let numbers = extract_candidates(text);
        assert_eq!(numbers.len(), 1);
        
        let text = "带空格的 138 0013 8001";
        let numbers = extract_candidates(text);
        assert_eq!(numbers.len(), 1);
    }
    
    #[test]
    fn test_extract_with_mixed_content() {
        let text = "emoji号码😀13800138001";
        let numbers = extract_candidates(text);
        assert_eq!(numbers.len(), 1);
        assert_eq!(numbers[0], "13800138001");
        
        let text = "13800138001有效号码1";
        let numbers = extract_candidates(text);
        assert_eq!(numbers.len(), 1);
        
        let text = "带tab的\t13800138004";
        let numbers = extract_candidates(text);
        assert_eq!(numbers.len(), 1);
        assert_eq!(numbers[0], "13800138004");
    }
}
