#[tauri::command]
pub async fn debug_xml_cache_paths() -> Result<serde_json::Value, String> {
    use std::fs;
    use serde_json::json;
    
    let current_dir = std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from("."));
    let debug_dir = get_debug_xml_dir();
    
    // 检查多个可能的路径
    let paths_to_check = vec![
        current_dir.join("debug_xml"),
        current_dir.parent().unwrap_or(&current_dir).join("debug_xml"),
        std::path::PathBuf::from("D:\\rust\\active-projects\\小红书\\employeeGUI\\debug_xml"),
    ];
    
    let mut path_results = Vec::new();
    
    for path in &paths_to_check {
        let exists = path.exists();
        let file_count = if exists {
            fs::read_dir(&path)
                .map(|entries| entries.filter_map(|e| e.ok()).count())
                .unwrap_or(0)
        } else {
            0
        };
        
        path_results.push(json!({
            "path": path.to_string_lossy(),
            "exists": exists,
            "file_count": file_count,
            "is_current_choice": path == &debug_dir
        }));
    }
    
    Ok(json!({
        "current_working_directory": current_dir.to_string_lossy(),
        "chosen_debug_xml_dir": debug_dir.to_string_lossy(),
        "debug_xml_dir_exists": debug_dir.exists(),
        "all_paths_checked": path_results
    }))
}