// src-tauri/src/core/domain/mde_extraction/mde_selector.rs
// module: core/domain/mde_extraction | layer: domain | role: selector
// summary: MDE 选择器系统 - 定义通用的元素匹配规则

use serde::{Deserialize, Serialize};
use regex::Regex;

// ============================================================================
// 选择器类型
// ============================================================================

/// 【MDE】选择器 - 用于在 XML 中定位元素
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "value", rename_all = "snake_case")]
pub enum MdeSelector {
    // === 精确匹配 ===
    /// 精确匹配 resource-id
    ResourceId(String),
    /// 精确匹配 class 名
    ClassName(String),
    /// 精确匹配 text
    Text(String),
    /// 精确匹配 content-desc
    ContentDesc(String),

    // === 模糊匹配 ===
    /// resource-id 包含
    ResourceIdContains(String),
    /// resource-id 正则匹配
    ResourceIdPattern(String),
    /// class 名正则匹配
    ClassPattern(String),
    /// text 正则匹配
    TextPattern(String),
    /// content-desc 正则匹配
    ContentDescPattern(String),

    // === 属性匹配 ===
    /// 属性存在或等于某值
    HasAttribute {
        name: String,
        value: Option<String>,
    },
    /// 可点击
    Clickable(bool),
    /// 可滚动
    Scrollable(bool),
    /// 已选中
    Selected(bool),

    // === 位置匹配 ===
    /// 第 N 个子元素（从 0 开始）
    NthChild(usize),
    /// 索引范围
    IndexRange { start: usize, end: usize },

    // === 组合匹配 ===
    /// 所有条件都满足
    And(Vec<MdeSelector>),
    /// 任一条件满足
    Or(Vec<MdeSelector>),
    /// 条件取反
    Not(Box<MdeSelector>),

    // === 结构匹配 ===
    /// 父元素匹配
    ParentMatches(Box<MdeSelector>),
    /// 子元素匹配
    HasChild(Box<MdeSelector>),
    /// 兄弟元素匹配
    HasSibling(Box<MdeSelector>),
}

impl MdeSelector {
    // === 便捷构造器 ===

    /// 创建 resource-id 包含匹配
    pub fn resource_id_contains(pattern: impl Into<String>) -> Self {
        Self::ResourceIdContains(pattern.into())
    }

    /// 创建 text 正则匹配
    pub fn text_pattern(pattern: impl Into<String>) -> Self {
        Self::TextPattern(pattern.into())
    }

    /// 创建组合匹配（AND）
    pub fn and(selectors: Vec<MdeSelector>) -> Self {
        Self::And(selectors)
    }

    /// 创建组合匹配（OR）
    pub fn or(selectors: Vec<MdeSelector>) -> Self {
        Self::Or(selectors)
    }

    /// 创建取反匹配
    pub fn not(selector: MdeSelector) -> Self {
        Self::Not(Box::new(selector))
    }
}

// ============================================================================
// 节点属性（用于匹配）
// ============================================================================

/// 【MDE】节点属性 - 从 XML 解析出的元素属性
#[derive(Debug, Clone, Default)]
pub struct MdeNodeAttributes {
    pub index: Option<usize>,
    pub text: Option<String>,
    pub resource_id: Option<String>,
    pub class: Option<String>,
    pub package: Option<String>,
    pub content_desc: Option<String>,
    pub checkable: bool,
    pub checked: bool,
    pub clickable: bool,
    pub enabled: bool,
    pub focusable: bool,
    pub focused: bool,
    pub scrollable: bool,
    pub long_clickable: bool,
    pub password: bool,
    pub selected: bool,
    pub bounds: Option<String>,
}

impl MdeNodeAttributes {
    /// 从属性键值对构建
    pub fn from_attrs<'a>(attrs: impl Iterator<Item = (&'a str, &'a str)>) -> Self {
        let mut node = Self::default();
        for (key, value) in attrs {
            match key {
                "index" => node.index = value.parse().ok(),
                "text" => node.text = Some(value.to_string()),
                "resource-id" => node.resource_id = Some(value.to_string()),
                "class" => node.class = Some(value.to_string()),
                "package" => node.package = Some(value.to_string()),
                "content-desc" => node.content_desc = Some(value.to_string()),
                "checkable" => node.checkable = value == "true",
                "checked" => node.checked = value == "true",
                "clickable" => node.clickable = value == "true",
                "enabled" => node.enabled = value == "true",
                "focusable" => node.focusable = value == "true",
                "focused" => node.focused = value == "true",
                "scrollable" => node.scrollable = value == "true",
                "long-clickable" => node.long_clickable = value == "true",
                "password" => node.password = value == "true",
                "selected" => node.selected = value == "true",
                "bounds" => node.bounds = Some(value.to_string()),
                _ => {}
            }
        }
        node
    }

    /// 获取属性值
    pub fn get_attr(&self, name: &str) -> Option<&str> {
        match name {
            "text" => self.text.as_deref(),
            "resource-id" => self.resource_id.as_deref(),
            "class" => self.class.as_deref(),
            "package" => self.package.as_deref(),
            "content-desc" => self.content_desc.as_deref(),
            "bounds" => self.bounds.as_deref(),
            _ => None,
        }
    }
}

// ============================================================================
// 选择器匹配逻辑
// ============================================================================

/// 【MDE】选择器匹配器
pub struct MdeSelectorMatcher;

impl MdeSelectorMatcher {
    /// 检查节点是否匹配选择器
    pub fn matches(selector: &MdeSelector, node: &MdeNodeAttributes) -> bool {
        match selector {
            // === 精确匹配 ===
            MdeSelector::ResourceId(id) => {
                node.resource_id.as_deref() == Some(id.as_str())
            }
            MdeSelector::ClassName(class) => {
                node.class.as_deref() == Some(class.as_str())
            }
            MdeSelector::Text(text) => {
                node.text.as_deref() == Some(text.as_str())
            }
            MdeSelector::ContentDesc(desc) => {
                node.content_desc.as_deref() == Some(desc.as_str())
            }

            // === 模糊匹配 ===
            MdeSelector::ResourceIdContains(pattern) => {
                node.resource_id.as_ref()
                    .map(|id| id.contains(pattern))
                    .unwrap_or(false)
            }
            MdeSelector::ResourceIdPattern(pattern) => {
                Self::regex_matches(&node.resource_id, pattern)
            }
            MdeSelector::ClassPattern(pattern) => {
                Self::regex_matches(&node.class, pattern)
            }
            MdeSelector::TextPattern(pattern) => {
                Self::regex_matches(&node.text, pattern)
            }
            MdeSelector::ContentDescPattern(pattern) => {
                Self::regex_matches(&node.content_desc, pattern)
            }

            // === 属性匹配 ===
            MdeSelector::HasAttribute { name, value } => {
                match node.get_attr(name) {
                    Some(attr_value) => {
                        value.as_ref().map(|v| attr_value == v).unwrap_or(true)
                    }
                    None => false,
                }
            }
            MdeSelector::Clickable(expected) => node.clickable == *expected,
            MdeSelector::Scrollable(expected) => node.scrollable == *expected,
            MdeSelector::Selected(expected) => node.selected == *expected,

            // === 位置匹配 ===
            MdeSelector::NthChild(n) => {
                node.index == Some(*n)
            }
            MdeSelector::IndexRange { start, end } => {
                node.index.map(|i| i >= *start && i < *end).unwrap_or(false)
            }

            // === 组合匹配 ===
            MdeSelector::And(selectors) => {
                selectors.iter().all(|s| Self::matches(s, node))
            }
            MdeSelector::Or(selectors) => {
                selectors.iter().any(|s| Self::matches(s, node))
            }
            MdeSelector::Not(selector) => {
                !Self::matches(selector, node)
            }

            // === 结构匹配（需要上下文，这里返回 false）===
            MdeSelector::ParentMatches(_) |
            MdeSelector::HasChild(_) |
            MdeSelector::HasSibling(_) => {
                // 结构匹配需要完整的 XML 树，在 rule_engine 中实现
                false
            }
        }
    }

    /// 正则匹配辅助函数
    fn regex_matches(value: &Option<String>, pattern: &str) -> bool {
        match (value, Regex::new(pattern)) {
            (Some(v), Ok(re)) => re.is_match(v),
            _ => false,
        }
    }
}

// ============================================================================
// 选择器候选列表
// ============================================================================

/// 【MDE】选择器候选列表 - 按优先级尝试多个选择器
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MdeSelectorCandidates {
    /// 候选选择器列表（按优先级排序）
    pub candidates: Vec<MdeSelectorWithWeight>,
}

/// 【MDE】带权重的选择器
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MdeSelectorWithWeight {
    /// 选择器
    pub selector: MdeSelector,
    /// 权重（用于计算置信度）
    #[serde(default = "default_weight")]
    pub weight: f32,
}

fn default_weight() -> f32 {
    1.0
}

impl MdeSelectorCandidates {
    /// 创建新的候选列表
    pub fn new(candidates: Vec<MdeSelector>) -> Self {
        Self {
            candidates: candidates.into_iter()
                .map(|s| MdeSelectorWithWeight { selector: s, weight: 1.0 })
                .collect(),
        }
    }

    /// 添加带权重的候选
    pub fn with_weighted(mut self, selector: MdeSelector, weight: f32) -> Self {
        self.candidates.push(MdeSelectorWithWeight { selector, weight });
        self
    }

    /// 尝试匹配，返回第一个匹配的选择器及其权重
    pub fn try_match(&self, node: &MdeNodeAttributes) -> Option<(usize, f32)> {
        for (i, candidate) in self.candidates.iter().enumerate() {
            if MdeSelectorMatcher::matches(&candidate.selector, node) {
                return Some((i, candidate.weight));
            }
        }
        None
    }
}

// ============================================================================
// 单元测试
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    fn make_node(resource_id: &str, text: &str, class: &str) -> MdeNodeAttributes {
        MdeNodeAttributes {
            resource_id: Some(resource_id.to_string()),
            text: Some(text.to_string()),
            class: Some(class.to_string()),
            clickable: true,
            ..Default::default()
        }
    }

    #[test]
    fn test_exact_match() {
        let node = make_node("com.app:id/nickname", "张三", "TextView");
        
        assert!(MdeSelectorMatcher::matches(
            &MdeSelector::ResourceId("com.app:id/nickname".to_string()),
            &node
        ));
        
        assert!(MdeSelectorMatcher::matches(
            &MdeSelector::Text("张三".to_string()),
            &node
        ));
    }

    #[test]
    fn test_contains_match() {
        let node = make_node("com.app:id/comment_nickname", "", "");
        
        assert!(MdeSelectorMatcher::matches(
            &MdeSelector::ResourceIdContains("nickname".to_string()),
            &node
        ));
        
        assert!(MdeSelectorMatcher::matches(
            &MdeSelector::ResourceIdContains("comment".to_string()),
            &node
        ));
    }

    #[test]
    fn test_pattern_match() {
        let node = make_node("", "1.2万", "");
        
        assert!(MdeSelectorMatcher::matches(
            &MdeSelector::TextPattern(r"^\d+(\.\d+)?[万千]?$".to_string()),
            &node
        ));
    }

    #[test]
    fn test_and_match() {
        let node = make_node("com.app:id/btn", "确定", "Button");
        
        let selector = MdeSelector::And(vec![
            MdeSelector::ClassName("Button".to_string()),
            MdeSelector::Clickable(true),
        ]);
        
        assert!(MdeSelectorMatcher::matches(&selector, &node));
    }

    #[test]
    fn test_or_match() {
        let node = make_node("", "2小时前", "");
        
        let selector = MdeSelector::Or(vec![
            MdeSelector::TextPattern(r"\d+[秒分时天]前".to_string()),
            MdeSelector::Text("刚刚".to_string()),
        ]);
        
        assert!(MdeSelectorMatcher::matches(&selector, &node));
    }

    #[test]
    fn test_candidates() {
        let node = make_node("com.app:id/user_name", "测试用户", "");
        
        let candidates = MdeSelectorCandidates::new(vec![
            MdeSelector::ResourceIdContains("nickname"),
            MdeSelector::ResourceIdContains("user_name"),
        ]);
        
        let result = candidates.try_match(&node);
        assert_eq!(result, Some((1, 1.0))); // 第二个候选匹配
    }
}
