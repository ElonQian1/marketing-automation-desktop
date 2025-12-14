use tracing::{info, warn, debug, error};
use serde::Serialize;
use std::collections::HashMap;

// 🚀 Phase 2: 引入缓存生命周期管理
use crate::domain::analysis_cache::{
    lifecycle::{
        pin_snapshot, unpin_snapshot, get_snapshot_ref_info, get_all_snapshot_refs,
        validate_cache_consistency, force_clear_all_caches, SnapshotRefInfo
    },
    SnapshotId, SNAPSHOT_REFS, DOM_CACHE, SUBTREE_CACHE
};

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
    // 🔧 修复：强制使用项目根目录的绝对路径，避免运行时路径混乱
    let absolute_project_root = std::path::PathBuf::from("D:\\rust\\active-projects\\小红书\\employeeGUI");
    let debug_xml_path = absolute_project_root.join("debug_xml");
    
    // 记录调试信息 (降级为 debug 减少日志冗余)
    debug!("🔍 XML缓存目录检查:");
    debug!("  - 当前工作目录: {:?}", std::env::current_dir().unwrap_or_default());
    debug!("  - 选择的debug_xml路径: {}", debug_xml_path.display());
    debug!("  - 路径是否存在: {}", debug_xml_path.exists());
    
    debug_xml_path
}

/// 🔧 调试命令：检查XML缓存路径问题
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

// ========================================
// 🚀 Phase 2: 引用计数管理命令
// ========================================

/// 将步骤与XML快照关联，增加引用计数
#[tauri::command]
#[allow(unused_variables)]
pub async fn link_step_snapshot(
    step_id: String,
    snapshot_id: SnapshotId,
    description: Option<String>
) -> Result<usize, String> {
    let _ = description;
    debug!(
        step_id = %step_id,
        snapshot_id = %snapshot_id,
        "Linking step to snapshot"
    );
    
    match pin_snapshot(&snapshot_id, Some(&step_id)) {
        Ok(ref_count) => {
            info!(
                step_id = %step_id,
                snapshot_id = %snapshot_id,
                new_ref_count = ref_count,
                "Successfully linked step to snapshot"
            );
            Ok(ref_count)
        }
        Err(e) => {
            error!(
                step_id = %step_id,
                snapshot_id = %snapshot_id,
                error = %e,
                "Failed to link step to snapshot"
            );
            Err(format!("链接步骤到快照失败: {}", e))
        }
    }
}

/// 解除步骤与XML快照关联，减少引用计数
#[tauri::command]
pub async fn unlink_step_snapshot(
    step_id: String,
    snapshot_id: SnapshotId,
    force_remove: Option<bool>
) -> Result<Option<usize>, String> {
    let force = force_remove.unwrap_or(false);
    
    debug!(
        step_id = %step_id,
        snapshot_id = %snapshot_id,
        force_remove = force,
        "Unlinking step from snapshot"
    );
    
    match unpin_snapshot(&snapshot_id, Some(&step_id), force) {
        Ok(remaining_count) => {
            info!(
                step_id = %step_id,
                snapshot_id = %snapshot_id,
                remaining_count = ?remaining_count,
                force_remove = force,
                "Successfully unlinked step from snapshot"
            );
            Ok(remaining_count)
        }
        Err(e) => {
            error!(
                step_id = %step_id,
                snapshot_id = %snapshot_id,
                error = %e,
                "Failed to unlink step from snapshot"
            );
            Err(format!("解除步骤快照关联失败: {}", e))
        }
    }
}

/// 获取指定快照的引用信息
#[tauri::command]
pub async fn get_snapshot_reference_info(snapshot_id: SnapshotId) -> Result<Option<SnapshotRefInfo>, String> {
    debug!(snapshot_id = %snapshot_id, "Getting snapshot reference info");
    
    let info = get_snapshot_ref_info(&snapshot_id);
    
    if let Some(ref info) = info {
        debug!(
            snapshot_id = %snapshot_id,
            ref_count = info.ref_count,
            "Found snapshot reference info"
        );
    } else {
        debug!(snapshot_id = %snapshot_id, "No reference info found for snapshot");
    }
    
    Ok(info)
}

/// 获取所有快照的引用计数统计
#[tauri::command]
pub async fn get_all_snapshot_references() -> Result<HashMap<SnapshotId, usize>, String> {
    debug!("Getting all snapshot references");
    
    let refs = get_all_snapshot_refs();
    
    info!(
        total_snapshots = refs.len(),
        "Retrieved all snapshot references"
    );
    
    Ok(refs)
}

/// 获取缓存系统整体状态
#[derive(Serialize)]
pub struct CacheSystemStatus {
    pub dom_cache_size: usize,
    pub subtree_cache_size: usize,
    pub reference_count: usize,
    pub total_references: usize,
    pub consistency_issues: Vec<String>,
}

#[tauri::command]
pub async fn get_cache_system_status() -> Result<CacheSystemStatus, String> {
    debug!("Getting cache system status");
    
    let consistency_issues = validate_cache_consistency()
        .map_err(|e| format!("缓存一致性检查失败: {}", e))?;
    
    let all_refs = get_all_snapshot_refs();
    let total_references: usize = all_refs.values().sum();
    
    let status = CacheSystemStatus {
        dom_cache_size: DOM_CACHE.len(),
        subtree_cache_size: SUBTREE_CACHE.len(),
        reference_count: SNAPSHOT_REFS.len(),
        total_references,
        consistency_issues,
    };
    
    info!(
        dom_cache_size = status.dom_cache_size,
        subtree_cache_size = status.subtree_cache_size,
        reference_count = status.reference_count,
        total_references = status.total_references,
        issues_found = status.consistency_issues.len(),
        "Cache system status retrieved"
    );
    
    Ok(status)
}

/// 验证缓存一致性
#[tauri::command]
pub async fn validate_cache_consistency_cmd() -> Result<Vec<String>, String> {
    debug!("Validating cache consistency");
    
    match validate_cache_consistency() {
        Ok(issues) => {
            if issues.is_empty() {
                info!("Cache consistency validation passed - no issues found");
            } else {
                warn!(
                    issues_count = issues.len(),
                    "Cache consistency validation found issues"
                );
            }
            Ok(issues)
        }
        Err(e) => {
            error!(error = %e, "Cache consistency validation failed");
            Err(format!("缓存一致性验证失败: {}", e))
        }
    }
}

/// 强制清理所有缓存（调试用）
#[tauri::command]
pub async fn force_clear_all_caches_cmd() -> Result<(), String> {
    warn!("Force clearing all caches - this is a debug operation");
    
    match force_clear_all_caches() {
        Ok(()) => {
            info!("Successfully force cleared all caches");
            Ok(())
        }
        Err(e) => {
            error!(error = %e, "Failed to force clear caches");
            Err(format!("强制清理缓存失败: {}", e))
        }
    }
}
