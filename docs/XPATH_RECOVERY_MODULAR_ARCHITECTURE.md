# XPath失败恢复系统 - 模块化架构改进方案

## 🎯 **目标**

将当前嵌入在 `chain_engine.rs` 中的失败恢复逻辑提取为独立的模块化子系统，提高代码可维护性、可测试性和可扩展性。

---

## 📂 **推荐的模块结构**

```
src-tauri/src/exec/v3/
├── chain_engine.rs              # 主执行引擎（调用恢复系统）
├── recovery/                    # ⭐ 新增：失败恢复子系统
│   ├── mod.rs                   # 模块导出
│   ├── xpath_recovery.rs        # XPath失败恢复核心逻辑
│   ├── element_similarity.rs    # 元素相似度计算算法
│   ├── feature_extractor.rs     # 元素特征提取
│   ├── diagnostic.rs            # 失败诊断报告生成
│   └── config.rs                # 恢复系统配置
└── ...
```

---

## 📄 **模块详细设计**

### **1️⃣ recovery/mod.rs - 模块导出**

```rust
// src-tauri/src/exec/v3/recovery/mod.rs
// module: recovery | layer: application | role: 失败恢复子系统
// summary: XPath失败恢复系统的统一入口

mod xpath_recovery;
mod element_similarity;
mod feature_extractor;
mod diagnostic;
mod config;

pub use xpath_recovery::{XPathRecoverySystem, RecoveryResult};
pub use element_similarity::{ElementSimilarityCalculator, SimilarityScore};
pub use feature_extractor::{ElementFeature, FeatureExtractor};
pub use diagnostic::{DiagnosticReport, DiagnosticGenerator};
pub use config::RecoveryConfig;

// 便捷函数：创建默认配置的恢复系统
pub fn create_recovery_system() -> XPathRecoverySystem {
    XPathRecoverySystem::new(RecoveryConfig::default())
}
```

---

### **2️⃣ recovery/config.rs - 配置管理**

```rust
// src-tauri/src/exec/v3/recovery/config.rs
// module: recovery | layer: domain | role: 配置
// summary: 失败恢复系统的配置参数

use serde::{Deserialize, Serialize};

/// 恢复系统配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecoveryConfig {
    /// 相似度阈值（0.0-1.0），低于此值认为元素不匹配
    pub similarity_threshold: f32,
    
    /// 各特征的权重配置
    pub weights: SimilarityWeights,
    
    /// 是否启用详细诊断
    pub enable_detailed_diagnostics: bool,
    
    /// 最大搜索元素数（性能优化）
    pub max_search_elements: usize,
}

/// 相似度计算权重
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimilarityWeights {
    pub class_name: f32,     // 类名权重
    pub resource_id: f32,    // 资源ID权重
    pub text: f32,           // 文本权重
    pub content_desc: f32,   // 内容描述权重
    pub bounds: f32,         // 位置权重
}

impl Default for RecoveryConfig {
    fn default() -> Self {
        Self {
            similarity_threshold: 0.7,
            weights: SimilarityWeights {
                class_name: 0.30,
                resource_id: 0.30,
                text: 0.20,
                content_desc: 0.15,
                bounds: 0.05,
            },
            enable_detailed_diagnostics: true,
            max_search_elements: 1000,
        }
    }
}

impl RecoveryConfig {
    /// 创建宽松配置（更容易匹配）
    pub fn lenient() -> Self {
        Self {
            similarity_threshold: 0.5,
            ..Default::default()
        }
    }
    
    /// 创建严格配置（更精确匹配）
    pub fn strict() -> Self {
        Self {
            similarity_threshold: 0.85,
            ..Default::default()
        }
    }
}
```

---

### **3️⃣ recovery/feature_extractor.rs - 特征提取**

```rust
// src-tauri/src/exec/v3/recovery/feature_extractor.rs
// module: recovery | layer: domain | role: 特征提取器
// summary: 从XML元素中提取关键特征

use serde::{Deserialize, Serialize};
use anyhow::Result;

/// 元素特征
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ElementFeature {
    pub class_name: Option<String>,
    pub resource_id: Option<String>,
    pub text: Option<String>,
    pub content_desc: Option<String>,
    pub bounds: Option<Bounds>,
    pub xpath: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bounds {
    pub left: i32,
    pub top: i32,
    pub right: i32,
    pub bottom: i32,
}

impl Bounds {
    /// 计算中心点
    pub fn center(&self) -> (i32, i32) {
        (
            (self.left + self.right) / 2,
            (self.top + self.bottom) / 2,
        )
    }
    
    /// 计算与另一个bounds的距离
    pub fn distance_to(&self, other: &Bounds) -> f32 {
        let (x1, y1) = self.center();
        let (x2, y2) = other.center();
        (((x2 - x1).pow(2) + (y2 - y1).pow(2)) as f32).sqrt()
    }
}

/// 特征提取器
pub struct FeatureExtractor;

impl FeatureExtractor {
    /// 从XML中提取指定XPath的元素特征
    pub fn extract_from_xml(xml: &str, xpath: &str) -> Result<ElementFeature> {
        let doc = roxmltree::Document::parse(xml)?;
        
        // 解析XPath并找到元素
        let element = Self::find_element_by_xpath(&doc, xpath)?;
        
        Ok(ElementFeature {
            class_name: element.attribute("class").map(String::from),
            resource_id: element.attribute("resource-id").map(String::from),
            text: element.attribute("text").map(String::from),
            content_desc: element.attribute("content-desc").map(String::from),
            bounds: Self::parse_bounds(element.attribute("bounds")),
            xpath: Some(xpath.to_string()),
        })
    }
    
    /// 从元素节点提取特征
    pub fn extract_from_node(node: &roxmltree::Node) -> ElementFeature {
        ElementFeature {
            class_name: node.attribute("class").map(String::from),
            resource_id: node.attribute("resource-id").map(String::from),
            text: node.attribute("text").map(String::from),
            content_desc: node.attribute("content-desc").map(String::from),
            bounds: Self::parse_bounds(node.attribute("bounds")),
            xpath: None,
        }
    }
    
    /// 解析bounds字符串
    fn parse_bounds(bounds_str: Option<&str>) -> Option<Bounds> {
        let s = bounds_str?;
        let re = regex::Regex::new(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]").ok()?;
        let caps = re.captures(s)?;
        
        Some(Bounds {
            left: caps.get(1)?.as_str().parse().ok()?,
            top: caps.get(2)?.as_str().parse().ok()?,
            right: caps.get(3)?.as_str().parse().ok()?,
            bottom: caps.get(4)?.as_str().parse().ok()?,
        })
    }
    
    /// 简化XPath查找（示例实现）
    fn find_element_by_xpath<'a>(
        doc: &'a roxmltree::Document,
        xpath: &str,
    ) -> Result<roxmltree::Node<'a, 'a>> {
        // 实际实现需要完整的XPath解析器
        // 这里简化为通过resource-id查找
        if let Some(resource_id) = Self::extract_resource_id_from_xpath(xpath) {
            for node in doc.descendants() {
                if node.attribute("resource-id") == Some(resource_id) {
                    return Ok(node);
                }
            }
        }
        
        Err(anyhow::anyhow!("Element not found for xpath: {}", xpath))
    }
    
    /// 从XPath中提取resource-id（简化版）
    fn extract_resource_id_from_xpath(xpath: &str) -> Option<&str> {
        let re = regex::Regex::new(r"@resource-id='([^']+)'").ok()?;
        re.captures(xpath)?.get(1).map(|m| m.as_str())
    }
}
```

---

### **4️⃣ recovery/element_similarity.rs - 相似度计算**

```rust
// src-tauri/src/exec/v3/recovery/element_similarity.rs
// module: recovery | layer: domain | role: 相似度计算器
// summary: 计算两个元素的相似度评分

use super::feature_extractor::{ElementFeature, Bounds};
use super::config::SimilarityWeights;
use serde::{Deserialize, Serialize};

/// 相似度评分结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimilarityScore {
    pub total: f32,
    pub class_name: f32,
    pub resource_id: f32,
    pub text: f32,
    pub content_desc: f32,
    pub bounds: f32,
}

/// 元素相似度计算器
pub struct ElementSimilarityCalculator {
    weights: SimilarityWeights,
}

impl ElementSimilarityCalculator {
    pub fn new(weights: SimilarityWeights) -> Self {
        Self { weights }
    }
    
    /// 计算两个元素的相似度
    pub fn calculate(
        &self,
        original: &ElementFeature,
        candidate: &ElementFeature,
    ) -> SimilarityScore {
        let class_score = self.compare_class_name(
            original.class_name.as_deref(),
            candidate.class_name.as_deref(),
        );
        
        let resource_id_score = self.compare_resource_id(
            original.resource_id.as_deref(),
            candidate.resource_id.as_deref(),
        );
        
        let text_score = self.compare_text(
            original.text.as_deref(),
            candidate.text.as_deref(),
        );
        
        let content_desc_score = self.compare_content_desc(
            original.content_desc.as_deref(),
            candidate.content_desc.as_deref(),
        );
        
        let bounds_score = self.compare_bounds(
            original.bounds.as_ref(),
            candidate.bounds.as_ref(),
        );
        
        let total = class_score * self.weights.class_name
            + resource_id_score * self.weights.resource_id
            + text_score * self.weights.text
            + content_desc_score * self.weights.content_desc
            + bounds_score * self.weights.bounds;
        
        SimilarityScore {
            total,
            class_name: class_score,
            resource_id: resource_id_score,
            text: text_score,
            content_desc: content_desc_score,
            bounds: bounds_score,
        }
    }
    
    /// 比较类名（精确匹配）
    fn compare_class_name(&self, a: Option<&str>, b: Option<&str>) -> f32 {
        match (a, b) {
            (Some(a), Some(b)) if a == b => 1.0,
            (Some(_), Some(_)) => 0.0,
            _ => 0.5, // 缺失数据给予中等分数
        }
    }
    
    /// 比较资源ID（精确匹配）
    fn compare_resource_id(&self, a: Option<&str>, b: Option<&str>) -> f32 {
        match (a, b) {
            (Some(a), Some(b)) if a == b => 1.0,
            (Some(_), Some(_)) => 0.0,
            _ => 0.5,
        }
    }
    
    /// 比较文本（模糊匹配）
    fn compare_text(&self, a: Option<&str>, b: Option<&str>) -> f32 {
        match (a, b) {
            (Some(a), Some(b)) => {
                if a == b {
                    1.0
                } else if a.contains(b) || b.contains(a) {
                    0.7
                } else {
                    self.string_similarity(a, b)
                }
            }
            _ => 0.5,
        }
    }
    
    /// 比较内容描述（模糊匹配）
    fn compare_content_desc(&self, a: Option<&str>, b: Option<&str>) -> f32 {
        match (a, b) {
            (Some(a), Some(b)) if a == b => 1.0,
            (Some(_), Some(_)) => 0.5,
            _ => 0.5,
        }
    }
    
    /// 比较位置（距离越近分数越高）
    fn compare_bounds(&self, a: Option<&Bounds>, b: Option<&Bounds>) -> f32 {
        match (a, b) {
            (Some(a), Some(b)) => {
                let distance = a.distance_to(b);
                // 距离小于50px得满分，大于200px得0分，中间线性插值
                if distance < 50.0 {
                    1.0
                } else if distance > 200.0 {
                    0.0
                } else {
                    1.0 - (distance - 50.0) / 150.0
                }
            }
            _ => 0.5,
        }
    }
    
    /// 字符串相似度（Levenshtein距离归一化）
    fn string_similarity(&self, a: &str, b: &str) -> f32 {
        let distance = Self::levenshtein_distance(a, b);
        let max_len = a.len().max(b.len()) as f32;
        if max_len == 0.0 {
            return 1.0;
        }
        1.0 - (distance as f32 / max_len)
    }
    
    /// Levenshtein距离
    fn levenshtein_distance(a: &str, b: &str) -> usize {
        let a_chars: Vec<char> = a.chars().collect();
        let b_chars: Vec<char> = b.chars().collect();
        let a_len = a_chars.len();
        let b_len = b_chars.len();
        
        let mut matrix = vec![vec![0; b_len + 1]; a_len + 1];
        
        for i in 0..=a_len {
            matrix[i][0] = i;
        }
        for j in 0..=b_len {
            matrix[0][j] = j;
        }
        
        for i in 1..=a_len {
            for j in 1..=b_len {
                let cost = if a_chars[i - 1] == b_chars[j - 1] { 0 } else { 1 };
                matrix[i][j] = (matrix[i - 1][j] + 1)
                    .min(matrix[i][j - 1] + 1)
                    .min(matrix[i - 1][j - 1] + cost);
            }
        }
        
        matrix[a_len][b_len]
    }
}
```

---

### **5️⃣ recovery/xpath_recovery.rs - 核心恢复逻辑**

```rust
// src-tauri/src/exec/v3/recovery/xpath_recovery.rs
// module: recovery | layer: application | role: XPath恢复系统
// summary: XPath失败恢复的核心业务逻辑

use super::config::RecoveryConfig;
use super::feature_extractor::{ElementFeature, FeatureExtractor};
use super::element_similarity::{ElementSimilarityCalculator, SimilarityScore};
use super::diagnostic::{DiagnosticGenerator, DiagnosticReport};
use anyhow::Result;
use serde::{Deserialize, Serialize};

/// 恢复结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecoveryResult {
    pub success: bool,
    pub best_match: Option<ElementFeature>,
    pub similarity: Option<SimilarityScore>,
    pub diagnostic: DiagnosticReport,
}

/// XPath恢复系统
pub struct XPathRecoverySystem {
    config: RecoveryConfig,
    similarity_calculator: ElementSimilarityCalculator,
    diagnostic_generator: DiagnosticGenerator,
}

impl XPathRecoverySystem {
    pub fn new(config: RecoveryConfig) -> Self {
        let similarity_calculator = ElementSimilarityCalculator::new(config.weights.clone());
        let diagnostic_generator = DiagnosticGenerator::new(config.clone());
        
        Self {
            config,
            similarity_calculator,
            diagnostic_generator,
        }
    }
    
    /// 尝试从失败中恢复
    pub fn recover(
        &self,
        original_xml: &str,
        selected_xpath: &str,
        current_xml: &str,
    ) -> Result<RecoveryResult> {
        // 1. 从原始XML中提取元素特征
        let original_feature = FeatureExtractor::extract_from_xml(original_xml, selected_xpath)?;
        
        // 2. 在当前XML中搜索所有候选元素
        let candidates = self.find_all_candidates(current_xml)?;
        
        // 3. 计算每个候选元素的相似度
        let mut scored_candidates: Vec<(ElementFeature, SimilarityScore)> = candidates
            .into_iter()
            .map(|candidate| {
                let score = self.similarity_calculator.calculate(&original_feature, &candidate);
                (candidate, score)
            })
            .collect();
        
        // 4. 按相似度排序
        scored_candidates.sort_by(|a, b| b.1.total.partial_cmp(&a.1.total).unwrap());
        
        // 5. 判断是否找到匹配
        let best_match = scored_candidates.first();
        let success = best_match
            .map(|(_, score)| score.total >= self.config.similarity_threshold)
            .unwrap_or(false);
        
        // 6. 生成诊断报告
        let diagnostic = self.diagnostic_generator.generate(
            &original_feature,
            &scored_candidates,
            self.config.similarity_threshold,
        );
        
        Ok(RecoveryResult {
            success,
            best_match: best_match.map(|(feature, _)| feature.clone()),
            similarity: best_match.map(|(_, score)| score.clone()),
            diagnostic,
        })
    }
    
    /// 在XML中查找所有候选元素
    fn find_all_candidates(&self, xml: &str) -> Result<Vec<ElementFeature>> {
        let doc = roxmltree::Document::parse(xml)?;
        let mut candidates = Vec::new();
        
        for node in doc.descendants().take(self.config.max_search_elements) {
            if node.is_element() {
                candidates.push(FeatureExtractor::extract_from_node(&node));
            }
        }
        
        Ok(candidates)
    }
}
```

---

### **6️⃣ recovery/diagnostic.rs - 诊断报告**

```rust
// src-tauri/src/exec/v3/recovery/diagnostic.rs
// module: recovery | layer: application | role: 诊断报告生成器
// summary: 生成详细的失败诊断报告

use super::config::RecoveryConfig;
use super::feature_extractor::ElementFeature;
use super::element_similarity::SimilarityScore;
use serde::{Deserialize, Serialize};

/// 诊断报告
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiagnosticReport {
    pub summary: String,
    pub original_element: ElementFeature,
    pub best_candidate: Option<(ElementFeature, SimilarityScore)>,
    pub top_candidates: Vec<(ElementFeature, SimilarityScore)>,
    pub failure_reason: Option<String>,
    pub suggestions: Vec<String>,
}

/// 诊断生成器
pub struct DiagnosticGenerator {
    config: RecoveryConfig,
}

impl DiagnosticGenerator {
    pub fn new(config: RecoveryConfig) -> Self {
        Self { config }
    }
    
    /// 生成诊断报告
    pub fn generate(
        &self,
        original: &ElementFeature,
        scored_candidates: &[(ElementFeature, SimilarityScore)],
        threshold: f32,
    ) -> DiagnosticReport {
        let best_candidate = scored_candidates.first().cloned();
        let top_candidates = scored_candidates.iter().take(3).cloned().collect();
        
        let (summary, failure_reason, suggestions) = if let Some((_, score)) = &best_candidate {
            if score.total >= threshold {
                (
                    format!("找到匹配元素（相似度: {:.2}）", score.total),
                    None,
                    vec![],
                )
            } else {
                (
                    format!("未找到匹配元素（最高相似度: {:.2} < 阈值 {:.2}）", score.total, threshold),
                    Some(self.analyze_failure(original, &best_candidate.as_ref().unwrap().0, score)),
                    self.generate_suggestions(original, score),
                )
            }
        } else {
            (
                "未找到任何候选元素".to_string(),
                Some("当前XML中没有可匹配的元素".to_string()),
                vec!["请检查应用是否在正确的页面".to_string()],
            )
        };
        
        DiagnosticReport {
            summary,
            original_element: original.clone(),
            best_candidate,
            top_candidates,
            failure_reason,
            suggestions,
        }
    }
    
    /// 分析失败原因
    fn analyze_failure(
        &self,
        original: &ElementFeature,
        candidate: &ElementFeature,
        score: &SimilarityScore,
    ) -> String {
        let mut reasons = Vec::new();
        
        if score.class_name < 0.5 {
            reasons.push(format!(
                "类名不匹配（原: {:?}, 现: {:?}）",
                original.class_name, candidate.class_name
            ));
        }
        
        if score.resource_id < 0.5 {
            reasons.push(format!(
                "资源ID不匹配（原: {:?}, 现: {:?}）",
                original.resource_id, candidate.resource_id
            ));
        }
        
        if score.text < 0.5 {
            reasons.push(format!(
                "文本内容变化（原: {:?}, 现: {:?}）",
                original.text, candidate.text
            ));
        }
        
        if score.bounds < 0.5 {
            reasons.push("元素位置变化较大".to_string());
        }
        
        reasons.join("; ")
    }
    
    /// 生成改进建议
    fn generate_suggestions(
        &self,
        _original: &ElementFeature,
        score: &SimilarityScore,
    ) -> Vec<String> {
        let mut suggestions = Vec::new();
        
        if score.total < 0.3 {
            suggestions.push("UI结构可能已大幅变化，建议重新录制步骤".to_string());
        } else if score.total < self.config.similarity_threshold {
            suggestions.push("尝试降低相似度阈值以匹配元素".to_string());
            suggestions.push("检查应用版本是否更新".to_string());
        }
        
        if score.text < 0.5 {
            suggestions.push("元素文本已变化，考虑使用resource-id定位".to_string());
        }
        
        suggestions
    }
}
```

---

### **7️⃣ chain_engine.rs - 集成恢复系统**

```rust
// src-tauri/src/exec/v3/chain_engine.rs
// module: execution | layer: application | role: 执行引擎
// summary: V3智能链执行引擎

use super::recovery::{XPathRecoverySystem, RecoveryConfig, create_recovery_system};

// ... 现有代码 ...

async fn execute_intelligent_analysis_step(
    inline: &InlineStep,
    ui_reader_service: &UIReaderService,
    intelligent_analysis_service: &IntelligentAnalysisService,
) -> Result<StepResult> {
    // 1. 获取原始数据
    let original_data = inline.params.get("original_data");
    let selected_xpath = original_data
        .and_then(|od| od.get("selected_xpath"))
        .and_then(|v| v.as_str());
    let original_xml = original_data
        .and_then(|od| od.get("original_xml"))
        .and_then(|v| v.as_str());
    
    // 2. 获取真机XML
    let current_xml = ui_reader_service.dump_ui(&inline.device_id).await?;
    
    // 3. 尝试候选值匹配
    let candidates = extract_candidates(&inline.params);
    let mut target_element = find_by_candidates(&current_xml, &candidates);
    
    // 4. 失败恢复
    if target_element.is_none() && selected_xpath.is_some() && original_xml.is_some() {
        info!("候选值匹配失败，启动XPath失败恢复系统");
        
        // ⭐ 使用模块化的恢复系统
        let recovery_system = create_recovery_system();
        let recovery_result = recovery_system.recover(
            original_xml.unwrap(),
            selected_xpath.unwrap(),
            &current_xml,
        )?;
        
        if recovery_result.success {
            info!("恢复成功！相似度: {:?}", recovery_result.similarity);
            target_element = recovery_result.best_match;
        } else {
            warn!("恢复失败: {}", recovery_result.diagnostic.summary);
            info!("诊断报告: {:?}", recovery_result.diagnostic);
            
            return Err(anyhow::anyhow!(
                "未找到匹配元素。{}\n建议: {}",
                recovery_result.diagnostic.failure_reason.unwrap_or_default(),
                recovery_result.diagnostic.suggestions.join("; ")
            ));
        }
    }
    
    // 5. 执行动作
    match target_element {
        Some(element) => execute_action(&inline.device_id, &element).await,
        None => Err(anyhow::anyhow!("未找到目标元素")),
    }
}
```

---

## ✅ **模块化的优势**

### **1. 可维护性**
- ✅ 职责清晰：每个模块负责一个明确的功能
- ✅ 易于定位问题：bug在哪个模块一目了然
- ✅ 降低耦合：修改一个模块不影响其他模块

### **2. 可测试性**
```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_element_similarity() {
        let calculator = ElementSimilarityCalculator::new(
            SimilarityWeights::default()
        );
        
        let original = ElementFeature {
            class_name: Some("TextView".to_string()),
            text: Some("我".to_string()),
            // ...
        };
        
        let candidate = ElementFeature {
            class_name: Some("TextView".to_string()),
            text: Some("个人中心".to_string()),
            // ...
        };
        
        let score = calculator.calculate(&original, &candidate);
        assert!(score.total > 0.5);
    }
}
```

### **3. 可扩展性**
- ✅ 新增相似度算法：只需修改 `element_similarity.rs`
- ✅ 调整权重配置：只需修改 `config.rs`
- ✅ 增强诊断报告：只需修改 `diagnostic.rs`

### **4. 可复用性**
```rust
// 在其他地方使用恢复系统
use crate::exec::v3::recovery::{XPathRecoverySystem, RecoveryConfig};

let recovery_system = XPathRecoverySystem::new(RecoveryConfig::lenient());
let result = recovery_system.recover(...)?;
```

---

## 🔄 **迁移步骤**

### **阶段1: 创建模块结构**
1. 创建 `src-tauri/src/exec/v3/recovery/` 目录
2. 创建 `mod.rs`、`config.rs`、`feature_extractor.rs` 等文件
3. 复制现有逻辑到对应模块

### **阶段2: 重构并测试**
1. 将 `chain_engine.rs` 中的失败恢复逻辑提取到模块
2. 编写单元测试验证每个模块
3. 编写集成测试验证整体流程

### **阶段3: 集成并优化**
1. 修改 `chain_engine.rs` 使用新的恢复系统
2. 运行现有测试确保功能不变
3. 性能优化和错误处理

---

## 📋 **实施检查清单**

- [ ] 创建 `recovery/` 目录结构
- [ ] 实现 `config.rs` 配置管理
- [ ] 实现 `feature_extractor.rs` 特征提取
- [ ] 实现 `element_similarity.rs` 相似度计算
- [ ] 实现 `diagnostic.rs` 诊断报告
- [ ] 实现 `xpath_recovery.rs` 核心逻辑
- [ ] 修改 `chain_engine.rs` 集成模块
- [ ] 编写单元测试
- [ ] 编写集成测试
- [ ] 性能测试和优化
- [ ] 文档更新

---

## 🎉 **总结**

### **当前状态（嵌入式）**:
- ✅ 功能完整
- ⚠️ 代码耦合度高
- ⚠️ 难以测试和扩展

### **模块化后（推荐）**:
- ✅ 功能完整
- ✅ 职责清晰、低耦合
- ✅ 易于测试、维护和扩展
- ✅ 可配置、可复用

**建议**: 在功能验证通过后，逐步实施模块化重构，提升代码质量和可维护性。

