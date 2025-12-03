use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};
use crate::commands::enhanced_location_commands::*;
use crate::commands::strategy_matching::{match_element_by_criteria as match_element_impl, MatchCriteriaDTO, MatchResult};
use serde_json::Value;

#[tauri::command]
async fn match_element_by_criteria(device_id: String, criteria: MatchCriteriaDTO) -> Result<MatchResult, String> {
    match_element_impl(device_id, criteria).await
}

#[tauri::command]
async fn save_smart_selection_config(_step_id: String, _selection_mode: String, _batch_config: Value) -> Result<(), String> {
    Ok(())
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("enhanced_location")
        .invoke_handler(tauri::generate_handler![
            match_element_enhanced,
            generate_xpath_candidates,
            generate_best_xpath,
            validate_xpath,
            update_xpath_strategy_success_rate,
            match_element_by_criteria,
            save_smart_selection_config
        ])
        .build()
}
