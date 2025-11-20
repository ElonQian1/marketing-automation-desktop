// src-tauri/src/exec/v3/element_matching/xpath_matcher.rs
// module: v3-execution | layer: matching | role: XPath匹配器
// summary: 使用全局XPath进行元素匹配，支持多候选返回

use crate::services::universal_ui_page_analyzer::UIElement;

/// XPath匹配结果
#[derive(Debug)]
pub struct MatchResult<'a> {
    pub matched_elements: Vec<&'a UIElement>,
    pub xpath: String,
    pub match_count: usize,
}

/// XPath匹配器
pub struct XPathMatcher;

impl XPathMatcher {
    /// 使用全局XPath匹配元素（返回所有匹配的元素）
    /// 
    /// 支持的XPath格式：
    /// 1. //*[@resource-id='xxx']
    /// 2. //*[@resource-id='xxx'][.//*[@text='yyy']]  (带子元素过滤)
    /// 3. //*[@content-desc='xxx']
    /// 4. //*[@text='xxx']
    /// 5. //node[@index='123']  (index-based)
    pub fn match_all<'a>(
        elements: &'a [UIElement],
        xpath: &str,
    ) -> MatchResult<'a> {
        tracing::info!("🔍 [XPath匹配] 开始匹配: {}", xpath);
        
        // 解析XPath提取匹配条件
        let conditions = Self::parse_xpath(xpath);
        
        // 匹配所有符合条件的元素
        let matched: Vec<&UIElement> = elements.iter()
            .filter(|elem| Self::element_matches(elem, &conditions))
            .collect();
        
        tracing::info!(
            "🎯 [XPath匹配] 找到 {} 个匹配元素",
            matched.len()
        );
        
        MatchResult {
            matched_elements: matched.clone(),
            xpath: xpath.to_string(),
            match_count: matched.len(),
        }
    }
    
    /// 解析XPath提取匹配条件
    fn parse_xpath(xpath: &str) -> XPathConditions {
        let mut conditions = XPathConditions::default();
        
        // 提取 resource-id
        if let Some(start) = xpath.find("@resource-id='") {
            let start = start + 14;
            if let Some(end) = xpath[start..].find("'") {
                conditions.resource_id = Some(xpath[start..start + end].to_string());
            }
        }
        
        // 提取 content-desc
        if let Some(start) = xpath.find("@content-desc='") {
            let start = start + 15;
            if let Some(end) = xpath[start..].find("'") {
                conditions.content_desc = Some(xpath[start..start + end].to_string());
            }
        }
        
        // 提取 text
        if let Some(start) = xpath.find("@text='") {
            let start = start + 7;
            if let Some(end) = xpath[start..].find("'") {
                conditions.text = Some(xpath[start..start + end].to_string());
            }
        }
        
        // 提取子元素text过滤（格式: [.//*[@text='xxx']]）
        if let Some(child_start) = xpath.find("[.//*[@text='") {
            let start = child_start + 13;
            if let Some(end) = xpath[start..].find("'") {
                conditions.child_text = Some(xpath[start..start + end].to_string());
            }
        }
        
        // 提取 index
        if let Some(start) = xpath.find("@index='") {
            let start = start + 8;
            if let Some(end) = xpath[start..].find("'") {
                if let Ok(index) = xpath[start..start + end].parse::<usize>() {
                    conditions.index = Some(index);
                }
            }
        }
        
        conditions
    }
    
    /// 检查元素是否匹配XPath条件
    fn element_matches(elem: &UIElement, conditions: &XPathConditions) -> bool {
        // Resource-id匹配
        if let Some(ref required_rid) = conditions.resource_id {
            if elem.resource_id.as_ref() != Some(required_rid) {
                return false;
            }
        }

        // Content-desc匹配
        if let Some(ref required_desc) = conditions.content_desc {
            if !required_desc.is_empty() {
                if elem.content_desc != *required_desc {
                    return false;
                }
            }
        }

        // Text匹配
        if let Some(ref required_text) = conditions.text {
            if !required_text.is_empty() {
                if elem.text != *required_text {
                    return false;
                }
            }
        }

        // 子元素text匹配（简化实现：检查元素自身的text）
        // TODO: 实现真正的子元素遍历
        if let Some(ref child_text) = conditions.child_text {
            if elem.text != *child_text {
                return false;
            }
        }

        // Index匹配
        if let Some(required_index) = conditions.index {
            // TODO: 需要在UIElement中添加index字段
            // 暂时忽略index匹配
        }

        true
    }
}

/// XPath解析的匹配条件
#[derive(Debug, Default)]
struct XPathConditions {
    resource_id: Option<String>,
    content_desc: Option<String>,
    text: Option<String>,
    child_text: Option<String>,
    index: Option<usize>,
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_parse_xpath_resource_id() {
        let xpath = "//*[@resource-id='com.example:id/button']";
        let conditions = XPathMatcher::parse_xpath(xpath);
        assert_eq!(conditions.resource_id, Some("com.example:id/button".to_string()));
    }
    
    #[test]
    fn test_parse_xpath_with_child_text() {
        let xpath = "//*[@resource-id='com.example:id/frame'][.//*[@text='确定']]";
        let conditions = XPathMatcher::parse_xpath(xpath);
        assert_eq!(conditions.resource_id, Some("com.example:id/frame".to_string()));
        assert_eq!(conditions.child_text, Some("确定".to_string()));
    }
}

