// src-tauri/src/exec/v3/helpers/sm_integration.rs
// module: exec | layer: v3/helpers | role: 结构匹配集成层（V3专用）
// summary: 将结构匹配Runtime系统集成到V3执行引擎，支持容器识别和骨架匹配

use serde_json::Value;
use crate::services::universal_ui_page_analyzer::UIElement;
use crate::commands::structure_match_runtime::{
    sm_match_once, SmMatchRequest, SmConfigDTO,
};
use crate::automation::matching::strategy::evaluate_best_candidate;
use crate::automation::matching::text::parse_bounds_center as helper_parse_bounds;

/// 🔧 从前端格式的structural_signatures中提取skeleton规则
/// 
/// 前端格式: {"container": {...}, "skeleton": [...]}
/// 转换为: skeleton_rules 字符串（用于SM Runtime）
fn extract_skeleton_rules_from_frontend_format(structural_sigs: &Value) -> Result<Option<String>, String> {
    // 检查是否有skeleton字段
    let skeleton_array = structural_sigs
        .get("skeleton")
        .and_then(|s| s.as_array())
        .ok_or("structural_signatures中缺少skeleton字段或格式错误")?;

    if skeleton_array.is_empty() {
        tracing::warn!("⚠️ [V3 SM Integration] skeleton数组为空，使用默认配置");
        return Ok(None);
    }

    // 将skeleton数组转换为JSON字符串
    let skeleton_rules = serde_json::to_string(skeleton_array)
        .map_err(|e| format!("序列化skeleton规则失败: {}", e))?;

    tracing::info!("✅ [V3 SM Integration] 提取skeleton规则: {} 个元素", skeleton_array.len());
    tracing::debug!("🔧 [V3 SM Integration] skeleton_rules: {}", skeleton_rules);

    Ok(Some(skeleton_rules))
}

/// 🔧 从 structural_signatures 提取容器提示（完整hints信息）
/// 
/// 从前端生成的 structural_signatures.container.fingerprint.hints 提取所有字段：
/// - selected_element_id: 元素ID（如"element_32"）
/// - selected_element_bounds: 元素边界
/// - selected_element_class: 元素类名
/// 并格式化为后端 SM Runtime 期望的 JSON 字符串格式
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
            tracing::warn!("⚠️ [V3 SM Integration] bounds数组长度不正确: {}", bounds.len());
            return None;
        }
    }
    
    // 🔥 构建完整的 container_hint JSON（包含所有可用字段）
    let mut hint_json = serde_json::Map::new();
    
    if let Some(id) = element_id {
        hint_json.insert("selected_element_id".to_string(), Value::String(id.to_string()));
        tracing::info!("✅ [V3 SM Integration] 提取 element_id: {}", id);
    }
    
    if let Some(bounds) = bounds_array {
        hint_json.insert("selected_element_bounds".to_string(), Value::Array(bounds.clone()));
        tracing::info!("✅ [V3 SM Integration] 提取 bounds: {:?}", bounds);
    }
    
    if let Some(class) = element_class {
        hint_json.insert("selected_element_class".to_string(), Value::String(class.to_string()));
        tracing::info!("✅ [V3 SM Integration] 提取 class: {}", class);
    }
    
    // 至少需要一个提示字段
    if hint_json.is_empty() {
        tracing::warn!("⚠️ [V3 SM Integration] hints对象为空，无法提取容器提示");
        return None;
    }
    
    let hint_str = serde_json::to_string(&hint_json).ok()?;
    
    tracing::info!("✅ [V3 SM Integration] 容器提示提取完成，包含 {} 个字段", hint_json.len());
    
    Some(hint_str)
}

/// 🏗️ V3核心集成函数：使用结构匹配Runtime进行元素匹配
/// 
/// 在V3执行流程中，如果检测到structural_signatures，优先使用此函数
/// 失败后可fallback到传统的多候选评估
pub async fn v3_match_with_structural_matching(
    _device_id: &str,
    xml_content: &str,
    merged_params: &Value,
) -> Result<Vec<UIElement>, String> {
    // 1️⃣ 检查是否存在结构签名
    let structural_sigs = merged_params
        .get("structural_signatures")
        .or_else(|| {
            merged_params.get("originalParams")
                .and_then(|op| op.get("structural_signatures"))
        })
        .or_else(|| {
            merged_params.get("original_data")
                .and_then(|od| od.get("structural_signatures"))
        })
        .ok_or("没有找到structural_signatures配置")?;

    tracing::info!("🏗️ [V3 SM Integration] 检测到结构签名，启动Runtime匹配");
    tracing::debug!("🏗️ [V3 SM Integration] structural_signatures: {}", structural_sigs);

    // 2️⃣ 解析前端结构签名格式并转换为skeleton_rules
    let skeleton_rules = extract_skeleton_rules_from_frontend_format(structural_sigs)?;
    
    // 🔥 【核心修复】从 structural_signatures 提取容器提示（bounds信息）
    let container_hint = extract_container_hint_from_structural_sigs(structural_sigs);
    
    if container_hint.is_some() {
        tracing::info!("✅ [V3 SM Integration] 容器提示已提取，将传递给SM Runtime");
    } else {
        tracing::warn!("⚠️ [V3 SM Integration] 未能提取容器提示，SM将使用根节点作为起点");
    }
    
    // 3️⃣ 构建Runtime请求（使用解析的skeleton规则和容器提示）
    let request = SmMatchRequest {
        xml_content: xml_content.to_string(),
        config: SmConfigDTO {
            mode: "default".to_string(),
            skeleton_rules,
            field_rules: None,
            early_stop_enabled: Some(true),
        },
        container_hint,  // 🔥 传递提取的容器提示
    };

    // 4️⃣ 调用Runtime系统
    let response = sm_match_once(request).await
        .map_err(|e| format!("sm_match_once 调用失败: {}", e))?;

    if !response.success {
        return Err(response.error.unwrap_or_else(|| "SM匹配失败（未知原因）".to_string()));
    }

    let result = response.result
        .ok_or("SM响应成功但结果为空")?;

    tracing::info!("🏗️ [V3 SM Integration] SM匹配完成: container_id={}, 找到 {} 个匹配",
        result.container_id, result.items.len());

    // 5️⃣ 将SM结果转换为UIElement（通过bounds匹配）
    let all_elements = crate::services::universal_ui_page_analyzer::parse_ui_elements_simple(xml_content)
        .map_err(|e| format!("解析UI XML失败: {}", e))?;

    let mut matched_elements = Vec::new();

    for item in &result.items {
        // 构造bounds字符串格式：[left,top][right,bottom]
        let bounds_str = format!("[{},{}][{},{}]",
            item.bounds.left, item.bounds.top,
            item.bounds.right, item.bounds.bottom
        );

        // 在all_elements中查找匹配的bounds
        if let Some(elem) = all_elements.iter()
            .find(|e| {
                e.bounds.to_string() == bounds_str
            })
        {
            matched_elements.push(elem.clone());
        } else {
            tracing::warn!(
                "⚠️ [V3 SM Integration] SM返回的bounds在UI树中找不到: {}",
                bounds_str
            );
        }
    }

    if matched_elements.is_empty() {
        return Err("SM匹配成功但无法转换为UIElement".to_string());
    }

    tracing::info!("✅ [V3 SM Integration] 成功转换 {} 个UIElement",
        matched_elements.len());

    Ok(matched_elements)
}

/// 尝试执行结构化匹配流程
/// 
/// 如果启用了结构化匹配且存在签名，则尝试匹配。
/// 返回：
/// - Ok(Some(coords)): 匹配成功，返回坐标
/// - Ok(None): 匹配未命中或未启用，应回退到传统匹配
/// - Err(e): 匹配出错（严格模式下）
pub async fn try_structural_matching_flow(
    device_id: &str,
    ui_xml: &str,
    merged_params: &Value,
) -> Result<Option<(i32, i32)>, String> {
    // 1. 检测是否启用结构匹配
    let explicit_structural_mode = merged_params
        .get("matchingStrategy")
        .or_else(|| merged_params.get("originalParams").and_then(|op| op.get("matchingStrategy")))
        .and_then(|v| v.as_str())
        .map(|s| s.eq_ignore_ascii_case("structural"))
        .unwrap_or(false);

    let has_structural_sigs = merged_params.get("structural_signatures").is_some()
        || merged_params.get("original_data")
            .and_then(|od| od.get("structural_signatures"))
            .is_some()
        || merged_params.get("originalParams")
            .and_then(|op| op.get("structural_signatures"))
            .is_some();

    let use_structural_matching = explicit_structural_mode && has_structural_sigs;
    
    if !use_structural_matching {
        tracing::debug!("📋 [V3执行器] 非结构模式 or 无签名，跳过结构匹配");
        return Ok(None);
    }

    tracing::info!("🏗️ [V3执行器] 进入结构匹配模式（explicit={}, has_sigs={}）",
        explicit_structural_mode, has_structural_sigs);
    
    match v3_match_with_structural_matching(
        device_id,
        ui_xml,
        merged_params,
    ).await {
        Ok(sm_elements) if !sm_elements.is_empty() => {
            tracing::info!("✅ [V3执行器] 结构匹配成功，找到 {} 个候选元素", sm_elements.len());
            
            // 🎯 直接使用SM的结果进行候选评估（转换为引用）
            let sm_element_refs: Vec<&UIElement> = sm_elements.iter().collect();
            let target_element_option = evaluate_best_candidate(
                sm_element_refs,
                merged_params,
                ui_xml,
                None,
            )?;
            
            let element = target_element_option
                .ok_or_else(|| "结构匹配成功但候选评估未返回元素".to_string())?;
            
            let coords = helper_parse_bounds(&element.bounds.to_string())?;
            tracing::info!("🎯 [V3执行器] 结构匹配最终选择: ({}, {})", coords.0, coords.1);
            return Ok(Some(coords));
        }
        Ok(_) => {
            if explicit_structural_mode {
                tracing::warn!("⚠️ [V3执行器] 结构匹配返回空结果（严格结构模式），终止执行");
                return Err("结构匹配未找到任何元素（严格结构模式）".to_string());
            } else {
                tracing::warn!("⚠️ [V3执行器] 结构匹配返回空结果，fallback到传统匹配");
                return Ok(None);
            }
        }
        Err(e) => {
            if explicit_structural_mode {
                tracing::warn!("⚠️ [V3执行器] 结构匹配失败（严格结构模式）: {}", e);
                return Err(format!("结构匹配失败（严格结构模式）：{}", e));
            } else {
                tracing::warn!("⚠️ [V3执行器] 结构匹配失败: {}，fallback到传统匹配", e);
                return Ok(None);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bounds_format() {
        let bounds_str = format!("[{},{}][{},{}]", 100, 200, 300, 400);
        assert_eq!(bounds_str, "[100,200][300,400]");
    }
}


