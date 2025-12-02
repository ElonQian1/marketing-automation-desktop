// src-tauri/src/modules/image_optimization/mod.rs
// module: image_optimization | layer: api | role: Image Optimization Plugin
// summary: 图片优化插件，提供图片加载、缩略图生成和预加载功能

use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};
use std::path::Path;
use tokio::fs;
use image::{ImageFormat, imageops::FilterType, GenericImageView};

/// 加载图片（优化版）
#[tauri::command]
async fn load(path: String) -> Result<Vec<u8>, String> {
    // 验证路径安全性
    let path_obj = Path::new(&path);
    if !path_obj.exists() {
        return Err(format!("文件不存在: {}", path));
    }
    
    // 检查文件扩展名
    let extension = path_obj.extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("")
        .to_lowercase();
    
    if !["png", "jpg", "jpeg", "webp", "bmp"].contains(&extension.as_str()) {
        return Err("不支持的图片格式".to_string());
    }
    
    // 读取文件
    match fs::read(&path).await {
        Ok(data) => {
            println!("✅ [Plugin:image] 成功读取图片: {} ({} bytes)", path, data.len());
            Ok(data)
        },
        Err(e) => {
            println!("❌ [Plugin:image] 读取图片失败: {} - {}", path, e);
            Err(format!("读取文件失败: {}", e))
        }
    }
}

/// 生成缩略图
#[tauri::command]  
async fn generate_thumbnail(
    source_path: String, 
    target_path: String,
    max_width: u32
) -> Result<String, String> {
    println!("🔧 [Plugin:image] 开始生成缩略图: {} -> {} (width: {})", source_path, target_path, max_width);
    
    // 打开原图
    let img = image::open(&source_path)
        .map_err(|e| format!("无法打开原图: {}", e))?;
    
    // 计算缩略图尺寸
    let (width, height) = img.dimensions();
    let ratio = (max_width as f64) / (width as f64);
    let new_height = (height as f64 * ratio) as u32;
    
    // 生成缩略图
    let thumbnail = img.resize(max_width, new_height, FilterType::Lanczos3);
    
    // 保存缩略图
    thumbnail.save_with_format(&target_path, ImageFormat::WebP)
        .map_err(|e| format!("保存缩略图失败: {}", e))?;
    
    println!("✅ [Plugin:image] 缩略图生成完成: {} ({}x{} -> {}x{})", target_path, width, height, max_width, new_height);
    Ok(target_path)
}

/// 批量预加载图片
#[tauri::command]
async fn preload_batch(image_paths: Vec<String>) -> Result<Vec<String>, String> {
    let mut successful_preloads = Vec::new();
    let mut tasks = Vec::new();
    
    for path in image_paths {
        let task = async move {
            if Path::new(&path).exists() {
                match fs::metadata(&path).await {
                    Ok(metadata) => {
                        println!("⚡ [Plugin:image] 预加载验证: {} ({} KB)", path, metadata.len() / 1024);
                        Some(path)
                    },
                    Err(_) => None
                }
            } else {
                None
            }
        };
        tasks.push(task);
    }
    
    // 并行验证所有文件
    let results = futures::future::join_all(tasks).await;
    
    for result in results {
        if let Some(valid_path) = result {
            successful_preloads.push(valid_path);
        }
    }
    
    println!("🔄 [Plugin:image] 批量预加载验证完成: {}/{} 文件有效", successful_preloads.len(), successful_preloads.len());
    Ok(successful_preloads)
}

/// 初始化插件
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("image_optimization")
        .invoke_handler(tauri::generate_handler![
            load,
            generate_thumbnail,
            preload_batch
        ])
        .build()
}
