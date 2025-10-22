// src-tauri/src/services/action_recommender.rs
// module: services | layer: services | role: 操作推荐引擎
// summary: 基于UI元素特征智能推荐操作类型

use crate::types::action_types::ActionType;
use serde::{Deserialize, Serialize};

/// 元素特征信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ElementFeatures {
    pub class_name: Option<String>,
    pub resource_id: Option<String>,
    pub text: Option<String>,
    pub content_desc: Option<String>,
    pub clickable: bool,
    pub focusable: bool,
    pub scrollable: bool,
    pub checkable: bool,
    pub long_clickable: bool,
    pub bounds: Option<(i32, i32, i32, i32)>, // (left, top, right, bottom)
}

/// 推荐结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActionRecommendation {
    /// 推荐的操作类型
    pub action: ActionType,
    /// 推荐置信度 (0.0 - 1.0)
    pub confidence: f32,
    /// 推荐理由
    pub reason: String,
    /// 备选操作列表
    pub alternatives: Vec<(ActionType, f32, String)>,
}

/// 操作推荐引擎
pub struct ActionRecommender {
    /// 输入框类名模式
    input_patterns: Vec<String>,
    /// 按钮类名模式
    button_patterns: Vec<String>,
    /// 滚动容器类名模式
    scroll_patterns: Vec<String>,
    /// 滑动容器类名模式
    swipe_patterns: Vec<String>,
}

impl Default for ActionRecommender {
    fn default() -> Self {
        Self {
            input_patterns: vec![
                "EditText".to_string(),
                "Input".to_string(),
                "TextField".to_string(),
                "TextInputLayout".to_string(),
                "SearchView".to_string(),
            ],
            button_patterns: vec![
                "Button".to_string(),
                "ImageButton".to_string(),
                "FloatingActionButton".to_string(),
                "ToggleButton".to_string(),
                "Switch".to_string(),
                "CheckBox".to_string(),
                "RadioButton".to_string(),
            ],
            scroll_patterns: vec![
                "ScrollView".to_string(),
                "NestedScrollView".to_string(),
                "HorizontalScrollView".to_string(),
            ],
            swipe_patterns: vec![
                "ViewPager".to_string(),
                "ViewPager2".to_string(),
                "RecyclerView".to_string(),
                "ListView".to_string(),
                "CardView".to_string(),
            ],
        }
    }
}

impl ActionRecommender {
    pub fn new() -> Self {
        Self::default()
    }

    /// 推荐操作类型
    pub fn recommend_action(&self, features: &ElementFeatures) -> ActionRecommendation {
        let mut candidates = Vec::new();

        // 分析输入框特征
        if self.is_input_element(features) {
            candidates.push((
                ActionType::input("".to_string(), false),
                0.9,
                "检测到输入框元素".to_string(),
            ));
            candidates.push((
                ActionType::click(),
                0.7,
                "可点击获取焦点".to_string(),
            ));
        }
        // 分析按钮特征
        else if self.is_button_element(features) {
            candidates.push((
                ActionType::click(),
                0.95,
                "检测到按钮元素".to_string(),
            ));
            if features.long_clickable {
                candidates.push((
                    ActionType::long_press(None),
                    0.6,
                    "支持长按操作".to_string(),
                ));
            }
        }
        // 分析滚动容器特征
        else if self.is_scroll_element(features) {
            candidates.push((
                ActionType::swipe_up(None, None),
                0.8,
                "检测到滚动容器，可上下滑动".to_string(),
            ));
            candidates.push((
                ActionType::swipe_down(None, None),
                0.8,
                "检测到滚动容器，可上下滑动".to_string(),
            ));
            candidates.push((
                ActionType::scroll_to(0, 0, None),
                0.7,
                "支持滚动到指定位置".to_string(),
            ));
        }
        // 分析滑动容器特征
        else if self.is_swipe_element(features) {
            // ViewPager 通常是左右滑动
            if self.contains_pattern(&features.class_name, &["ViewPager"]) {
                candidates.push((
                    ActionType::swipe_left(None, None),
                    0.85,
                    "检测到页面容器，可左右滑动".to_string(),
                ));
                candidates.push((
                    ActionType::swipe_right(None, None),
                    0.85,
                    "检测到页面容器，可左右滑动".to_string(),
                ));
            }
            // RecyclerView/ListView 通常是上下滑动
            else {
                candidates.push((
                    ActionType::swipe_up(None, None),
                    0.8,
                    "检测到列表容器，可上下滑动".to_string(),
                ));
                candidates.push((
                    ActionType::swipe_down(None, None),
                    0.8,
                    "检测到列表容器，可上下滑动".to_string(),
                ));
            }
            
            // 如果可点击，添加点击选项
            if features.clickable {
                candidates.push((
                    ActionType::click(),
                    0.7,
                    "元素可点击".to_string(),
                ));
            }
        }
        // 通用可点击元素
        else if features.clickable {
            candidates.push((
                ActionType::click(),
                0.8,
                "元素可点击".to_string(),
            ));
            if features.long_clickable {
                candidates.push((
                    ActionType::long_press(None),
                    0.6,
                    "支持长按操作".to_string(),
                ));
            }
        }
        // 默认情况
        else {
            candidates.push((
                ActionType::click(),
                0.5,
                "默认点击操作".to_string(),
            ));
        }

        // 基于文本内容进一步优化推荐
        self.enhance_recommendations_by_text(&mut candidates, features);

        // 排序并选择最佳推荐
        candidates.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());

        if candidates.is_empty() {
            return ActionRecommendation {
                action: ActionType::click(),
                confidence: 0.5,
                reason: "默认点击操作".to_string(),
                alternatives: vec![],
            };
        }

        let primary = candidates.remove(0);
        ActionRecommendation {
            action: primary.0,
            confidence: primary.1,
            reason: primary.2,
            alternatives: candidates,
        }
    }

    /// 检查是否为输入框元素
    fn is_input_element(&self, features: &ElementFeatures) -> bool {
        self.contains_pattern_vec(&features.class_name, &self.input_patterns)
            || self.contains_pattern(&features.resource_id, &["edit", "input", "search"])
            || features.focusable && self.text_indicates_input(&features.text)
    }

    /// 检查是否为按钮元素
    fn is_button_element(&self, features: &ElementFeatures) -> bool {
        self.contains_pattern_vec(&features.class_name, &self.button_patterns)
            || self.contains_pattern(&features.resource_id, &["btn", "button"])
            || self.text_indicates_button(&features.text)
    }

    /// 检查是否为滚动容器
    fn is_scroll_element(&self, features: &ElementFeatures) -> bool {
        features.scrollable 
            || self.contains_pattern_vec(&features.class_name, &self.scroll_patterns)
    }

    /// 检查是否为滑动容器
    fn is_swipe_element(&self, features: &ElementFeatures) -> bool {
        self.contains_pattern_vec(&features.class_name, &self.swipe_patterns)
            || (features.scrollable && !self.is_scroll_element(features))
    }

    /// 检查字符串是否包含指定模式
    fn contains_pattern(&self, text: &Option<String>, patterns: &[&str]) -> bool {
        if let Some(text) = text {
            patterns.iter().any(|pattern| text.contains(pattern))
        } else {
            false
        }
    }

    /// 检查字符串是否包含指定模式（Vec<String>版本）
    fn contains_pattern_vec(&self, text: &Option<String>, patterns: &[String]) -> bool {
        if let Some(text) = text {
            patterns.iter().any(|pattern| text.contains(pattern))
        } else {
            false
        }
    }

    /// 检查文本是否暗示输入操作
    fn text_indicates_input(&self, text: &Option<String>) -> bool {
        if let Some(text) = text {
            let input_keywords = ["请输入", "输入", "搜索", "查找", "username", "password", "email"];
            input_keywords.iter().any(|keyword| text.contains(keyword))
        } else {
            false
        }
    }

    /// 检查文本是否暗示按钮操作
    fn text_indicates_button(&self, text: &Option<String>) -> bool {
        if let Some(text) = text {
            let button_keywords = ["确定", "取消", "提交", "登录", "注册", "发送", "保存", "删除"];
            button_keywords.iter().any(|keyword| text.contains(keyword))
        } else {
            false
        }
    }

    /// 基于文本内容增强推荐
    fn enhance_recommendations_by_text(
        &self,
        candidates: &mut Vec<(ActionType, f32, String)>,
        features: &ElementFeatures,
    ) {
        if let Some(text) = &features.text {
            let text_lower = text.to_lowercase();

            // 滑动相关的文本提示
            if text_lower.contains("滑动") || text_lower.contains("swipe") {
                candidates.push((
                    ActionType::swipe_left(None, None),
                    0.75,
                    "文本提示滑动操作".to_string(),
                ));
            }

            // 长按相关的文本提示
            if text_lower.contains("长按") || text_lower.contains("hold") {
                candidates.push((
                    ActionType::long_press(None),
                    0.8,
                    "文本提示长按操作".to_string(),
                ));
            }

            // 输入相关的文本提示
            if text_lower.contains("请输入") || text_lower.contains("enter") {
                candidates.push((
                    ActionType::input("".to_string(), false),
                    0.85,
                    "文本提示输入操作".to_string(),
                ));
            }
        }
    }

    /// 从XML元素解析特征
    pub fn extract_features_from_xml(xml_element: &str) -> ElementFeatures {
        // 简单的属性提取（可以用更复杂的XML解析器）
        ElementFeatures {
            class_name: Self::extract_attribute(xml_element, "class"),
            resource_id: Self::extract_attribute(xml_element, "resource-id"),
            text: Self::extract_attribute(xml_element, "text"),
            content_desc: Self::extract_attribute(xml_element, "content-desc"),
            clickable: Self::extract_bool_attribute(xml_element, "clickable"),
            focusable: Self::extract_bool_attribute(xml_element, "focusable"),
            scrollable: Self::extract_bool_attribute(xml_element, "scrollable"),
            checkable: Self::extract_bool_attribute(xml_element, "checkable"),
            long_clickable: Self::extract_bool_attribute(xml_element, "long-clickable"),
            bounds: Self::extract_bounds(xml_element),
        }
    }

    /// 提取XML属性值
    fn extract_attribute(xml: &str, attr_name: &str) -> Option<String> {
        let pattern = format!("{}=\"", attr_name);
        if let Some(start) = xml.find(&pattern) {
            let start = start + pattern.len();
            if let Some(end) = xml[start..].find('"') {
                let value = &xml[start..start + end];
                if !value.is_empty() {
                    return Some(value.to_string());
                }
            }
        }
        None
    }

    /// 提取布尔属性值
    fn extract_bool_attribute(xml: &str, attr_name: &str) -> bool {
        Self::extract_attribute(xml, attr_name)
            .map(|v| v == "true")
            .unwrap_or(false)
    }

    /// 提取边界信息
    fn extract_bounds(xml: &str) -> Option<(i32, i32, i32, i32)> {
        if let Some(bounds_str) = Self::extract_attribute(xml, "bounds") {
            // 解析 "[left,top][right,bottom]" 格式
            let bounds_str = bounds_str.trim_matches(['[', ']']);
            let parts: Vec<&str> = bounds_str.split("][").collect();
            if parts.len() == 2 {
                let left_top: Vec<&str> = parts[0].split(',').collect();
                let right_bottom: Vec<&str> = parts[1].split(',').collect();
                
                if left_top.len() == 2 && right_bottom.len() == 2 {
                    if let (Ok(left), Ok(top), Ok(right), Ok(bottom)) = (
                        left_top[0].parse::<i32>(),
                        left_top[1].parse::<i32>(),
                        right_bottom[0].parse::<i32>(),
                        right_bottom[1].parse::<i32>(),
                    ) {
                        return Some((left, top, right, bottom));
                    }
                }
            }
        }
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_input_element_detection() {
        let recommender = ActionRecommender::new();
        
        let features = ElementFeatures {
            class_name: Some("android.widget.EditText".to_string()),
            resource_id: Some("com.example.app:id/username_edit".to_string()),
            text: Some("请输入用户名".to_string()),
            content_desc: None,
            clickable: true,
            focusable: true,
            scrollable: false,
            checkable: false,
            long_clickable: false,
            bounds: Some((100, 200, 400, 250)),
        };

        let recommendation = recommender.recommend_action(&features);
        assert_eq!(recommendation.action.type_id(), "input");
        assert!(recommendation.confidence > 0.8);
    }

    #[test]
    fn test_button_element_detection() {
        let recommender = ActionRecommender::new();
        
        let features = ElementFeatures {
            class_name: Some("android.widget.Button".to_string()),
            resource_id: Some("com.example.app:id/submit_btn".to_string()),
            text: Some("提交".to_string()),
            content_desc: None,
            clickable: true,
            focusable: true,
            scrollable: false,
            checkable: false,
            long_clickable: false,
            bounds: Some((100, 300, 200, 350)),
        };

        let recommendation = recommender.recommend_action(&features);
        assert_eq!(recommendation.action.type_id(), "click");
        assert!(recommendation.confidence > 0.9);
    }
}