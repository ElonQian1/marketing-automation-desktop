use regex::Regex;
use lazy_static::lazy_static;

lazy_static! {
    // 匹配 "147 likes", "20 comments" 等数字开头的动态文本 (英文)
    static ref RE_LEADING_NUM_EN: Regex = Regex::new(r"^\d+\s+").unwrap();
    // 匹配 "147赞", "1.2w收藏" 等中文数字混合
    static ref RE_LEADING_NUM_CN: Regex = Regex::new(r"^[\d\.]+[wW万kK]?\s*").unwrap();
    
    // 匹配 "3 mins ago", "2 hours ago" 等时间描述
    static ref RE_TIME_AGO: Regex = Regex::new(r"\d+\s+(mins?|hours?|days?|wks?|mos?|yrs?)\s+ago").unwrap();
    // 匹配 "3小时前", "昨天", "08-12" 等中文时间
    static ref RE_TIME_CN: Regex = Regex::new(r"(\d+[小时天周月年]+前|昨天|今天|刚刚|\d{2}-\d{2})").unwrap();
    
    // 匹配纯标点符号
    static ref RE_PUNCTUATION: Regex = Regex::new(r"^[[:punct:]]+$").unwrap();
}

/// 生成稳定的文本签名
/// 
/// 策略：
/// 1. 转小写
/// 2. 移除 "3 mins ago", "3小时前" 等时间干扰
/// 3. 移除 "147 likes", "147赞" 中的数字前缀
/// 4. 移除纯标点
pub fn get_stable_text_signature(text: &str) -> String {
    let mut s = text.trim().to_lowercase();

    // 1. 移除时间干扰
    if RE_TIME_AGO.is_match(&s) || RE_TIME_CN.is_match(&s) {
        return String::new();
    }

    // 2. 移除数字前缀 (英文)
    s = RE_LEADING_NUM_EN.replace(&s, "").to_string();
    // 3. 移除数字前缀 (中文/混合) - 比如 "147赞" -> "赞"
    s = RE_LEADING_NUM_CN.replace(&s, "").to_string();

    // 4. 移除纯标点 (e.g. "..." -> "")
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
        assert_eq!(get_stable_text_signature("147赞"), "赞");
        assert_eq!(get_stable_text_signature("1.2w 收藏"), "收藏");
        assert_eq!(get_stable_text_signature("3 mins ago"), "");
        assert_eq!(get_stable_text_signature("3小时前"), "");
        assert_eq!(get_stable_text_signature("..."), "");
        assert_eq!(get_stable_text_signature("Title Text"), "title text");
    }
}
