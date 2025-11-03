// src-tauri/src/commands/run_step_v2/validation/safety_checker.rs
// module: step-execution | layer: validation | role: 安全检查
// summary: 执行前安全闸门 - 检测整屏节点和容器类节点，防止误操作

/// 检查是否为整屏节点（占屏幕95%以上面积）
/// 
/// # 参数
/// - `bounds`: 节点边界 (left, top, right, bottom)
/// 
/// # 返回
/// - `true`: 整屏节点，不应该被直接点击
/// - `false`: 非整屏节点，可以安全点击
pub fn check_fullscreen_node(bounds: &(i32, i32, i32, i32)) -> bool {
    let (left, top, right, bottom) = bounds;
    let width = (right - left) as f32;
    let height = (bottom - top) as f32;
    let area = width * height;
    
    // 假设屏幕大小为 1080x2400（可以后续从设备信息获取）
    let screen_area = 1080.0 * 2400.0;
    let area_ratio = area / screen_area;
    
    tracing::debug!(
        "🔍 节点面积检查: {}x{} = {:.1}%, 阈值95%", 
        width as i32, height as i32, area_ratio * 100.0
    );
    
    area_ratio > 0.95
}

/// 检查是否为容器类节点（不应该被直接点击）
/// 
/// # 参数
/// - `class_name`: 节点类名，例如 "android.widget.FrameLayout"
/// 
/// # 返回
/// - `true`: 容器类节点，不应该被直接点击
/// - `false`: 非容器类节点，可以安全点击
pub fn check_container_node(class_name: &Option<String>) -> bool {
    if let Some(class) = class_name {
        let container_classes = [
            "android.widget.FrameLayout",
            "android.widget.LinearLayout", 
            "android.view.ViewGroup",
            "com.android.internal.policy.DecorView",
            "android.widget.RelativeLayout",
            "android.widget.ScrollView",
            "androidx.constraintlayout.widget.ConstraintLayout",
        ];
        
        let is_container = container_classes.iter().any(|&container_class| class == container_class);
        
        if is_container {
            tracing::debug!("🔍 容器类检查: {} 被识别为容器节点", class);
        }
        
        is_container
    } else {
        false
    }
}

/// 验证目标节点的安全性（整合检查）
/// 
/// # 参数
/// - `bounds`: 节点边界
/// - `class_name`: 节点类名
/// 
/// # 返回
/// - `Ok(())`: 目标安全，可以执行
/// - `Err(String)`: 目标不安全，包含错误原因
pub fn validate_target_safety(
    bounds: &(i32, i32, i32, i32),
    class_name: &Option<String>
) -> Result<(), String> {
    if check_fullscreen_node(bounds) {
        return Err(format!(
            "UNSAFE_TARGET: 整屏节点不允许直接点击 bounds=({},{},{},{})",
            bounds.0, bounds.1, bounds.2, bounds.3
        ));
    }
    
    if check_container_node(class_name) {
        return Err(format!(
            "UNSAFE_TARGET: 容器节点不允许直接点击 class={:?}",
            class_name.as_deref().unwrap_or("unknown")
        ));
    }
    
    tracing::debug!(
        "✅ 目标安全检查通过: bounds=({},{},{},{}), class={:?}",
        bounds.0, bounds.1, bounds.2, bounds.3, class_name
    );
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_check_fullscreen_node() {
        // 整屏节点 (1080x2400)
        let fullscreen = (0, 0, 1080, 2400);
        assert!(check_fullscreen_node(&fullscreen));
        
        // 非整屏节点 (100x100)
        let normal = (100, 200, 200, 300);
        assert!(!check_fullscreen_node(&normal));
    }

    #[test]
    fn test_check_container_node() {
        // 容器类节点
        assert!(check_container_node(&Some("android.widget.FrameLayout".to_string())));
        assert!(check_container_node(&Some("android.widget.LinearLayout".to_string())));
        
        // 非容器类节点
        assert!(!check_container_node(&Some("android.widget.Button".to_string())));
        assert!(!check_container_node(&Some("android.widget.TextView".to_string())));
        
        // None
        assert!(!check_container_node(&None));
    }

    #[test]
    fn test_validate_target_safety() {
        // 安全目标
        let safe_bounds = (100, 200, 200, 300);
        let safe_class = Some("android.widget.Button".to_string());
        assert!(validate_target_safety(&safe_bounds, &safe_class).is_ok());
        
        // 不安全：整屏
        let fullscreen = (0, 0, 1080, 2400);
        assert!(validate_target_safety(&fullscreen, &safe_class).is_err());
        
        // 不安全：容器
        let container_class = Some("android.widget.FrameLayout".to_string());
        assert!(validate_target_safety(&safe_bounds, &container_class).is_err());
    }
}
