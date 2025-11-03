// src-tauri/src/commands/run_step_v2/utils/strategy_resolver.rs
// module: v2-execution | layer: utils | role: 策略查询解析器
// summary: 从智能分析存储查询步骤的执行策略（selection_mode和batch_config）

use serde_json::Value;

/// 从步骤数据查询执行策略
/// 
/// # 参数
/// - `step`: 步骤数据（可能包含step_id或selector）
/// 
/// # 返回
/// - `(selection_mode, batch_config)`: 选择模式和批量配置（可能为None）
pub async fn resolve_step_strategy(
    step: &Value,
) -> (Option<String>, Option<Value>) {
    // 获取选择器ID（优先使用step_id，兜底使用selector）
    let selector_id = step.get("step_id")
        .and_then(|v| v.as_str())
        .or_else(|| step.get("selector").and_then(|v| v.as_str()));

    let Some(id) = selector_id else {
        // 无选择器ID，返回默认值
        return (None, None);
    };
    
    // 尝试查询策略
    let mut strategy_opt = crate::commands::intelligent_analysis::get_step_strategy(id.to_string())
        .await
        .ok()
        .flatten();
    
    // 如果step_id查询失败，尝试用selector查询（兜底）
    if strategy_opt.is_none() {
        if let Some(selector) = step.get("selector").and_then(|v| v.as_str()) {
            if selector != id {
                tracing::debug!("🔄 [StrategyResolver] step_id查询失败，尝试使用selector: {}", selector);
                strategy_opt = crate::commands::intelligent_analysis::get_step_strategy(selector.to_string())
                    .await
                    .ok()
                    .flatten();
            }
        }
    }
    
    // 提取策略数据
    match strategy_opt {
        Some(strategy) => {
            tracing::info!(
                "🎯 [StrategyResolver] 从Store获取执行模式: selection_mode={:?}, has_batch_config={}", 
                strategy.selection_mode,
                strategy.batch_config.is_some()
            );
            (strategy.selection_mode.clone(), strategy.batch_config.clone())
        }
        None => {
            tracing::debug!("ℹ️ [StrategyResolver] 未找到策略配置，使用默认值");
            (None, None)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    
    #[test]
    fn test_no_selector_id_returns_none() {
        let step = json!({"action": "tap"});
        // 无step_id和selector，应返回 (None, None)
        // 实际测试需要 async runtime
    }
    
    #[test]
    fn test_has_step_id() {
        let step = json!({
            "step_id": "test_123",
            "action": "tap"
        });
        // 应尝试查询 test_123
        // 实际测试需要 mock intelligent_analysis
    }
}
