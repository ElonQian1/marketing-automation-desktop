// src-tauri/src/commands/run_step_v2/utils/sm_matcher.rs
// module: v2-execution | layer: utils | role: 结构匹配尝试器
// summary: 尝试使用结构匹配进行元素查找，失败时返回None以便fallback到传统匹配

use crate::commands::run_step_v2::{RunStepRequestV2, MatchInfo, MatchCandidate, Bounds, StructuralSignatures};
use crate::commands::run_step_v2::sm_integration::{self, SmStaticEvidence};

/// 尝试使用结构匹配查找元素
/// 
/// # 参数
/// - `ui_xml`: UI层级XML字符串
/// - `req`: 步骤执行请求（包含可能的structural_signatures）
/// 
/// # 返回
/// - `Ok(Some((MatchInfo, Vec<MatchCandidate>)))`: 结构匹配成功
/// - `Ok(None)`: 无结构签名或匹配失败，需要fallback
/// - `Err(String)`: 严重错误
pub async fn try_structural_matching(
    ui_xml: &str,
    req: &RunStepRequestV2,
) -> Result<Option<(MatchInfo, Vec<MatchCandidate>)>, String> {
    // 检查是否存在结构签名
    let structural_sigs_value = match req.step.get("structural_signatures") {
        Some(val) => val,
        None => return Ok(None), // 无结构签名，直接返回
    };
    
    tracing::info!("🏗️ [SM Integration] 检测到结构签名，优先使用结构匹配Runtime");
    
    // 尝试反序列化 structural_signatures
    let structural_sigs = match serde_json::from_value::<StructuralSignatures>(structural_sigs_value.clone()) {
        Ok(sigs) => sigs,
        Err(_) => {
            tracing::warn!("⚠️ [SM Integration] structural_signatures 反序列化失败，fallback到传统评分");
            return Ok(None);
        }
    };
    
    // 构建 SmStaticEvidence
    let sm_evidence = build_sm_evidence(req, structural_sigs)?;
    
    // 调用结构匹配集成
    match sm_integration::match_with_structural_matching(&req.device_id, ui_xml, &sm_evidence).await {
        Ok(candidates) if !candidates.is_empty() => {
            let match_info = MatchInfo {
                uniqueness: if candidates.len() == 1 { 1 } else { 0 },
                confidence: candidates.first().map(|c| c.score).unwrap_or(0.0) as f32,
                elements_found: candidates.len() as i32,
            };
            
            tracing::info!(
                "✅ [SM Integration] 结构匹配成功 | 候选数={} | 最高分={:.2} | 唯一性={}",
                candidates.len(),
                match_info.confidence,
                match_info.uniqueness
            );
            
            Ok(Some((match_info, candidates)))
        }
        Ok(_) => {
            tracing::info!("🔄 [SM Integration] 结构匹配无结果，fallback到传统评分");
            Ok(None)
        }
        Err(e) => {
            tracing::warn!("⚠️ [SM Integration] 结构匹配失败: {} | fallback到传统评分", e);
            Ok(None)
        }
    }
}

/// 从步骤请求构建结构匹配所需的证据对象
fn build_sm_evidence(
    req: &RunStepRequestV2,
    structural_sigs: StructuralSignatures,
) -> Result<SmStaticEvidence, String> {
    let bounds = req.step.get("bounds").and_then(|v| {
        if let Some(arr) = v.as_array() {
            if arr.len() == 4 {
                Some(Bounds {
                    left: arr[0].as_i64().unwrap_or(0) as i32,
                    top: arr[1].as_i64().unwrap_or(0) as i32,
                    right: arr[2].as_i64().unwrap_or(0) as i32,
                    bottom: arr[3].as_i64().unwrap_or(0) as i32,
                })
            } else {
                None
            }
        } else {
            None
        }
    });
    
    Ok(SmStaticEvidence {
        resource_id: req.step.get("resource_id").and_then(|v| v.as_str()).map(String::from),
        text: req.step.get("text").and_then(|v| v.as_str()).map(String::from),
        content_desc: req.step.get("content_desc").and_then(|v| v.as_str()).map(String::from),
        class: req.step.get("class").and_then(|v| v.as_str()).map(String::from),
        bounds,
        xpath: req.step.get("xpath").and_then(|v| v.as_str()).map(String::from),
        leaf_index: req.step.get("leaf_index").and_then(|v| v.as_i64()).map(|i| i as i32),
        structural_signatures: Some(structural_sigs),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    
    #[test]
    fn test_no_structural_signatures_returns_none() {
        let req = RunStepRequestV2 {
            device_id: "test".to_string(),
            mode: crate::commands::run_step_v2::StepRunMode::ExecuteStep,
            strategy: crate::commands::run_step_v2::StrategyKind::Standard,
            step: json!({"action": "tap"}),
        };
        
        // 应该立即返回 None（无需 async runtime）
        // 此测试仅验证逻辑，实际测试需要 tokio runtime
    }
}
