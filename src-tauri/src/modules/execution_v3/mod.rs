use tauri::{plugin::{Builder, TauriPlugin}, Wry};
use crate::commands::automation_commands::{
    execute_single_step_test_v3,
    execute_chain_test_v3,
    execute_static_strategy_test_v3,
    execute_task_v3
};

pub fn init() -> TauriPlugin<Wry> {
    Builder::new("execution_v3")
        .invoke_handler(tauri::generate_handler![
            execute_single_step_test_v3,
            execute_chain_test_v3,
            execute_static_strategy_test_v3,
            execute_task_v3
        ])
        .build()
}
