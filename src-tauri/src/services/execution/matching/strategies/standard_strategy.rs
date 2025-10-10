//! standard_strategy.rs - Standard 匹配策略处理器
//! 
//! Standard 策略专注于语义字段匹配，忽略位置相关信息，实现跨设备稳定匹配。
//! 这是解决用户问题的核心策略：使用语义配置而不是使用固化坐标。

use super::{StrategyProcessor, MatchingContext, StrategyResult, ProcessingError};
use async_trait::async_trait;
use anyhow::Result;
use tracing::{info, warn, debug};
use std::collections::HashMap;

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
        
        // 临时禁用：等待重构为使用 universal_ui_page_analyzer
        logs.push("⚠️ Standard 策略暂时不可用，正在重构为使用统一解析器".to_string());
        
        Ok(StrategyResult::failure("Standard 策略暂时不可用".to_string()))
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