// src-tauri/src/exec/v3/helpers/element_hierarchy_analyzer.rs
// module: exec/v3 | layer: helpers | role: 元素层级关系分析器
// summary: 分析用户选择的容器与候选元素的空间关系，支持父子关系和邻近关系分析

use crate::services::universal_ui_page_analyzer::UIElement;

/// 元素空间关系类型
#[derive(Debug, Clone, PartialEq)]
pub enum SpatialRelation {
    /// 候选完全在用户选择区域内
    FullyContained,
    /// 候选部分与用户选择区域重叠
    PartialOverlap { overlap_ratio: f64 },
    /// 候选在用户选择区域附近
    Nearby { distance: f64 },
    /// 候选远离用户选择区域
    Far,
}

/// 元素层级关系
#[derive(Debug, Clone)]
pub struct ElementRelation {
    /// 空间关系类型
    pub spatial_relation: SpatialRelation,
    /// 关系得分 (0.0-1.0)
    pub score: f64,
    /// 候选元素bounds
    pub candidate_bounds: String,
    /// 用户选择bounds
    pub user_bounds: String,
}

/// 解析bounds字符串 "[left,top][right,bottom]"
pub fn parse_bounds(bounds_str: &str) -> Option<(i32, i32, i32, i32)> {
    let bounds_str = bounds_str.trim();
    
    // 格式: "[left,top][right,bottom]"
    if !bounds_str.starts_with('[') || !bounds_str.ends_with(']') {
        return None;
    }
    
    // 分割两个坐标对
    let parts: Vec<&str> = bounds_str
        .trim_start_matches('[')
        .trim_end_matches(']')
        .split("][")
        .collect();
    
    if parts.len() != 2 {
        return None;
    }
    
    // 解析第一个坐标对 [left,top]
    let first: Vec<&str> = parts[0].split(',').collect();
    if first.len() != 2 {
        return None;
    }
    
    // 解析第二个坐标对 [right,bottom]
    let second: Vec<&str> = parts[1].split(',').collect();
    if second.len() != 2 {
        return None;
    }
    
    let left = first[0].trim().parse::<i32>().ok()?;
    let top = first[1].trim().parse::<i32>().ok()?;
    let right = second[0].trim().parse::<i32>().ok()?;
    let bottom = second[1].trim().parse::<i32>().ok()?;
    
    Some((left, top, right, bottom))
}

/// 计算两个bounds的重叠面积比例
fn calculate_overlap_ratio(
    bounds1: (i32, i32, i32, i32),
    bounds2: (i32, i32, i32, i32),
) -> f64 {
    let (left1, top1, right1, bottom1) = bounds1;
    let (left2, top2, right2, bottom2) = bounds2;
    
    // 计算重叠区域
    let overlap_left = left1.max(left2);
    let overlap_top = top1.max(top2);
    let overlap_right = right1.min(right2);
    let overlap_bottom = bottom1.min(bottom2);
    
    // 检查是否有重叠
    if overlap_left >= overlap_right || overlap_top >= overlap_bottom {
        return 0.0;
    }
    
    // 计算重叠面积
    let overlap_area = ((overlap_right - overlap_left) * (overlap_bottom - overlap_top)) as f64;
    
    // 计算候选元素面积
    let candidate_area = ((right1 - left1) * (bottom1 - top1)) as f64;
    
    if candidate_area == 0.0 {
        return 0.0;
    }
    
    // 返回重叠比例 (重叠面积 / 候选面积)
    overlap_area / candidate_area
}

/// 计算两个bounds中心点的距离
fn calculate_center_distance(
    bounds1: (i32, i32, i32, i32),
    bounds2: (i32, i32, i32, i32),
) -> f64 {
    let (left1, top1, right1, bottom1) = bounds1;
    let (left2, top2, right2, bottom2) = bounds2;
    
    // 计算中心点
    let center1_x = (left1 + right1) as f64 / 2.0;
    let center1_y = (top1 + bottom1) as f64 / 2.0;
    let center2_x = (left2 + right2) as f64 / 2.0;
    let center2_y = (top2 + bottom2) as f64 / 2.0;
    
    // 欧几里得距离
    let dx = center1_x - center2_x;
    let dy = center1_y - center2_y;
    (dx * dx + dy * dy).sqrt()
}

/// 分析候选元素与用户选择区域的空间关系
pub fn analyze_spatial_relation(
    candidate_bounds: &str,
    user_bounds: &str,
) -> ElementRelation {
    let candidate = match parse_bounds(candidate_bounds) {
        Some(b) => b,
        None => {
            tracing::warn!("❌ 无法解析候选bounds: {}", candidate_bounds);
            return ElementRelation {
                spatial_relation: SpatialRelation::Far,
                score: 0.0,
                candidate_bounds: candidate_bounds.to_string(),
                user_bounds: user_bounds.to_string(),
            };
        }
    };
    
    let user = match parse_bounds(user_bounds) {
        Some(b) => b,
        None => {
            tracing::warn!("❌ 无法解析用户bounds: {}", user_bounds);
            return ElementRelation {
                spatial_relation: SpatialRelation::Far,
                score: 0.0,
                candidate_bounds: candidate_bounds.to_string(),
                user_bounds: user_bounds.to_string(),
            };
        }
    };
    
    let (c_left, c_top, c_right, c_bottom) = candidate;
    let (u_left, u_top, u_right, u_bottom) = user;
    
    // 1. 检查完全包含 (候选完全在用户区域内)
    if c_left >= u_left && c_top >= u_top && c_right <= u_right && c_bottom <= u_bottom {
        // 🔕 临时禁用：测试时噪音过大
        // tracing::debug!(
        //     "✅ 候选完全包含: candidate={}, user={}",
        //     candidate_bounds, user_bounds
        // );
        return ElementRelation {
            spatial_relation: SpatialRelation::FullyContained,
            score: 1.0,
            candidate_bounds: candidate_bounds.to_string(),
            user_bounds: user_bounds.to_string(),
        };
    }
    
    // 2. 检查重叠
    let overlap_ratio = calculate_overlap_ratio(candidate, user);
    if overlap_ratio > 0.0 {
        // 重叠比例映射到得分: 0.5-0.99
        let score = 0.5 + (overlap_ratio * 0.49);
        // 🔕 临时禁用：测试时噪音过大
        // tracing::debug!(
        //     "🔗 候选部分重叠: overlap_ratio={:.3}, score={:.3}, candidate={}, user={}",
        //     overlap_ratio, score, candidate_bounds, user_bounds
        // );
        return ElementRelation {
            spatial_relation: SpatialRelation::PartialOverlap { overlap_ratio },
            score,
            candidate_bounds: candidate_bounds.to_string(),
            user_bounds: user_bounds.to_string(),
        };
    }
    
    // 3. 检查距离
    let distance = calculate_center_distance(candidate, user);
    if distance < 2000.0 {
        // 距离映射到得分: 0.1-0.49
        let score = 0.49 - (distance / 2000.0 * 0.39).min(0.39);
        // 🔕 临时禁用：测试时噪音过大
        // tracing::debug!(
        //     "📍 候选附近: distance={:.1}px, score={:.3}, candidate={}, user={}",
        //     distance, score, candidate_bounds, user_bounds
        // );
        return ElementRelation {
            spatial_relation: SpatialRelation::Nearby { distance },
            score,
            candidate_bounds: candidate_bounds.to_string(),
            user_bounds: user_bounds.to_string(),
        };
    }
    
    // 4. 太远
    // 🔕 临时禁用：测试时噪音过大
    // tracing::debug!(
    //     "🚫 候选远离: distance={:.1}px, candidate={}, user={}",
    //     distance, candidate_bounds, user_bounds
    // );
    ElementRelation {
        spatial_relation: SpatialRelation::Far,
        score: 0.0,
        candidate_bounds: candidate_bounds.to_string(),
        user_bounds: user_bounds.to_string(),
    }
}

/// 在UI元素列表中查找与用户选择区域相关的可点击子元素
/// 
/// 策略:
/// 1. 优先返回完全包含在用户区域内的可点击元素
/// 2. 如果没有,返回与用户区域重叠的可点击元素
/// 3. 如果没有,返回用户区域附近的可点击元素
pub fn find_clickable_children_in_bounds<'a>(
    elements: &'a [UIElement],
    user_bounds: &str,
) -> Vec<&'a UIElement> {
    let mut fully_contained = Vec::new();
    let mut overlapping = Vec::new();
    let mut nearby = Vec::new();
    
    for element in elements {
        // 只考虑可点击的元素
        if !element.clickable {
            continue;
        }
        
        // 必须有bounds
        let elem_bounds = &element.bounds;
        
        // 分析空间关系
        let relation = analyze_spatial_relation(&elem_bounds.to_string(), user_bounds);
        
        match relation.spatial_relation {
            SpatialRelation::FullyContained => {
                fully_contained.push(element);
            }
            SpatialRelation::PartialOverlap { .. } => {
                overlapping.push(element);
            }
            SpatialRelation::Nearby { .. } => {
                nearby.push(element);
            }
            SpatialRelation::Far => {
                // 忽略远离的元素
            }
        }
    }
    
    // 按优先级返回
    if !fully_contained.is_empty() {
        tracing::info!(
            "🎯 找到 {} 个完全包含在用户区域内的可点击元素",
            fully_contained.len()
        );
        return fully_contained;
    }
    
    if !overlapping.is_empty() {
        tracing::info!(
            "🔗 找到 {} 个与用户区域重叠的可点击元素",
            overlapping.len()
        );
        return overlapping;
    }
    
    if !nearby.is_empty() {
        tracing::info!(
            "📍 找到 {} 个用户区域附近的可点击元素",
            nearby.len()
        );
        return nearby;
    }
    
    tracing::warn!("⚠️ 未找到与用户区域相关的可点击元素");
    Vec::new()
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_parse_bounds() {
        assert_eq!(parse_bounds("[0,100][200,300]"), Some((0, 100, 200, 300)));
        assert_eq!(parse_bounds("[45,1059][249,1263]"), Some((45, 1059, 249, 1263)));
        assert_eq!(parse_bounds("invalid"), None);
    }
    
    #[test]
    fn test_fully_contained() {
        let candidate = "[100,200][300,400]";
        let user = "[0,0][500,500]";
        let relation = analyze_spatial_relation(candidate, user);
        assert_eq!(relation.spatial_relation, SpatialRelation::FullyContained);
        assert_eq!(relation.score, 1.0);
    }
    
    #[test]
    fn test_no_overlap() {
        let candidate = "[100,200][300,400]";
        let user = "[500,600][700,800]";
        let relation = analyze_spatial_relation(candidate, user);
        assert!(matches!(relation.spatial_relation, SpatialRelation::Nearby { .. } | SpatialRelation::Far));
    }
}



