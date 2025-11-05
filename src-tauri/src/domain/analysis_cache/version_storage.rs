// src-tauri/src/domain/analysis_cache/version_storage.rs
// module: analysis_cache | layer: domain | role: 版本控制存储层实现
// summary: XML版本数据的持久化存储和索引管理

use super::version_control::*;
use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use dashmap::DashMap;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::{self, File};
use std::io::{BufReader, BufWriter, Read, Write};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tokio::sync::RwLock;
use zstd::stream::{decode_all, encode_all};

/// 全局版本存储实例
pub static VERSION_STORAGE: Lazy<Arc<RwLock<VersionStorage>>> = 
    Lazy::new(|| Arc::new(RwLock::new(VersionStorage::new())));

/// 版本存储管理器
#[derive(Debug)]
pub struct VersionStorage {
    /// 配置信息
    config: VersionControlConfig,
    /// 版本索引（内存缓存）
    version_index: DashMap<String, VersionIndexEntry>,
    /// 分支索引（内存缓存）
    branch_index: DashMap<String, Branch>,
    /// 存储根目录
    storage_root: PathBuf,
    /// 版本重建缓存
    rebuild_cache: Arc<RwLock<HashMap<String, Arc<Vec<u8>>>>>,
}

impl VersionStorage {
    /// 创建新的版本存储实例
    pub fn new() -> Self {
        let config = VersionControlConfig::default();
        let storage_root = PathBuf::from(&config.storage_root);
        
        Self {
            config,
            version_index: DashMap::new(),
            branch_index: DashMap::new(),
            storage_root,
            rebuild_cache: Arc::new(RwLock::new(HashMap::new())),
        }
    }
    
    /// 初始化存储系统
    pub async fn initialize(&mut self, config: Option<VersionControlConfig>) -> Result<()> {
        // 更新配置
        if let Some(cfg) = config {
            self.config = cfg;
            self.storage_root = PathBuf::from(&self.config.storage_root);
        }
        
        // 创建存储目录结构
        self.create_storage_directories()?;
        
        // 加载现有索引
        self.load_indices().await?;
        
        // 验证存储完整性
        self.verify_storage_integrity().await?;
        
        Ok(())
    }
    
    /// 创建存储目录结构
    fn create_storage_directories(&self) -> Result<()> {
        let dirs = [
            &self.storage_root,
            &self.storage_root.join("versions"),
            &self.storage_root.join("branches"),
            &self.storage_root.join("indices"),
            &self.storage_root.join("snapshots"),
            &self.storage_root.join("temp"),
        ];
        
        for dir in dirs.iter() {
            fs::create_dir_all(dir)
                .with_context(|| format!("创建目录失败: {}", dir.display()))?;
        }
        
        Ok(())
    }
    
    /// 保存版本数据
    pub async fn save_version(&self, version: &XmlVersion) -> Result<()> {
        // 创建版本文件路径
        let version_dir = self.get_version_directory(&version.id);
        fs::create_dir_all(&version_dir)
            .with_context(|| format!("创建版本目录失败: {}", version_dir.display()))?;
        
        // 保存版本元数据
        let metadata_path = version_dir.join("metadata.cbor");
        self.save_compressed_data(&metadata_path, version, self.config.compression_level)?;
        
        // 保存增量数据（如果存在）
        let delta_path = if let Some(delta) = &version.delta {
            let path = version_dir.join("delta.cbor");
            self.save_compressed_data(&path, delta, self.config.compression_level)?;
            Some(path.to_string_lossy().to_string())
        } else {
            None
        };
        
        // 更新版本索引
        let index_entry = VersionIndexEntry {
            version_id: version.id.clone(),
            branch: version.metadata.branch.clone(),
            timestamp: version.timestamp,
            version_type: version.version_type.clone(),
            parent_id: version.parent_id.clone(),
            child_ids: vec![], // 将在父版本中更新
            file_paths: VersionFilePaths {
                metadata_path: metadata_path.to_string_lossy().to_string(),
                delta_path,
                snapshot_path: None, // 快照路径在Phase 1中管理
            },
        };
        
        self.version_index.insert(version.id.clone(), index_entry);
        
        // 更新父版本的子版本列表
        if let Some(parent_id) = &version.parent_id {
            if let Some(mut parent_entry) = self.version_index.get_mut(parent_id) {
                parent_entry.child_ids.push(version.id.clone());
            }
        }
        
        // 持久化索引
        self.save_version_index().await?;
        
        Ok(())
    }
    
    /// 加载版本数据
    pub async fn load_version(&self, version_id: &str) -> Result<XmlVersion> {
        let index_entry = self.version_index.get(version_id)
            .ok_or_else(|| VersionControlError::VersionNotFound(version_id.to_string()))?;
        
        // 加载版本元数据
        let metadata_path = Path::new(&index_entry.file_paths.metadata_path);
        let version: XmlVersion = self.load_compressed_data(metadata_path)?;
        
        Ok(version)
    }
    
    /// 删除版本
    pub async fn delete_version(&self, version_id: &str) -> Result<()> {
        let index_entry = self.version_index.get(version_id)
            .ok_or_else(|| VersionControlError::VersionNotFound(version_id.to_string()))?;
        
        // 检查是否有子版本依赖
        if !index_entry.child_ids.is_empty() {
            return Err(VersionControlError::StorageError(
                format!("版本 {} 有子版本依赖，无法删除", version_id)
            ).into());
        }
        
        // 删除版本文件
        let version_dir = self.get_version_directory(version_id);
        if version_dir.exists() {
            fs::remove_dir_all(&version_dir)
                .with_context(|| format!("删除版本目录失败: {}", version_dir.display()))?;
        }
        
        // 从父版本中移除引用
        if let Some(parent_id) = &index_entry.parent_id {
            if let Some(mut parent_entry) = self.version_index.get_mut(parent_id) {
                parent_entry.child_ids.retain(|id| id != version_id);
            }
        }
        
        // 从索引中移除
        self.version_index.remove(version_id);
        
        // 持久化索引
        self.save_version_index().await?;
        
        Ok(())
    }
    
    /// 创建分支
    pub async fn create_branch(&self, name: String, base_version_id: String, description: String) -> Result<Branch> {
        // 检查分支是否已存在
        if self.branch_index.contains_key(&name) {
            return Err(VersionControlError::StorageError(
                format!("分支 {} 已存在", name)
            ).into());
        }
        
        // 检查基础版本是否存在
        if !self.version_index.contains_key(&base_version_id) {
            return Err(VersionControlError::VersionNotFound(base_version_id).into());
        }
        
        let now = Utc::now();
        let branch = Branch {
            name: name.clone(),
            description,
            base_version_id: base_version_id.clone(),
            head_version_id: base_version_id,
            created_at: now,
            updated_at: now,
            tags: vec![],
        };
        
        // 保存分支信息
        let branch_path = self.storage_root.join("branches").join(format!("{}.cbor", name));
        self.save_compressed_data(&branch_path, &branch, self.config.compression_level)?;
        
        // 更新索引
        self.branch_index.insert(name.clone(), branch.clone());
        self.save_branch_index().await?;
        
        Ok(branch)
    }
    
    /// 更新分支HEAD
    pub async fn update_branch_head(&self, branch_name: &str, new_head_version_id: String) -> Result<()> {
        let mut branch = self.branch_index.get_mut(branch_name)
            .ok_or_else(|| VersionControlError::BranchNotFound(branch_name.to_string()))?;
        
        // 检查新HEAD版本是否存在
        if !self.version_index.contains_key(&new_head_version_id) {
            return Err(VersionControlError::VersionNotFound(new_head_version_id).into());
        }
        
        branch.head_version_id = new_head_version_id;
        branch.updated_at = Utc::now();
        
        // 持久化分支信息
        let branch_path = self.storage_root.join("branches").join(format!("{}.cbor", branch_name));
        self.save_compressed_data(&branch_path, &*branch, self.config.compression_level)?;
        
        // 持久化索引
        self.save_branch_index().await?;
        
        Ok(())
    }
    
    /// 列出分支
    pub fn list_branches(&self) -> Vec<Branch> {
        self.branch_index.iter()
            .map(|entry| entry.value().clone())
            .collect()
    }
    
    /// 获取分支历史
    pub async fn get_branch_history(&self, branch_name: &str, limit: Option<usize>) -> Result<Vec<XmlVersion>> {
        let branch = self.branch_index.get(branch_name)
            .ok_or_else(|| VersionControlError::BranchNotFound(branch_name.to_string()))?;
        
        let mut versions = Vec::new();
        let mut current_version_id = Some(branch.head_version_id.clone());
        let max_count = limit.unwrap_or(usize::MAX);
        
        while let Some(version_id) = current_version_id.take() {
            if versions.len() >= max_count {
                break;
            }
            
            match self.load_version(&version_id).await {
                Ok(version) => {
                    current_version_id = version.parent_id.clone();
                    versions.push(version);
                }
                Err(_) => break, // 版本链断裂
            }
        }
        
        Ok(versions)
    }
    
    /// 重建版本快照（从增量历史重建完整XML）
    pub async fn rebuild_version(&self, version_id: &str) -> Result<Arc<Vec<u8>>> {
        // 检查缓存
        {
            let cache = self.rebuild_cache.read().await;
            if let Some(data) = cache.get(version_id) {
                return Ok(Arc::clone(data));
            }
        }
        
        // 获取版本重建路径
        let rebuild_path = self.get_rebuild_path(version_id).await?;
        
        // 从根版本或里程碑版本开始重建
        let mut current_data = self.load_base_snapshot(&rebuild_path[0]).await?;
        
        // 应用增量变更
        for version_id in rebuild_path.iter().skip(1) {
            let version = self.load_version(version_id).await?;
            if let Some(delta) = &version.delta {
                current_data = self.apply_delta(&current_data, delta)?;
            }
        }
        
        let result = Arc::new(current_data);
        
        // 更新缓存
        {
            let mut cache = self.rebuild_cache.write().await;
            
            // 缓存大小控制
            if cache.len() >= self.config.cache_size_mb {
                cache.clear(); // 简单清理策略
            }
            
            cache.insert(version_id.to_string(), Arc::clone(&result));
        }
        
        Ok(result)
    }
    
    /// 获取存储统计信息
    pub async fn get_storage_stats(&self) -> Result<StorageStats> {
        let mut total_size = 0u64;
        let mut original_size = 0u64;
        let mut branch_stats = Vec::new();
        
        // 统计各分支信息
        for branch_entry in self.branch_index.iter() {
            let branch = branch_entry.value();
            let history = self.get_branch_history(&branch.name, None).await?;
            
            let mut branch_size = 0u64;
            let mut branch_original_size = 0u64;
            
            for version in &history {
                branch_size += version.compression.compressed_size as u64;
                branch_original_size += version.compression.original_size as u64;
            }
            
            total_size += branch_size;
            original_size += branch_original_size;
            
            branch_stats.push(BranchStats {
                name: branch.name.clone(),
                version_count: history.len(),
                size_bytes: branch_size,
                last_updated: branch.updated_at,
            });
        }
        
        let oldest_version = self.version_index.iter()
            .map(|entry| entry.value().timestamp)
            .min();
            
        let newest_version = self.version_index.iter()
            .map(|entry| entry.value().timestamp)
            .max();
        
        Ok(StorageStats {
            total_versions: self.version_index.len(),
            total_branches: self.branch_index.len(),
            disk_usage_bytes: total_size,
            original_size_bytes: original_size,
            overall_compression_ratio: if original_size > 0 {
                total_size as f64 / original_size as f64
            } else {
                1.0
            },
            oldest_version,
            newest_version,
            branch_stats,
        })
    }
    
    /// 执行完整性检查
    pub async fn check_integrity(&self) -> Result<IntegrityReport> {
        let mut issues = Vec::new();
        let mut stats = IntegrityStats {
            checked_versions: 0,
            checked_branches: 0,
            checked_files: 0,
            total_issues: 0,
            issues_by_severity: HashMap::new(),
        };
        
        // 检查版本文件
        for entry in self.version_index.iter() {
            let version_id = entry.key();
            let index_entry = entry.value();
            stats.checked_versions += 1;
            
            // 检查元数据文件
            let metadata_path = Path::new(&index_entry.file_paths.metadata_path);
            stats.checked_files += 1;
            
            if !metadata_path.exists() {
                let issue = IntegrityIssue {
                    issue_type: IssueType::MissingFile,
                    description: format!("版本 {} 的元数据文件丢失: {}", version_id, metadata_path.display()),
                    version_id: Some(version_id.clone()),
                    severity: Severity::High,
                    auto_repairable: false,
                };
                issues.push(issue);
            } else {
                // 尝试加载以检查文件完整性
                if let Err(_) = self.load_compressed_data::<XmlVersion>(metadata_path) {
                    let issue = IntegrityIssue {
                        issue_type: IssueType::CorruptedFile,
                        description: format!("版本 {} 的元数据文件损坏: {}", version_id, metadata_path.display()),
                        version_id: Some(version_id.clone()),
                        severity: Severity::High,
                        auto_repairable: false,
                    };
                    issues.push(issue);
                }
            }
            
            // 检查增量文件
            if let Some(delta_path) = &index_entry.file_paths.delta_path {
                let path = Path::new(delta_path);
                stats.checked_files += 1;
                
                if !path.exists() {
                    let issue = IntegrityIssue {
                        issue_type: IssueType::MissingFile,
                        description: format!("版本 {} 的增量文件丢失: {}", version_id, path.display()),
                        version_id: Some(version_id.clone()),
                        severity: Severity::Medium,
                        auto_repairable: false,
                    };
                    issues.push(issue);
                }
            }
            
            // 检查版本链完整性
            if let Some(parent_id) = &index_entry.parent_id {
                if !self.version_index.contains_key(parent_id) {
                    let issue = IntegrityIssue {
                        issue_type: IssueType::BrokenVersionChain,
                        description: format!("版本 {} 的父版本 {} 不存在", version_id, parent_id),
                        version_id: Some(version_id.clone()),
                        severity: Severity::Critical,
                        auto_repairable: false,
                    };
                    issues.push(issue);
                }
            }
        }
        
        // 检查分支完整性
        for entry in self.branch_index.iter() {
            let branch_name = entry.key();
            let branch = entry.value();
            stats.checked_branches += 1;
            
            // 检查HEAD版本是否存在
            if !self.version_index.contains_key(&branch.head_version_id) {
                let issue = IntegrityIssue {
                    issue_type: IssueType::BranchReferenceError,
                    description: format!("分支 {} 的HEAD版本 {} 不存在", branch_name, branch.head_version_id),
                    version_id: None,
                    severity: Severity::High,
                    auto_repairable: false,
                };
                issues.push(issue);
            }
            
            // 检查基础版本是否存在
            if !self.version_index.contains_key(&branch.base_version_id) {
                let issue = IntegrityIssue {
                    issue_type: IssueType::BranchReferenceError,
                    description: format!("分支 {} 的基础版本 {} 不存在", branch_name, branch.base_version_id),
                    version_id: None,
                    severity: Severity::High,
                    auto_repairable: false,
                };
                issues.push(issue);
            }
        }
        
        // 统计问题
        stats.total_issues = issues.len();
        for issue in &issues {
            *stats.issues_by_severity.entry(issue.severity.clone()).or_insert(0) += 1;
        }
        
        let is_valid = issues.is_empty();
        let repair_suggestions = if !is_valid {
            vec![
                "运行存储修复工具".to_string(),
                "从备份恢复损坏的文件".to_string(),
                "重建版本索引".to_string(),
            ]
        } else {
            vec![]
        };
        
        Ok(IntegrityReport {
            is_valid,
            checked_at: Utc::now(),
            issues,
            repair_suggestions,
            stats,
        })
    }
    
    // 私有方法
    
    /// 获取版本目录路径
    fn get_version_directory(&self, version_id: &str) -> PathBuf {
        self.storage_root.join("versions").join(version_id)
    }
    
    /// 保存压缩数据
    fn save_compressed_data<T: Serialize>(&self, path: &Path, data: &T, level: i32) -> Result<()> {
        // 序列化为CBOR
        let mut cbor_data = Vec::new();
        ciborium::ser::into_writer(data, &mut cbor_data)
            .map_err(|e| VersionControlError::SerializationError(e.to_string()))?;
        
        // zstd压缩
        let compressed_data = encode_all(cbor_data.as_slice(), level)
            .map_err(|e| VersionControlError::CompressionError(e.to_string()))?;
        
        // 写入文件
        let mut file = BufWriter::new(File::create(path)?);
        file.write_all(&compressed_data)?;
        file.flush()?;
        
        Ok(())
    }
    
    /// 加载压缩数据
    fn load_compressed_data<T: for<'de> Deserialize<'de>>(&self, path: &Path) -> Result<T> {
        // 读取文件
        let mut file = BufReader::new(File::open(path)?);
        let mut compressed_data = Vec::new();
        file.read_to_end(&mut compressed_data)?;
        
        // zstd解压缩
        let cbor_data = decode_all(compressed_data.as_slice())
            .map_err(|e| VersionControlError::CompressionError(e.to_string()))?;
        
        // CBOR反序列化
        let data: T = ciborium::de::from_reader(cbor_data.as_slice())
            .map_err(|e| VersionControlError::SerializationError(e.to_string()))?;
        
        Ok(data)
    }
    
    /// 加载版本索引
    async fn load_indices(&mut self) -> Result<()> {
        // 加载版本索引
        let version_index_path = self.storage_root.join("indices").join("versions.cbor");
        if version_index_path.exists() {
            let index: HashMap<String, VersionIndexEntry> = self.load_compressed_data(&version_index_path)?;
            for (id, entry) in index {
                self.version_index.insert(id, entry);
            }
        }
        
        // 加载分支索引
        let branch_index_path = self.storage_root.join("indices").join("branches.cbor");
        if branch_index_path.exists() {
            let index: HashMap<String, Branch> = self.load_compressed_data(&branch_index_path)?;
            for (name, branch) in index {
                self.branch_index.insert(name, branch);
            }
        }
        
        Ok(())
    }
    
    /// 保存版本索引
    async fn save_version_index(&self) -> Result<()> {
        let index_path = self.storage_root.join("indices").join("versions.cbor");
        let index: HashMap<String, VersionIndexEntry> = self.version_index.iter()
            .map(|entry| (entry.key().clone(), entry.value().clone()))
            .collect();
        
        self.save_compressed_data(&index_path, &index, self.config.compression_level)?;
        Ok(())
    }
    
    /// 保存分支索引
    async fn save_branch_index(&self) -> Result<()> {
        let index_path = self.storage_root.join("indices").join("branches.cbor");
        let index: HashMap<String, Branch> = self.branch_index.iter()
            .map(|entry| (entry.key().clone(), entry.value().clone()))
            .collect();
        
        self.save_compressed_data(&index_path, &index, self.config.compression_level)?;
        Ok(())
    }
    
    /// 验证存储完整性
    async fn verify_storage_integrity(&self) -> Result<()> {
        let report = self.check_integrity().await?;
        if !report.is_valid {
            eprintln!("存储完整性检查发现 {} 个问题", report.stats.total_issues);
            for issue in &report.issues {
                if issue.severity == Severity::Critical {
                    return Err(VersionControlError::StorageError(
                        format!("严重完整性问题: {}", issue.description)
                    ).into());
                }
            }
        }
        Ok(())
    }
    
    /// 获取版本重建路径（从根/里程碑到目标版本的路径）
    async fn get_rebuild_path(&self, target_version_id: &str) -> Result<Vec<String>> {
        let mut path = Vec::new();
        let mut current_id = target_version_id.to_string();
        
        // 向上追溯到根版本或里程碑版本
        while let Some(index_entry) = self.version_index.get(&current_id) {
            path.push(current_id.clone());
            
            // 检查是否为根版本或里程碑版本
            if index_entry.version_type == VersionType::Root || 
               index_entry.version_type == VersionType::Milestone {
                break;
            }
            
            match &index_entry.parent_id {
                Some(parent_id) => current_id = parent_id.clone(),
                None => return Err(VersionControlError::BrokenVersionChain(target_version_id.to_string()).into()),
            }
        }
        
        // 反转路径（从根/里程碑到目标）
        path.reverse();
        Ok(path)
    }
    
    /// 加载基础快照（根版本或里程碑版本的完整快照）
    async fn load_base_snapshot(&self, _version_id: &str) -> Result<Vec<u8>> {
        // 这里应该与Phase 1的缓存系统集成
        // 暂时返回空数据作为占位符
        // TODO: 与xml_cache.rs集成，获取完整XML快照
        Ok(Vec::new())
    }
    
    /// 应用增量变更到XML数据
    fn apply_delta(&self, base_data: &[u8], _delta: &XmlDelta) -> Result<Vec<u8>> {
        // TODO: 实现XML增量应用逻辑
        // 这是Phase 3第二阶段的核心功能
        Ok(base_data.to_vec())
    }
}

impl Default for VersionStorage {
    fn default() -> Self {
        Self::new()
    }
}

/// 存储工具函数
pub mod utils {
    use super::*;
    
    /// 计算目录大小
    pub fn calculate_directory_size(dir: &Path) -> Result<u64> {
        let mut total = 0;
        
        if dir.is_dir() {
            for entry in fs::read_dir(dir)? {
                let entry = entry?;
                let path = entry.path();
                
                if path.is_dir() {
                    total += calculate_directory_size(&path)?;
                } else {
                    total += entry.metadata()?.len();
                }
            }
        }
        
        Ok(total)
    }
    
    /// 清理临时文件
    pub fn cleanup_temp_files(storage_root: &Path) -> Result<()> {
        let temp_dir = storage_root.join("temp");
        if temp_dir.exists() {
            fs::remove_dir_all(&temp_dir)?;
            fs::create_dir_all(&temp_dir)?;
        }
        Ok(())
    }
    
    /// 验证版本ID格式
    pub fn is_valid_version_id(version_id: &str) -> bool {
        version_id.starts_with('v') && 
        version_id.len() > 15 && 
        version_id.contains('-')
    }
    
    /// 验证分支名格式
    pub fn is_valid_branch_name(branch_name: &str) -> bool {
        !branch_name.is_empty() && 
        branch_name.len() <= 64 &&
        branch_name.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_')
    }
}