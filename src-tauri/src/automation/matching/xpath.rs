// src-tauri/src/automation/matching/xpath.rs
// module: automation | layer: matching | role: XPath解析工具
// summary: 提供从XPath中提取属性、过滤条件等功能的工具函数

/// 从 XPath 提取 content-desc 的值
/// 
/// 例如：`//*[@content-desc='添加朋友']` -> `"添加朋友"`
pub fn extract_content_desc_from_xpath(xpath: &str) -> String {
    if let Some(start_idx) = xpath.find("@content-desc=") {
        let value_start = start_idx + "@content-desc=".len();
        
        // 跳过引号（单引号或双引号）
        let rest = &xpath[value_start..];
        let quote_char = if rest.starts_with('\'') { '\'' } else if rest.starts_with('"') { '"' } else { return String::new() };
        
        // 提取引号之间的内容
        if let Some(value) = rest.strip_prefix(quote_char) {
            if let Some(end_idx) = value.find(quote_char) {
                return value[..end_idx].to_string();
            }
        }
    }
    
    String::new()
}

/// 从XPath提取resource-id
pub fn extract_resource_id_from_xpath(xpath: &str) -> String {
    if let Some(start) = xpath.find("@resource-id='") {
        let start = start + 14; // "@resource-id='"的长度
        if let Some(end) = xpath[start..].find("'") {
            return xpath[start..start + end].to_string();
        }
    }
    String::new()
}

/// 从XPath提取子元素文本过滤条件
/// 
/// 匹配模式: [.//*[@text='文本']] 或 [.//*[@content-desc='文本']]
pub fn extract_child_text_filter_from_xpath(xpath: &str) -> Option<String> {
    // 匹配模式: [.//*[@text='文本']]
    if let Some(start) = xpath.find("[.//*[@text='") {
        let start = start + 13; // "[.//*[@text='"的长度
        if let Some(end) = xpath[start..].find("']]") {
            return Some(xpath[start..start + end].to_string());
        }
    }
    // 匹配模式: [.//*[@content-desc='文本']]
    if let Some(start) = xpath.find("[.//*[@content-desc='") {
        let start = start + 21; // "[.//*[@content-desc='"的长度
        if let Some(end) = xpath[start..].find("']]") {
            return Some(xpath[start..start + end].to_string());
        }
    }
    None
}
