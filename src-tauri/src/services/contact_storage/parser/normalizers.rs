/// 手机号码规范化模块
/// 
/// 提供号码清理、格式化、标准化功能

/// 规范化手机号码（去除国家码，保留11位）
/// 
/// **处理规则：**
/// - 13位且以86开头 → 去掉国家码
/// - 其他情况 → 提取纯数字
/// 
/// # Examples
/// 
/// ```
/// use contact_storage::parser::normalizers::normalize_phone_number;
/// 
/// assert_eq!(normalize_phone_number("8613912345678"), "13912345678");
/// assert_eq!(normalize_phone_number("139-1234-5678"), "13912345678");
/// ```
pub fn normalize_phone_number(phone: &str) -> String {
    let digits: String = phone.chars().filter(|c| c.is_ascii_digit()).collect();
    
    // 如果是13位且以86开头，去掉国家码
    if digits.len() == 13 && digits.starts_with("86") {
        return digits[2..].to_string();
    }
    
    digits
}

/// 清理号码：去除所有分隔符和空格
/// 
/// 保留数字，移除：空格、破折号、括号、点号等
pub fn clean_phone_number(phone: &str) -> String {
    phone.chars().filter(|c| c.is_ascii_digit()).collect()
}

/// 从混合文本中提取纯号码
/// 
/// 处理场景：`号码：13912345678（工作）` → `13912345678`
pub fn extract_pure_number(text: &str) -> Option<String> {
    let cleaned = clean_phone_number(text);
    
    if cleaned.is_empty() {
        return None;
    }
    
    Some(normalize_phone_number(&cleaned))
}

/// 格式化号码为易读形式
/// 
/// `13912345678` → `139-1234-5678`
pub fn format_phone_number(phone: &str) -> String {
    let cleaned = clean_phone_number(phone);
    
    if cleaned.len() == 11 {
        format!("{}-{}-{}", &cleaned[0..3], &cleaned[3..7], &cleaned[7..11])
    } else {
        cleaned
    }
}

/// 批量规范化
pub fn normalize_batch(phones: &[String]) -> Vec<String> {
    phones.iter().map(|p| normalize_phone_number(p)).collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_normalize() {
        assert_eq!(normalize_phone_number("8613912345678"), "13912345678");
        assert_eq!(normalize_phone_number("139-1234-5678"), "13912345678");
        assert_eq!(normalize_phone_number("(139) 1234-5678"), "13912345678");
    }
    
    #[test]
    fn test_clean() {
        assert_eq!(clean_phone_number("139 1234 5678"), "13912345678");
        assert_eq!(clean_phone_number("139-1234-5678"), "13912345678");
        assert_eq!(clean_phone_number("+86 139 1234 5678"), "8613912345678");
    }
    
    #[test]
    fn test_extract() {
        assert_eq!(extract_pure_number("号码：13912345678（工作）"), Some("13912345678".to_string()));
        assert_eq!(extract_pure_number("联系方式: +86 139 1234 5678"), Some("13912345678".to_string()));
        assert_eq!(extract_pure_number("无效内容"), None);
    }
    
    #[test]
    fn test_format() {
        assert_eq!(format_phone_number("13912345678"), "139-1234-5678");
        assert_eq!(format_phone_number("139 1234 5678"), "139-1234-5678");
    }
}
