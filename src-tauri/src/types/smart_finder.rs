use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NavigationBarConfig {
    pub position_type: String, // "bottom", "top", "side", "floating"
    pub position_ratio: Option<PositionRatio>,
    pub button_count: Option<i32>,
    pub button_patterns: Vec<String>,
    pub target_button: String,
    pub click_action: String, // "single_tap", "double_tap", "long_press"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PositionRatio {
    pub x_start: f64,
    pub x_end: f64,
    pub y_start: f64,
    pub y_end: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectedElement {
    pub text: String,
    pub bounds: String,
    pub content_desc: String,
    pub clickable: bool,
    pub position: (i32, i32), // center position
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ElementFinderResult {
    pub success: bool,
    pub message: String,
    pub found_elements: Option<Vec<DetectedElement>>,
    pub target_element: Option<DetectedElement>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClickResult {
    pub success: bool,
    pub message: String,
}
