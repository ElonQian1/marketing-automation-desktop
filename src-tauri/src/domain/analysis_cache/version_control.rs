// src-tauri/src/domain/analysis_cache/version_control.rs
// module: analysis_cache | layer: domain | role: 版本控制核心数据结构和算法
// summary: XML缓存版本控制系统的核心类型定义和业务逻辑

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// XML 版本控制核心类型
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct XmlVersion {
    /// 版本唯一标识 (时间戳 + 哈希前缀)
    pub id: String,
    /// 父版本ID，支持分支结构
    pub parent_id: Option<String>,
    /// 关联的快照ID
    pub snapshot_id: String,
    /// 版本创建时间戳
    pub timestamp: DateTime<Utc>,
    /// 版本类型
    pub version_type: VersionType,
    /// 增量变更数据（非根版本）
    pub delta: Option<XmlDelta>,
    /// 版本元数据
    pub metadata: VersionMetadata,
    /// 压缩和存储信息
    pub compression: CompressionInfo,
}

/// 版本类型枚举
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum VersionType {
    /// 根版本（完整快照，分支起点）
    Root,
    /// 增量版本（基于父版本的变更）
    Incremental,
    /// 里程碑版本（周期性完整快照，优化重建性能）
    Milestone,
    /// 分支版本（从其他版本分叉）
    Branch,
    /// 标记版本（重要版本标记）
    Tag,
}

/// XML 增量变更数据
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct XmlDelta {
    /// 新增的节点
    pub added_nodes: Vec<DeltaNode>,
    /// 删除的节点XPath路径
    pub removed_nodes: Vec<String>,
    /// 修改的节点
    pub modified_nodes: Vec<NodeChange>,
    /// 移动的节点（优化：移动而非删除+新增）
    pub moved_nodes: Vec<NodeMove>,
    /// 变更统计信息
    pub stats: DeltaStats,
}

/// 增量节点信息
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct DeltaNode {
    /// 节点的XPath路径
    pub xpath: String,
    /// 节点文本内容
    pub content: Option<String>,
    /// 节点属性
    pub attributes: HashMap<String, String>,
    /// 父节点XPath
    pub parent_xpath: String,
    /// 插入位置索引
    pub insert_index: Option<usize>,
}

/// 节点变更信息
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct NodeChange {
    /// 节点XPath路径
    pub xpath: String,
    /// 内容变更
    pub content_change: Option<ContentChange>,
    /// 属性变更
    pub attribute_changes: HashMap<String, AttributeChange>,
    /// 变更类型
    pub change_type: ChangeType,
}

/// 内容变更
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct ContentChange {
    /// 原始内容
    pub old_content: Option<String>,
    /// 新内容
    pub new_content: Option<String>,
}

/// 属性变更
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct AttributeChange {
    /// 原始值
    pub old_value: Option<String>,
    /// 新值
    pub new_value: Option<String>,
}

/// 变更类型
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum ChangeType {
    /// 内容修改
    ContentModified,
    /// 属性修改
    AttributeModified,
    /// 内容和属性都修改
    Both,
}

/// 节点移动信息
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct NodeMove {
    /// 节点XPath
    pub xpath: String,
    /// 原父节点XPath
    pub old_parent_xpath: String,
    /// 新父节点XPath
    pub new_parent_xpath: String,
    /// 原位置索引
    pub old_index: usize,
    /// 新位置索引
    pub new_index: usize,
}

/// 增量统计信息
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DeltaStats {
    /// 新增节点数
    pub added_count: usize,
    /// 删除节点数
    pub removed_count: usize,
    /// 修改节点数
    pub modified_count: usize,
    /// 移动节点数
    pub moved_count: usize,
    /// 压缩前大小（字节）
    pub uncompressed_size: usize,
    /// 压缩后大小（字节）
    pub compressed_size: usize,
}

/// 版本元数据
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct VersionMetadata {
    /// 创建者标识
    pub author: String,
    /// 版本描述信息
    pub message: String,
    /// 版本标签
    pub tags: Vec<String>,
    /// 所属分支名称
    pub branch: String,
    /// 原始XML大小（字节）
    pub original_size_bytes: usize,
    /// 增量大小（字节）
    pub delta_size_bytes: usize,
    /// 节点总数
    pub node_count: usize,
    /// 自定义属性
    pub custom_properties: HashMap<String, String>,
}

/// 压缩信息
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CompressionInfo {
    /// 压缩算法
    pub algorithm: CompressionAlgorithm,
    /// 压缩级别 (1-22 for zstd)
    pub level: i32,
    /// 原始大小
    pub original_size: usize,
    /// 压缩后大小
    pub compressed_size: usize,
    /// 压缩比
    pub compression_ratio: f64,
}

/// 压缩算法枚举
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum CompressionAlgorithm {
    /// Zstandard 压缩（主要选择）
    Zstd,
    /// 无压缩
    None,
}

/// 版本控制配置
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct VersionControlConfig {
    /// 每分支最大版本数（0表示无限制）
    pub max_versions_per_branch: usize,
    /// 里程碑版本创建间隔（每N个增量版本）
    pub milestone_interval: usize,
    /// zstd 压缩级别 (1-22)
    pub compression_level: i32,
    /// 重建缓存大小限制（MB）
    pub cache_size_mb: usize,
    /// 是否启用并行重建
    pub enable_parallel_rebuild: bool,
    /// 自动清理旧版本
    pub auto_prune_enabled: bool,
    /// 保留的最小版本数（自动清理时）
    pub min_versions_to_keep: usize,
    /// Diff算法选择
    pub diff_algorithm: DiffAlgorithm,
    /// 存储根目录
    pub storage_root: String,
}

/// Diff算法类型
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Copy)]
pub enum DiffAlgorithm {
    /// 快速算法（适合小文件）
    Fast,
    /// 精确算法（适合大文件）
    Precise,
    /// 自适应选择
    Adaptive,
}

/// 分支信息
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Branch {
    /// 分支名称
    pub name: String,
    /// 分支描述
    pub description: String,
    /// 基础版本ID
    pub base_version_id: String,
    /// 当前HEAD版本ID
    pub head_version_id: String,
    /// 创建时间
    pub created_at: DateTime<Utc>,
    /// 最后更新时间
    pub updated_at: DateTime<Utc>,
    /// 分支标签
    pub tags: Vec<String>,
}

/// 版本索引条目
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct VersionIndexEntry {
    /// 版本ID
    pub version_id: String,
    /// 分支名称
    pub branch: String,
    /// 创建时间戳
    pub timestamp: DateTime<Utc>,
    /// 版本类型
    pub version_type: VersionType,
    /// 父版本ID
    pub parent_id: Option<String>,
    /// 子版本ID列表
    pub child_ids: Vec<String>,
    /// 文件路径信息
    pub file_paths: VersionFilePaths,
}

/// 版本文件路径
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct VersionFilePaths {
    /// 元数据文件路径
    pub metadata_path: String,
    /// 增量数据文件路径（如果有）
    pub delta_path: Option<String>,
    /// 完整快照文件路径（如果有）
    pub snapshot_path: Option<String>,
}

/// 存储统计信息
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct StorageStats {
    /// 总版本数
    pub total_versions: usize,
    /// 总分支数
    pub total_branches: usize,
    /// 占用磁盘空间（字节）
    pub disk_usage_bytes: u64,
    /// 原始数据总大小（字节）
    pub original_size_bytes: u64,
    /// 压缩比
    pub overall_compression_ratio: f64,
    /// 最老版本时间
    pub oldest_version: Option<DateTime<Utc>>,
    /// 最新版本时间
    pub newest_version: Option<DateTime<Utc>>,
    /// 分支统计
    pub branch_stats: Vec<BranchStats>,
}

/// 分支统计信息
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct BranchStats {
    /// 分支名称
    pub name: String,
    /// 版本数量
    pub version_count: usize,
    /// 占用空间（字节）
    pub size_bytes: u64,
    /// 最后更新时间
    pub last_updated: DateTime<Utc>,
}

/// 完整性检查报告
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct IntegrityReport {
    /// 检查是否通过
    pub is_valid: bool,
    /// 检查时间
    pub checked_at: DateTime<Utc>,
    /// 发现的问题
    pub issues: Vec<IntegrityIssue>,
    /// 修复建议
    pub repair_suggestions: Vec<String>,
    /// 检查统计
    pub stats: IntegrityStats,
}

/// 完整性问题
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct IntegrityIssue {
    /// 问题类型
    pub issue_type: IssueType,
    /// 问题描述
    pub description: String,
    /// 涉及的版本ID
    pub version_id: Option<String>,
    /// 问题严重程度
    pub severity: Severity,
    /// 是否可自动修复
    pub auto_repairable: bool,
}

/// 问题类型
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum IssueType {
    /// 缺失文件
    MissingFile,
    /// 损坏文件
    CorruptedFile,
    /// 索引不一致
    IndexInconsistency,
    /// 分支引用错误
    BranchReferenceError,
    /// 版本链断裂
    BrokenVersionChain,
    /// 孤立版本
    OrphanedVersion,
}

/// 问题严重程度
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum Severity {
    /// 低（不影响功能）
    Low,
    /// 中（部分功能受影响）
    Medium,
    /// 高（重要功能无法使用）
    High,
    /// 严重（系统不可用）
    Critical,
}

/// 完整性检查统计
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct IntegrityStats {
    /// 检查的版本数
    pub checked_versions: usize,
    /// 检查的分支数
    pub checked_branches: usize,
    /// 检查的文件数
    pub checked_files: usize,
    /// 发现的问题数
    pub total_issues: usize,
    /// 各严重程度问题数
    pub issues_by_severity: HashMap<Severity, usize>,
}

/// 默认配置实现
impl Default for VersionControlConfig {
    fn default() -> Self {
        Self {
            max_versions_per_branch: 100,      // 每分支最多100个版本
            milestone_interval: 10,             // 每10个版本创建一个里程碑
            compression_level: 6,               // zstd 中等压缩级别
            cache_size_mb: 256,                // 256MB 缓存
            enable_parallel_rebuild: true,      // 启用并行重建
            auto_prune_enabled: true,          // 启用自动清理
            min_versions_to_keep: 20,          // 最少保留20个版本
            diff_algorithm: DiffAlgorithm::Adaptive, // 自适应算法
            storage_root: "version_control".to_string(), // 默认存储目录
        }
    }
}

impl XmlVersion {
    /// 创建新的根版本
    pub fn new_root(snapshot_id: String, metadata: VersionMetadata) -> Self {
        let now = Utc::now();
        let id = Self::generate_version_id(&now, &snapshot_id);
        
        Self {
            id,
            parent_id: None,
            snapshot_id,
            timestamp: now,
            version_type: VersionType::Root,
            delta: None,
            metadata,
            compression: CompressionInfo::default(),
        }
    }
    
    /// 创建新的增量版本
    pub fn new_incremental(
        parent_id: String,
        snapshot_id: String,
        delta: XmlDelta,
        metadata: VersionMetadata,
    ) -> Self {
        let now = Utc::now();
        let id = Self::generate_version_id(&now, &snapshot_id);
        
        Self {
            id,
            parent_id: Some(parent_id),
            snapshot_id,
            timestamp: now,
            version_type: VersionType::Incremental,
            delta: Some(delta),
            metadata,
            compression: CompressionInfo::default(),
        }
    }
    
    /// 生成版本ID（时间戳 + 内容哈希前缀）
    fn generate_version_id(timestamp: &DateTime<Utc>, snapshot_id: &str) -> String {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        
        let mut hasher = DefaultHasher::new();
        timestamp.hash(&mut hasher);
        snapshot_id.hash(&mut hasher);
        
        let hash = hasher.finish();
        format!("v{}-{:x}", timestamp.format("%Y%m%d%H%M%S"), hash & 0xFFFF)
    }
    
    /// 检查是否为根版本
    pub fn is_root(&self) -> bool {
        self.version_type == VersionType::Root
    }
    
    /// 检查是否为里程碑版本
    pub fn is_milestone(&self) -> bool {
        self.version_type == VersionType::Milestone
    }
    
    /// 获取版本显示名称
    pub fn display_name(&self) -> String {
        if !self.metadata.tags.is_empty() {
            format!("{} ({})", self.id, self.metadata.tags.join(", "))
        } else {
            self.id.clone()
        }
    }
}

impl Default for CompressionInfo {
    fn default() -> Self {
        Self {
            algorithm: CompressionAlgorithm::Zstd,
            level: 6,
            original_size: 0,
            compressed_size: 0,
            compression_ratio: 1.0,
        }
    }
}

impl CompressionInfo {
    /// 更新压缩统计信息
    pub fn update_stats(&mut self, original_size: usize, compressed_size: usize) {
        self.original_size = original_size;
        self.compressed_size = compressed_size;
        self.compression_ratio = if original_size > 0 {
            compressed_size as f64 / original_size as f64
        } else {
            1.0
        };
    }
}

impl DeltaStats {
    /// 创建新的统计信息
    pub fn new() -> Self {
        Self {
            added_count: 0,
            removed_count: 0,
            modified_count: 0,
            moved_count: 0,
            uncompressed_size: 0,
            compressed_size: 0,
        }
    }
    
    /// 更新统计信息
    pub fn update(&mut self, delta: &XmlDelta) {
        self.added_count = delta.added_nodes.len();
        self.removed_count = delta.removed_nodes.len();
        self.modified_count = delta.modified_nodes.len();
        self.moved_count = delta.moved_nodes.len();
    }
    
    /// 获取总变更数
    pub fn total_changes(&self) -> usize {
        self.added_count + self.removed_count + self.modified_count + self.moved_count
    }
}

/// 版本控制错误类型
#[derive(Debug, thiserror::Error)]
pub enum VersionControlError {
    #[error("版本不存在: {0}")]
    VersionNotFound(String),
    
    #[error("分支不存在: {0}")]
    BranchNotFound(String),
    
    #[error("版本链断裂，无法重建版本: {0}")]
    BrokenVersionChain(String),
    
    #[error("存储错误: {0}")]
    StorageError(String),
    
    #[error("压缩错误: {0}")]
    CompressionError(String),
    
    #[error("反序列化错误: {0}")]
    SerializationError(String),
    
    #[error("配置错误: {0}")]
    ConfigError(String),
    
    #[error("并发操作冲突")]
    ConcurrencyConflict,
    
    #[error("磁盘空间不足")]
    InsufficientDiskSpace,
    
    #[error("文件系统错误: {0}")]
    FileSystemError(#[from] std::io::Error),
}