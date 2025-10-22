// src-tauri/src/types/action_types.rs
// module: types | layer: domain | role: 操作类型定义
// summary: 统一的UI操作类型系统，支持多种交互方式

use serde::{Deserialize, Serialize};

/// UI元素操作类型
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", content = "params")]
pub enum ActionType {
    /// 单击操作
    Click,
    /// 长按操作
    LongPress {
        /// 长按持续时间（毫秒）
        duration: Option<u64>,
    },
    /// 输入文本
    Input {
        /// 输入的文本内容
        text: String,
        /// 输入前是否清空现有内容
        clear_before: Option<bool>,
    },
    /// 向上滑动
    SwipeUp {
        /// 滑动距离（像素）
        distance: Option<u32>,
        /// 滑动持续时间（毫秒）
        duration: Option<u64>,
    },
    /// 向下滑动
    SwipeDown {
        /// 滑动距离（像素）
        distance: Option<u32>,
        /// 滑动持续时间（毫秒）
        duration: Option<u64>,
    },
    /// 向左滑动
    SwipeLeft {
        /// 滑动距离（像素）
        distance: Option<u32>,
        /// 滑动持续时间（毫秒）
        duration: Option<u64>,
    },
    /// 向右滑动
    SwipeRight {
        /// 滑动距离（像素）
        distance: Option<u32>,
        /// 滑动持续时间（毫秒）
        duration: Option<u64>,
    },
    /// 滚动到指定位置
    ScrollTo {
        /// 目标X坐标
        target_x: i32,
        /// 目标Y坐标
        target_y: i32,
        /// 滚动持续时间（毫秒）
        duration: Option<u64>,
    },
    /// 等待操作
    Wait {
        /// 等待时间（毫秒）
        duration: u64,
    },
}

impl Default for ActionType {
    fn default() -> Self {
        ActionType::Click
    }
}

impl ActionType {
    /// 获取操作类型的简短标识符
    pub fn type_id(&self) -> &'static str {
        match self {
            ActionType::Click => "click",
            ActionType::LongPress { .. } => "long_press",
            ActionType::Input { .. } => "input",
            ActionType::SwipeUp { .. } => "swipe_up",
            ActionType::SwipeDown { .. } => "swipe_down",
            ActionType::SwipeLeft { .. } => "swipe_left",
            ActionType::SwipeRight { .. } => "swipe_right",
            ActionType::ScrollTo { .. } => "scroll",
            ActionType::Wait { .. } => "wait",
        }
    }

    /// 获取操作类型的显示名称
    pub fn display_name(&self) -> &'static str {
        match self {
            ActionType::Click => "点击",
            ActionType::LongPress { .. } => "长按",
            ActionType::Input { .. } => "输入",
            ActionType::SwipeUp { .. } => "上滑",
            ActionType::SwipeDown { .. } => "下滑",
            ActionType::SwipeLeft { .. } => "左滑",
            ActionType::SwipeRight { .. } => "右滑",
            ActionType::ScrollTo { .. } => "滚动",
            ActionType::Wait { .. } => "等待",
        }
    }

    /// 获取操作类型的描述
    pub fn description(&self) -> String {
        match self {
            ActionType::Click => "单击元素".to_string(),
            ActionType::LongPress { duration } => {
                format!("长按元素{}秒", duration.unwrap_or(2000) as f64 / 1000.0)
            }
            ActionType::Input { text, clear_before } => {
                let clear_text = if clear_before.unwrap_or(false) { "清空后" } else { "" };
                format!("{}输入: {}", clear_text, text)
            }
            ActionType::SwipeUp { distance, .. } => {
                format!("向上滑动{}像素", distance.unwrap_or(200))
            }
            ActionType::SwipeDown { distance, .. } => {
                format!("向下滑动{}像素", distance.unwrap_or(200))
            }
            ActionType::SwipeLeft { distance, .. } => {
                format!("向左滑动{}像素", distance.unwrap_or(200))
            }
            ActionType::SwipeRight { distance, .. } => {
                format!("向右滑动{}像素", distance.unwrap_or(200))
            }
            ActionType::ScrollTo { target_x, target_y, .. } => {
                format!("滚动到位置 ({}, {})", target_x, target_y)
            }
            ActionType::Wait { duration } => {
                format!("等待{}秒", *duration as f64 / 1000.0)
            }
        }
    }

    /// 创建默认的点击操作
    pub fn click() -> Self {
        ActionType::Click
    }

    /// 创建长按操作
    pub fn long_press(duration: Option<u64>) -> Self {
        ActionType::LongPress { duration }
    }

    /// 创建输入操作
    pub fn input(text: String, clear_before: bool) -> Self {
        ActionType::Input {
            text,
            clear_before: Some(clear_before),
        }
    }

    /// 创建滑动操作
    pub fn swipe_up(distance: Option<u32>, duration: Option<u64>) -> Self {
        ActionType::SwipeUp { distance, duration }
    }

    pub fn swipe_down(distance: Option<u32>, duration: Option<u64>) -> Self {
        ActionType::SwipeDown { distance, duration }
    }

    pub fn swipe_left(distance: Option<u32>, duration: Option<u64>) -> Self {
        ActionType::SwipeLeft { distance, duration }
    }

    pub fn swipe_right(distance: Option<u32>, duration: Option<u64>) -> Self {
        ActionType::SwipeRight { distance, duration }
    }

    /// 创建滚动操作
    pub fn scroll_to(target_x: i32, target_y: i32, duration: Option<u64>) -> Self {
        ActionType::ScrollTo {
            target_x,
            target_y,
            duration,
        }
    }

    /// 创建等待操作
    pub fn wait(duration: u64) -> Self {
        ActionType::Wait { duration }
    }
}

/// 操作执行结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActionResult {
    /// 操作是否成功
    pub success: bool,
    /// 操作消息
    pub message: String,
    /// 执行耗时（毫秒）
    pub duration: u64,
    /// 额外数据
    pub data: Option<serde_json::Value>,
}

impl ActionResult {
    pub fn success(message: String, duration: u64) -> Self {
        Self {
            success: true,
            message,
            duration,
            data: None,
        }
    }

    pub fn success_with_data(message: String, duration: u64, data: serde_json::Value) -> Self {
        Self {
            success: true,
            message,
            duration,
            data: Some(data),
        }
    }

    pub fn failure(message: String, duration: u64) -> Self {
        Self {
            success: false,
            message,
            duration,
            data: None,
        }
    }
}

/// 操作执行上下文
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActionContext {
    /// 设备ID
    pub device_id: String,
    /// 目标元素的坐标信息
    pub target_bounds: Option<ElementBounds>,
    /// 执行超时时间（毫秒）
    pub timeout: Option<u64>,
    /// 是否需要截图验证
    pub verify_with_screenshot: Option<bool>,
}

/// 元素边界信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ElementBounds {
    pub left: i32,
    pub top: i32,
    pub right: i32,
    pub bottom: i32,
}

impl ElementBounds {
    pub fn new(left: i32, top: i32, right: i32, bottom: i32) -> Self {
        Self { left, top, right, bottom }
    }

    pub fn center_x(&self) -> i32 {
        (self.left + self.right) / 2
    }

    pub fn center_y(&self) -> i32 {
        (self.top + self.bottom) / 2
    }

    pub fn width(&self) -> i32 {
        self.right - self.left
    }

    pub fn height(&self) -> i32 {
        self.bottom - self.top
    }
}