use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};
use crate::services::script_manager::{
    save_smart_script, load_smart_script, delete_smart_script,
    list_smart_scripts, import_smart_script, export_smart_script,
    list_script_templates, create_script_from_template
};
use crate::services::commands::{
    execute_single_step_test, execute_smart_automation_script,
    execute_smart_automation_script_multi
};

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("script_manager")
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
