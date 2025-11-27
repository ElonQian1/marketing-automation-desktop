// src-tauri/src/domain/element_match/core/types.rs
// module: element_match | layer: domain | role: 核心类型定义
// summary: 定义匹配结果、匹配模式枚举等

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum MatchMode { 
    CardSubtree,   // 子孙骨架匹配
    LeafContext,   // 叶子上下文匹配
    TextExact,     // 文本强等值匹配
    HeuristicId,   // 启发式ID匹配
    HeuristicXPath,// 启发式XPath匹配
    Unknown,
}

impl MatchMode {
    pub fn display_name(&self) -> &'static str {
        match self {
            Self::CardSubtree => "子孙骨架",
            Self::LeafContext => "叶子上下文",
            Self::TextExact => "文本强等值",
            Self::HeuristicId => "ID锚点",
            Self::HeuristicXPath => "XPath路径",
            Self::Unknown => "未知",
        }
    }

    pub fn key(&self) -> &'static str {
        match self {
            Self::CardSubtree => "card_subtree_scoring",
            Self::LeafContext => "leaf_context_scoring",
            Self::TextExact => "text_exact_scoring",
            Self::HeuristicId => "heuristic_id_scoring",
            Self::HeuristicXPath => "heuristic_xpath_scoring",
            Self::Unknown => "unknown",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MatchResult {
    pub mode: MatchMode,
    pub confidence: f32,    // 0.0-1.0
    pub passed_gate: bool,  // 是否通过该策略的内部闸门
    pub explain: String,    // 解释文本
}

impl Default for MatchResult {
    fn default() -> Self {
        Self {
            mode: MatchMode::Unknown,
            confidence: 0.0,
            passed_gate: false,
            explain: String::new(),
        }
    }
}
