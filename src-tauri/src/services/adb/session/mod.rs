// ADB 会话层 - 长连接管理和会话复用
//
// 职责：维护持久化 Shell 连接，提供高性能会话管理

pub mod adb_shell_session;   // Shell长连接会话
pub mod adb_session_manager; // 会话管理器（多设备映射）

// 重新导出公共接口
pub use adb_shell_session::AdbShellSession;
pub use adb_session_manager::get_device_session;
