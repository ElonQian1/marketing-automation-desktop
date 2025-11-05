// src-tauri/src/domain/analysis_cache/xml_diff.rs
// module: analysis_cache | layer: domain | role: XML差异计算和增量生成算法
// summary: 高性能XML差异算法，支持快速和精确两种模式

use super::version_control::*;
use anyhow::Result;
use std::collections::{HashMap, HashSet, VecDeque};
use std::hash::{Hash, Hasher};
use xxhash_rust::xxh64::Xxh64;

/// XML差异算法实现
pub struct XmlDiffEngine {
    /// 算法配置
    config: DiffConfig,
    /// 节点哈希缓存
    node_hash_cache: HashMap<String, u64>,
}

/// 差异算法配置
#[derive(Clone, Debug)]
pub struct DiffConfig {
    /// 算法类型
    pub algorithm: DiffAlgorithm,
    /// 快速模式阈值（节点数）
    pub fast_mode_threshold: usize,
    /// 相似度阈值（0.0-1.0）
    pub similarity_threshold: f64,
    /// 最大比较深度
    pub max_comparison_depth: usize,
    /// 是否优化移动检测
    pub optimize_move_detection: bool,
    /// 是否启用并行处理
    pub enable_parallel: bool,
}

/// XML节点表示
#[derive(Clone, Debug, PartialEq)]
pub struct XmlNode {
    /// 节点标签名
    pub tag: String,
    /// 节点文本内容
    pub text: Option<String>,
    /// 节点属性
    pub attributes: HashMap<String, String>,
    /// 父节点XPath
    pub parent_xpath: String,
    /// 完整XPath路径
    pub xpath: String,
    /// 子节点索引
    pub child_index: usize,
    /// 内容哈希
    pub content_hash: u64,
}

/// 差异操作类型
#[derive(Clone, Debug, PartialEq)]
pub enum DiffOperation {
    /// 节点新增
    Insert(DeltaNode),
    /// 节点删除
    Delete(String), // xpath
    /// 节点修改
    Update(NodeChange),
    /// 节点移动
    Move(NodeMove),
    /// 无变化
    NoChange(String), // xpath
}

/// 差异结果
#[derive(Clone, Debug)]
pub struct DiffResult {
    /// 差异操作列表
    pub operations: Vec<DiffOperation>,
    /// 差异统计
    pub stats: DiffStats,
    /// 计算耗时（毫秒）
    pub duration_ms: u128,
}

/// 差异统计
#[derive(Clone, Debug)]
pub struct DiffStats {
    /// 总节点数（源）
    pub total_nodes_old: usize,
    /// 总节点数（目标）
    pub total_nodes_new: usize,
    /// 新增节点数
    pub insertions: usize,
    /// 删除节点数
    pub deletions: usize,
    /// 修改节点数
    pub modifications: usize,
    /// 移动节点数
    pub moves: usize,
    /// 无变化节点数
    pub unchanged: usize,
    /// 相似度得分
    pub similarity_score: f64,
}

impl Default for DiffConfig {
    fn default() -> Self {
        Self {
            algorithm: DiffAlgorithm::Adaptive,
            fast_mode_threshold: 1000,
            similarity_threshold: 0.8,
            max_comparison_depth: 10,
            optimize_move_detection: true,
            enable_parallel: true,
        }
    }
}

impl XmlDiffEngine {
    /// 创建新的差异引擎
    pub fn new(config: DiffConfig) -> Self {
        Self {
            config,
            node_hash_cache: HashMap::new(),
        }
    }
    
    /// 计算XML差异
    pub fn compute_diff(&mut self, old_xml: &str, new_xml: &str) -> Result<DiffResult> {
        let start_time = std::time::Instant::now();
        
        // 解析XML为节点树
        let old_nodes = self.parse_xml_nodes(old_xml)?;
        let new_nodes = self.parse_xml_nodes(new_xml)?;
        
        // 选择算法
        let algorithm = self.select_algorithm(&old_nodes, &new_nodes);
        
        // 执行差异计算
        let operations = match algorithm {
            DiffAlgorithm::Fast => self.compute_fast_diff(&old_nodes, &new_nodes)?,
            DiffAlgorithm::Precise => self.compute_precise_diff(&old_nodes, &new_nodes)?,
            DiffAlgorithm::Adaptive => {
                if old_nodes.len() + new_nodes.len() > self.config.fast_mode_threshold {
                    self.compute_fast_diff(&old_nodes, &new_nodes)?
                } else {
                    self.compute_precise_diff(&old_nodes, &new_nodes)?
                }
            }
        };
        
        // 统计差异
        let stats = self.calculate_stats(&old_nodes, &new_nodes, &operations);
        
        let duration = start_time.elapsed();
        
        Ok(DiffResult {
            operations,
            stats,
            duration_ms: duration.as_millis(),
        })
    }
    
    /// 应用差异到XML
    pub fn apply_diff(&self, base_xml: &str, delta: &XmlDelta) -> Result<String> {
        // TODO: 实现差异应用逻辑
        // 这是Phase 3第二阶段的重点功能
        Ok(base_xml.to_string())
    }
    
    /// 将差异操作转换为XmlDelta
    pub fn operations_to_delta(&self, operations: &[DiffOperation]) -> XmlDelta {
        let mut added_nodes = Vec::new();
        let mut removed_nodes = Vec::new();
        let mut modified_nodes = Vec::new();
        let mut moved_nodes = Vec::new();
        
        let mut stats = DeltaStats::new();
        
        for op in operations {
            match op {
                DiffOperation::Insert(node) => {
                    added_nodes.push(node.clone());
                    stats.added_count += 1;
                }
                DiffOperation::Delete(xpath) => {
                    removed_nodes.push(xpath.clone());
                    stats.removed_count += 1;
                }
                DiffOperation::Update(change) => {
                    modified_nodes.push(change.clone());
                    stats.modified_count += 1;
                }
                DiffOperation::Move(mv) => {
                    moved_nodes.push(mv.clone());
                    stats.moved_count += 1;
                }
                DiffOperation::NoChange(_) => {
                    // 无变化，不需要记录
                }
            }
        }
        
        XmlDelta {
            added_nodes,
            removed_nodes,
            modified_nodes,
            moved_nodes,
            stats,
        }
    }
    
    // 私有方法
    
    /// 选择最适合的算法
    fn select_algorithm(&self, old_nodes: &[XmlNode], new_nodes: &[XmlNode]) -> DiffAlgorithm {
        match &self.config.algorithm {
            DiffAlgorithm::Adaptive => {
                let total_nodes = old_nodes.len() + new_nodes.len();
                if total_nodes > self.config.fast_mode_threshold {
                    DiffAlgorithm::Fast
                } else {
                    DiffAlgorithm::Precise
                }
            }
            other => other.clone(),
        }
    }
    
    /// 快速差异算法（基于哈希比较）
    fn compute_fast_diff(&mut self, old_nodes: &[XmlNode], new_nodes: &[XmlNode]) -> Result<Vec<DiffOperation>> {
        let mut operations = Vec::new();
        
        // 构建哈希映射
        let mut old_hash_map: HashMap<u64, &XmlNode> = HashMap::new();
        let mut new_hash_map: HashMap<u64, &XmlNode> = HashMap::new();
        
        for node in old_nodes {
            old_hash_map.insert(node.content_hash, node);
        }
        
        for node in new_nodes {
            new_hash_map.insert(node.content_hash, node);
        }
        
        // 快速检测变更
        let old_hashes: HashSet<u64> = old_hash_map.keys().copied().collect();
        let new_hashes: HashSet<u64> = new_hash_map.keys().copied().collect();
        
        // 删除的节点
        for hash in old_hashes.difference(&new_hashes) {
            if let Some(node) = old_hash_map.get(hash) {
                operations.push(DiffOperation::Delete(node.xpath.clone()));
            }
        }
        
        // 新增的节点
        for hash in new_hashes.difference(&old_hashes) {
            if let Some(node) = new_hash_map.get(hash) {
                let delta_node = self.node_to_delta_node(node);
                operations.push(DiffOperation::Insert(delta_node));
            }
        }
        
        // 无变化的节点
        for hash in old_hashes.intersection(&new_hashes) {
            if let Some(old_node) = old_hash_map.get(hash) {
                if let Some(new_node) = new_hash_map.get(hash) {
                    // 检查位置是否变化（移动检测）
                    if self.config.optimize_move_detection && old_node.xpath != new_node.xpath {
                        let move_op = NodeMove {
                            xpath: new_node.xpath.clone(),
                            old_parent_xpath: old_node.parent_xpath.clone(),
                            new_parent_xpath: new_node.parent_xpath.clone(),
                            old_index: old_node.child_index,
                            new_index: new_node.child_index,
                        };
                        operations.push(DiffOperation::Move(move_op));
                    } else {
                        operations.push(DiffOperation::NoChange(old_node.xpath.clone()));
                    }
                }
            }
        }
        
        Ok(operations)
    }
    
    /// 精确差异算法（基于结构比较）
    fn compute_precise_diff(&mut self, old_nodes: &[XmlNode], new_nodes: &[XmlNode]) -> Result<Vec<DiffOperation>> {
        let mut operations = Vec::new();
        
        // 构建XPath映射
        let mut old_xpath_map: HashMap<String, &XmlNode> = HashMap::new();
        let mut new_xpath_map: HashMap<String, &XmlNode> = HashMap::new();
        
        for node in old_nodes {
            old_xpath_map.insert(node.xpath.clone(), node);
        }
        
        for node in new_nodes {
            new_xpath_map.insert(node.xpath.clone(), node);
        }
        
        let old_xpaths: HashSet<String> = old_xpath_map.keys().cloned().collect();
        let new_xpaths: HashSet<String> = new_xpath_map.keys().cloned().collect();
        
        // 删除的节点
        for xpath in old_xpaths.difference(&new_xpaths) {
            operations.push(DiffOperation::Delete(xpath.clone()));
        }
        
        // 新增的节点
        for xpath in new_xpaths.difference(&old_xpaths) {
            if let Some(node) = new_xpath_map.get(xpath) {
                let delta_node = self.node_to_delta_node(node);
                operations.push(DiffOperation::Insert(delta_node));
            }
        }
        
        // 可能修改的节点
        for xpath in old_xpaths.intersection(&new_xpaths) {
            if let (Some(old_node), Some(new_node)) = (old_xpath_map.get(xpath), new_xpath_map.get(xpath)) {
                if let Some(change) = self.detect_node_changes(old_node, new_node) {
                    operations.push(DiffOperation::Update(change));
                } else {
                    operations.push(DiffOperation::NoChange(xpath.clone()));
                }
            }
        }
        
        // 移动检测（通过内容哈希匹配）
        if self.config.optimize_move_detection {
            operations.extend(self.detect_moves(&old_xpath_map, &new_xpath_map)?);
        }
        
        Ok(operations)
    }
    
    /// 检测节点变更
    fn detect_node_changes(&self, old_node: &XmlNode, new_node: &XmlNode) -> Option<NodeChange> {
        let mut has_change = false;
        let mut content_change = None;
        let mut attribute_changes = HashMap::new();
        
        // 检查内容变更
        if old_node.text != new_node.text {
            content_change = Some(ContentChange {
                old_content: old_node.text.clone(),
                new_content: new_node.text.clone(),
            });
            has_change = true;
        }
        
        // 检查属性变更
        let old_attrs = &old_node.attributes;
        let new_attrs = &new_node.attributes;
        
        // 获取所有属性名
        let mut all_attr_names = HashSet::new();
        all_attr_names.extend(old_attrs.keys());
        all_attr_names.extend(new_attrs.keys());
        
        for attr_name in all_attr_names {
            let old_value = old_attrs.get(attr_name).cloned();
            let new_value = new_attrs.get(attr_name).cloned();
            
            if old_value != new_value {
                attribute_changes.insert(attr_name.clone(), AttributeChange {
                    old_value,
                    new_value,
                });
                has_change = true;
            }
        }
        
        if has_change {
            let change_type = match (content_change.is_some(), !attribute_changes.is_empty()) {
                (true, true) => ChangeType::Both,
                (true, false) => ChangeType::ContentModified,
                (false, true) => ChangeType::AttributeModified,
                (false, false) => return None, // 不应该发生
            };
            
            Some(NodeChange {
                xpath: new_node.xpath.clone(),
                content_change,
                attribute_changes,
                change_type,
            })
        } else {
            None
        }
    }
    
    /// 检测节点移动
    fn detect_moves(
        &self,
        old_map: &HashMap<String, &XmlNode>,
        new_map: &HashMap<String, &XmlNode>,
    ) -> Result<Vec<DiffOperation>> {
        let mut moves = Vec::new();
        
        // 通过内容哈希匹配可能移动的节点
        let mut old_hash_to_xpath: HashMap<u64, String> = HashMap::new();
        let mut new_hash_to_xpath: HashMap<u64, String> = HashMap::new();
        
        for node in old_map.values() {
            old_hash_to_xpath.insert(node.content_hash, node.xpath.clone());
        }
        
        for node in new_map.values() {
            new_hash_to_xpath.insert(node.content_hash, node.xpath.clone());
        }
        
        // 查找相同内容哈希但XPath不同的节点
        for (hash, old_xpath) in &old_hash_to_xpath {
            if let Some(new_xpath) = new_hash_to_xpath.get(hash) {
                if old_xpath != new_xpath {
                    if let (Some(old_node), Some(new_node)) = (old_map.get(old_xpath), new_map.get(new_xpath)) {
                        let move_op = NodeMove {
                            xpath: new_xpath.clone(),
                            old_parent_xpath: old_node.parent_xpath.clone(),
                            new_parent_xpath: new_node.parent_xpath.clone(),
                            old_index: old_node.child_index,
                            new_index: new_node.child_index,
                        };
                        moves.push(DiffOperation::Move(move_op));
                    }
                }
            }
        }
        
        Ok(moves)
    }
    
    /// 解析XML为节点列表
    fn parse_xml_nodes(&mut self, xml: &str) -> Result<Vec<XmlNode>> {
        // TODO: 实际的XML解析逻辑
        // 这里提供一个简化的实现框架
        let mut nodes = Vec::new();
        
        // 使用简单的正则表达式或XML解析库
        // 为每个节点生成XPath和内容哈希
        
        // 占位符实现
        let root_node = XmlNode {
            tag: "root".to_string(),
            text: Some(xml.to_string()),
            attributes: HashMap::new(),
            parent_xpath: "".to_string(),
            xpath: "/root".to_string(),
            child_index: 0,
            content_hash: self.calculate_content_hash("root", xml, &HashMap::new()),
        };
        
        nodes.push(root_node);
        Ok(nodes)
    }
    
    /// 计算节点内容哈希
    fn calculate_content_hash(&mut self, tag: &str, text: &str, attributes: &HashMap<String, String>) -> u64 {
        let cache_key = format!("{}:{}:{:?}", tag, text, attributes);
        
        if let Some(&hash) = self.node_hash_cache.get(&cache_key) {
            return hash;
        }
        
        let mut hasher = Xxh64::new(0);
        tag.hash(&mut hasher);
        text.hash(&mut hasher);
        
        // 按键排序以确保一致的哈希
        let mut sorted_attrs: Vec<_> = attributes.iter().collect();
        sorted_attrs.sort_by_key(|(k, _)| *k);
        
        for (key, value) in sorted_attrs {
            key.hash(&mut hasher);
            value.hash(&mut hasher);
        }
        
        let hash = hasher.finish();
        self.node_hash_cache.insert(cache_key, hash);
        hash
    }
    
    /// 将XmlNode转换为DeltaNode
    fn node_to_delta_node(&self, node: &XmlNode) -> DeltaNode {
        DeltaNode {
            xpath: node.xpath.clone(),
            content: node.text.clone(),
            attributes: node.attributes.clone(),
            parent_xpath: node.parent_xpath.clone(),
            insert_index: Some(node.child_index),
        }
    }
    
    /// 计算差异统计
    fn calculate_stats(&self, old_nodes: &[XmlNode], new_nodes: &[XmlNode], operations: &[DiffOperation]) -> DiffStats {
        let mut stats = DiffStats {
            total_nodes_old: old_nodes.len(),
            total_nodes_new: new_nodes.len(),
            insertions: 0,
            deletions: 0,
            modifications: 0,
            moves: 0,
            unchanged: 0,
            similarity_score: 0.0,
        };
        
        for op in operations {
            match op {
                DiffOperation::Insert(_) => stats.insertions += 1,
                DiffOperation::Delete(_) => stats.deletions += 1,
                DiffOperation::Update(_) => stats.modifications += 1,
                DiffOperation::Move(_) => stats.moves += 1,
                DiffOperation::NoChange(_) => stats.unchanged += 1,
            }
        }
        
        // 计算相似度得分
        let total_changes = stats.insertions + stats.deletions + stats.modifications;
        let max_nodes = std::cmp::max(old_nodes.len(), new_nodes.len());
        
        if max_nodes > 0 {
            stats.similarity_score = 1.0 - (total_changes as f64 / max_nodes as f64);
        } else {
            stats.similarity_score = 1.0;
        }
        
        stats
    }
}

/// XML差异工具函数
pub mod diff_utils {
    use super::*;
    
    /// 优化差异操作序列
    pub fn optimize_operations(operations: Vec<DiffOperation>) -> Vec<DiffOperation> {
        // TODO: 实现操作序列优化
        // 1. 合并连续的插入/删除操作
        // 2. 优化移动操作顺序
        // 3. 消除冗余操作
        operations
    }
    
    /// 验证差异操作的正确性
    pub fn validate_operations(operations: &[DiffOperation]) -> Result<()> {
        // TODO: 验证操作序列的一致性
        // 1. 检查XPath格式
        // 2. 验证父子关系
        // 3. 检查操作冲突
        Ok(())
    }
    
    /// 计算差异操作的估计大小
    pub fn estimate_delta_size(operations: &[DiffOperation]) -> usize {
        let mut size = 0;
        
        for op in operations {
            size += match op {
                DiffOperation::Insert(node) => {
                    node.xpath.len() + 
                    node.content.as_ref().map_or(0, |c| c.len()) +
                    node.attributes.iter().map(|(k, v)| k.len() + v.len()).sum::<usize>()
                }
                DiffOperation::Delete(xpath) => xpath.len(),
                DiffOperation::Update(change) => {
                    change.xpath.len() +
                    change.content_change.as_ref().map_or(0, |c| {
                        c.old_content.as_ref().map_or(0, |s| s.len()) +
                        c.new_content.as_ref().map_or(0, |s| s.len())
                    }) +
                    change.attribute_changes.iter().map(|(k, v)| {
                        k.len() + 
                        v.old_value.as_ref().map_or(0, |s| s.len()) +
                        v.new_value.as_ref().map_or(0, |s| s.len())
                    }).sum::<usize>()
                }
                DiffOperation::Move(mv) => {
                    mv.xpath.len() + mv.old_parent_xpath.len() + mv.new_parent_xpath.len()
                }
                DiffOperation::NoChange(_) => 0, // 不占用存储空间
            };
        }
        
        size
    }
}