//! matching/mod.rs - 智能脚本匹配协作模块聚合

mod hierarchy_matcher;
mod legacy_regex;
pub mod matching_strategies;
mod unified;
mod enhanced_element_matcher; // 🆕 增强型元素匹配器
pub mod smart_xpath_generator; // 🆕 智能 XPath 生成器
mod candidate_evaluator; // 🆕 多候选元素评估器

pub use legacy_regex::{
    find_all_follow_buttons, find_element_in_ui,
};
pub use unified::{run_unified_match, LegacyUiActions};

// 导出增强型匹配器
pub use enhanced_element_matcher::{
    EnhancedElementMatcher, 
    EnhancedMatchingConfig, 
    AttributeWeights,
    MatchResult,
    ElementInfo,
};

// 导出智能 XPath 生成器
pub use smart_xpath_generator::{
    SmartXPathGenerator,
    XPathStrategy,
    XPathCandidate,
    ElementAttributes,
};

// 导出多候选评估器
pub use candidate_evaluator::{
    CandidateElement,
    TargetFeatures,
};

// 导出策略处理器相关类型

// 导出层级匹配器
