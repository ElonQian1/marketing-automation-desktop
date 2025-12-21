// src-tauri/src/core/domain/mde_extraction/mde_data_types.rs
// module: core/domain/mde_extraction | layer: domain | role: data-types
// summary: MDE 数据提取系统 - 核心数据类型定义

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ============================================================================
// 数据类型枚举
// ============================================================================

/// 【MDE】支持的数据类型（可扩展）
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MdeDataType {
    /// 评论数据
    Comments,
    /// 商品数据
    Products,
    /// 用户列表
    Users,
    /// 帖子/笔记
    Posts,
    /// 私信
    Messages,
    /// 自定义类型
    Custom(String),
}

impl MdeDataType {
    /// 获取数据类型的显示名称
    pub fn display_name(&self) -> &str {
        match self {
            Self::Comments => "评论",
            Self::Products => "商品",
            Self::Users => "用户",
            Self::Posts => "帖子",
            Self::Messages => "私信",
            Self::Custom(name) => name,
        }
    }

    /// 获取该数据类型的标准字段列表
    pub fn standard_fields(&self) -> &[&str] {
        match self {
            Self::Comments => &["nickname", "content", "likes", "time", "avatar_desc"],
            Self::Products => &["title", "price", "sales", "shop", "image_desc"],
            Self::Users => &["nickname", "bio", "followers", "following", "verified"],
            Self::Posts => &["author", "title", "content", "likes", "comments", "time"],
            Self::Messages => &["sender", "content", "time", "read"],
            Self::Custom(_) => &[],
        }
    }
}

// ============================================================================
// 字段值类型
// ============================================================================

/// 【MDE】字段值（支持多种类型）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum MdeFieldValue {
    /// 文本值
    Text(String),
    /// 整数值
    Number(i64),
    /// 浮点值
    Float(f64),
    /// 布尔值
    Bool(bool),
    /// 列表值
    List(Vec<MdeFieldValue>),
    /// 空值
    Null,
}

impl MdeFieldValue {
    /// 尝试获取文本值
    pub fn as_text(&self) -> Option<&str> {
        match self {
            Self::Text(s) => Some(s),
            _ => None,
        }
    }

    /// 转换为字符串
    pub fn as_string(&self) -> String {
        match self {
            Self::Text(s) => s.clone(),
            Self::Number(n) => n.to_string(),
            Self::Float(f) => f.to_string(),
            Self::Bool(b) => b.to_string(),
            Self::List(items) => {
                let strs: Vec<String> = items.iter().map(|i| i.as_string()).collect();
                strs.join(", ")
            }
            Self::Null => String::new(),
        }
    }

    /// 尝试获取数字值
    pub fn as_number(&self) -> Option<i64> {
        match self {
            Self::Number(n) => Some(*n),
            _ => None,
        }
    }

    /// 是否为空值
    pub fn is_null(&self) -> bool {
        matches!(self, Self::Null)
    }
}

impl From<String> for MdeFieldValue {
    fn from(s: String) -> Self {
        Self::Text(s)
    }
}

impl From<&str> for MdeFieldValue {
    fn from(s: &str) -> Self {
        Self::Text(s.to_string())
    }
}

impl From<i64> for MdeFieldValue {
    fn from(n: i64) -> Self {
        Self::Number(n)
    }
}

impl From<bool> for MdeFieldValue {
    fn from(b: bool) -> Self {
        Self::Bool(b)
    }
}

// ============================================================================
// 提取的数据项
// ============================================================================

/// 【MDE】提取的单条数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MdeExtractedItem {
    /// 数据类型
    pub data_type: MdeDataType,
    /// 提取的字段 (key-value 形式，灵活适配不同 APP)
    pub fields: HashMap<String, MdeFieldValue>,
    /// 元素位置（bounds 字符串，用于点击交互）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bounds: Option<String>,
    /// 置信度 (0.0 - 1.0)
    pub confidence: f32,
    /// 原始节点路径（用于调试）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source_path: Option<String>,
}

impl MdeExtractedItem {
    /// 创建新的提取项
    pub fn new(data_type: MdeDataType) -> Self {
        Self {
            data_type,
            fields: HashMap::new(),
            bounds: None,
            confidence: 1.0,
            source_path: None,
        }
    }

    /// 添加字段
    pub fn with_field(mut self, key: impl Into<String>, value: impl Into<MdeFieldValue>) -> Self {
        self.fields.insert(key.into(), value.into());
        self
    }

    /// 设置位置
    pub fn with_bounds(mut self, bounds: impl Into<String>) -> Self {
        self.bounds = Some(bounds.into());
        self
    }

    /// 设置置信度
    pub fn with_confidence(mut self, confidence: f32) -> Self {
        self.confidence = confidence.clamp(0.0, 1.0);
        self
    }

    /// 获取字段值
    pub fn get_field(&self, key: &str) -> Option<&MdeFieldValue> {
        self.fields.get(key)
    }

    /// 获取文本字段
    pub fn get_text_field(&self, key: &str) -> Option<&str> {
        self.fields.get(key).and_then(|v| v.as_text())
    }
}

// ============================================================================
// 提取方法
// ============================================================================

/// 【MDE】提取方法
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MdeExtractionMethod {
    /// 规则匹配
    Rule,
    /// AI 分析
    Ai,
    /// 混合模式（先规则后 AI）
    Hybrid,
}

impl Default for MdeExtractionMethod {
    fn default() -> Self {
        Self::Hybrid
    }
}

// ============================================================================
// APP 信息
// ============================================================================

/// 【MDE】APP 信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MdeAppInfo {
    /// 包名
    pub package: String,
    /// APP 名称
    pub name: String,
    /// 是否有预定义规则
    pub has_rules: bool,
}

impl MdeAppInfo {
    /// 从包名创建（自动识别常见 APP）
    pub fn from_package(package: impl Into<String>) -> Self {
        let package = package.into();
        let name = Self::package_to_name(&package);
        Self {
            package,
            name,
            has_rules: false,
        }
    }

    /// 包名转 APP 名称
    fn package_to_name(package: &str) -> String {
        match package {
            "com.ss.android.ugc.aweme" => "抖音".to_string(),
            "com.xingin.xhs" => "小红书".to_string(),
            "com.smile.gifmaker" => "快手".to_string(),
            "com.sina.weibo" => "微博".to_string(),
            "com.tencent.mm" => "微信".to_string(),
            "com.taobao.taobao" => "淘宝".to_string(),
            "com.jingdong.app.mall" => "京东".to_string(),
            "com.alibaba.android.rimet" => "钉钉".to_string(),
            _ => package.split('.').last().unwrap_or("未知").to_string(),
        }
    }
}

// ============================================================================
// 页面类型
// ============================================================================

/// 【MDE】页面类型
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MdePageType {
    /// 首页/推荐页
    Home,
    /// 视频详情页
    VideoDetail,
    /// 评论列表
    CommentList,
    /// 商品详情
    ProductDetail,
    /// 商品列表
    ProductList,
    /// 用户主页
    UserProfile,
    /// 搜索结果
    SearchResult,
    /// 私信列表
    MessageList,
    /// 未知页面
    Unknown,
    /// 自定义页面
    Custom(String),
}

impl MdePageType {
    /// 获取页面类型的显示名称
    pub fn display_name(&self) -> &str {
        match self {
            Self::Home => "首页",
            Self::VideoDetail => "视频详情",
            Self::CommentList => "评论列表",
            Self::ProductDetail => "商品详情",
            Self::ProductList => "商品列表",
            Self::UserProfile => "用户主页",
            Self::SearchResult => "搜索结果",
            Self::MessageList => "私信列表",
            Self::Unknown => "未知页面",
            Self::Custom(name) => name,
        }
    }

    /// 该页面类型通常包含的数据类型
    pub fn expected_data_types(&self) -> Vec<MdeDataType> {
        match self {
            Self::CommentList => vec![MdeDataType::Comments],
            Self::ProductList | Self::ProductDetail => vec![MdeDataType::Products],
            Self::UserProfile => vec![MdeDataType::Users, MdeDataType::Posts],
            Self::SearchResult => vec![MdeDataType::Users, MdeDataType::Posts, MdeDataType::Products],
            Self::MessageList => vec![MdeDataType::Messages],
            Self::VideoDetail => vec![MdeDataType::Comments],
            _ => vec![],
        }
    }
}

// ============================================================================
// 提取结果
// ============================================================================

/// 【MDE】提取结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MdeExtractionResult {
    /// 是否成功
    pub success: bool,
    /// 提取的数据项
    pub items: Vec<MdeExtractedItem>,
    /// 使用的提取方法
    pub method: MdeExtractionMethod,
    /// APP 信息
    #[serde(skip_serializing_if = "Option::is_none")]
    pub app_info: Option<MdeAppInfo>,
    /// 页面类型
    #[serde(skip_serializing_if = "Option::is_none")]
    pub page_type: Option<MdePageType>,
    /// 错误信息
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    /// 提取耗时（毫秒）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub elapsed_ms: Option<u64>,
}

impl MdeExtractionResult {
    /// 创建成功结果
    pub fn success(items: Vec<MdeExtractedItem>, method: MdeExtractionMethod) -> Self {
        Self {
            success: true,
            items,
            method,
            app_info: None,
            page_type: None,
            error: None,
            elapsed_ms: None,
        }
    }

    /// 创建失败结果
    pub fn error(msg: impl Into<String>) -> Self {
        Self {
            success: false,
            items: vec![],
            method: MdeExtractionMethod::Rule,
            app_info: None,
            page_type: None,
            error: Some(msg.into()),
            elapsed_ms: None,
        }
    }

    /// 设置 APP 信息
    pub fn with_app_info(mut self, app_info: MdeAppInfo) -> Self {
        self.app_info = Some(app_info);
        self
    }

    /// 设置页面类型
    pub fn with_page_type(mut self, page_type: MdePageType) -> Self {
        self.page_type = Some(page_type);
        self
    }

    /// 设置耗时
    pub fn with_elapsed(mut self, ms: u64) -> Self {
        self.elapsed_ms = Some(ms);
        self
    }

    /// 获取提取数量
    pub fn count(&self) -> usize {
        self.items.len()
    }
}

// ============================================================================
// 页面检测结果
// ============================================================================

/// 【MDE】页面检测结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MdePageDetectionResult {
    /// APP 信息
    pub app: MdeAppInfo,
    /// 页面类型
    pub page_type: MdePageType,
    /// 检测到的特征
    pub features: HashMap<String, MdeFieldValue>,
    /// 置信度
    pub confidence: f32,
}

impl MdePageDetectionResult {
    /// 创建新的检测结果
    pub fn new(app: MdeAppInfo, page_type: MdePageType) -> Self {
        Self {
            app,
            page_type,
            features: HashMap::new(),
            confidence: 1.0,
        }
    }

    /// 添加特征
    pub fn with_feature(mut self, key: impl Into<String>, value: impl Into<MdeFieldValue>) -> Self {
        self.features.insert(key.into(), value.into());
        self
    }
}

// ============================================================================
// 单元测试
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mde_data_type_display() {
        assert_eq!(MdeDataType::Comments.display_name(), "评论");
        assert_eq!(MdeDataType::Custom("直播".to_string()).display_name(), "直播");
    }

    #[test]
    fn test_mde_field_value_conversion() {
        let text: MdeFieldValue = "hello".into();
        assert_eq!(text.as_text(), Some("hello"));

        let num: MdeFieldValue = 42i64.into();
        assert_eq!(num.as_number(), Some(42));
    }

    #[test]
    fn test_mde_extracted_item_builder() {
        let item = MdeExtractedItem::new(MdeDataType::Comments)
            .with_field("nickname", "测试用户")
            .with_field("content", "这是一条评论")
            .with_confidence(0.95)
            .with_bounds("[100,200][300,400]");

        assert_eq!(item.get_text_field("nickname"), Some("测试用户"));
        assert_eq!(item.confidence, 0.95);
        assert!(item.bounds.is_some());
    }

    #[test]
    fn test_mde_app_info_from_package() {
        let app = MdeAppInfo::from_package("com.ss.android.ugc.aweme");
        assert_eq!(app.name, "抖音");

        let app = MdeAppInfo::from_package("com.xingin.xhs");
        assert_eq!(app.name, "小红书");
    }

    #[test]
    fn test_mde_extraction_result() {
        let items = vec![
            MdeExtractedItem::new(MdeDataType::Comments)
                .with_field("content", "评论1"),
        ];
        let result = MdeExtractionResult::success(items, MdeExtractionMethod::Rule);
        assert!(result.success);
        assert_eq!(result.count(), 1);
    }
}
