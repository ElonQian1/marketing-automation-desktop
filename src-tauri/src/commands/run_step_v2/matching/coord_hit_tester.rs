// src-tauri/src/commands/run_step_v2/matching/coord_hit_tester.rs
// module: step-execution | layer: matching | role: 坐标命中测试
// summary: 坐标兜底策略 - 对指定坐标进行hit-test，找到最小覆盖节点

use super::super::types::*;
use super::super::validation::{parse_xml_attribute, parse_bounds_from_string, check_fullscreen_node, check_container_node};

/// 坐标兜底：对指定坐标进行hit-test，找到最小覆盖节点
pub async fn coord_fallback_hit_test(ui_xml: &str, req: &RunStepRequestV2) -> Result<MatchCandidate, String> {
    let bounds = req.step.get("bounds").ok_or("坐标兜底需要bounds参数")?;
    
    let left = bounds.get("left").and_then(|v| v.as_i64()).ok_or("缺少bounds.left")? as i32;
    let top = bounds.get("top").and_then(|v| v.as_i64()).ok_or("缺少bounds.top")? as i32;
    let right = bounds.get("right").and_then(|v| v.as_i64()).ok_or("缺少bounds.right")? as i32;
    let bottom = bounds.get("bottom").and_then(|v| v.as_i64()).ok_or("缺少bounds.bottom")? as i32;
    
    let center_x = (left + right) / 2;
    let center_y = (top + bottom) / 2;
    
    tracing::info!("🎯 坐标Hit-Test: ({}, {}) 在区域 [{},{} - {},{}]", center_x, center_y, left, top, right, bottom);
    
    // 找到包含该点的最小节点
    let mut best_candidate: Option<MatchCandidate> = None;
    let mut smallest_area = i64::MAX;
    
    let node_regex = regex::Regex::new(r#"<node[^>]*>"#).unwrap();
    
    for node_match in node_regex.find_iter(ui_xml) {
        let node_str = node_match.as_str();
        
        if let Some(bounds_str) = parse_xml_attribute(node_str, "bounds") {
            if let Ok(node_bounds) = parse_bounds_from_string(&bounds_str) {
                // 检查点是否在节点内
                if center_x >= node_bounds.left && center_x <= node_bounds.right &&
                   center_y >= node_bounds.top && center_y <= node_bounds.bottom {
                    
                    let area = ((node_bounds.right - node_bounds.left) as i64) * 
                              ((node_bounds.bottom - node_bounds.top) as i64);
                    
                    // 选择面积最小的节点（最精确的匹配）
                    if area < smallest_area {
                        let class_name = parse_xml_attribute(node_str, "class");
                        
                        // 🛡️ 安全检查：拒绝整屏或容器类节点
                        if check_fullscreen_node(&(node_bounds.left, node_bounds.top, node_bounds.right, node_bounds.bottom)) {
                            tracing::warn!("🚫 Hit-Test命中整屏节点，跳过");
                            continue;
                        }
                        
                        if check_container_node(&class_name) {
                            tracing::warn!("🚫 Hit-Test命中容器节点: {:?}，跳过", class_name);
                            continue;
                        }
                        
                        smallest_area = area;
                        tracing::debug!("🎯 Hit-Test更新候选: 面积={}, 类名={:?}", area, &class_name);
                        tracing::info!("✅ 自测坐标Hit-Test: leaf={:?} 面积={} 坐标=({},{})", 
                                      &class_name, area, center_x, center_y);
                        
                        best_candidate = Some(MatchCandidate {
                            id: format!("hit_test_{}", center_x),
                            score: 0.75, // 坐标兜底给保守分数
                            confidence: 0.75,
                            bounds: node_bounds,
                            text: parse_xml_attribute(node_str, "text"),
                            class_name,
                            package_name: parse_xml_attribute(node_str, "package"),
                        });
                    }
                }
            }
        }
    }
    
    match best_candidate {
        Some(candidate) => {
            tracing::info!("✅ Hit-Test成功: 匹配到 {:?} (面积={})", candidate.class_name, smallest_area);
            Ok(candidate)
        }
        None => {
            Err(format!("❌ Hit-Test失败: 坐标({}, {})未命中任何有效节点", center_x, center_y))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_center_calculation() {
        let left = 100;
        let right = 200;
        let top = 50;
        let bottom = 150;
        
        let center_x = (left + right) / 2;
        let center_y = (top + bottom) / 2;
        
        assert_eq!(center_x, 150);
        assert_eq!(center_y, 100);
    }
}
