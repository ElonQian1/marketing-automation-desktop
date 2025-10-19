// src-tauri/src/engine/strategy_engine.rs
// 智能策略共用引擎 - 统一评分逻辑，避免重复计算

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// 八维度证据结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Evidence {
    /// 模型置信度 (0.0-1.0)
    pub model: f32,
    /// 定位器准确性 (0.0-1.0) 
    pub locator: f32,
    /// 可见性确认 (0.0-1.0)
    pub visibility: f32,
    /// 元素唯一性 (0.0-1.0)
    pub uniqueness: f32,
    /// 位置邻近性 (0.0-1.0)
    pub proximity: f32,
    /// 屏幕匹配度 (0.0-1.0)
    pub screen: f32,
    /// 历史成功率 (0.0-1.0)
    pub history: f32,
    /// 边界惩罚 (0.0-1.0，越小越好)
    pub penalty_margin: f32,
}

impl Evidence {
    /// 创建默认证据
    pub fn default() -> Self {
        Self {
            model: 0.8,
            locator: 0.75,
            visibility: 0.85,
            uniqueness: 0.7,
            proximity: 0.8,
            screen: 0.9,
            history: 0.6,
            penalty_margin: 0.1,
        }
    }
    
    /// 基于策略类型创建证据
    pub fn for_strategy(strategy_type: &str) -> Self {
        match strategy_type {
            "self_anchor" => Self {
                model: 0.95,
                locator: 0.9,
                visibility: 0.95,
                uniqueness: 0.88,
                proximity: 0.85,
                screen: 0.92,
                history: 0.8,
                penalty_margin: 0.05,
            },
            "child_driven" => Self {
                model: 0.88,
                locator: 0.82,
                visibility: 0.85,
                uniqueness: 0.75,
                proximity: 0.78,
                screen: 0.87,
                history: 0.7,
                penalty_margin: 0.1,
            },
            "region_scoped" => Self {
                model: 0.82,
                locator: 0.75,
                visibility: 0.8,
                uniqueness: 0.7,
                proximity: 0.72,
                screen: 0.85,
                history: 0.65,
                penalty_margin: 0.12,
            },
            "text_contains" => Self {
                model: 0.75,
                locator: 0.7,
                visibility: 0.88,
                uniqueness: 0.6,
                proximity: 0.65,
                screen: 0.8,
                history: 0.75,
                penalty_margin: 0.15,
            },
            _ => Self::default(),
        }
    }
}

/// 候选项评分结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CandidateScore {
    pub key: String,
    pub name: String,
    pub confidence: f32,
    pub evidence: Evidence,
    pub xpath: Option<String>,
    pub description: String,
    pub variant: String,
}

/// 单步分析结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StepResult {
    /// 推荐的策略键
    pub recommended: String,
    /// 整体置信度 (0.0-1.0)
    pub confidence: f32,
    /// 详细证据
    pub evidence: Evidence,
    /// 所有候选项
    pub candidates: Vec<CandidateScore>,
}

/// 分析上下文
#[derive(Debug, Clone)]
pub struct AnalysisContext {
    pub element_path: String,
    pub element_text: Option<String>,
    pub element_type: Option<String>,
    pub resource_id: Option<String>,
    pub class_name: Option<String>,
    pub bounds: Option<String>,
    pub container_info: Option<ContainerInfo>,
}

/// 容器信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainerInfo {
    pub container_type: String,
    pub container_path: String,
    pub item_index: Option<u32>,
    pub total_items: Option<u32>,
}

/// 策略引擎权重配置
#[derive(Debug, Clone)]
pub struct EngineWeights {
    pub model_weight: f32,
    pub locator_weight: f32,
    pub visibility_weight: f32,
    pub uniqueness_weight: f32,
    pub proximity_weight: f32,
    pub screen_weight: f32,
    pub history_weight: f32,
    pub penalty_weight: f32,
}

impl Default for EngineWeights {
    fn default() -> Self {
        Self {
            model_weight: 0.25,      // 25% - 模型预测
            locator_weight: 0.20,    // 20% - 定位准确性
            visibility_weight: 0.15, // 15% - 可见性
            uniqueness_weight: 0.12, // 12% - 唯一性
            proximity_weight: 0.10,  // 10% - 位置邻近
            screen_weight: 0.10,     // 10% - 屏幕匹配
            history_weight: 0.05,    // 5% - 历史成功率
            penalty_weight: 0.03,    // 3% - 边界惩罚 (负向)
        }
    }
}

/// 策略引擎
pub struct StrategyEngine {
    weights: EngineWeights,
}

impl StrategyEngine {
    /// 创建新的策略引擎
    pub fn new() -> Self {
        Self {
            weights: EngineWeights::default(),
        }
    }
    
    /// 使用自定义权重创建引擎
    pub fn with_weights(weights: EngineWeights) -> Self {
        Self { weights }
    }
    
    /// 计算综合置信度评分
    pub fn calculate_confidence(&self, evidence: &Evidence) -> f32 {
        let score = 
            evidence.model * self.weights.model_weight +
            evidence.locator * self.weights.locator_weight +
            evidence.visibility * self.weights.visibility_weight +
            evidence.uniqueness * self.weights.uniqueness_weight +
            evidence.proximity * self.weights.proximity_weight +
            evidence.screen * self.weights.screen_weight +
            evidence.history * self.weights.history_weight -
            evidence.penalty_margin * self.weights.penalty_weight; // 惩罚项是减分
        
        // 确保分数在 0.0-1.0 范围内
        score.max(0.0).min(1.0)
    }
    
    /// 评分所有候选项
    pub fn score_candidates(&self, context: &AnalysisContext) -> Vec<CandidateScore> {
        let mut candidates = Vec::new();
        
        // 1. 自锚定策略 (基于resource-id/class直接定位)
        if let Some(ref resource_id) = context.resource_id {
            let evidence = Evidence::for_strategy("self_anchor");
            let confidence = self.calculate_confidence(&evidence);
            
            candidates.push(CandidateScore {
                key: "self_anchor".to_string(),
                name: "自锚定策略".to_string(),
                confidence,
                evidence,
                xpath: Some(format!("//*[@resource-id='{}']", resource_id)),
                description: "基于 resource-id 直接定位，稳定性最高".to_string(),
                variant: "self_anchor".to_string(),
            });
        }
        
        // 2. 子元素驱动策略 (基于文本内容)
        if let Some(ref text) = context.element_text {
            if !text.trim().is_empty() && text.len() < 50 { // 文本不能太长
                let mut evidence = Evidence::for_strategy("child_driven");
                
                // 根据文本特征调整证据
                if text.chars().all(|c| c.is_ascii_alphanumeric() || c.is_whitespace()) {
                    evidence.uniqueness += 0.1; // 纯文本更可靠
                }
                if text.len() < 10 {
                    evidence.uniqueness += 0.05; // 短文本更唯一
                }
                
                let confidence = self.calculate_confidence(&evidence);
                
                candidates.push(CandidateScore {
                    key: "child_driven".to_string(),
                    name: "子元素驱动策略".to_string(),
                    confidence,
                    evidence,
                    xpath: Some(format!("//*[contains(@text,'{}')]", text.trim())),
                    description: format!("通过文本 '{}' 定位", text.trim()),
                    variant: "child_driven".to_string(),
                });
            }
        }
        
        // 3. 区域约束策略 (基于容器)
        if let Some(ref container) = context.container_info {
            let evidence = Evidence::for_strategy("region_scoped");
            let confidence = self.calculate_confidence(&evidence);
            
            candidates.push(CandidateScore {
                key: "region_scoped".to_string(),
                name: "区域约束策略".to_string(),
                confidence,
                evidence,
                xpath: Some(format!("{}/*[@class='{}']", 
                    container.container_path,
                    context.class_name.as_deref().unwrap_or("View")
                )),
                description: format!("限定在容器 '{}' 内", container.container_type),
                variant: "region_scoped".to_string(),
            });
        }
        
        // 4. XPath兜底策略
        let fallback_evidence = Evidence {
            model: 0.6,
            locator: 0.55,
            visibility: 0.7,
            uniqueness: 0.4,
            proximity: 0.5,
            screen: 0.75,
            history: 0.3,
            penalty_margin: 0.25,
        };
        let fallback_confidence = self.calculate_confidence(&fallback_evidence);
        
        candidates.push(CandidateScore {
            key: "xpath_fallback".to_string(),
            name: "XPath兜底策略".to_string(),
            confidence: fallback_confidence,
            evidence: fallback_evidence,
            xpath: Some(context.element_path.clone()),
            description: "基于完整路径定位，兜底保障".to_string(),
            variant: "xpath_fallback".to_string(),
        });
        
        // 按置信度排序
        candidates.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap());
        
        candidates
    }
    
    /// 单步分析核心函数
    pub fn analyze_single_step(&self, context: &AnalysisContext) -> StepResult {
        let candidates = self.score_candidates(context);
        
        let (recommended, confidence, evidence) = if let Some(best) = candidates.first() {
            (best.key.clone(), best.confidence, best.evidence.clone())
        } else {
            // 完全兜底
            let fallback_evidence = Evidence::default();
            (
                "emergency_fallback".to_string(),
                self.calculate_confidence(&fallback_evidence),
                fallback_evidence
            )
        };
        
        StepResult {
            recommended,
            confidence,
            evidence,
            candidates,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_confidence_calculation() {
        let engine = StrategyEngine::new();
        let evidence = Evidence::for_strategy("self_anchor");
        let confidence = engine.calculate_confidence(&evidence);
        
        assert!(confidence > 0.8, "自锚定策略置信度应该很高");
        assert!(confidence <= 1.0, "置信度不应超过1.0");
    }
    
    #[test]
    fn test_candidates_sorting() {
        let engine = StrategyEngine::new();
        let context = AnalysisContext {
            element_path: "/hierarchy/android.widget.Button[1]".to_string(),
            element_text: Some("确定".to_string()),
            element_type: Some("android.widget.Button".to_string()),
            resource_id: Some("com.example:id/confirm".to_string()),
            class_name: Some("Button".to_string()),
            bounds: Some("[100,200][300,250]".to_string()),
            container_info: None,
        };
        
        let candidates = engine.score_candidates(&context);
        
        assert!(!candidates.is_empty(), "应该生成候选项");
        
        // 验证排序正确性
        for i in 0..candidates.len() - 1 {
            assert!(
                candidates[i].confidence >= candidates[i + 1].confidence,
                "候选项应该按置信度降序排列"
            );
        }
        
        // 有resource-id的情况下，自锚定策略应该排第一
        assert_eq!(candidates[0].key, "self_anchor");
    }
}