// src-tauri/src/device/mod.rs
// module: device | layer: domain | role: 设备模块总入口
// summary: 导出设备提供者、Mock实现、回放编排器

pub mod provider;
pub mod mock;
pub mod orchestrator;

pub use provider::{DeviceAction, DumpProvider, ScreenDump, WaitCondition};
pub use mock::MockDumpProvider;
pub use orchestrator::{ExecutionStep, ExecutionStatusEvent, ReplayOrchestrator};
