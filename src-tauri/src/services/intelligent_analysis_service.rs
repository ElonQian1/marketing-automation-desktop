// src-tauri/src/services/intelligent_analysis_service.rs
// module: intelligent-analysis | layer: services | role: V3 intelligent analysis service
// summary: V3智能分析服务，桥接后端V3执行系统与前端智能策略系统

use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use anyhow::Result;
use crate::services::universal_ui_page_analyzer::{parse_ui_elements_simple as parse_ui_elements, UIElement};  // ✅ 导入 UI 解析函数
use crate::engine::{AnalysisContext, ContainerInfo};  // ✅ 导入分析上下文和容器信息
use crate::engine::xml_indexer::XmlIndexer;  // 🔥 导入XML索引器
use crate::domain::structure_runtime_match::scorers::{SubtreeMatcher, LeafContextMatcher};  // 🔥 导入结构匹配评分器
use crate::domain::structure_runtime_match::ClickNormalizer;  // 🔥 导入点击归一化器
use crate::domain::structure_runtime_match::adapters::xml_indexer_adapter::XmlIndexerAdapter;
use crate::types::page_analysis::ElementBounds; // ✅ 导入 ElementBounds

/// 智能分析请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntelligentAnalysisRequest {
    pub analysis_id: String,
    pub device_id: String,
    pub ui_xml_content: String,
    
    // ✅ 重构：用户选择上下文（完整信息），替代 target_element_hint
    pub user_selection: Option<UserSelectionContext>,
    
    // ⚠️ 兼容旧字段（待删除）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target_element_hint: Option<String>,
    
    pub analysis_mode: String, // "step0_to_6", "quick", "comprehensive"
    pub max_candidates: usize,
    pub min_confidence: f64,
}

/// 用户选择上下文（Step 0 规范化输入）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserSelectionContext {
    /// 用户点击的元素 XPath
    pub selected_xpath: String,
    
    /// 元素边界 [x1,y1][x2,y2]
    pub bounds: Option<String>,
    
    /// 元素文本内容
    pub text: Option<String>,
    
    /// resource-id 属性
    pub resource_id: Option<String>,
    
    /// class 属性
    pub class_name: Option<String>,
    
    /// content-desc 属性
    pub content_desc: Option<String>,
    
    /// 祖先节点信息（用于 region_scoped）
    pub ancestors: Vec<AncestorInfo>,
    
    /// 子节点文本列表（用于 child_driven）
    pub children_texts: Vec<String>,
    
    /// 国际化变体（如果有）
    pub i18n_variants: Option<Vec<String>>,
    
    /// 🔥 索引路径（用于结构匹配评分）
    pub index_path: Option<Vec<usize>>,
}

/// 祖先节点信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AncestorInfo {
    pub xpath: String,
    pub class_name: String,
    pub resource_id: Option<String>,
    pub scrollable: bool,
}

/// 智能分析结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntelligentAnalysisResult {
    pub analysis_id: String,
    pub success: bool,
    pub candidates: Vec<StrategyCandidate>,
    pub analysis_time_ms: u128,
    pub step_details: Vec<StepAnalysisDetail>,
    pub recommendations: Vec<String>,
    pub metadata: AnalysisMetadata,
}

/// 策略候选
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StrategyCandidate {
    pub strategy: String,
    pub confidence: f64,
    pub reasoning: String,
    pub element_info: ElementInfo,
    pub execution_params: serde_json::Value,
}

/// 步骤分析详情
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StepAnalysisDetail {
    pub step_name: String, // "SelfAnchor", "ChildAnchor", etc.
    pub step_index: usize, // 0-6
    pub candidates_found: usize,
    pub best_confidence: f64,
    pub execution_time_ms: u64,
    pub status: String, // "success", "failure", "skipped"
}

/// 分析元数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisMetadata {
    pub xml_hash: String,
    pub xml_element_count: usize,
    pub device_info: String,
    pub analysis_timestamp: String,
    pub engine_version: String,
}

/// 元素信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ElementInfo {
    pub bounds: Option<String>,
    pub text: Option<String>,
    pub resource_id: Option<String>,
    pub class_name: Option<String>,
    pub click_point: Option<[i32; 2]>,
}

/// 执行智能分析（主入口）
/// 
/// 这个函数通过 IPC 调用前端的 StrategyDecisionEngine 获得完整的 Step 0-6 分析
pub async fn perform_intelligent_analysis(
    app_handle: AppHandle,  // ✅ 直接接收 AppHandle
    request: IntelligentAnalysisRequest,
) -> Result<IntelligentAnalysisResult> {
    tracing::warn!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    tracing::warn!("🚀🚀🚀 V3智能分析主入口被调用！！！ 时间: {:?}", std::time::SystemTime::now());
    tracing::warn!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    tracing::info!(
        "🔍 分析参数: analysis_id={}, device_id={}, mode={}, xml_length={}, hint={:?}",
        request.analysis_id, request.device_id, request.analysis_mode,
        request.ui_xml_content.len(), request.target_element_hint
    );
    
    tracing::info!("🧠 开始智能分析: {}", request.analysis_id);
    
    let start_time = std::time::Instant::now();
    
    // 构建前端调用参数
    let frontend_request = serde_json::json!({
        "analysisId": request.analysis_id,
        "deviceId": request.device_id,
        "xmlContent": request.ui_xml_content,
        "targetElementHint": request.target_element_hint,
        "analysisMode": request.analysis_mode,
        "maxCandidates": request.max_candidates,
        "minConfidence": request.min_confidence
    });
    
    // 🎯 调用前端完整智能策略系统 (Step 0-6)
    match call_frontend_strategy_engine(app_handle, frontend_request).await {
        Ok(frontend_result) => {
            // 解析前端返回的完整分析结果
            let analysis_result = parse_frontend_analysis_result(frontend_result, &request, start_time.elapsed())?;
            
            tracing::info!("✅ 前端智能分析成功: {} 个候选策略, 耗时: {}ms", 
                           analysis_result.candidates.len(), analysis_result.analysis_time_ms);
            
            Ok(analysis_result)
        },
        Err(e) => {
            tracing::warn!("⚠️ 前端智能分析失败，回退到后端模拟分析: {}", e);
            
            // 回退到后端模拟分析
            mock_intelligent_analysis(request).await
        }
    }
}

/// 调用前端策略引擎 - 完整的 Step 0-6 智能决策流程
async fn call_frontend_strategy_engine(
    _app_handle: AppHandle,
    _request: serde_json::Value,
) -> Result<serde_json::Value> {
    tracing::info!("🔗 尝试调用前端完整 StrategyDecisionEngine (Step 0-6)");
    
    // 🎯 目前简化实现：由于 Tauri IPC 复杂性，先返回错误让后端使用完整分析
    // 未来可以通过以下方式实现：
    // 1. 使用 Tauri 事件系统
    // 2. 使用 webview 的 eval 机制
    // 3. 创建专门的 Tauri 命令
    
    tracing::warn!("⚠️ 前端 IPC 调用暂未实现，回退到后端完整分析");
    Err(anyhow::anyhow!("前端 IPC 调用需要更复杂的实现，当前回退到后端分析"))
}

/// 解析前端分析结果
fn parse_frontend_analysis_result(
    frontend_result: serde_json::Value,
    original_request: &IntelligentAnalysisRequest,
    elapsed_time: std::time::Duration,
) -> Result<IntelligentAnalysisResult> {
    let success = frontend_result.get("success").and_then(|v| v.as_bool()).unwrap_or(false);
    
    if !success {
        let error_msg = frontend_result.get("error").and_then(|v| v.as_str()).unwrap_or("Unknown error");
        return Err(anyhow::anyhow!("Frontend analysis failed: {}", error_msg));
    }
    
    let recommendation = frontend_result.get("recommendation").unwrap_or(&serde_json::Value::Null);
    
    // 转换前端推荐结果为我们的格式
    let candidates = extract_candidates_from_recommendation(recommendation)?;
    
    let result = IntelligentAnalysisResult {
        analysis_id: original_request.analysis_id.clone(),
        success: true,
        candidates,
        analysis_time_ms: elapsed_time.as_millis(),
        step_details: vec![], // TODO: 从前端结果中提取
        recommendations: vec!["智能策略分析完成".to_string()],
        metadata: AnalysisMetadata {
            xml_hash: format!("{:x}", md5::compute(&original_request.ui_xml_content)),
            xml_element_count: count_xml_elements(&original_request.ui_xml_content),
            device_info: original_request.device_id.clone(),
            analysis_timestamp: chrono::Utc::now().to_rfc3339(),
            engine_version: "v3.0.0".to_string(),
        },
    };
    
    Ok(result)
}

/// 从前端推荐结果中提取候选策略
fn extract_candidates_from_recommendation(
    recommendation: &serde_json::Value,
) -> Result<Vec<StrategyCandidate>> {
    let mut candidates = Vec::new();
    
    // 提取主推荐策略
    if let Some(strategy_name) = recommendation.get("strategy").and_then(|v| v.as_str()) {
        let confidence = recommendation.get("confidence").and_then(|v| v.as_f64()).unwrap_or(0.8);
        let reasoning = recommendation.get("reasoning").and_then(|v| v.as_str()).unwrap_or("智能分析推荐");
        
        let candidate = StrategyCandidate {
            strategy: strategy_name.to_string(),
            confidence,
            reasoning: reasoning.to_string(),
            element_info: ElementInfo {
                bounds: None,
                text: recommendation.get("targetText").and_then(|v| v.as_str()).map(|s| s.to_string()),
                resource_id: None,
                class_name: None,
                click_point: None,
            },
            execution_params: recommendation.clone(),
        };
        
        candidates.push(candidate);
    }
    
    // 提取备选策略（如果有）
    if let Some(alternatives) = recommendation.get("alternatives").and_then(|v| v.as_array()) {
        for alt in alternatives {
            if let Some(strategy_name) = alt.get("strategy").and_then(|v| v.as_str()) {
                let confidence = alt.get("confidence").and_then(|v| v.as_f64()).unwrap_or(0.6);
                let reasoning = alt.get("reasoning").and_then(|v| v.as_str()).unwrap_or("备选策略");
                
                let candidate = StrategyCandidate {
                    strategy: strategy_name.to_string(),
                    confidence,
                    reasoning: reasoning.to_string(),
                    element_info: ElementInfo {
                        bounds: None,
                        text: alt.get("targetText").and_then(|v| v.as_str()).map(|s| s.to_string()),
                        resource_id: None,
                        class_name: None,
                        click_point: None,
                    },
                    execution_params: alt.clone(),
                };
                
                candidates.push(candidate);
            }
        }
    }
    
    if candidates.is_empty() {
        // 生成默认候选策略
        candidates.push(StrategyCandidate {
            strategy: "fallback_smart_selection".to_string(),
            confidence: 0.5,
            reasoning: "前端分析未返回有效策略，使用回退方案".to_string(),
            element_info: ElementInfo {
                bounds: None,
                text: Some("智能选择目标".to_string()),
                resource_id: None,
                class_name: None,
                click_point: None,
            },
            execution_params: serde_json::json!({
                "strategy": "fallback",
                "mode": "smart_selection"
            }),
        });
    }
    
    Ok(candidates)
}

/// 计算 XML 元素数量
fn count_xml_elements(xml_content: &str) -> usize {
    xml_content.matches('<').count()
}

/// 🆕 从 XML 中提取多个有文本的可点击元素（作为候选目标）
fn extract_clickable_texts(xml_content: &str, max_count: usize) -> Vec<String> {
    let mut texts = Vec::new();
    let mut pos = 0;
    
    while texts.len() < max_count {
        if let Some(clickable_pos) = xml_content[pos..].find("clickable=\"true\"") {
            let absolute_pos = pos + clickable_pos;
            
            // 从当前节点往前找到 < 标记开始
            let node_start = xml_content[..absolute_pos].rfind('<').unwrap_or(0);
            
            // 从当前位置往后找到节点结束 />
            if let Some(node_end) = xml_content[absolute_pos..].find("/>") {
                let node_fragment = &xml_content[node_start..absolute_pos + node_end + 2];
                
                // 提取 text="..." 属性
                if let Some(text_start) = node_fragment.find("text=\"") {
                    let text_value_start = text_start + 6; // 跳过 'text="'
                    if let Some(text_end) = node_fragment[text_value_start..].find('"') {
                        let text_value = &node_fragment[text_value_start..text_value_start + text_end];
                        if !text_value.trim().is_empty() && text_value.len() <= 20 && !texts.contains(&text_value.to_string()) {
                            texts.push(text_value.to_string());
                        }
                    }
                }
                
                // 如果没有 text，尝试 content-desc
                if let Some(desc_start) = node_fragment.find("content-desc=\"") {
                    let desc_value_start = desc_start + 14; // 跳过 'content-desc="'
                    if let Some(desc_end) = node_fragment[desc_value_start..].find('"') {
                        let desc_value = &node_fragment[desc_value_start..desc_value_start + desc_end];
                        if !desc_value.trim().is_empty() && desc_value.len() <= 20 && !texts.contains(&desc_value.to_string()) {
                            texts.push(desc_value.to_string());
                        }
                    }
                }
            }
            
            pos = absolute_pos + 1;
        } else {
            break;
        }
    }
    
    texts
}

/// 从祖先节点中提取容器信息
fn extract_container_from_ancestors(ancestors: &[AncestorInfo]) -> Option<ContainerInfo> {
    // 查找第一个可滚动的祖先作为容器
    ancestors.iter()
        .find(|a| a.scrollable)
        .map(|container| ContainerInfo {
            container_type: container.class_name.clone(),
            container_path: container.xpath.clone(),
            item_index: None, // TODO: 可以从 xpath 中提取索引
            total_items: None,
        })
}

/// 从 UI 元素中智能提取分析上下文（回退方案）
/// 
/// 🎯 改进策略：
/// 1. 优先匹配 hint（精确 text/resource-id）
/// 2. 模糊匹配 hint（content-desc contains）
/// 3. 智能回退到常见目标（"我"、"首页"等）
/// 4. 兜底使用第一个可点击元素
fn extract_context_from_ui_elements(
    ui_elements: &[UIElement],
    target_hint: Option<&str>,
) -> Result<AnalysisContext> {
    // 🎯 策略 1: 精确匹配 hint
    if let Some(hint) = target_hint {
        tracing::info!("🔍 尝试精确匹配 hint: '{}'", hint);
        
        let matching_element = ui_elements.iter()
            .find(|elem| {
                // 优先匹配 text（精确）
                if !elem.text.is_empty() {
                    if elem.text == hint || elem.text.trim() == hint.trim() {
                        return true;
                    }
                }
                // 其次匹配 resource-id（精确）
                if let Some(ref rid) = elem.resource_id {
                    if rid == hint || rid.ends_with(&format!("/{}", hint)) {
                        return true;
                    }
                }
                false
            });
        
        if let Some(elem) = matching_element {
            tracing::info!("✅ 精确匹配成功: text={:?}, resource-id={:?}", 
                          elem.text, elem.resource_id);
            
            return build_context_from_element(elem, ui_elements);
        }
    }
    
    // 🎯 策略 2: 模糊匹配 hint（content-desc）
    if let Some(hint) = target_hint {
        tracing::info!("🔍 尝试模糊匹配 hint: '{}'", hint);
        
        let fuzzy_element = ui_elements.iter()
            .find(|elem| {
                // 匹配 content-desc（包含）
                if !elem.content_desc.is_empty() && elem.content_desc.contains(hint) {
                    return true;
                }
                // 匹配 text（包含）
                if !elem.text.is_empty() && elem.text.contains(hint) {
                    return true;
                }
                false
            });
        
        if let Some(elem) = fuzzy_element {
            tracing::info!("✅ 模糊匹配成功: text={:?}, content-desc={:?}", 
                          elem.text, elem.content_desc);
            
            return build_context_from_element(elem, ui_elements);
        }
    }
    
    // 🎯 策略 3: 智能模糊搜索 - 基于 hint 对所有元素评分
    // 🔥 P0修复: 即使精确/模糊匹配失败，也要基于 hint 进行相关性评分
    if let Some(hint) = target_hint {
        tracing::warn!("⚠️ 精确/模糊匹配失败，尝试基于 hint='{}' 的智能相关性评分", hint);
        
        let mut scored_elements: Vec<(f32, &UIElement)> = ui_elements.iter()
            .filter(|elem| {
                // 可交互元素
                elem.clickable || !elem.content_desc.is_empty()
            })
            .map(|elem| {
                let mut score = 0.0f32;
                
                // 🔥 最高优先级：与 hint 的相关性（0-0.6分）
                let hint_lower = hint.to_lowercase();
                
                // text 相关性
                if !elem.text.is_empty() {
                    let text_lower = elem.text.to_lowercase();
                    if text_lower.contains(&hint_lower) {
                        score += 0.4; // 包含完整 hint
                    } else if hint_lower.contains(&text_lower) {
                        score += 0.3; // hint 包含 text
                    } else {
                        // 计算字符相似度
                        let similarity = calculate_string_similarity(&hint_lower, &text_lower);
                        score += similarity * 0.2;
                    }
                }
                
                // content-desc 相关性
                if !elem.content_desc.is_empty() {
                    let desc_lower = elem.content_desc.to_lowercase();
                    if desc_lower.contains(&hint_lower) {
                        score += 0.5; // content-desc 匹配权重最高
                    } else if hint_lower.contains(&desc_lower) {
                        score += 0.4;
                    } else {
                        let similarity = calculate_string_similarity(&hint_lower, &desc_lower);
                        score += similarity * 0.25;
                    }
                }
                
                // 基础特征加分（0-0.4分）
                if elem.resource_id.is_some() && !elem.resource_id.as_ref().unwrap().is_empty() {
                    score += 0.15;
                }
                if elem.clickable {
                    score += 0.15;
                }
                if !elem.text.trim().is_empty() && elem.text.len() < 20 {
                    score += 0.1;
                }
                
                (score, elem)
            })
            .filter(|(score, _)| *score > 0.2) // 必须有最低相关性
            .collect();
        
        // 按评分降序排列
        scored_elements.sort_by(|a, b| b.0.partial_cmp(&a.0).unwrap());
        
        if let Some((score, best_elem)) = scored_elements.first() {
            tracing::warn!(
                "✅ 基于 hint='{}' 选择最佳匹配元素 (相关性评分: {:.2}): text={:?}, content-desc={:?}, resource-id={:?}",
                hint, score,
                best_elem.text,
                best_elem.content_desc,
                best_elem.resource_id
            );
            return build_context_from_element(best_elem, ui_elements);
        } else {
            tracing::error!("❌ 没有找到与 hint='{}' 相关的元素（所有元素相关性评分 < 0.2）", hint);
        }
    }
    
    // 🎯 策略 4: 通用智能选择（无 hint 时的兜底）- 评分所有元素，选择最佳候选
    tracing::warn!("⚠️ 无 hint 提供，尝试通用智能元素评分选择最佳候选");
    
    // 对所有可交互元素进行评分
    let mut scored_elements: Vec<(f32, &UIElement)> = ui_elements.iter()
        .filter(|elem| {
            // 可点击或有content-desc的元素
            elem.clickable || !elem.content_desc.is_empty()
        })
        .map(|elem| {
            let mut score = 0.0f32;
            
            // 有resource-id：+0.3
            if elem.resource_id.as_ref().map_or(false, |s| !s.is_empty()) {
                score += 0.3;
            }
            
            // 有text：+0.2
            let text = &elem.text;
            if !text.is_empty() {
                if !text.trim().is_empty() && text.len() < 20 {
                    score += 0.2;
                    // 短文本更好：+0.1
                    if text.len() <= 6 {
                        score += 0.1;
                    }
                }
            }
            
            // 有content-desc：+0.2
            let desc = &elem.content_desc;
            if !desc.is_empty() {
                if !desc.trim().is_empty() && desc.len() < 30 {
                    score += 0.2;
                    // 包含"按钮"等关键词：+0.1
                    if desc.contains("按钮") || desc.contains("button") {
                        score += 0.1;
                    }
                }
            }
            
            // 可点击：+0.2
            if elem.clickable {
                score += 0.2;
            }
            
            (score, elem)
        })
        .filter(|(score, _)| *score > 0.3) // 至少要有基本特征
        .collect();
    
    // 按评分降序排列
    scored_elements.sort_by(|a, b| b.0.partial_cmp(&a.0).unwrap());
    
    if let Some((score, best_elem)) = scored_elements.first() {
        tracing::warn!(
            "⚠️ 智能选择最佳候选元素 (评分: {:.2}): text={:?}, content-desc={:?}, resource-id={:?}",
            score,
            best_elem.text,
            best_elem.content_desc,
            best_elem.resource_id
        );
        return build_context_from_element(best_elem, ui_elements);
    }
    
    // 🎯 策略 5: 终极兜底 - 返回错误提示需要更多信息
    Err(anyhow::anyhow!(
        "❌ 无法自动选择目标元素。请提供以下任一信息：\n\
         1. 明确的 target_element_hint (text 或 content-desc)\n\
         2. 完整的 user_selection 上下文\n\
         3. 具体的 resource-id\n\
         当前可交互元素数: {}",
        ui_elements.iter().filter(|e| e.clickable).count()
    ))
}

/// 从 UI 元素构建完整的 AnalysisContext（包含祖先分析）
fn build_context_from_element(
    elem: &UIElement,
    _all_elements: &[UIElement],
) -> Result<AnalysisContext> {
    // 🔥 使用 SmartXPathGenerator 生成最佳 XPath（修复 Bug: WRONG_ELEMENT_SELECTION_BUG_REPORT.md）
    use crate::services::execution::matching::{SmartXPathGenerator, ElementAttributes};
    use std::collections::HashMap;
    
    let mut attributes = ElementAttributes::new();
    
    // 构建元素属性映射
    if let Some(ref rid) = elem.resource_id {
        attributes.insert("resource-id".to_string(), rid.clone());
    }
    if !elem.text.is_empty() {
        attributes.insert("text".to_string(), elem.text.clone());
    }
    if !elem.content_desc.is_empty() {
        attributes.insert("content-desc".to_string(), elem.content_desc.clone());
    }
    if let Some(ref class) = elem.class_name {
        attributes.insert("class".to_string(), class.clone());
    }
    attributes.insert("bounds".to_string(), elem.bounds.to_string());
    
    // 使用智能生成器生成最佳 XPath
    let generator = SmartXPathGenerator::new();
    let element_path = if let Some(best_xpath) = generator.generate_best_xpath(&attributes) {
        tracing::info!("✨ 智能生成 XPath: {} (置信度: {:.2})", best_xpath.xpath, best_xpath.confidence);
        best_xpath.xpath
    } else {
        // Fallback：使用简单策略
        if let Some(ref rid) = elem.resource_id {
            format!("//*[@resource-id='{}']", rid)
        } else if !elem.text.is_empty() {
            format!("//*[@text='{}']", elem.text)
        } else if !elem.content_desc.is_empty() {
            format!("//*[@content-desc='{}']", elem.content_desc)
        } else if let Some(ref class) = elem.class_name {
            format!("//*[@class='{}']", class)
        } else {
            "//*[@clickable='true']".to_string()
        }
    };
    
    // 🎯 提取显示文本（优先 text，回退到 content-desc）
    let element_text = if !elem.text.is_empty() {
        Some(elem.text.clone())
    } else if !elem.content_desc.is_empty() {
        Some(elem.content_desc.clone())
    } else {
        None
    };
    
    // 🎯 TODO: 分析祖先链（用于 region_scoped 策略）
    // 可以从 bounds 推断可能的父容器
    
    Ok(AnalysisContext {
        element_path,
        element_text,
        element_type: elem.class_name.clone(),
        resource_id: elem.resource_id.clone(),
        class_name: elem.class_name.clone(),
        bounds: Some(elem.bounds.to_string()),
        content_desc: Some(elem.content_desc.clone()),  // 🆕 传递 content-desc
        container_info: None, // TODO: 实现祖先容器分析
    })
}

/// 测试用的模拟分析函数 → 改为完整的 Step 0-6 智能分析
pub async fn mock_intelligent_analysis(
    request: IntelligentAnalysisRequest,
) -> Result<IntelligentAnalysisResult> {
    tracing::info!("🧠 使用后端完整 Step 0-6 智能分析: {}", request.analysis_id);
    
    let start_time = std::time::Instant::now();
    
    // 🎯 使用后端完整的 StrategyEngine 进行 Step 0-6 分析
    use crate::engine::StrategyEngine;
    
    // 🎯 使用 parse_ui_elements 解析 XML（包含子文本继承）
    tracing::info!("📋 开始解析 UI XML，长度: {} 字符", request.ui_xml_content.len());
    let ui_elements = parse_ui_elements(&request.ui_xml_content)
        .map_err(|e| anyhow::anyhow!("解析UI元素失败: {}", e))?;
    
    tracing::info!("✅ 解析到 {} 个 UI 元素", ui_elements.len());
    
    // 🎯 构建完整的分析上下文 - 使用用户选择信息或智能提取
    let analysis_context = if let Some(ref selection) = request.user_selection {
        // ✅ 使用完整的用户选择上下文
        tracing::info!("✅ 使用完整用户选择上下文: xpath={}, content_desc={:?}", 
                      selection.selected_xpath, selection.content_desc);
        
        // 🔥 NEW: 使用 SmartXPathGenerator 增强 XPath（子元素文本过滤）
        // Bug Fix: WRONG_ELEMENT_SELECTION_BUG_REPORT.md
        use crate::services::execution::matching::{SmartXPathGenerator, ElementAttributes};
        use std::collections::HashMap;
        
        let mut attributes = ElementAttributes::new();
        
        if let Some(ref rid) = selection.resource_id {
            attributes.insert("resource-id".to_string(), rid.clone());
        }
        if let Some(ref text) = selection.text {
            if !text.is_empty() {
                attributes.insert("text".to_string(), text.clone());
            }
        }
        if let Some(ref desc) = selection.content_desc {
            if !desc.is_empty() {
                attributes.insert("content-desc".to_string(), desc.clone());
            }
        }
        if let Some(ref class) = selection.class_name {
            attributes.insert("class".to_string(), class.clone());
        }
        if let Some(ref bounds) = selection.bounds {
            attributes.insert("bounds".to_string(), bounds.clone());
        }
        
        // 使用智能生成器生成最佳 XPath（会自动使用子元素文本过滤）
        let generator = SmartXPathGenerator::new();
        let enhanced_xpath = if let Some(best_xpath) = generator.generate_best_xpath(&attributes) {
            tracing::info!("✨ [XPath增强] 智能生成 XPath: {} (置信度: {:.2})", best_xpath.xpath, best_xpath.confidence);
            tracing::info!("   原始XPath: {}", selection.selected_xpath);
            best_xpath.xpath
        } else {
            tracing::warn!("⚠️ [XPath增强] 智能生成失败，使用原始XPath");
            selection.selected_xpath.clone()
        };
        
        AnalysisContext {
            element_path: enhanced_xpath, // 🔥 使用增强后的 XPath
            element_text: selection.text.clone()
                .or_else(|| {
                    // 🎯 优化：content-desc 作为 text 的回退选项
                    selection.content_desc.as_ref().map(|desc| {
                        // 提取 content-desc 中的核心文本（如"我，按钮" -> "我"）
                        if let Some(comma_pos) = desc.find('，') {
                            desc[..comma_pos].to_string()
                        } else if let Some(comma_pos) = desc.find(',') {
                            desc[..comma_pos].to_string()
                        } else {
                            desc.clone()
                        }
                    })
                }),
            element_type: selection.class_name.clone(),
            resource_id: selection.resource_id.clone(),
            class_name: selection.class_name.clone(),
            bounds: selection.bounds.clone(),
            content_desc: selection.content_desc.clone(),  // 🆕 传递 content-desc
            container_info: extract_container_from_ancestors(&selection.ancestors),
        }
    } else {
        // ⚠️ 回退：从 UI 元素中智能提取上下文
        tracing::warn!("⚠️ 用户选择上下文为空，尝试智能提取上下文");
        
        let target_hint = request.target_element_hint.as_deref();
        extract_context_from_ui_elements(&ui_elements, target_hint)?
    };
    
    tracing::info!("🔍 分析上下文: resource_id={:?}, text={:?}, content-desc={:?}, xpath={}", 
                   analysis_context.resource_id, 
                   analysis_context.element_text,
                   analysis_context.content_desc,
                   analysis_context.element_path);
    
    // 🎯 Step 0-2: 结构匹配评分（如果有 index_path）
    let mut structure_match_scores = Vec::new();
    if let Some(ref user_selection) = request.user_selection {
        if let Some(ref index_path) = user_selection.index_path {
            tracing::info!("🔍 [结构匹配] 开始 Step1-2 评分，index_path: {:?}", index_path);
            
            // 构建 XML 索引器
            match XmlIndexer::build_from_xml(&request.ui_xml_content) {
                Ok(xml_indexer) => {
                    // 通过 index_path 找到目标节点
                    if let Some(clicked_node_idx) = xml_indexer.find_node_by_index_path(index_path) {
                        tracing::info!("✅ [结构匹配] 找到目标节点: index={}", clicked_node_idx);
                        
                        // 推导四节点上下文
                        let normalizer = ClickNormalizer::new(&xml_indexer);
                        let clicked_node = &xml_indexer.all_nodes[clicked_node_idx];
                        
                        match normalizer.normalize_click(clicked_node.bounds) {
                            Ok(normalized) => {
                                let card_root_idx = normalized.card_root.node_index;
                                let clickable_parent_idx = normalized.clickable_parent.node_index;
                                
                                tracing::info!("✅ [结构匹配] 四节点推导完成: card_root={}, clickable_parent={}", 
                                    card_root_idx, clickable_parent_idx);
                                
                                // Step1: 卡片子树评分
                                let adapter = XmlIndexerAdapter::new(&xml_indexer, "adhoc".to_string());
                                let subtree_matcher = SubtreeMatcher::new(&adapter);
                                let subtree_outcome = subtree_matcher.score_subtree(card_root_idx as u32, clickable_parent_idx as u32);
                                
                                tracing::info!("📊 [Step1] 卡片子树评分: {:.3}, 通过闸门: {}", 
                                    subtree_outcome.conf, subtree_outcome.passed_gate);
                                
                                structure_match_scores.push(("card_subtree_scoring", subtree_outcome.conf));
                                
                                // Step2: 叶子上下文评分
                                let leaf_matcher = LeafContextMatcher::new(&xml_indexer);
                                let leaf_sig = leaf_matcher.build_context_signature(clicked_node_idx, clickable_parent_idx);
                                let leaf_outcome = leaf_matcher.score_leaf_context(&leaf_sig);
                                
                                tracing::info!("📊 [Step2] 叶子上下文评分: {:.3}, 通过闸门: {}", 
                                    leaf_outcome.conf, leaf_outcome.passed_gate);
                                
                                structure_match_scores.push(("leaf_context_scoring", leaf_outcome.conf));
                            }
                            Err(e) => {
                                tracing::warn!("⚠️ [结构匹配] 四节点推导失败: {}", e);
                            }
                        }
                    } else {
                        tracing::warn!("⚠️ [结构匹配] 通过 index_path 未找到目标节点");
                    }
                }
                Err(e) => {
                    tracing::warn!("⚠️ [结构匹配] 构建 XML 索引失败: {}", e);
                }
            }
        } else {
            tracing::info!("ℹ️ [结构匹配] 无 index_path，跳过 Step1-2 评分");
        }
    }
    
    // 🎯 Step 3-8: 使用 StrategyEngine 进行传统策略分析
    let strategy_engine = StrategyEngine::new();
    let candidate_scores = strategy_engine.score_candidates(&analysis_context);
    
    tracing::warn!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    tracing::warn!("🧠 智能分析完成，结构匹配: {} 个，传统策略: {} 个", structure_match_scores.len(), candidate_scores.len());
    for (key, conf) in &structure_match_scores {
        tracing::warn!("  [结构] {} - 置信度: {:.3}", key, conf);
    }
    for (i, candidate) in candidate_scores.iter().enumerate() {
        tracing::warn!("  [传统] {}. {} - 置信度: {:.3} ({})", 
                       i + 1, candidate.name, candidate.confidence, candidate.key);
    }
    tracing::warn!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    // 🎯 保存候选数量用于后续使用
    let candidates_count = candidate_scores.len();
    let best_confidence = candidate_scores.first().map(|c| c.confidence as f64).unwrap_or(0.0);
    
    // 🔥 修复：从请求中构建 original_data（用于失败恢复）
    let original_data_from_request = request.user_selection.as_ref()
        .map(|us| {
            serde_json::json!({
                // 🔥 关键：保存原始XML快照（失败恢复时重新分析用）
                "original_xml": request.ui_xml_content.clone(),
                "xml_hash": "", // 前端计算的哈希（如果需要可以添加）
                
                // 用户选择的精确XPath（静态分析结果）
                "selected_xpath": us.selected_xpath.clone(),
                
                // 元素特征信息
                "element_text": us.text.clone().unwrap_or_default(),
                "element_bounds": us.bounds.clone(),
                "key_attributes": {
                    "resource-id": us.resource_id.clone(),
                    "class": us.class_name.clone(),
                    "content-desc": us.content_desc.clone(),
                },
                
                // 🔥 子元素文本列表（解决父容器+子文本模式）
                "children_texts": us.children_texts.clone(),
                
                // 数据完整性标记
                "data_integrity": {
                    "has_original_xml": !request.ui_xml_content.is_empty(),
                    "has_user_xpath": !us.selected_xpath.is_empty(),
                    "has_children_texts": !us.children_texts.is_empty(),
                    "extraction_timestamp": chrono::Utc::now().timestamp_millis()
                }
            })
        });
    
    tracing::info!(
        "🔍 [数据保留] original_data 构建完成: has_user_selection={}, xml_size={} bytes",
        original_data_from_request.is_some(),
        request.ui_xml_content.len()
    );
    
    // 🎯 转换 StrategyEngine 结果为 IntelligentAnalysisResult 格式
    let mut candidates: Vec<StrategyCandidate> = Vec::new();
    
    // 🔥 Step1-2: 添加结构匹配评分候选项（优先级最高）
    for (key, conf) in structure_match_scores {
        let (name, description) = match key {
            "card_subtree_scoring" => ("卡片子树评分", "基于卡片结构形态匹配，适用于列表卡片场景"),
            "leaf_context_scoring" => ("叶子上下文评分", "基于叶子节点上下文匹配，适用于复杂嵌套场景"),
            _ => (key, "结构匹配策略"),
        };
        
        let mut exec_params = serde_json::json!({
            "strategy": key,
            "confidence": conf,
            "mode": "structure_matching"
        });
        
        // 添加 original_data
        if let Some(ref original_data) = original_data_from_request {
            exec_params["original_data"] = original_data.clone();
        }
        
        candidates.push(StrategyCandidate {
            strategy: key.to_string(),
            confidence: conf as f64,
            reasoning: description.to_string(),
            element_info: ElementInfo {
                bounds: analysis_context.bounds.clone(),
                text: analysis_context.element_text.clone(),
                resource_id: analysis_context.resource_id.clone(),
                class_name: analysis_context.class_name.clone(),
                click_point: None,
            },
            execution_params: exec_params,
        });
        
        tracing::info!("✅ [候选生成] 添加结构匹配候选: {} - {:.3}", name, conf);
    }
    
    // 🔥 Step3-8: 添加传统策略候选项
    let traditional_candidates: Vec<StrategyCandidate> = candidate_scores.into_iter()
        .map(|score| {
            // 🔥 构建 execution_params，包含 original_data
            let mut exec_params = serde_json::json!({
                "strategy": score.variant,
                "xpath": score.xpath,
                "confidence": score.confidence,
                "evidence": score.evidence
            });
            
            // 🔥 关键修复：添加 original_data 到每个候选
            if let Some(ref original_data) = original_data_from_request {
                exec_params["original_data"] = original_data.clone();
                tracing::debug!(
                    "✅ [候选生成] 候选 {}: 已包含 original_data (xml_size={} bytes)",
                    score.name,
                    request.ui_xml_content.len()
                );
            } else {
                tracing::warn!(
                    "⚠️ [候选生成] 候选 {}: 缺少 user_selection，无法构建 original_data",
                    score.name
                );
            }
            
            StrategyCandidate {
                strategy: score.key,
                confidence: score.confidence as f64,
                reasoning: score.description,
                element_info: ElementInfo {
                    bounds: None, // 稍后从XML中提取
                    text: analysis_context.element_text.clone(),
                    resource_id: analysis_context.resource_id.clone(),
                    class_name: analysis_context.class_name.clone(),
                    click_point: None, // 根据 bounds 计算
                },
                execution_params: exec_params,
            }
        })
        .collect();
    
    // 合并传统策略候选项到总列表
    candidates.extend(traditional_candidates);
    
    tracing::info!("✅ [候选生成] 总计生成 {} 个候选项（结构匹配 + 传统策略）", candidates.len());
    
    // 🎯 填充候选的 bounds 信息（从 XML 中根据 xpath 提取）
    tracing::info!("🔍 [Bounds提取] 开始从 {} 个候选的 xpath 中提取 bounds", candidates.len());
    for (idx, candidate) in candidates.iter_mut().enumerate() {
        if let Some(xpath) = candidate.execution_params.get("xpath")
            .and_then(|v| v.as_str()) 
        {
            // 尝试根据 xpath 在 ui_elements 中找到匹配的元素
            if let Some(bounds) = find_element_bounds_by_xpath(&ui_elements, xpath) {
                candidate.element_info.bounds = Some(bounds.clone());
                tracing::debug!(
                    "✅ [Bounds提取] 候选 #{}: xpath={} -> bounds={}",
                    idx + 1, xpath, bounds
                );
            } else {
                tracing::warn!(
                    "⚠️ [Bounds提取] 候选 #{}: xpath={} -> 未找到匹配元素",
                    idx + 1, xpath
                );
            }
        }
    }
    
    // 🎯 如果没有找到高置信度候选，进行智能回退分析
    let mut final_candidates = if candidates.is_empty() || 
                              candidates.iter().all(|c| c.confidence < 0.6) {
        tracing::warn!("⚠️ 主要策略置信度低，启用智能回退分析");
        perform_fallback_analysis(&request, &ui_elements).await?
    } else {
        candidates
    };
    
    // 🎯 根据用户选择的 bounds 重新排序候选（Bug #4 修复）
    if let Some(user_selection) = &request.user_selection {
        if let Some(bounds_str) = &user_selection.bounds {
            if let Some(user_bounds) = ElementBounds::from_string(bounds_str) {
                tracing::info!(
                    "🎯 [Bounds过滤] 检测到用户选择bounds，开始智能分析: user_bounds={}",
                    user_bounds
                );
                
                // 🆕 先检查用户选择的区域内是否有可点击的子元素
                let clickable_children = crate::exec::v3::helpers::element_hierarchy_analyzer::find_clickable_children_in_bounds(
                    &ui_elements,
                    bounds_str
                );
                
                if !clickable_children.is_empty() {
                    tracing::warn!(
                        "⚠️ [智能修正] 用户选择的区域 {} 包含 {} 个可点击子元素，但生成的候选可能不在此区域内!",
                        user_bounds, clickable_children.len()
                    );
                    tracing::warn!(
                        "💡 [建议] 用户可能误选了容器而不是具体按钮，建议前端优化可视化选择"
                    );
                    
                    // 打印可点击子元素供调试
                    for (idx, child) in clickable_children.iter().take(5).enumerate() {
                        let text = &child.text;
                        let bounds = &child.bounds;
                        tracing::info!(
                            "  可点击子元素 #{}: text='{}', bounds={}, resource_id={:?}",
                            idx + 1, text, bounds, child.resource_id
                        );
                    }
                }
                
                // 使用原有的bounds重排序逻辑
                final_candidates = crate::exec::v3::helpers::strategy_generation::rerank_candidates_by_bounds(
                    final_candidates,
                    Some(bounds_str)
                );
                tracing::info!("✅ [Bounds过滤] 候选重排序完成，最佳候选: {:?}", 
                    final_candidates.first().map(|c| &c.element_info.text));
            }
        }
    }
    
    let result = IntelligentAnalysisResult {
        analysis_id: request.analysis_id.clone(),
        success: true,
        candidates: final_candidates,
        analysis_time_ms: start_time.elapsed().as_millis(),
        step_details: vec![
            StepAnalysisDetail {
                step_name: "Step0to6_FullAnalysis".to_string(),
                step_index: 0,
                candidates_found: candidates_count,
                best_confidence: best_confidence,
                execution_time_ms: start_time.elapsed().as_millis() as u64,
                status: "success".to_string(),
            },
        ],
        recommendations: vec![
            "使用后端完整 Step 0-6 智能策略分析".to_string(),
            "基于元素属性和结构关系的综合评估".to_string(),
        ],
        metadata: AnalysisMetadata {
            xml_hash: format!("{:x}", md5::compute(&request.ui_xml_content)),
            xml_element_count: ui_elements.len(),
            device_info: request.device_id,
            analysis_timestamp: chrono::Utc::now().to_rfc3339(),
            engine_version: "v3.0.0-full-step0to6".to_string(),
        },
    };
    
    tracing::info!("✅ 完整智能分析完成: {} 个候选策略", result.candidates.len());
    Ok(result)
}

/// 从 hint 中提取 resource-id（已废弃，保留兼容）
#[deprecated(note = "使用 UserSelectionContext 代替")]
fn extract_resource_id_from_hint(hint: &str) -> Option<String> {
    // 简单的启发式提取，可以根据实际情况优化
    if hint.contains("resource-id") {
        // 提取 resource-id="xxx" 中的 xxx
        if let Some(start) = hint.find("resource-id=\"") {
            let value_start = start + 13;
            if let Some(end) = hint[value_start..].find('"') {
                return Some(hint[value_start..value_start + end].to_string());
            }
        }
    }
    None
}

/// 智能回退分析 - 当主要策略失败时使用
async fn perform_fallback_analysis(
    request: &IntelligentAnalysisRequest, // 🔥 修复：需要 request 来构建 original_data
    ui_elements: &[UIElement],
) -> Result<Vec<StrategyCandidate>> {
    tracing::info!("🔄 执行智能回退分析");
    
    // � 提取所有可交互元素的文本（已经包含子元素继承的文本）
    // 🎯 修复: 不仅检查 clickable, 还检查 content-desc 是否包含"按钮"
    let clickable_texts: Vec<String> = ui_elements.iter()
        .filter(|elem| {
            let is_clickable = elem.clickable;
            let has_button_desc = elem.content_desc.contains("按钮");
            is_clickable || has_button_desc
        })
        .filter_map(|elem| {
            // ✅ 优先使用 text, 如果 text 为空则 fallback 到 content-desc
            if !elem.text.trim().is_empty() && elem.text.len() <= 20 {
                Some(elem.text.clone())
            } else if !elem.content_desc.trim().is_empty() && elem.content_desc.len() <= 30 {
                Some(elem.content_desc.clone())
            } else {
                None
            }
        })
        .collect();
    
    // 🔍 优先查找常见目标
    let priority_targets = vec!["我", "首页", "消息", "朋友", "商城"];
    let target_text = priority_targets.iter()
        .find_map(|&target| {
            clickable_texts.iter()
                .find(|text| text.as_str() == target)
                .cloned()
        })
        .or_else(|| clickable_texts.first().cloned())
        .unwrap_or_else(|| "智能推荐".to_string());
    
    // 🔥 修复：构建 original_data（即使在回退分析中也需要保留）
    let original_data_from_request = request.user_selection.as_ref()
        .map(|us| {
            serde_json::json!({
                // 🔥 关键：保存原始XML快照（失败恢复时重新分析用）
                "original_xml": request.ui_xml_content.clone(),
                "xml_hash": "", // 前端计算的哈希
                
                // 用户选择的精确XPath（静态分析结果）
                "selected_xpath": us.selected_xpath.clone(),
                
                // 元素特征信息
                "element_text": us.text.clone().unwrap_or_default(),
                "element_bounds": us.bounds.clone(),
                "key_attributes": {
                    "resource-id": us.resource_id.clone(),
                    "class": us.class_name.clone(),
                    "content-desc": us.content_desc.clone(),
                },
                
                // 🔥 子元素文本列表（解决父容器+子文本模式）
                "children_texts": us.children_texts.clone(),
                
                // 数据完整性标记
                "data_integrity": {
                    "has_original_xml": !request.ui_xml_content.is_empty(),
                    "has_user_xpath": !us.selected_xpath.is_empty(),
                    "has_children_texts": !us.children_texts.is_empty(),
                    "extraction_timestamp": chrono::Utc::now().timestamp_millis()
                }
            })
        });
    
    tracing::info!(
        "🔍 [回退分析] original_data 构建完成: has_user_selection={}, xml_size={} bytes",
        original_data_from_request.is_some(),
        request.ui_xml_content.len()
    );
    
    // 生成回退候选策略
    let mut execution_params = serde_json::json!({
        "strategy": "smart_fallback",
        "targetText": target_text,
        "mode": "adaptive"
    });
    
    // 🔥 关键修复：添加 original_data 到回退候选
    if let Some(ref original_data) = original_data_from_request {
        execution_params["original_data"] = original_data.clone();
        tracing::info!(
            "✅ [回退分析] 回退候选已包含 original_data (xml_size={} bytes)",
            request.ui_xml_content.len()
        );
    } else {
        tracing::warn!("⚠️ [回退分析] 缺少 user_selection，无法构建 original_data");
    }
    
    let candidates = vec![
        StrategyCandidate {
            strategy: "fallback_smart_selection".to_string(),
            confidence: 0.7,
            reasoning: format!("回退分析找到目标: '{}'", target_text),
            element_info: ElementInfo {
                bounds: None,
                text: Some(target_text.clone()),
                resource_id: None,
                class_name: None,
                click_point: None,
            },
            execution_params,
        },
    ];
    
    Ok(candidates)
}

/// 🔧 计算两个字符串的相似度（简单实现：基于最长公共子序列）
/// 返回值范围 0.0-1.0，1.0表示完全相同
fn calculate_string_similarity(s1: &str, s2: &str) -> f32 {
    if s1.is_empty() || s2.is_empty() {
        return 0.0;
    }
    
    if s1 == s2 {
        return 1.0;
    }
    
    // 使用 Levenshtein 距离的简化版本
    let len1 = s1.chars().count();
    let len2 = s2.chars().count();
    let max_len = len1.max(len2) as f32;
    
    // 计算公共字符数
    let common_chars: usize = s1.chars()
        .filter(|c| s2.contains(*c))
        .count();
    
    // 相似度 = 公共字符数 / 较长字符串长度
    common_chars as f32 / max_len
}

/// 🔍 根据 XPath 在 UIElement 列表中查找元素的 bounds
/// 
/// 支持常见的 XPath 格式:
/// - //*[@resource-id='xxx']
/// - //*[@content-desc='xxx']
/// - //*[@text='xxx']
/// - //node[@index='N']
/// - //*[@class='xxx' and @bounds='[...]']
fn find_element_bounds_by_xpath(
    elements: &[UIElement],
    xpath: &str,
) -> Option<String> {
    // 🔧 特殊处理: //node[@index='N'] 格式
    if xpath.contains("//node[@index='") {
        let start = xpath.find("[@index='")? + 9;
        let end = xpath[start..].find('\'')?;
        let index_str = &xpath[start..start + end];
        if let Ok(target_index) = index_str.parse::<usize>() {
            tracing::debug!("🔍 [XPath匹配] 按index查找: {}", target_index);
            // 按index查找元素
            for (idx, element) in elements.iter().enumerate() {
                if idx == target_index {
                    let bounds = &element.bounds;
                    {
                        tracing::debug!(
                            "✅ [XPath匹配] 找到元素: index={} -> bounds={}",
                            target_index, bounds
                        );
                        return Some(bounds.to_string());
                    }
                }
            }
        }
        return None;
    }
    
    // 🔧 特殊处理: @class='xxx' and @bounds='[...]' 格式
    if xpath.contains("@class=") && xpath.contains("and @bounds=") {
        let class_start = xpath.find("@class='")? + 8;
        let class_end = xpath[class_start..].find('\'')?;
        let target_class = &xpath[class_start..class_start + class_end];
        
        let bounds_start = xpath.find("@bounds='")? + 9;
        let bounds_end = xpath[bounds_start..].find('\'')?;
        let target_bounds = &xpath[bounds_start..bounds_start + bounds_end];
        
        tracing::debug!(
            "🔍 [XPath匹配] 按class+bounds查找: class='{}', bounds='{}'",
            target_class, target_bounds
        );
        
        for element in elements {
            let class_match = element.class_name.as_deref() == Some(target_class);
            let bounds_match = element.bounds.to_string() == target_bounds;
            
            if class_match && bounds_match {
                tracing::debug!(
                    "✅ [XPath匹配] 找到元素: class='{}', bounds='{}'",
                    target_class, target_bounds
                );
                return Some(element.bounds.to_string());
            }
        }
        
        tracing::debug!(
            "⚠️ [XPath匹配] 未找到: class='{}', bounds='{}'",
            target_class, target_bounds
        );
        return None;
    }
    
    // 提取 XPath 中的属性和值
    let (attr_name, attr_value) = if xpath.contains("@resource-id") {
        let start = xpath.find("@resource-id='")? + 14;
        let end = xpath[start..].find('\'')?;
        ("resource-id", &xpath[start..start + end])
    } else if xpath.contains("@content-desc") {
        let start = xpath.find("@content-desc='")? + 15;
        let end = xpath[start..].find('\'')?;
        ("content-desc", &xpath[start..start + end])
    } else if xpath.contains("@text") {
        let start = xpath.find("@text='")? + 7;
        let end = xpath[start..].find('\'')?;
        ("text", &xpath[start..start + end])
    } else {
        tracing::warn!("⚠️ [XPath解析] 不支持的 XPath 格式: {}", xpath);
        return None;
    };
    
    // 在元素列表中查找匹配的元素
    for element in elements {
        let matches = match attr_name {
            "resource-id" => element.resource_id.as_deref() == Some(attr_value),
            "content-desc" => element.content_desc == attr_value,
            "text" => {
                // 支持子元素文本匹配: //*[@resource-id='xxx']//*[@text='yyy']
                if xpath.contains("]//*[@text") {
                    // 这是一个子元素过滤条件，需要检查 resource-id 和 子元素文本
                    if let Some(parent_rid_start) = xpath.find("@resource-id='") {
                        let rid_start = parent_rid_start + 14;
                        if let Some(rid_end) = xpath[rid_start..].find('\'') {
                            let parent_rid = &xpath[rid_start..rid_start + rid_end];
                            
                            // 检查父元素 resource-id 是否匹配
                            if element.resource_id.as_deref() != Some(parent_rid) {
                                continue;
                            }
                            
                            // 检查是否有子元素包含目标文本
                            // 简化版本：检查元素自身text或children_texts
                            element.text == attr_value
                        } else {
                            false
                        }
                    } else {
                        element.text == attr_value
                    }
                } else {
                    element.text == attr_value
                }
            },
            _ => false,
        };
        
        if matches {
            let ref bounds = &element.bounds; {
                tracing::debug!(
                    "✅ [XPath匹配] 找到元素: {}='{}' -> bounds={}",
                    attr_name, attr_value, bounds
                );
                return Some(bounds.to_string());
            }
        }
    }
    
    tracing::debug!(
        "⚠️ [XPath匹配] 未找到匹配元素: {}='{}'",
        attr_name, attr_value
    );
    None
}



