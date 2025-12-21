// src-tauri/src/core/domain/mde_extraction/mde_rule.rs
// module: core/domain/mde_extraction | layer: domain | role: rule
// summary: MDE 规则定义 - APP规则、页面规则、字段规则的数据结构

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use super::mde_data_types::{MdeDataType, MdePageType};
use super::mde_selector::{MdeSelector, MdeSelectorCandidates};

// ============================================================================
// 字段规则
// ============================================================================

/// 【MDE】字段规则 - 定义如何提取单个字段
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MdeFieldRule {
    /// 字段名（如 "nickname", "content", "timestamp"）
    pub field_name: String,

    /// 是否必填（缺失时跳过整条数据）
    #[serde(default)]
    pub required: bool,

    /// 选择器候选列表
    pub selectors: MdeSelectorCandidates,

    /// 提取来源（从哪个属性提取值）
    #[serde(default = "default_extract_from")]
    pub extract_from: MdeExtractSource,

    /// 后处理规则
    #[serde(default)]
    pub post_process: Vec<MdePostProcess>,

    /// 默认值（未提取到时使用）
    #[serde(default)]
    pub default_value: Option<String>,
}

fn default_extract_from() -> MdeExtractSource {
    MdeExtractSource::Text
}

/// 【MDE】提取来源
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "snake_case")]
pub enum MdeExtractSource {
    /// 从 text 属性提取
    #[default]
    Text,
    /// 从 content-desc 属性提取
    ContentDesc,
    /// 从 resource-id 属性提取
    ResourceId,
    /// 从自定义属性提取
    Attribute(String),
    /// 从子元素的 text 组合提取
    CombinedChildText,
    /// 从 bounds 属性提取
    Bounds,
}

/// 【MDE】后处理规则
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum MdePostProcess {
    /// 正则提取
    RegexExtract {
        pattern: String,
        group: usize,
    },
    /// 正则替换
    RegexReplace {
        pattern: String,
        replacement: String,
    },
    /// 去除前后空白
    Trim,
    /// 数字归一化（如 "1.2万" -> "12000"）
    NormalizeNumber,
    /// 时间归一化（如 "2小时前" -> ISO 时间戳）
    NormalizeTime,
    /// 截断到指定长度
    Truncate { max_length: usize },
    /// 添加前缀
    AddPrefix { prefix: String },
    /// 添加后缀
    AddSuffix { suffix: String },
}

impl MdeFieldRule {
    /// 创建简单的 text 字段规则
    pub fn simple_text(field_name: impl Into<String>, selector: MdeSelector) -> Self {
        Self {
            field_name: field_name.into(),
            required: false,
            selectors: MdeSelectorCandidates::new(vec![selector]),
            extract_from: MdeExtractSource::Text,
            post_process: vec![MdePostProcess::Trim],
            default_value: None,
        }
    }

    /// 创建必填字段规则
    pub fn required(mut self) -> Self {
        self.required = true;
        self
    }

    /// 添加后处理
    pub fn with_post_process(mut self, process: MdePostProcess) -> Self {
        self.post_process.push(process);
        self
    }
}

// ============================================================================
// 页面规则
// ============================================================================

/// 【MDE】页面规则 - 定义某个页面类型的提取规则
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MdePageRule {
    /// 页面类型
    pub page_type: MdePageType,

    /// 页面检测选择器（用于识别当前是否是此页面）
    pub page_detectors: Vec<MdeSelector>,

    /// 数据类型
    pub data_type: MdeDataType,

    /// 数据项容器选择器（定位评论列表的容器）
    pub item_container: MdeSelector,

    /// 单条数据项选择器（定位每条评论）
    pub item_selector: MdeSelector,

    /// 字段提取规则
    pub field_rules: Vec<MdeFieldRule>,

    /// 分页/加载更多检测
    #[serde(default)]
    pub pagination: Option<MdePaginationRule>,

    /// 规则优先级（数字越大越优先）
    #[serde(default)]
    pub priority: i32,
}

/// 【MDE】分页规则
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MdePaginationRule {
    /// "加载更多" 按钮选择器
    #[serde(default)]
    pub load_more_selector: Option<MdeSelector>,

    /// 滚动方向
    #[serde(default)]
    pub scroll_direction: MdeScrollDirection,

    /// 是否支持无限滚动
    #[serde(default)]
    pub infinite_scroll: bool,

    /// 最大滚动次数
    #[serde(default = "default_max_scroll")]
    pub max_scroll_times: u32,

    /// "没有更多" 标识选择器
    #[serde(default)]
    pub no_more_selector: Option<MdeSelector>,
}

fn default_max_scroll() -> u32 {
    10
}

/// 【MDE】滚动方向
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "snake_case")]
pub enum MdeScrollDirection {
    #[default]
    Down,
    Up,
    Left,
    Right,
}

// ============================================================================
// APP 规则
// ============================================================================

/// 【MDE】APP 规则 - 定义某个 APP 的所有提取规则
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MdeAppRule {
    /// APP 包名
    pub package_name: String,

    /// APP 显示名称
    pub app_name: String,

    /// APP 版本范围（可选）
    #[serde(default)]
    pub version_range: Option<MdeVersionRange>,

    /// 页面规则列表
    pub page_rules: Vec<MdePageRule>,

    /// APP 级别的全局选择器（跨页面复用）
    #[serde(default)]
    pub common_selectors: HashMap<String, MdeSelector>,

    /// 规则版本
    #[serde(default = "default_rule_version")]
    pub rule_version: String,

    /// 最后更新时间
    #[serde(default)]
    pub last_updated: Option<String>,
}

fn default_rule_version() -> String {
    "1.0.0".to_string()
}

/// 【MDE】版本范围
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MdeVersionRange {
    /// 最小版本（包含）
    #[serde(default)]
    pub min: Option<String>,
    /// 最大版本（不包含）
    #[serde(default)]
    pub max: Option<String>,
}

impl MdeAppRule {
    /// 创建新的 APP 规则
    pub fn new(package_name: impl Into<String>, app_name: impl Into<String>) -> Self {
        Self {
            package_name: package_name.into(),
            app_name: app_name.into(),
            version_range: None,
            page_rules: Vec::new(),
            common_selectors: HashMap::new(),
            rule_version: "1.0.0".to_string(),
            last_updated: None,
        }
    }

    /// 添加页面规则
    pub fn with_page_rule(mut self, rule: MdePageRule) -> Self {
        self.page_rules.push(rule);
        self
    }

    /// 根据页面类型查找规则
    pub fn find_page_rule(&self, page_type: &MdePageType) -> Option<&MdePageRule> {
        self.page_rules.iter()
            .filter(|r| &r.page_type == page_type)
            .max_by_key(|r| r.priority)
    }

    /// 尝试检测当前页面类型
    pub fn detect_page_type(&self, _node_matcher: impl Fn(&MdeSelector) -> bool) -> Option<&MdePageRule> {
        // 返回第一个匹配的页面规则
        self.page_rules.iter()
            .filter(|rule| rule.page_detectors.iter().all(|d| _node_matcher(d)))
            .max_by_key(|r| r.priority)
    }
}

// ============================================================================
// 规则仓库
// ============================================================================

/// 【MDE】规则仓库 - 存储所有 APP 的规则
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct MdeRuleRepository {
    /// APP 规则映射（key = package_name）
    pub app_rules: HashMap<String, MdeAppRule>,
    
    /// 仓库版本
    #[serde(default = "default_repo_version")]
    pub version: String,
}

fn default_repo_version() -> String {
    "1.0.0".to_string()
}

impl MdeRuleRepository {
    /// 创建空仓库
    pub fn new() -> Self {
        Self::default()
    }

    /// 注册 APP 规则
    pub fn register(&mut self, rule: MdeAppRule) {
        self.app_rules.insert(rule.package_name.clone(), rule);
    }

    /// 获取 APP 规则
    pub fn get(&self, package_name: &str) -> Option<&MdeAppRule> {
        self.app_rules.get(package_name)
    }

    /// 检查是否支持某 APP
    pub fn supports(&self, package_name: &str) -> bool {
        self.app_rules.contains_key(package_name)
    }

    /// 获取所有支持的 APP 包名
    pub fn supported_packages(&self) -> Vec<&str> {
        self.app_rules.keys().map(|s| s.as_str()).collect()
    }

    /// 从 JSON 字符串加载
    pub fn from_json(json: &str) -> Result<Self, serde_json::Error> {
        serde_json::from_str(json)
    }

    /// 转换为 JSON 字符串
    pub fn to_json(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string_pretty(self)
    }
}

// ============================================================================
// 单元测试
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_field_rule_builder() {
        let rule = MdeFieldRule::simple_text(
            "nickname",
            MdeSelector::ResourceIdContains("nickname".to_string()),
        ).required();

        assert_eq!(rule.field_name, "nickname");
        assert!(rule.required);
    }

    #[test]
    fn test_app_rule_builder() {
        let app_rule = MdeAppRule::new(
            "com.ss.android.ugc.aweme",
            "抖音"
        );

        assert_eq!(app_rule.package_name, "com.ss.android.ugc.aweme");
        assert_eq!(app_rule.app_name, "抖音");
        assert!(app_rule.page_rules.is_empty());
    }

    #[test]
    fn test_rule_repository() {
        let mut repo = MdeRuleRepository::new();
        
        let douyin_rule = MdeAppRule::new(
            "com.ss.android.ugc.aweme",
            "抖音"
        );
        
        repo.register(douyin_rule);
        
        assert!(repo.supports("com.ss.android.ugc.aweme"));
        assert!(!repo.supports("com.unknown.app"));
        
        let packages = repo.supported_packages();
        assert_eq!(packages.len(), 1);
    }

    #[test]
    fn test_rule_serialization() {
        let mut repo = MdeRuleRepository::new();
        repo.register(MdeAppRule::new("com.test", "测试APP"));
        
        let json = repo.to_json().unwrap();
        let loaded = MdeRuleRepository::from_json(&json).unwrap();
        
        assert!(loaded.supports("com.test"));
    }
}
