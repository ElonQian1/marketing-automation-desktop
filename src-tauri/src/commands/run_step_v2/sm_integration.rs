// src-tauri/src/commands/run_step_v2/sm_integration.rs
// module: run_step_v2 | layer: integration | role: 结构匹配Runtime集成
// summary: 将sm_match_once集成到V2执行流程，实现结构匹配优先策略

use serde::{Deserialize, Serialize};
use anyhow::Result;

use crate::services::structural_matching::{SmMatchRequest, SmConfig, SmMatchResponse};
use crate::services::structural_matching::runtime::sm_match_once;
use super::{StructuralSignatures, StaticEvidence, MatchCandidate};

// ================================
// 类型转换：V2协议 → SM Runtime
// ================================

/// 将 StructuralSignatures 转换为 SmConfig
pub fn convert_structural_sigs_to_config(sigs: &StructuralSignatures) -> SmConfig {
    SmConfig {
        // 字段权重配置
        weights: crate::services::structural_matching::SmWeights {
            resource_id: 0.85,      // 默认权重
            content_desc: 0.70,
            text: 0.60,
            class_name: 0.40,
            bounds: 0.30,
        },
        
        // 匹配阈值
        thresholds: crate::services::structural_matching::SmThresholds {
            min_score: 0.65,        // 默认最低分数
            uniqueness_margin: 0.15, // 默认唯一性边距
        },
        
        // 容器识别配置
        container_detection: crate::services::structural_matching::SmContainerDetection {
            enabled: true,
            ancestor_depth: sigs.ancestor_class_chain.as_ref().map(|chain| chain.len()).unwrap_or(3),
            min_children: 2,
        },
        
        // 骨架匹配配置
        skeleton_matching: crate::services::structural_matching::SmSkeletonMatching {
            enabled: true,
            sibling_signature: sigs.sibling_signature.clone(),
            bounds_signature: sigs.bounds_signature.as_ref().map(|bs| {
                crate::services::structural_matching::SmBoundsSignature {
                    width_ratio: bs.width_ratio,
                    height_ratio: bs.height_ratio,
                    center_x_ratio: bs.center_x_ratio,
                    center_y_ratio: bs.center_y_ratio,
                }
            }),
        },
        
        // 安全检查
        safety: crate::services::structural_matching::SmSafety {
            forbid_fullscreen: true,
            forbid_containers: true,
            require_uniqueness: true,
        },
    }
}

/// 将 StaticEvidence 转换为模板元素
pub fn convert_static_evidence_to_template(evidence: &StaticEvidence) -> serde_json::Value {
    serde_json::json!({
        "resource_id": evidence.resource_id,
        "text": evidence.text,
        "content_desc": evidence.content_desc,
        "class": evidence.class,
        "bounds": evidence.bounds.as_ref().map(|b| {
            vec![b.left, b.top, b.right, b.bottom]
        }),
        "xpath": evidence.xpath,
        "leaf_index": evidence.leaf_index,
    })
}

/// 将 SmMatchResponse 转换为 MatchCandidate 列表
pub fn convert_sm_result_to_candidates(
    response: SmMatchResponse,
    evidence: &StaticEvidence,
) -> Vec<MatchCandidate> {
    if !response.matched || response.candidates.is_empty() {
        return vec![];
    }
    
    response.candidates.into_iter().map(|candidate| {
        MatchCandidate {
            resource_id: candidate.element.resource_id.clone(),
            text: candidate.element.text.clone(),
            content_desc: candidate.element.content_desc.clone(),
            class: candidate.element.class.clone(),
            bounds: candidate.element.bounds.map(|b| super::Bounds {
                left: b[0],
                top: b[1],
                right: b[2],
                bottom: b[3],
            }),
            xpath: None,
            leaf_index: None,
            score: candidate.score,
            match_details: Some(format!(
                "SM匹配 | 容器:{} | 骨架:{} | 字段:{}",
                if candidate.container_matched { "✅" } else { "❌" },
                if candidate.skeleton_matched { "✅" } else { "❌" },
                candidate.matched_fields.join(",")
            )),
        }
    }).collect()
}

// ================================
// 核心集成函数
// ================================

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
    evidence: &StaticEvidence,
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
    
    // 3. 转换模板元素
    let template_element = convert_static_evidence_to_template(evidence);
    
    // 4. 构建请求
    let request = SmMatchRequest {
        device_id: device_id.to_string(),
        xml_content: xml_content.to_string(),
        config,
        template_element,
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
        "✅ [SM Integration] SM匹配完成 | 匹配={} | 候选数={} | 最高分={:.2}",
        response.matched,
        candidates.len(),
        candidates.first().map(|c| c.score).unwrap_or(0.0)
    );
    
    Ok(candidates)
}

/// 智能匹配策略：优先使用SM，失败则fallback
/// 
/// # 策略
/// 1. 如果有 structural_signatures，使用 sm_match_once
/// 2. SM匹配成功 → 返回结果
/// 3. SM匹配失败/无结果 → fallback 到 tristate_score
pub async fn intelligent_match_with_fallback(
    device_id: &str,
    xml_content: &str,
    evidence: &StaticEvidence,
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
            bounds_signature: Some(super::super::BoundsSignature {
                width_ratio: 0.8,
                height_ratio: 0.1,
                center_x_ratio: 0.5,
                center_y_ratio: 0.3,
            }),
        };
        
        let config = convert_structural_sigs_to_config(&sigs);
        
        assert_eq!(config.container_detection.ancestor_depth, 2);
        assert_eq!(config.skeleton_matching.sibling_signature, Some("Button|TextView".to_string()));
        assert!(config.skeleton_matching.enabled);
    }
    
    #[test]
    fn test_convert_static_evidence_to_template() {
        let evidence = StaticEvidence {
            resource_id: Some("com.example:id/button".to_string()),
            text: Some("点击我".to_string()),
            content_desc: None,
            class: Some("android.widget.Button".to_string()),
            bounds: Some(super::super::Bounds {
                left: 100,
                top: 200,
                right: 300,
                bottom: 250,
            }),
            xpath: Some("/hierarchy/LinearLayout/Button".to_string()),
            leaf_index: Some(3),
            structural_signatures: None,
        };
        
        let template = convert_static_evidence_to_template(&evidence);
        
        assert_eq!(template["resource_id"], "com.example:id/button");
        assert_eq!(template["text"], "点击我");
        assert_eq!(template["bounds"], serde_json::json!([100, 200, 300, 250]));
    }
}
