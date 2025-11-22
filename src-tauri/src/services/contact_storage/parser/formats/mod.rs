/// 解析策略调度器
/// 
/// 实现策略链模式，按优先级尝试各种解析策略

pub mod csv_format;
pub mod plain_format;
pub mod mixed_text_format;

use super::types::ParsedContact;

/// 解析策略特征
trait ContactParseFormat {
    fn name(&self) -> &'static str;
    fn parse(&self, content: &str) -> Vec<ParsedContact>;
    fn priority(&self) -> u8; // 数字越小优先级越高
}

/// CSV 策略实现
struct CsvFormat;
impl ContactParseFormat for CsvFormat {
    fn name(&self) -> &'static str { "CSV Parser" }
    fn priority(&self) -> u8 { 1 } // 最高优先级
    fn parse(&self, content: &str) -> Vec<ParsedContact> {
        csv_format::parse_csv_text(content)
    }
}

/// 纯号码策略实现
struct PlainFormat;
impl ContactParseFormat for PlainFormat {
    fn name(&self) -> &'static str { "Plain Number Parser" }
    fn priority(&self) -> u8 { 2 }
    fn parse(&self, content: &str) -> Vec<ParsedContact> {
        plain_format::parse_plain_text(content)
    }
}

/// 混合文本策略实现
struct MixedTextFormat;
impl ContactParseFormat for MixedTextFormat {
    fn name(&self) -> &'static str { "Mixed Text Parser" }
    fn priority(&self) -> u8 { 3 } // 最低优先级（兜底）
    fn parse(&self, content: &str) -> Vec<ParsedContact> {
        mixed_text_format::parse_mixed_text(content)
    }
}

/// 策略链解析器
pub struct ContactFormatParser {
    formats: Vec<Box<dyn ContactParseFormat>>,
}

impl ContactFormatParser {
    /// 创建默认策略链
    pub fn new() -> Self {
        let mut formats: Vec<Box<dyn ContactParseFormat>> = vec![
            Box::new(CsvFormat),
            Box::new(PlainFormat),
            Box::new(MixedTextFormat),
        ];
        
        // 按优先级排序
        formats.sort_by_key(|s| s.priority());
        
        Self { formats }
    }
    
    /// 智能解析：依次尝试各策略，返回第一个有效结果
    pub fn parse_smart(&self, content: &str) -> Vec<ParsedContact> {
        for format in &self.formats {
            let result = format.parse(content);
            if !result.is_empty() {
                tracing::debug!("成功使用策略: {}, 解析到 {} 个号码", format.name(), result.len());
                return result;
            }
        }
        
        tracing::warn!("所有策略均未解析到有效号码");
        Vec::new()
    }
    
    /// 贪婪解析：尝试所有策略，合并结果
    pub fn parse_greedy(&self, content: &str) -> Vec<ParsedContact> {
        let mut all_results = Vec::new();
        
        for format in &self.formats {
            let result = format.parse(content);
            if !result.is_empty() {
                tracing::debug!("策略 {} 解析到 {} 个号码", format.name(), result.len());
                all_results.extend(result);
            }
        }
        
        all_results
    }
}

impl Default for ContactFormatParser {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_smart_parse_csv() {
        let parser = ContactFormatParser::new();
        let content = "张经理,13912345678\n李总监,13823456789";
        let result = parser.parse_smart(content);
        assert_eq!(result.len(), 2);
    }
    
    #[test]
    fn test_smart_parse_plain() {
        let parser = ContactFormatParser::new();
        let content = "13912345678\n15800158001";
        let result = parser.parse_smart(content);
        assert_eq!(result.len(), 2);
    }
    
    #[test]
    fn test_greedy_parse() {
        let parser = ContactFormatParser::new();
        // 混合内容：既有CSV又有纯号码
        let content = "张三,13912345678\n15800158001";
        let result = parser.parse_greedy(content);
        // greedy 模式会从多个策略中获取结果
        assert!(result.len() >= 2);
    }
}
