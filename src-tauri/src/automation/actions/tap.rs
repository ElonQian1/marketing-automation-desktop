use anyhow::Result;
use tracing::{info, error};
use crate::infra::adb::input_helper::tap_injector_first;
use crate::utils::adb_utils::get_adb_path;

/// 执行点击操作
pub async fn execute_tap(
    device_id: &str,
    x: i32,
    y: i32,
) -> Result<()> {
    info!("👆 [Action] Tap: ({}, {})", x, y);
    let adb_path = get_adb_path();
    
    tap_injector_first(&adb_path, device_id, x, y, None).await
        .map_err(|e| anyhow::anyhow!("Tap failed: {}", e))
}

/// 执行双击操作
pub async fn execute_double_tap(
    device_id: &str,
    x: i32,
    y: i32,
) -> Result<()> {
    info!("👆👆 [Action] DoubleTap: ({}, {})", x, y);
    let adb_path = get_adb_path();
    
    // 第一次点击
    tap_injector_first(&adb_path, device_id, x, y, None).await
        .map_err(|e| anyhow::anyhow!("DoubleTap (1/2) failed: {}", e))?;
        
    // 间隔
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    // 第二次点击
    tap_injector_first(&adb_path, device_id, x, y, None).await
        .map_err(|e| anyhow::anyhow!("DoubleTap (2/2) failed: {}", e))
}

/// 执行长按操作
pub async fn execute_long_press(
    device_id: &str,
    x: i32,
    y: i32,
    duration_ms: u32,
) -> Result<()> {
    info!("👇 [Action] LongPress: ({}, {}), duration={}ms", x, y, duration_ms);
    let adb_path = get_adb_path();
    
    tap_injector_first(&adb_path, device_id, x, y, Some(duration_ms)).await
        .map_err(|e| anyhow::anyhow!("LongPress failed: {}", e))
}
