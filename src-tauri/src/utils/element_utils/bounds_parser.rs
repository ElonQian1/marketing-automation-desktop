// src-tauri/src/utils/element_utils/bounds_parser.rs
// module: utils | layer: utilities | role: 元素边界坐标解析器
// summary: 提供robust的坐标解析逻辑，支持两种Android UI格式

/// 简化的边界坐标结构
#[derive(Debug, Clone)]
pub struct ElementBounds {
    pub left: i32,
    pub top: i32,
    pub right: i32,
    pub bottom: i32,
}

impl ElementBounds {
    /// 从字符串解析边界坐标
    /// 
    /// 支持两种格式：
    /// 1. "[left,top][right,bottom]" - Android标准格式，例如 "[0,0][1080,2400]"
    /// 2. "[left,top,right,bottom]" - 备用格式
    /// 
    /// # Examples
    /// ```
    /// let bounds = ElementBounds::from_bounds_string("[100,200][300,400]");
    /// assert!(bounds.is_some());
    /// 
    /// let bounds = ElementBounds::from_bounds_string("[100,200,300,400]");
    /// assert!(bounds.is_some());
    /// ```
    pub fn from_bounds_string(bounds_str: &str) -> Option<Self> {
        if let Some(coords) = Self::parse_coordinates(bounds_str) {
            Some(Self {
                left: coords[0],
                top: coords[1],
                right: coords[2],
                bottom: coords[3],
            })
        } else {
            None
        }
    }

    /// 解析坐标字符串，返回 [left, top, right, bottom]
    fn parse_coordinates(bounds_str: &str) -> Option<[i32; 4]> {
        // 格式1: "[left,top][right,bottom]" 例如 "[0,0][1080,2400]"
        if bounds_str.contains("][") {
            let parts: Vec<&str> = bounds_str.split("][").collect();
            if parts.len() == 2 {
                let left_part = parts[0].trim_start_matches('[');
                let right_part = parts[1].trim_end_matches(']');

                let left_coords: Vec<&str> = left_part.split(',').collect();
                let right_coords: Vec<&str> = right_part.split(',').collect();

                if left_coords.len() == 2 && right_coords.len() == 2 {
                    if let (Ok(left), Ok(top), Ok(right), Ok(bottom)) = (
                        left_coords[0].parse::<i32>(),
                        left_coords[1].parse::<i32>(),
                        right_coords[0].parse::<i32>(),
                        right_coords[1].parse::<i32>(),
                    ) {
                        return Some([left, top, right, bottom]);
                    }
                }
            }
        } else {
            // 格式2: "[left,top,right,bottom]" 备用格式
            let clean = bounds_str.replace("[", "").replace("]", "");
            let parts: Vec<&str> = clean.split(',').collect();

            if parts.len() >= 4 {
                if let (Ok(left), Ok(top), Ok(right), Ok(bottom)) = (
                    parts[0].parse::<i32>(),
                    parts[1].parse::<i32>(),
                    parts[2].parse::<i32>(),
                    parts[3].parse::<i32>(),
                ) {
                    return Some([left, top, right, bottom]);
                }
            }
        }

        None
    }

    /// 计算元素中心点坐标
    pub fn center(&self) -> (i32, i32) {
        ((self.left + self.right) / 2, (self.top + self.bottom) / 2)
    }

    /// 计算元素面积
    pub fn area(&self) -> i32 {
        (self.right - self.left).abs() * (self.bottom - self.top).abs()
    }

    /// 计算元素宽度
    pub fn width(&self) -> i32 {
        (self.right - self.left).abs()
    }

    /// 计算元素高度
    pub fn height(&self) -> i32 {
        (self.bottom - self.top).abs()
    }

    /// 检查是否为有效边界（非负面积）
    pub fn is_valid(&self) -> bool {
        self.width() > 0 && self.height() > 0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_standard_format() {
        let bounds = ElementBounds::from_bounds_string("[100,200][300,400]");
        assert!(bounds.is_some());
        let b = bounds.unwrap();
        assert_eq!(b.left, 100);
        assert_eq!(b.top, 200);
        assert_eq!(b.right, 300);
        assert_eq!(b.bottom, 400);
    }

    #[test]
    fn test_parse_alternative_format() {
        let bounds = ElementBounds::from_bounds_string("[100,200,300,400]");
        assert!(bounds.is_some());
        let b = bounds.unwrap();
        assert_eq!(b.left, 100);
        assert_eq!(b.top, 200);
        assert_eq!(b.right, 300);
        assert_eq!(b.bottom, 400);
    }

    #[test]
    fn test_center_calculation() {
        let bounds = ElementBounds::from_bounds_string("[100,200][300,400]").unwrap();
        assert_eq!(bounds.center(), (200, 300));
    }

    #[test]
    fn test_area_calculation() {
        let bounds = ElementBounds::from_bounds_string("[100,200][300,400]").unwrap();
        assert_eq!(bounds.area(), 40000); // 200 * 200
    }

    #[test]
    fn test_invalid_bounds() {
        let bounds = ElementBounds::from_bounds_string("[100,200][50,400]");
        assert!(bounds.is_some());
        let b = bounds.unwrap();
        assert!(!b.is_valid()); // 负宽度
    }
}
