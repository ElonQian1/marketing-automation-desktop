// ADB 基础层 - 设备管理和命令执行
//
// 职责：提供底层 ADB 命令封装和设备管理能力

mod adb_commands;       // 基础命令执行
mod adb_core;           // 核心结构和数据类型
mod adb_detection;      // 检测功能
mod adb_devices;        // 设备管理
mod adb_file_operations;// 文件操作
mod adb_initialization; // ADB核心初始化
mod adb_ui_automation;  // UI自动化操作

// 重新导出公共接口
pub use adb_core::AdbService;
pub use adb_initialization::initialize_adb_system;

// 导出常用的结果类型
pub type AdbResult<T> = Result<T, Box<dyn std::error::Error>>;

// 提供便捷的创建函数
pub fn create_adb_service() -> AdbService {
    AdbService::new()
}
