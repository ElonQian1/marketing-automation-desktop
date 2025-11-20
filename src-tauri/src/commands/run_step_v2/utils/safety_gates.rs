// src-tauri/src/commands/run_step_v2/utils/safety_gates.rs
// module: run_step_v2 | layer: utils | role: 执行前安全闸门检查
// summary: 在执行操作前进行安全检查，防止误操作

use crate::commands::run_step_v2::{MatchCandidate, MatchInfo, StepResponseV2};
use crate::commands::run_step_v2::validation::{check_fullscreen_node, check_container_node};

/// 安全闸门检查结果
pub enum SafetyGateResult {
    /// 通过所有安全检查
    Pass,
    /// 唯一性检查失败
    UniquenessFailure { uniqueness: i32 },
    /// 置信度过低
    LowConfidence { confidence: f32 },
    /// 不安全的目标（整屏或容器节点）
    UnsafeTarget { reason: String },
}

/// 执行前安全闸门检查
/// 
/// 三重安全检查：
/// 1. 唯一性检查：确保匹配结果唯一（uniqueness >= 0.8）
/// 2. 置信度检查：确保匹配置信度足够高（confidence >= 0.6）
/// 3. 目标安全检查：避免点击整屏或容器节点
/// 
/// # 参数
/// - `match_info`: 匹配信息（唯一性、置信度等）
/// - `match_candidate`: 匹配到的候选元素
/// 
/// # 返回
/// - `SafetyGateResult::Pass`: 通过所有检查
/// - `SafetyGateResult::*Failure`: 具体的失败原因
pub fn check_safety_gates(
    match_info: &MatchInfo,
    match_candidate: &MatchCandidate,
) -> SafetyGateResult {
    // 1️⃣ 唯一性闸门（uniqueness 为 1 表示唯一）
    if match_info.uniqueness != 1 {
        tracing::warn!(
            "❌ 唯一性检查失败: uniq={}, 存在多个候选，拒绝执行", 
            match_info.uniqueness
        );
        return SafetyGateResult::UniquenessFailure {
            uniqueness: match_info.uniqueness,
        };
    }

    // 2️⃣ 置信度闸门
    if match_info.confidence < 0.6 {
        tracing::warn!(
            "❌ 置信度检查失败: conf={:.2}, 拒绝执行", 
            match_info.confidence
        );
        return SafetyGateResult::LowConfidence {
            confidence: match_info.confidence,
        };
    }

    // 3️⃣ 整屏/容器节点闸门
    let bounds_tuple = (
        match_candidate.bounds.left,
        match_candidate.bounds.top,
        match_candidate.bounds.right,
        match_candidate.bounds.bottom,
    );
    
    let is_fullscreen_or_container = 
        check_fullscreen_node(&bounds_tuple) || 
        check_container_node(&match_candidate.class_name);
    
    if is_fullscreen_or_container {
        let reason = if check_fullscreen_node(&bounds_tuple) {
            "整屏节点"
        } else {
            "容器节点"
        };
        
        tracing::warn!(
            "❌ {}检查失败: bounds={:?}, class={:?}, 拒绝执行",
            reason,
            match_candidate.bounds,
            match_candidate.class_name
        );
        
        return SafetyGateResult::UnsafeTarget {
            reason: reason.to_string(),
        };
    }

    tracing::info!(
        "✅ 安全闸门检查通过: uniq={}, conf={:.2}, 目标安全",
        match_info.uniqueness,
        match_info.confidence
    );

    SafetyGateResult::Pass
}

/// 将安全检查结果转换为响应（用于提前返回失败情况）
pub fn safety_result_to_response(
    result: SafetyGateResult,
    match_candidate: MatchCandidate,
) -> Option<StepResponseV2> {
    match result {
        SafetyGateResult::Pass => None,
        
        SafetyGateResult::UniquenessFailure { uniqueness } => Some(StepResponseV2 {
            ok: false,
            message: format!("唯一性过低 ({:.0}%), 存在多个候选，拒绝执行", uniqueness as f32 * 100.0),
            matched: Some(match_candidate),
            executed_action: None,
            verify_passed: Some(false),
            error_code: Some("NOT_UNIQUE".to_string()),
            raw_logs: Some(vec![format!("唯一性检查失败: uniq={}", uniqueness)]),
        }),
        
        SafetyGateResult::LowConfidence { confidence } => Some(StepResponseV2 {
            ok: false,
            message: format!("置信度过低 ({:.1}%), 拒绝执行", confidence * 100.0),
            matched: Some(match_candidate),
            executed_action: None,
            verify_passed: Some(false),
            error_code: Some("LOW_CONFIDENCE".to_string()),
            raw_logs: Some(vec![format!("置信度检查失败: {:.1}%", confidence * 100.0)]),
        }),
        
        SafetyGateResult::UnsafeTarget { reason } => Some(StepResponseV2 {
            ok: false,
            message: format!("匹配到{}, 拒绝执行以防误操作", reason),
            matched: Some(match_candidate),
            executed_action: None,
            verify_passed: Some(false),
            error_code: Some("UNSAFE_TARGET".to_string()),
            raw_logs: Some(vec![format!("{}检查失败", reason)]),
        }),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::commands::run_step_v2::Bounds;

    fn create_test_candidate(bounds: Bounds, class_name: Option<String>) -> MatchCandidate {
        MatchCandidate {
            id: "test".to_string(),
            score: 1.0,
            confidence: 0.9,
            bounds,
            text: None,
            class_name,
            package_name: None,
        }
    }

    #[test]
    fn test_uniqueness_failure() {
        let match_info = MatchInfo {
            confidence: 0.9,
            uniqueness: 2, // >1 表示不唯一
            elements_found: 2,
        };
        let candidate = create_test_candidate(
            Bounds { left: 100, top: 100, right: 200, bottom: 200 },
            None,
        );

        let result = check_safety_gates(&match_info, &candidate);
        assert!(matches!(result, SafetyGateResult::UniquenessFailure { .. }));
    }

    #[test]
    fn test_low_confidence() {
        let match_info = MatchInfo {
            confidence: 0.5, // 低于0.6
            uniqueness: 1,
            elements_found: 1,
        };
        let candidate = create_test_candidate(
            Bounds { left: 100, top: 100, right: 200, bottom: 200 },
            None,
        );

        let result = check_safety_gates(&match_info, &candidate);
        assert!(matches!(result, SafetyGateResult::LowConfidence { .. }));
    }

    #[test]
    fn test_safety_pass() {
        let match_info = MatchInfo {
            confidence: 0.9,
            uniqueness: 1,
            elements_found: 1,
        };
        let candidate = create_test_candidate(
            Bounds { left: 100, top: 100, right: 200, bottom: 200 },
            Some("Button".to_string()),
        );

        let result = check_safety_gates(&match_info, &candidate);
        assert!(matches!(result, SafetyGateResult::Pass));
    }
}
