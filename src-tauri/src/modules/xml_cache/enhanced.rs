use tauri::command;
use std::path::{Path, PathBuf};
use std::fs;
use serde::{Serialize, Deserialize};
use std::time::SystemTime;

const ENHANCED_CACHE_DIR: &str = "enhanced_cache";

fn get_enhanced_cache_dir() -> PathBuf {
    let mut path = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    path.push(ENHANCED_CACHE_DIR);
    if !path.exists() {
        let _ = fs::create_dir_all(&path);
    }
    path
}

#[derive(Serialize, Deserialize)]
pub struct EnhancedCacheMetadata {
    pub timestamp: u64,
    pub size: u64,
    pub version: String,
    // Add other fields if needed
}

#[command]
pub fn enhanced_cache_file_exists(file_name: String) -> bool {
    let dir = get_enhanced_cache_dir();
    dir.join(file_name).exists()
}

#[derive(Serialize)]
pub struct EnhancedCacheStats {
    pub file_count: usize,
    pub total_size: u64,
}

#[command]
pub fn get_enhanced_cache_stats() -> EnhancedCacheStats {
    let dir = get_enhanced_cache_dir();
    let mut file_count = 0;
    let mut total_size = 0;

    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            if let Ok(meta) = entry.metadata() {
                if meta.is_file() {
                    file_count += 1;
                    total_size += meta.len();
                }
            }
        }
    }

    EnhancedCacheStats {
        file_count,
        total_size,
    }
}

#[command]
pub fn cleanup_enhanced_cache(max_age: u64) -> usize {
    let dir = get_enhanced_cache_dir();
    let mut deleted_count = 0;
    let now = SystemTime::now();

    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            if let Ok(meta) = entry.metadata() {
                if let Ok(modified) = meta.modified() {
                    if let Ok(age) = now.duration_since(modified) {
                        if age.as_secs() > max_age {
                            if fs::remove_file(entry.path()).is_ok() {
                                deleted_count += 1;
                            }
                        }
                    }
                }
            }
        }
    }
    deleted_count
}

#[command]
pub fn clear_all_enhanced_cache() {
    let dir = get_enhanced_cache_dir();
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let _ = fs::remove_file(entry.path());
        }
    }
}

#[command]
pub fn read_enhanced_cache_file(file_name: String) -> Result<String, String> {
    let dir = get_enhanced_cache_dir();
    let path = dir.join(file_name);
    fs::read_to_string(path).map_err(|e| e.to_string())
}

#[command]
pub fn save_enhanced_cache_file(file_name: String, content: String, _metadata: Option<serde_json::Value>) -> Result<(), String> {
    let dir = get_enhanced_cache_dir();
    let path = dir.join(file_name);
    // We are ignoring metadata storage for now as it's usually just file stats or embedded in content
    // If metadata needs to be stored separately, we'd need a sidecar file or header.
    // For now, just save the content.
    fs::write(path, content).map_err(|e| e.to_string())
}

#[command]
pub fn get_enhanced_cache_metadata(file_name: String) -> Result<EnhancedCacheMetadata, String> {
    let dir = get_enhanced_cache_dir();
    let path = dir.join(file_name);
    let meta = fs::metadata(&path).map_err(|e| e.to_string())?;
    
    Ok(EnhancedCacheMetadata {
        timestamp: meta.modified().unwrap_or(SystemTime::now()).duration_since(SystemTime::UNIX_EPOCH).unwrap().as_secs(),
        size: meta.len(),
        version: "1.0".to_string(),
    })
}

#[command]
pub fn clear_enhanced_cache_directory() {
    clear_all_enhanced_cache();
}

#[command]
pub fn delete_enhanced_cache_file(file_name: String) -> Result<(), String> {
    let dir = get_enhanced_cache_dir();
    let path = dir.join(file_name);
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())
    } else {
        Ok(())
    }
}
