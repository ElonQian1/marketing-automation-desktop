// src-tauri/src/exec/v3/element_matching/text_comparator.rs
// module: v3-execution | layer: matching | role: 文本对比器
// summary: 计算两个文本的相似度，支持多种对比算法

/// 文本对比结果
#[derive(Debug, Clone)]
pub struct ComparisonResult {
    pub similarity: f32,
    pub exact_match: bool,
    pub contains: bool,
}

/// 文本对比器
pub struct TextComparator;

impl TextComparator {
    /// 计算两个文本的相似度（0.0-1.0）
    /// 
    /// 算法：
    /// 1. 完全相同 → 1.0
    /// 2. 忽略空格后相同 → 0.95
    /// 3. 一个包含另一个 → 0.8
    /// 4. 基于公共字符比例 → 0.0-0.7
    pub fn calculate_similarity(text1: &str, text2: &str) -> f32 {
        let t1 = text1.trim();
        let t2 = text2.trim();
        
        // 完全相同
        if t1 == t2 {
            return 1.0;
        }
        
        // 忽略大小写后相同
        if t1.eq_ignore_ascii_case(t2) {
            return 0.98;
        }
        
        // 去除空格后相同
        let t1_no_space = t1.replace(&[' ', '\t', '\n'] as &[char], "");
        let t2_no_space = t2.replace(&[' ', '\t', '\n'] as &[char], "");
        if t1_no_space == t2_no_space {
            return 0.95;
        }
        
        // 包含关系
        if t1.contains(t2) || t2.contains(t1) {
            let shorter_len = t1.len().min(t2.len());
            let longer_len = t1.len().max(t2.len());
            return 0.8 * (shorter_len as f32 / longer_len as f32);
        }
        
        // 基于公共字符的相似度
        Self::character_similarity(t1, t2)
    }
    
    /// 基于公共字符数计算相似度
    fn character_similarity(text1: &str, text2: &str) -> f32 {
        if text1.is_empty() || text2.is_empty() {
            return 0.0;
        }
        
        let chars1: Vec<char> = text1.chars().collect();
        let chars2: Vec<char> = text2.chars().collect();
        
        let common_count: usize = chars1.iter()
            .filter(|c| chars2.contains(c))
            .count();
        
        let max_len = chars1.len().max(chars2.len()) as f32;
        common_count as f32 / max_len * 0.7 // 最高0.7分
    }
    
    /// 详细对比结果
    pub fn compare(text1: &str, text2: &str) -> ComparisonResult {
        let similarity = Self::calculate_similarity(text1, text2);
        let exact_match = text1.trim() == text2.trim();
        let contains = text1.contains(text2) || text2.contains(text1);
        
        ComparisonResult {
            similarity,
            exact_match,
            contains,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_exact_match() {
        let sim = TextComparator::calculate_similarity("测试", "测试");
        assert_eq!(sim, 1.0);
    }
    
    #[test]
    fn test_case_insensitive() {
        let sim = TextComparator::calculate_similarity("Test", "test");
        assert_eq!(sim, 0.98);
    }
    
    #[test]
    fn test_whitespace() {
        let sim = TextComparator::calculate_similarity("测 试", "测试");
        assert_eq!(sim, 0.95);
    }
    
    #[test]
    fn test_contains() {
        let sim = TextComparator::calculate_similarity("添加朋友按钮", "添加朋友");
        assert!(sim >= 0.8);
    }
}
