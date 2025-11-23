use anyhow::Result;
use tracing::{info, error};
use crate::infra::adb::input_helper::input_text_injector_first;
use crate::infra::adb::keyevent_helper::keyevent_code_injector_first;
use crate::utils::adb_utils::get_adb_path;

/// 执行文本输入
pub async fn execute_input(
    device_id: &str,
    text: &str,
) -> Result<()> {
    info!("⌨️ [Action] Input: '{}'", text);
    let adb_path = get_adb_path();
    
    input_text_injector_first(&adb_path, device_id, text).await
        .map_err(|e| anyhow::anyhow!("Input failed: {}", e))
}

/// 执行按键事件
pub async fn execute_keyevent(
    device_id: &str,
    keycode: i32,
) -> Result<()> {
    info!("🔘 [Action] Keyevent: {}", keycode);
    let adb_path = get_adb_path();
    
    keyevent_code_injector_first(&adb_path, device_id, keycode).await
        .map_err(|e| anyhow::anyhow!("Keyevent failed: {}", e))
}
