use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};
use crate::commands::enhanced_location_commands::*;
use crate::commands::strategy_matching::match_element_by_criteria;

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("enhanced_location")
        .invoke_handler(tauri::generate_handler![
            match_element_enhanced,
            generate_xpath_candidates,
            generate_best_xpath,
            validate_xpath,
            update_xpath_strategy_success_rate,
            match_element_by_criteria
        ])
        .build()
}
