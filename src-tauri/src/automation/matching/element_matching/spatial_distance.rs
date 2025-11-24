// src-tauri/src/exec/v3/element_matching/spatial_distance.rs
// module: v3-execution | layer: matching | role: 空间距离计算
// summary: 计算两个元素边界的欧几里得距离

use anyhow::Result;

/// 空间距离计算器
pub struct SpatialDistance;

/// 计算两个bounds之间的中心点距离
/// 
/// bounds格式: "[x1,y1][x2,y2]"
/// 返回: 欧几里得距离（像素）
pub fn calculate_distance(bounds1: &str, bounds2: &str) -> Result<f32> {
    let center1 = parse_bounds_center(bounds1)?;
    let center2 = parse_bounds_center(bounds2)?;
    
    let dx = (center1.0 - center2.0) as f32;
    let dy = (center1.1 - center2.1) as f32;
    
    Ok((dx * dx + dy * dy).sqrt())
}

/// 解析bounds字符串获取中心点坐标
fn parse_bounds_center(bounds: &str) -> Result<(i32, i32)> {
    // 格式: "[x1,y1][x2,y2]"
    let parts: Vec<&str> = bounds
        .trim_matches(&['[', ']'] as &[char])
        .split("][")
        .collect();
    
    if parts.len() != 2 {
        return Err(anyhow::anyhow!("Invalid bounds format: {}", bounds));
    }
    
    let start: Vec<i32> = parts[0]
        .split(',')
        .filter_map(|s| s.parse().ok())
        .collect();
    
    let end: Vec<i32> = parts[1]
        .split(',')
        .filter_map(|s| s.parse().ok())
        .collect();
    
    if start.len() != 2 || end.len() != 2 {
        return Err(anyhow::anyhow!("Invalid bounds coordinates: {}", bounds));
    }
    
    let center_x = (start[0] + end[0]) / 2;
    let center_y = (start[1] + end[1]) / 2;
    
    Ok((center_x, center_y))
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_parse_bounds_center() {
        let bounds = "[0,0][100,200]";
        let center = parse_bounds_center(bounds).unwrap();
        assert_eq!(center, (50, 100));
    }
    
    #[test]
    fn test_calculate_distance() {
        let bounds1 = "[0,0][100,100]";    // 中心: (50, 50)
        let bounds2 = "[100,100][200,200]"; // 中心: (150, 150)
        
        let distance = calculate_distance(bounds1, bounds2).unwrap();
        // 距离 = sqrt((150-50)^2 + (150-50)^2) = sqrt(10000 + 10000) = 141.42
        assert!((distance - 141.42).abs() < 0.1);
    }
}
