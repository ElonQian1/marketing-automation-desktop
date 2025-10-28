// src-tauri/src/services/execution/matching/strategies/candidate_scorer.rs
// module: execution | layer: domain | role: 候选元素评分系统
// summary: 为关系锚点策略提供完善的候选元素评分机制

use std::collections::HashMap;

/// 🎯 候选元素评分结果
#[derive(Debug, Clone)]
pub struct CandidateScore {
    /// 总分
    pub total_score: f32,
    /// 文本匹配得分
    pub text_match_score: f32,
    /// Bounds位置得分
    pub bounds_score: f32,
    /// 可点击性得分
    pub clickable_score: f32,
    /// 容器大小合理性得分
    pub size_reasonableness_score: f32,
    /// 详细说明
    pub explanation: String,
}

/// 🎯 评分配置
#[derive(Debug, Clone)]
pub struct ScoringConfig {
    /// 锚点文本列表（用于完全匹配检测）
    pub anchor_texts: Vec<String>,
    /// 用户选择的bounds（用于位置匹配）
    pub user_bounds: Option<String>,
    /// 🆕 用户选择的静态全局XPath（用于精确匹配）
    pub user_xpath: Option<String>,
    /// 是否要求可点击
    pub require_clickable: bool,
    /// Bounds容差（像素）
    pub bounds_tolerance: i32,
}

impl ScoringConfig {
    pub fn new(anchor_texts: Vec<String>, user_bounds: Option<String>) -> Self {
        Self {
            anchor_texts,
            user_bounds,
            user_xpath: None,
            require_clickable: true,
            bounds_tolerance: 20,
        }
    }
    
    /// 🆕 带XPath的构造函数
    pub fn with_xpath(
        anchor_texts: Vec<String>,
        user_bounds: Option<String>,
        user_xpath: Option<String>,
    ) -> Self {
        Self {
            anchor_texts,
            user_bounds,
            user_xpath,
            require_clickable: true,
            bounds_tolerance: 20,
        }
    }
}

/// 🎯 候选元素评分器
pub struct CandidateScorer;

impl CandidateScorer {
    /// 📊 对候选元素进行综合评分
    pub fn score_candidate(
        candidate: &HashMap<String, String>,
        config: &ScoringConfig,
    ) -> CandidateScore {
        let mut explanation = Vec::new();
        
        // 🔍 判断是否有关系锚点文本
        let has_anchor_texts = !config.anchor_texts.is_empty();
        
        let total_score = if has_anchor_texts {
            // 场景1: 有子/父元素文本 → 使用关系锚点评分
            // 1️⃣ 文本匹配得分（最高优先级：40分）
            let text_match_score = Self::calculate_text_match_score(candidate, config, &mut explanation);
            
            // 2️⃣ Bounds位置得分（30分）
            let bounds_score = Self::calculate_bounds_score(candidate, config, &mut explanation);
            
            // 3️⃣ 可点击性得分（20分）
            let clickable_score = Self::calculate_clickable_score(candidate, config, &mut explanation);
            
            // 4️⃣ 容器大小合理性得分（10分）
            let size_score = Self::calculate_size_reasonableness_score(candidate, config, &mut explanation);
            
            text_match_score + bounds_score + clickable_score + size_score
        } else {
            // 场景2: 无子/父元素文本 → 使用静态XPath + Bounds精确匹配
            explanation.push("⚠️ 无关系锚点文本，使用XPath+Bounds精确匹配".to_string());
            
            // 1️⃣ XPath精确匹配得分（50分）
            let xpath_score = Self::calculate_xpath_match_score(candidate, config, &mut explanation);
            
            // 2️⃣ Bounds精确匹配得分（50分）
            let bounds_score = Self::calculate_bounds_precision_score(candidate, config, &mut explanation);
            
            xpath_score + bounds_score
        };
        
        CandidateScore {
            total_score,
            text_match_score: 0.0, // 在无锚点模式下不使用
            bounds_score: 0.0,
            clickable_score: 0.0,
            size_reasonableness_score: 0.0,
            explanation: explanation.join(" | "),
        }
    }
    
    /// 📝 计算文本匹配得分（最高优先级：40分）
    fn calculate_text_match_score(
        candidate: &HashMap<String, String>,
        config: &ScoringConfig,
        explanation: &mut Vec<String>,
    ) -> f32 {
        let element_text = candidate.get("text").map(|s| s.as_str()).unwrap_or("");
        let content_desc = candidate.get("content-desc").map(|s| s.as_str()).unwrap_or("");
        
        let mut score = 0.0;
        let mut exact_matches = Vec::new();
        let mut partial_matches = Vec::new();
        
        for anchor_text in &config.anchor_texts {
            // 🎯 完全匹配（最高分）
            if element_text == anchor_text || content_desc == anchor_text {
                score += 40.0; // 每个完全匹配给满分
                exact_matches.push(anchor_text.clone());
            }
            // 🎯 包含匹配（中等分）
            else if element_text.contains(anchor_text) || content_desc.contains(anchor_text) {
                score += 20.0;
                partial_matches.push(anchor_text.clone());
            }
        }
        
        // 如果有多个完全匹配，取最高分（不累加）
        if !exact_matches.is_empty() {
            score = 40.0;
            explanation.push(format!("✅ 文本完全匹配: {:?}", exact_matches));
        } else if !partial_matches.is_empty() {
            score = 20.0;
            explanation.push(format!("⚠️ 文本部分匹配: {:?}", partial_matches));
        } else {
            score = 0.0;
            explanation.push("❌ 无文本匹配".to_string());
        }
        
        score
    }
    
    /// 📍 计算Bounds位置得分（30分）
    fn calculate_bounds_score(
        candidate: &HashMap<String, String>,
        config: &ScoringConfig,
        explanation: &mut Vec<String>,
    ) -> f32 {
        let user_bounds = match &config.user_bounds {
            Some(b) => b,
            None => {
                explanation.push("⚪ 无用户bounds参考".to_string());
                return 0.0;
            }
        };
        
        let elem_bounds = candidate.get("bounds").map(|s| s.as_str()).unwrap_or("");
        if elem_bounds.is_empty() {
            explanation.push("❌ 元素无bounds".to_string());
            return 0.0;
        }
        
        // 🎯 完全匹配bounds（满分）
        if elem_bounds == user_bounds {
            explanation.push("✅ Bounds完全匹配".to_string());
            return 30.0;
        }
        
        // 📏 计算距离并打分
        let distance = Self::calculate_bounds_distance(user_bounds, elem_bounds);
        
        if distance == i32::MAX {
            explanation.push("❌ Bounds格式错误".to_string());
            return 0.0;
        }
        
        // 距离评分：容差内给满分，超出则递减
        let score = if distance <= config.bounds_tolerance {
            30.0 // 容差内满分
        } else if distance <= config.bounds_tolerance * 2 {
            20.0 // 两倍容差内高分
        } else if distance <= config.bounds_tolerance * 5 {
            10.0 // 五倍容差内中分
        } else {
            5.0  // 更远低分
        };
        
        explanation.push(format!("📍 Bounds距离: {}px → {:.1}分", distance, score));
        score
    }
    
    /// ✅ 计算可点击性得分（20分）
    fn calculate_clickable_score(
        candidate: &HashMap<String, String>,
        config: &ScoringConfig,
        explanation: &mut Vec<String>,
    ) -> f32 {
        let clickable = candidate
            .get("clickable")
            .map(|s| s == "true")
            .unwrap_or(false);
        
        if clickable {
            explanation.push("✅ 元素可点击".to_string());
            20.0
        } else if config.require_clickable {
            explanation.push("❌ 元素不可点击（要求可点击）".to_string());
            0.0
        } else {
            explanation.push("⚠️ 元素不可点击（可接受）".to_string());
            10.0
        }
    }
    
    /// 📦 计算容器大小合理性得分（10分）
    /// 避免选择过大的父容器或隐藏的小元素
    fn calculate_size_reasonableness_score(
        candidate: &HashMap<String, String>,
        config: &ScoringConfig,
        explanation: &mut Vec<String>,
    ) -> f32 {
        let elem_bounds = candidate.get("bounds").map(|s| s.as_str()).unwrap_or("");
        
        let (width, height) = Self::calculate_element_size(elem_bounds);
        
        if width == 0 || height == 0 {
            explanation.push("❌ 元素尺寸无效".to_string());
            return 0.0;
        }
        
        // 如果有用户bounds，与用户选择的大小进行对比
        if let Some(ref user_bounds) = config.user_bounds {
            let (user_width, user_height) = Self::calculate_element_size(user_bounds);
            
            if user_width == 0 || user_height == 0 {
                explanation.push("⚪ 用户bounds尺寸无效".to_string());
                return 5.0;
            }
            
            // 计算尺寸相似度
            let width_ratio = (width as f32 / user_width as f32).min(user_width as f32 / width as f32);
            let height_ratio = (height as f32 / user_height as f32).min(user_height as f32 / height as f32);
            let similarity = (width_ratio + height_ratio) / 2.0;
            
            let score = similarity * 10.0;
            
            if similarity > 0.8 {
                explanation.push(format!("✅ 尺寸相似 ({}x{}) → {:.1}分", width, height, score));
            } else if similarity > 0.5 {
                explanation.push(format!("⚠️ 尺寸差异 ({}x{}) → {:.1}分", width, height, score));
            } else {
                explanation.push(format!("❌ 尺寸差异过大 ({}x{}) → {:.1}分", width, height, score));
            }
            
            return score;
        }
        
        // 没有用户bounds参考时，检查是否为合理的按钮大小
        let area = width * height;
        
        // 典型按钮区域：50x50 到 500x200
        if area < 2500 {
            explanation.push(format!("⚠️ 元素过小 ({}x{}) → 3分", width, height));
            3.0
        } else if area > 100000 {
            explanation.push(format!("⚠️ 元素过大 ({}x{}) → 5分", width, height));
            5.0
        } else {
            explanation.push(format!("✅ 尺寸合理 ({}x{}) → 10分", width, height));
            10.0
        }
    }
    
    /// 📏 计算两个bounds之间的距离（曼哈顿距离）
    fn calculate_bounds_distance(bounds1: &str, bounds2: &str) -> i32 {
        let parse_bounds = |s: &str| -> Option<(i32, i32, i32, i32)> {
            let parts: Vec<&str> = s
                .trim_matches(|c| c == '[' || c == ']')
                .split("][")
                .collect();
            if parts.len() != 2 {
                return None;
            }

            let left_top: Vec<i32> = parts[0]
                .split(',')
                .filter_map(|n| n.trim().parse().ok())
                .collect();
            let right_bottom: Vec<i32> = parts[1]
                .split(',')
                .filter_map(|n| n.trim().parse().ok())
                .collect();

            if left_top.len() == 2 && right_bottom.len() == 2 {
                Some((left_top[0], left_top[1], right_bottom[0], right_bottom[1]))
            } else {
                None
            }
        };

        let b1 = parse_bounds(bounds1);
        let b2 = parse_bounds(bounds2);

        match (b1, b2) {
            (Some((l1, t1, r1, b1)), Some((l2, t2, r2, b2))) => {
                let center1_x = (l1 + r1) / 2;
                let center1_y = (t1 + b1) / 2;
                let center2_x = (l2 + r2) / 2;
                let center2_y = (t2 + b2) / 2;

                (center1_x - center2_x).abs() + (center1_y - center2_y).abs()
            }
            _ => i32::MAX,
        }
    }
    
    /// 📐 计算元素尺寸（宽度、高度）
    fn calculate_element_size(bounds: &str) -> (i32, i32) {
        let parts: Vec<&str> = bounds
            .trim_matches(|c| c == '[' || c == ']')
            .split("][")
            .collect();
        
        if parts.len() != 2 {
            return (0, 0);
        }

        let left_top: Vec<i32> = parts[0]
            .split(',')
            .filter_map(|n| n.trim().parse().ok())
            .collect();
        let right_bottom: Vec<i32> = parts[1]
            .split(',')
            .filter_map(|n| n.trim().parse().ok())
            .collect();

        if left_top.len() == 2 && right_bottom.len() == 2 {
            let width = (right_bottom[0] - left_top[0]).abs();
            let height = (right_bottom[1] - left_top[1]).abs();
            (width, height)
        } else {
            (0, 0)
        }
    }
    
    /// 🎯 计算XPath精确匹配得分（用于无关系锚点场景，50分）
    fn calculate_xpath_match_score(
        candidate: &HashMap<String, String>,
        config: &ScoringConfig,
        explanation: &mut Vec<String>,
    ) -> f32 {
        let Some(user_xpath) = &config.user_xpath else {
            explanation.push("⚠️ 无用户XPath".to_string());
            return 0.0;
        };
        
        let candidate_xpath = candidate.get("xpath").map(|s| s.as_str()).unwrap_or("");
        
        if candidate_xpath.is_empty() {
            explanation.push("❌ 候选元素无XPath".to_string());
            return 0.0;
        }
        
        // 🎯 完全匹配 → 满分50分
        if candidate_xpath == user_xpath {
            explanation.push(format!("✅ XPath完全匹配: {}", candidate_xpath));
            return 50.0;
        }
        
        // 🎯 计算XPath相似度（基于路径结构）
        let similarity = Self::calculate_xpath_similarity(candidate_xpath, user_xpath);
        let score = 50.0 * similarity;
        
        if score > 30.0 {
            explanation.push(format!("⚠️ XPath高度相似 ({:.1}%): {}", similarity * 100.0, candidate_xpath));
        } else {
            explanation.push(format!("❌ XPath不匹配 ({:.1}%): {}", similarity * 100.0, candidate_xpath));
        }
        
        score
    }
    
    /// 🎯 计算Bounds精确匹配得分（用于无关系锚点场景，50分）
    fn calculate_bounds_precision_score(
        candidate: &HashMap<String, String>,
        config: &ScoringConfig,
        explanation: &mut Vec<String>,
    ) -> f32 {
        let Some(user_bounds) = &config.user_bounds else {
            explanation.push("⚠️ 无用户Bounds".to_string());
            return 0.0;
        };
        
        let candidate_bounds = candidate.get("bounds").map(|s| s.as_str()).unwrap_or("");
        
        if candidate_bounds.is_empty() {
            explanation.push("❌ 候选元素无Bounds".to_string());
            return 0.0;
        }
        
        // 🎯 完全匹配 → 满分50分
        if candidate_bounds == user_bounds {
            explanation.push(format!("✅ Bounds完全匹配: {}", candidate_bounds));
            return 50.0;
        }
        
        // 🎯 计算Bounds距离（越近分数越高）
        let distance = Self::calculate_bounds_distance(candidate_bounds, user_bounds);
        
        // 距离评分：0-10px=50分, 10-20px=40分, 20-50px=20分, >50px=5分
        let score = if distance <= 10 {
            explanation.push(format!("✅ Bounds极度接近 (距离{}px): {}", distance, candidate_bounds));
            50.0
        } else if distance <= 20 {
            explanation.push(format!("⚠️ Bounds接近 (距离{}px): {}", distance, candidate_bounds));
            40.0
        } else if distance <= 50 {
            explanation.push(format!("⚠️ Bounds中等距离 (距离{}px): {}", distance, candidate_bounds));
            20.0
        } else {
            explanation.push(format!("❌ Bounds距离过远 (距离{}px): {}", distance, candidate_bounds));
            5.0
        };
        
        score
    }
    
    /// 📊 计算XPath相似度（0.0 - 1.0）
    fn calculate_xpath_similarity(xpath1: &str, xpath2: &str) -> f32 {
        // 将XPath分解为路径段
        let segments1: Vec<&str> = xpath1.split('/').filter(|s| !s.is_empty()).collect();
        let segments2: Vec<&str> = xpath2.split('/').filter(|s| !s.is_empty()).collect();
        
        if segments1.is_empty() || segments2.is_empty() {
            return 0.0;
        }
        
        // 计算共同前缀长度
        let mut common_prefix_len = 0;
        for (seg1, seg2) in segments1.iter().zip(segments2.iter()) {
            if seg1 == seg2 {
                common_prefix_len += 1;
            } else {
                break;
            }
        }
        
        // 相似度 = 共同前缀长度 / 最大路径长度
        let max_len = segments1.len().max(segments2.len()) as f32;
        common_prefix_len as f32 / max_len
    }

    
    /// 🏆 对候选列表进行评分并排序
    pub fn score_and_rank_candidates(
        candidates: Vec<HashMap<String, String>>,
        config: &ScoringConfig,
    ) -> Vec<(HashMap<String, String>, CandidateScore)> {
        let mut scored: Vec<_> = candidates
            .into_iter()
            .map(|candidate| {
                let score = Self::score_candidate(&candidate, config);
                (candidate, score)
            })
            .collect();
        
        // 按总分降序排列
        scored.sort_by(|a, b| {
            b.1.total_score.partial_cmp(&a.1.total_score)
                .unwrap_or(std::cmp::Ordering::Equal)
        });
        
        scored
    }
}
