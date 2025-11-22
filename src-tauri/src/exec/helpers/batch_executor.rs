// src-tauri/src/exec/v3/helpers/batch_executor.rs
// module: v3-exec | layer: helpers | role: 批量执行引擎
// summary: 处理批量点击、批量操作的核心逻辑，支持并发控制、错误恢复、进度反馈

use crate::services::universal_ui_page_analyzer::UIElement;  // 🔥 修复：使用正确的导入路径
use serde_json::Value;
use std::time::Duration;
use tokio::time::sleep;

/// 批量执行配置
#[derive(Debug, Clone)]
pub struct BatchExecutionConfig {
    /// 最大执行数量
    pub max_count: usize,
    /// 执行间隔（毫秒）
    pub interval_ms: u64,
    /// 遇到错误是否继续
    pub continue_on_error: bool,
    /// 是否显示进度
    pub show_progress: bool,
    /// 匹配方向：forward(正向/从上到下) 或 backward(反向/从下到上)
    pub match_direction: String,
    /// 目标文本（用于日志）
    pub target_text: String,
    /// 步骤ID（用于日志）
    pub step_id: String,
}

impl BatchExecutionConfig {
    /// 从 JSON params 解析批量配置
    pub fn from_params(params: &Value, step_id: &str) -> Result<Self, String> {
        let batch_config = params
            .get("smartSelection")
            .and_then(|v| v.get("batchConfig"))
            .ok_or_else(|| "缺少 smartSelection.batchConfig".to_string())?;

        // 🔥 修复：支持前端的蛇形命名（interval_ms, max_count）
        let max_count = batch_config
            .get("max_count")  // ✅ 蛇形命名
            .or_else(|| batch_config.get("maxCount"))  // 兼容旧的驼峰命名
            .and_then(|v| v.as_u64())
            .unwrap_or(10) as usize;

        let interval_ms = batch_config
            .get("interval_ms")  // ✅ 蛇形命名
            .or_else(|| batch_config.get("intervalMs"))  // 兼容旧的驼峰命名
            .and_then(|v| v.as_u64())
            .unwrap_or(2000);

        let continue_on_error = batch_config
            .get("continue_on_error")  // ✅ 蛇形命名
            .or_else(|| batch_config.get("continueOnError"))  // 兼容旧的驼峰命名
            .and_then(|v| v.as_bool())
            .unwrap_or(true);

        let show_progress = batch_config
            .get("show_progress")  // ✅ 蛇形命名
            .or_else(|| batch_config.get("showProgress"))  // 兼容旧的驼峰命名
            .and_then(|v| v.as_bool())
            .unwrap_or(true);

        let match_direction = batch_config
            .get("match_direction")  // ✅ 蛇形命名
            .or_else(|| batch_config.get("matchDirection"))  // 兼容旧的驼峰命名
            .and_then(|v| v.as_str())
            .unwrap_or("forward")  // 默认正向（从第一个开始）
            .to_string();

        let target_text = params
            .get("smartSelection")
            .and_then(|v| v.get("targetText"))
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        // 🔍 DEBUG: 输出解析后的配置
        tracing::info!(
            "📋 [批量配置解析] max_count={}, interval_ms={}ms, continue_on_error={}, show_progress={}, match_direction={}",
            max_count,
            interval_ms,
            continue_on_error,
            show_progress,
            match_direction
        );

        Ok(Self {
            max_count,
            interval_ms,
            continue_on_error,
            show_progress,
            match_direction,
            target_text,
            step_id: step_id.to_string(),
        })
    }
}

/// 批量执行结果
#[derive(Debug)]
pub struct BatchExecutionResult {
    /// 成功数量
    pub success_count: usize,
    /// 失败数量
    pub failed_count: usize,
    /// 总尝试数量
    pub total_attempted: usize,
    /// 执行详情
    pub details: Vec<ExecutionDetail>,
}

/// 单次执行详情
#[derive(Debug)]
pub struct ExecutionDetail {
    /// 索引
    pub index: usize,
    /// 是否成功
    pub success: bool,
    /// 坐标（如果成功）
    pub coords: Option<(i32, i32)>,
    /// 错误信息（如果失败）
    pub error: Option<String>,
    /// 元素信息
    pub element_info: String,
}

/// 批量执行器
pub struct BatchExecutor<'a> {
    config: BatchExecutionConfig,
    candidates: Vec<&'a UIElement>,
    device_id: String,
}

impl<'a> BatchExecutor<'a> {
    /// 创建批量执行器
    pub fn new(
        device_id: String,
        candidates: Vec<&'a UIElement>,
        config: BatchExecutionConfig,
    ) -> Self {
        Self {
            config,
            candidates,
            device_id,
        }
    }

    /// 执行批量点击（简化版：直接传入异步函数）
    pub async fn execute<F, Fut>(
        &self,
        mut click_fn: F,
    ) -> BatchExecutionResult
    where
        F: FnMut(&str, &'a UIElement, &str, &str) -> Fut,
        Fut: std::future::Future<Output = Result<(i32, i32), String>>,
    {
        let total = self.candidates.len().min(self.config.max_count);
        let mut details = Vec::with_capacity(total);
        let mut success_count = 0;
        let mut failed_count = 0;

        tracing::info!(
            "🔄 [批量执行] 开始执行，共 {} 个候选（最多执行 {} 个）",
            self.candidates.len(),
            total
        );

        if self.config.show_progress {
            tracing::info!(
                "📋 [批量配置] maxCount={}, intervalMs={}ms, continueOnError={}",
                self.config.max_count,
                self.config.interval_ms,
                self.config.continue_on_error
            );
        }

        for (i, candidate) in self.candidates.iter().take(total).enumerate() {
            let index = i + 1;

            if self.config.show_progress {
                tracing::info!("🔄 [批量执行] 点击第 {}/{} 个候选", index, total);
            }

            // 生成元素信息（用于日志）
            let element_info = self.format_element_info(candidate);

            // 执行点击
            match click_fn(
                &self.device_id,
                candidate,
                &self.config.target_text,
                &self.config.step_id,
            )
            .await
            {
                Ok((x, y)) => {
                    success_count += 1;
                    if self.config.show_progress {
                        tracing::info!(
                            "✅ [批量执行] 第 {} 个点击成功: ({}, {}) | {}",
                            index,
                            x,
                            y,
                            element_info
                        );
                    }
                    details.push(ExecutionDetail {
                        index,
                        success: true,
                        coords: Some((x, y)),
                        error: None,
                        element_info,
                    });
                }
                Err(e) => {
                    failed_count += 1;
                    tracing::warn!(
                        "❌ [批量执行] 第 {} 个点击失败: {} | {}",
                        index,
                        e,
                        element_info
                    );
                    details.push(ExecutionDetail {
                        index,
                        success: false,
                        coords: None,
                        error: Some(e.clone()),
                        element_info,
                    });

                    // 检查是否需要提前终止
                    if !self.config.continue_on_error {
                        tracing::warn!("⚠️ [批量执行] continueOnError=false，提前终止");
                        break;
                    }
                }
            }

            // 添加间隔（最后一个不需要）
            if index < total {
                if self.config.show_progress {
                    tracing::info!("⏱️ [批量执行] 等待 {}ms 后继续", self.config.interval_ms);
                }
                sleep(Duration::from_millis(self.config.interval_ms)).await;
            }
        }

        let result = BatchExecutionResult {
            success_count,
            failed_count,
            total_attempted: success_count + failed_count,
            details,
        };

        tracing::info!(
            "✅ [批量执行] 执行完成，成功 {}/{}，失败 {}",
            result.success_count,
            result.total_attempted,
            result.failed_count
        );

        result
    }

    /// 格式化元素信息
    fn format_element_info(&self, element: &UIElement) -> String {
        let text = if !element.text.is_empty() {
            Some(format!("\"{}\"", element.text))
        } else {
            None
        }
        .unwrap_or_else(|| "无文本".to_string());

        let bounds = element.bounds.to_string();

        let resource_id = element
            .resource_id
            .as_ref()
            .map(|r| format!("id={}", r))
            .unwrap_or_else(|| "无id".to_string());

        format!("text={}, bounds={}, {}", text, bounds, resource_id)
    }
}

/// 检测是否应该使用批量模式
pub fn should_use_batch_mode(params: &Value) -> bool {
    params
        .get("smartSelection")
        .and_then(|v| v.get("mode"))
        .and_then(|v| v.as_str())
        .map(|mode| mode == "all")
        .unwrap_or(false)
}

/// 验证批量执行的前置条件
pub fn validate_batch_prerequisites(
    candidates: &[&UIElement],
    params: &Value,
) -> Result<(), String> {
    // 检查候选数量
    if candidates.is_empty() {
        return Err("批量执行失败：候选列表为空".to_string());
    }

    // 检查批量配置是否存在
    if params
        .get("smartSelection")
        .and_then(|v| v.get("batchConfig"))
        .is_none()
    {
        return Err("批量执行失败：缺少 batchConfig 配置".to_string());
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_should_use_batch_mode() {
        let params = serde_json::json!({
            "smartSelection": {
                "mode": "all"
            }
        });
        assert!(should_use_batch_mode(&params));

        let params = serde_json::json!({
            "smartSelection": {
                "mode": "first"
            }
        });
        assert!(!should_use_batch_mode(&params));
    }

    #[test]
    fn test_batch_config_parsing() {
        let params = serde_json::json!({
            "smartSelection": {
                "batchConfig": {
                    "maxCount": 5,
                    "intervalMs": 1000,
                    "continueOnError": false,
                    "showProgress": true
                },
                "targetText": "测试按钮"
            }
        });

        let config = BatchExecutionConfig::from_params(&params, "test_step").unwrap();
        assert_eq!(config.max_count, 5);
        assert_eq!(config.interval_ms, 1000);
        assert!(!config.continue_on_error);
        assert!(config.show_progress);
        assert_eq!(config.target_text, "测试按钮");
    }
}

