//! hidden_element_parent_strategy.rs - 隐藏元素父容器查找策略处理器
//! 
//! 专门处理 bounds=[0,0][0,0] 的隐藏元素，根据文本内容查找可点击的父容器。
//! 实现跨设备兼容的父容器查找算法，使用文本语义匹配和DOM层级遍历。

use crate::services::execution::matching::strategies::{
    StrategyProcessor, MatchingContext, StrategyResult, ProcessingError
};
use crate::xml_judgment::HiddenElementParentConfig;
use async_trait::async_trait;
use anyhow::Result;
use serde_json::Value;

pub struct HiddenElementParentStrategyProcessor;

impl HiddenElementParentStrategyProcessor {
    pub fn new() -> Self {
        Self
    }

    /// 检测元素是否为隐藏元素（bounds=[0,0][0,0]）
    fn is_hidden_element(&self, element: &Value) -> bool {
        if let Some(bounds) = element.get("bounds").and_then(|b| b.as_str()) {
            bounds == "[0,0][0,0]"
        } else {
            false
        }
    }

    /// 验证元素文本是否匹配目标文本
    fn text_matches(&self, element: &Value, target_text: &str) -> bool {
        let text = element.get("text").and_then(|t| t.as_str()).unwrap_or("");
        let content_desc = element.get("content-desc").and_then(|c| c.as_str()).unwrap_or("");
        
        text.contains(target_text) || content_desc.contains(target_text)
    }

    /// 判断是否为可点击候选者
    fn is_clickable_candidate(&self, element: &Value, config: &HiddenElementParentConfig) -> bool {
        let class_name = element.get("class").and_then(|c| c.as_str()).unwrap_or("");
        let clickable = element.get("clickable").and_then(|c| c.as_str()).unwrap_or("false") == "true";
        let bounds = element.get("bounds").and_then(|b| b.as_str()).unwrap_or("");
        
        // 排除明显不可点击的元素
        if config.exclude_indicators.iter().any(|indicator| class_name.contains(indicator)) {
            return false;
        }

        // 必须有有效的bounds
        if bounds.is_empty() || bounds == "[0,0][0,0]" {
            return false;
        }

        // 判断可点击特征
        clickable || 
        config.clickable_indicators.iter().any(|indicator| class_name.contains(indicator)) ||
        class_name.to_lowercase().contains("button")
    }

    /// 判断是否为潜在父容器（通过层级关系）
    fn is_potential_parent(&self, candidate: &Value, hidden_element: &Value) -> bool {
        let candidate_index = candidate.get("index")
            .and_then(|i| i.as_str())
            .unwrap_or("0")
            .parse::<i32>()
            .unwrap_or(0);
        
        let hidden_index = hidden_element.get("index")
            .and_then(|i| i.as_str())
            .unwrap_or("0")
            .parse::<i32>()
            .unwrap_or(0);
        
        // 简单的层级判断：父容器通常在子元素之前出现且index更小
        candidate_index <= hidden_index
    }

    /// 检查是否包含相关文本
    fn contains_related_text(&self, element: &Value, target_text: &str) -> bool {
        let text = element.get("text").and_then(|t| t.as_str()).unwrap_or("");
        let content_desc = element.get("content-desc").and_then(|c| c.as_str()).unwrap_or("");
        let resource_id = element.get("resource-id").and_then(|r| r.as_str()).unwrap_or("");
        
        text.contains(target_text) || 
        content_desc.contains(target_text) ||
        resource_id.to_lowercase().contains(&target_text.to_lowercase())
    }

    /// 计算置信度分数
    fn calculate_confidence(&self, candidate: &Value, hidden_element: &Value, target_text: &str) -> f64 {
        let mut score = 0.0;
        
        let candidate_text = candidate.get("text").and_then(|t| t.as_str()).unwrap_or("");
        let candidate_desc = candidate.get("content-desc").and_then(|c| c.as_str()).unwrap_or("");
        let candidate_class = candidate.get("class").and_then(|c| c.as_str()).unwrap_or("");
        let clickable = candidate.get("clickable").and_then(|c| c.as_str()).unwrap_or("false") == "true";
        
        // 文本匹配加分
        if candidate_text.contains(target_text) { score += 0.4; }
        if candidate_desc.contains(target_text) { score += 0.3; }
        
        // 可点击属性加分
        if clickable { score += 0.2; }
        
        // 类型匹配加分
        if candidate_class.contains("Button") { score += 0.3; }
        else if candidate_class.contains("Text") && clickable { score += 0.2; }
        else if candidate_class.contains("Layout") && clickable { score += 0.1; }
        
        // 层级关系加分
        if self.is_potential_parent(candidate, hidden_element) { score += 0.1; }
        
        (score as f64).min(1.0)
    }

    /// 搜索父容器候选者
    fn search_parent_candidates(&self, 
        hidden_element: &Value, 
        all_elements: &[Value], 
        config: &HiddenElementParentConfig,
        logs: &mut Vec<String>
    ) -> Vec<Value> {
        let mut candidates = Vec::new();
        
        // 找到隐藏元素在数组中的位置
        let hidden_bounds = hidden_element.get("bounds").and_then(|b| b.as_str()).unwrap_or("");
        let hidden_text = hidden_element.get("text").and_then(|t| t.as_str()).unwrap_or("");
        
        logs.push(format!("🔍 搜索隐藏元素 '{}' 的父容器候选者", hidden_text));
        
        let element_index = all_elements.iter().position(|el| {
            el.get("bounds").and_then(|b| b.as_str()).unwrap_or("") == hidden_bounds &&
            el.get("text").and_then(|t| t.as_str()).unwrap_or("") == hidden_text
        });
        
        if let Some(index) = element_index {
            logs.push(format!("📍 找到隐藏元素位置: index {}", index));
            
            // 策略1: 查找在隐藏元素之前但层级更高的元素
            let search_start = if index >= 20 { index - 20 } else { 0 };
            for i in search_start..index {
                let candidate = &all_elements[i];
                
                if self.is_clickable_candidate(candidate, config) {
                    if self.is_potential_parent(candidate, hidden_element) {
                        candidates.push(candidate.clone());
                        logs.push(format!("✓ 找到层级候选者: {}", 
                            candidate.get("class").and_then(|c| c.as_str()).unwrap_or("unknown")));
                    }
                }
            }
        }
        
        // 策略2: 查找包含相似文本的容器
        if !config.target_text.is_empty() {
            for element in all_elements {
                if !self.same_element(element, hidden_element) && 
                   self.is_clickable_candidate(element, config) &&
                   self.contains_related_text(element, &config.target_text) {
                    candidates.push(element.clone());
                    logs.push(format!("✓ 找到文本候选者: {}", 
                        element.get("text").and_then(|t| t.as_str()).unwrap_or("无文本")));
                }
            }
        }
        
        // 去重
        candidates.sort_by(|a, b| {
            let score_a = self.calculate_confidence(a, hidden_element, &config.target_text);
            let score_b = self.calculate_confidence(b, hidden_element, &config.target_text);
            score_b.partial_cmp(&score_a).unwrap_or(std::cmp::Ordering::Equal)
        });
        
        candidates.dedup_by(|a, b| self.same_element(a, b));
        
        logs.push(format!("📊 总共找到 {} 个父容器候选者", candidates.len()));
        candidates
    }

    /// 判断两个元素是否为同一元素
    fn same_element(&self, element1: &Value, element2: &Value) -> bool {
        element1.get("bounds") == element2.get("bounds") &&
        element1.get("resource-id") == element2.get("resource-id") &&
        element1.get("text") == element2.get("text")
    }

    /// 选择最佳匹配
    fn select_best_match(&self, 
        candidates: &[Value], 
        hidden_element: &Value, 
        target_text: &str,
        confidence_threshold: f64,
        logs: &mut Vec<String>
    ) -> Option<Value> {
        if candidates.is_empty() {
            return None;
        }
        
        let mut scored_candidates: Vec<(Value, f64)> = candidates.iter()
            .map(|candidate| {
                let score = self.calculate_confidence(candidate, hidden_element, target_text);
                (candidate.clone(), score)
            })
            .collect();
        
        // 按置信度排序
        scored_candidates.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        
        if let Some((best_candidate, score)) = scored_candidates.first() {
            logs.push(format!("🎯 最佳候选者置信度: {:.1}%", score * 100.0));
            
            if *score >= confidence_threshold {
                logs.push("✅ 置信度满足阈值".to_string());
                Some(best_candidate.clone())
            } else {
                logs.push(format!("⚠️ 置信度不足 (阈值: {:.1}%)", confidence_threshold * 100.0));
                None
            }
        } else {
            None
        }
    }

    /// 计算元素中心坐标
    fn calculate_center_coordinates(&self, element: &Value) -> Option<(i32, i32)> {
        let bounds_str = element.get("bounds").and_then(|b| b.as_str())?;
        
        // 解析 [left,top][right,bottom] 格式
        let bounds_regex = regex::Regex::new(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]").ok()?;
        let captures = bounds_regex.captures(bounds_str)?;
        
        let left: i32 = captures.get(1)?.as_str().parse().ok()?;
        let top: i32 = captures.get(2)?.as_str().parse().ok()?;
        let right: i32 = captures.get(3)?.as_str().parse().ok()?;
        let bottom: i32 = captures.get(4)?.as_str().parse().ok()?;
        
        let center_x = (left + right) / 2;
        let center_y = (top + bottom) / 2;
        
        Some((center_x, center_y))
    }
}

#[async_trait]
impl StrategyProcessor for HiddenElementParentStrategyProcessor {
    async fn process(&self, context: &mut MatchingContext, logs: &mut Vec<String>) -> Result<StrategyResult, ProcessingError> {
        logs.push("🎯 开始隐藏元素父容器查找策略".to_string());
        
        // 从上下文中获取隐藏元素父配置
        // 注意：这里需要从 MatchingContext 中获取配置，但当前结构中没有
        // 我们需要扩展 MatchingContext 或通过其他方式传递配置
        let target_text = context.values.get("target_text")
            .ok_or_else(|| ProcessingError::InvalidParameters("缺少目标文本".to_string()))?;
        
        let config = HiddenElementParentConfig {
            target_text: target_text.clone(),
            max_traversal_depth: context.values.get("max_traversal_depth")
                .and_then(|v| v.parse().ok())
                .unwrap_or(5),
            clickable_indicators: vec![
                "Button".to_string(), 
                "ImageButton".to_string(), 
                "TextView".to_string(), 
                "LinearLayout".to_string(), 
                "RelativeLayout".to_string()
            ],
            exclude_indicators: vec![
                "ScrollView".to_string(), 
                "ListView".to_string(), 
                "RecyclerView".to_string()
            ],
            confidence_threshold: context.values.get("confidence_threshold")
                .and_then(|v| v.parse().ok())
                .unwrap_or(0.7),
        };
        
        // TODO: 这里需要获取XML数据和隐藏元素信息
        // 当前的 MatchingContext 结构需要扩展以支持这些信息
        logs.push("⚠️ 隐藏元素父查找策略实现中...".to_string());
        logs.push("需要扩展 MatchingContext 以支持 XML 数据和隐藏元素信息".to_string());
        
        Ok(StrategyResult::failure("隐藏元素父查找策略尚未完全实现".to_string()))
    }

    fn validate_parameters(&self, context: &MatchingContext) -> Result<(), ProcessingError> {
        if !context.values.contains_key("target_text") {
            return Err(ProcessingError::InvalidParameters("隐藏元素父查找策略需要 target_text 参数".to_string()));
        }
        
        Ok(())
    }

    fn strategy_name(&self) -> &'static str {
        "hidden-element-parent"
    }

    fn should_ignore_fallback_bounds(&self) -> bool {
        true // 隐藏元素父查找不使用固化坐标
    }

    fn priority(&self) -> u8 {
        90 // 较高优先级，但低于 standard 策略
    }
}