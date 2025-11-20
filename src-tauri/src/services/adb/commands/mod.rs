// ADB 命令层 - Tauri 命令封装
//
// 职责：封装 ADB 相关的 Tauri 命令，供前端调用

pub mod adb_activity;
pub mod adb_shell;
pub mod adb_file;
pub mod ui_automation;

// 重新导出公共接口
pub use adb_activity::{
    AdbActivityResult,
    StartActivityRequest,
    adb_start_activity,
};
pub use adb_shell::safe_adb_shell_command;
pub use adb_file::safe_adb_push;
pub use ui_automation::{adb_dump_ui_xml, adb_tap_coordinate};
