// src-tauri/src/domain/analysis_cache/mod.rs
// module: analysis_cache | layer: domain | role: cache
// summary: XML分析结果缓存系统，避免重复解析

use dashmap::DashMap;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

pub mod api;
pub mod types;
pub mod lifecycle; // 🚀 Phase 2: 引用计数与生命周期管理
// pub mod rebuild; // 🚀 Phase 2: 自愈重建机制 (待实现)

// 🚀 Phase 3: 版本控制系统模块
pub mod version_control;   // 核心数据结构和类型定义
pub mod version_storage;   // 存储层实现
pub mod xml_diff;         // XML差异算法
pub mod xml_rebuilder;    // XML差异应用和重建引擎
pub mod version_commands; // Tauri 命令接口

// 测试模块
#[cfg(test)]
pub mod tests;

// 核心类型定义
pub type SnapshotId = String; // XML内容哈希
pub type SubtreeKey = (SnapshotId, String); // (快照ID, 绝对XPath)

// 全局缓存实例
pub static DOM_CACHE: Lazy<DashMap<SnapshotId, DomIndex>> = Lazy::new(|| DashMap::new());
pub static SUBTREE_CACHE: Lazy<DashMap<SubtreeKey, SubtreeMetrics>> = Lazy::new(|| DashMap::new());

// 🚀 Phase 2: 引用计数管理
pub static SNAPSHOT_REFS: Lazy<DashMap<SnapshotId, usize>> = Lazy::new(|| DashMap::new());

/// DOM索引结构（XML解析后的快速访问结构）
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DomIndex {
    pub xml_content: String,
    pub element_count: usize,
    pub created_at: i64,
    // 后续扩展：节点映射表、XPath索引等
    pub metadata: HashMap<String, String>,
}

/// 子树分析结果（包含所有策略所需的指标）
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SubtreeMetrics {
    pub element_path: String,
    pub element_text: Option<String>,
    pub element_type: Option<String>,
    pub resource_id: Option<String>,
    pub class_name: Option<String>,
    pub content_desc: Option<String>,
    pub bounds: Option<String>,
    
    // 策略评分相关
    pub uniqueness_score: f32,
    pub stability_score: f32,
    pub container_info: Option<ContainerInfo>,
    
    // 结构匹配参数
    pub available_fields: Vec<String>,
    pub suggested_strategy: String,
    pub confidence: f32,
    
    // 元数据
    pub computed_at: i64,
    pub version: String,
}

/// 容器限域信息
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ContainerInfo {
    pub container_xpath: Option<String>,
    pub container_type: String,
    pub item_index: Option<usize>,
    pub total_items: Option<usize>,
}

impl DomIndex {
    pub fn new(xml_content: String) -> Self {
        Self {
            element_count: xml_content.matches('<').count(),
            xml_content,
            created_at: chrono::Utc::now().timestamp(),
            metadata: HashMap::new(),
        }
    }
}

impl SubtreeMetrics {
    pub fn new(element_path: String) -> Self {
        Self {
            element_path,
            element_text: None,
            element_type: None,
            resource_id: None,
            class_name: None,
            content_desc: None,
            bounds: None,
            uniqueness_score: 0.0,
            stability_score: 0.0,
            container_info: None,
            available_fields: Vec::new(),
            suggested_strategy: "self_anchor".to_string(),
            confidence: 0.5,
            computed_at: chrono::Utc::now().timestamp(),
            version: "v2.0.0".to_string(),
        }
    }
}