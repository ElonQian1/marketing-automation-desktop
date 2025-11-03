// src-tauri/src/commands/run_step_v2/validation/bounds_validator.rs
// module: step-execution | layer: validation | role: 边界验证
// summary: 验证节点边界是否在屏幕范围内

/// 验证边界是否在屏幕范围内
/// 
/// # 参数
/// - `bounds`: 节点边界 (left, top, right, bottom)
/// - `screen_width`: 屏幕宽度
/// - `screen_height`: 屏幕高度
/// 
/// # 返回
/// - `Ok(())`: 边界合法
/// - `Err(String)`: 边界非法，包含错误原因
pub fn validate_bounds_within_screen(
    bounds: &(i32, i32, i32, i32),
    screen_width: i32,
    screen_height: i32
) -> Result<(), String> {
    let (left, top, right, bottom) = bounds;
    
    if *left < 0 || *top < 0 {
        return Err(format!(
            "INVALID_BOUNDS: 负坐标 left={}, top={}",
            left, top
        ));
    }
    
    if *right > screen_width || *bottom > screen_height {
        return Err(format!(
            "INVALID_BOUNDS: 超出屏幕范围 right={} (max={}), bottom={} (max={})",
            right, screen_width, bottom, screen_height
        ));
    }
    
    if *left >= *right || *top >= *bottom {
        return Err(format!(
            "INVALID_BOUNDS: 无效区域 [{},{}]-[{},{}]",
            left, top, right, bottom
        ));
    }
    
    Ok(())
}

/// 计算两个边界的交集面积
pub fn calculate_intersection_area(
    bounds1: &(i32, i32, i32, i32),
    bounds2: &(i32, i32, i32, i32)
) -> i32 {
    let (left1, top1, right1, bottom1) = bounds1;
    let (left2, top2, right2, bottom2) = bounds2;
    
    let left = (*left1).max(*left2);
    let top = (*top1).max(*top2);
    let right = (*right1).min(*right2);
    let bottom = (*bottom1).min(*bottom2);
    
    if left >= right || top >= bottom {
        0 // 无交集
    } else {
        (right - left) * (bottom - top)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_bounds_within_screen() {
        let screen_width = 1080;
        let screen_height = 2400;
        
        // 合法边界
        let valid_bounds = (100, 200, 300, 400);
        assert!(validate_bounds_within_screen(&valid_bounds, screen_width, screen_height).is_ok());
        
        // 负坐标
        let negative_bounds = (-10, 200, 300, 400);
        assert!(validate_bounds_within_screen(&negative_bounds, screen_width, screen_height).is_err());
        
        // 超出屏幕
        let overflow_bounds = (100, 200, 1100, 400);
        assert!(validate_bounds_within_screen(&overflow_bounds, screen_width, screen_height).is_err());
        
        // 无效区域
        let invalid_bounds = (300, 400, 100, 200);
        assert!(validate_bounds_within_screen(&invalid_bounds, screen_width, screen_height).is_err());
    }

    #[test]
    fn test_calculate_intersection_area() {
        // 有交集
        let bounds1 = (0, 0, 100, 100);
        let bounds2 = (50, 50, 150, 150);
        assert_eq!(calculate_intersection_area(&bounds1, &bounds2), 2500); // 50x50
        
        // 无交集
        let bounds3 = (0, 0, 50, 50);
        let bounds4 = (100, 100, 150, 150);
        assert_eq!(calculate_intersection_area(&bounds3, &bounds4), 0);
        
        // 完全包含
        let bounds5 = (0, 0, 100, 100);
        let bounds6 = (20, 20, 80, 80);
        assert_eq!(calculate_intersection_area(&bounds5, &bounds6), 3600); // 60x60
    }
}
