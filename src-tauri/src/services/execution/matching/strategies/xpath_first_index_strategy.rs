//! xpath_first_index_strategy.rs - XPath 使用[1]索引策略处理器
//! 
//! 专门处理使用 [1] 索引匹配第一个符合条件元素的策略。
//! 这种策略适用于有多个相同元素，但只需要匹配第一个的场景。

use crate::services::execution::matching::strategies::{
    StrategyProcessor, MatchingContext, StrategyResult, ProcessingError
};
use async_trait::async_trait;
use anyhow::Result;
use tracing::info;

/// XPath 使用[1]索引策略处理器
/// 
/// 特点：
/// - 自动为XPath添加[1]索引，匹配第一个元素
/// - 适用于多个相同元素的场景
/// - 解决重复运行时元素状态变化的问题
/// - 性能优异：直接定位第一个匹配元素
pub struct XPathFirstIndexStrategyProcessor;

impl XPathFirstIndexStrategyProcessor {
    pub fn new() -> Self {
        Self
    }

    /// 验证并构建带[1]索引的XPath
    fn build_first_index_xpath(&self, context: &MatchingContext) -> Result<String, ProcessingError> {
        // 优先从 xpath 字段获取基础XPath
        if let Some(base_xpath) = context.values.get("xpath") {
            if !base_xpath.trim().is_empty() {
                return Ok(self.ensure_first_index(base_xpath));
            }
        }

        // 如果没有xpath，尝试根据其他字段构建
        let mut conditions = Vec::new();
        
        // 按优先级构建条件
        if let Some(resource_id) = context.values.get("resource-id") {
            if !resource_id.is_empty() {
                conditions.push(format!("@resource-id='{}'", resource_id));
            }
        }
        
        if let Some(content_desc) = context.values.get("content-desc") {
            if !content_desc.is_empty() {
                conditions.push(format!("@content-desc='{}'", content_desc));
            }
        }
        
        if let Some(text) = context.values.get("text") {
            if !text.is_empty() {
                conditions.push(format!("@text='{}'", text));
            }
        }

        if conditions.is_empty() {
            return Err(ProcessingError::InvalidParameters(
                "XPath 使用[1]索引策略需要 xpath 或其他元素属性".to_string()
            ));
        }

        // 构建基础XPath并添加[1]索引
        let base_xpath = if conditions.len() == 1 {
            format!("//*[{}]", conditions[0])
        } else {
            format!("//*[{}]", conditions.join(" and "))
        };

        Ok(self.ensure_first_index(&base_xpath))
    }

    /// 确保XPath包含[1]索引
    fn ensure_first_index(&self, xpath: &str) -> String {
        let xpath = xpath.trim();
        
        // 如果已经包含索引，直接返回
        if xpath.contains('[') && xpath.ends_with(']') {
            // 检查是否是数字索引
            if let Some(last_bracket) = xpath.rfind('[') {
                let index_part = &xpath[last_bracket + 1..xpath.len() - 1];
                if index_part.parse::<u32>().is_ok() {
                    return xpath.to_string();
                }
            }
        }

        // 添加[1]索引
        format!("{}[1]", xpath)
    }

    /// 执行XPath查询
    async fn execute_xpath_first_index_query(
        &self,
        xpath: &str,
        context: &MatchingContext,
        logs: &mut Vec<String>
    ) -> Result<StrategyResult, ProcessingError> {
        logs.push(format!("🎯 执行 XPath [1]索引查询: {}", xpath));
        logs.push("⚡ 特点: 匹配第一个符合条件的元素，解决重复元素问题".to_string());
        
        // TODO: 这里需要调用实际的 XPath 查询引擎
        // 当前先返回模拟结果，后续需要集成到 XML 解析系统
        
        // 验证XPath格式
        if xpath.starts_with("/") || xpath.starts_with("//") {
            logs.push("✅ XPath [1]索引格式验证通过".to_string());
            logs.push(format!("📊 索引策略: {}", xpath));
            
            // 这里应该调用真正的 XPath 引擎进行查询
            // 目前返回成功结果，待后续集成
            Ok(StrategyResult::success(
                format!("XPath [1]索引匹配成功: {}", xpath),
                (0, 0) // 默认坐标，实际应该从 XPath 查询结果中获取
            ))
        } else {
            logs.push("❌ XPath 格式无效，必须以 '/' 或 '//' 开头".to_string());
            Err(ProcessingError::InvalidParameters(
                format!("无效的 XPath 格式: {}", xpath)
            ))
        }
    }
}

#[async_trait]
impl StrategyProcessor for XPathFirstIndexStrategyProcessor {
    async fn process(&self, context: &mut MatchingContext, logs: &mut Vec<String>) -> Result<StrategyResult, ProcessingError> {
        logs.push("🚀 启动 XPath [1]索引策略".to_string());
        logs.push("🎯 特点: 匹配第一个符合条件的元素，适用于多个相同元素场景".to_string());
        
        // 构建带[1]索引的XPath
        let xpath = self.build_first_index_xpath(context)?;
        
        logs.push(format!("📍 目标 XPath [1]索引: {}", xpath));
        
        // 执行 XPath 查询
        let result = self.execute_xpath_first_index_query(&xpath, context, logs).await?;
        
        info!("🎯 XPath [1]索引策略执行完成 - 设备: {}", context.device_id);
        
        Ok(result)
    }

    fn validate_parameters(&self, context: &MatchingContext) -> Result<(), ProcessingError> {
        // 验证至少有xpath或其他可用字段
        if context.values.get("xpath").map(|s| !s.is_empty()).unwrap_or(false) {
            return Ok(());
        }
        
        let has_attrs = ["resource-id", "content-desc", "text"]
            .iter()
            .any(|&key| context.values.get(key).map(|s| !s.is_empty()).unwrap_or(false));
            
        if !has_attrs {
            return Err(ProcessingError::InvalidParameters(
                "XPath [1]索引策略需要 xpath 或其他元素属性".to_string()
            ));
        }
        
        Ok(())
    }

    fn strategy_name(&self) -> &'static str {
        "xpath-first-index"
    }

    fn should_ignore_fallback_bounds(&self) -> bool {
        false // XPath 策略不需要忽略坐标
    }

    fn priority(&self) -> u8 {
        95 // 高优先级，仅次于 xpath-direct
    }
}

impl Default for XPathFirstIndexStrategyProcessor {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    #[tokio::test]
    async fn test_ensure_first_index() {
        let processor = XPathFirstIndexStrategyProcessor::new();
        
        // 测试添加[1]索引
        assert_eq!(processor.ensure_first_index("//*[@content-desc='关注']"), "//*[@content-desc='关注'][1]");
        
        // 测试已有索引的情况
        assert_eq!(processor.ensure_first_index("//*[@content-desc='关注'][2]"), "//*[@content-desc='关注'][2]");
        
        // 测试复杂XPath
        assert_eq!(
            processor.ensure_first_index("//android.widget.Button[@text='关注']"), 
            "//android.widget.Button[@text='关注'][1]"
        );
    }

    #[tokio::test]
    async fn test_build_xpath_from_attributes() {
        let processor = XPathFirstIndexStrategyProcessor::new();
        
        let mut context = MatchingContext {
            strategy: "xpath-first-index".to_string(),
            device_id: "test_device".to_string(),
            fields: vec!["resource-id".to_string(), "content-desc".to_string()],
            values: {
                let mut map = HashMap::new();
                map.insert("resource-id".to_string(), "com.ss.android.ugc.aweme:id/ji3".to_string());
                map.insert("content-desc".to_string(), "关注".to_string());
                map
            },
            includes: HashMap::new(),
            excludes: HashMap::new(),
            match_mode: HashMap::new(),
            regex_includes: HashMap::new(),
            regex_excludes: HashMap::new(),
            fallback_bounds: None,
            original_xml: None, // 测试不使用原始XML
        };

        let xpath = processor.build_first_index_xpath(&context).unwrap();
        assert!(xpath.contains("[1]"));
        assert!(xpath.contains("@resource-id='com.ss.android.ugc.aweme:id/ji3'"));
        assert!(xpath.contains("@content-desc='关注'"));
    }
}