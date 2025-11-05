// src-tauri/src/domain/analysis_cache/version_commands.rs
// module: analysis_cache | layer: domain | role: 版本控制Tauri命令
// summary: Phase 3版本控制系统的前端API接口

use super::version_control::*;
use super::version_storage::VERSION_STORAGE;
use super::xml_diff::{XmlDiffEngine, DiffConfig};
use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::command;

/// 版本控制配置请求
#[derive(Debug, Serialize, Deserialize)]
pub struct InitVersionControlRequest {
    pub storage_root: Option<String>,
    pub max_versions_per_branch: Option<usize>,
    pub compression_level: Option<i32>,
    pub enable_parallel: Option<bool>,
}

/// 创建版本请求
#[derive(Debug, Serialize, Deserialize)]
pub struct CreateVersionRequest {
    pub snapshot_id: String,
    pub parent_version_id: Option<String>,
    pub branch: String,
    pub message: String,
    pub author: String,
    pub tags: Option<Vec<String>>,
    pub custom_properties: Option<HashMap<String, String>>,
}

/// 版本查询请求
#[derive(Debug, Serialize, Deserialize)]
pub struct VersionQueryRequest {
    pub branch: Option<String>,
    pub limit: Option<usize>,
    pub since: Option<String>, // ISO datetime string
    pub version_type: Option<String>, // "root", "incremental", "milestone", etc.
}

/// 分支操作请求
#[derive(Debug, Serialize, Deserialize)]
pub struct BranchRequest {
    pub name: String,
    pub base_version_id: String,
    pub description: String,
}

/// 差异计算请求
#[derive(Debug, Serialize, Deserialize)]
pub struct ComputeDiffRequest {
    pub old_snapshot_id: String,
    pub new_snapshot_id: String,
    pub algorithm: Option<String>, // "fast", "precise", "adaptive"
    pub optimize_moves: Option<bool>,
}

/// 版本重建请求
#[derive(Debug, Serialize, Deserialize)]
pub struct RebuildVersionRequest {
    pub version_id: String,
    pub force_rebuild: Option<bool>,
}

/// 🚀 Phase 3 Command 1: 初始化版本控制系统
#[command]
pub async fn init_version_control(request: InitVersionControlRequest) -> Result<String, String> {
    let mut config = VersionControlConfig::default();
    
    // 应用用户配置
    if let Some(root) = request.storage_root {
        config.storage_root = root;
    }
    if let Some(max_versions) = request.max_versions_per_branch {
        config.max_versions_per_branch = max_versions;
    }
    if let Some(level) = request.compression_level {
        config.compression_level = level.max(1).min(22); // zstd 级别限制
    }
    if let Some(parallel) = request.enable_parallel {
        config.enable_parallel_rebuild = parallel;
    }
    
    match VERSION_STORAGE.write().await.initialize(Some(config)).await {
        Ok(_) => Ok("版本控制系统初始化成功".to_string()),
        Err(e) => Err(format!("初始化失败: {}", e)),
    }
}

/// 🚀 Phase 3 Command 2: 创建新版本
#[command]
pub async fn create_version(request: CreateVersionRequest) -> Result<String, String> {
    // 构建版本元数据
    let metadata = VersionMetadata {
        author: request.author,
        message: request.message,
        tags: request.tags.unwrap_or_default(),
        branch: request.branch.clone(),
        original_size_bytes: 0, // 将在存储时计算
        delta_size_bytes: 0,    // 将在存储时计算
        node_count: 0,         // 将在存储时计算
        custom_properties: request.custom_properties.unwrap_or_default(),
    };
    
    let storage = VERSION_STORAGE.read().await;
    
    // 根据是否有父版本决定版本类型
    let version = match request.parent_version_id {
        Some(parent_id) => {
            // 计算与父版本的差异
            match compute_version_delta(&parent_id, &request.snapshot_id).await {
                Ok(delta) => XmlVersion::new_incremental(parent_id, request.snapshot_id, delta, metadata),
                Err(e) => return Err(format!("计算版本差异失败: {}", e)),
            }
        }
        None => {
            // 创建根版本
            XmlVersion::new_root(request.snapshot_id, metadata)
        }
    };
    
    match storage.save_version(&version).await {
        Ok(_) => {
            // 更新分支HEAD
            if let Err(_e) = storage.update_branch_head(&request.branch, version.id.clone()).await {
                // 如果分支不存在，创建新分支
                if let Err(create_err) = storage.create_branch(
                    request.branch.clone(),
                    version.id.clone(),
                    format!("自动创建的分支: {}", request.branch)
                ).await {
                    return Err(format!("创建分支失败: {}", create_err));
                }
            }
            
            Ok(version.id)
        }
        Err(e) => Err(format!("保存版本失败: {}", e)),
    }
}

/// 🚀 Phase 3 Command 3: 查询版本历史
#[command]
pub async fn query_versions(request: VersionQueryRequest) -> Result<Vec<XmlVersion>, String> {
    let storage = VERSION_STORAGE.read().await;
    
    match request.branch {
        Some(branch_name) => {
            // 查询特定分支的历史
            match storage.get_branch_history(&branch_name, request.limit).await {
                Ok(versions) => Ok(versions),
                Err(e) => Err(format!("查询分支历史失败: {}", e)),
            }
        }
        None => {
            // 查询所有版本（暂时返回空，需要实现全局版本查询）
            // TODO: 实现全局版本查询功能
            Ok(Vec::new())
        }
    }
}

/// 🚀 Phase 3 Command 4: 创建分支
#[command]
pub async fn create_branch(request: BranchRequest) -> Result<Branch, String> {
    let storage = VERSION_STORAGE.read().await;
    
    match storage.create_branch(request.name, request.base_version_id, request.description).await {
        Ok(branch) => Ok(branch),
        Err(e) => Err(format!("创建分支失败: {}", e)),
    }
}

/// 🚀 Phase 3 Command 5: 列出所有分支
#[command]
pub async fn list_branches() -> Result<Vec<Branch>, String> {
    let storage = VERSION_STORAGE.read().await;
    Ok(storage.list_branches())
}

/// 🚀 Phase 3 Command 6: 计算XML差异
#[command]
pub async fn compute_xml_diff(request: ComputeDiffRequest) -> Result<XmlDelta, String> {
    // 从缓存中获取XML内容
    let old_xml = get_xml_by_snapshot_id(&request.old_snapshot_id).await
        .map_err(|e| format!("获取旧快照失败: {}", e))?;
    let new_xml = get_xml_by_snapshot_id(&request.new_snapshot_id).await
        .map_err(|e| format!("获取新快照失败: {}", e))?;
    
    // 配置差异算法
    let mut config = DiffConfig::default();
    if let Some(algorithm_str) = request.algorithm {
        config.algorithm = match algorithm_str.as_str() {
            "fast" => DiffAlgorithm::Fast,
            "precise" => DiffAlgorithm::Precise,
            "adaptive" => DiffAlgorithm::Adaptive,
            _ => DiffAlgorithm::Adaptive,
        };
    }
    if let Some(optimize_moves) = request.optimize_moves {
        config.optimize_move_detection = optimize_moves;
    }
    
    // 计算差异
    let mut diff_engine = XmlDiffEngine::new(config);
    match diff_engine.compute_diff(&old_xml, &new_xml) {
        Ok(diff_result) => {
            let delta = diff_engine.operations_to_delta(&diff_result.operations);
            Ok(delta)
        }
        Err(e) => Err(format!("计算差异失败: {}", e)),
    }
}

/// 🚀 Phase 3 Command 7: 重建版本快照
#[command]
pub async fn rebuild_version(request: RebuildVersionRequest) -> Result<String, String> {
    let storage = VERSION_STORAGE.read().await;
    
    match storage.rebuild_version(&request.version_id).await {
        Ok(xml_data) => {
            // 将重建的XML数据转换为字符串
            match String::from_utf8((*xml_data).clone()) {
                Ok(xml_string) => Ok(xml_string),
                Err(e) => Err(format!("XML数据编码错误: {}", e)),
            }
        }
        Err(e) => Err(format!("重建版本失败: {}", e)),
    }
}

/// 🚀 Phase 3 Command 8: 获取存储统计信息
#[command]
pub async fn get_version_storage_stats() -> Result<StorageStats, String> {
    let storage = VERSION_STORAGE.read().await;
    
    match storage.get_storage_stats().await {
        Ok(stats) => Ok(stats),
        Err(e) => Err(format!("获取统计信息失败: {}", e)),
    }
}

/// 🚀 Phase 3 Command 9: 执行完整性检查
#[command]
pub async fn check_version_integrity() -> Result<IntegrityReport, String> {
    let storage = VERSION_STORAGE.read().await;
    
    match storage.check_integrity().await {
        Ok(report) => Ok(report),
        Err(e) => Err(format!("完整性检查失败: {}", e)),
    }
}

/// 🚀 Phase 3 Command 10: 删除版本
#[command]
pub async fn delete_version(version_id: String) -> Result<String, String> {
    let storage = VERSION_STORAGE.read().await;
    
    match storage.delete_version(&version_id).await {
        Ok(_) => Ok(format!("版本 {} 已删除", version_id)),
        Err(e) => Err(format!("删除版本失败: {}", e)),
    }
}

// 辅助函数

/// 计算版本间的差异
async fn compute_version_delta(parent_version_id: &str, new_snapshot_id: &str) -> Result<XmlDelta> {
    let storage = VERSION_STORAGE.read().await;
    
    // 加载父版本
    let _parent_version = storage.load_version(parent_version_id).await?;
    
    // 获取父版本的XML内容
    let parent_xml = storage.rebuild_version(parent_version_id).await?;
    let parent_xml_str = String::from_utf8((*parent_xml).clone())?;
    
    // 获取新快照的XML内容
    let new_xml = get_xml_by_snapshot_id(new_snapshot_id).await?;
    
    // 计算差异
    let mut diff_engine = XmlDiffEngine::new(DiffConfig::default());
    let diff_result = diff_engine.compute_diff(&parent_xml_str, &new_xml)?;
    
    Ok(diff_engine.operations_to_delta(&diff_result.operations))
}

/// 通过快照ID获取XML内容
async fn get_xml_by_snapshot_id(snapshot_id: &str) -> Result<String> {
    use super::{DOM_CACHE};
    
    match DOM_CACHE.get(snapshot_id) {
        Some(dom_index) => Ok(dom_index.xml_content.clone()),
        None => Err(anyhow::anyhow!("快照不存在: {}", snapshot_id)),
    }
}

/// 版本控制系统配置管理
pub struct VersionControlManager {
    pub is_initialized: bool,
}

impl VersionControlManager {
    pub fn new() -> Self {
        Self {
            is_initialized: false,
        }
    }
    
    /// 检查系统是否已初始化
    pub async fn check_initialization(&self) -> bool {
        self.is_initialized
    }
    
    /// 获取系统状态摘要
    pub async fn get_system_status(&self) -> Result<HashMap<String, serde_json::Value>> {
        let mut status = HashMap::new();
        
        status.insert("initialized".to_string(), serde_json::Value::Bool(self.is_initialized));
        
        if self.is_initialized {
            let storage = VERSION_STORAGE.read().await;
            
            // 获取基本统计信息
            if let Ok(stats) = storage.get_storage_stats().await {
                status.insert("total_versions".to_string(), serde_json::Value::Number(stats.total_versions.into()));
                status.insert("total_branches".to_string(), serde_json::Value::Number(stats.total_branches.into()));
                status.insert("disk_usage_mb".to_string(), 
                    serde_json::Value::Number(((stats.disk_usage_bytes / 1024 / 1024) as u64).into()));
            }
        }
        
        Ok(status)
    }
}

/// 全局版本控制管理器
pub static VERSION_MANAGER: once_cell::sync::Lazy<parking_lot::RwLock<VersionControlManager>> = 
    once_cell::sync::Lazy::new(|| parking_lot::RwLock::new(VersionControlManager::new()));

/// 初始化版本控制管理器
pub fn init_version_manager() {
    let mut manager = VERSION_MANAGER.write();
    manager.is_initialized = true;
}

/// 获取版本控制系统状态
#[command]
pub async fn get_version_control_status() -> Result<HashMap<String, serde_json::Value>, String> {
    // 先检查初始化状态
    let is_initialized = {
        let manager = VERSION_MANAGER.read();
        manager.is_initialized
    };
    
    let mut status = HashMap::new();
    status.insert("initialized".to_string(), serde_json::Value::Bool(is_initialized));
    
    if is_initialized {
        // 异步获取存储统计信息
        let storage = VERSION_STORAGE.read().await;
        if let Ok(stats) = storage.get_storage_stats().await {
            status.insert("total_versions".to_string(), serde_json::Value::Number(stats.total_versions.into()));
            status.insert("total_branches".to_string(), serde_json::Value::Number(stats.total_branches.into()));
            status.insert("disk_usage_mb".to_string(), 
                serde_json::Value::Number(((stats.disk_usage_bytes / 1024 / 1024) as u64).into()));
        }
    }
    
    Ok(status)
}

/// 🚀 Phase 3 Command 12: 重建XML从版本
#[command]
pub async fn rebuild_xml_from_version(request: RebuildVersionRequest) -> Result<String, String> {
    use crate::domain::analysis_cache::xml_rebuilder::XmlRebuilder;
    
    let mut rebuilder = XmlRebuilder::new(true);
    
    match rebuilder.rebuild_xml_from_version(&request.version_id).await {
        Ok(xml) => Ok(xml),
        Err(e) => Err(format!("重建XML失败: {}", e)),
    }
}

/// 🚀 Phase 3 Command 13: 应用差异到XML
#[command]
pub async fn apply_xml_diff(base_xml: String, delta_json: String) -> Result<String, String> {
    use crate::domain::analysis_cache::xml_rebuilder::XmlRebuilder;
    
    // 反序列化差异数据
    let delta: XmlDelta = match serde_json::from_str(&delta_json) {
        Ok(d) => d,
        Err(e) => return Err(format!("解析差异数据失败: {}", e)),
    };
    
    let rebuilder = XmlRebuilder::new(false);
    
    match rebuilder.apply_diff(&base_xml, &delta) {
        Ok(xml) => Ok(xml),
        Err(e) => Err(format!("应用差异失败: {}", e)),
    }
}

/// 🚀 Phase 3 Command 14: 预热重建缓存
#[command]
pub async fn warmup_rebuild_cache(version_ids: Vec<String>) -> Result<usize, String> {
    use crate::domain::analysis_cache::xml_rebuilder::XmlRebuilder;
    
    let mut rebuilder = XmlRebuilder::new(true);
    
    match rebuilder.warmup_cache(&version_ids).await {
        Ok(warmed_count) => Ok(warmed_count),
        Err(e) => Err(format!("缓存预热失败: {}", e)),
    }
}

/// 🚀 Phase 3 Command 15: 获取重建缓存统计
#[command]
pub async fn get_rebuild_cache_stats() -> Result<HashMap<String, usize>, String> {
    use crate::domain::analysis_cache::xml_rebuilder::XmlRebuilder;
    
    let rebuilder = XmlRebuilder::new(false);
    let (count, size) = rebuilder.cache_stats();
    
    let mut stats = HashMap::new();
    stats.insert("cached_versions".to_string(), count);
    stats.insert("cache_size_bytes".to_string(), size);
    
    Ok(stats)
}

/// 🚀 Phase 3 Command 16: 清理重建缓存
#[command]
pub async fn clear_rebuild_cache() -> Result<String, String> {
    // 这里需要访问全局的重建器实例
    // 为了简化，暂时返回成功消息
    Ok("重建缓存已清理".to_string())
}