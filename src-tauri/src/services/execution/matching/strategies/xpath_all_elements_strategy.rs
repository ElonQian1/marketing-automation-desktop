//! xpath_all_elements_strategy.rs - XPath 返回所有同类元素策略处理器
//! 
//! 专门处理返回所有符合条件的同类元素的策略。
//! 这种策略适用于需要批量操作多个相同元素的场景。

use crate::services::execution::matching::strategies::{
    StrategyProcessor, MatchingContext, StrategyResult, ProcessingError
};
use async_trait::async_trait;
use anyhow::Result;
use tracing::{info, warn, debug};

/// XPath 返回所有同类元素策略处理器
/// 
/// 特点：
/// - 返回所有符合条件的元素
/// - 适用于批量操作场景
/// - 支持遍历和统计功能
/// - 可配合循环使用
pub struct XPathAllElementsStrategyProcessor;

impl XPathAllElementsStrategyProcessor {
    pub fn new() -> Self {
        Self
    }

    /// 验证并构建XPath（不包含索引）
    fn build_all_elements_xpath(&self, context: &MatchingContext) -> Result<String, ProcessingError> {
        // 优先从 xpath 字段获取基础XPath
        if let Some(base_xpath) = context.values.get("xpath") {
            if !base_xpath.trim().is_empty() {
                return Ok(self.remove_index_from_xpath(base_xpath));
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
        
        if let Some(class) = context.values.get("class") {
            if !class.is_empty() {
                conditions.push(format!("@class='{}'", class));
            }
        }

        if conditions.is_empty() {
            return Err(ProcessingError::InvalidParameters(
                "XPath 返回所有元素策略需要 xpath 或其他元素属性".to_string()
            ));
        }

        // 构建基础XPath（不包含索引）
        let xpath = if conditions.len() == 1 {
            format!("//*[{}]", conditions[0])
        } else {
            format!("//*[{}]", conditions.join(" and "))
        };

        Ok(xpath)
    }

    /// 从XPath中移除索引
    fn remove_index_from_xpath(&self, xpath: &str) -> String {
        let xpath = xpath.trim();
        
        // 查找最后一个索引并移除
        if let Some(last_bracket_start) = xpath.rfind('[') {
            if let Some(last_bracket_end) = xpath.rfind(']') {
                if last_bracket_end == xpath.len() - 1 {
                    // 检查是否是数字索引
                    let index_part = &xpath[last_bracket_start + 1..last_bracket_end];
                    if index_part.parse::<u32>().is_ok() || index_part == "1" {
                        // 移除索引部分
                        return xpath[..last_bracket_start].to_string();
                    }
                }
            }
        }

        xpath.to_string()
    }

    /// 执行XPath查询（返回所有元素）
    async fn execute_xpath_all_elements_query(
        &self,
        xpath: &str,
        context: &MatchingContext,
        logs: &mut Vec<String>
    ) -> Result<StrategyResult, ProcessingError> {
        logs.push(format!("🎯 执行 XPath 获取所有元素: {}", xpath));
        logs.push("⚡ 特点: 返回所有符合条件的同类元素，适用于批量操作".to_string());
        
        // TODO: 这里需要调用实际的 XPath 查询引擎
        // 当前先返回模拟结果，后续需要集成到 XML 解析系统
        
        // 验证XPath格式
        if xpath.starts_with("/") || xpath.starts_with("//") {
            logs.push("✅ XPath 所有元素格式验证通过".to_string());
            logs.push(format!("📊 批量策略: {}", xpath));
            
            // 模拟找到多个元素
            logs.push("🔍 发现多个匹配元素:".to_string());
            logs.push("  - 元素1: bounds=[472,231][616,287]".to_string());
            logs.push("  - 元素2: bounds=[472,402][616,458]".to_string());
            logs.push("  - 元素3: bounds=[472,573][616,629]".to_string());
            logs.push("📝 建议：可配合循环步骤实现批量操作".to_string());
            
            // 这里应该调用真正的 XPath 引擎进行查询
            // 目前返回成功结果，包含找到的元素数量信息
            Ok(StrategyResult::success(
                format!("XPath 找到所有元素: {} (模拟找到3个元素)", xpath),
                (472, 231) // 返回第一个元素的坐标作为示例
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
impl StrategyProcessor for XPathAllElementsStrategyProcessor {
    async fn process(&self, context: &mut MatchingContext, logs: &mut Vec<String>) -> Result<StrategyResult, ProcessingError> {
        logs.push("🚀 启动 XPath 返回所有元素策略".to_string());
        logs.push("🎯 特点: 获取所有符合条件的同类元素，适用于批量操作场景".to_string());
        
        // 构建XPath（移除索引）
        let xpath = self.build_all_elements_xpath(context)?;
        
        logs.push(format!("📍 目标 XPath 所有元素: {}", xpath));
        
        // 执行 XPath 查询
        let result = self.execute_xpath_all_elements_query(&xpath, context, logs).await?;
        
        info!("🎯 XPath 所有元素策略执行完成 - 设备: {}", context.device_id);
        
        Ok(result)
    }

    fn validate_parameters(&self, context: &MatchingContext) -> Result<(), ProcessingError> {
        // 验证至少有xpath或其他可用字段
        if context.values.get("xpath").map(|s| !s.is_empty()).unwrap_or(false) {
            return Ok(());
        }
        
        let has_attrs = ["resource-id", "content-desc", "text", "class"]
            .iter()
            .any(|&key| context.values.get(key).map(|s| !s.is_empty()).unwrap_or(false));
            
        if !has_attrs {
            return Err(ProcessingError::InvalidParameters(
                "XPath 所有元素策略需要 xpath 或其他元素属性".to_string()
            ));
        }
        
        Ok(())
    }

    fn strategy_name(&self) -> &'static str {
        "xpath-all-elements"
    }

    fn should_ignore_fallback_bounds(&self) -> bool {
        false // XPath 策略不需要忽略坐标
    }

    fn priority(&self) -> u8 {
        90 // 中等优先级，适用于特殊场景
    }
}

impl Default for XPathAllElementsStrategyProcessor {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    #[tokio::test]
    async fn test_remove_index_from_xpath() {
        let processor = XPathAllElementsStrategyProcessor::new();
        
        // 测试移除[1]索引
        assert_eq!(
            processor.remove_index_from_xpath("//*[@content-desc='关注'][1]"), 
            "//*[@content-desc='关注']"
        );
        
        // 测试移除其他索引
        assert_eq!(
            processor.remove_index_from_xpath("//*[@content-desc='关注'][3]"), 
            "//*[@content-desc='关注']"
        );
        
        // 测试没有索引的情况
        assert_eq!(
            processor.remove_index_from_xpath("//*[@content-desc='关注']"), 
            "//*[@content-desc='关注']"
        );
        
        // 测试复杂XPath
        assert_eq!(
            processor.remove_index_from_xpath("//android.widget.Button[@text='关注'][2]"), 
            "//android.widget.Button[@text='关注']"
        );
    }

    #[tokio::test]
    async fn test_build_xpath_from_multiple_attributes() {
        let processor = XPathAllElementsStrategyProcessor::new();
        
        let mut context = MatchingContext {
            strategy: "xpath-all-elements".to_string(),
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
            match_mode: None,
            regex_includes: HashMap::new(),
            regex_excludes: HashMap::new(),
            fallback_bounds: None,
        };

        let xpath = processor.build_all_elements_xpath(&context).unwrap();
        assert!(!xpath.contains("[1]")); // 不应该包含索引
        assert!(xpath.contains("@resource-id='com.ss.android.ugc.aweme:id/ji3'"));
        assert!(xpath.contains("@content-desc='关注'"));
    }
}