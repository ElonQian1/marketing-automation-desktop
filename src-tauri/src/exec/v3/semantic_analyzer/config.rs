// src/exec/v3/semantic_analyzer/config.rs
// module: semantic-analyzer | layer: domain | role: 语义分析配置管理
// summary: 管理文本匹配模式和反义词配置

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// 文本匹配模式
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TextMatchingMode {
    /// 绝对匹配：必须完全匹配，不启用反义词检测
    Exact,
    /// 部分匹配：允许部分文本匹配，启用反义词检测
    Partial,
}

impl Default for TextMatchingMode {
    fn default() -> Self {
        Self::Partial
    }
}

/// 反义词对配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AntonymPair {
    /// 正面词汇
    pub positive: String,
    /// 反面词汇
    pub negative: String,
    /// 是否启用双向检测
    pub bidirectional: bool,
    /// 是否启用（用户可禁用某些反义词对）
    pub enabled: bool,
    /// 用户备注
    pub description: Option<String>,
}

impl AntonymPair {
    pub fn new(positive: &str, negative: &str) -> Self {
        Self {
            positive: positive.to_string(),
            negative: negative.to_string(),
            bidirectional: true,
            enabled: true,
            description: None,
        }
    }

    pub fn with_description(mut self, description: &str) -> Self {
        self.description = Some(description.to_string());
        self
    }

    pub fn unidirectional(mut self) -> Self {
        self.bidirectional = false;
        self
    }
}

/// 语义分析配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SemanticConfig {
    /// 文本匹配模式
    pub text_matching_mode: TextMatchingMode,
    /// 是否启用反义词检测
    pub enable_antonym_detection: bool,
    /// 反义词惩罚分数
    pub antonym_penalty_score: f32,
    /// 最低有效匹配分数
    pub min_valid_score: f32,
    /// 用户自定义反义词对
    pub custom_antonym_pairs: Vec<AntonymPair>,
    /// 是否启用内置反义词对
    pub enable_builtin_antonyms: bool,
}

impl Default for SemanticConfig {
    fn default() -> Self {
        Self {
            text_matching_mode: TextMatchingMode::Partial,
            enable_antonym_detection: true,
            antonym_penalty_score: -2.0,
            min_valid_score: 0.3,
            custom_antonym_pairs: Vec::new(),
            enable_builtin_antonyms: true,
        }
    }
}

impl SemanticConfig {
    /// 创建绝对匹配模式的配置
    pub fn exact_mode() -> Self {
        Self {
            text_matching_mode: TextMatchingMode::Exact,
            enable_antonym_detection: false,
            ..Default::default()
        }
    }

    /// 创建部分匹配模式的配置
    pub fn partial_mode() -> Self {
        Self {
            text_matching_mode: TextMatchingMode::Partial,
            enable_antonym_detection: true,
            ..Default::default()
        }
    }

    /// 添加自定义反义词对
    pub fn add_antonym_pair(&mut self, pair: AntonymPair) {
        self.custom_antonym_pairs.push(pair);
    }

    /// 移除自定义反义词对
    pub fn remove_antonym_pair(&mut self, positive: &str, negative: &str) {
        self.custom_antonym_pairs.retain(|pair| {
            !(pair.positive == positive && pair.negative == negative)
        });
    }

    /// 获取所有启用的反义词对
    pub fn get_enabled_antonym_pairs(&self) -> Vec<&AntonymPair> {
        self.custom_antonym_pairs
            .iter()
            .filter(|pair| pair.enabled)
            .collect()
    }

    /// 是否应该进行反义词检测
    pub fn should_detect_antonyms(&self) -> bool {
        matches!(self.text_matching_mode, TextMatchingMode::Partial) 
            && self.enable_antonym_detection
    }
}

/// 内置反义词对
pub fn get_builtin_antonym_pairs() -> Vec<AntonymPair> {
    vec![
        AntonymPair::new("关注", "已关注").with_description("关注状态"),
        AntonymPair::new("关注", "取消关注").with_description("关注操作"),
        AntonymPair::new("登录", "已登录").with_description("登录状态"),
        AntonymPair::new("登录", "退出登录").with_description("登录操作"),
        AntonymPair::new("连接", "已连接").with_description("连接状态"),
        AntonymPair::new("连接", "断开连接").with_description("连接操作"),
        AntonymPair::new("开启", "已开启").with_description("开启状态"),
        AntonymPair::new("开启", "关闭").with_description("开关操作"),
        AntonymPair::new("启用", "已启用").with_description("启用状态"),
        AntonymPair::new("启用", "禁用").with_description("启用操作"),
        AntonymPair::new("同意", "已同意").with_description("同意状态"),
        AntonymPair::new("同意", "拒绝").with_description("同意操作"),
        AntonymPair::new("订阅", "已订阅").with_description("订阅状态"),
        AntonymPair::new("订阅", "取消订阅").with_description("订阅操作"),
        AntonymPair::new("收藏", "已收藏").with_description("收藏状态"),
        AntonymPair::new("收藏", "取消收藏").with_description("收藏操作"),
        AntonymPair::new("喜欢", "已喜欢").with_description("喜欢状态"),
        AntonymPair::new("喜欢", "取消喜欢").with_description("喜欢操作"),
        AntonymPair::new("添加", "已添加").with_description("添加状态"),
        AntonymPair::new("删除", "已删除").with_description("删除状态"),
        AntonymPair::new("完成", "未完成").with_description("完成状态"),
        AntonymPair::new("发送", "已发送").with_description("发送状态"),
    ]
}

/// 配置管理器
#[derive(Debug, Clone)]
pub struct SemanticConfigManager {
    config: SemanticConfig,
    builtin_pairs: Vec<AntonymPair>,
}

impl SemanticConfigManager {
    pub fn new() -> Self {
        Self {
            config: SemanticConfig::default(),
            builtin_pairs: get_builtin_antonym_pairs(),
        }
    }

    pub fn with_config(config: SemanticConfig) -> Self {
        Self {
            config,
            builtin_pairs: get_builtin_antonym_pairs(),
        }
    }

    pub fn get_config(&self) -> &SemanticConfig {
        &self.config
    }

    pub fn update_config(&mut self, config: SemanticConfig) {
        self.config = config;
    }

    /// 获取所有可用的反义词对（内置 + 自定义）
    pub fn get_all_antonym_pairs(&self) -> Vec<&AntonymPair> {
        let mut pairs = Vec::new();
        
        // 添加内置反义词对
        if self.config.enable_builtin_antonyms {
            pairs.extend(self.builtin_pairs.iter());
        }
        
        // 添加启用的自定义反义词对
        pairs.extend(self.config.get_enabled_antonym_pairs());
        
        pairs
    }

    /// 添加自定义反义词对
    pub fn add_custom_antonym(&mut self, pair: AntonymPair) {
        self.config.add_antonym_pair(pair);
    }

    /// 移除自定义反义词对
    pub fn remove_custom_antonym(&mut self, positive: &str, negative: &str) {
        self.config.remove_antonym_pair(positive, negative);
    }

    /// 设置文本匹配模式
    pub fn set_text_matching_mode(&mut self, mode: TextMatchingMode) {
        self.config.text_matching_mode = mode.clone();
        // 绝对匹配模式自动禁用反义词检测
        if matches!(mode, TextMatchingMode::Exact) {
            self.config.enable_antonym_detection = false;
        }
    }

    /// 切换反义词检测开关
    pub fn set_antonym_detection(&mut self, enabled: bool) {
        // 只有在部分匹配模式下才能启用反义词检测
        if matches!(self.config.text_matching_mode, TextMatchingMode::Partial) {
            self.config.enable_antonym_detection = enabled;
        }
    }
}

impl Default for SemanticConfigManager {
    fn default() -> Self {
        Self::new()
    }
}
