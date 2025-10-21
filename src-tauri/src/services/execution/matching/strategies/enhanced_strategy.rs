//! enhanced_strategy.rs - 增强型匹配策略处理器
//! 
//! 模块: 执行引擎匹配系统 | 层级: 策略层 | 角色: 智能匹配算法
//! summary: 集成增强型元素匹配器的策略处理器，提供多层级容错匹配

use crate::services::execution::matching::strategies::{
    StrategyProcessor, MatchingContext, StrategyResult, ProcessingError
};
use crate::services::execution::matching::{
    EnhancedElementMatcher, EnhancedMatchingConfig, AttributeWeights
};
use async_trait::async_trait;
use anyhow::Result;
use tracing::{info, warn};
use std::collections::HashMap;

/// 增强型匹配策略处理器
/// 
/// 特点：
/// - 多层级匹配：精确 → 模糊 → 上下文 → 结构
/// - 智能权重：根据属性稳定性动态调整
/// - 容错能力：编辑距离算法 + 相似度匹配
/// - 适用场景：界面变化频繁、传统匹配失效的复杂场景
pub struct EnhancedStrategyProcessor {
    matcher: EnhancedElementMatcher,
}

impl EnhancedStrategyProcessor {
    pub fn new() -> Self {
        let config = EnhancedMatchingConfig {
            similarity_threshold: 0.75,
            enable_fuzzy_matching: true,
            enable_context_matching: true,
            max_fallback_layers: 3,
            attribute_weights: AttributeWeights::default(),
        };
        
        Self {
            matcher: EnhancedElementMatcher::new(config),
        }
    }

    /// 创建带自定义配置的处理器
    pub fn with_config(config: EnhancedMatchingConfig) -> Self {
        Self {
            matcher: EnhancedElementMatcher::new(config),
        }
    }

    /// 从匹配上下文提取目标条件
    fn extract_target_criteria(&self, context: &MatchingContext) -> HashMap<String, String> {
        let mut criteria = HashMap::new();

        // 从 values 中提取标准属性
        for (key, value) in &context.values {
            match key.as_str() {
                "resource_id" | "resource-id" => {
                    criteria.insert("resource_id".to_string(), value.clone());
                }
                "text" => {
                    criteria.insert("text".to_string(), value.clone());
                }
                "content_desc" | "content-desc" => {
                    criteria.insert("content_desc".to_string(), value.clone());
                }
                "class" | "className" => {
                    criteria.insert("class".to_string(), value.clone());
                }
                "bounds" => {
                    criteria.insert("bounds".to_string(), value.clone());
                }
                _ => {
                    // 其他属性也加入，用于扩展匹配
                    criteria.insert(key.clone(), value.clone());
                }
            }
        }

        criteria
    }

    /// 获取设备 UI dump
    async fn get_device_ui_dump(&self, device_id: &str, logs: &mut Vec<String>) -> Result<String, ProcessingError> {
        use crate::services::adb_session_manager::get_device_session;
        
        logs.push("📱 获取设备最新 UI 结构...".to_string());
        
        match get_device_session(device_id).await {
            Ok(session) => {
                let dump_result = session
                    .execute_command(
                        "uiautomator dump /sdcard/ui_dump.xml > /dev/null && cat /sdcard/ui_dump.xml",
                    )
                    .await;
                
                match dump_result {
                    Ok(xml_content) => {
                        if xml_content.is_empty() || xml_content.contains("ERROR:") || xml_content.contains("null root node") {
                            logs.push("❌ UI dump 内容异常".to_string());
                            Err(ProcessingError::XmlParsingFailed("UI dump 内容异常".to_string()))
                        } else {
                            logs.push(format!("✅ UI dump 获取成功，XML 长度: {} 字符", xml_content.len()));
                            Ok(xml_content)
                        }
                    }
                    Err(e) => {
                        logs.push(format!("❌ UI dump 命令执行失败: {}", e));
                        Err(ProcessingError::XmlParsingFailed(format!("UI dump 命令执行失败: {}", e)))
                    }
                }
            }
            Err(e) => {
                logs.push(format!("❌ 无法连接到设备: {}", e));
                Err(ProcessingError::XmlParsingFailed(format!("无法连接到设备: {}", e)))
            }
        }
    }

    /// 将增强匹配结果转换为策略结果
    fn convert_to_strategy_result(&self, enhanced_result: crate::services::execution::matching::MatchResult) -> StrategyResult {
        StrategyResult {
            success: enhanced_result.success,
            message: if enhanced_result.success {
                format!("增强型匹配成功 (策略: {}, 置信度: {:.2})", 
                       enhanced_result.matching_strategy, 
                       enhanced_result.confidence)
            } else {
                "增强型匹配失败".to_string()
            },
            coordinates: enhanced_result.coordinates,
            bounds: enhanced_result.bounds,
            matched_element: enhanced_result.matched_element.map(|e| format!(
                "class={}, resource-id={:?}, text={:?}", 
                e.class_name, 
                e.resource_id, 
                e.text
            )),
            fallback_used: enhanced_result.fallback_used,
        }
    }
}

#[async_trait]
impl StrategyProcessor for EnhancedStrategyProcessor {
    async fn process(&self, context: &mut MatchingContext, logs: &mut Vec<String>) -> Result<StrategyResult, ProcessingError> {
        logs.push("🎯 启动增强型匹配策略".to_string());

        // 提取目标匹配条件
        let target_criteria = self.extract_target_criteria(context);
        logs.push(format!("📋 提取匹配条件: {:?}", target_criteria));

        if target_criteria.is_empty() {
            return Err(ProcessingError::InvalidParameters(
                "增强型匹配策略需要至少一个匹配条件".to_string()
            ));
        }

        // 获取 XML 内容
        let xml_content = if let Some(original_xml) = &context.original_xml {
            logs.push("📄 使用提供的 XML 快照进行匹配".to_string());
            original_xml.clone()
        } else {
            // 从设备获取最新 UI dump
            self.get_device_ui_dump(&context.device_id, logs).await?
        };

        // 执行增强型匹配
        match self.matcher.match_element(&target_criteria, &xml_content, &context.device_id).await {
            Ok(mut enhanced_result) => {
                // 合并调试信息
                logs.extend(enhanced_result.debug_info.clone());
                
                // 清空 debug_info 以避免移动问题
                enhanced_result.debug_info.clear();
                
                Ok(self.convert_to_strategy_result(enhanced_result))
            }
            Err(e) => {
                logs.push(format!("❌ 增强型匹配过程出错: {}", e));
                Err(ProcessingError::MatchingFailed(format!("增强型匹配过程出错: {}", e)))
            }
        }
    }

    fn validate_parameters(&self, context: &MatchingContext) -> Result<(), ProcessingError> {
        // 检查是否有至少一个可用的匹配属性
        let has_resource_id = context.values.contains_key("resource_id") || context.values.contains_key("resource-id");
        let has_text = context.values.contains_key("text");
        let has_content_desc = context.values.contains_key("content_desc") || context.values.contains_key("content-desc");
        let has_class = context.values.contains_key("class") || context.values.contains_key("className");
        let has_bounds = context.values.contains_key("bounds");

        if !(has_resource_id || has_text || has_content_desc || has_class || has_bounds) {
            return Err(ProcessingError::InvalidParameters(
                "增强型匹配策略需要至少包含以下属性之一: resource_id, text, content_desc, class, bounds".to_string()
            ));
        }

        // 检查设备 ID
        if context.device_id.is_empty() {
            return Err(ProcessingError::InvalidParameters(
                "设备 ID 不能为空".to_string()
            ));
        }

        Ok(())
    }

    fn strategy_name(&self) -> &'static str {
        "enhanced"
    }

    fn should_ignore_fallback_bounds(&self) -> bool {
        true // 增强策略不依赖固化坐标
    }
}