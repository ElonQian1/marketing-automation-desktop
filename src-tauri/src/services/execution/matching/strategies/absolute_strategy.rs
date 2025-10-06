//! absolute_strategy.rs - Absolute 匹配策略处理器
//! 
//! Absolute 策略使用精确的位置信息进行匹配，适用于同设备同分辨率的精确定位。

use super::{StrategyProcessor, MatchingContext, StrategyResult, ProcessingError};
use async_trait::async_trait;
use anyhow::Result;
use tracing::{info, warn, debug};

/// Absolute 策略处理器
/// 
/// 特点：
/// - 优先使用固化的 bounds 坐标
/// - 提供最精确的定位
/// - 适用于同设备、同分辨率场景
pub struct AbsoluteStrategyProcessor;

impl AbsoluteStrategyProcessor {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl StrategyProcessor for AbsoluteStrategyProcessor {
    async fn process(&self, context: &mut MatchingContext, logs: &mut Vec<String>) -> Result<StrategyResult, ProcessingError> {
        logs.push("📍 使用 Absolute 策略进行精确匹配".to_string());
        logs.push("📋 Absolute 策略特点: 优先使用固化坐标进行精确定位".to_string());
        
        // 验证参数
        self.validate_parameters(context)?;
        
        // 尝试使用固化坐标
        if let Some(fallback_bounds) = &context.fallback_bounds {
            logs.push("🎯 使用固化坐标进行 Absolute 匹配".to_string());
            debug!("Absolute 策略使用固化坐标: {:?}", fallback_bounds);
            
            match crate::utils::bounds::parse_bounds_value(fallback_bounds) {
                Ok(rect) => {
                    let (center_x, center_y) = rect.center();
                    logs.push(format!("📍 解析固化坐标成功: ({}, {})", center_x, center_y));
                    
                    info!("✅ Absolute 策略使用固化坐标 - 坐标: ({}, {})", center_x, center_y);
                    
                    return Ok(StrategyResult::fallback_success(
                        "Absolute 策略使用固化坐标".to_string(),
                        (center_x, center_y),
                    ));
                }
                Err(e) => {
                    warn!("⚠️ 固化坐标解析失败: {}", e);
                    logs.push(format!("⚠️ 固化坐标解析失败: {}", e));
                }
            }
        }
        
        // 如果没有固化坐标，尝试使用完整匹配
        logs.push("🔄 固化坐标不可用，尝试完整字段匹配".to_string());
        
        if !context.fields.is_empty() && !context.values.is_empty() {
            // 临时禁用：等待重构为使用 universal_ui_page_analyzer
            logs.push("⚠️ Absolute 策略暂时不可用，正在重构为使用统一解析器".to_string());
        }
        
        Ok(StrategyResult::failure("Absolute 策略暂时不可用".to_string()))
    }
    
    fn validate_parameters(&self, _context: &MatchingContext) -> Result<(), ProcessingError> {
        // Absolute 策略对参数要求较宽松
        Ok(())
    }
    
    fn strategy_name(&self) -> &'static str {
        "absolute"
    }
    
    fn should_ignore_fallback_bounds(&self) -> bool {
        false // Absolute 策略使用固化坐标
    }
    
    fn priority(&self) -> u8 {
        50 // 中等优先级
    }
}