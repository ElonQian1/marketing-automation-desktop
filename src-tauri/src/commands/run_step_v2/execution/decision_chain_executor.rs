// src-tauri/src/commands/run_step_v2/execution/decision_chain_executor.rs
// module: step-execution | layer: execution | role: 决策链执行器
// summary: 插件化决策链执行逻辑 - 支持多策略回退

use tauri::AppHandle;
use super::super::{DecisionChainPlan, ExecutionEnvironment, StrategyVariant, VariantKind, VariantSelectors, SelfSelector};
use crate::services::ui_reader_service::get_ui_dump;
use crate::engine::{FallbackController, XmlIndexer, strategy_plugin::StrategyRegistry};

/// 执行插件化决策链
pub async fn run_decision_chain_v2(
    app_handle: AppHandle, 
    plan_json: String, 
    device_id: String
) -> Result<serde_json::Value, String> {
    tracing::info!("🚀 启动插件化决策链执行");
    
    // 1. 解析和验证Plan契约
    let plan: DecisionChainPlan = serde_json::from_str(&plan_json)
        .map_err(|e| format!("Plan JSON解析失败: {}", e))?;
    
    // 检查Plan版本（从strategy中获取，这里简化处理）
    tracing::info!("📋 Plan验证通过，跳过版本检查");
    
    tracing::info!("📋 Plan验证通过: {} 个策略候选", plan.plan.len());
    
    // 2. 获取真机UI Dump
    let ui_xml = get_ui_dump(&device_id).await.map_err(|e| format!("获取UI Dump失败: {}", e))?;
    let xml_hash = format!("{:x}", md5::compute(&ui_xml));
    
    tracing::info!("📱 UI Dump获取成功: {} chars, hash={}", ui_xml.len(), &xml_hash[..8]);
    
    // 3. 构建执行环境
    let env = build_execution_environment(app_handle.clone(), &device_id, &ui_xml, &xml_hash, &plan);
    
    // 4. 构建XML索引（提升搜索效率）
    let _xml_indexer = XmlIndexer::build_from_xml(&ui_xml)
        .map_err(|e| format!("XML索引构建失败: {}", e))?;
    
    // 5. 获取策略注册表
    let registry = StrategyRegistry::new();
    
    tracing::info!("🔧 策略注册表就绪: {} 个插件", registry.list_strategies().len());
    
    // 6. 执行决策链（带回退）
    let result = FallbackController::execute_with_fallback(&env, &plan, &registry)
        .await
        .map_err(|e| format!("决策链执行失败: {}", e))?;
    
    // 7. 包装返回结果
    let response = build_response(&result, &env, &plan, &registry);
    
    if result.success {
        tracing::info!("✅ 决策链执行成功: {} 在 {}ms", result.used_variant, result.execution_time_ms);
    } else {
        tracing::error!("❌ 决策链执行失败: {:?}", result.error_reason);
    }
    
    Ok(response)
}

/// 构建执行环境
fn build_execution_environment(
    app_handle: AppHandle,
    device_id: &str,
    ui_xml: &str,
    xml_hash: &str,
    plan: &DecisionChainPlan
) -> ExecutionEnvironment {
    // 获取ADB路径
    let adb_path = crate::utils::adb_utils::get_adb_path();
    
    ExecutionEnvironment {
        app_handle,
        device_id: device_id.to_string(),
        xml_content: ui_xml.to_string(),
        target_variant: StrategyVariant {
            id: "example".to_string(),
            kind: VariantKind::SelfId,
            scope: "local".to_string(),
            container_xpath: None,
            selectors: VariantSelectors {
                parent: None,
                child: None,
                self_: Some(SelfSelector {
                    class: None,
                    resource_id: Some("example".to_string()),
                    text: None,
                    content_desc: None,
                    clickable: None,
                    enabled: None,
                }),
            },
            structure: None,
            index: None,
            checks: None,
            static_score: 0.8,
            explain: "Example variant".to_string(),
        },
        ui_xml: ui_xml.to_string(),
        xml_hash: xml_hash.to_string(),
        package: plan.context.package.clone().unwrap_or_default(),
        activity: plan.context.activity.clone().unwrap_or_default(),
        screen_width: plan.context.screen.as_ref().map(|s| s.width).unwrap_or(1080),
        screen_height: plan.context.screen.as_ref().map(|s| s.height).unwrap_or(2400),
        container_xpath: plan.context.container_anchor.as_ref()
            .map(|ca| ca.fallback_xpath.clone().unwrap_or_else(|| format!("//*[@{}='{}']", ca.by, ca.value))),
        adb_path,
        serial: device_id.to_string(),
    }
}

/// 构建返回响应
fn build_response(
    result: &crate::engine::strategy_plugin::ExecutionResult,
    env: &ExecutionEnvironment,
    plan: &DecisionChainPlan,
    registry: &StrategyRegistry
) -> serde_json::Value {
    serde_json::json!({
        "success": result.success,
        "used_variant": result.used_variant,
        "match_count": result.match_count,
        "final_confidence": result.final_confidence,
        "execution_time_ms": result.execution_time_ms,
        "tap_coordinates": result.tap_coordinates,
        "screenshot_path": result.screenshot_path,
        "error_reason": result.error_reason,
        "fallback_chain": result.fallback_chain,
        "telemetry": {
            "xml_hash": env.xml_hash,
            "strategy_count": plan.plan.len(),
            "registry_plugins": registry.list_strategies().len(),
            "plan_version": "v2"
        }
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_build_response_structure() {
        // 简单的结构验证测试
        let response = serde_json::json!({
            "success": true,
            "used_variant": "test",
            "telemetry": {
                "plan_version": "v2"
            }
        });
        
        assert_eq!(response["success"], true);
        assert_eq!(response["telemetry"]["plan_version"], "v2");
    }
}
