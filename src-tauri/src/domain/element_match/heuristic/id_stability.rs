// src-tauri/src/domain/element_match/heuristic/id_stability.rs
// module: element_match | layer: domain | role: ID稳定性评估器
// summary: 检测混淆ID、动态ID，评估resource-id的可靠性

/// ID稳定性评估结果
#[derive(Debug, Clone)]
pub struct IdStabilityAssessment {
    /// 稳定性分数 (0.0 - 1.0)
    pub stability_score: f64,
    /// 是否为混淆ID
    pub is_obfuscated: bool,
    /// 是否为动态ID（含时间戳、随机数等）
    pub is_dynamic: bool,
    /// 是否为通用容器ID
    pub is_generic_container: bool,
    /// 评估原因
    pub reason: String,
    /// 建议：是否应该信任此ID
    pub should_trust: bool,
}

/// ID稳定性评估器
/// 
/// 设计理念：
/// - 长期主义：即使当前能匹配，不稳定的ID在应用更新后可能失效
/// - 防御式编程：对可疑ID降权，宁可用其他策略也不依赖不稳定ID
pub struct IdStabilityAnalyzer {
    /// 小红书应用的包名前缀
    xhs_package_prefix: &'static str,
}

impl IdStabilityAnalyzer {
    pub fn new() -> Self {
        Self {
            xhs_package_prefix: "com.xingin.xhs:id/",
        }
    }

    /// 评估resource-id的稳定性
    pub fn assess(&self, resource_id: &str) -> IdStabilityAssessment {
        // 空ID或无效ID
        if resource_id.is_empty() || resource_id == "NO_ID" {
            return IdStabilityAssessment {
                stability_score: 0.0,
                is_obfuscated: false,
                is_dynamic: false,
                is_generic_container: false,
                reason: "无效的resource-id".to_string(),
                should_trust: false,
            };
        }

        // 提取ID名称部分（去掉包名前缀）
        let id_name = self.extract_id_name(resource_id);

        // 检测各种不稳定模式
        let obfuscation_check = self.check_obfuscation(&id_name);
        let dynamic_check = self.check_dynamic_patterns(&id_name);
        let container_check = self.check_generic_container(&id_name);

        // 计算综合稳定性分数
        let mut stability_score = 1.0;
        let mut reasons = Vec::new();

        if obfuscation_check.0 {
            stability_score *= 0.2; // 混淆ID：重大惩罚
            reasons.push(obfuscation_check.1);
        }

        if dynamic_check.0 {
            stability_score *= 0.3; // 动态ID：大惩罚
            reasons.push(dynamic_check.1);
        }

        if container_check.0 {
            stability_score *= 0.6; // 容器ID：中等惩罚
            reasons.push(container_check.1);
        }

        // 检查ID长度和命名质量
        let naming_quality = self.assess_naming_quality(&id_name);
        stability_score *= naming_quality.0;
        if naming_quality.0 < 1.0 {
            reasons.push(naming_quality.1);
        }

        let reason = if reasons.is_empty() {
            "ID命名规范，稳定性良好".to_string()
        } else {
            reasons.join("; ")
        };

        IdStabilityAssessment {
            stability_score,
            is_obfuscated: obfuscation_check.0,
            is_dynamic: dynamic_check.0,
            is_generic_container: container_check.0,
            reason,
            should_trust: stability_score >= 0.6, // 60%以上才信任
        }
    }

    /// 提取ID名称（去掉包名前缀）
    fn extract_id_name(&self, resource_id: &str) -> String {
        if resource_id.starts_with(self.xhs_package_prefix) {
            resource_id[self.xhs_package_prefix.len()..].to_string()
        } else if resource_id.contains(":id/") {
            // 其他包名格式
            resource_id.split(":id/").last().unwrap_or(resource_id).to_string()
        } else {
            resource_id.to_string()
        }
    }

    /// 检测混淆模式
    /// 返回 (是否混淆, 原因)
    fn check_obfuscation(&self, id_name: &str) -> (bool, String) {
        // 模式1: 明确的混淆标记
        if id_name.contains("obfuscated") {
            return (true, "ID包含'obfuscated'标记".to_string());
        }

        // 模式2: 以数字开头（如 0_resource_name_obfuscated）
        if id_name.starts_with(|c: char| c.is_ascii_digit()) {
            // 但要区分正常的编号（如 button1）vs 混淆（如 0_xxx）
            if id_name.starts_with("0_") || id_name.starts_with("1_") {
                return (true, format!("ID以'{}'开头，疑似混淆", &id_name[..2]));
            }
        }

        // 模式3: 纯字母数字混合且无明确含义（如 a1b2c3）
        if self.looks_like_hash(id_name) {
            return (true, "ID看起来像哈希值或随机字符串".to_string());
        }

        // 模式4: ProGuard常见的单字母或双字母变量名
        if id_name.len() <= 2 && id_name.chars().all(|c| c.is_ascii_lowercase()) {
            return (true, format!("ID过短'{}'，疑似ProGuard混淆", id_name));
        }

        (false, String::new())
    }

    /// 检测动态ID模式
    fn check_dynamic_patterns(&self, id_name: &str) -> (bool, String) {
        // 模式1: 包含时间戳模式（13位数字）
        let digit_sequences: Vec<&str> = id_name
            .split(|c: char| !c.is_ascii_digit())
            .filter(|s| s.len() >= 10)
            .collect();
        
        if !digit_sequences.is_empty() {
            return (true, "ID包含长数字序列，可能是时间戳".to_string());
        }

        // 模式2: 包含UUID模式
        if id_name.contains('-') && id_name.len() > 20 {
            let parts: Vec<&str> = id_name.split('-').collect();
            if parts.len() >= 4 {
                return (true, "ID包含UUID模式".to_string());
            }
        }

        // 模式3: 以 _数字 结尾（如 item_123）
        if let Some(last_part) = id_name.rsplit('_').next() {
            if last_part.chars().all(|c| c.is_ascii_digit()) && last_part.len() >= 3 {
                return (true, format!("ID以动态数字'_{}'结尾", last_part));
            }
        }

        (false, String::new())
    }

    /// 检测通用容器ID
    fn check_generic_container(&self, id_name: &str) -> (bool, String) {
        let generic_patterns = [
            "container",
            "wrapper",
            "layout",
            "frame",
            "root",
            "content",
            "main",
            "holder",
            "parent",
            "child",
        ];

        let id_lower = id_name.to_lowercase();
        for pattern in &generic_patterns {
            if id_lower == *pattern || id_lower.ends_with(pattern) {
                return (true, format!("ID是通用容器名称'{}'", pattern));
            }
        }

        (false, String::new())
    }

    /// 评估命名质量
    fn assess_naming_quality(&self, id_name: &str) -> (f64, String) {
        // 检查是否有下划线或驼峰命名（表明是有意义的命名）
        let has_snake_case = id_name.contains('_') && id_name.len() > 3;
        let has_camel_case = id_name.chars().any(|c| c.is_ascii_uppercase());

        if !has_snake_case && !has_camel_case && id_name.len() <= 5 {
            return (0.7, "ID命名过短且无明确结构".to_string());
        }

        // 检查是否有语义化命名
        let semantic_keywords = [
            "btn", "button", "text", "image", "icon", "title", "desc",
            "header", "footer", "nav", "menu", "tab", "list", "item",
            "card", "avatar", "name", "info", "detail", "action",
        ];

        let id_lower = id_name.to_lowercase();
        for keyword in &semantic_keywords {
            if id_lower.contains(keyword) {
                return (1.0, String::new()); // 有语义化命名，满分
            }
        }

        (0.85, "ID缺乏明确的语义化命名".to_string())
    }

    /// 判断是否像哈希值
    fn looks_like_hash(&self, s: &str) -> bool {
        if s.len() < 8 {
            return false;
        }

        // 哈希特征：高熵值、字母数字混合、无明显单词
        let chars: Vec<char> = s.chars().collect();
        let has_letters = chars.iter().any(|c| c.is_ascii_alphabetic());
        let has_digits = chars.iter().any(|c| c.is_ascii_digit());
        let no_underscores = !s.contains('_');
        let no_camel = !chars.windows(2).any(|w| w[0].is_ascii_lowercase() && w[1].is_ascii_uppercase());

        has_letters && has_digits && no_underscores && no_camel && s.len() >= 16
    }
}

impl Default for IdStabilityAnalyzer {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_obfuscated_id() {
        let analyzer = IdStabilityAnalyzer::new();
        
        // 明确的混淆ID
        let result = analyzer.assess("com.xingin.xhs:id/0_resource_name_obfuscated");
        assert!(result.is_obfuscated);
        assert!(result.stability_score < 0.3);
        assert!(!result.should_trust);
    }

    #[test]
    fn test_stable_id() {
        let analyzer = IdStabilityAnalyzer::new();
        
        // 稳定的语义化ID
        let result = analyzer.assess("com.xingin.xhs:id/home_tab_button");
        assert!(!result.is_obfuscated);
        assert!(!result.is_dynamic);
        assert!(result.stability_score >= 0.8);
        assert!(result.should_trust);
    }

    #[test]
    fn test_dynamic_id() {
        let analyzer = IdStabilityAnalyzer::new();
        
        // 动态ID
        let result = analyzer.assess("com.xingin.xhs:id/item_1733312345678");
        assert!(result.is_dynamic);
        assert!(!result.should_trust);
    }

    #[test]
    fn test_container_id() {
        let analyzer = IdStabilityAnalyzer::new();
        
        // 通用容器ID
        let result = analyzer.assess("com.xingin.xhs:id/content_container");
        assert!(result.is_generic_container);
        assert!(result.stability_score < 0.8);
    }
}
