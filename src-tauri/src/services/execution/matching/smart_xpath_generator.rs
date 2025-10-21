//! smart_xpath_generator.rs - 智能 XPath 生成器
//! 
//! 模块: 执行引擎匹配系统 | 层级: 工具层 | 角色: XPath 智能生成
//! summary: 提供多策略 XPath 生成，支持容错性和适应性优化

use std::collections::HashMap;
use regex::Regex;
use tracing::{debug, warn};

/// XPath 生成策略
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum XPathStrategy {
    /// 基于 resource-id 的稳定策略
    ResourceId,
    /// 基于文本内容的策略
    Text,
    /// 基于 content-desc 的策略
    ContentDesc,
    /// 基于类名和层级的策略
    ClassHierarchy,
    /// 基于相对位置的策略
    RelativePosition,
    /// 组合多属性的策略
    Composite,
    /// 容错性最大化策略
    Fallback,
}

/// XPath 候选项
#[derive(Debug, Clone)]
pub struct XPathCandidate {
    pub xpath: String,
    pub strategy: XPathStrategy,
    pub confidence: f64,
    pub description: String,
}

/// 元素属性映射
pub type ElementAttributes = HashMap<String, String>;

/// 智能 XPath 生成器
/// 
/// 核心能力：
/// 1. 多策略生成：根据元素属性选择最佳 XPath 策略
/// 2. 容错性设计：生成多个候选 XPath，按可靠性排序
/// 3. 自适应优化：根据历史成功率调整策略权重
/// 4. 语义增强：考虑界面语义和用户意图
pub struct SmartXPathGenerator {
    /// 策略成功率统计（用于自适应优化）
    strategy_success_rates: HashMap<XPathStrategy, f64>,
}

impl SmartXPathGenerator {
    /// 创建新的智能 XPath 生成器
    pub fn new() -> Self {
        let mut strategy_success_rates = HashMap::new();
        
        // 初始化策略权重（基于经验值）
        strategy_success_rates.insert(XPathStrategy::ResourceId, 0.90);
        strategy_success_rates.insert(XPathStrategy::ContentDesc, 0.85);
        strategy_success_rates.insert(XPathStrategy::Text, 0.75);
        strategy_success_rates.insert(XPathStrategy::ClassHierarchy, 0.65);
        strategy_success_rates.insert(XPathStrategy::Composite, 0.80);
        strategy_success_rates.insert(XPathStrategy::RelativePosition, 0.70);
        strategy_success_rates.insert(XPathStrategy::Fallback, 0.60);

        Self {
            strategy_success_rates,
        }
    }

    /// 生成所有可能的 XPath 候选项
    pub fn generate_candidates(&self, attributes: &ElementAttributes) -> Vec<XPathCandidate> {
        let mut candidates = Vec::new();

        // 1. Resource ID 策略（最高优先级）
        if let Some(resource_id) = attributes.get("resource-id") {
            if !resource_id.is_empty() {
                candidates.extend(self.generate_resource_id_candidates(resource_id));
            }
        }

        // 2. Content Description 策略
        if let Some(content_desc) = attributes.get("content-desc") {
            if !content_desc.is_empty() {
                candidates.extend(self.generate_content_desc_candidates(content_desc));
            }
        }

        // 3. Text 策略
        if let Some(text) = attributes.get("text") {
            if !text.is_empty() {
                candidates.extend(self.generate_text_candidates(text));
            }
        }

        // 4. Class Hierarchy 策略
        if let Some(class_name) = attributes.get("class") {
            candidates.extend(self.generate_class_hierarchy_candidates(class_name, attributes));
        }

        // 5. Composite 策略（组合多属性）
        candidates.extend(self.generate_composite_candidates(attributes));

        // 6. Fallback 策略（基于 bounds）
        if let Some(bounds) = attributes.get("bounds") {
            candidates.extend(self.generate_fallback_candidates(bounds, attributes));
        }

        // 按置信度排序
        candidates.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap_or(std::cmp::Ordering::Equal));

        candidates
    }

    /// 生成最佳 XPath（返回置信度最高的候选项）
    pub fn generate_best_xpath(&self, attributes: &ElementAttributes) -> Option<XPathCandidate> {
        let candidates = self.generate_candidates(attributes);
        candidates.into_iter().next()
    }

    /// 基于 resource-id 生成候选项
    fn generate_resource_id_candidates(&self, resource_id: &str) -> Vec<XPathCandidate> {
        let base_confidence = self.strategy_success_rates.get(&XPathStrategy::ResourceId).copied().unwrap_or(0.9);
        
        vec![
            XPathCandidate {
                xpath: format!("//*[@resource-id='{}']", resource_id),
                strategy: XPathStrategy::ResourceId,
                confidence: base_confidence,
                description: format!("基于 resource-id 的精确匹配: {}", resource_id),
            },
            XPathCandidate {
                xpath: format!("(//*[@resource-id='{}'])[1]", resource_id),
                strategy: XPathStrategy::ResourceId,
                confidence: base_confidence * 0.95,
                description: format!("基于 resource-id 的首个元素匹配: {}", resource_id),
            },
        ]
    }

    /// 基于 content-desc 生成候选项
    fn generate_content_desc_candidates(&self, content_desc: &str) -> Vec<XPathCandidate> {
        let base_confidence = self.strategy_success_rates.get(&XPathStrategy::ContentDesc).copied().unwrap_or(0.85);
        
        let mut candidates = vec![
            XPathCandidate {
                xpath: format!("//*[@content-desc='{}']", content_desc),
                strategy: XPathStrategy::ContentDesc,
                confidence: base_confidence,
                description: format!("基于 content-desc 的精确匹配: {}", content_desc),
            },
        ];

        // 如果 content-desc 包含部分匹配的可能性
        if content_desc.len() > 3 {
            candidates.push(XPathCandidate {
                xpath: format!("//*[contains(@content-desc, '{}')]", content_desc),
                strategy: XPathStrategy::ContentDesc,
                confidence: base_confidence * 0.8,
                description: format!("基于 content-desc 的部分匹配: {}", content_desc),
            });
        }

        candidates
    }

    /// 基于 text 生成候选项
    fn generate_text_candidates(&self, text: &str) -> Vec<XPathCandidate> {
        let base_confidence = self.strategy_success_rates.get(&XPathStrategy::Text).copied().unwrap_or(0.75);
        
        let mut candidates = vec![
            XPathCandidate {
                xpath: format!("//*[@text='{}']", text),
                strategy: XPathStrategy::Text,
                confidence: base_confidence,
                description: format!("基于 text 属性的精确匹配: {}", text),
            },
            XPathCandidate {
                xpath: format!("//*[normalize-space(text())='{}']", text.trim()),
                strategy: XPathStrategy::Text,
                confidence: base_confidence * 0.95,
                description: format!("基于标准化文本内容的匹配: {}", text.trim()),
            },
        ];

        // 部分匹配（针对长文本）
        if text.len() > 5 {
            candidates.push(XPathCandidate {
                xpath: format!("//*[contains(text(), '{}')]", text),
                strategy: XPathStrategy::Text,
                confidence: base_confidence * 0.7,
                description: format!("基于文本的部分匹配: {}", text),
            });
        }

        candidates
    }

    /// 基于类名层级生成候选项
    fn generate_class_hierarchy_candidates(&self, class_name: &str, attributes: &ElementAttributes) -> Vec<XPathCandidate> {
        let base_confidence = self.strategy_success_rates.get(&XPathStrategy::ClassHierarchy).copied().unwrap_or(0.65);
        
        let mut candidates = vec![
            XPathCandidate {
                xpath: format!("//*[@class='{}']", class_name),
                strategy: XPathStrategy::ClassHierarchy,
                confidence: base_confidence * 0.6, // 类名匹配通常不够精确
                description: format!("基于类名的匹配: {}", class_name),
            },
        ];

        // 如果有索引信息，增加精确度
        if let Some(index) = attributes.get("index") {
            if let Ok(idx) = index.parse::<usize>() {
                candidates.push(XPathCandidate {
                    xpath: format!("(//*[@class='{}'])[{}]", class_name, idx + 1),
                    strategy: XPathStrategy::ClassHierarchy,
                    confidence: base_confidence * 0.8,
                    description: format!("基于类名和索引的匹配: {} [{}]", class_name, idx + 1),
                });
            }
        }

        candidates
    }

    /// 基于组合属性生成候选项
    fn generate_composite_candidates(&self, attributes: &ElementAttributes) -> Vec<XPathCandidate> {
        let base_confidence = self.strategy_success_rates.get(&XPathStrategy::Composite).copied().unwrap_or(0.8);
        let mut candidates = Vec::new();

        // 组合 1: resource-id + class
        if let (Some(resource_id), Some(class_name)) = (attributes.get("resource-id"), attributes.get("class")) {
            if !resource_id.is_empty() && !class_name.is_empty() {
                candidates.push(XPathCandidate {
                    xpath: format!("//*[@resource-id='{}' and @class='{}']", resource_id, class_name),
                    strategy: XPathStrategy::Composite,
                    confidence: base_confidence,
                    description: format!("组合匹配: resource-id='{}' + class='{}'", resource_id, class_name),
                });
            }
        }

        // 组合 2: text + class
        if let (Some(text), Some(class_name)) = (attributes.get("text"), attributes.get("class")) {
            if !text.is_empty() && !class_name.is_empty() {
                candidates.push(XPathCandidate {
                    xpath: format!("//*[@text='{}' and @class='{}']", text, class_name),
                    strategy: XPathStrategy::Composite,
                    confidence: base_confidence * 0.9,
                    description: format!("组合匹配: text='{}' + class='{}'", text, class_name),
                });
            }
        }

        // 组合 3: content-desc + class
        if let (Some(content_desc), Some(class_name)) = (attributes.get("content-desc"), attributes.get("class")) {
            if !content_desc.is_empty() && !class_name.is_empty() {
                candidates.push(XPathCandidate {
                    xpath: format!("//*[@content-desc='{}' and @class='{}']", content_desc, class_name),
                    strategy: XPathStrategy::Composite,
                    confidence: base_confidence * 0.95,
                    description: format!("组合匹配: content-desc='{}' + class='{}'", content_desc, class_name),
                });
            }
        }

        candidates
    }

    /// 基于 bounds 的 fallback 候选项
    fn generate_fallback_candidates(&self, bounds: &str, attributes: &ElementAttributes) -> Vec<XPathCandidate> {
        let base_confidence = self.strategy_success_rates.get(&XPathStrategy::Fallback).copied().unwrap_or(0.6);
        let mut candidates = Vec::new();

        // 直接基于 bounds 的匹配（最后的手段）
        if !bounds.is_empty() && bounds != "[0,0][0,0]" {
            candidates.push(XPathCandidate {
                xpath: format!("//*[@bounds='{}']", bounds),
                strategy: XPathStrategy::Fallback,
                confidence: base_confidence * 0.5, // 很低的置信度，因为 bounds 经常变化
                description: format!("Fallback: 基于 bounds 的匹配: {}", bounds),
            });

            // 如果有类名，结合 bounds
            if let Some(class_name) = attributes.get("class") {
                if !class_name.is_empty() {
                    candidates.push(XPathCandidate {
                        xpath: format!("//*[@class='{}' and @bounds='{}']", class_name, bounds),
                        strategy: XPathStrategy::Fallback,
                        confidence: base_confidence * 0.7,
                        description: format!("Fallback: class + bounds 组合匹配"),
                    });
                }
            }
        }

        candidates
    }

    /// 更新策略成功率（用于自适应优化）
    pub fn update_success_rate(&mut self, strategy: XPathStrategy, success: bool) {
        let current_rate = self.strategy_success_rates.get(&strategy).copied().unwrap_or(0.5);
        
        // 简单的移动平均更新
        let learning_rate = 0.1;
        let new_rate = if success {
            current_rate + (1.0 - current_rate) * learning_rate
        } else {
            current_rate * (1.0 - learning_rate)
        };
        
        self.strategy_success_rates.insert(strategy.clone(), new_rate.clamp(0.1, 0.95));
        
        debug!("更新策略 {:?} 成功率: {:.3} -> {:.3}", &strategy, current_rate, new_rate);
    }

    /// 验证 XPath 语法正确性
    pub fn validate_xpath(&self, xpath: &str) -> bool {
        // 基本的 XPath 语法检查
        if xpath.is_empty() {
            return false;
        }

        // 检查基本的 XPath 结构
        let has_valid_start = xpath.starts_with("//") || xpath.starts_with("/") || xpath.starts_with("(");
        let has_balanced_brackets = self.check_balanced_brackets(xpath);
        let has_valid_chars = !xpath.contains('\n') && !xpath.contains('\r');

        has_valid_start && has_balanced_brackets && has_valid_chars
    }

    /// 检查括号平衡
    fn check_balanced_brackets(&self, xpath: &str) -> bool {
        let mut square_count = 0;
        let mut paren_count = 0;
        let mut single_quote = false;
        let mut double_quote = false;

        for ch in xpath.chars() {
            match ch {
                '\'' if !double_quote => single_quote = !single_quote,
                '"' if !single_quote => double_quote = !double_quote,
                '[' if !single_quote && !double_quote => square_count += 1,
                ']' if !single_quote && !double_quote => square_count -= 1,
                '(' if !single_quote && !double_quote => paren_count += 1,
                ')' if !single_quote && !double_quote => paren_count -= 1,
                _ => {}
            }
            
            if square_count < 0 || paren_count < 0 {
                return false;
            }
        }

        square_count == 0 && paren_count == 0 && !single_quote && !double_quote
    }
}

impl Default for SmartXPathGenerator {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_resource_id_generation() {
        let generator = SmartXPathGenerator::new();
        let mut attributes = HashMap::new();
        attributes.insert("resource-id".to_string(), "com.example:id/button".to_string());

        let candidates = generator.generate_candidates(&attributes);
        assert!(!candidates.is_empty());
        
        let best = candidates.first().unwrap();
        assert!(best.xpath.contains("@resource-id='com.example:id/button'"));
        assert!(best.confidence > 0.8);
    }

    #[test]
    fn test_xpath_validation() {
        let generator = SmartXPathGenerator::new();
        
        assert!(generator.validate_xpath("//*[@resource-id='test']"));
        assert!(generator.validate_xpath("//button[@text='Click']"));
        assert!(generator.validate_xpath("(//*[@class='View'])[1]"));
        
        assert!(!generator.validate_xpath(""));
        assert!(!generator.validate_xpath("invalid[xpath"));
        assert!(!generator.validate_xpath("//*[@text='unclosed"));
    }

    #[test]
    fn test_composite_generation() {
        let generator = SmartXPathGenerator::new();
        let mut attributes = HashMap::new();
        attributes.insert("resource-id".to_string(), "btn".to_string());
        attributes.insert("class".to_string(), "Button".to_string());
        attributes.insert("text".to_string(), "Click Me".to_string());

        let candidates = generator.generate_candidates(&attributes);
        
        // 应该包含多种策略的候选项
        let strategies: Vec<_> = candidates.iter().map(|c| &c.strategy).collect();
        assert!(strategies.contains(&&XPathStrategy::ResourceId));
        assert!(strategies.contains(&&XPathStrategy::Composite));
        assert!(strategies.contains(&&XPathStrategy::Text));
    }
}