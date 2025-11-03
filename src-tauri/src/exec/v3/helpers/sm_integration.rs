// src-tauri/src/exec/v3/helpers/sm_integration.rs
// module: exec | layer: v3/helpers | role: 结构匹配集成层（V3专用）
// summary: 将结构匹配Runtime系统集成到V3执行引擎，支持容器识别和骨架匹配

use serde_json::Value;
use crate::services::ui_reader_service::UIElement;
use crate::commands::structure_match_runtime::{
    sm_match_once, SmMatchRequest, SmConfigDTO,
};

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
            merged_params.get("original_data")
                .and_then(|od| od.get("structural_signatures"))
        })
        .ok_or("没有找到structural_signatures配置")?;

    tracing::info!("🏗️ [V3 SM Integration] 检测到结构签名，启动Runtime匹配");
    tracing::debug!("🏗️ [V3 SM Integration] structural_signatures: {}", structural_sigs);

    // 2️⃣ 构建Runtime请求（简化版，使用默认配置）
    let request = SmMatchRequest {
        xml_content: xml_content.to_string(),
        config: SmConfigDTO {
            mode: "default".to_string(),
            skeleton_rules: None,
            field_rules: None,
            early_stop_enabled: Some(true),
        },
        container_hint: None,
    };

    // 3️⃣ 调用Runtime系统
    let response = sm_match_once(request).await
        .map_err(|e| format!("sm_match_once 调用失败: {}", e))?;

    if !response.success {
        return Err(response.error.unwrap_or_else(|| "SM匹配失败（未知原因）".to_string()));
    }

    let result = response.result
        .ok_or("SM响应成功但结果为空")?;

    tracing::info!("🏗️ [V3 SM Integration] SM匹配完成: container_id={}, 找到 {} 个匹配",
        result.container_id, result.items.len());

    // 4️⃣ 将SM结果转换为UIElement（通过bounds匹配）
    let all_elements = crate::services::ui_reader_service::parse_ui_elements(xml_content)
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
                if let Some(elem_bounds) = &e.bounds {
                    elem_bounds == &bounds_str
                } else {
                    false
                }
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bounds_format() {
        let bounds_str = format!("[{},{}][{},{}]", 100, 200, 300, 400);
        assert_eq!(bounds_str, "[100,200][300,400]");
    }
}
