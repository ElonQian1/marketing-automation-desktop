use tauri::{plugin::{Builder, TauriPlugin}, Runtime, Manager, State};
use std::sync::Mutex;
use crate::services::employee_service::{Employee, EmployeeService};

#[tauri::command]
async fn list(service: State<'_, Mutex<EmployeeService>>) -> Result<Vec<Employee>, String> {
    let service = service.lock().map_err(|e| e.to_string())?;
    service.get_all().map_err(|e| e.to_string())
}

#[tauri::command]
async fn add(employee: Employee, service: State<'_, Mutex<EmployeeService>>) -> Result<Employee, String> {
    let mut service = service.lock().map_err(|e| e.to_string())?;
    service.create(employee).map_err(|e| e.to_string())
}

#[tauri::command]
async fn update(employee: Employee, service: State<'_, Mutex<EmployeeService>>) -> Result<Employee, String> {
    let mut service = service.lock().map_err(|e| e.to_string())?;
    service.update(employee).map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete(id: i32, service: State<'_, Mutex<EmployeeService>>) -> Result<(), String> {
    let mut service = service.lock().map_err(|e| e.to_string())?;
    service.delete(id).map_err(|e| e.to_string())
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("employees")
        .invoke_handler(tauri::generate_handler![
            list,
            add,
            update,
            delete
        ])
        .build()
}
