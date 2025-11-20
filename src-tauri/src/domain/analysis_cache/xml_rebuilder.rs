// src-tauri/src/domain/analysis_cache/xml_rebuilder.rs
// module: analysis_cache | layer: domain | role: XML增量重建和差异应用引擎
// summary: 实现XML版本差异应用、增量重建和完整版本恢复算法

use std::collections::HashMap;
use anyhow::{Result, anyhow, Context};
use quick_xml::{Reader, Writer, events::Event};
use std::io::Cursor;

use crate::domain::analysis_cache::{
    version_control::*,
    DomIndex,
};

/// XML重建引擎
pub struct XmlRebuilder {
    /// 重建缓存（避免重复解析）
    rebuild_cache: HashMap<String, String>,
    /// 是否启用并行重建
    enable_parallel: bool,
    /// 最大重建深度（防止无限递归）
    max_rebuild_depth: usize,
}

impl XmlRebuilder {
    /// 创建新的重建引擎
    pub fn new(enable_parallel: bool) -> Self {
        Self {
            rebuild_cache: HashMap::new(),
            enable_parallel,
            max_rebuild_depth: 50, // 最多50层版本深度
        }
    }
    
    /// 从版本ID重建完整的XML
    pub fn rebuild_xml_from_version<'a>(&'a mut self, version_id: &'a str) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<String>> + Send + 'a>> {
        Box::pin(self.rebuild_xml_from_version_impl(version_id))
    }
    
    /// 内部实现方法
    async fn rebuild_xml_from_version_impl(&mut self, version_id: &str) -> Result<String> {
        // 检查缓存
        if let Some(cached_xml) = self.rebuild_cache.get(version_id) {
            return Ok(cached_xml.clone());
        }
        
        // 获取版本信息
        let version = self.get_version(version_id).await?;
        
        // 根据版本类型选择重建策略
        let xml = match version.version_type {
            VersionType::Root | VersionType::Milestone => {
                // 直接从快照获取
                self.get_snapshot_xml(&version.snapshot_id).await?
            },
            VersionType::Incremental | VersionType::Branch | VersionType::Tag => {
                // 增量重建
                self.rebuild_incremental(&version, 0).await?
            },
        };
        
        // 缓存结果
        self.rebuild_cache.insert(version_id.to_string(), xml.clone());
        Ok(xml)
    }
    
    /// 应用差异到基础XML
    pub fn apply_diff(&self, base_xml: &str, delta: &XmlDelta) -> Result<String> {
        let mut doc = self.parse_xml_document(base_xml)?;
        
        // 1. 删除节点
        for xpath in &delta.removed_nodes {
            self.remove_node_by_xpath(&mut doc, xpath)?;
        }
        
        // 2. 修改节点
        for change in &delta.modified_nodes {
            self.apply_node_change(&mut doc, change)?;
        }
        
        // 3. 移动节点
        for move_info in &delta.moved_nodes {
            self.move_node(&mut doc, move_info)?;
        }
        
        // 4. 添加新节点
        for node in &delta.added_nodes {
            self.add_node(&mut doc, node)?;
        }
        
        // 序列化回XML字符串
        self.serialize_document(&doc)
    }
    
    /// 增量重建（递归）
    fn rebuild_incremental<'a>(&'a mut self, version: &'a XmlVersion, depth: usize) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<String>> + Send + 'a>> {
        Box::pin(async move {
            if depth > self.max_rebuild_depth {
                return Err(anyhow!("重建深度超过限制: {}", self.max_rebuild_depth));
            }
            
            let parent_id = version.parent_id.as_ref()
                .ok_or_else(|| anyhow!("增量版本缺少父版本ID: {}", version.id))?;
            
            // 递归获取父版本的XML
            let base_xml = if depth == 0 {
                // 第一层递归，检查缓存
                if let Some(cached) = self.rebuild_cache.get(parent_id) {
                    cached.clone()
                } else {
                    // TODO: 实现完整的重建逻辑
                    return Err(anyhow!("递归重建尚未完全实现"));
                }
            } else {
                // 深层递归，直接重建
                let parent_version = self.get_version(parent_id).await?;
                self.rebuild_incremental(&parent_version, depth + 1).await?
            };
            
            // 应用当前版本的差异
            let delta = version.delta.as_ref()
                .ok_or_else(|| anyhow!("增量版本缺少差异数据: {}", version.id))?;
            
            self.apply_diff(&base_xml, delta)
        })
    }
    
    /// 解析XML文档为内部表示
    fn parse_xml_document(&self, xml: &str) -> Result<XmlDocument> {
        let mut reader = Reader::from_str(xml);
        
        let mut doc = XmlDocument::new();
        let mut current_path = Vec::new();
        let mut buf = Vec::new();
        
        loop {
            match reader.read_event_into(&mut buf)? {
                Event::Start(ref e) => {
                    let name = String::from_utf8_lossy(e.name().as_ref()).to_string();
                    current_path.push(name.clone());
                    
                    let xpath = self.build_xpath(&current_path);
                    let mut attributes = HashMap::new();
                    
                    for attr in e.attributes() {
                        let attr = attr?;
                        let key = String::from_utf8_lossy(attr.key.as_ref()).to_string();
                        let value = String::from_utf8_lossy(&attr.value).to_string();
                        attributes.insert(key, value);
                    }
                    
                    doc.nodes.insert(xpath, XmlNode {
                        tag_name: name,
                        attributes,
                        content: None,
                        children: Vec::new(),
                        parent_xpath: if current_path.len() > 1 {
                            Some(self.build_xpath(&current_path[..current_path.len()-1]))
                        } else {
                            None
                        },
                    });
                },
                Event::Text(e) => {
                    if !current_path.is_empty() {
                        let xpath = self.build_xpath(&current_path);
                        if let Some(node) = doc.nodes.get_mut(&xpath) {
                            let text = std::str::from_utf8(&e)?;
                            let text = text.trim();
                            if !text.is_empty() {
                                node.content = Some(text.to_string());
                            }
                        }
                    }
                },
                Event::End(_) => {
                    current_path.pop();
                },
                Event::Eof => break,
                _ => (),
            }
            buf.clear();
        }
        
        Ok(doc)
    }
    
    /// 构建XPath路径
    fn build_xpath(&self, path: &[String]) -> String {
        if path.is_empty() {
            return "/".to_string();
        }
        format!("/{}", path.join("/"))
    }
    
    /// 删除节点
    fn remove_node_by_xpath(&self, doc: &mut XmlDocument, xpath: &str) -> Result<()> {
        // 先收集需要删除的节点信息，避免借用冲突
        let node_info = doc.nodes.get(xpath).map(|n| (n.parent_xpath.clone(), n.children.clone()));
        
        if let Some((parent_xpath_opt, children)) = node_info {
            // 从父节点的子节点列表中移除
            if let Some(parent_xpath) = parent_xpath_opt {
                if let Some(parent) = doc.nodes.get_mut(&parent_xpath) {
                    parent.children.retain(|child| child != xpath);
                }
            }
            
            // 递归删除子节点
            for child_xpath in children {
                self.remove_node_by_xpath(doc, &child_xpath)?;
            }
            
            // 删除节点本身
            doc.nodes.remove(xpath);
        }
        
        Ok(())
    }
    
    /// 应用节点变更
    fn apply_node_change(&self, doc: &mut XmlDocument, change: &NodeChange) -> Result<()> {
        if let Some(node) = doc.nodes.get_mut(&change.xpath) {
            // 更新内容
            if let Some(content_change) = &change.content_change {
                node.content = content_change.new_content.clone();
            }
            
            // 更新属性
            for (attr_name, attr_change) in &change.attribute_changes {
                match &attr_change.new_value {
                    Some(new_value) => {
                        node.attributes.insert(attr_name.clone(), new_value.clone());
                    },
                    None => {
                        node.attributes.remove(attr_name);
                    },
                }
            }
        }
        
        Ok(())
    }
    
    /// 移动节点
    fn move_node(&self, doc: &mut XmlDocument, move_info: &NodeMove) -> Result<()> {
        // 从旧父节点移除
        if let Some(old_parent) = doc.nodes.get_mut(&move_info.old_parent_xpath) {
            old_parent.children.retain(|child| child != &move_info.xpath);
        }
        
        // 添加到新父节点
        if let Some(new_parent) = doc.nodes.get_mut(&move_info.new_parent_xpath) {
            // 在指定位置插入
            if move_info.new_index <= new_parent.children.len() {
                new_parent.children.insert(move_info.new_index, move_info.xpath.clone());
            } else {
                new_parent.children.push(move_info.xpath.clone());
            }
        }
        
        // 更新节点的父引用
        if let Some(node) = doc.nodes.get_mut(&move_info.xpath) {
            node.parent_xpath = Some(move_info.new_parent_xpath.clone());
        }
        
        Ok(())
    }
    
    /// 添加新节点
    fn add_node(&self, doc: &mut XmlDocument, node_info: &DeltaNode) -> Result<()> {
        let new_node = XmlNode {
            tag_name: self.extract_tag_name(&node_info.xpath),
            attributes: node_info.attributes.clone(),
            content: node_info.content.clone(),
            children: Vec::new(),
            parent_xpath: Some(node_info.parent_xpath.clone()),
        };
        
        // 添加节点到文档
        doc.nodes.insert(node_info.xpath.clone(), new_node);
        
        // 更新父节点的子节点列表
        if let Some(parent) = doc.nodes.get_mut(&node_info.parent_xpath) {
            match node_info.insert_index {
                Some(index) if index <= parent.children.len() => {
                    parent.children.insert(index, node_info.xpath.clone());
                },
                _ => {
                    parent.children.push(node_info.xpath.clone());
                },
            }
        }
        
        Ok(())
    }
    
    /// 从XPath提取标签名
    fn extract_tag_name(&self, xpath: &str) -> String {
        xpath.split('/').last().unwrap_or("unknown").to_string()
    }
    
    /// 序列化文档为XML字符串
    fn serialize_document(&self, doc: &XmlDocument) -> Result<String> {
        let mut writer = Writer::new(Cursor::new(Vec::new()));
        
        // 找到根节点
        let root_nodes: Vec<_> = doc.nodes.iter()
            .filter(|(_, node)| node.parent_xpath.is_none())
            .collect();
        
        if root_nodes.is_empty() {
            return Err(anyhow!("没有找到根节点"));
        }
        
        // 递归序列化
        for (xpath, _) in root_nodes {
            self.serialize_node(&mut writer, doc, xpath)?;
        }
        
        let result = writer.into_inner().into_inner();
        Ok(String::from_utf8(result)?)
    }
    
    /// 递归序列化节点
    fn serialize_node(&self, writer: &mut Writer<Cursor<Vec<u8>>>, doc: &XmlDocument, xpath: &str) -> Result<()> {
        if let Some(node) = doc.nodes.get(xpath) {
            // 构建开始标签
            let mut start_tag = format!("<{}", node.tag_name);
            
            // 添加属性
            for (key, value) in &node.attributes {
                start_tag.push_str(&format!(" {}=\"{}\"", key, value));
            }
            
            if node.content.is_some() || !node.children.is_empty() {
                start_tag.push('>');
                writer.write_event(Event::Text(quick_xml::events::BytesText::new(&start_tag)))?;
                
                // 写入内容
                if let Some(content) = &node.content {
                    writer.write_event(Event::Text(quick_xml::events::BytesText::new(content)))?;
                }
                
                // 递归处理子节点
                for child_xpath in &node.children {
                    self.serialize_node(writer, doc, child_xpath)?;
                }
                
                // 结束标签
                let end_tag = format!("</{}>", node.tag_name);
                writer.write_event(Event::Text(quick_xml::events::BytesText::new(&end_tag)))?;
            } else {
                // 自闭合标签
                start_tag.push_str("/>");
                writer.write_event(Event::Text(quick_xml::events::BytesText::new(&start_tag)))?;
            }
        }
        
        Ok(())
    }
    
    /// 获取版本信息（模拟，实际应该从存储加载）
    async fn get_version(&self, version_id: &str) -> Result<XmlVersion> {
        // TODO: 从 VERSION_STORAGE 加载
        // 这里先返回一个模拟版本
        Err(anyhow!("版本获取功能尚未实现: {}", version_id))
    }
    
    /// 获取快照XML（集成 Phase 1 DOM_CACHE）
    async fn get_snapshot_xml(&self, snapshot_id: &str) -> Result<String> {
        use crate::domain::analysis_cache::DOM_CACHE;
        
        // 尝试从 DOM_CACHE 获取
        if let Some(dom_cache) = DOM_CACHE.get(snapshot_id) {
            return Ok(dom_cache.xml_content.clone());
        }
        
        // 如果缓存中没有，尝试从磁盘加载
        // TODO: 实现磁盘加载逻辑
        
        Err(anyhow!("快照不存在: {}", snapshot_id))
    }
    
    /// 清理重建缓存
    pub fn clear_cache(&mut self) {
        self.rebuild_cache.clear();
    }
    
    /// 获取缓存统计信息
    pub fn cache_stats(&self) -> (usize, usize) {
        let count = self.rebuild_cache.len();
        let size = self.rebuild_cache.iter()
            .map(|(k, v)| k.len() + v.len())
            .sum();
        (count, size)
    }
    
    /// 预热缓存（预先重建常用版本）
    pub async fn warmup_cache(&mut self, version_ids: &[String]) -> Result<usize> {
        let mut warmed = 0;
        
        for version_id in version_ids {
            if !self.rebuild_cache.contains_key(version_id) {
                // TODO: 实现完整的预热逻辑
                warmed += 1;
            }
        }
        
        Ok(warmed)
    }
}

/// XML文档内部表示
#[derive(Debug, Clone)]
struct XmlDocument {
    /// 节点映射 (XPath -> Node)
    nodes: HashMap<String, XmlNode>,
}

impl XmlDocument {
    fn new() -> Self {
        Self {
            nodes: HashMap::new(),
        }
    }
}

/// XML节点内部表示
#[derive(Debug, Clone)]
struct XmlNode {
    /// 标签名
    tag_name: String,
    /// 属性
    attributes: HashMap<String, String>,
    /// 文本内容
    content: Option<String>,
    /// 子节点XPath列表
    children: Vec<String>,
    /// 父节点XPath
    parent_xpath: Option<String>,
}

/// 重建统计信息
#[derive(Debug, Clone)]
pub struct RebuildStats {
    /// 重建的版本数
    pub rebuilt_versions: usize,
    /// 应用的差异数
    pub applied_diffs: usize,
    /// 缓存命中次数
    pub cache_hits: usize,
    /// 缓存未命中次数
    pub cache_misses: usize,
    /// 总耗时（毫秒）
    pub total_time_ms: u64,
    /// 重建的XML总大小（字节）
    pub total_xml_size: usize,
}

impl RebuildStats {
    pub fn new() -> Self {
        Self {
            rebuilt_versions: 0,
            applied_diffs: 0,
            cache_hits: 0,
            cache_misses: 0,
            total_time_ms: 0,
            total_xml_size: 0,
        }
    }
    
    pub fn cache_hit_rate(&self) -> f64 {
        let total = self.cache_hits + self.cache_misses;
        if total > 0 {
            self.cache_hits as f64 / total as f64
        } else {
            0.0
        }
    }
}

/// 重建选项
#[derive(Debug, Clone)]
pub struct RebuildOptions {
    /// 是否使用缓存
    pub use_cache: bool,
    /// 是否启用并行重建
    pub enable_parallel: bool,
    /// 最大重建深度
    pub max_depth: usize,
    /// 超时时间（秒）
    pub timeout_seconds: u64,
}

impl Default for RebuildOptions {
    fn default() -> Self {
        Self {
            use_cache: true,
            enable_parallel: true,
            max_depth: 50,
            timeout_seconds: 300, // 5分钟
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_apply_simple_diff() {
        let rebuilder = XmlRebuilder::new(true);
        
        let base_xml = r#"<?xml version="1.0"?>
<root>
    <item id="1">Content 1</item>
    <item id="2">Content 2</item>
</root>"#;
        
        let mut delta = XmlDelta {
            added_nodes: vec![
                DeltaNode {
                    xpath: "/root/item[3]".to_string(),
                    content: Some("Content 3".to_string()),
                    attributes: {
                        let mut attrs = HashMap::new();
                        attrs.insert("id".to_string(), "3".to_string());
                        attrs
                    },
                    parent_xpath: "/root".to_string(),
                    insert_index: None,
                }
            ],
            removed_nodes: vec![],
            modified_nodes: vec![],
            moved_nodes: vec![],
            stats: DeltaStats::new(),
        };
        delta.stats.added_count = delta.added_nodes.len();
        delta.stats.removed_count = delta.removed_nodes.len();
        delta.stats.modified_count = delta.modified_nodes.len();
        delta.stats.moved_count = delta.moved_nodes.len();
        
        let result = rebuilder.apply_diff(base_xml, &delta);
        assert!(result.is_ok(), "差异应用应该成功");
        
        let new_xml = result.unwrap();
        assert!(new_xml.contains("Content 3"), "新XML应该包含添加的内容");
    }
    
    #[test]
    fn test_xpath_building() {
        let rebuilder = XmlRebuilder::new(false);
        
        assert_eq!(rebuilder.build_xpath(&[]), "/");
        assert_eq!(rebuilder.build_xpath(&["root".to_string()]), "/root");
        assert_eq!(
            rebuilder.build_xpath(&["root".to_string(), "item".to_string()]), 
            "/root/item"
        );
    }
    
    #[test]
    fn test_cache_stats() {
        let mut rebuilder = XmlRebuilder::new(true);
        
        // 初始状态
        let (count, size) = rebuilder.cache_stats();
        assert_eq!(count, 0);
        assert_eq!(size, 0);
        
        // 添加缓存项
        rebuilder.rebuild_cache.insert("v1".to_string(), "<xml/>".to_string());
        
        let (count, size) = rebuilder.cache_stats();
        assert_eq!(count, 1);
        assert!(size > 0);
        
        // 清理缓存
        rebuilder.clear_cache();
        let (count, size) = rebuilder.cache_stats();
        assert_eq!(count, 0);
        assert_eq!(size, 0);
    }
}