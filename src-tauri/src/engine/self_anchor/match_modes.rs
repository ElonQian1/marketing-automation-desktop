// src-tauri/src/engine/self_anchor/match_modes.rs
// module: self-anchor | layer: domain | role: 匹配模式处理器
// summary: 处理三种匹配模式：第一个、批量、精准定位

use serde::{Deserialize, Serialize};
use crate::services::universal_ui_page_analyzer::UIElement;
use crate::types::page_analysis::ElementBounds;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MatchMode {
    /// 第一个：按阅读顺序（上到下、左到右）取第一个
    First,
    /// 批量匹配：按顺序全都操作一遍（可设间隔、数量上限）
    Batch { interval_ms: u64, limit: Option<usize> },
    /// 精准匹配：只操作用户点选的那个实例（靠指纹区分）
    Precise,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstanceFingerprint {
    /// 用户点击的边界框
    pub tap_bounds: Option<ElementBounds>,
    /// 宽高比
    pub bounds_aspect: Option<f64>,
    /// 祖先节点签名哈希
    pub ancestry_path_sig: String,
    /// 可点击父级签名哈希
    pub clickable_parent_sig: Option<String>,
    /// 邻接文本tokens
    pub neighbor_text_tokens: Vec<String>,
    /// 子树结构哈希
    pub subtree_sig: Option<String>,
}



pub struct MatchModeProcessor;

impl MatchModeProcessor {
    /// 根据匹配模式处理重复元素
    pub fn process_duplicates(
        &self,
        elements: &[UIElement],
        mode: &MatchMode,
        fingerprint: Option<&InstanceFingerprint>,
    ) -> Result<Vec<usize>, String> {
        match mode {
            MatchMode::First => {
                Ok(self.get_first_by_reading_order(elements))
            }
            MatchMode::Batch { limit, .. } => {
                Ok(self.get_all_by_reading_order(elements, *limit))
            }
            MatchMode::Precise => {
                if let Some(fp) = fingerprint {
                    self.get_precise_match(elements, fp)
                } else {
                    Err("精准匹配模式需要提供指纹".to_string())
                }
            }
        }
    }
    
    /// 按阅读顺序获取第一个
    fn get_first_by_reading_order(&self, elements: &[UIElement]) -> Vec<usize> {
        if elements.is_empty() {
            return vec![];
        }
        
        let mut indexed_elements: Vec<(usize, &UIElement)> = elements.iter().enumerate().collect();
        indexed_elements.sort_by(|a, b| {
            // 先按Y坐标（上到下），再按X坐标（左到右）
            let bounds_a = Some(a.1.bounds.clone());
            let bounds_b = Some(b.1.bounds.clone());
            
            match (bounds_a, bounds_b) {
                (Some(a_bounds), Some(b_bounds)) => {
                    let y_diff = a_bounds.top - b_bounds.top;
                    if y_diff.abs() < 10 { // 同一行容差10px
                        a_bounds.left.cmp(&b_bounds.left)
                    } else {
                        y_diff.cmp(&0)
                    }
                }
                _ => std::cmp::Ordering::Equal,
            }
        });
        
        vec![indexed_elements[0].0]
    }
    
    /// 按阅读顺序获取全部（可限制数量）
    fn get_all_by_reading_order(&self, elements: &[UIElement], limit: Option<usize>) -> Vec<usize> {
        if elements.is_empty() {
            return vec![];
        }
        
        let mut indexed_elements: Vec<(usize, &UIElement)> = elements.iter().enumerate().collect();
        indexed_elements.sort_by(|a, b| {
            let bounds_a = Some(a.1.bounds.clone());
            let bounds_b = Some(b.1.bounds.clone());
            
            match (bounds_a, bounds_b) {
                (Some(a_bounds), Some(b_bounds)) => {
                    let y_diff = a_bounds.top - b_bounds.top;
                    if y_diff.abs() < 10 {
                        a_bounds.left.cmp(&b_bounds.left)
                    } else {
                        y_diff.cmp(&0)
                    }
                }
                _ => std::cmp::Ordering::Equal,
            }
        });
        
        let actual_limit = limit.unwrap_or(indexed_elements.len());
        indexed_elements.into_iter()
            .take(actual_limit)
            .map(|(index, _)| index)
            .collect()
    }
    
    /// 精准匹配：找到与指纹最匹配的元素
    fn get_precise_match(
        &self, 
        elements: &[UIElement], 
        fingerprint: &InstanceFingerprint
    ) -> Result<Vec<usize>, String> {
        let mut best_match: Option<(usize, f64)> = None;
        
        for (index, element) in elements.iter().enumerate() {
            let similarity = self.calculate_fingerprint_similarity(element, fingerprint);
            
            if let Some((_, best_score)) = best_match {
                if similarity > best_score {
                    best_match = Some((index, similarity));
                }
            } else {
                best_match = Some((index, similarity));
            }
        }
        
        match best_match {
            Some((index, score)) if score > 0.7 => Ok(vec![index]),
            Some((_, score)) => Err(format!("最佳匹配相似度过低: {:.2}", score)),
            None => Err("未找到匹配的元素".to_string()),
        }
    }
    
    /// 计算元素与指纹的相似度
    fn calculate_fingerprint_similarity(
        &self,
        element: &UIElement,
        fingerprint: &InstanceFingerprint,
    ) -> f64 {
        let mut total_score = 0.0;
        let mut weight_sum = 0.0;
        
        // 1. 边界框IoU（权重：0.4）
        if let Some(tap_bounds) = &fingerprint.tap_bounds {
            let element_bounds = &element.bounds;
            let iou = tap_bounds.iou(element_bounds);
            total_score += iou * 0.4;
            weight_sum += 0.4;
        }
        
        // 2. 祖先路径签名（权重：0.3）
        let ancestry_sig = self.generate_ancestry_signature(element);
        if ancestry_sig == fingerprint.ancestry_path_sig {
            total_score += 1.0 * 0.3;
        }
        weight_sum += 0.3;
        
        // 3. 邻接文本匹配（权重：0.2）
        let neighbor_similarity = self.calculate_neighbor_text_similarity(
            element, &fingerprint.neighbor_text_tokens
        );
        total_score += neighbor_similarity * 0.2;
        weight_sum += 0.2;
        
        // 4. 可点击父级签名（权重：0.1）
        if let Some(parent_sig) = &fingerprint.clickable_parent_sig {
            let element_parent_sig = self.generate_clickable_parent_signature(element);
            if element_parent_sig.as_ref() == Some(parent_sig) {
                total_score += 1.0 * 0.1;
            }
        }
        weight_sum += 0.1;
        
        if weight_sum > 0.0 {
            total_score / weight_sum
        } else {
            0.0
        }
    }
    
    /// 解析边界框字符串
    fn parse_bounds(&self, bounds_str: &str) -> Option<ElementBounds> {
        // 解析形如 "[100,200][300,400]" 的边界框字符串
        let bounds_pattern = regex::Regex::new(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]").ok()?;
        let captures = bounds_pattern.captures(bounds_str)?;
        
        Some(ElementBounds {
            left: captures.get(1)?.as_str().parse().ok()?,
            top: captures.get(2)?.as_str().parse().ok()?,
            right: captures.get(3)?.as_str().parse().ok()?,
            bottom: captures.get(4)?.as_str().parse().ok()?,
        })
    }
    
    /// 生成祖先路径签名
    fn generate_ancestry_signature(&self, _element: &UIElement) -> String {
        // TODO: 实现祖先路径签名生成
        // 遍历从根到当前元素的路径，生成类似 "FrameLayout[0]->LinearLayout[1]->TextView[2]" 的签名
        "ancestry_sig_placeholder".to_string()
    }
    
    /// 计算邻接文本相似度
    fn calculate_neighbor_text_similarity(
        &self,
        _element: &UIElement,
        _target_tokens: &[String],
    ) -> f64 {
        // TODO: 实现邻接文本相似度计算
        // 分析元素周围的文本tokens，计算与目标tokens的相似度
        0.8 // 占位符
    }
    
    /// 生成可点击父级签名
    fn generate_clickable_parent_signature(&self, _element: &UIElement) -> Option<String> {
        // TODO: 实现可点击父级签名生成
        // 找到最近的可点击父级，生成其特征签名
        Some("clickable_parent_sig_placeholder".to_string())
    }
}

/// 为UI元素生成实例指纹
pub fn generate_instance_fingerprint(
    element: &UIElement,
    user_tap_bounds: Option<ElementBounds>,
) -> InstanceFingerprint {
    let processor = MatchModeProcessor;
    
    InstanceFingerprint {
        tap_bounds: user_tap_bounds,
        bounds_aspect: {
            let b = &element.bounds;
            Some((b.right - b.left) as f64 / (b.bottom - b.top) as f64)
        },
        ancestry_path_sig: processor.generate_ancestry_signature(element),
        clickable_parent_sig: processor.generate_clickable_parent_signature(element),
        neighbor_text_tokens: vec![], // TODO: 实现邻接文本提取
        subtree_sig: None, // TODO: 实现子树签名生成
    }
}

