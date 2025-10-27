/// 循环配置解析器
/// 
/// 职责：
/// - 解析前端循环卡片参数
/// - 转换为后端LoopConfig结构
/// - 验证配置参数有效性

use anyhow::{Result, anyhow};
use serde_json::Value;
use tracing::{debug, warn};

use super::types::LoopConfig;

/// 循环配置解析器
pub struct LoopConfigParser;

impl LoopConfigParser {
    /// 从前端loop_data解析循环配置
    pub fn parse_from_loop_data(loop_data: &Value) -> Result<LoopConfig> {
        debug!("🔍 解析循环配置: {}", loop_data);

        // 解析基础字段
        let loop_id = Self::extract_string(loop_data, "loop_id")
            .or_else(|_| Self::extract_string(loop_data, "id"))
            .unwrap_or_else(|_| format!("loop_{}", chrono::Utc::now().timestamp_millis()));

        let loop_name = Self::extract_string(loop_data, "loop_name")
            .or_else(|_| Self::extract_string(loop_data, "name"))
            .unwrap_or_else(|_| format!("循环_{}", &loop_id[..8]));

        // 解析迭代配置
        let (max_iterations, is_infinite) = Self::parse_iterations(loop_data)?;
        
        // 解析间隔配置
        let interval_ms = Self::parse_interval(loop_data);

        // 解析错误处理配置
        let continue_on_error = Self::parse_error_handling(loop_data);

        let config = LoopConfig {
            loop_id: loop_id.clone(),
            loop_name: loop_name.clone(),
            max_iterations,
            is_infinite,
            interval_ms,
            continue_on_error,
        };

        debug!("✅ 循环配置解析完成: {} (迭代: {}, 无限: {}, 间隔: {:?}ms)", 
               loop_name, max_iterations, is_infinite, interval_ms);

        Self::validate_config(&config)?;

        Ok(config)
    }

    /// 从脚本步骤参数解析循环配置
    pub fn parse_from_step_parameters(parameters: &Value) -> Result<LoopConfig> {
        debug!("🔍 从步骤参数解析循环配置");

        // 检查是否有循环相关参数
        if let Some(loop_config) = parameters.get("loop_config") {
            return Self::parse_from_loop_data(loop_config);
        }

        // 兼容性处理：从旧格式参数解析
        if let Some(iterations) = parameters.get("iterations") {
            let max_iterations = iterations.as_u64()
                .ok_or_else(|| anyhow!("迭代次数必须是数字"))? as u32;

            let loop_id = parameters.get("loop_id")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string())
                .unwrap_or_else(|| format!("loop_{}", chrono::Utc::now().timestamp_millis()));

            let loop_name = parameters.get("loop_name")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string())
                .unwrap_or_else(|| format!("循环_{}", &loop_id[..8]));

            let config = LoopConfig {
                loop_id,
                loop_name,
                max_iterations,
                is_infinite: max_iterations == 0,
                interval_ms: parameters.get("interval")
                    .and_then(|v| v.as_u64()),
                continue_on_error: parameters.get("continue_on_error")
                    .and_then(|v| v.as_bool())
                    .unwrap_or(false),
            };

            Self::validate_config(&config)?;
            return Ok(config);
        }

        Err(anyhow!("未找到有效的循环配置参数"))
    }

    /// 解析迭代次数配置
    fn parse_iterations(data: &Value) -> Result<(u32, bool)> {
        // 优先检查 is_infinite 标志
        if let Some(infinite) = data.get("is_infinite").and_then(|v| v.as_bool()) {
            if infinite {
                return Ok((u32::MAX, true));
            }
        }

        // 检查 infinite 字段（兼容性）
        if let Some(infinite) = data.get("infinite").and_then(|v| v.as_bool()) {
            if infinite {
                return Ok((u32::MAX, true));
            }
        }

        // 解析具体迭代次数
        let iterations = data.get("iterations")
            .or_else(|| data.get("max_iterations"))
            .or_else(|| data.get("count"))
            .and_then(|v| v.as_u64())
            .unwrap_or(1);

        if iterations == 0 {
            // 0次迭代被解释为无限循环
            warn!("⚠️ 迭代次数为0，解释为无限循环");
            Ok((u32::MAX, true))
        } else if iterations > u32::MAX as u64 {
            warn!("⚠️ 迭代次数超过限制，设置为最大值");
            Ok((u32::MAX, false))
        } else {
            Ok((iterations as u32, false))
        }
    }

    /// 解析间隔配置
    fn parse_interval(data: &Value) -> Option<u64> {
        data.get("interval")
            .or_else(|| data.get("interval_ms"))
            .or_else(|| data.get("delay"))
            .or_else(|| data.get("wait"))
            .and_then(|v| {
                match v {
                    Value::Number(n) => n.as_u64(),
                    Value::String(s) => {
                        // 尝试解析字符串格式的数字
                        s.parse::<u64>().ok()
                    }
                    _ => None
                }
            })
            .filter(|&interval| interval <= 300_000) // 最大5分钟间隔
    }

    /// 解析错误处理配置
    fn parse_error_handling(data: &Value) -> bool {
        data.get("continue_on_error")
            .or_else(|| data.get("ignore_errors"))
            .or_else(|| data.get("skip_on_error"))
            .and_then(|v| v.as_bool())
            .unwrap_or(false) // 默认不忽略错误
    }

    /// 提取字符串值
    fn extract_string(data: &Value, key: &str) -> Result<String> {
        data.get(key)
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
            .ok_or_else(|| anyhow!("字段 '{}' 不存在或不是字符串", key))
    }

    /// 验证配置有效性
    fn validate_config(config: &LoopConfig) -> Result<()> {
        // 验证循环ID
        if config.loop_id.is_empty() {
            return Err(anyhow!("循环ID不能为空"));
        }

        // 验证循环名称
        if config.loop_name.is_empty() {
            return Err(anyhow!("循环名称不能为空"));
        }

        // 验证迭代次数
        if !config.is_infinite && config.max_iterations == 0 {
            return Err(anyhow!("有限循环的迭代次数不能为0"));
        }

        // 验证间隔时间
        if let Some(interval) = config.interval_ms {
            if interval > 300_000 { // 5分钟
                return Err(anyhow!("循环间隔不能超过5分钟"));
            }
        }

        Ok(())
    }

    /// 创建默认配置
    pub fn create_default_config(loop_name: Option<String>) -> LoopConfig {
        let loop_id = format!("loop_{}", chrono::Utc::now().timestamp_millis());
        let name = loop_name.unwrap_or_else(|| format!("循环_{}", &loop_id[..8]));

        LoopConfig {
            loop_id,
            loop_name: name,
            max_iterations: 1,
            is_infinite: false,
            interval_ms: None,
            continue_on_error: false,
        }
    }

    /// 配置转换为JSON（用于调试和日志）
    pub fn config_to_json(config: &LoopConfig) -> Value {
        serde_json::json!({
            "loop_id": config.loop_id,
            "loop_name": config.loop_name,
            "max_iterations": config.max_iterations,
            "is_infinite": config.is_infinite,
            "interval_ms": config.interval_ms,
            "continue_on_error": config.continue_on_error
        })
    }

    /// 从JSON字符串解析配置
    pub fn parse_from_json_string(json_str: &str) -> Result<LoopConfig> {
        let value: Value = serde_json::from_str(json_str)
            .map_err(|e| anyhow!("JSON解析失败: {}", e))?;
        
        Self::parse_from_loop_data(&value)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_parse_basic_config() {
        let data = json!({
            "loop_id": "test_loop",
            "loop_name": "测试循环",
            "iterations": 5,
            "interval": 1000,
            "continue_on_error": true
        });

        let config = LoopConfigParser::parse_from_loop_data(&data).unwrap();
        assert_eq!(config.loop_id, "test_loop");
        assert_eq!(config.loop_name, "测试循环");
        assert_eq!(config.max_iterations, 5);
        assert_eq!(config.interval_ms, Some(1000));
        assert_eq!(config.continue_on_error, true);
    }

    #[test]
    fn test_parse_infinite_loop() {
        let data = json!({
            "loop_name": "无限循环",
            "is_infinite": true
        });

        let config = LoopConfigParser::parse_from_loop_data(&data).unwrap();
        assert_eq!(config.is_infinite, true);
        assert_eq!(config.max_iterations, u32::MAX);
    }

    #[test]
    fn test_validation_errors() {
        let data = json!({
            "loop_id": "",
            "iterations": 0
        });

        assert!(LoopConfigParser::parse_from_loop_data(&data).is_err());
    }
}