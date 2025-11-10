// src-tauri/src/domain/structure_runtime_match/scorers/text_exact_matcher.rs
// module: structure_runtime_match | layer: domain | role: 文本强等值评分器
// summary: 仅当文本稳定才启用，避免把数字/时间/价格当等值键，适合关注/已关注等按钮

use super::types::{ScoreOutcome, MatchMode};
use crate::engine::xml_indexer::XmlIndexer;
use regex::Regex;

pub struct TextExactMatcher<'a> {
    pub xml_indexer: &'a XmlIndexer,
}

impl<'a> TextExactMatcher<'a> {
    pub fn new(xml_indexer: &'a XmlIndexer) -> Self {
        Self { xml_indexer }
    }

    pub fn score_text_exact(&self, node_index: usize) -> ScoreOutcome {
        let node = &self.xml_indexer.all_nodes[node_index];
        let text = node.element.text.as_deref().unwrap_or("").trim();
        let content_desc = node.element.content_desc.as_deref().unwrap_or("").trim();
        
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

        ScoreOutcome { 
            mode: MatchMode::TextExact, 
            conf, 
            passed_gate: false, 
            explain 
        }
    }

    fn analyze_text_stability(&self, text: &str) -> (bool, String) {
        if text.is_empty() {
            return (false, "文本为空".to_string());
        }

        // 创建正则表达式（考虑性能，实际使用时应该缓存这些正则）
        let re_num = Regex::new(r"^[\d,\.]+$").unwrap();
        let re_time = Regex::new(r"^\d{1,2}[:：]\d{2}$").unwrap();
        let re_date = Regex::new(r"^\d{1,2}[-/]\d{1,2}$").unwrap();
        let re_price = Regex::new(r"^[¥$€£]\d+(\.\d+)?$").unwrap();
        
        // 拒绝纯数字
        if re_num.is_match(text) {
            return (false, "纯数字".to_string());
        }
        
        // 拒绝时间格式
        if re_time.is_match(text) || re_date.is_match(text) {
            return (false, "时间/日期格式".to_string());
        }
        
        // 拒绝价格格式
        if re_price.is_match(text) {
            return (false, "价格格式".to_string());
        }
        
        // 拒绝过长文本（可能是动态内容）
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
        
        // 检查是否是常见的UI元素文本
        let ui_elements = ["确定", "取消", "保存", "提交", "发布", "OK", "Cancel", "Save", "Submit"];
        if ui_elements.iter().any(|&elem| text.contains(elem)) {
            return (true, "UI元素文本".to_string());
        }
        
        (false, "不符合稳定文本规则".to_string())
    }

    fn calculate_text_confidence(&self, text: &str) -> f32 {
        let mut confidence: f32 = 0.60; // 基础分数
        
        // 高价值关键词加分
        let high_value_keywords = ["关注", "已关注", "Follow", "Following"];
        if high_value_keywords.iter().any(|&kw| text.contains(kw)) {
            confidence += 0.25;
        }
        
        // 互动类关键词加分
        let interaction_keywords = ["点赞", "Like", "收藏", "分享", "评论"];
        if interaction_keywords.iter().any(|&kw| text.contains(kw)) {
            confidence += 0.15;
        }
        
        // 长度适中加分
        let char_count = text.chars().count();
        if char_count >= 2 && char_count <= 4 {
            confidence += 0.10;
        }
        
        // 纯中文或纯英文加分（混合语言可能不稳定）
        let is_chinese = text.chars().all(|c| '\u{4e00}' <= c && c <= '\u{9fff}' || c.is_whitespace());
        let is_english = text.chars().all(|c| c.is_ascii_alphabetic() || c.is_whitespace());
        if is_chinese || is_english {
            confidence += 0.05;
        }
        
        confidence.clamp(0.0, 1.0)
    }

    /// 检查文本是否适合作为精确匹配的键
    pub fn is_suitable_for_exact_match(&self, text: &str) -> bool {
        let (is_stable, _) = self.analyze_text_stability(text);
        is_stable
    }

    /// 获取节点的所有可用文本（包括text和content-desc）
    pub fn get_all_texts(&self, node_index: usize) -> Vec<String> {
        let node = &self.xml_indexer.all_nodes[node_index];
        let mut texts = Vec::new();
        
        if let Some(text) = &node.element.text {
            if !text.trim().is_empty() {
                texts.push(text.trim().to_string());
            }
        }
        
        if let Some(desc) = &node.element.content_desc {
            if !desc.trim().is_empty() {
                texts.push(desc.trim().to_string());
            }
        }
        
        texts
    }
}