// src-tauri/src/exec/v3/element_matching/xpath_similarity_matcher.rs
// module: v3-execution | layer: matching | role: XPath相似度匹配算法
// summary: 当无文本锚点时，使用XPath结构相似度防止乱点乱匹配

/// XPath相似度匹配结果
#[derive(Debug, Clone)]
pub struct XPathSimilarityResult {
    /// 相似度分数 [0.0, 1.0]
    pub similarity: f32,
    /// 是否完全匹配（每一级都相同）
    pub is_exact: bool,
    /// 是否高度相似（相似度 > 0.9）
    pub is_highly_similar: bool,
    /// 是否中等相似（相似度 > 0.7）
    pub is_moderately_similar: bool,
    /// 匹配详情
    pub details: Vec<String>,
}

/// XPath节点信息
#[derive(Debug, Clone, PartialEq)]
struct XPathNode {
    /// 标签名（如 "node"）
    tag: String,
    /// 索引（如 "[2]"）
    index: Option<usize>,
    /// 属性条件（如 "@resource-id='xxx'"）
    attributes: Vec<String>,
}

/// XPath相似度匹配器
pub struct XPathSimilarityMatcher;

impl XPathSimilarityMatcher {
    /// 🔥 计算两个XPath的相似度
    /// 
    /// 算法：
    /// 1. 解析XPath为节点序列
    /// 2. 比较每一级节点的相似度
    /// 3. 计算加权平均（深层节点权重更高）
    /// 
    /// # Examples
    /// ```
    /// let static_xpath = "/hierarchy/node[1]/node[2]/node[@resource-id='xxx']";
    /// let dynamic_xpath = "/hierarchy/node[1]/node[2]/node[@resource-id='xxx']";
    /// let result = XPathSimilarityMatcher::calculate_similarity(static_xpath, dynamic_xpath);
    /// assert!(result.is_exact);
    /// ```
    pub fn calculate_similarity(static_xpath: &str, dynamic_xpath: &str) -> XPathSimilarityResult {
        // 解析XPath
        let static_nodes = Self::parse_xpath(static_xpath);
        let dynamic_nodes = Self::parse_xpath(dynamic_xpath);
        
        if static_nodes.is_empty() || dynamic_nodes.is_empty() {
            tracing::warn!("⚠️ [XPath相似度] 无法解析XPath: static={}, dynamic={}", 
                         static_xpath, dynamic_xpath);
            return XPathSimilarityResult::no_match();
        }
        
        // 检查完全匹配
        let is_exact = static_nodes == dynamic_nodes;
        if is_exact {
            return XPathSimilarityResult {
                similarity: 1.0,
                is_exact: true,
                is_highly_similar: true,
                is_moderately_similar: true,
                details: vec!["XPath完全匹配".to_string()],
            };
        }
        
        // 计算节点级别的相似度
        let mut details = Vec::new();
        let mut total_similarity = 0.0f32;
        let mut total_weight = 0.0f32;
        
        let min_len = static_nodes.len().min(dynamic_nodes.len());
        let max_len = static_nodes.len().max(dynamic_nodes.len());
        
        // 比较每一级节点
        for i in 0..max_len {
            // 深层节点权重更高（最后一级权重最高）
            let level_weight = (i + 1) as f32 / max_len as f32;
            
            if i < min_len {
                let static_node = &static_nodes[i];
                let dynamic_node = &dynamic_nodes[i];
                
                let node_similarity = Self::compare_nodes(static_node, dynamic_node);
                total_similarity += node_similarity * level_weight;
                total_weight += level_weight;
                
                if node_similarity >= 0.95 {
                    details.push(format!("  级别{}: 完全匹配 ({:.2})", i + 1, node_similarity));
                } else if node_similarity >= 0.7 {
                    details.push(format!("  级别{}: 高度相似 ({:.2})", i + 1, node_similarity));
                } else if node_similarity >= 0.5 {
                    details.push(format!("  级别{}: 中等相似 ({:.2})", i + 1, node_similarity));
                } else {
                    details.push(format!("  级别{}: 低相似度 ({:.2})", i + 1, node_similarity));
                }
            } else {
                // 长度不匹配，惩罚
                details.push(format!("  级别{}: 长度不匹配", i + 1));
            }
        }
        
        // 长度差异惩罚
        let length_penalty = if static_nodes.len() != dynamic_nodes.len() {
            let diff = (static_nodes.len() as i32 - dynamic_nodes.len() as i32).abs();
            0.1 * diff as f32
        } else {
            0.0
        };
        
        let similarity = if total_weight > 0.0 {
            (total_similarity / total_weight - length_penalty).max(0.0).min(1.0)
        } else {
            0.0
        };
        
        XPathSimilarityResult {
            similarity,
            is_exact: false,
            is_highly_similar: similarity > 0.9,
            is_moderately_similar: similarity > 0.7,
            details,
        }
    }
    
    /// 解析XPath为节点序列
    /// 
    /// 示例："/hierarchy/node[1]/node[2]" → [
    ///   XPathNode { tag: "hierarchy", index: None, attributes: [] },
    ///   XPathNode { tag: "node", index: Some(1), attributes: [] },
    ///   XPathNode { tag: "node", index: Some(2), attributes: [] },
    /// ]
    fn parse_xpath(xpath: &str) -> Vec<XPathNode> {
        let mut nodes = Vec::new();
        
        // 移除开头的 "/"
        let xpath = xpath.trim_start_matches('/');
        
        // 按 "/" 分割
        for part in xpath.split('/') {
            if part.is_empty() {
                continue;
            }
            
            // 解析节点：node[2][@resource-id='xxx']
            let (tag, rest) = if let Some(idx) = part.find('[') {
                (&part[..idx], &part[idx..])
            } else {
                (part, "")
            };
            
            // 提取索引和属性
            let mut index = None;
            let mut attributes = Vec::new();
            
            if !rest.is_empty() {
                // 使用简单的正则逻辑提取 [数字] 和 [@xxx='yyy']
                let mut remaining = rest;
                
                while !remaining.is_empty() {
                    if remaining.starts_with('[') && !remaining.starts_with("[@") {
                        // 数字索引：[2]
                        if let Some(end) = remaining.find(']') {
                            let num_str = &remaining[1..end];
                            if let Ok(num) = num_str.parse::<usize>() {
                                index = Some(num);
                            }
                            remaining = &remaining[end + 1..];
                        } else {
                            break;
                        }
                    } else if remaining.starts_with("[@") {
                        // 属性条件：[@resource-id='xxx']
                        if let Some(end) = remaining.find(']') {
                            let attr = remaining[1..=end].to_string();
                            attributes.push(attr);
                            remaining = &remaining[end + 1..];
                        } else {
                            break;
                        }
                    } else {
                        break;
                    }
                }
            }
            
            nodes.push(XPathNode {
                tag: tag.to_string(),
                index,
                attributes,
            });
        }
        
        nodes
    }
    
    /// 比较两个节点的相似度
    fn compare_nodes(node1: &XPathNode, node2: &XPathNode) -> f32 {
        let mut similarity = 0.0f32;
        
        // 1. 标签名匹配（40%权重）
        if node1.tag == node2.tag {
            similarity += 0.4;
        }
        
        // 2. 索引匹配（30%权重）
        match (&node1.index, &node2.index) {
            (Some(i1), Some(i2)) if i1 == i2 => {
                similarity += 0.3;
            }
            (None, None) => {
                similarity += 0.3; // 都没有索引也算匹配
            }
            (Some(i1), Some(i2)) => {
                // 索引接近也给部分分数
                let diff = (*i1 as i32 - *i2 as i32).abs();
                if diff <= 2 {
                    similarity += 0.3 * (1.0 - diff as f32 * 0.2);
                }
            }
            _ => {
                // 一个有索引一个没有，给一点分数
                similarity += 0.1;
            }
        }
        
        // 3. 属性匹配（30%权重）
        if node1.attributes.is_empty() && node2.attributes.is_empty() {
            similarity += 0.3;
        } else if !node1.attributes.is_empty() && !node2.attributes.is_empty() {
            // 计算属性交集
            let common_attrs: Vec<_> = node1.attributes.iter()
                .filter(|a| node2.attributes.contains(a))
                .collect();
            
            let total_attrs = (node1.attributes.len() + node2.attributes.len()) as f32;
            let common_count = common_attrs.len() as f32 * 2.0; // 乘2因为交集计算
            
            let attr_similarity = common_count / total_attrs;
            similarity += 0.3 * attr_similarity;
        }
        
        similarity.min(1.0)
    }
    
    /// 🔥 批量评估候选元素的XPath相似度
    /// 
    /// 用于从多个候选中筛选出XPath最相似的元素
    /// 注意：由于UIElement本身不包含xpath字段，此函数需要额外的xpath映射
    pub fn rank_candidates_by_xpath_with_map<'a>(
        candidates: &[&'a crate::services::ui_reader_service::UIElement],
        xpath_map: &std::collections::HashMap<String, String>, // bounds -> xpath
        static_xpath: &str,
    ) -> Vec<(&'a crate::services::ui_reader_service::UIElement, XPathSimilarityResult)> {
        let mut ranked = Vec::new();
        
        for candidate in candidates {
            if let Some(ref bounds) = candidate.bounds {
                if let Some(dynamic_xpath) = xpath_map.get(bounds) {
                    let similarity = Self::calculate_similarity(static_xpath, dynamic_xpath);
                    
                    if similarity.similarity > 0.0 {
                        ranked.push((*candidate, similarity));
                    }
                }
            }
        }
        
        // 按相似度降序排列
        ranked.sort_by(|a, b| {
            b.1.similarity.partial_cmp(&a.1.similarity).unwrap()
        });
        
        ranked
    }
    
    /// 🔥 检查是否应该使用XPath匹配模式
    /// 
    /// 当满足以下条件时，应该强制使用Bounds严格匹配：
    /// 1. 没有子元素文本
    /// 2. 没有兄弟元素文本
    /// 3. 没有父元素文本
    pub fn should_use_xpath_mode(
        children_texts: &[String],
        sibling_texts: &[String],
        parent_info: &Option<super::multi_candidate_evaluator::ParentInfo>,
    ) -> bool {
        // 检查是否有任何文本锚点
        let has_children_text = !children_texts.is_empty() && children_texts.iter().any(|t| !t.is_empty());
        let has_sibling_text = !sibling_texts.is_empty() && sibling_texts.iter().any(|t| !t.is_empty());
        let has_parent_text = parent_info.as_ref().map_or(false, |p| {
            !p.text.is_empty() || !p.content_desc.is_empty()
        });
        
        // 如果三者都没有，应该使用安全模式
        let should_use = !has_children_text && !has_sibling_text && !has_parent_text;
        
        if should_use {
            tracing::warn!(
                "⚠️ [安全模式] 无文本锚点，强制使用Bounds严格匹配（防止乱点）"
            );
        }
        
        should_use
    }
}

impl XPathSimilarityResult {
    /// 创建无匹配结果
    pub fn no_match() -> Self {
        XPathSimilarityResult {
            similarity: 0.0,
            is_exact: false,
            is_highly_similar: false,
            is_moderately_similar: false,
            details: vec!["XPath解析失败或无匹配".to_string()],
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_exact_match() {
        let xpath1 = "/hierarchy/node[1]/node[2]/node[@resource-id='xxx']";
        let xpath2 = "/hierarchy/node[1]/node[2]/node[@resource-id='xxx']";
        
        let result = XPathSimilarityMatcher::calculate_similarity(xpath1, xpath2);
        
        assert!(result.is_exact);
        assert_eq!(result.similarity, 1.0);
    }
    
    #[test]
    fn test_index_change() {
        let xpath1 = "/hierarchy/node[1]/node[2]/node[3]";
        let xpath2 = "/hierarchy/node[1]/node[2]/node[4]"; // 最后一级索引变了
        
        let result = XPathSimilarityMatcher::calculate_similarity(xpath1, xpath2);
        
        assert!(!result.is_exact);
        assert!(result.similarity > 0.7); // 应该还是高相似度
        assert!(result.is_moderately_similar);
    }
    
    #[test]
    fn test_structure_change() {
        let xpath1 = "/hierarchy/node[1]/node[2]";
        let xpath2 = "/hierarchy/node[1]/node[2]/node[3]"; // 多了一级
        
        let result = XPathSimilarityMatcher::calculate_similarity(xpath1, xpath2);
        
        assert!(!result.is_exact);
        assert!(result.similarity < 1.0);
    }
    
    #[test]
    fn test_parse_xpath() {
        let xpath = "/hierarchy/node[1]/node[@resource-id='xxx'][2]";
        let nodes = XPathSimilarityMatcher::parse_xpath(xpath);
        
        assert_eq!(nodes.len(), 3);
        assert_eq!(nodes[0].tag, "hierarchy");
        assert_eq!(nodes[1].tag, "node");
        assert_eq!(nodes[1].index, Some(1));
        assert_eq!(nodes[2].tag, "node");
        assert!(nodes[2].attributes.len() > 0);
    }
    
    #[test]
    fn test_should_use_xpath_mode() {
        // 场景1: 有子元素文本，不应该使用XPath模式
        let children_texts = vec!["通讯录".to_string()];
        let sibling_texts = vec![];
        let parent_info = None;
        
        assert!(!XPathSimilarityMatcher::should_use_xpath_mode(
            &children_texts, &sibling_texts, &parent_info
        ));
        
        // 场景2: 都没有文本，应该使用XPath模式
        let children_texts = vec![];
        let sibling_texts = vec![];
        let parent_info = None;
        
        assert!(XPathSimilarityMatcher::should_use_xpath_mode(
            &children_texts, &sibling_texts, &parent_info
        ));
    }
}
