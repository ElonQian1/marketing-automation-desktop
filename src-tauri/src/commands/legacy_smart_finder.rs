use tauri::command;
use crate::services::universal_ui_service::UniversalUIService;
use crate::types::smart_finder::{NavigationBarConfig, DetectedElement, ElementFinderResult, ClickResult};

#[command]
pub async fn smart_element_finder(
    device_id: String,
    config: NavigationBarConfig,
    _adb_service: tauri::State<'_, std::sync::Mutex<crate::services::adb::AdbService>>, // 保留参数签名兼容，但不使用
) -> Result<ElementFinderResult, String> {
    let service = UniversalUIService::new();
    service.smart_element_finder_compatible(&device_id, config).await
}

#[command]
pub async fn click_detected_element(
    device_id: String,
    element: DetectedElement,
    click_type: String,
    _adb_service: tauri::State<'_, std::sync::Mutex<crate::services::adb::AdbService>>,
) -> Result<ClickResult, String> {
    let service = UniversalUIService::new();
    service.click_detected_element_compatible(&device_id, element, &click_type).await
}
