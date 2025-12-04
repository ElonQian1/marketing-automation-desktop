// src-tauri/src/domain/element_match/pipeline/processor.rs
// module: element_match | layer: domain | role: 匹配流水线处理器
// summary: 负责编排和执行各种匹配策略

use crate::domain::element_match::core::context::MatchContext;
use crate::domain::element_match::core::traits::ElementMatcher;
use crate::domain::element_match::core::types::MatchResult;
use std::sync::Arc;

pub struct MatchPipeline {
    matchers: Vec<Arc<dyn ElementMatcher + Send + Sync>>,
}

impl MatchPipeline {
    pub fn new() -> Self {
        Self {
            matchers: Vec::new(),
        }
    }

    pub fn add_matcher<M: ElementMatcher + Send + Sync + 'static>(mut self, matcher: M) -> Self {
        self.matchers.push(Arc::new(matcher));
        self
    }

    pub fn execute(&self, ctx: &MatchContext) -> Vec<MatchResult> {
        let mut results = Vec::new();
        
        for matcher in &self.matchers {
            // 🔧 修复：先检查 is_applicable，避免在不适用的情况下调用 match_element
            // 这可以防止某些 matcher 在缺少必要上下文时 panic
            if !matcher.is_applicable(ctx) {
                tracing::debug!(
                    "⏭️ [MatchPipeline] 跳过不适用的匹配器: {}",
                    matcher.id()
                );
                continue;
            }
            
            let result = matcher.match_element(ctx);
            results.push(result);
        }
        
        // 按置信度降序排序
        results.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap_or(std::cmp::Ordering::Equal));
        
        results
    }
    
    /// 获取最佳匹配结果
    pub fn get_best_match(&self, ctx: &MatchContext) -> Option<MatchResult> {
        let results = self.execute(ctx);
        results.into_iter().find(|r| r.passed_gate)
    }
}
