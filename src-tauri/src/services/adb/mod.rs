// ADB 模块 - 统一 ADB 相关功能
//
// 模块分层：
// - basic/      基础层（设备管理、命令执行）
// - session/    会话层（长连接复用、性能优化）
// - tracking/   追踪层（实时设备监控）
// - commands/   命令层（Tauri 命令封装）

pub mod basic;
pub mod session;
pub mod tracking;
pub mod commands;

// 重新导出常用接口，保持向后兼容
pub use basic::AdbService;
pub use basic::initialize_adb_system;
pub use session::{AdbShellSession, get_device_session};
pub use tracking::{
    start_device_tracking, stop_device_tracking, get_tracked_devices
};
