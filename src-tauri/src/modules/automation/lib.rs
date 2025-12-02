use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};
use crate::services::duplication_guard::{
    check_duplication_action_cmd, record_duplication_action_cmd,
    DuplicationCheckRequest, DuplicationCheckResult, ActionRecord
};

#[tauri::command]
fn check_duplication(req: DuplicationCheckRequest) -> DuplicationCheckResult {
    check_duplication_action_cmd(req)
}

#[tauri::command]
fn record_action(record: ActionRecord) {
    record_duplication_action_cmd(record)
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("automation")
        .invoke_handler(tauri::generate_handler![
            check_duplication,
            record_action
        ])
        .build()
}
