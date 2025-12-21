// src-tauri/src/core/application/mde_extractor_service.rs
// module: core/application | layer: application | role: mde-extractor
// summary: MDE 提取器服务 - 规则引擎与提取流程编排

use std::collections::HashMap;
use std::sync::Arc;
use std::time::Instant;

use crate::core::domain::mde_extraction::{
    MdeAppInfo, MdeAppRule, MdeDataType, MdeExtractedItem, MdeExtractionMethod,
    MdeExtractionResult, MdeExtractSource, MdeFieldRule, MdeFieldValue,
    MdeNodeAttributes, MdePageDetectionResult, MdePageRule, MdePageType,
    MdePostProcess, MdeRuleRepository, MdeSelector, MdeSelectorMatcher,
};

// ============================================================================
// 页面检测辅助结果（内部使用）
// ============================================================================

/// 【MDE】内部页面检测结果
pub struct MdeInternalDetectionResult {
    /// 是否检测到
    pub detected: bool,
    /// 页面类型
    pub page_type: Option<MdePageType>,
    /// APP 信息
    pub app_info: MdeAppInfo,
    /// 置信度
    pub confidence: f32,
    /// 检测方法
    pub detection_method: String,
}

// ============================================================================
// XML 解析辅助类型
// ============================================================================

/// 【MDE】XML 节点树
#[derive(Debug, Clone)]
pub struct MdeXmlNode {
    /// 节点标签名
    pub tag: String,
    /// 节点属性
    pub attrs: MdeNodeAttributes,
    /// 子节点
    pub children: Vec<MdeXmlNode>,
    /// 节点在 XML 中的路径（用于调试）
    pub path: String,
}

impl MdeXmlNode {
    /// 创建新节点
    pub fn new(tag: &str) -> Self {
        Self {
            tag: tag.to_string(),
            attrs: MdeNodeAttributes::default(),
            children: Vec::new(),
            path: String::new(),
        }
    }

    /// 递归查找所有匹配选择器的节点
    pub fn find_all(&self, selector: &MdeSelector) -> Vec<&MdeXmlNode> {
        let mut results = Vec::new();
        self.find_all_recursive(selector, &mut results);
        results
    }

    fn find_all_recursive<'a>(&'a self, selector: &MdeSelector, results: &mut Vec<&'a MdeXmlNode>) {
        if self.matches(selector) {
            results.push(self);
        }
        for child in &self.children {
            child.find_all_recursive(selector, results);
        }
    }

    /// 查找第一个匹配的节点
    pub fn find_first(&self, selector: &MdeSelector) -> Option<&MdeXmlNode> {
        if self.matches(selector) {
            return Some(self);
        }
        for child in &self.children {
            if let Some(found) = child.find_first(selector) {
                return Some(found);
            }
        }
        None
    }

    /// 检查当前节点是否匹配选择器
    pub fn matches(&self, selector: &MdeSelector) -> bool {
        match selector {
            // 结构匹配需要特殊处理
            MdeSelector::HasChild(child_selector) => {
                self.children.iter().any(|c| c.matches(child_selector))
            }
            MdeSelector::HasSibling(_) => {
                // 需要父节点上下文，这里简化处理
                false
            }
            MdeSelector::ParentMatches(_) => {
                // 需要父节点上下文，这里简化处理
                false
            }
            // 其他选择器使用通用匹配器
            _ => MdeSelectorMatcher::matches(selector, &self.attrs),
        }
    }

    /// 获取节点的 text 值
    pub fn get_text(&self) -> Option<&str> {
        self.attrs.text.as_deref()
    }

    /// 获取节点的 bounds
    pub fn get_bounds(&self) -> Option<(i32, i32, i32, i32)> {
        self.attrs.bounds.as_ref().and_then(|b| parse_bounds(b))
    }
}

/// 解析 bounds 字符串 "[x1,y1][x2,y2]" -> (x1, y1, x2, y2)
fn parse_bounds(bounds: &str) -> Option<(i32, i32, i32, i32)> {
    let re = regex::Regex::new(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]").ok()?;
    let caps = re.captures(bounds)?;
    Some((
        caps.get(1)?.as_str().parse().ok()?,
        caps.get(2)?.as_str().parse().ok()?,
        caps.get(3)?.as_str().parse().ok()?,
        caps.get(4)?.as_str().parse().ok()?,
    ))
}

// ============================================================================
// XML 解析器
// ============================================================================

/// 【MDE】XML 解析器 - 将 XML 字符串解析为节点树
pub struct MdeXmlParser;

impl MdeXmlParser {
    /// 从 XML 字符串解析节点树
    pub fn parse(xml: &str) -> Result<MdeXmlNode, String> {
        use roxmltree::Document;

        let doc = Document::parse(xml).map_err(|e| format!("XML 解析失败: {}", e))?;
        let root = doc.root_element();

        Ok(Self::convert_node(&root, ""))
    }

    fn convert_node(node: &roxmltree::Node, parent_path: &str) -> MdeXmlNode {
        let tag = node.tag_name().name().to_string();
        let path = if parent_path.is_empty() {
            tag.clone()
        } else {
            format!("{}/{}", parent_path, tag)
        };

        let attrs = MdeNodeAttributes::from_attrs(
            node.attributes().map(|a| (a.name(), a.value())),
        );

        let children: Vec<MdeXmlNode> = node
            .children()
            .filter(|n| n.is_element())
            .enumerate()
            .map(|(i, child)| Self::convert_node(&child, &format!("{}[{}]", path, i)))
            .collect();

        MdeXmlNode {
            tag,
            attrs,
            children,
            path,
        }
    }
}

// ============================================================================
// 提取器服务
// ============================================================================

/// 【MDE】提取器服务 - 执行数据提取的核心服务
pub struct MdeExtractorService {
    /// 规则仓库
    rules: Arc<MdeRuleRepository>,
}

impl MdeExtractorService {
    /// 创建新的提取器服务
    pub fn new(rules: Arc<MdeRuleRepository>) -> Self {
        Self { rules }
    }

    /// 创建空规则的提取器（用于测试）
    pub fn empty() -> Self {
        Self {
            rules: Arc::new(MdeRuleRepository::new()),
        }
    }

    /// 加载规则
    pub fn load_rules(&mut self, rules: MdeRuleRepository) {
        self.rules = Arc::new(rules);
    }

    /// 检测当前页面类型
    pub fn detect_page(
        &self,
        xml: &str,
        package_name: &str,
    ) -> Result<MdePageDetectionResult, String> {
        // 解析 XML
        let root = MdeXmlParser::parse(xml)?;

        // 获取 APP 规则
        let app_rule = self.rules.get(package_name);
        let app_info = MdeAppInfo::from_package(package_name);

        if app_rule.is_none() {
            // 未找到规则，返回未知页面
            return Ok(MdePageDetectionResult::new(app_info, MdePageType::Unknown)
                .with_feature("detection_method", "rule")
                .with_feature("has_rules", false));
        }

        let app_rule = app_rule.unwrap();

        // 尝试匹配每个页面规则
        for page_rule in &app_rule.page_rules {
            let matched = page_rule
                .page_detectors
                .iter()
                .all(|detector| root.find_first(detector).is_some());

            if matched {
                let mut result = MdePageDetectionResult::new(app_info, page_rule.page_type.clone());
                result.confidence = 0.9;
                return Ok(result.with_feature("detection_method", "rule"));
            }
        }

        // 没有匹配的页面规则
        let mut result = MdePageDetectionResult::new(app_info, MdePageType::Unknown);
        result.confidence = 0.0;
        Ok(result.with_feature("detection_method", "rule"))
    }

    /// 提取数据
    pub fn extract(
        &self,
        xml: &str,
        package_name: &str,
        page_type: Option<&MdePageType>,
    ) -> Result<MdeExtractionResult, String> {
        let start = Instant::now();

        // 解析 XML
        let root = MdeXmlParser::parse(xml)?;
        let app_info = MdeAppInfo::from_package(package_name);

        // 获取 APP 规则
        let app_rule = match self.rules.get(package_name) {
            Some(r) => r,
            None => {
                return Ok(MdeExtractionResult::error(format!("未找到 APP 规则: {}", package_name))
                    .with_app_info(app_info)
                    .with_elapsed(start.elapsed().as_millis() as u64));
            }
        };

        // 确定页面规则
        let page_rule = match page_type {
            Some(pt) => app_rule.find_page_rule(pt),
            None => {
                // 自动检测页面类型
                app_rule.page_rules.iter().find(|rule| {
                    rule.page_detectors
                        .iter()
                        .all(|d| root.find_first(d).is_some())
                })
            }
        };

        let page_rule = match page_rule {
            Some(r) => r,
            None => {
                let mut result = MdeExtractionResult::error("未找到匹配的页面规则")
                    .with_app_info(app_info)
                    .with_elapsed(start.elapsed().as_millis() as u64);
                if let Some(pt) = page_type {
                    result = result.with_page_type(pt.clone());
                }
                return Ok(result);
            }
        };

        // 查找容器
        let container = match root.find_first(&page_rule.item_container) {
            Some(c) => c,
            None => {
                return Ok(MdeExtractionResult::error("未找到数据容器")
                    .with_app_info(app_info)
                    .with_page_type(page_rule.page_type.clone())
                    .with_elapsed(start.elapsed().as_millis() as u64));
            }
        };

        // 查找所有数据项
        let item_nodes = container.find_all(&page_rule.item_selector);

        // 提取每个数据项
        let mut items = Vec::new();
        for item_node in item_nodes {
            if let Some(extracted) =
                self.extract_item(item_node, &page_rule.field_rules, &page_rule.data_type)
            {
                items.push(extracted);
            }
        }

        Ok(MdeExtractionResult::success(items, MdeExtractionMethod::Rule)
            .with_app_info(app_info)
            .with_page_type(page_rule.page_type.clone())
            .with_elapsed(start.elapsed().as_millis() as u64))
    }

    /// 提取单个数据项
    fn extract_item(
        &self,
        node: &MdeXmlNode,
        field_rules: &[MdeFieldRule],
        data_type: &MdeDataType,
    ) -> Option<MdeExtractedItem> {
        let mut fields: HashMap<String, MdeFieldValue> = HashMap::new();

        for rule in field_rules {
            // 在当前节点及其子节点中查找匹配的元素
            let field_node = self.find_field_node(node, rule);

            let value = match field_node {
                Some(n) => self.extract_field_value(n, rule),
                None => rule.default_value.clone().map(MdeFieldValue::Text),
            };

            if let Some(v) = value {
                // 应用后处理
                let processed = self.apply_post_process(v, &rule.post_process);
                fields.insert(rule.field_name.clone(), processed);
            } else if rule.required {
                // 必填字段缺失，跳过整条记录
                return None;
            }
        }

        // 至少要有一个字段才算有效
        if fields.is_empty() {
            return None;
        }

        Some(MdeExtractedItem {
            data_type: data_type.clone(),
            fields,
            bounds: node.attrs.bounds.clone(), // 直接使用原始 bounds 字符串
            confidence: 0.8,
            source_path: Some(node.path.clone()),
        })
    }

    /// 查找字段对应的节点
    fn find_field_node<'a>(&self, node: &'a MdeXmlNode, rule: &MdeFieldRule) -> Option<&'a MdeXmlNode> {
        for candidate in &rule.selectors.candidates {
            if let Some(found) = node.find_first(&candidate.selector) {
                return Some(found);
            }
        }
        None
    }

    /// 从节点提取字段值
    fn extract_field_value(&self, node: &MdeXmlNode, rule: &MdeFieldRule) -> Option<MdeFieldValue> {
        let raw_value = match &rule.extract_from {
            MdeExtractSource::Text => node.attrs.text.clone(),
            MdeExtractSource::ContentDesc => node.attrs.content_desc.clone(),
            MdeExtractSource::ResourceId => node.attrs.resource_id.clone(),
            MdeExtractSource::Attribute(name) => node.attrs.get_attr(name).map(|s| s.to_string()),
            MdeExtractSource::Bounds => node.attrs.bounds.clone(),
            MdeExtractSource::CombinedChildText => Some(self.collect_child_text(node)),
        };

        raw_value.map(MdeFieldValue::Text)
    }

    /// 收集所有子节点的文本
    fn collect_child_text(&self, node: &MdeXmlNode) -> String {
        let mut texts = Vec::new();
        self.collect_child_text_recursive(node, &mut texts);
        texts.join(" ")
    }

    fn collect_child_text_recursive(&self, node: &MdeXmlNode, texts: &mut Vec<String>) {
        if let Some(text) = &node.attrs.text {
            if !text.is_empty() {
                texts.push(text.clone());
            }
        }
        for child in &node.children {
            self.collect_child_text_recursive(child, texts);
        }
    }

    /// 应用后处理规则
    fn apply_post_process(&self, value: MdeFieldValue, rules: &[MdePostProcess]) -> MdeFieldValue {
        let mut current = value;

        for rule in rules {
            current = match (&current, rule) {
                (MdeFieldValue::Text(s), MdePostProcess::Trim) => {
                    MdeFieldValue::Text(s.trim().to_string())
                }
                (MdeFieldValue::Text(s), MdePostProcess::RegexExtract { pattern, group }) => {
                    if let Ok(re) = regex::Regex::new(pattern) {
                        if let Some(caps) = re.captures(s) {
                            if let Some(m) = caps.get(*group) {
                                return MdeFieldValue::Text(m.as_str().to_string());
                            }
                        }
                    }
                    current
                }
                (MdeFieldValue::Text(s), MdePostProcess::RegexReplace { pattern, replacement }) => {
                    if let Ok(re) = regex::Regex::new(pattern) {
                        MdeFieldValue::Text(re.replace_all(s, replacement).to_string())
                    } else {
                        current
                    }
                }
                (MdeFieldValue::Text(s), MdePostProcess::NormalizeNumber) => {
                    MdeFieldValue::Text(normalize_chinese_number(s))
                }
                (MdeFieldValue::Text(s), MdePostProcess::Truncate { max_length }) => {
                    if s.chars().count() > *max_length {
                        MdeFieldValue::Text(s.chars().take(*max_length).collect())
                    } else {
                        current
                    }
                }
                (MdeFieldValue::Text(s), MdePostProcess::AddPrefix { prefix }) => {
                    MdeFieldValue::Text(format!("{}{}", prefix, s))
                }
                (MdeFieldValue::Text(s), MdePostProcess::AddSuffix { suffix }) => {
                    MdeFieldValue::Text(format!("{}{}", s, suffix))
                }
                _ => current,
            };
        }

        current
    }
}

/// 归一化中文数字（如 "1.2万" -> "12000"）
fn normalize_chinese_number(s: &str) -> String {
    let s = s.trim();
    
    // 尝试匹配 "1.2万" 或 "1.2千" 格式
    if let Ok(re) = regex::Regex::new(r"^(\d+(?:\.\d+)?)\s*([万千亿kKmMwW])$") {
        if let Some(caps) = re.captures(s) {
            if let (Some(num_str), Some(unit)) = (caps.get(1), caps.get(2)) {
                if let Ok(num) = num_str.as_str().parse::<f64>() {
                    let multiplier = match unit.as_str() {
                        "万" | "w" | "W" => 10000.0,
                        "千" | "k" | "K" => 1000.0,
                        "亿" => 100000000.0,
                        "m" | "M" => 1000000.0,
                        _ => 1.0,
                    };
                    return format!("{}", (num * multiplier) as i64);
                }
            }
        }
    }
    
    s.to_string()
}

// ============================================================================
// 单元测试
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_bounds() {
        let bounds = "[100,200][300,400]";
        let result = parse_bounds(bounds);
        assert_eq!(result, Some((100, 200, 300, 400)));
    }

    #[test]
    fn test_normalize_number() {
        assert_eq!(normalize_chinese_number("1.2万"), "12000");
        assert_eq!(normalize_chinese_number("5千"), "5000");
        assert_eq!(normalize_chinese_number("100"), "100");
    }

    #[test]
    fn test_xml_parser() {
        let xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<hierarchy>
    <node index="0" text="测试" resource-id="com.test:id/title" class="TextView" />
    <node index="1" class="LinearLayout">
        <node text="子节点" />
    </node>
</hierarchy>"#;

        let result = MdeXmlParser::parse(xml);
        assert!(result.is_ok());

        let root = result.unwrap();
        assert_eq!(root.tag, "hierarchy");
        assert_eq!(root.children.len(), 2);
    }

    #[test]
    fn test_find_by_selector() {
        let xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<hierarchy>
    <node text="测试" resource-id="com.test:id/nickname" class="TextView" />
    <node text="内容" resource-id="com.test:id/content" class="TextView" />
</hierarchy>"#;

        let root = MdeXmlParser::parse(xml).unwrap();
        
        let selector = MdeSelector::ResourceIdContains("nickname".to_string());
        let found = root.find_first(&selector);
        
        assert!(found.is_some());
        assert_eq!(found.unwrap().get_text(), Some("测试"));
    }
}
