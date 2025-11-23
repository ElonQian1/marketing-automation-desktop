use anyhow::Result;
use tracing::{info, error};
use crate::infra::adb::input_helper::swipe_injector_first;
use crate::utils::adb_utils::get_adb_path;

/// 执行滑动操作
pub async fn execute_swipe(
    device_id: &str,
    start_x: i32,
    start_y: i32,
    end_x: i32,
    end_y: i32,
    duration_ms: u32,
) -> Result<()> {
    info!("👋 [Action] Swipe: ({}, {}) -> ({}, {}), duration={}ms", 
        start_x, start_y, end_x, end_y, duration_ms);
        
    let adb_path = get_adb_path();
    
    swipe_injector_first(
        &adb_path, 
        device_id, 
        start_x, 
        start_y, 
        end_x, 
        end_y, 
        duration_ms
    ).await
    .map_err(|e| anyhow::anyhow!("Swipe failed: {}", e))
}
