// src-tauri/src/modules/file_manager/mod.rs
// module: file_manager | layer: api | role: File System Plugin
// summary: 文件系统插件，提供文件读写、删除、打开等功能

use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};
use std::path::Path;
use base64::Engine as _;

/// 读取文本文件内容
#[tauri::command]
async fn read_text(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| format!("读取文件失败: {}", e))
}

/// 写入文本文件内容
#[tauri::command]
async fn write_text(path: String, content: String) -> Result<String, String> {
    match std::fs::write(&path, content) {
        Ok(_) => Ok(path),
        Err(e) => Err(format!("写入文件失败: {}", e)),
    }
}

/// 删除文件
#[tauri::command]
async fn delete(path: String) -> Result<(), String> {
    match std::fs::remove_file(&path) {
        Ok(_) => Ok(()),
        Err(e) => {
            if e.kind() == std::io::ErrorKind::NotFound {
                Ok(())
            } else {
                Err(format!("删除文件失败: {}", e))
            }
        }
    }
}

/// 读取文件并转换为 Data URL
#[tauri::command]
async fn read_as_data_url(path: String) -> Result<String, String> {
    #[cfg(debug_assertions)]
    tracing::debug!("🖼️ [Plugin:file] 读取图片文件: {}", path);
    
    let bytes = std::fs::read(&path).map_err(|e| {
        tracing::error!("❌ [Plugin:file] 读取文件失败: {} - {}", path, e);
        format!("读取文件失败: {}", e)
    })?;

    // 简单基于扩展名推断 MIME 类型
    let mime = Path::new(&path)
        .extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| ext.to_ascii_lowercase())
        .map(|ext| match ext.as_str() {
            "png" => "image/png",
            "jpg" | "jpeg" => "image/jpeg",
            "gif" => "image/gif",
            "webp" => "image/webp",
            "bmp" => "image/bmp",
            _ => "application/octet-stream",
        })
        .unwrap_or("application/octet-stream");

    // Base64 编码
    let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
    let data_url = format!("data:{};base64,{}", mime, b64);
    
    Ok(data_url)
}

/// 在文件管理器中显示
#[tauri::command]
async fn reveal(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        let p = Path::new(&path);
        if p.exists() {
            Command::new("explorer")
                .args(["/select,", &path])
                .spawn()
                .map_err(|e| e.to_string())?;
        } else if let Some(parent) = p.parent() {
            Command::new("explorer")
                .arg(parent.to_string_lossy().to_string())
                .spawn()
                .map_err(|e| e.to_string())?;
        } else {
            let _ = Command::new("explorer").spawn();
        }
        Ok(())
    }

    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        let p = Path::new(&path);
        if p.exists() {
            Command::new("open")
                .args(["-R", &path])
                .spawn()
                .map_err(|e| e.to_string())?;
        } else if let Some(parent) = p.parent() {
            Command::new("open")
                .arg(parent.to_string_lossy().to_string())
                .spawn()
                .map_err(|e| e.to_string())?;
        } else {
            let _ = Command::new("open").spawn();
        }
        Ok(())
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    {
        use std::process::Command;
        let p = Path::new(&path);
        if p.exists() {
            Command::new("xdg-open")
                .arg(p.to_string_lossy().to_string())
                .spawn()
                .map_err(|e| e.to_string())?;
        } else if let Some(parent) = p.parent() {
            Command::new("xdg-open")
                .arg(parent.to_string_lossy().to_string())
                .spawn()
                .map_err(|e| e.to_string())?;
        } else {
            let _ = Command::new("xdg-open").spawn();
        }
        Ok(())
    }
}

/// 清除 ADB 密钥
#[tauri::command]
async fn clear_adb_keys() -> Result<(), String> {
    let home = std::env::var("USERPROFILE")
        .or_else(|_| std::env::var("HOME"))
        .map(std::path::PathBuf::from)
        .map_err(|_| "无法获取用户主目录".to_string())?;

    let android_dir = home.join(".android");
    let key = android_dir.join("adbkey");
    let key_pub = android_dir.join("adbkey.pub");

    let mut errs: Vec<String> = Vec::new();
    for p in [key, key_pub].iter() {
        if p.exists() {
            if let Err(e) = std::fs::remove_file(p) {
                errs.push(format!("删除 {:?} 失败: {}", p, e));
            }
        }
    }

    if errs.is_empty() { Ok(()) } else { Err(errs.join("; ")) }
}

/// 初始化插件
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("file_manager")
        .invoke_handler(tauri::generate_handler![
            read_text,
            write_text,
            delete,
            read_as_data_url,
            reveal,
            clear_adb_keys
        ])
        .build()
}
