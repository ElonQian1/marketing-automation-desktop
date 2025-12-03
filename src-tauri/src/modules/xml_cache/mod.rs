use tauri::{plugin::{Builder, TauriPlugin}, Runtime};
use tracing::{info, warn, debug, error};
use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use anyhow::Result;

// 🚀 Phase 2: 引入缓存生命周期管理
use crate::domain::analysis_cache::{
    lifecycle::{
        pin_snapshot, unpin_snapshot, get_snapshot_ref_info, get_all_snapshot_refs,
        validate_cache_consistency, force_clear_all_caches, SnapshotRefInfo
    },
    SnapshotId, SNAPSHOT_REFS, DOM_CACHE, SUBTREE_CACHE
};
use crate::domain::analysis_cache::api::{register_snapshot, get_or_compute_subtree, try_get_subtree};
use crate::domain::analysis_cache::types::SubtreeMetricsDto;

mod enhanced; // ✅ Add enhanced cache module

// ==================== 📁 XML Cache Management ====================

/// 📦 XML缓存文件元数据（一次性返回所有文件的完整信息）
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct XmlCacheFileMetadata {
    /// 文件名（如 ui_dump_e0d909c3_20251203_123223.xml）
    pub file_name: String,
    /// 文件绝对路径
    pub absolute_path: String,
    /// 文件大小（字节）
    pub file_size: u64,
    /// 设备ID（从文件名解析）
    pub device_id: String,
    /// 时间戳（从文件名解析，格式如 20251203_123223）
    pub timestamp: String,
    /// 截图文件名（如果存在）
    pub screenshot_file_name: Option<String>,
    /// 截图绝对路径（如果存在）
    pub screenshot_absolute_path: Option<String>,
    /// 应用包名（通过扫描XML内容检测）
    pub app_package: String,
    /// 页面类型（通过扫描XML内容识别）
    pub page_type: String,
    /// 元素数量（通过统计XML节点）
    pub element_count: u32,
    /// 可点击元素数量
    pub clickable_count: u32,
    /// 页面描述
    pub description: String,
    /// 主要按钮文本（最多8个）
    pub main_buttons: Vec<String>,
    /// 主要文本内容（最多10个）
    pub main_texts: Vec<String>,
    /// 输入框数量
    pub input_count: u32,
}

#[tauri::command]
async fn list_xml_cache_files() -> Result<Vec<String>, String> {
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

/// 🚀 批量获取所有XML缓存文件的完整元数据（一次IPC调用替代 N×4 次调用）
/// 
/// 优化前：每个文件需要 4 次 IPC 调用（list + read + size + path）
/// 优化后：一次调用返回所有文件的完整元数据
#[tauri::command]
async fn list_xml_cache_files_with_metadata() -> Result<Vec<XmlCacheFileMetadata>, String> {
    use std::fs;
    use std::time::Instant;
    use regex::Regex;
    
    let start = Instant::now();
    let debug_dir = get_debug_xml_dir();
    
    if !debug_dir.exists() {
        info!("📂 debug_xml 目录不存在，返回空列表");
        return Ok(vec![]);
    }
    
    let entries = fs::read_dir(&debug_dir)
        .map_err(|e| format!("读取debug_xml目录失败: {}", e))?;
    
    // 文件名正则：ui_dump_{deviceId}_{timestamp}.xml
    let filename_regex = Regex::new(r"^ui_dump_([^_]+)_(\d{8}_\d{6})\.xml$")
        .map_err(|e| format!("正则编译失败: {}", e))?;
    
    let mut results = Vec::new();
    
    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_file() { continue; }
        
        let file_name = match path.file_name().and_then(|f| f.to_str()) {
            Some(name) if name.ends_with(".xml") && name.starts_with("ui_dump_") => name.to_string(),
            _ => continue,
        };
        
        // 解析文件名获取 deviceId 和 timestamp
        let (device_id, timestamp) = match filename_regex.captures(&file_name) {
            Some(caps) => (
                caps.get(1).map(|m| m.as_str().to_string()).unwrap_or_default(),
                caps.get(2).map(|m| m.as_str().to_string()).unwrap_or_default()
            ),
            None => {
                warn!("⚠️ 无法解析文件名: {}", file_name);
                continue;
            }
        };
        
        // 获取文件大小
        let file_size = fs::metadata(&path)
            .map(|m| m.len())
            .unwrap_or(0);
        
        // 获取绝对路径
        let absolute_path = fs::canonicalize(&path)
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_else(|_| path.to_string_lossy().to_string());
        
        // 检查截图是否存在
        let screenshot_file_name = file_name.replace(".xml", ".png");
        let screenshot_path = debug_dir.join(&screenshot_file_name);
        let (screenshot_file_name, screenshot_absolute_path) = if screenshot_path.exists() {
            let abs_path = fs::canonicalize(&screenshot_path)
                .map(|p| p.to_string_lossy().to_string())
                .ok();
            (Some(screenshot_file_name), abs_path)
        } else {
            (None, None)
        };
        
        // 读取 XML 内容并分析
        let xml_content = match fs::read_to_string(&path) {
            Ok(content) => content,
            Err(e) => {
                warn!("⚠️ 读取文件失败 {}: {}", file_name, e);
                continue;
            }
        };
        
        // 分析 XML 内容（使用高效的正则扫描，避免完整 DOM 解析）
        let analysis = analyze_xml_content_fast(&xml_content);
        
        results.push(XmlCacheFileMetadata {
            file_name,
            absolute_path,
            file_size,
            device_id,
            timestamp,
            screenshot_file_name,
            screenshot_absolute_path,
            app_package: analysis.app_package,
            page_type: analysis.page_type,
            element_count: analysis.element_count,
            clickable_count: analysis.clickable_count,
            description: analysis.description,
            main_buttons: analysis.main_buttons,
            main_texts: analysis.main_texts,
            input_count: analysis.input_count,
        });
    }
    
    // 按时间戳降序排序（最新的在前）
    results.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    
    let elapsed = start.elapsed();
    info!("✅ 批量加载 {} 个XML缓存文件元数据完成，耗时 {:?}", results.len(), elapsed);
    
    Ok(results)
}

/// 快速分析 XML 内容（使用正则而非 DOM 解析，提升性能）
struct XmlAnalysisResult {
    app_package: String,
    page_type: String,
    element_count: u32,
    clickable_count: u32,
    description: String,
    main_buttons: Vec<String>,
    main_texts: Vec<String>,
    input_count: u32,
}

fn analyze_xml_content_fast(xml_content: &str) -> XmlAnalysisResult {
    use regex::Regex;
    
    // 检测应用包名（高效字符串搜索）
    let app_package = if xml_content.contains("com.xingin.xhs") {
        "com.xingin.xhs".to_string()
    } else if xml_content.contains("com.tencent.mm") {
        "com.tencent.mm".to_string()
    } else if xml_content.contains("com.ss.android.ugc.aweme") {
        "com.ss.android.ugc.aweme".to_string()
    } else if xml_content.contains("com.android.contacts") {
        "com.android.contacts".to_string()
    } else {
        "unknown".to_string()
    };
    
    // 统计元素数量（统计 <node 出现次数）
    let element_count = xml_content.matches("<node ").count() as u32;
    
    // 统计可点击元素（统计 clickable="true" 出现次数）
    let clickable_count = xml_content.matches(r#"clickable="true""#).count() as u32;
    
    // 统计输入框（统计 EditText 出现次数）
    let input_count = xml_content.matches("EditText").count() as u32;
    
    // 提取主要文本（正则匹配 text="..."）
    let text_regex = Regex::new(r#"text="([^"]{1,20})""#).unwrap();
    let main_texts: Vec<String> = text_regex.captures_iter(xml_content)
        .filter_map(|cap| cap.get(1).map(|m| m.as_str().trim().to_string()))
        .filter(|s| !s.is_empty())
        .take(10)
        .collect();
    
    // 提取可点击元素的文本作为主要按钮
    // 简化：匹配 clickable="true" 前后的 text 属性
    let button_regex = Regex::new(r#"text="([^"]{1,15})"[^>]*clickable="true"|clickable="true"[^>]*text="([^"]{1,15})""#).unwrap();
    let main_buttons: Vec<String> = button_regex.captures_iter(xml_content)
        .filter_map(|cap| {
            cap.get(1).or_else(|| cap.get(2))
                .map(|m| m.as_str().trim().to_string())
        })
        .filter(|s| !s.is_empty())
        .take(8)
        .collect();
    
    // 识别页面类型
    let page_type = identify_page_type_fast(&app_package, xml_content);
    
    // 生成描述
    let description = format!("{} • {}个可点击元素", page_type, clickable_count);
    
    XmlAnalysisResult {
        app_package,
        page_type,
        element_count,
        clickable_count,
        description,
        main_buttons,
        main_texts,
        input_count,
    }
}

fn identify_page_type_fast(app_package: &str, xml_content: &str) -> String {
    match app_package {
        "com.xingin.xhs" => {
            if xml_content.contains("发现") && xml_content.contains("首页") {
                "小红书首页".to_string()
            } else if xml_content.contains("搜索") {
                "小红书搜索页".to_string()
            } else if xml_content.contains("消息") || xml_content.contains("聊天") {
                "小红书消息页".to_string()
            } else if xml_content.contains("粉丝") || xml_content.contains("关注") {
                "小红书个人中心".to_string()
            } else if xml_content.contains("评论") {
                "小红书详情页".to_string()
            } else {
                "小红书页面".to_string()
            }
        }
        "com.tencent.mm" => "微信页面".to_string(),
        "com.ss.android.ugc.aweme" => {
            if xml_content.contains("首页") {
                "抖音首页".to_string()
            } else {
                "抖音页面".to_string()
            }
        }
        "com.android.contacts" => "系统通讯录".to_string(),
        _ => "未知页面".to_string(),
    }
}

#[tauri::command]
async fn read_xml_cache_file(file_name: String) -> Result<String, String> {
    use std::fs;
    let debug_dir = get_debug_xml_dir();
    let file_path = debug_dir.join(&file_name);
    if !file_path.exists() { return Err(format!("XML缓存文件不存在: {}", file_name)); }
    fs::read_to_string(&file_path).map_err(|e| format!("读取XML缓存文件失败: {} - {}", file_name, e))
}

#[tauri::command]
async fn get_xml_file_size(file_name: String) -> Result<u64, String> {
    use std::fs;
    let debug_dir = get_debug_xml_dir();
    let file_path = debug_dir.join(&file_name);
    if !file_path.exists() { return Err(format!("XML缓存文件不存在: {}", file_name)); }
    fs::metadata(&file_path).map(|m| m.len()).map_err(|e| format!("获取文件大小失败: {} - {}", file_name, e))
}

#[tauri::command]
async fn get_xml_file_absolute_path(file_name: String) -> Result<String, String> {
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
async fn delete_xml_cache_artifacts(
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
async fn parse_cached_xml_to_elements(
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
    
    // 记录调试信息
    info!("🔍 XML缓存目录检查:");
    info!("  - 当前工作目录: {:?}", std::env::current_dir().unwrap_or_default());
    info!("  - 选择的debug_xml路径: {}", debug_xml_path.display());
    info!("  - 路径是否存在: {}", debug_xml_path.exists());
    
    debug_xml_path
}

/// 🔧 调试命令：检查XML缓存路径问题
#[tauri::command]
async fn debug_xml_cache_paths() -> Result<serde_json::Value, String> {
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

// ==================== 🔮 Analysis Cache Management ====================

/// 将步骤与XML快照关联，增加引用计数
#[tauri::command]
#[allow(unused_variables)]
async fn link_step_snapshot(
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
async fn unlink_step_snapshot(
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
async fn get_snapshot_reference_info(snapshot_id: SnapshotId) -> Result<Option<SnapshotRefInfo>, String> {
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
async fn get_all_snapshot_references() -> Result<HashMap<SnapshotId, usize>, String> {
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
async fn get_cache_system_status() -> Result<CacheSystemStatus, String> {
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
async fn validate_cache_consistency_cmd() -> Result<Vec<String>, String> {
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
async fn force_clear_all_caches_cmd() -> Result<(), String> {
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

/// 清理过期缓存
#[tauri::command]
async fn cleanup_cache_cmd(max_age_hours: u32) -> Result<usize, String> {
    // TODO: 实现基于时间的缓存清理
    tracing::info!("缓存清理: 最大年龄{}小时", max_age_hours);
    Ok(0)
}

// ==================== 🧠 Analysis Cache Commands (from analysis_cache.rs) ====================

/// 注册XML快照，返回SnapshotId
#[tauri::command]
async fn register_snapshot_cmd(xml_content: String) -> String {
    let snapshot_id = register_snapshot(&xml_content);
    tracing::info!("前端注册XML快照: snapshot_id={}", snapshot_id);
    snapshot_id
}

/// 获取子树分析指标
#[tauri::command]
async fn get_subtree_metrics_cmd(
    snapshot_id: String,
    abs_xpath: String,
) -> Result<SubtreeMetricsDto, String> {
    match get_or_compute_subtree(&snapshot_id, &abs_xpath) {
        Ok(metrics) => {
            tracing::debug!("前端获取子树指标: xpath={}, 策略={}", 
                          abs_xpath, metrics.suggested_strategy);
            Ok(metrics.into())
        }
        Err(e) => {
            tracing::error!("获取子树指标失败: {}", e);
            Err(e.to_string())
        }
    }
}

/// 尝试从缓存获取子树指标（不触发计算）
#[tauri::command]
async fn try_get_subtree_metrics_cmd(
    snapshot_id: String,
    abs_xpath: String,
) -> Option<SubtreeMetricsDto> {
    try_get_subtree(&snapshot_id, &abs_xpath).map(|m| m.into())
}

/// 批量获取多个元素的子树指标
#[tauri::command]
async fn batch_get_subtree_metrics_cmd(
    snapshot_id: String,
    xpath_list: Vec<String>,
) -> Result<Vec<SubtreeMetricsDto>, String> {
    let mut results = Vec::new();
    
    for abs_xpath in xpath_list {
        match get_or_compute_subtree(&snapshot_id, &abs_xpath) {
            Ok(metrics) => results.push(metrics.into()),
            Err(e) => {
                tracing::warn!("批量获取指标失败: xpath={}, error={}", abs_xpath, e);
                return Err(format!("获取{}指标失败: {}", abs_xpath, e));
            }
        }
    }
    
    tracing::info!("批量获取完成: 处理{}个元素", results.len());
    Ok(results)
}

#[derive(serde::Serialize)]
pub struct CacheStats {
    pub dom_cache_size: usize,
    pub subtree_cache_size: usize,
    pub total_memory_mb: usize,
}

/// 获取缓存统计信息
#[tauri::command]
async fn get_cache_stats_cmd() -> CacheStats {
    use crate::domain::analysis_cache::{DOM_CACHE, SUBTREE_CACHE};
    
    let stats = CacheStats {
        dom_cache_size: DOM_CACHE.len(),
        subtree_cache_size: SUBTREE_CACHE.len(),
        total_memory_mb: 0, // TODO: 实际计算内存使用
    };
    
    tracing::debug!("缓存统计: DOM={}, 子树={}", 
                   stats.dom_cache_size, stats.subtree_cache_size);
    
    stats
}

// ==================== 🔌 Plugin Initialization ====================

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("xml_cache")
        .invoke_handler(tauri::generate_handler![
            // XML Cache
            list_xml_cache_files,
            list_xml_cache_files_with_metadata, // 🚀 新增：批量获取元数据
            read_xml_cache_file,
            get_xml_file_size,
            get_xml_file_absolute_path,
            delete_xml_cache_artifacts,
            parse_cached_xml_to_elements,
            debug_xml_cache_paths,
            
            // Enhanced Cache
            enhanced::enhanced_cache_file_exists,
            enhanced::get_enhanced_cache_stats,
            enhanced::cleanup_enhanced_cache,
            enhanced::clear_all_enhanced_cache,
            enhanced::read_enhanced_cache_file,
            enhanced::save_enhanced_cache_file,
            enhanced::get_enhanced_cache_metadata,
            enhanced::clear_enhanced_cache_directory,
            enhanced::delete_enhanced_cache_file,

            // Analysis Cache
            link_step_snapshot,
            unlink_step_snapshot,
            get_snapshot_reference_info,
            get_all_snapshot_references,
            get_cache_system_status,
            validate_cache_consistency_cmd,
            force_clear_all_caches_cmd,
            register_snapshot_cmd,
            get_subtree_metrics_cmd,
            try_get_subtree_metrics_cmd,
            batch_get_subtree_metrics_cmd,
            cleanup_cache_cmd,
            get_cache_stats_cmd
        ])
        .build()
}
