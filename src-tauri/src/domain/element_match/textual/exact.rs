// src-tauri/src/domain/element_match/textual/exact.rs
// module: element_match | layer: domain | role: 文本强等值匹配器
// summary: 迁移自 TextExactMatcher，实现 ElementMatcher 接口

use crate::domain::element_match::core::context::MatchContext;
use crate::domain::element_match::core::traits::ElementMatcher;
use crate::domain::element_match::core::types::{MatchMode, MatchResult};

pub struct TextExactMatcher;

impl TextExactMatcher {
    pub fn new() -> Self {
        Self
    }

    fn analyze_text_stability(&self, text: &str) -> (bool, String) {
        if text.is_empty() {
            return (false, "文本为空".to_string());
        }

        // 拒绝纯数字
        if text.chars().all(|c| c.is_ascii_digit() || c == '.' || c == ',') {
            return (false, "纯数字".to_string());
        }
        
        // 拒绝时间格式 (简化正则)
        if text.contains(':') && text.chars().any(|c| c.is_ascii_digit()) {
            return (false, "时间格式".to_string());
        }
        
        // 拒绝价格格式
        if text.starts_with('¥') || text.starts_with('$') {
            return (false, "价格格式".to_string());
        }
        
        // 拒绝过长文本
        if text.chars().count() > 12 {
            return (false, "文本过长".to_string());
        }
        
        // 检查是否在稳定文本白名单中
        let stable_keywords = [
            "关注", "已关注", "取消关注", "已添加",
            "Follow", "Following", "Unfollow", 
            "点赞", "已点赞", "Like", "Liked",
            "收藏", "已收藏", "Favorite", 
            "分享", "Share", "转发", "Repost",
            "评论", "Comment", "回复", "Reply",
            "更多", "More", "查看", "View",
            "编辑", "Edit", "删除", "Delete",
        ];
        
        for keyword in &stable_keywords {
            if text.contains(keyword) {
                return (true, format!("包含稳定关键词: {}", keyword));
            }
        }
        
        // 短文本且不包含数字，认为相对稳定
        if text.chars().count() <= 6 && !text.chars().any(|c| c.is_ascii_digit()) {
            return (true, "短文本无数字".to_string());
        }
        
        (false, "未知稳定性".to_string())
    }

    fn calculate_text_confidence(&self, text: &str) -> f32 {
        // 越短越精确，置信度越高
        let len = text.chars().count();
        if len <= 2 { 0.95 }
        else if len <= 4 { 0.90 }
        else if len <= 6 { 0.85 }
        else { 0.80 }
    }
}

impl ElementMatcher for TextExactMatcher {
    fn id(&self) -> &str {
        "textual.exact"
    }

    fn match_element(&self, ctx: &MatchContext) -> MatchResult {
        let node = &ctx.xml_indexer.all_nodes[ctx.clicked_node_index];
        let text = node.element.text.as_str().trim();
        let content_desc = node.element.content_desc.as_str().trim();
        
        // 优先检查文本，其次检查content-desc
        let target_text = if !text.is_empty() { text } else { content_desc };
        
        let (is_stable, stability_reason) = self.analyze_text_stability(target_text);
        
        let conf = if is_stable && !target_text.is_empty() { 
            self.calculate_text_confidence(target_text)
        } else { 
            0.0 
        };
        
        let explain = if is_stable {
            format!("文本强等值可用: \"{}\" ({})", target_text, stability_reason)
        } else {
            format!("文本不稳定: \"{}\" ({})", target_text, stability_reason)
        };

        MatchResult { 
            mode: MatchMode::TextExact, 
            confidence: conf, 
            passed_gate: conf >= 0.80, // 默认阈值
            explain 
        }
    }
}
