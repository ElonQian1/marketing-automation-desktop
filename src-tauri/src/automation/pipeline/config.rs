// src-tauri/src/automation/pipeline/config.rs
// module: automation | layer: pipeline | role: 配置加载器
// summary: 负责从全局 Store 中加载步骤策略配置，并合并到执行参数中

use crate::commands::intelligent_analysis::STEP_STRATEGY_STORE;
use serde_json::Value;

/// 加载并合并步骤配置
/// 
/// 从 STEP_STRATEGY_STORE 中查找策略配置，并将其合并到 params 中
pub fn load_and_merge_step_config(step_id: &str, params: &Value) -> Value {
    // 1. 从 Store 读取配置
    let saved_config = {
        if let Ok(store) = STEP_STRATEGY_STORE.lock() {
            // 🔍 Store内容调试
            tracing::debug!("🔍 [Store调试] Store size: {}, 查找key: {}", store.len(), step_id);
            
            // 🎯 策略1: 尝试用当前 step_id (intelligent_step_X) 查找
            let mut found_config = store.get(step_id)
                .map(|(strategy, _timestamp)| {
                    tracing::info!("📖 [配置读取] 用 step_id={} 找到配置", step_id);
                    strategy.clone()
                });
            
            // 🎯 策略2: 如果没找到，尝试从 originalParams 中提取原始 stepId 再查找
            if found_config.is_none() {
                if let Some(orig_params) = params.get("originalParams") {
                    // 尝试从不同位置提取原始 step_id
                    let possible_keys = vec![
                        orig_params.get("stepId").and_then(|v| v.as_str()),
                        orig_params.get("step_id").and_then(|v| v.as_str()),
                        // 从父级 original_data 提取
                        params.get("original_data")
                            .and_then(|od| od.get("step_id"))
                            .and_then(|v| v.as_str()),
                    ];
                    
                    for possible_key in possible_keys.into_iter().flatten() {
                        if let Some((strategy, _timestamp)) = store.get(possible_key) {
                            tracing::info!("✅ [配置读取-回退] 用原始 step_id={} 找到配置", possible_key);
                            found_config = Some(strategy.clone());
                            break;
                        }
                    }
                }
            }
            
            // 🎯 策略3: 如果还没找到，尝试通过chainId推断原始stepId (step_execution_xxx -> xxx)
            if found_config.is_none() {
                // 从全局上下文或参数中获取chainId
                if let Some(chain_id) = params.get("chainId")
                    .or_else(|| params.get("originalParams").and_then(|p| p.get("chainId")))
                    .and_then(|v| v.as_str()) 
                {
                    // 如果chainId格式为 "step_execution_xxx"，提取 "xxx" 部分
                    if let Some(suffix) = chain_id.strip_prefix("step_execution_") {
                        tracing::info!("🔍 [配置读取-chainId] 从chainId提取可能的stepId: {} -> {}", chain_id, suffix);
                        if let Some((strategy, _timestamp)) = store.get(suffix) {
                            tracing::info!("✅ [配置读取-chainId匹配] 通过chainId找到配置: {}", suffix);
                            found_config = Some(strategy.clone());
                        }
                    }
                }
            }
            
            // 🎯 策略4: 最后的尝试，遍历Store中所有非intelligent_前缀的key
            if found_config.is_none() && step_id.starts_with("intelligent_step_") {
                tracing::info!("🔍 [配置读取-遍历] 遍历Store中的所有key寻找匹配配置");
                for store_key in store.keys() {
                    // 寻找非智能分析生成的stepId（原始stepId通常包含timestamp）
                    if !store_key.starts_with("intelligent_step_") && store_key.contains("_") {
                        if let Some((strategy, _timestamp)) = store.get(store_key) {
                            tracing::info!("✅ [配置读取-遍历匹配] 使用第一个找到的原始配置: {}", store_key);
                            found_config = Some(strategy.clone());
                            break;
                        }
                    }
                }
            }
            
            if found_config.is_none() {
                tracing::warn!("⚠️ [配置读取] Store 中没有找到配置，将使用参数中的默认配置");
            }
            
            found_config
        } else {
            tracing::error!("❌ [配置读取] 无法锁定 STEP_STRATEGY_STORE");
            None
        }
    };
    
    // 2. 合并配置到参数
    let mut merged_params = params.clone();
    if let Some(strategy) = saved_config {
        // 🔥 合并 selection_mode
        if let Some(mode) = &strategy.selection_mode {
            tracing::info!("🔧 [配置合并] 使用保存的 selection_mode: {}", mode);
            
            // 更新 smartSelection.mode
            if let Some(smart_sel) = merged_params.get_mut("smartSelection") {
                if let Some(obj) = smart_sel.as_object_mut() {
                    obj.insert("mode".to_string(), Value::String(mode.clone()));
                }
            } else {
                // 如果没有 smartSelection，创建一个
                merged_params["smartSelection"] = serde_json::json!({
                    "mode": mode
                });
            }
            
            // 同时更新顶层 selection_mode (兼容旧代码)
            merged_params["selection_mode"] = Value::String(mode.clone());
        }
        
        // 🔥 合并 batch_config
        if let Some(batch_cfg) = &strategy.batch_config {
            tracing::info!("🔧 [配置合并] 使用保存的 batch_config");
            
            // 更新 smartSelection.batchConfig
            if let Some(smart_sel) = merged_params.get_mut("smartSelection") {
                if let Some(obj) = smart_sel.as_object_mut() {
                    obj.insert("batchConfig".to_string(), batch_cfg.clone());
                }
            }
            
            // 同时更新顶层 batch_config (兼容旧代码)
            merged_params["batch_config"] = batch_cfg.clone();
        }
        
        // 🔥 合并 structural_signatures
        if let Some(sigs) = &strategy.structural_signatures {
            tracing::info!("🔧 [配置合并] 使用保存的 structural_signatures");
            merged_params["structural_signatures"] = sigs.clone();
        }
    }
    
    merged_params
}
