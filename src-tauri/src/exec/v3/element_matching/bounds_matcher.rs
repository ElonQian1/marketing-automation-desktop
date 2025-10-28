// src-tauri/src/exec/v3/element_matching/bounds_matcher.rs
// module: v3-execution | layer: matching | role: Bounds模糊匹配算法
// summary: 处理静态XML与动态XML的bounds差异，支持模糊匹配和包含关系检测

use crate::services::ui_reader_service::UIElement;

/// Bounds匹配结果
#[derive(Debug, Clone)]
pub struct BoundsMatchResult {
    /// 是否精确匹配
    pub is_exact: bool,
    /// 是否包含关系（用户bounds包含在候选bounds内）
    pub is_contained: bool,
    /// 是否重叠
    pub is_overlap: bool,
    /// IOU (Intersection over Union) 值 [0.0, 1.0]
    pub iou: f32,
    /// 中心点距离（像素）
    pub center_distance: f32,
    /// 匹配质量评分 [0.0, 1.0]
    pub match_quality: f32,
}

/// Bounds坐标结构
#[derive(Debug, Clone, Copy)]
pub struct BoundsRect {
    pub left: i32,
    pub top: i32,
    pub right: i32,
    pub bottom: i32,
}

impl BoundsRect {
    /// 从字符串解析 bounds："[left,top][right,bottom]"
    pub fn from_string(bounds_str: &str) -> Option<Self> {
        // 移除空格和方括号
        let cleaned = bounds_str.replace(" ", "").replace("[", "").replace("]", ",");
        let parts: Vec<&str> = cleaned.split(',').filter(|s| !s.is_empty()).collect();
        
        if parts.len() != 4 {
            return None;
        }
        
        let left = parts[0].parse::<i32>().ok()?;
        let top = parts[1].parse::<i32>().ok()?;
        let right = parts[2].parse::<i32>().ok()?;
        let bottom = parts[3].parse::<i32>().ok()?;
        
        Some(BoundsRect { left, top, right, bottom })
    }
    
    /// 计算面积
    pub fn area(&self) -> i32 {
        (self.right - self.left) * (self.bottom - self.top)
    }
    
    /// 计算中心点
    pub fn center(&self) -> (f32, f32) {
        (
            (self.left + self.right) as f32 / 2.0,
            (self.top + self.bottom) as f32 / 2.0,
        )
    }
    
    /// 计算宽度
    pub fn width(&self) -> i32 {
        self.right - self.left
    }
    
    /// 计算高度
    pub fn height(&self) -> i32 {
        self.bottom - self.top
    }
    
    /// 检查是否包含另一个bounds（this包含other）
    pub fn contains(&self, other: &BoundsRect) -> bool {
        self.left <= other.left 
            && self.top <= other.top 
            && self.right >= other.right 
            && self.bottom >= other.bottom
    }
    
    /// 检查是否被包含在另一个bounds中（this被other包含）
    pub fn is_contained_in(&self, other: &BoundsRect) -> bool {
        other.contains(self)
    }
    
    /// 计算与另一个bounds的交集
    pub fn intersection(&self, other: &BoundsRect) -> Option<BoundsRect> {
        let left = self.left.max(other.left);
        let top = self.top.max(other.top);
        let right = self.right.min(other.right);
        let bottom = self.bottom.min(other.bottom);
        
        if left < right && top < bottom {
            Some(BoundsRect { left, top, right, bottom })
        } else {
            None
        }
    }
    
    /// 计算与另一个bounds的并集面积
    pub fn union_area(&self, other: &BoundsRect) -> i32 {
        let left = self.left.min(other.left);
        let top = self.top.min(other.top);
        let right = self.right.max(other.right);
        let bottom = self.bottom.max(other.bottom);
        
        (right - left) * (bottom - top)
    }
    
    /// 计算IOU (Intersection over Union)
    pub fn calculate_iou(&self, other: &BoundsRect) -> f32 {
        if let Some(inter) = self.intersection(other) {
            let inter_area = inter.area() as f32;
            let union_area = (self.area() + other.area()) as f32 - inter_area;
            
            if union_area > 0.0 {
                inter_area / union_area
            } else {
                0.0
            }
        } else {
            0.0
        }
    }
    
    /// 计算中心点距离
    pub fn center_distance(&self, other: &BoundsRect) -> f32 {
        let (cx1, cy1) = self.center();
        let (cx2, cy2) = other.center();
        
        ((cx1 - cx2).powi(2) + (cy1 - cy2).powi(2)).sqrt()
    }
}

/// Bounds匹配器
pub struct BoundsMatcher;

impl BoundsMatcher {
    /// 🔥 智能匹配用户选择的bounds与候选元素的bounds
    /// 
    /// 匹配策略（按优先级）：
    /// 1. 精确匹配（完全相同）
    /// 2. 高IOU匹配（IOU > 0.9）
    /// 3. 包含关系（用户bounds在候选bounds内）
    /// 4. 中等IOU匹配（IOU > 0.7）
    /// 5. 低IOU匹配（IOU > 0.3）+ 中心点接近
    pub fn match_bounds(user_bounds: &str, candidate_bounds: &str) -> BoundsMatchResult {
        // 解析bounds
        let user_rect = match BoundsRect::from_string(user_bounds) {
            Some(r) => r,
            None => {
                tracing::warn!("⚠️ [Bounds匹配] 无法解析用户bounds: {}", user_bounds);
                return BoundsMatchResult::no_match();
            }
        };
        
        let candidate_rect = match BoundsRect::from_string(candidate_bounds) {
            Some(r) => r,
            None => {
                tracing::warn!("⚠️ [Bounds匹配] 无法解析候选bounds: {}", candidate_bounds);
                return BoundsMatchResult::no_match();
            }
        };
        
        // 1. 检查精确匹配
        let is_exact = user_rect.left == candidate_rect.left 
            && user_rect.top == candidate_rect.top 
            && user_rect.right == candidate_rect.right 
            && user_rect.bottom == candidate_rect.bottom;
        
        if is_exact {
            return BoundsMatchResult {
                is_exact: true,
                is_contained: false,
                is_overlap: true,
                iou: 1.0,
                center_distance: 0.0,
                match_quality: 1.0,
            };
        }
        
        // 2. 计算IOU和中心距离
        let iou = user_rect.calculate_iou(&candidate_rect);
        let center_dist = user_rect.center_distance(&candidate_rect);
        
        // 3. 检查包含关系
        let is_contained = user_rect.is_contained_in(&candidate_rect);
        let contains = candidate_rect.is_contained_in(&user_rect);
        
        // 4. 检查重叠
        let is_overlap = user_rect.intersection(&candidate_rect).is_some();
        
        // 5. 计算匹配质量
        let match_quality = Self::calculate_match_quality(
            &user_rect,
            &candidate_rect,
            iou,
            center_dist,
            is_contained,
            contains,
        );
        
        BoundsMatchResult {
            is_exact: false,
            is_contained,
            is_overlap,
            iou,
            center_distance: center_dist,
            match_quality,
        }
    }
    
    /// 计算匹配质量评分 [0.0, 1.0]
    /// 
    /// 权重分配：
    /// - IOU: 50% （核心指标）
    /// - 包含关系: 30% （重要指标）
    /// - 中心距离: 20% （辅助指标）
    fn calculate_match_quality(
        user_rect: &BoundsRect,
        candidate_rect: &BoundsRect,
        iou: f32,
        center_dist: f32,
        is_contained: bool,
        contains: bool,
    ) -> f32 {
        let mut quality = 0.0;
        
        // 1. IOU贡献（0-0.5分）
        quality += iou * 0.5;
        
        // 2. 包含关系贡献（0-0.3分）
        if is_contained {
            // 用户bounds完全在候选bounds内（Android常见：点击中层，实际是外层容器）
            quality += 0.3;
        } else if contains {
            // 候选bounds完全在用户bounds内（点击外层，实际是内层元素）
            quality += 0.25;
        } else if iou > 0.5 {
            // 虽然不是包含关系，但有较大重叠
            quality += 0.15;
        }
        
        // 3. 中心距离贡献（0-0.2分）
        // 计算最大可能距离（对角线）
        let user_diag = ((user_rect.width().pow(2) + user_rect.height().pow(2)) as f32).sqrt();
        let candidate_diag = ((candidate_rect.width().pow(2) + candidate_rect.height().pow(2)) as f32).sqrt();
        let max_dist = (user_diag + candidate_diag) / 2.0;
        
        if max_dist > 0.0 {
            let dist_score = 1.0 - (center_dist / max_dist).min(1.0);
            quality += dist_score * 0.2;
        }
        
        quality.min(1.0)
    }
    
    /// 🔥 从候选列表中筛选符合bounds条件的元素
    /// 
    /// 策略：
    /// 1. 优先精确匹配
    /// 2. 次优高质量匹配（match_quality > 0.8）
    /// 3. 接受中等质量匹配（match_quality > 0.5）
    pub fn filter_candidates_by_bounds<'a>(
        candidates: &'a [UIElement],
        user_bounds: &str,
        min_quality: f32,
    ) -> Vec<(&'a UIElement, BoundsMatchResult)> {
        let mut matched = Vec::new();
        
        for candidate in candidates {
            if let Some(ref candidate_bounds) = candidate.bounds {
                let match_result = Self::match_bounds(user_bounds, candidate_bounds);
                
                if match_result.is_exact {
                    // 精确匹配，立即返回
                    tracing::info!(
                        "✅ [Bounds筛选] 精确匹配: user={}, candidate={}",
                        user_bounds,
                        candidate_bounds
                    );
                    return vec![(candidate, match_result)];
                } else if match_result.match_quality >= min_quality {
                    // 质量符合要求
                    tracing::info!(
                        "🎯 [Bounds筛选] 模糊匹配: quality={:.2}, IOU={:.2}, contained={}, user={}, candidate={}",
                        match_result.match_quality,
                        match_result.iou,
                        match_result.is_contained,
                        user_bounds,
                        candidate_bounds
                    );
                    matched.push((candidate, match_result));
                }
            }
        }
        
        // 按匹配质量降序排列
        matched.sort_by(|a, b| {
            b.1.match_quality.partial_cmp(&a.1.match_quality).unwrap()
        });
        
        matched
    }
    
    /// 🔥 在用户bounds范围内查找可点击的子元素
    /// 
    /// 用于处理"用户选择外层容器，但实际需要点击内层按钮"的场景
    pub fn find_clickable_children_in_bounds<'a>(
        all_elements: &'a [UIElement],
        user_bounds: &str,
        min_iou: f32,
    ) -> Vec<&'a UIElement> {
        let user_rect = match BoundsRect::from_string(user_bounds) {
            Some(r) => r,
            None => return Vec::new(),
        };
        
        let mut clickable_children = Vec::new();
        
        for elem in all_elements {
            // 必须可点击
            if !elem.clickable.unwrap_or(false) {
                continue;
            }
            
            // 必须在用户bounds范围内
            if let Some(ref elem_bounds) = elem.bounds {
                if let Some(elem_rect) = BoundsRect::from_string(elem_bounds) {
                    // 检查是否被用户bounds包含
                    if elem_rect.is_contained_in(&user_rect) {
                        let iou = user_rect.calculate_iou(&elem_rect);
                        if iou >= min_iou {
                            clickable_children.push(elem);
                        }
                    }
                }
            }
        }
        
        tracing::info!(
            "🎯 [子元素查找] 在bounds={}范围内找到{}个可点击子元素",
            user_bounds,
            clickable_children.len()
        );
        
        clickable_children
    }
}

impl BoundsMatchResult {
    /// 创建无匹配结果
    pub fn no_match() -> Self {
        BoundsMatchResult {
            is_exact: false,
            is_contained: false,
            is_overlap: false,
            iou: 0.0,
            center_distance: f32::INFINITY,
            match_quality: 0.0,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_exact_match() {
        let user_bounds = "[45,1059][249,1263]";
        let candidate_bounds = "[45,1059][249,1263]";
        
        let result = BoundsMatcher::match_bounds(user_bounds, candidate_bounds);
        
        assert!(result.is_exact);
        assert_eq!(result.iou, 1.0);
        assert_eq!(result.match_quality, 1.0);
    }
    
    #[test]
    fn test_contained_match() {
        // 用户选择中层 [45,1059][249,1263]
        // 实际是外层容器 [0,1043][1080,1279]
        let user_bounds = "[45,1059][249,1263]";
        let candidate_bounds = "[0,1043][1080,1279]";
        
        let result = BoundsMatcher::match_bounds(user_bounds, candidate_bounds);
        
        assert!(!result.is_exact);
        assert!(result.is_contained);  // 用户bounds在候选bounds内
        assert!(result.match_quality > 0.5);  // 应该有较高的匹配质量
    }
    
    #[test]
    fn test_high_iou_match() {
        // 轻微偏移
        let user_bounds = "[45,1059][249,1263]";
        let candidate_bounds = "[40,1055][245,1265]";
        
        let result = BoundsMatcher::match_bounds(user_bounds, candidate_bounds);
        
        assert!(!result.is_exact);
        assert!(result.iou > 0.9);  // IOU应该很高
        assert!(result.match_quality > 0.8);
    }
}
