// src-tauri/src/automation/matching/structural.rs
// module: automation | layer: matching | role: 结构匹配集成层
// summary: 将结构匹配Runtime系统集成到自动化引擎，支持容器识别和骨架匹配

use serde_json::Value;
use crate::commands::structure_match_runtime::{
    sm_match_once, SmMatchRequest, SmConfigDTO,
};
use crate::automation::matching::strategy::evaluate_best_candidate;

/// 🔧 从前端格式的structural_signatures中提取skeleton规则
fn extract_skeleton_rules_from_frontend_format(structural_sigs: &Value) -> Result<Option<String>, String> {
    // 检查是否有skeleton字段
    let skeleton_array = structural_sigs
        .get("skeleton")
        .and_then(|s| s.as_array())
        .ok_or("structural_signatures中缺少skeleton字段或格式错误")?;

    if skeleton_array.is_empty() {
        tracing::warn!("⚠️ [SM Integration] skeleton数组为空，使用默认配置");
        return Ok(None);
    }

    // 将skeleton数组转换为JSON字符串
    let skeleton_rules = serde_json::to_string(skeleton_array)
        .map_err(|e| format!("序列化skeleton规则失败: {}", e))?;

    tracing::info!("✅ [SM Integration] 提取skeleton规则: {} 个元素", skeleton_array.len());
    tracing::debug!("🔧 [SM Integration] skeleton_rules: {}", skeleton_rules);

    Ok(Some(skeleton_rules))
}

/// 🔧 从 structural_signatures 提取容器提示（完整hints信息）
fn extract_container_hint_from_structural_sigs(structural_sigs: &Value) -> Option<String> {
    // 提取 hints 对象
    let hints_obj = structural_sigs
        .get("container")?
        .get("fingerprint")?
        .get("hints")?;
    
    // 提取各个字段（可选）
    let element_id = hints_obj
        .get("selected_element_id")
        .and_then(|v| v.as_str());
    
    let bounds_array = hints_obj
        .get("selected_element_bounds")
        .and_then(|v| v.as_array());
    
    let element_class = hints_obj
        .get("selected_element_class")
        .and_then(|v| v.as_str());
    
    // 验证bounds数组长度
    if let Some(bounds) = bounds_array {
        if bounds.len() != 4 {
            tracing::warn!("⚠️ [SM Integration] bounds数组长度不正确: {}", bounds.len());
            return None;
        }
    }
    
    // 🔥 构建完整的 container_hint JSON（包含所有可用字段）
    let mut hint_json = serde_json::Map::new();
    
    if let Some(id) = element_id {
        hint_json.insert("selected_element_id".to_string(), Value::String(id.to_string()));
        tracing::info!("✅ [SM Integration] 提取 element_id: {}", id);
    }
    
    if let Some(bounds) = bounds_array {
        hint_json.insert("selected_element_bounds".to_string(), Value::Array(bounds.clone()));
        tracing::info!("✅ [SM Integration] 提取 bounds: {:?}", bounds);
    }
    
    if let Some(class) = element_class {
        hint_json.insert("selected_element_class".to_string(), Value::String(class.to_string()));
        tracing::info!("✅ [SM Integration] 提取 class: {}", class);
    }
    
    // 至少需要一个提示字段
    if hint_json.is_empty() {
        tracing::warn!("⚠️ [SM Integration] hints对象为空，无法提取容器提示");
        return None;
    }
    
    let hint_str = serde_json::to_string(&hint_json).ok()?;
    
    tracing::info!("✅ [SM Integration] 容器提示提取完成，包含 {} 个字段", hint_json.len());
    
    Some(hint_str)
}

/// 尝试执行结构化匹配流程
/// 
/// 如果参数中包含 structural_signatures，则尝试使用 SM Runtime 进行匹配
/// 返回: Option<(x, y)> - 如果匹配成功返回坐标，否则返回 None
pub async fn try_structural_matching_flow(
    device_id: &str,
    ui_xml: &str,
    merged_params: &Value,
) -> Result<Option<(i32, i32)>, String> {
    // 1. 检查是否存在 structural_signatures
    let structural_sigs = match merged_params.get("structural_signatures") {
        Some(v) if !v.is_null() => v,
        _ => return Ok(None), // 没有结构签名，跳过
    };
    
    tracing::info!("🏗️ [SM Integration] 检测到结构签名，尝试结构化匹配...");
    
    // 2. 提取配置信息
    let skeleton_rules = extract_skeleton_rules_from_frontend_format(structural_sigs)?;
    let container_hint = extract_container_hint_from_structural_sigs(structural_sigs);
    
    // 3. 构建 SM 请求
    let request = SmMatchRequest {
        xml_content: ui_xml.to_string(),
        container_hint: container_hint,
        config: SmConfigDTO {
            mode: "default".to_string(),
            skeleton_rules,
            field_rules: None,
            early_stop_enabled: Some(true),
        },
    };
    
    // 4. 调用 SM Runtime
    match sm_match_once(request).await {
        Ok(response) => {
            if response.success {
                if let Some(result) = response.result {
                    // 尝试获取第一个匹配项的边界
                    if let Some(first_item) = result.items.first() {
                        let bounds = &first_item.bounds;
                        tracing::info!("✅ [SM Integration] 结构匹配成功! bounds={:?}", bounds);
                        
                        // 计算中心点
                        let x = (bounds.left + bounds.right) / 2;
                        let y = (bounds.top + bounds.bottom) / 2;
                        
                        return Ok(Some((x, y)));
                    } else {
                        tracing::warn!("⚠️ [SM Integration] 匹配成功但没有返回items");
                    }
                }
            } else {
                tracing::info!("❌ [SM Integration] 结构匹配未找到目标");
            }
        }
        Err(e) => {
            tracing::error!("❌ [SM Integration] SM Runtime 执行出错: {}", e);
            // 出错不中断流程，降级到传统匹配
        }
    }
    
    tracing::info!("🔄 [SM Integration] 结构匹配失败，降级到传统匹配流程");
    Ok(None)
}
