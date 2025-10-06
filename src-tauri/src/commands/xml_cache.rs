use tracing::{info, warn};

#[tauri::command]
pub async fn list_xml_cache_files() -> Result<Vec<String>, String> {
    use std::fs;
    let debug_dir = get_debug_xml_dir();
    if !debug_dir.exists() { return Ok(vec![]); }
    match fs::read_dir(&debug_dir) {
        Ok(entries) => {
            let mut xml_files = Vec::new();
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_file() { if let Some(name) = path.file_name().and_then(|f| f.to_str()) { if name.ends_with(".xml") && name.starts_with("ui_dump_") { xml_files.push(name.to_string()); } } }
            }
            xml_files.sort(); xml_files.reverse();
            Ok(xml_files)
        }
        Err(e) => Err(format!("读取debug_xml目录失败: {}", e))
    }
}

#[tauri::command]
pub async fn read_xml_cache_file(file_name: String) -> Result<String, String> {
    use std::fs;
    let debug_dir = get_debug_xml_dir();
    let file_path = debug_dir.join(&file_name);
    if !file_path.exists() { return Err(format!("XML缓存文件不存在: {}", file_name)); }
    fs::read_to_string(&file_path).map_err(|e| format!("读取XML缓存文件失败: {} - {}", file_name, e))
}

#[tauri::command]
pub async fn get_xml_file_size(file_name: String) -> Result<u64, String> {
    use std::fs;
    let debug_dir = get_debug_xml_dir();
    let file_path = debug_dir.join(&file_name);
    if !file_path.exists() { return Err(format!("XML缓存文件不存在: {}", file_name)); }
    fs::metadata(&file_path).map(|m| m.len()).map_err(|e| format!("获取文件大小失败: {} - {}", file_name, e))
}

#[tauri::command]
pub async fn get_xml_file_absolute_path(file_name: String) -> Result<String, String> {
    use std::fs;
    // 原有逻辑：优先使用父目录的 debug_xml
    let primary_debug_dir = get_debug_xml_dir();
    let primary_file_path = primary_debug_dir.join(&file_name);

    // 回退逻辑：某些运行方式下 current_dir 可能就是项目根目录，直接尝试 ./debug_xml
    let fallback_debug_dir = std::env::current_dir()
        .unwrap_or_else(|_| std::path::PathBuf::from("."))
        .join("debug_xml");
    let fallback_file_path = fallback_debug_dir.join(&file_name);

    let (chosen_path, chosen_base) = if primary_file_path.exists() {
        (primary_file_path, "parent/debug_xml")
    } else if fallback_file_path.exists() {
        (fallback_file_path, "current/debug_xml")
    } else {
        return Err(format!("缓存文件不存在: {} (尝试于: {} 与 {})",
            file_name,
            primary_debug_dir.display(),
            fallback_debug_dir.display()
        ));
    };

    info!("📂 获取缓存文件绝对路径: [{}] {}", chosen_base, chosen_path.display());

    match fs::canonicalize(&chosen_path) {
        Ok(path) => Ok(path.to_string_lossy().to_string()),
        Err(err) => {
            info!("⚠️ canonicalize失败，将返回原路径: {} - {}", chosen_path.display(), err);
            Ok(chosen_path.to_string_lossy().to_string())
        }
    }
}

#[tauri::command]
pub async fn delete_xml_cache_artifacts(
    xml_file_name: String,
    screenshot_file_name: Option<String>,
) -> Result<(), String> {
    use std::fs;

    let debug_dir = get_debug_xml_dir();
    let xml_path = debug_dir.join(&xml_file_name);
    if !xml_path.exists() {
        return Err(format!("XML缓存文件不存在: {}", xml_file_name));
    }

    fs::remove_file(&xml_path)
        .map_err(|e| format!("删除XML缓存文件失败: {} - {}", xml_file_name, e))?;

    let screenshot_candidate = screenshot_file_name
        .filter(|name| !name.trim().is_empty())
        .unwrap_or_else(|| xml_file_name.replace(".xml", ".png"));

    if screenshot_candidate != xml_file_name {
        let screenshot_path = debug_dir.join(&screenshot_candidate);
        if screenshot_path.exists() {
            if let Err(err) = fs::remove_file(&screenshot_path) {
                warn!(
                    "⚠️ 删除截图文件失败: {} - {}",
                    screenshot_path.display(),
                    err
                );
            } else {
                info!(
                    "🗑️ 已删除关联截图: {}",
                    screenshot_path.display()
                );
            }
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn parse_cached_xml_to_elements(
    xml_content: Option<String>,
    file_path: Option<String>,
    enable_filtering: Option<bool>, // 新增参数：是否启用过滤
) -> Result<serde_json::Value, String> {
    use crate::services::universal_ui_page_analyzer::UniversalUIPageAnalyzer;
    use tracing::{info, error};

    // 默认禁用过滤器，以获取所有元素用于元素发现
    let filtering_enabled = enable_filtering.unwrap_or(false);
    
    info!("🎯 开始解析XML内容到UI元素 (过滤器: {})", if filtering_enabled { "启用" } else { "禁用" });

    // 获取XML内容
    let xml_data = match (xml_content, file_path) {
        (Some(content), _) => content,
        (None, Some(path)) => {
            // 读取缓存文件
            let cache_path = std::path::Path::new(&path);
            match std::fs::read_to_string(&cache_path) {
                Ok(content) => {
                    info!("✅ 从缓存文件读取XML: {} (长度: {})", path, content.len());
                    content
                }
                Err(e) => {
                    error!("❌ 读取XML文件失败: {}", e);
                    return Err(format!("无法读取XML文件 {}: {}", path, e));
                }
            }
        }
        (None, None) => {
            error!("❌ 必须提供xml_content或file_path参数");
            return Err("必须提供xml_content或file_path参数".to_string());
        }
    };

    info!("📄 XML内容长度: {} 字符", xml_data.len());

    // 使用统一的解析器，根据参数决定是否过滤
    let analyzer = UniversalUIPageAnalyzer::new();
    
    match analyzer.parse_xml_elements(&xml_data, filtering_enabled) {
        Ok(elements) => {
            let count = elements.len();
            info!("✅ 成功提取 {} 个UI元素 (过滤: {})", count, if filtering_enabled { "是" } else { "否" });
            
            // 转换为JSON格式
            match serde_json::to_value(elements) {
                Ok(json_elements) => {
                    info!("🎉 XML解析完成，返回 {} 个元素的JSON数据", count);
                    Ok(json_elements)
                }
                Err(e) => {
                    error!("❌ 序列化为JSON失败: {}", e);
                    Err(format!("序列化为JSON失败: {}", e))
                }
            }
        }
        Err(e) => {
            error!("❌ 解析XML失败: {}", e);
            Err(format!("解析XML失败: {}", e))
        }
    }
}

fn get_debug_xml_dir() -> std::path::PathBuf {
    // 确保指向项目根目录的 debug_xml 目录
    // 无论当前工作目录在 src-tauri 还是项目根目录，都能正确找到
    let current = std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from("."));
    
    // 如果当前目录名是 src-tauri，则取父目录
    if current.file_name().and_then(|name| name.to_str()) == Some("src-tauri") {
        current.parent().unwrap_or(&current).join("debug_xml")
    } else {
        // 否则直接在当前目录下查找
        current.join("debug_xml")
    }
}
