//! standard_strategy.rs - Standard 匹配策略处理器
//! 
//! Standard 策略专注于语义字段匹配，忽略位置相关信息，实现跨设备稳定匹配。
//! 这是解决用户问题的核心策略：使用语义配置而不是使用固化坐标。

use super::{StrategyProcessor, MatchingContext, StrategyResult, ProcessingError};
use async_trait::async_trait;
use anyhow::Result;
use tracing::{info, debug};
use std::collections::HashSet;

/// Standard 策略处理器
/// 
/// 特点：
/// - 完全忽略固化的 bounds 坐标
/// - 只使用语义字段进行匹配（package, class, text, content-desc 等）
/// - 支持 includes/excludes 过滤条件
/// - 确保跨设备、跨分辨率的稳定匹配
pub struct StandardStrategyProcessor;

impl StandardStrategyProcessor {
    pub fn new() -> Self {
        Self
    }
    
    /// 过滤掉位置相关字段，只保留语义字段
    fn filter_semantic_fields(&self, fields: &[String]) -> Vec<String> {
        let semantic_fields: Vec<String> = fields
            .iter()
            .filter(|field| !self.is_position_field(field))
            .cloned()
            .collect();
            
        debug!("🎯 Standard 策略过滤字段: {:?} -> {:?}", fields, semantic_fields);
        semantic_fields
    }
    
    /// 判断字段是否为位置相关字段
    fn is_position_field(&self, field: &str) -> bool {
        matches!(field, "bounds" | "index" | "x" | "y" | "center_x" | "center_y")
    }
    
    /// 过滤值中的位置相关字段
    fn filter_semantic_values(&self, values: &std::collections::HashMap<String, String>) 
        -> std::collections::HashMap<String, String> {
        values
            .iter()
            .filter(|(key, _)| !self.is_position_field(key))
            .map(|(k, v)| (k.clone(), v.clone()))
            .collect()
    }

    /// 过滤 match_mode，仅保留语义字段对应的模式
    fn filter_semantic_modes(&self, modes: &std::collections::HashMap<String, String>)
        -> std::collections::HashMap<String, String> {
        modes
            .iter()
            .filter(|(key, _)| !self.is_position_field(key))
            .map(|(k, v)| (k.clone(), v.clone()))
            .collect()
    }

    /// 过滤 regex map，仅保留语义字段
    fn filter_semantic_regex_map(
        &self,
        map: &std::collections::HashMap<String, Vec<String>>,
    ) -> std::collections::HashMap<String, Vec<String>> {
        map
            .iter()
            .filter(|(key, _)| !self.is_position_field(key))
            .map(|(k, v)| (k.clone(), v.clone()))
            .collect()
    }

    /// 执行 Standard 策略的实际匹配逻辑
    async fn perform_standard_matching(
        &self,
        context: &MatchingContext,
        semantic_fields: &[String],
        semantic_values: &std::collections::HashMap<String, String>,
        logs: &mut Vec<String>,
    ) -> Result<StrategyResult, ProcessingError> {
        use crate::services::universal_ui_page_analyzer::{parse_ui_elements_simple, UIElement};
        use crate::commands::ui_dump::get_ui_dump;
        
        logs.push("🎯 开始 Standard 策略实际匹配".to_string());
        
        // 1. 获取设备UI状态
        let ui_elements = match get_ui_dump(context.device_id.clone()).await {
            Ok(xml) => match parse_ui_elements_simple(&xml) {
                Ok(elements) => {
                    logs.push(format!("✅ 获取到 {} 个UI元素", elements.len()));
                    elements
                },
                Err(e) => {
                    logs.push(format!("❌ 解析UI失败: {}", e));
                    return Ok(StrategyResult::failure(format!("解析UI失败: {}", e)));
                }
            },
            Err(e) => {
                logs.push(format!("❌ 获取UI状态失败: {}", e));
                return Ok(StrategyResult::failure(format!("获取UI状态失败: {}", e)));
            }
        };

        if ui_elements.is_empty() {
            logs.push("⚠️ 未找到任何UI元素".to_string());
            return Ok(StrategyResult::failure("未找到任何UI元素".to_string()));
        }

        // 2. 遍历所有元素进行匹配
        let mut best_match: Option<(f64, &UIElement)> = None;
        
        for element in &ui_elements {
            let mut score = 0.0;
            let mut match_reasons = Vec::new();
            
            // 对每个语义值进行匹配
            for (field, target_value) in semantic_values {
                if target_value.trim().is_empty() {
                    continue;
                }
                
                let field_score = match field.as_str() {
                    "text" => {
                        if !element.text.is_empty() {
                            let similarity = self.calculate_text_similarity(&element.text, target_value);
                            if similarity > 0.0 {
                                match_reasons.push(format!("text匹配: '{}' vs '{}' (相似度: {:.2})", element.text, target_value, similarity));
                                similarity * 0.5 // text权重最高
                            } else {
                                0.0
                            }
                        } else {
                            0.0
                        }
                    }
                    "content-desc" => {
                        if !element.content_desc.is_empty() {
                            let similarity = self.calculate_text_similarity(&element.content_desc, target_value);
                            if similarity > 0.0 {
                                match_reasons.push(format!("content-desc匹配: '{}' vs '{}' (相似度: {:.2})", element.content_desc, target_value, similarity));
                                similarity * 0.3 // content-desc权重次高
                            } else {
                                0.0
                            }
                        } else {
                            0.0
                        }
                    }
                    "class" => {
                        if let Some(class_name) = &element.class_name {
                            if !class_name.is_empty() {
                                if class_name.contains(target_value) || target_value.contains(class_name) {
                                    match_reasons.push(format!("class匹配: '{}' vs '{}'", class_name, target_value));
                                    0.15 // class权重较低
                                } else {
                                    0.0
                                }
                            } else {
                                0.0
                            }
                        } else {
                            0.0
                        }
                    }
                    "resource-id" => {
                        if let Some(resource_id) = &element.resource_id {
                            if !resource_id.is_empty() {
                                // resource-id 需要精确匹配或包含匹配
                                if resource_id == target_value || resource_id.contains(target_value) || target_value.contains(resource_id) {
                                    match_reasons.push(format!("resource-id匹配: '{}' vs '{}'", resource_id, target_value));
                                    0.6 // resource-id权重很高，仅次于text
                                } else {
                                    0.0
                                }
                            } else {
                                0.0
                            }
                        } else {
                            0.0
                        }
                    }
                    _ => 0.0
                };
                
                score += field_score;
            }
            
            // 如果有匹配且分数更高，更新最佳匹配
            if score > 0.0 {
                logs.push(format!("🎯 元素匹配 [{}]: 分数={:.3}, 原因: {:?}", 
                    element.class_name.as_deref().unwrap_or(""), score, match_reasons));
                
                if best_match.is_none() || score > best_match.as_ref().unwrap().0 {
                    best_match = Some((score, element));
                }
            }
        }

        // 3. 返回匹配结果
        if let Some((score, element)) = best_match {
            logs.push(format!("✅ 找到最佳匹配元素，分数: {:.3}", score));
            
            // 提取点击坐标
            let x = element.bounds.center_x();
            let y = element.bounds.center_y();
            
            let bounds_str = format!("[{},{}][{},{}]", element.bounds.left, element.bounds.top, element.bounds.right, element.bounds.bottom);
            
            Ok(StrategyResult::success_with_bounds(
                format!("Standard策略匹配成功，分数: {:.3}", score),
                (x, y),
                bounds_str
            ))
        } else {
            logs.push("❌ 未找到匹配的元素".to_string());
            Ok(StrategyResult::failure("未找到匹配的UI元素".to_string()))
        }
    }

    /// 计算文本相似度
    fn calculate_text_similarity(&self, text1: &str, text2: &str) -> f64 {
        let text1_clean = text1.trim().to_lowercase();
        let text2_clean = text2.trim().to_lowercase();
        
        if text1_clean.is_empty() || text2_clean.is_empty() {
            return 0.0;
        }
        
        // 完全匹配
        if text1_clean == text2_clean {
            return 1.0;
        }
        
        // 包含匹配
        if text1_clean.contains(&text2_clean) || text2_clean.contains(&text1_clean) {
            return 0.8;
        }
        
        // 简单的词汇重叠度计算
        let words1: HashSet<&str> = text1_clean.split_whitespace().collect();
        let words2: HashSet<&str> = text2_clean.split_whitespace().collect();
        
        if words1.is_empty() && words2.is_empty() {
            return 1.0;
        }
        
        let intersection = words1.intersection(&words2).count();
        let union = words1.union(&words2).count();
        
        if union == 0 {
            0.0
        } else {
            intersection as f64 / union as f64
        }
    }

    /// 解析bounds字符串到中心坐标
    fn parse_bounds_to_center_coordinates(&self, bounds_str: &str) -> Result<(i32, i32), anyhow::Error> {
        // bounds格式通常是 "[left,top][right,bottom]"
        if bounds_str.is_empty() || bounds_str == "[0,0][0,0]" {
            return Err(anyhow::anyhow!("无效的bounds: {}", bounds_str));
        }
        
        // 使用正则表达式解析
        use regex::Regex;
        let re = Regex::new(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]")?;
        
        if let Some(caps) = re.captures(bounds_str) {
            let left: i32 = caps[1].parse()?;
            let top: i32 = caps[2].parse()?;
            let right: i32 = caps[3].parse()?;
            let bottom: i32 = caps[4].parse()?;
            
            let center_x = (left + right) / 2;
            let center_y = (top + bottom) / 2;
            
            return Ok((center_x, center_y));
        }
        
        Err(anyhow::anyhow!("无法解析bounds格式: {}", bounds_str))
    }
}

#[async_trait]
impl StrategyProcessor for StandardStrategyProcessor {
    async fn process(&self, context: &mut MatchingContext, logs: &mut Vec<String>) -> Result<StrategyResult, ProcessingError> {
        logs.push("🎯 使用 Standard 策略进行智能匹配".to_string());
        logs.push("📋 Standard 策略特点: 忽略位置信息，仅基于语义字段匹配".to_string());
        
        // 验证参数
        self.validate_parameters(context)?;
        
        // 过滤出语义字段
        let semantic_fields = self.filter_semantic_fields(&context.fields);
        if semantic_fields.is_empty() {
            logs.push("⚠️ 没有有效的语义字段，无法进行 Standard 匹配".to_string());
            return Ok(StrategyResult::failure("没有有效的语义字段".to_string()));
        }
        
        // 过滤值中的位置字段
        let semantic_values = self.filter_semantic_values(&context.values);
        
        logs.push(format!("🔍 语义字段: {:?}", semantic_fields));
        logs.push(format!("📝 语义值: {:?}", semantic_values));
        
        if !context.includes.is_empty() {
            logs.push(format!("✅ 包含条件: {:?}", context.includes));
        }
        if !context.excludes.is_empty() {
            logs.push(format!("❌ 排除条件: {:?}", context.excludes));
        }
        
        // 记录匹配条件摘要
        logs.push(format!("🧾 标准策略条件摘要: fields={:?}, values={:?}",
            semantic_fields, semantic_values));

        // 记录详细匹配条件
        logs.push(format!("📋 匹配模式: {:?}", context.match_mode));
        if !context.regex_includes.is_empty() {
            logs.push(format!("🧩 正则包含: {:?}", context.regex_includes));
        }
        if !context.regex_excludes.is_empty() {
            logs.push(format!("🚫 正则排除: {:?}", context.regex_excludes));
        }
        
        logs.push("�🚀 调用后端匹配引擎进行 Standard 匹配".to_string());
        info!("🎯 Standard 策略执行匹配 - 设备: {}", context.device_id);
        
        // 执行实际的 Standard 策略匹配
        logs.push("🎯 Standard 策略开始执行实际匹配".to_string());
        
        self.perform_standard_matching(context, &semantic_fields, &semantic_values, logs).await
    }
    
    fn validate_parameters(&self, context: &MatchingContext) -> Result<(), ProcessingError> {
        if context.fields.is_empty() && context.values.is_empty() {
            return Err(ProcessingError::InvalidParameters(
                "Standard 策略需要至少提供一个匹配字段或值".to_string()
            ));
        }
        
        Ok(())
    }
    
    fn strategy_name(&self) -> &'static str {
        "standard"
    }
    
    fn should_ignore_fallback_bounds(&self) -> bool {
        true // Standard 策略完全忽略固化坐标
    }
    
    fn priority(&self) -> u8 {
        10 // 高优先级
    }
}