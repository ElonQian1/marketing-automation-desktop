// src-tauri/src/engine/self_anchor/field_analyzer.rs
// module: engine/self_anchor | layer: field_analyzer | role: 单字段重复性分析器
// summary: 分析UIElement的每个字段在页面中的重复情况，计算唯一性和稳定性评分

use super::{FieldScore, FieldScoreMap};
use crate::services::ui_reader_service::UIElement;
use std::collections::HashMap;

/// 字段分析器 - 负责单个字段的重复性和唯一性分析
pub struct FieldAnalyzer {
    /// 字段权重配置
    field_weights: HashMap<String, f64>,
    /// 稳定性权重配置
    stability_factors: HashMap<String, f64>,
}

impl FieldAnalyzer {
    pub fn new() -> Self {
        let mut field_weights = HashMap::new();
        field_weights.insert("resource_id".to_string(), 1.0);    // 最高权重
        field_weights.insert("content_desc".to_string(), 0.95);  // 次高权重
        field_weights.insert("text".to_string(), 0.85);          // 中高权重
        field_weights.insert("class".to_string(), 0.6);          // 中等权重
        field_weights.insert("package".to_string(), 0.7);        // 中等权重
        field_weights.insert("clickable".to_string(), 0.4);      // 低权重
        field_weights.insert("enabled".to_string(), 0.4);        // 低权重
        field_weights.insert("bounds".to_string(), 0.1);         // 最低权重

        let mut stability_factors = HashMap::new();
        stability_factors.insert("resource_id".to_string(), 0.95);    // 极高稳定性
        stability_factors.insert("content_desc".to_string(), 0.90);   // 高稳定性
        stability_factors.insert("text".to_string(), 0.7);            // 中等稳定性（可能翻译变化）
        stability_factors.insert("class".to_string(), 0.85);          // 高稳定性
        stability_factors.insert("package".to_string(), 0.98);        // 极高稳定性
        stability_factors.insert("clickable".to_string(), 0.9);       // 高稳定性
        stability_factors.insert("enabled".to_string(), 0.8);         // 中高稳定性
        stability_factors.insert("bounds".to_string(), 0.2);          // 极低稳定性

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

        // 分析 resource_id
        if let Some(resource_id) = &target_element.resource_id {
            if !resource_id.trim().is_empty() {
                field_scores.insert("resource_id".to_string(), self.analyze_single_field(
                    "resource_id",
                    resource_id,
                    page_elements,
                )?);
            }
        }

        // 分析 content_desc
        if let Some(content_desc) = &target_element.content_desc {
            if !content_desc.trim().is_empty() {
                field_scores.insert("content_desc".to_string(), self.analyze_single_field(
                    "content_desc",
                    content_desc,
                    page_elements,
                )?);
            }
        }

        // 分析 text
        if let Some(text) = &target_element.text {
            if !text.trim().is_empty() {
                field_scores.insert("text".to_string(), self.analyze_single_field(
                    "text",
                    text,
                    page_elements,
                )?);
            }
        }

        // 分析 class
        if let Some(class) = &target_element.class {
            if !class.trim().is_empty() {
                field_scores.insert("class".to_string(), self.analyze_single_field(
                    "class",
                    class,
                    page_elements,
                )?);
            }
        }

        // 分析 package
        if let Some(package) = &target_element.package {
            if !package.trim().is_empty() {
                field_scores.insert("package".to_string(), self.analyze_single_field(
                    "package",
                    package,
                    page_elements,
                )?);
            }
        }

        // 分析 clickable
        if let Some(clickable) = target_element.clickable {
            field_scores.insert("clickable".to_string(), self.analyze_single_field(
                "clickable",
                &clickable.to_string(),
                page_elements,
            )?);
        }

        // 分析 enabled
        if let Some(enabled) = target_element.enabled {
            field_scores.insert("enabled".to_string(), self.analyze_single_field(
                "enabled",
                &enabled.to_string(),
                page_elements,
            )?);
        }

        // 分析 bounds
        if let Some(bounds) = &target_element.bounds {
            if !bounds.trim().is_empty() {
                field_scores.insert("bounds".to_string(), self.analyze_single_field(
                    "bounds",
                    bounds,
                    page_elements,
                )?);
            }
        }

        Ok(field_scores)
    }

    /// 分析单个字段的重复性和唯一性
    pub fn analyze_single_field(
        &self,
        field_name: &str,
        field_value: &str,
        page_elements: &[UIElement],
    ) -> Result<FieldScore, String> {
        // 计算重复次数
        let duplicate_count = self.count_field_duplicates(field_name, field_value, page_elements);

        // 计算唯一性评分
        let uniqueness_score = self.calculate_uniqueness_score(duplicate_count, page_elements.len());

        // 获取稳定性评分
        let stability_score = self.stability_factors
            .get(field_name)
            .copied()
            .unwrap_or(0.5);

        // 获取字段权重
        let field_weight = self.field_weights
            .get(field_name)
            .copied()
            .unwrap_or(0.5);

        // 计算最终评分
        let final_score = uniqueness_score * stability_score * field_weight;

        // 生成评分理由
        let reasoning = self.generate_field_reasoning(
            field_name,
            field_value,
            duplicate_count,
            uniqueness_score,
            stability_score,
            field_weight,
        );

        Ok(FieldScore {
            value: field_value.to_string(),
            uniqueness_score,
            stability_score,
            duplicate_count,
            field_weight,
            final_score,
            reasoning,
        })
    }

    /// 统计字段重复次数
    fn count_field_duplicates(
        &self,
        field_name: &str,
        field_value: &str,
        page_elements: &[UIElement],
    ) -> usize {
        page_elements.iter().filter(|element| {
            match field_name {
                "resource_id" => element.resource_id.as_deref() == Some(field_value),
                "content_desc" => element.content_desc.as_deref() == Some(field_value),
                "text" => element.text.as_deref() == Some(field_value),
                "class" => element.class.as_deref() == Some(field_value),
                "package" => element.package.as_deref() == Some(field_value),
                "clickable" => element.clickable.map(|b| b.to_string()).as_deref() == Some(field_value),
                "enabled" => element.enabled.map(|b| b.to_string()).as_deref() == Some(field_value),
                "bounds" => element.bounds.as_deref() == Some(field_value),
                _ => false,
            }
        }).count()
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
        field_name: &str,
        field_value: &str,
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
            "{} | {} | {} | 唯一性:{:.2} | 最终评分:{:.2}",
            uniqueness_desc,
            stability_desc,
            weight_desc,
            uniqueness_score,
            uniqueness_score * stability_score * field_weight
        )
    }

    /// 获取字段的启发式唯一性预测
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