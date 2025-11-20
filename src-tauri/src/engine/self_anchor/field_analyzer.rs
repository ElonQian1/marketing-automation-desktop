// src-tauri/src/engine/self_anchor/field_analyzer.rs
// module: engine/self_anchor | layer: field_analyzer | role: 单字段重复性分析器
// summary: 分析UIElement的每个字段在页面中的重复情况，计算唯一性和稳定性评分

use super::{FieldScore, FieldScoreMap};
use crate::services::universal_ui_page_analyzer::UIElement;
use std::collections::HashMap;

/// UI元素字段枚举 - 消除字符串硬编码，提升类型安全与性能
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum UIField {
    ResourceId,
    ContentDesc,
    Text,
    Class,
    Package,
    Clickable,
    Enabled,
    Bounds,
}

impl UIField {
    /// 获取所有字段变体
    pub fn all() -> &'static [UIField] {
        &[
            UIField::ResourceId,
            UIField::ContentDesc,
            UIField::Text,
            UIField::Class,
            UIField::Package,
            UIField::Clickable,
            UIField::Enabled,
            UIField::Bounds,
        ]
    }

    /// 获取字段名称（用于输出和兼容旧接口）
    pub fn as_str(&self) -> &'static str {
        match self {
            UIField::ResourceId => "resource_id",
            UIField::ContentDesc => "content_desc",
            UIField::Text => "text",
            UIField::Class => "class",
            UIField::Package => "package",
            UIField::Clickable => "clickable",
            UIField::Enabled => "enabled",
            UIField::Bounds => "bounds",
        }
    }

    /// 从元素中提取用于显示的字符串值
    /// 返回 None 表示该字段在此元素上无效或为空，不需要分析
    pub fn extract_display_value(&self, element: &UIElement) -> Option<String> {
        match self {
            UIField::ResourceId => element.resource_id.clone().filter(|s| !s.trim().is_empty()),
            UIField::ContentDesc => if !element.content_desc.trim().is_empty() { Some(element.content_desc.clone()) } else { None },
            UIField::Text => if !element.text.trim().is_empty() { Some(element.text.clone()) } else { None },
            UIField::Class => element.class_name.clone().filter(|s| !s.trim().is_empty()),
            UIField::Package => element.package_name.clone().filter(|s| !s.trim().is_empty()),
            UIField::Clickable => Some(element.clickable.to_string()),
            UIField::Enabled => if element.enabled { Some("true".to_string()) } else { None },
            UIField::Bounds => Some(element.bounds.to_string()),
        }
    }

    /// 检查两个元素在该字段上是否相等（高性能比较，无内存分配）
    pub fn is_equal(&self, a: &UIElement, b: &UIElement) -> bool {
        match self {
            UIField::ResourceId => a.resource_id == b.resource_id,
            UIField::ContentDesc => a.content_desc == b.content_desc,
            UIField::Text => a.text == b.text,
            UIField::Class => a.class_name == b.class_name,
            UIField::Package => a.package_name == b.package_name,
            UIField::Clickable => a.clickable == b.clickable,
            UIField::Enabled => a.enabled == b.enabled,
            UIField::Bounds => a.bounds == b.bounds,
        }
    }
}

/// 字段分析器 - 负责单个字段的重复性和唯一性分析
pub struct FieldAnalyzer {
    /// 字段权重配置
    field_weights: HashMap<UIField, f64>,
    /// 稳定性权重配置
    stability_factors: HashMap<UIField, f64>,
}

impl FieldAnalyzer {
    pub fn new() -> Self {
        let mut field_weights = HashMap::new();
        field_weights.insert(UIField::ResourceId, 1.0);
        field_weights.insert(UIField::ContentDesc, 0.95);
        field_weights.insert(UIField::Text, 0.85);
        field_weights.insert(UIField::Class, 0.6);
        field_weights.insert(UIField::Package, 0.7);
        field_weights.insert(UIField::Clickable, 0.4);
        field_weights.insert(UIField::Enabled, 0.4);
        field_weights.insert(UIField::Bounds, 0.1);

        let mut stability_factors = HashMap::new();
        stability_factors.insert(UIField::ResourceId, 0.95);
        stability_factors.insert(UIField::ContentDesc, 0.90);
        stability_factors.insert(UIField::Text, 0.7);
        stability_factors.insert(UIField::Class, 0.85);
        stability_factors.insert(UIField::Package, 0.98);
        stability_factors.insert(UIField::Clickable, 0.9);
        stability_factors.insert(UIField::Enabled, 0.8);
        stability_factors.insert(UIField::Bounds, 0.2);

        Self {
            field_weights,
            stability_factors,
        }
    }

    /// 分析目标元素的所有字段
    pub async fn analyze_all_fields(
        &self,
        target_element: &UIElement,
        page_elements: &[UIElement],
    ) -> Result<FieldScoreMap, String> {
        let mut field_scores = FieldScoreMap::new();

        for field in UIField::all() {
            if let Some(display_value) = field.extract_display_value(target_element) {
                let score = self.analyze_single_field(*field, &display_value, target_element, page_elements)?;
                field_scores.insert(field.as_str().to_string(), score);
            }
        }

        Ok(field_scores)
    }

    /// 分析单个字段的重复性和唯一性
    fn analyze_single_field(
        &self,
        field: UIField,
        display_value: &str,
        target_element: &UIElement,
        page_elements: &[UIElement],
    ) -> Result<FieldScore, String> {
        // 计算重复次数 (高性能)
        let duplicate_count = self.count_field_duplicates(field, target_element, page_elements);

        // 计算唯一性评分
        let uniqueness_score = self.calculate_uniqueness_score(duplicate_count, page_elements.len());

        // 获取配置
        let stability_score = *self.stability_factors.get(&field).unwrap_or(&0.5);
        let field_weight = *self.field_weights.get(&field).unwrap_or(&0.5);

        // 计算最终评分
        let final_score = uniqueness_score * stability_score * field_weight;

        // 生成评分理由
        let reasoning = self.generate_field_reasoning(
            field,
            display_value,
            duplicate_count,
            uniqueness_score,
            stability_score,
            field_weight,
        );

        Ok(FieldScore {
            value: display_value.to_string(),
            uniqueness_score,
            stability_score,
            duplicate_count,
            field_weight,
            final_score,
            reasoning,
        })
    }

    /// 统计字段重复次数 (高性能实现，避免字符串分配)
    fn count_field_duplicates(
        &self,
        field: UIField,
        target_element: &UIElement,
        page_elements: &[UIElement],
    ) -> usize {
        page_elements.iter()
            .filter(|element| field.is_equal(element, target_element))
            .count()
    }

    /// 计算唯一性评分（基于重复次数）
    fn calculate_uniqueness_score(&self, duplicate_count: usize, total_elements: usize) -> f64 {
        if duplicate_count == 0 {
            return 0.0; // 找不到元素
        }

        if duplicate_count == 1 {
            return 1.0; // 完全唯一
        }

        // 使用对数函数平滑处理重复次数
        let ratio = duplicate_count as f64 / total_elements as f64;
        let base_score = 1.0 - ratio;

        // 对重复次数应用惩罚
        let penalty = match duplicate_count {
            2..=3 => 0.8,      // 少量重复，适中惩罚
            4..=10 => 0.5,     // 中等重复，较大惩罚
            11..=50 => 0.2,    // 大量重复，严重惩罚
            _ => 0.05,         // 极大量重复，几乎无用
        };

        (base_score * penalty).max(0.0).min(1.0)
    }

    /// 生成字段评分理由
    fn generate_field_reasoning(
        &self,
        field: UIField,
        _field_value: &str,
        duplicate_count: usize,
        uniqueness_score: f64,
        stability_score: f64,
        field_weight: f64,
    ) -> String {
        let uniqueness_desc = match duplicate_count {
            0 => "❌ 字段值不存在".to_string(),
            1 => "✅ 完全唯一".to_string(),
            2..=3 => format!("⚠️ 少量重复({}个)", duplicate_count),
            4..=10 => format!("⚠️ 中等重复({}个)", duplicate_count),
            _ => format!("❌ 大量重复({}个)", duplicate_count),
        };

        let stability_desc = if stability_score >= 0.9 {
            "极高稳定性"
        } else if stability_score >= 0.8 {
            "高稳定性"
        } else if stability_score >= 0.6 {
            "中等稳定性"
        } else {
            "低稳定性"
        };

        let weight_desc = if field_weight >= 0.9 {
            "最高权重"
        } else if field_weight >= 0.7 {
            "高权重"
        } else if field_weight >= 0.5 {
            "中等权重"
        } else {
            "低权重"
        };

        format!(
            "{} | {} | {} | 唯一性:{:.2} | 最终评分:{:.2} [{}]",
            uniqueness_desc,
            stability_desc,
            weight_desc,
            uniqueness_score,
            uniqueness_score * stability_score * field_weight,
            field.as_str()
        )
    }

    /// 获取字段的启发式唯一性预测 (兼容旧接口，但内部逻辑可优化)
    pub fn predict_field_uniqueness(&self, field_name: &str, field_value: &str) -> f64 {
        match field_name {
            "resource_id" => self.predict_resource_id_uniqueness(field_value),
            "content_desc" => self.predict_content_desc_uniqueness(field_value),
            "text" => self.predict_text_uniqueness(field_value),
            "class" => self.predict_class_uniqueness(field_value),
            _ => 0.5, // 默认中等唯一性
        }
    }

    /// 预测 resource_id 的唯一性
    fn predict_resource_id_uniqueness(&self, resource_id: &str) -> f64 {
        // 基于命名模式的启发式规则
        let common_repeating_patterns = [
            "item", "list", "cell", "entry",           // 列表项：高重复
            "tab", "nav", "menu", "button",            // 导航/按钮：中等重复
            "content", "container", "layout", "frame", // 容器：中等重复
        ];

        let unique_patterns = [
            "main", "root", "header", "footer",        // 主容器：低重复
            "title", "logo", "brand", "search",        // 特殊元素：低重复
        ];

        for pattern in &common_repeating_patterns {
            if resource_id.to_lowercase().contains(pattern) {
                return 0.3; // 预测高重复性
            }
        }

        for pattern in &unique_patterns {
            if resource_id.to_lowercase().contains(pattern) {
                return 0.9; // 预测高唯一性
            }
        }

        0.6 // 默认中等唯一性
    }

    /// 预测 content_desc 的唯一性
    fn predict_content_desc_uniqueness(&self, content_desc: &str) -> f64 {
        let common_descriptions = [
            "按钮", "图标", "更多", "操作", "点击", "可点击",
            "button", "icon", "more", "action", "click", "clickable",
        ];

        for common in &common_descriptions {
            if content_desc.to_lowercase().contains(common) {
                return 0.2; // 预测高重复性
            }
        }

        // 长文本通常更唯一
        if content_desc.len() > 10 {
            return 0.8;
        } else if content_desc.len() > 5 {
            return 0.6;
        } else {
            return 0.4;
        }
    }

    /// 预测文本的唯一性
    fn predict_text_uniqueness(&self, text: &str) -> f64 {
        // 纯数字、符号通常重复性高
        if text.chars().all(|c| c.is_numeric() || c.is_ascii_punctuation()) {
            return 0.2;
        }

        // 单个字符重复性高
        if text.len() == 1 {
            return 0.1;
        }

        // 长文本唯一性更高
        if text.len() > 20 {
            return 0.9;
        } else if text.len() > 5 {
            return 0.7;
        } else {
            return 0.5;
        }
    }

    /// 预测类名的唯一性
    fn predict_class_uniqueness(&self, class_name: &str) -> f64 {
        // Android 系统类通常重复性高
        if class_name.starts_with("android.") {
            return 0.2;
        }

        // 自定义类相对更唯一
        if class_name.contains(".") && !class_name.starts_with("android.") {
            return 0.6;
        }

        0.4 // 默认
    }
}

impl Default for FieldAnalyzer {
    fn default() -> Self {
        Self::new()
    }
}


