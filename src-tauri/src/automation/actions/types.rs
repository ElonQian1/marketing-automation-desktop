use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "params")]
pub enum DeviceAction {
    Tap { x: i32, y: i32 },
    DoubleTap { x: i32, y: i32 },
    LongPress { x: i32, y: i32, duration_ms: u32 },
    Swipe { start_x: i32, start_y: i32, end_x: i32, end_y: i32, duration_ms: u32 },
    Input { text: String },
    Keyevent { keycode: i32 },
    Wait { duration_ms: u64 },
}
