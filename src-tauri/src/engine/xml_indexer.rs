// src-tauri/src/engine/xml_indexer.rs
// module: decision-chain | layer: engine | role: XML快速索引与检索
// summary: 按id/class/text建立索引桶，支持容器限定的高效搜索

use std::collections::HashMap;
use anyhow::Result;
use regex::Regex;
use once_cell::sync::Lazy;

use super::strategy_plugin::ExecutionEnvironment;
use crate::services::ui_reader_service::UIElement;
use crate::commands::run_step_v2::{MatchCandidate, Bounds};

// 🎯 性能优化：预编译正则表达式
static NODE_REGEX: Lazy<Regex> = Lazy::new(|| Regex::new(r#"<node[^>]*>"#).unwrap());
static BOUNDS_REGEX: Lazy<Regex> = Lazy::new(|| Regex::new(r#"\[(\d+),(\d+)\]\[(\d+),(\d+)\]"#).unwrap());

// 📊 XML索引结构
pub struct XmlIndexer {
    /// ResourceId索引: resource_id -> 节点列表
    pub resource_id_index: HashMap<String, Vec<IndexedNode>>,
    
    /// 类名索引: class_name -> 节点列表  
    pub class_name_index: HashMap<String, Vec<IndexedNode>>,
    
    /// 文本索引: text_content -> 节点列表
    pub text_index: HashMap<String, Vec<IndexedNode>>,
    
    /// ContentDesc索引: content_desc -> 节点列表
    pub content_desc_index: HashMap<String, Vec<IndexedNode>>,
    
    /// 容器内节点索引: container_xpath -> 子节点列表
    pub container_index: HashMap<String, Vec<IndexedNode>>,
    
    /// 全部节点列表（用于全局检索）
    pub all_nodes: Vec<IndexedNode>,
    
    /// 🎯 原始XML文本（用于支持 index_path 定位）
    pub raw_xml: String,
}

// 🏷️ 索引节点结构
#[derive(Debug, Clone, PartialEq)]
pub struct IndexedNode {
    pub id: String,
    pub element: UIElement,
    pub bounds: (i32, i32, i32, i32),
    pub xpath: String,
    pub parent_xpath: Option<String>,
    pub container_xpath: Option<String>, // 所属容器的XPath
    
    // 🎯 新增：树结构信息（用于支持 index_path 定位）
    pub parent_index: Option<usize>,     // 父节点在 all_nodes 中的索引
    pub children_indices: Vec<usize>,     // 子节点在 all_nodes 中的索引列表
    pub depth: usize,                     // 节点深度（根节点为0）
}

impl XmlIndexer {
    /// 从UI XML构建索引
    pub fn build_from_xml(ui_xml: &str) -> Result<Self> {
        let mut indexer = Self {
            resource_id_index: HashMap::new(),
            class_name_index: HashMap::new(),
            text_index: HashMap::new(),
            content_desc_index: HashMap::new(),
            container_index: HashMap::new(),
            all_nodes: Vec::new(),
            raw_xml: ui_xml.to_string(), // 🎯 保存原始XML
        };
        
        tracing::info!("🔧 开始构建XML索引...");
        let start_time = std::time::Instant::now();
        
        // 🎯 性能优化：使用预编译的正则表达式
        for (index, node_match) in NODE_REGEX.find_iter(ui_xml).enumerate() {
            let node_str = node_match.as_str();
            
            if let Ok(indexed_node) = Self::parse_node_to_indexed(node_str, index) {
                // 添加到各种索引
                indexer.add_to_indexes(&indexed_node);
                indexer.all_nodes.push(indexed_node);
            }
        }
        
        // 🎯 构建父子关系树（性能优化关键）
        indexer.build_parent_child_relationships();
        
        let elapsed = start_time.elapsed();
        tracing::info!("✅ XML索引构建完成: {} 个节点，耗时 {}ms", 
                      indexer.all_nodes.len(), elapsed.as_millis());
        
        Ok(indexer)
    }
    
    /// 解析单个节点为索引节点
    fn parse_node_to_indexed(node_str: &str, index: usize) -> Result<IndexedNode> {
        let id = format!("node_{}", index);
        
        // 提取属性（简化实现）
        let resource_id = Self::extract_attribute(node_str, "resource-id");
        let text = Self::extract_attribute(node_str, "text");
        let class_name = Self::extract_attribute(node_str, "class");
        let content_desc = Self::extract_attribute(node_str, "content-desc");
        let bounds_str = Self::extract_attribute(node_str, "bounds");
        let clickable = Self::extract_attribute(node_str, "clickable");
        let enabled = Self::extract_attribute(node_str, "enabled");
        let package = Self::extract_attribute(node_str, "package");
        
        // 解析bounds
        let bounds = if let Some(bounds_str) = &bounds_str {
            match Self::parse_bounds(bounds_str) {
                Ok(b) => {
                    // 🎯 性能优化：降低日志级别为 trace（避免逐节点打印）
                    #[cfg(feature = "trace_xml_bounds")]
                    tracing::trace!("✅ [XmlIndexer] 成功解析bounds: '{}' -> {:?}", bounds_str, b);
                    b
                }
                Err(e) => {
                    tracing::error!("❌ [XmlIndexer] 解析bounds失败: '{}', 错误: {}, 使用默认值", bounds_str, e);
                    (0, 0, 100, 100)
                }
            }
        } else {
            // 🎯 性能优化：降低日志级别为 trace
            #[cfg(feature = "trace_xml_bounds")]
            tracing::trace!("⚠️ [XmlIndexer] 节点无bounds属性，使用默认值");
            (0, 0, 100, 100)
        };
        
        // 生成简化的xpath（实际应更精确）
        let xpath = format!("//*[@class='{}'][{}]", 
                          class_name.as_deref().unwrap_or("unknown"), 
                          index + 1);
        
        let element = UIElement {
            text,
            resource_id,
            class: class_name,
            package,
            content_desc,
            clickable: clickable.and_then(|s| s.parse().ok()),
            enabled: enabled.and_then(|s| s.parse().ok()),
            bounds: bounds_str,
        };
        
        Ok(IndexedNode {
            id,
            element,
            bounds,
            xpath,
            parent_xpath: None, // 需要构建父子关系时填充
            container_xpath: None, // 需要识别容器时填充
            // 🎯 树结构信息（初始化为默认值，后续构建树时填充）
            parent_index: None,
            children_indices: Vec::new(),
            depth: 0,
        })
    }
    
    /// 添加节点到各种索引
    fn add_to_indexes(&mut self, node: &IndexedNode) {
        // ResourceId索引
        if let Some(resource_id) = &node.element.resource_id {
            self.resource_id_index.entry(resource_id.clone())
                .or_insert_with(Vec::new)
                .push(node.clone());
        }
        
        // 类名索引
        if let Some(class_name) = &node.element.class {
            self.class_name_index.entry(class_name.clone())
                .or_insert_with(Vec::new)
                .push(node.clone());
        }
        
        // 文本索引
        if let Some(text) = &node.element.text {
            if !text.trim().is_empty() {
                self.text_index.entry(text.clone())
                    .or_insert_with(Vec::new)
                    .push(node.clone());
            }
        }
        
        // ContentDesc索引
        if let Some(content_desc) = &node.element.content_desc {
            if !content_desc.trim().is_empty() {
                self.content_desc_index.entry(content_desc.clone())
                    .or_insert_with(Vec::new)
                    .push(node.clone());
            }
        }
    }
    
    /// 按ResourceId搜索
    pub fn find_by_resource_id(&self, resource_id: &str) -> Vec<&IndexedNode> {
        self.resource_id_index.get(resource_id)
            .map(|nodes| nodes.iter().collect())
            .unwrap_or_default()
    }
    
    /// 按类名搜索
    pub fn find_by_class_name(&self, class_name: &str) -> Vec<&IndexedNode> {
        self.class_name_index.get(class_name)
            .map(|nodes| nodes.iter().collect())
            .unwrap_or_default()
    }
    
    /// 按文本搜索（支持I18N别名）
    pub fn find_by_text(&self, text_aliases: &[String]) -> Vec<&IndexedNode> {
        let mut results = Vec::new();
        
        for alias in text_aliases {
            // 精确匹配
            if let Some(nodes) = self.text_index.get(alias) {
                results.extend(nodes.iter());
            }
            
            // 模糊匹配（包含）
            for (indexed_text, nodes) in &self.text_index {
                if indexed_text.contains(alias) || alias.contains(indexed_text) {
                    results.extend(nodes.iter());
                }
            }
        }
        
        // 去重
        results.sort_by_key(|node| &node.id);
        results.dedup_by_key(|node| &node.id);
        results
    }
    
    /// 容器限定搜索：在指定容器内搜索
    pub fn find_in_container(&self, container_xpath: &str, predicate: impl Fn(&IndexedNode) -> bool) -> Vec<&IndexedNode> {
        // 简化实现：遍历所有节点检查是否在容器内
        self.all_nodes.iter()
            .filter(|node| {
                // 检查节点是否在指定容器内（简化判断）
                node.xpath.starts_with(container_xpath) && predicate(node)
            })
            .collect()
    }
    
    /// 复合搜索：多条件AND组合
    pub fn complex_search(&self, 
        resource_id: Option<&str>,
        class_name: Option<&str>, 
        text_aliases: Option<&[String]>,
        container_xpath: Option<&str>
    ) -> Vec<&IndexedNode> {
        let mut candidates: Vec<&IndexedNode> = Vec::new();
        let mut first_condition = true;
        
        // ResourceId条件
        if let Some(rid) = resource_id {
            let nodes = self.find_by_resource_id(rid);
            if first_condition {
                candidates = nodes;
                first_condition = false;
            } else {
                candidates.retain(|node| nodes.contains(node));
            }
        }
        
        // 类名条件
        if let Some(class) = class_name {
            let nodes = self.find_by_class_name(class);
            if first_condition {
                candidates = nodes;
                first_condition = false;
            } else {
                candidates.retain(|node| nodes.contains(node));
            }
        }
        
        // 文本条件
        if let Some(aliases) = text_aliases {
            let nodes = self.find_by_text(aliases);
            if first_condition {
                candidates = nodes;
                first_condition = false;
            } else {
                candidates.retain(|node| nodes.contains(node));
            }
        }
        
        // 容器限定
        if let Some(container) = container_xpath {
            candidates.retain(|node| node.xpath.starts_with(container));
        }
        
        candidates
    }
    
    /// 按xpath查找节点索引 (支持StepCard快照恢复)
    /// 
    /// 支持多种XPath格式:
    /// 1. 前端临时ID格式: `//element_32` 或 `element_32`
    /// 2. 标准XPath格式: `//*[@class='FrameLayout'][32]`
    /// 
    /// # Arguments
    /// * `xpath` - 要查找的xpath路径
    /// 
    /// # Returns
    /// * `Some(usize)` - 节点在all_nodes中的索引
    /// * `None` - 未找到匹配节点
    pub fn find_node_by_xpath(&self, xpath: &str) -> Option<usize> {
        // 🔥 修复：支持前端生成的 element_N 格式
        // 前端解析XML时生成临时ID: element_0, element_1, element_2...
        // 这个ID对应节点在all_nodes中的索引
        
        let trimmed = xpath.trim_start_matches("//").trim();
        
        // 尝试解析 element_N 格式
        if trimmed.starts_with("element_") {
            if let Some(index_str) = trimmed.strip_prefix("element_") {
                if let Ok(index) = index_str.parse::<usize>() {
                    // 验证索引有效性
                    if index < self.all_nodes.len() {
                        tracing::debug!("✅ [XmlIndexer] 通过前端ID找到节点: {} -> index {}", xpath, index);
                        return Some(index);
                    } else {
                        tracing::warn!("⚠️ [XmlIndexer] 索引超出范围: {} (总节点数: {})", 
                                     index, self.all_nodes.len());
                        return None;
                    }
                }
            }
        }
        
        // 回退：标准XPath精确匹配
        let position = self.all_nodes.iter()
            .position(|node| node.xpath == xpath);
        
        if position.is_none() {
            tracing::warn!("❌ [XmlIndexer] 未找到匹配节点: {}", xpath);
        }
        
        position
    }

    /// 🎯 通过绝对下标链查找节点（推荐使用，比 xpath 更可靠）
    /// 
    /// # Arguments
    /// * `index_path` - 从根到目标节点的下标链，例如 [0, 0, 0, 5, 2]
    /// 
    /// # Returns
    /// * `Some(usize)` - 节点在 all_nodes 中的索引
    /// * `None` - 路径无效或节点不存在
    /// 
    /// # Example
    /// ```rust
    /// let indexer = XmlIndexer::build_from_xml(xml)?;
    /// if let Some(idx) = indexer.find_node_by_index_path(&[0, 0, 5, 2]) {
    ///     let element = &indexer.all_nodes[idx];
    ///     // 使用 element...
    /// }
    /// ```
    pub fn find_node_by_index_path(&self, index_path: &[usize]) -> Option<usize> {
        use crate::engine::index_path_locator::find_node_index_by_index_path;
        
        if index_path.is_empty() {
            tracing::warn!("⚠️ [XmlIndexer] index_path 为空");
            return None;
        }

        match find_node_index_by_index_path(&self.raw_xml, index_path) {
            Ok(idx) => {
                if idx < self.all_nodes.len() {
                    tracing::debug!(
                        "✅ [XmlIndexer] 通过 index_path 找到节点: {:?} -> index {}",
                        index_path,
                        idx
                    );
                    Some(idx)
                } else {
                    tracing::error!(
                        "❌ [XmlIndexer] index_path 返回的索引超出 all_nodes 范围: {} >= {}",
                        idx,
                        self.all_nodes.len()
                    );
                    None
                }
            }
            Err(err) => {
                tracing::warn!(
                    "⚠️ [XmlIndexer] find_node_by_index_path 失败: index_path={:?}, err={}",
                    index_path,
                    err
                );
                None
            }
        }
    }

    /// 🎯 通过 index_path 直接获取 UIElement 引用（便捷方法）
    /// 
    /// # Arguments
    /// * `index_path` - 从根到目标节点的下标链
    /// 
    /// # Returns
    /// * `Some(&IndexedNode)` - 节点引用
    /// * `None` - 路径无效或节点不存在
    pub fn find_element_by_index_path(&self, index_path: &[usize]) -> Option<&IndexedNode> {
        self.find_node_by_index_path(index_path)
            .and_then(|idx| self.all_nodes.get(idx))
    }
    
    
    /// 工具方法：提取XML属性
    /// 🎯 性能优化版：提取XML属性（手动解析，避免Regex编译开销）
    fn extract_attribute(node_str: &str, attr_name: &str) -> Option<String> {
        // 查找属性名位置
        let search_pattern = format!("{}=\"", attr_name);
        if let Some(start_pos) = node_str.find(&search_pattern) {
            let value_start = start_pos + search_pattern.len();
            // 查找结束引号
            if let Some(end_pos) = node_str[value_start..].find('"') {
                return Some(node_str[value_start..value_start + end_pos].to_string());
            }
        }
        None
    }
    
    /// 工具方法：解析bounds
    fn parse_bounds(bounds_str: &str) -> Result<(i32, i32, i32, i32)> {
        // 🎯 性能优化：使用预编译的正则表达式
        if let Some(captures) = BOUNDS_REGEX.captures(bounds_str) {
            let left = captures.get(1).unwrap().as_str().parse()?;
            let top = captures.get(2).unwrap().as_str().parse()?;
            let right = captures.get(3).unwrap().as_str().parse()?;
            let bottom = captures.get(4).unwrap().as_str().parse()?;
            return Ok((left, top, right, bottom));
        }
        Err(anyhow::anyhow!("Invalid bounds format: {}", bounds_str))
    }

    /// 🎯 构建父子关系树（性能优化关键）
    /// 
    /// 通过XPath层级关系一次性构建所有节点的parent_index和children_indices，
    /// 避免后续递归调用时重复的O(N)遍历。
    /// 
    /// 复杂度: O(N²) 一次性构建，后续查询 O(1)
    fn build_parent_child_relationships(&mut self) {
        let start_time = std::time::Instant::now();
        tracing::debug!("🌲 [XmlIndexer] 开始构建父子关系树...");
        
        // 为每个节点找到其父节点和子节点
        for i in 0..self.all_nodes.len() {
            let current_xpath = self.all_nodes[i].xpath.clone();
            let current_level = current_xpath.matches('/').count();
            
            // 查找父节点
            for j in 0..self.all_nodes.len() {
                if i == j { continue; }
                
                let candidate_xpath = &self.all_nodes[j].xpath;
                let candidate_level = candidate_xpath.matches('/').count();
                
                // 如果候选节点层级比当前节点低1，且当前xpath以候选xpath开头，则是父节点
                if candidate_level == current_level - 1 && current_xpath.starts_with(candidate_xpath) {
                    self.all_nodes[i].parent_index = Some(j);
                    self.all_nodes[i].depth = candidate_level + 1;
                    break; // 找到父节点后退出
                }
            }
        }
        
        // 基于parent_index反向构建children_indices
        let mut children_map: HashMap<usize, Vec<usize>> = HashMap::new();
        for (child_idx, node) in self.all_nodes.iter().enumerate() {
            if let Some(parent_idx) = node.parent_index {
                children_map.entry(parent_idx)
                    .or_insert_with(Vec::new)
                    .push(child_idx);
            }
        }
        
        // 将children_map应用到all_nodes
        for (parent_idx, children) in children_map {
            if parent_idx < self.all_nodes.len() {
                self.all_nodes[parent_idx].children_indices = children;
            }
        }
        
        let elapsed = start_time.elapsed();
        tracing::info!("✅ [XmlIndexer] 父子关系树构建完成，耗时 {}ms", elapsed.as_millis());
    }
}

/// 高效搜索接口封装
pub struct SearchInterface<'a> {
    indexer: &'a XmlIndexer,
}

impl<'a> SearchInterface<'a> {
    pub fn new(indexer: &'a XmlIndexer) -> Self {
        Self { indexer }
    }
    
    /// 智能搜索：根据策略变体自动选择最优搜索路径
    pub fn smart_search(&self, variant: &crate::commands::run_step_v2::StrategyVariant) -> Vec<MatchCandidate> {
        let mut results = Vec::new();
        
        match variant.kind {
            crate::commands::run_step_v2::VariantKind::SelfId => {
                // 直接ResourceId搜索
                if let Some(self_selector) = &variant.selectors.self_ {
                    if let Some(resource_id) = &self_selector.resource_id {
                        let nodes = self.indexer.find_by_resource_id(resource_id);
                        results = self.nodes_to_candidates(nodes, "SelfId");
                    }
                }
            },
            crate::commands::run_step_v2::VariantKind::RegionTextToParent => {
                // 容器内文本搜索 + 父节点提升
                if let (Some(container_xpath), Some(child_selector)) = 
                    (&variant.container_xpath, &variant.selectors.child) {
                    
                    if let Some(text_matcher) = &child_selector.text {
                        let default_aliases = vec![text_matcher.equals.clone().unwrap_or_default()];
                        let aliases = text_matcher.in_list.as_ref().unwrap_or(&default_aliases);
                        
                        let container_nodes = self.indexer.find_in_container(
                            container_xpath, 
                            |node| self.matches_text_aliases(&node.element.text, aliases)
                        );
                        
                        results = self.nodes_to_candidates(container_nodes, "RegionTextToParent");
                    }
                }
            },
            _ => {
                // 其他策略的搜索逻辑待实现
                tracing::warn!("🚧 策略搜索未实现: {:?}", variant.kind);
            }
        }
        
        tracing::debug!("🔍 智能搜索完成: {} -> {} 个候选", 
                       format!("{:?}", variant.kind), results.len());
        results
    }
    
    /// 将索引节点转换为匹配候选
    fn nodes_to_candidates(&self, nodes: Vec<&IndexedNode>, search_method: &str) -> Vec<MatchCandidate> {
        nodes.into_iter().enumerate().map(|(i, node)| {
            MatchCandidate {
                id: format!("{}_{}", search_method, i),
                score: 0.8, // 基础得分，后续由评分引擎计算
                confidence: 0.8, // 基础置信度，后续由评分引擎计算
                bounds: Bounds {
                    left: node.bounds.0,
                    top: node.bounds.1,
                    right: node.bounds.2,
                    bottom: node.bounds.3,
                },
                text: node.element.text.clone(),
                class_name: node.element.class.clone(),
                package_name: node.element.package.clone(),
            }
        }).collect()
    }
    
    /// 检查文本是否匹配别名
    fn matches_text_aliases(&self, element_text: &Option<String>, aliases: &[String]) -> bool {
        if let Some(text) = element_text {
            aliases.iter().any(|alias| text.contains(alias) || alias.contains(text))
        } else {
            false
        }
    }
}