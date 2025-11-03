// src-tauri/src/commands/run_step_v2/utils/step_processor.rs
// module: run_step_v2 | layer: utils | role: 步骤数据预处理器
// summary: 处理前端步骤数据的预处理，包括参数展开、操作类型检测等

use serde_json::Value;
use crate::commands::run_step_v2::{MatchCandidate, Bounds};

/// 展开 coordinateParams 参数到步骤对象
/// 
/// 处理前端发送的嵌套参数结构，将 coordinateParams 中的字段展开到 step 对象根层级
/// 
/// # 参数映射
/// - `duration` → `duration_ms`（前后端参数名映射）
/// 
/// # 示例
/// ```json
/// {
///   "action": "swipe",
///   "coordinateParams": {
///     "start_x": 100,
///     "duration": 500
///   }
/// }
/// ```
/// 展开后：
/// ```json
/// {
///   "action": "swipe",
///   "start_x": 100,
///   "duration_ms": 500
/// }
/// ```
pub fn expand_coordinate_params(step: &Value) -> Value {
    let mut step_with_coords = step.clone();
    
    // 如果前端发送了coordinateParams，展开到step对象中
    if let Some(coord_params) = step.get("coordinateParams") {
        if let Some(obj) = coord_params.as_object() {
            tracing::info!("🔧 展开coordinateParams到step对象: {:?}", obj);
            for (key, value) in obj {
                // 🔧 参数名称映射：处理前后端参数名不匹配问题
                let mapped_key = match key.as_str() {
                    "duration" => "duration_ms",  // 延时参数映射
                    _ => key
                };
                step_with_coords[mapped_key] = value.clone();
            }
        }
    }
    
    step_with_coords
}

/// 检测操作是否需要元素选择器
/// 
/// 某些操作类型（如系统按键、文本输入）不需要通过选择器定位元素
/// 
/// # 无需选择器的操作类型
/// - `keyevent`: 系统按键（返回、Home等）
/// - `input`: 文本输入
/// - `long_press`: 长按（可能基于坐标）
pub fn is_selector_free_action(action_type: &str) -> bool {
    matches!(action_type, "keyevent" | "input" | "long_press")
}

/// 检测是否为坐标滑动操作
/// 
/// 如果步骤包含完整的滑动坐标（start_x, start_y, end_x, end_y）且操作类型为 swipe，
/// 则跳过元素匹配直接执行
pub fn is_coordinate_swipe(step: &Value, action_type: &str) -> bool {
    if action_type != "swipe" {
        return false;
    }
    
    step.get("start_x").is_some() 
        && step.get("start_y").is_some() 
        && step.get("end_x").is_some() 
        && step.get("end_y").is_some()
}

/// 创建虚拟匹配候选（用于无需选择器的操作）
/// 
/// 某些操作不需要实际的元素匹配，创建虚拟候选以保持接口一致性
/// 
/// # 参数
/// - `mode_name`: 操作模式名称（如 "keyevent", "坐标滑动"）
/// 
/// # 返回
/// confidence 为 0.0 的虚拟候选，标记为特殊模式
pub fn create_dummy_candidate(mode_name: &str) -> MatchCandidate {
    MatchCandidate {
        id: format!("{}_mode", mode_name),
        score: 1.0,
        confidence: 0.0, // 标记为特殊模式（非真实匹配）
        bounds: Bounds { left: 0, top: 0, right: 0, bottom: 0 },
        text: Some(format!("{}操作模式", mode_name)),
        class_name: None,
        package_name: None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_expand_coordinate_params() {
        let step = json!({
            "action": "swipe",
            "coordinateParams": {
                "start_x": 100,
                "start_y": 200,
                "duration": 500
            }
        });

        let expanded = expand_coordinate_params(&step);
        
        assert_eq!(expanded.get("start_x").unwrap().as_i64(), Some(100));
        assert_eq!(expanded.get("start_y").unwrap().as_i64(), Some(200));
        assert_eq!(expanded.get("duration_ms").unwrap().as_i64(), Some(500));
    }

    #[test]
    fn test_is_selector_free_action() {
        assert!(is_selector_free_action("keyevent"));
        assert!(is_selector_free_action("input"));
        assert!(is_selector_free_action("long_press"));
        assert!(!is_selector_free_action("tap"));
        assert!(!is_selector_free_action("swipe"));
    }

    #[test]
    fn test_is_coordinate_swipe() {
        let swipe_with_coords = json!({
            "action": "swipe",
            "start_x": 100,
            "start_y": 200,
            "end_x": 300,
            "end_y": 400
        });
        
        assert!(is_coordinate_swipe(&swipe_with_coords, "swipe"));
        assert!(!is_coordinate_swipe(&swipe_with_coords, "tap"));
        
        let incomplete_coords = json!({
            "action": "swipe",
            "start_x": 100
        });
        
        assert!(!is_coordinate_swipe(&incomplete_coords, "swipe"));
    }

    #[test]
    fn test_create_dummy_candidate() {
        let candidate = create_dummy_candidate("keyevent");
        
        assert_eq!(candidate.id, "keyevent_mode");
        assert_eq!(candidate.confidence, 0.0);
        assert_eq!(candidate.text, Some("keyevent操作模式".to_string()));
    }
}
