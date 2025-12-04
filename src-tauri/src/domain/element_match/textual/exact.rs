// src-tauri/src/domain/element_match/textual/exact.rs
// module: element_match | layer: domain | role: 文本强等值匹配器
// summary: 迁移自 TextExactMatcher，实现 ElementMatcher 接口，包含唯一性检查

use crate::domain::element_match::core::context::MatchContext;
use crate::domain::element_match::core::traits::ElementMatcher;
use crate::domain::element_match::core::types::{MatchMode, MatchResult};
use crate::engine::xml_indexer::XmlIndexer;

pub struct TextExactMatcher;

impl TextExactMatcher {
    pub fn new() -> Self {
        Self
    }

    /// 🎯 核心：检查文本/content-desc 在页面中的唯一性
    /// 返回 (是否唯一, 匹配数量, 说明)
    fn check_uniqueness(&self, indexer: &XmlIndexer, text: &str, content_desc: &str) -> (bool, usize, String) {
        // 优先检查 content-desc 唯一性
        if !content_desc.is_empty() {
            if let Some(nodes) = indexer.content_desc_index.get(content_desc) {
                let count = nodes.len();
                if count == 1 {
                    return (true, count, format!("content-desc=\"{}\" 在页面中唯一", content_desc));
                } else {
                    return (false, count, format!("content-desc=\"{}\" 在页面中出现{}次", content_desc, count));
                }
            }
        }
        
        // 其次检查 text 唯一性
        if !text.is_empty() {
            if let Some(nodes) = indexer.text_index.get(text) {
                let count = nodes.len();
                if count == 1 {
                    return (true, count, format!("text=\"{}\" 在页面中唯一", text));
                } else {
                    return (false, count, format!("text=\"{}\" 在页面中出现{}次", text, count));
                }
            }
        }
        
        // 都没找到索引（理论上不应该发生）
        (false, 0, "未找到文本索引".to_string())
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

    fn is_applicable(&self, ctx: &MatchContext) -> bool {
        let node = &ctx.xml_indexer.all_nodes[ctx.clicked_node_index];
        let text = node.element.text.as_str().trim();
        let content_desc = node.element.content_desc.as_str().trim();
        // 至少有一个文本属性才适用
        !text.is_empty() || !content_desc.is_empty()
    }

    fn match_element(&self, ctx: &MatchContext) -> MatchResult {
        let node = &ctx.xml_indexer.all_nodes[ctx.clicked_node_index];
        let text = node.element.text.as_str().trim();
        let content_desc = node.element.content_desc.as_str().trim();
        
        // 优先检查content-desc，其次检查text
        let target_text = if !content_desc.is_empty() { content_desc } else { text };
        
        // 🎯 Step 1: 稳定性检查（文本内容是否动态变化）
        let (is_stable, stability_reason) = self.analyze_text_stability(target_text);
        
        // 🎯 Step 2: 唯一性检查（文本在页面中是否唯一）
        let (is_unique, match_count, uniqueness_reason) = self.check_uniqueness(
            ctx.xml_indexer, 
            text, 
            content_desc
        );
        
        // 🎯 Step 3: 综合评分
        // - 唯一 + 稳定 = 高置信度 (0.90-0.95)
        // - 唯一 + 不稳定 = 中等置信度 (0.70-0.80) - 可能会变，但目前能定位
        // - 不唯一 + 稳定 = 低置信度 (0.40-0.60) - 需要结合位置
        // - 不唯一 + 不稳定 = 很低置信度 (0.10-0.30)
        
        let conf = match (is_unique, is_stable) {
            (true, true) => self.calculate_text_confidence(target_text),  // 0.85-0.95
            (true, false) => 0.75,  // 唯一但可能变化
            (false, true) => 0.50 - (match_count as f32 * 0.05).min(0.30),  // 稳定但不唯一，惩罚重复
            (false, false) => 0.20,  // 既不唯一又不稳定
        };
        
        // 构建唯一性标记字符串
        let uniqueness_label = if is_unique { 
            "✓唯一".to_string() 
        } else { 
            format!("✗{}个匹配", match_count) 
        };
        let stability_label = if is_stable { "✓稳定" } else { "✗不稳定" };
        
        let explain = format!(
            "文本匹配: \"{}\" | 唯一性: {} ({}) | 稳定性: {} ({})",
            target_text,
            uniqueness_label,
            uniqueness_reason,
            stability_label,
            stability_reason
        );

        MatchResult { 
            mode: MatchMode::TextExact, 
            confidence: conf, 
            passed_gate: conf >= 0.70, // 唯一性通过才能过闸
            explain 
        }
    }
}
