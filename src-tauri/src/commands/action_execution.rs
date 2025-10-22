// src-tauri/src/commands/action_execution.rs
// module: commands | layer: api | role: 操作执行命令接口
// summary: 前端调用的操作执行Tauri命令

use serde_json::Value;
use crate::types::action_types::*;
use crate::services::action_executor::ActionExecutor;
use crate::services::action_recommender::ActionRecommender;

/// 执行单个操作
#[tauri::command]
pub async fn execute_action_command(
    device_id: String,
    action: ActionType,
    element_bounds: Option<(i32, i32, i32, i32)>, // (left, top, right, bottom)
    timeout: Option<u64>,
) -> Result<ActionResult, String> {
    tracing::info!("🎯 [execute_action_command] 收到操作执行请求: {}", action.type_id());
    
    // 创建执行上下文
    let context = ActionContext {
        device_id,
        target_bounds: element_bounds.map(|(l, t, r, b)| ElementBounds::new(l, t, r, b)),
        timeout,
        verify_with_screenshot: Some(false),
    };
    
    // 执行操作
    let executor = ActionExecutor::new();
    executor.execute_action(&action, &context).await
}

/// 推荐操作类型
#[tauri::command]
pub async fn recommend_action_command(
    xml_element: String,
) -> Result<serde_json::Value, String> {
    tracing::info!("🧠 [recommend_action_command] 收到操作推荐请求");
    
    let recommender = ActionRecommender::new();
    let features = ActionRecommender::extract_features_from_xml(&xml_element);
    let recommendation = recommender.recommend_action(&features);
    
    // 转换为JSON格式返回给前端
    serde_json::to_value(&recommendation)
        .map_err(|e| format!("序列化推荐结果失败: {}", e))
}

/// 批量推荐操作类型
#[tauri::command]
pub async fn batch_recommend_actions_command(
    xml_elements: Vec<String>,
) -> Result<Vec<serde_json::Value>, String> {
    tracing::info!("🧠 [batch_recommend_actions_command] 收到批量推荐请求，元素数量: {}", xml_elements.len());
    
    let recommender = ActionRecommender::new();
    let mut recommendations = Vec::new();
    
    for (index, xml_element) in xml_elements.iter().enumerate() {
        let features = ActionRecommender::extract_features_from_xml(xml_element);
        let recommendation = recommender.recommend_action(&features);
        
        let mut result = serde_json::to_value(&recommendation)
            .map_err(|e| format!("序列化推荐结果失败: {}", e))?;
            
        // 添加元素索引
        if let Some(obj) = result.as_object_mut() {
            obj.insert("element_index".to_string(), Value::Number(index.into()));
        }
        
        recommendations.push(result);
    }
    
    Ok(recommendations)
}

/// 验证操作参数
#[tauri::command]
pub async fn validate_action_params_command(
    action: ActionType,
) -> Result<bool, String> {
    tracing::debug!("✅ [validate_action_params_command] 验证操作参数: {}", action.type_id());
    
    // 基本参数验证
    match &action {
        ActionType::Input { text, .. } => {
            if text.trim().is_empty() {
                return Err("输入文本不能为空".to_string());
            }
        }
        ActionType::ScrollTo { target_x, target_y, .. } => {
            if *target_x < 0 || *target_y < 0 {
                return Err("滚动目标坐标不能为负数".to_string());
            }
        }
        ActionType::Wait { duration } => {
            if *duration == 0 {
                return Err("等待时间必须大于0".to_string());
            }
        }
        _ => {} // 其他操作类型无需特殊验证
    }
    
    Ok(true)
}