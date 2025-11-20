// src-tauri/src/engine/self_anchor/relation_seed.rs
// module: self-anchor | layer: domain | role: 关系线索生成器
// summary: 当自身字段稀薄时，提取父/子/邻接线索供下一步关系锚定使用

use serde::{Deserialize, Serialize};
use crate::services::universal_ui_page_analyzer::UIElement;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RelationSeed {
    /// 父级/祖先可用字段或XPath片段
    pub parent_hints: Vec<String>,
    /// 子级/后代可用字段或文本
    pub child_hints: Vec<String>,
    /// 同层邻接文本/结构提示
    pub neighbor_hints: Vec<String>,
    /// 容器特征（如果存在）
    pub container_context: Option<String>,
    /// 可点击父级特征
    pub clickable_parent_context: Option<String>,
}

pub struct RelationSeedGenerator;

impl RelationSeedGenerator {
    /// 检测是否为"空自身"（字段稀薄）
    pub fn is_empty_self(&self, element: &UIElement) -> bool {
        let meaningful_fields = [
            element.resource_id.as_deref(),
            Some(element.content_desc.as_str()),
            Some(element.text.as_str()),
        ].iter().filter(|field| {
            field.is_some() && !field.unwrap().trim().is_empty()
        }).count();
        
        // 如果有意义的字段少于2个，且class也是通用类型，则认为是"空自身"
        meaningful_fields < 2 && self.is_generic_class(&element.class_name.as_deref().unwrap_or(""))
    }
    
    /// 生成关系线索
    pub fn generate_relation_seed(&self, element: &UIElement) -> RelationSeed {
        RelationSeed {
            parent_hints: self.extract_parent_hints(element),
            child_hints: self.extract_child_hints(element),
            neighbor_hints: self.extract_neighbor_hints(element),
            container_context: self.extract_container_context(element),
            clickable_parent_context: self.extract_clickable_parent_context(element),
        }
    }
    
    /// 提取父级线索
    fn extract_parent_hints(&self, _element: &UIElement) -> Vec<String> {
        let mut hints = Vec::new();
        
        // TODO: 遍历父级元素，提取有用的特征
        // - 父级的resource-id
        // - 父级的class（如果不是通用的）
        // - 父级的content-desc
        // - 父级的结构特征
        
        // 示例线索
        hints.push("parent[@resource-id='card_container']".to_string());
        hints.push("parent[@class='RelativeLayout']".to_string());
        
        hints
    }
    
    /// 提取子级线索
    fn extract_child_hints(&self, _element: &UIElement) -> Vec<String> {
        let mut hints = Vec::new();
        
        // TODO: 遍历子级元素，寻找有语义的文本或特征
        // - 子级的强语义文本
        // - 子级的图标或特殊属性
        // - 子级的布局结构
        
        // 示例线索
        hints.push("child::*[contains(@text,'关注')]".to_string());
        hints.push("descendant::*[@content-desc='按钮']".to_string());
        
        hints
    }
    
    /// 提取邻接线索
    fn extract_neighbor_hints(&self, _element: &UIElement) -> Vec<String> {
        let mut hints = Vec::new();
        
        // TODO: 分析同层邻接元素
        // - 左侧标签文本
        // - 右侧操作按钮
        // - 上下文描述文本
        
        // 示例线索
        hints.push("preceding-sibling::*[contains(@text,'用户名')]".to_string());
        hints.push("following-sibling::*[@content-desc='更多选项']".to_string());
        
        hints
    }
    
    /// 提取容器上下文
    fn extract_container_context(&self, _element: &UIElement) -> Option<String> {
        // TODO: 找到最近的有意义容器
        // - 列表项容器
        // - 卡片容器
        // - 导航容器
        
        Some("ancestor::*[@resource-id='list_item'][1]".to_string())
    }
    
    /// 提取可点击父级上下文
    fn extract_clickable_parent_context(&self, _element: &UIElement) -> Option<String> {
        // TODO: 找到最近的可点击父级元素
        // - 可点击的父级容器
        // - 父级的特征组合
        
        Some("ancestor::*[@clickable='true'][1]".to_string())
    }
    
    /// 判断是否为通用类型
    fn is_generic_class(&self, class: &str) -> bool {
        let generic_classes = [
            "android.view.View",
            "android.view.ViewGroup",
            "android.widget.FrameLayout",
            "android.widget.LinearLayout",
            "android.widget.RelativeLayout",
        ];
        
        generic_classes.contains(&class)
    }
    
    /// 评估关系线索的质量
    pub fn evaluate_seed_quality(&self, seed: &RelationSeed) -> f64 {
        let mut score = 0.0;
        let mut max_score = 0.0;
        
        // 父级线索权重：0.4
        if !seed.parent_hints.is_empty() {
            score += 0.4 * (seed.parent_hints.len().min(3) as f64 / 3.0);
        }
        max_score += 0.4;
        
        // 子级线索权重：0.3
        if !seed.child_hints.is_empty() {
            score += 0.3 * (seed.child_hints.len().min(3) as f64 / 3.0);
        }
        max_score += 0.3;
        
        // 邻接线索权重：0.2
        if !seed.neighbor_hints.is_empty() {
            score += 0.2 * (seed.neighbor_hints.len().min(2) as f64 / 2.0);
        }
        max_score += 0.2;
        
        // 容器上下文权重：0.1
        if seed.container_context.is_some() {
            score += 0.1;
        }
        max_score += 0.1;
        
        if max_score > 0.0 {
            score / max_score
        } else {
            0.0
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::services::universal_ui_page_analyzer::{UIElement, UIElementType};
    use crate::types::page_analysis::ElementBounds;

    fn create_test_element(text: Option<&str>, content_desc: Option<&str>, resource_id: Option<&str>, class: &str, bounds_str: &str) -> UIElement {
        let parts: Vec<&str> = bounds_str.split("][").collect();
        let left_top = parts[0].trim_start_matches('[');
        let right_bottom = parts[1].trim_end_matches(']');
        let lt_parts: Vec<i32> = left_top.split(',').map(|s| s.parse().unwrap()).collect();
        let rb_parts: Vec<i32> = right_bottom.split(',').map(|s| s.parse().unwrap()).collect();
        let bounds = ElementBounds {
            left: lt_parts[0],
            top: lt_parts[1],
            right: rb_parts[0],
            bottom: rb_parts[1],
        };

        UIElement {
            id: "".to_string(),
            element_type: UIElementType::Other,
            text: text.unwrap_or("").to_string(),
            bounds,
            xpath: "".to_string(),
            resource_id: resource_id.map(|s| s.to_string()),
            package_name: Some("com.example".to_string()),
            class_name: Some(class.to_string()),
            clickable: true,
            scrollable: false,
            enabled: true,
            focused: false,
            checkable: false,
            checked: false,
            selected: false,
            password: false,
            content_desc: content_desc.unwrap_or("").to_string(),
            index_path: None,
            region: None,
            children: vec![],
            parent: None,
            depth: 0,
        }
    }
    
    #[test]
    fn test_is_empty_self() {
        let generator = RelationSeedGenerator;
        
        // 创建一个字段稀薄的元素
        let empty_element = create_test_element(Some(""), None, None, "android.view.View", "[0,0][100,100]");
        
        assert!(generator.is_empty_self(&empty_element));
        
        // 创建一个有足够信息的元素
        let rich_element = create_test_element(Some("关注"), Some("关注按钮"), Some("btn_follow"), "android.widget.Button", "[0,0][100,100]");
        
        assert!(!generator.is_empty_self(&rich_element));
    }
    
    #[test]
    fn test_generate_relation_seed() {
        let generator = RelationSeedGenerator;
        let element = create_test_element(None, None, None, "android.view.View", "[0,0][100,100]");
        
        let seed = generator.generate_relation_seed(&element);
        
        assert!(!seed.parent_hints.is_empty());
        assert!(!seed.child_hints.is_empty());
        assert!(seed.container_context.is_some());
    }
}

