// src-tauri/src/commands/run_step_v2/sm_integration.rs
// module: run_step_v2 | layer: integration | role: 结构匹配Runtime集成
// summary: 将sm_match_once集成到V2执行流程，实现结构匹配优先策略

use anyhow::Result;

use crate::commands::structure_match_runtime::{
    sm_match_once, SmMatchRequest, SmConfigDTO, SmMatchResponse,
};
use super::{MatchCandidate, Bounds, BoundsSignature};
use super::types::StructuralSignatures;

// ================================
// 临时适配：V2 协议数据结构
// ================================

/// 临时 StaticEvidence 定义（用于集成）
/// 注意：与 mod.rs 中的定义不同，这里简化为只包含必需字段
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct SmStaticEvidence {
    pub resource_id: Option<String>,
    pub text: Option<String>,
    pub content_desc: Option<String>,
    pub class: Option<String>,
    pub bounds: Option<Bounds>,
    pub xpath: Option<String>,
    pub leaf_index: Option<i32>,
    pub structural_signatures: Option<StructuralSignatures>,
    // 🔥 新增：保留前端传来的完整 structural_signatures JSON
    pub structural_signatures_raw: Option<serde_json::Value>,
}

// ================================
// 类型转换：V2协议 → SM Runtime
// ================================

/// 将 StructuralSignatures 转换为 SmConfigDTO
pub fn convert_structural_sigs_to_config(sigs: &StructuralSignatures) -> SmConfigDTO {
    SmConfigDTO {
        // 使用默认模式
        mode: "default".to_string(),
        
        // 从骨架签名构建规则
        skeleton_rules: sigs.sibling_signature.clone(),
        
        // 字段规则（暂时为空，后续可扩展）
        field_rules: None,
        
        // 早停开关（默认启用）
        early_stop_enabled: Some(true),
    }
}

/// 将 StaticEvidence 转换为模板元素
#[allow(dead_code)]
pub fn convert_static_evidence_to_template(evidence: &SmStaticEvidence) -> serde_json::Value {
    serde_json::json!({
        "resource_id": evidence.resource_id,
        "text": evidence.text,
        "content_desc": evidence.content_desc,
        "class": evidence.class,
        "bounds": evidence.bounds.clone().map(|b| {
            vec![b.left, b.top, b.right, b.bottom]
        }),
        "xpath": evidence.xpath,
        "leaf_index": evidence.leaf_index,
    })
}

/// 将 SmMatchResponse 转换为 MatchCandidate 列表
pub fn convert_sm_result_to_candidates(
    response: SmMatchResponse,
    _evidence: &SmStaticEvidence,
) -> Vec<MatchCandidate> {
    if !response.success || response.result.is_none() {
        return vec![];
    }
    
    let result = response.result.unwrap();
    
    result.items.into_iter().map(|item| {
        MatchCandidate {
            id: item.node_id.to_string(),
            score: item.score as f64,
            confidence: item.score as f64,
            bounds: Bounds {
                left: item.bounds.left,
                top: item.bounds.top,
                right: item.bounds.right,
                bottom: item.bounds.bottom,
            },
            text: None,  // 暂时为空，后续可从XML提取
            class_name: None,
            package_name: None,
        }
    }).collect()
}

// ================================
// 核心集成函数
// ================================

/// 🔧 从 structural_signatures 提取容器提示（bounds信息）
/// 
/// # 参数
/// - `structural_sigs_value`: 前端生成的完整 structural_signatures JSON
/// 
/// # 返回
/// - Some(JSON字符串): 包含 selected_element_bounds 的容器提示
/// - None: 未找到有效的 bounds 信息
fn extract_container_hint_from_structural_sigs(
    structural_sigs_value: &serde_json::Value,
) -> Option<String> {
    // 尝试提取: structural_signatures.container.fingerprint.hints.selected_element_bounds
    let bounds_array = structural_sigs_value
        .get("container")?
        .get("fingerprint")?
        .get("hints")?
        .get("selected_element_bounds")?
        .as_array()?;
    
    // 验证数组长度和类型
    if bounds_array.len() != 4 {
        tracing::warn!("⚠️ [SM Integration] bounds数组长度不正确: {}", bounds_array.len());
        return None;
    }
    
    // 构建 container_hint JSON 字符串
    let hint_json = serde_json::json!({
        "selected_element_bounds": bounds_array
    });
    
    let hint_str = serde_json::to_string(&hint_json).ok()?;
    
    tracing::info!(
        "✅ [SM Integration] 提取容器提示成功: bounds={:?}",
        bounds_array
    );
    
    Some(hint_str)
}

/// 使用结构匹配Runtime进行元素匹配
/// 
/// # 参数
/// - `device_id`: 设备ID
/// - `xml_content`: 设备UI Dump XML
/// - `evidence`: 静态证据（包含structural_signatures）
/// 
/// # 返回
/// - 成功：匹配的候选元素列表（按分数降序）
/// - 失败：空列表（会 fallback 到旧评分系统）
pub async fn match_with_structural_matching(
    device_id: &str,
    xml_content: &str,
    evidence: &SmStaticEvidence,
) -> Result<Vec<MatchCandidate>> {
    // 1. 检查是否有结构签名
    let structural_sigs = match &evidence.structural_signatures {
        Some(sigs) => sigs,
        None => {
            tracing::debug!("⚠️ [SM Integration] 无结构签名，跳过SM匹配");
            return Ok(vec![]);
        }
    };
    
    tracing::info!(
        "🏗️ [SM Integration] 开始结构匹配 | device={} | resource_id={:?}",
        device_id,
        evidence.resource_id
    );
    
    // 2. 转换配置
    let config = convert_structural_sigs_to_config(structural_sigs);
    
    // 3. 🔥 【核心修复】从完整的 structural_signatures_raw 提取容器提示（bounds信息）
    let container_hint = evidence
        .structural_signatures_raw
        .as_ref()
        .and_then(|raw_json| extract_container_hint_from_structural_sigs(raw_json));
    
    if container_hint.is_some() {
        tracing::info!("✅ [SM Integration] 容器提示已提取，将传递给SM Runtime");
    } else {
        tracing::warn!("⚠️ [SM Integration] 未能提取容器提示，SM将使用根节点作为起点");
    }
    
    // 4. 构建请求
    let request = SmMatchRequest {
        xml_content: xml_content.to_string(),
        config,
        container_hint,  // 🔥 传递提取的容器提示
    };
    
    // 5. 调用 sm_match_once
    let response = match sm_match_once(request).await {
        Ok(resp) => resp,
        Err(e) => {
            tracing::warn!("⚠️ [SM Integration] SM匹配失败: {} | fallback到旧评分", e);
            return Ok(vec![]);
        }
    };
    
    // 6. 转换结果
    let candidates = convert_sm_result_to_candidates(response.clone(), evidence);
    
    tracing::info!(
        "✅ [SM Integration] SM匹配完成 | 成功={} | 候选数={} | 耗时={}ms",
        response.success,
        candidates.len(),
        response.elapsed_ms
    );
    
    Ok(candidates)
}

/// 智能匹配策略：优先使用SM，失败则fallback
/// 
/// # 策略
/// 1. 如果有 structural_signatures，使用 sm_match_once
/// 2. SM匹配成功 → 返回结果
/// 3. SM匹配失败/无结果 → fallback 到 tristate_score
#[allow(dead_code)]
pub async fn intelligent_match_with_fallback(
    device_id: &str,
    xml_content: &str,
    evidence: &SmStaticEvidence,
    fallback_fn: impl Fn() -> Vec<MatchCandidate>,
) -> Vec<MatchCandidate> {
    // 尝试使用SM匹配
    match match_with_structural_matching(device_id, xml_content, evidence).await {
        Ok(candidates) if !candidates.is_empty() => {
            tracing::info!("🎯 [SM Integration] 使用SM匹配结果 | 候选数={}", candidates.len());
            candidates
        }
        Ok(_) => {
            tracing::info!("🔄 [SM Integration] SM无结果，fallback到旧评分");
            fallback_fn()
        }
        Err(e) => {
            tracing::warn!("⚠️ [SM Integration] SM匹配错误: {} | fallback到旧评分", e);
            fallback_fn()
        }
    }
}

// ================================
// 测试辅助函数
// ================================

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_convert_structural_sigs_to_config() {
        let sigs = StructuralSignatures {
            ancestor_class_chain: Some(vec![
                "android.widget.LinearLayout".to_string(),
                "android.widget.FrameLayout".to_string(),
            ]),
            sibling_signature: Some("Button|TextView".to_string()),
            bounds_signature: Some(super::BoundsSignature {
                width_ratio: 0.8,
                height_ratio: 0.1,
                center_x_ratio: 0.5,
                center_y_ratio: 0.3,
            }),
        };
        
        let config = convert_structural_sigs_to_config(&sigs);
        
        assert_eq!(config.mode, "default");
        assert_eq!(config.skeleton_rules, Some("Button|TextView".to_string()));
        assert_eq!(config.early_stop_enabled, Some(true));
    }
    
    #[test]
    fn test_convert_static_evidence_to_template() {
        let evidence = SmStaticEvidence {
            resource_id: Some("com.example:id/button".to_string()),
            text: Some("点击我".to_string()),
            content_desc: None,
            class: Some("android.widget.Button".to_string()),
            bounds: Some(Bounds {
                left: 100,
                top: 200,
                right: 300,
                bottom: 250,
            }),
            xpath: Some("/hierarchy/LinearLayout/Button".to_string()),
            leaf_index: Some(3),
            structural_signatures: None,
            structural_signatures_raw: None,  // 🔥 添加新字段
        };
        
        let template = convert_static_evidence_to_template(&evidence);
        
        assert_eq!(template["resource_id"], "com.example:id/button");
        assert_eq!(template["text"], "点击我");
        assert_eq!(template["bounds"], serde_json::json!([100, 200, 300, 250]));
    }
    
    #[test]
    fn test_extract_container_hint() {
        // 模拟前端传来的完整 structural_signatures JSON
        let raw_json = serde_json::json!({
            "container": {
                "fingerprint": {
                    "role": "AUTO_DETECT",
                    "hints": {
                        "selected_element_id": "32",
                        "selected_element_bounds": [546, 225, 1067, 1083],
                        "selected_element_class": "FrameLayout",
                        "strategy": "scrollable_ancestor"
                    }
                }
            }
        });
        
        let result = extract_container_hint_from_structural_sigs(&raw_json);
        
        assert!(result.is_some());
        let hint_str = result.unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&hint_str).unwrap();
        
        assert_eq!(
            parsed["selected_element_bounds"],
            serde_json::json!([546, 225, 1067, 1083])
        );
    }
}

