use regex::Regex;
use lazy_static::lazy_static;

lazy_static! {
    // 匹配 "147 likes", "20 comments" 等数字开头的动态文本
    static ref RE_LEADING_NUM: Regex = Regex::new(r"^\d+\s+").unwrap();
    // 匹配 "3 mins ago", "2 hours ago" 等时间描述
    static ref RE_TIME_AGO: Regex = Regex::new(r"\d+\s+(mins?|hours?|days?|wks?|mos?|yrs?)\s+ago").unwrap();
    // 匹配纯标点符号
    static ref RE_PUNCTUATION: Regex = Regex::new(r"^[[:punct:]]+$").unwrap();
}

/// 生成稳定的文本签名
/// 
/// 策略：
/// 1. 转小写
/// 2. 移除 "3 mins ago" 等时间干扰
/// 3. 移除 "147 likes" 中的数字前缀
/// 4. 移除纯标点
pub fn get_stable_text_signature(text: &str) -> String {
    let mut s = text.trim().to_lowercase();

    // 1. 移除时间干扰 (e.g. "3 mins ago" -> "")
    if RE_TIME_AGO.is_match(&s) {
        return String::new();
    }

    // 2. 移除数字前缀 (e.g. "147 likes" -> "likes")
    s = RE_LEADING_NUM.replace(&s, "").to_string();

    // 3. 移除纯标点 (e.g. "..." -> "")
    if RE_PUNCTUATION.is_match(&s) {
        return String::new();
    }

    s.trim().to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_stable_text() {
        assert_eq!(get_stable_text_signature("147 Likes"), "likes");
        assert_eq!(get_stable_text_signature("3 mins ago"), "");
        assert_eq!(get_stable_text_signature("..."), "");
        assert_eq!(get_stable_text_signature("Title Text"), "title text");
    }
}
