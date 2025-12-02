use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};
use crate::commands::commands_lead_hunt::{
    lh_save_comments, lh_list_comments, lh_import_comments,
    lh_create_replay_plan, lh_run_replay_plan, lh_analyze_comments
};

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("lead_hunt")
        .invoke_handler(tauri::generate_handler![
            lh_save_comments,
            lh_list_comments,
            lh_import_comments,
            lh_create_replay_plan,
            lh_run_replay_plan,
            lh_analyze_comments
        ])
        .build()
}
