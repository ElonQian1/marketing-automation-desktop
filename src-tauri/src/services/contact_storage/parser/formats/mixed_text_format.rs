/// 混合文本解析策略
/// 
/// 从包含多种内容的文本中提取手机号

use super::super::validators;
use super::super::types::ParsedContact;

/// 解析混合文本行
/// 
/// **支持场景：**
/// - `请联系张经理13912345678谢谢`
/// - `13800138001有效号码1`
/// - `张经理的号码是13912345678`
pub fn parse_mixed_line(line: &str) -> Vec<ParsedContact> {
    let trimmed = line.trim();
    
    if trimmed.is_empty() {
        return Vec::new();
    }
    
    // 使用正则提取所有候选号码
    validators::extract_candidates(trimmed)
        .into_iter()
        .map(|phone| (phone, String::new()))
        .collect()
}

/// 批量解析混合文本
pub fn parse_mixed_text(content: &str) -> Vec<ParsedContact> {
    content
        .lines()
        .flat_map(parse_mixed_line)
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_parse_mixed_line() {
        let result = parse_mixed_line("请联系张经理13912345678谢谢");
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].0, "13912345678");
        
        let result = parse_mixed_line("13800138001有效号码1");
        assert_eq!(result.len(), 1);
        
        let result = parse_mixed_line("没有号码的行");
        assert_eq!(result.len(), 0);
    }
    
    #[test]
    fn test_multiple_phones_in_line() {
        let result = parse_mixed_line("联系A:13912345678或B:15800158001");
        assert_eq!(result.len(), 2);
    }
}
