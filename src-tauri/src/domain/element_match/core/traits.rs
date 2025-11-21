// src-tauri/src/domain/element_match/core/traits.rs
// module: element_match | layer: domain | role: 核心Trait定义
// summary: 定义所有匹配器必须实现的接口

use super::context::MatchContext;
use super::types::MatchResult;

pub trait ElementMatcher {
    /// 匹配器的唯一标识 (e.g., "structural.subtree")
    fn id(&self) -> &str;

    /// 核心方法：计算匹配度
    fn match_element(&self, ctx: &MatchContext) -> MatchResult;
    
    /// 预检查：当前上下文是否适合运行此匹配器
    /// 例如：如果没有卡片根，就不应该运行 SubtreeMatcher
    fn is_applicable(&self, _ctx: &MatchContext) -> bool {
        true
    }
}
