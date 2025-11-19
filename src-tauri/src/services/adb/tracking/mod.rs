// ADB 追踪层 - 实时设备监控
//
// 职责：使用 track-devices 协议实时追踪设备变化

pub mod adb_device_tracker;

// 重新导出公共接口
pub use adb_device_tracker::{
    DeviceChangeEvent,
    DeviceEventType,
    TrackedDevice,
    AdbDeviceTracker,
    initialize_device_tracker,
    start_device_tracking,
    stop_device_tracking,
    get_tracked_devices,
};
