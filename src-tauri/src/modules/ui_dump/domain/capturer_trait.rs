// src-tauri/src/modules/ui_dump/domain/capturer_trait.rs
// module: ui_dump | layer: domain | role: trait
// summary: 定义屏幕采集器的统一接口

use anyhow::Result;
use async_trait::async_trait;
use crate::modules::ui_dump::ui_dump_types::DumpResult;

/// 屏幕采集器接口
/// 所有具体的采集策略（ADB文件、ADB流、Android服务）都必须实现此接口
#[async_trait]
pub trait ScreenCapturer: Send + Sync {
    /// 执行屏幕采集
    /// 
    /// # Arguments
    /// * `device_id` - 目标设备 ID
    /// 
    /// # Returns
    /// * `Result<DumpResult>` - 采集结果（包含 XML 内容或错误）
    async fn capture(&self, device_id: &str) -> Result<DumpResult>;
    
    /// 获取策略名称（用于日志和调试）
    fn name(&self) -> &'static str;
}
