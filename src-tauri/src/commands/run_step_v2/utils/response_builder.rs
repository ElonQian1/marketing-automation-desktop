// src-tauri/src/commands/run_step_v2/utils/response_builder.rs
// module: v2-execution | layer: utils | role: 响应构建器
// summary: 简化 StepResponseV2 的构建，提供常用响应模板

use crate::commands::run_step_v2::{StepResponseV2, MatchCandidate};

/// 响应构建器 - 简化 StepResponseV2 创建
pub struct ResponseBuilder;

impl ResponseBuilder {
    /// 构建成功响应
    pub fn success(
        message: impl Into<String>,
        matched: MatchCandidate,
        action: impl Into<String>,
    ) -> StepResponseV2 {
        let message_str = message.into();
        let action_str = action.into();
        StepResponseV2 {
            ok: true,
            message: message_str.clone(),
            matched: Some(matched),
            executed_action: Some(action_str),
            verify_passed: Some(true),
            error_code: None,
            raw_logs: Some(vec![format!("执行成功: {}", message_str)]),
        }
    }
    
    /// 构建失败响应
    pub fn error(
        message: impl Into<String>,
        error_code: impl Into<String>,
    ) -> StepResponseV2 {
        let msg = message.into();
        StepResponseV2 {
            ok: false,
            message: msg.clone(),
            matched: None,
            executed_action: None,
            verify_passed: Some(false),
            error_code: Some(error_code.into()),
            raw_logs: Some(vec![msg]),
        }
    }
    
    /// 构建无选择器操作成功响应
    pub fn selector_free_success(
        action_type: &str,
        action_info: impl Into<String>,
    ) -> StepResponseV2 {
        let dummy_candidate = super::create_dummy_candidate(action_type);
        let msg = action_info.into();
        
        StepResponseV2 {
            ok: true,
            message: msg.clone(),
            matched: Some(dummy_candidate),
            executed_action: Some(action_type.to_string()),
            verify_passed: Some(true),
            error_code: None,
            raw_logs: Some(vec![format!("{}执行成功", action_type)]),
        }
    }
    
    /// 构建无选择器操作失败响应
    pub fn selector_free_error(
        action_type: &str,
        error: impl Into<String>,
    ) -> StepResponseV2 {
        let err_msg = error.into();
        
        StepResponseV2 {
            ok: false,
            message: format!("{}执行失败: {}", action_type, err_msg),
            matched: None,
            executed_action: None,
            verify_passed: Some(false),
            error_code: Some(format!("{}_EXEC_FAILED", action_type.to_uppercase())),
            raw_logs: Some(vec![format!("{}失败: {}", action_type, err_msg)]),
        }
    }
    
    /// 构建匹配失败响应
    pub fn match_failed(error: impl Into<String>) -> StepResponseV2 {
        let err_msg = error.into();
        
        StepResponseV2 {
            ok: false,
            message: format!("元素匹配失败: {}", err_msg),
            matched: None,
            executed_action: None,
            verify_passed: Some(false),
            error_code: Some("MATCH_FAILED".to_string()),
            raw_logs: Some(vec![format!("匹配失败: {}", err_msg)]),
        }
    }
    
    /// 构建 UI dump 失败响应
    pub fn ui_dump_failed(error: impl Into<String>) -> StepResponseV2 {
        let err_msg = error.into();
        
        StepResponseV2 {
            ok: false,
            message: format!("UI dump获取失败: {}", err_msg),
            matched: None,
            executed_action: None,
            verify_passed: Some(false),
            error_code: Some("UI_DUMP_FAILED".to_string()),
            raw_logs: Some(vec![format!("UI dump失败: {}", err_msg)]),
        }
    }
    
    /// 构建无匹配元素响应
    pub fn no_match() -> StepResponseV2 {
        StepResponseV2 {
            ok: false,
            message: "未找到匹配的元素".to_string(),
            matched: None,
            executed_action: None,
            verify_passed: Some(false),
            error_code: Some("NO_MATCH".to_string()),
            raw_logs: Some(vec!["未找到匹配元素".to_string()]),
        }
    }
    
    /// 构建批量执行响应
    pub fn batch_execution(
        success_count: usize,
        failed_count: usize,
        logs: Vec<String>,
        first_candidate: Option<MatchCandidate>,
    ) -> StepResponseV2 {
        let total = success_count + failed_count;
        let message = format!(
            "批量执行完成: 成功 {}/{}, 失败 {}",
            success_count, total, failed_count
        );
        
        StepResponseV2 {
            ok: success_count > 0,
            message,
            matched: first_candidate,
            executed_action: Some("batch_tap".to_string()),
            verify_passed: Some(failed_count == 0),
            error_code: if failed_count > 0 {
                Some("PARTIAL_BATCH_FAILED".to_string())
            } else {
                None
            },
            raw_logs: Some(logs),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_error_response() {
        let resp = ResponseBuilder::error("测试错误", "TEST_ERROR");
        assert!(!resp.ok);
        assert_eq!(resp.message, "测试错误");
        assert_eq!(resp.error_code, Some("TEST_ERROR".to_string()));
    }
    
    #[test]
    fn test_no_match_response() {
        let resp = ResponseBuilder::no_match();
        assert!(!resp.ok);
        assert_eq!(resp.error_code, Some("NO_MATCH".to_string()));
    }
}
