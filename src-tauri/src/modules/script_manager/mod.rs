use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime, Manager,
};
use crate::services::script_manager::*;
use crate::services::commands::*;
use crate::services::script_manager::ScriptManagerState;

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("script_manager")
        .setup(|app, _api| {
            app.manage(ScriptManagerState::new());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            save_smart_script,
            load_smart_script,
            delete_smart_script,
            list_smart_scripts,
            import_smart_script,
            export_smart_script,
            list_script_templates,
            create_script_from_template,
            execute_single_step_test,
            execute_smart_automation_script,
            execute_smart_automation_script_multi
        ])
        .build()
}
