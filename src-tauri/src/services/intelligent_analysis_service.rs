// src-tauri/src/services/intelligent_analysis_service.rs
// module: intelligent-analysis | layer: services | role: V3 intelligent analysis service
// summary: V3智能分析服务，桥接后端V3执行系统与前端智能策略系统

use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use anyhow::Result;
use crate::services::universal_ui_page_analyzer::{parse_ui_elements_simple as parse_ui_elements, UIElement};  // ✅ 导入 UI 解析函数
use crate::engine::{AnalysisContext, ContainerInfo};  // ✅ 导入分析上下文和容器信息
use crate::engine::xml_indexer::XmlIndexer;  // 🔥 导入XML索引器
use crate::types::page_analysis::ElementBounds; // ✅ 导入 ElementBounds
use crate::services::unified_match_service::UnifiedMatchService;
use crate::domain::structure_runtime_match::ClickNormalizer;  // 🔥 导入点击归一化器

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

    /// 🆕 匹配模式偏好
    /// "smart" (默认): 智能混合，优先语义
    /// "position": 位置优先（如“第一个”），严格遵循 index_path/xpath
    /// "exact": 精确内容匹配，要求文本完全相等
    #[serde(default)]
    pub match_mode: Option<String>,
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
#[allow(dead_code)]
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
        index_path: None, // 🆕 初始化 index_path
        container_info: None, // TODO: 实现祖先容器分析
    })
}

/// 🆕 语义反向查找：通过子元素文本反向查找父容器
/// 
/// 解决动态列表（瀑布流）中元素位置变化导致 index_path 失效的问题。
/// 策略：
/// 1. 从 user_selection 中提取核心文本（如 "来自知恩"）
/// 2. 在当前 XML 中全局搜索包含该文本的叶子节点
/// 3. 向上查找最近的可点击容器（clickable=true）
/// 🔥 关键修复：保留高质量的结构化XPath（如 descendant::）
fn semantic_reverse_lookup(
    xml_content: &str,
    selection: &UserSelectionContext,
    exact_match: bool, // 🆕 新增参数：是否精确匹配
) -> Option<AnalysisContext> {
    // 🆕 预先检测原始XPath是否是高质量的结构化XPath
    let original_xpath = &selection.selected_xpath;
    let is_high_quality_xpath = original_xpath.contains("descendant::")
        || original_xpath.contains("ancestor::")
        || original_xpath.contains("following-sibling::")
        || original_xpath.contains("preceding-sibling::")
        || original_xpath.contains("child::")
        || original_xpath.contains("parent::")
        || (original_xpath.contains("@text=") && original_xpath.contains("//*["));
    
    if is_high_quality_xpath {
        tracing::info!("🎯 [语义反向查找] 检测到高质量结构化XPath，跳过语义查找，保留原始: {}", original_xpath);
        // 对于高质量XPath，直接返回None，让调用者使用else分支保留原始XPath
        return None;
    }
    
    // 1. 提取搜索关键词
    let mut keywords = Vec::new();
    
    if exact_match {
        // 精确匹配模式：直接使用完整文本
        if let Some(ref desc) = selection.content_desc {
            if !desc.is_empty() {
                keywords.push(desc.clone());
            }
        }
        if let Some(ref text) = selection.text {
            if !text.is_empty() {
                keywords.push(text.clone());
            }
        }
    } else {
        // 智能/模糊模式：提取特征词
        // 优先使用 content-desc (通常包含完整信息)
        if let Some(ref desc) = selection.content_desc {
            // 提取 "来自xxx" 这样的强特征
            if let Some(idx) = desc.find("来自") {
                let author_part = &desc[idx..];
                // 取 "来自xxx" 的前10个字符作为关键词，避免 "147赞" 这种动态数字干扰
                let end_idx = author_part.find(' ').unwrap_or(author_part.len());
                let keyword = &author_part[..end_idx];
                if !keyword.is_empty() {
                    keywords.push(keyword.to_string());
                }
            }
            // 如果没有 "来自"，尝试使用整个 desc 的前段（标题）
            if keywords.is_empty() {
                let title_end = desc.find(' ').unwrap_or(desc.len().min(10));
                keywords.push(desc[..title_end].to_string());
            }
        }
        
        // 其次使用 text
        if let Some(ref text) = selection.text {
            if !text.is_empty() && text.len() > 2 {
                keywords.push(text.clone());
            }
        }
    }

    if keywords.is_empty() {
        return None;
    }

    tracing::info!("🔍 [语义反向查找] 启动，模式: {}, 关键词: {:?}", 
        if exact_match { "精确" } else { "模糊" }, keywords);

    // 2. 解析 XML 寻找匹配节点
    // 这里使用简单的字符串查找定位，然后解析局部结构，避免全量 DOM 解析的开销
    // 或者复用已有的 parse_ui_elements 结果（如果有）
    // 为了准确性，这里我们重新解析 XML 为 UIElement 列表
    let ui_elements = match parse_ui_elements(xml_content) {
        Ok(els) => els,
        Err(_) => return None,
    };

    // 查找包含关键词的节点
    let mut target_node_idx = None;
    
    for (idx, elem) in ui_elements.iter().enumerate() {
        for keyword in &keywords {
            let is_match = if exact_match {
                // 精确匹配：完全相等
                elem.content_desc == *keyword || elem.text == *keyword
            } else {
                // 模糊匹配：包含
                elem.content_desc.contains(keyword) || elem.text.contains(keyword)
            };

            if is_match {
                target_node_idx = Some(idx);
                tracing::info!("✅ [语义反向查找] 找到匹配节点: text={:?}, desc={:?}", 
                    elem.text, elem.content_desc);
                break;
            }
        }
        if target_node_idx.is_some() {
            break;
        }
    }

    // 3. 向上查找可点击容器
    if let Some(idx) = target_node_idx {
        if let Ok(indexer) = XmlIndexer::build_from_xml(xml_content) {
            let target_bounds = &ui_elements[idx].bounds;
            
            // 修复：正确比较 ElementBounds 和 (i32, i32, i32, i32)
            if let Some(node_idx) = indexer.all_nodes.iter().position(|n| 
                n.bounds.0 == target_bounds.left && 
                n.bounds.1 == target_bounds.top && 
                n.bounds.2 == target_bounds.right && 
                n.bounds.3 == target_bounds.bottom
            ) {
                // 向上遍历寻找 clickable
                let mut curr_idx = node_idx;
                let mut steps = 0;
                
                while steps < 5 { // 最多向上找5层
                    let node = &indexer.all_nodes[curr_idx];
                    // 修复：通过 node.element 访问属性
                    if node.element.clickable {
                        tracing::info!("✅ [语义反向查找] 找到可点击容器: class={:?}, bounds={:?}", 
                            node.element.class_name, node.bounds);
                        
                        // 构建上下文
                        return Some(AnalysisContext {
                            element_path: format!("//*[@bounds='[{},{}][{},{}]']", 
                                node.bounds.0, node.bounds.1, node.bounds.2, node.bounds.3),
                            element_text: Some(node.element.text.clone()),
                            element_type: node.element.class_name.clone(),
                            resource_id: node.element.resource_id.clone(),
                            class_name: node.element.class_name.clone(),
                            bounds: Some(format!("[{},{}][{},{}]", 
                                node.bounds.0, node.bounds.1, node.bounds.2, node.bounds.3)),
                            content_desc: Some(node.element.content_desc.clone()),
                            index_path: None, // 🆕 初始化 index_path
                            container_info: None,
                        });
                    }
                    
                    if let Some(parent) = node.parent_index {
                        curr_idx = parent;
                        steps += 1;
                    } else {
                        break;
                    }
                }
            }
        }
    }

    None
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
    let ui_elements = parse_ui_elements(&request.ui_xml_content)
        .map_err(|e| anyhow::anyhow!("解析UI元素失败: {}", e))?;
    
    // 🎯 构建完整的分析上下文 - 使用用户选择信息或智能提取
    let analysis_context = if let Some(ref selection) = request.user_selection {
        // ✅ 使用完整的用户选择上下文
        tracing::info!("✅ 使用完整用户选择上下文: xpath={}, content_desc={:?}", 
                      selection.selected_xpath, selection.content_desc);
        
        // 🔥 NEW: 根据 match_mode 决定策略
        let match_mode = selection.match_mode.as_deref().unwrap_or("smart");
        tracing::info!("🎯 匹配模式: {}", match_mode);

        let semantic_context = if match_mode == "position" {
            // 位置优先：跳过语义查找，直接走后续的结构/XPath匹配
            tracing::info!("⏩ [匹配策略] 位置优先模式，跳过语义查找");
            None
        } else {
            // 智能/精确模式：尝试语义查找
            let exact = match_mode == "exact";
            semantic_reverse_lookup(&request.ui_xml_content, selection, exact)
        };
        
        if let Some(ctx) = semantic_context {
            tracing::info!("🚀 [语义反向查找] 成功锁定目标! bounds={:?}", ctx.bounds);
            ctx
        } else {
            // 🔥 关键修复：检查原始XPath是否已经是高质量的结构化XPath
            // 如果前端已经生成了 descendant:: 或其他高级XPath，应该直接使用，而不是覆盖
            let original_xpath = &selection.selected_xpath;
            let is_high_quality_xpath = original_xpath.contains("descendant::")
                || original_xpath.contains("ancestor::")
                || original_xpath.contains("following-sibling::")
                || original_xpath.contains("preceding-sibling::")
                || (original_xpath.contains("@text=") && original_xpath.contains("["))
                || (original_xpath.contains("@content-desc=") && original_xpath.contains("["));
            
            let enhanced_xpath = if is_high_quality_xpath {
                // ✅ 保留前端已生成的高质量结构化XPath，不要覆盖！
                tracing::info!("🎯 [XPath保护] 检测到高质量结构化XPath，保留原始: {}", original_xpath);
                original_xpath.clone()
            } else {
                // 只有当原始XPath不是高质量时，才尝试增强
                use crate::services::execution::matching::{SmartXPathGenerator, ElementAttributes};
                
                let mut attributes = ElementAttributes::new();
                
                // 构建元素属性映射
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
                
                // 使用智能生成器生成最佳 XPath
                let generator = SmartXPathGenerator::new();
                if let Some(best_xpath) = generator.generate_best_xpath(&attributes) {
                    // 只有当生成的XPath比原始的更好时才使用
                    if best_xpath.confidence > 0.5 && !best_xpath.xpath.contains("@bounds=") {
                        tracing::info!("✨ [XPath增强] 智能生成 XPath: {} (置信度: {:.2})", best_xpath.xpath, best_xpath.confidence);
                        tracing::info!("   原始XPath: {}", selection.selected_xpath);
                        best_xpath.xpath
                    } else {
                        // 生成的XPath质量不高，保留原始
                        tracing::info!("🔒 [XPath保留] 生成的XPath质量不高(bounds fallback)，使用原始: {}", original_xpath);
                        original_xpath.clone()
                    }
                } else {
                    tracing::warn!("⚠️ [XPath增强] 智能生成失败，使用原始XPath");
                    selection.selected_xpath.clone()
                }
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
                index_path: selection.index_path.clone(), // ✅ 传递 index_path
                container_info: extract_container_from_ancestors(&selection.ancestors),
            }
        }
    } else {
        // ⚠️ 回退：从 UI 元素中智能提取上下文
        tracing::warn!("⚠️ 用户选择上下文为空，尝试智能提取上下文");
        
        let target_hint = request.target_element_hint.as_deref();
        extract_context_from_ui_elements(&ui_elements, target_hint)?
//         }
    };
    
    tracing::info!("🔍 分析上下文: resource_id={:?}, text={:?}, content-desc={:?}, xpath={}", 
                   analysis_context.resource_id, 
                   analysis_context.element_text,
                   analysis_context.content_desc,
                   analysis_context.element_path);
    
    // 🎯 Step 0-2: 结构匹配评分（如果有 index_path）
    let mut structure_match_scores: Vec<(&str, f64)> = Vec::new();
    if let Some(ref user_selection) = request.user_selection {
        if let Some(ref index_path) = user_selection.index_path {
            tracing::info!("🔍 [结构匹配] 开始 Step1-2 评分，index_path: {:?}", index_path);
            
            // 构建 XML 索引器
            match XmlIndexer::build_from_xml(&request.ui_xml_content) {
                Ok(xml_indexer) => {
                    let xml_indexer_arc = std::sync::Arc::new(xml_indexer);
                    
                    // 通过 index_path 找到目标节点
                    if let Some(clicked_node_idx) = xml_indexer_arc.find_node_by_index_path(index_path) {
                        tracing::info!("✅ [结构匹配] 找到目标节点: index={}", clicked_node_idx);
                        
                        // 推导四节点上下文 (用于 UnifiedMatchService)
                        let normalizer = ClickNormalizer::new(&xml_indexer_arc);
                        let clicked_node = &xml_indexer_arc.all_nodes[clicked_node_idx];
                        
                        // 尝试归一化，如果失败则传递 None (UnifiedMatchService 会处理降级)
                        let normalize_result = normalizer.normalize_click(clicked_node.bounds).ok();
                        
                        if let Some(ref norm) = normalize_result {
                             tracing::info!("✅ [结构匹配] 四节点推导完成: card_root={}, clickable_parent={}", 
                                   norm.card_root.node_index, norm.clickable_parent.node_index);
                        } else {
                             tracing::warn!("⚠️ [结构匹配] 四节点推导失败，将使用降级模式");
                        }

                        // 使用 UnifiedMatchService 执行所有匹配器
                        let unified_service = UnifiedMatchService::new();
                        match unified_service.analyze_element(xml_indexer_arc.clone(), clicked_node_idx, normalize_result.as_ref()) {
                            Ok(results) => {
                                for result in results {
                                    tracing::info!("📊 [{}] 评分: {:.3}, 通过: {}", 
                                        result.mode.display_name(), result.confidence, result.passed_gate);
                                    // 🔥 修复：使用 key() 而不是 display_name() 作为 map key
                                    structure_match_scores.push((result.mode.key(), result.confidence as f64));
                                }
                            }
                            Err(e) => {
                                tracing::warn!("⚠️ [结构匹配] UnifiedMatchService 分析失败: {}", e);
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
//                 "original_xml": request.ui_xml_content.clone(),
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
                
                // 🔥 关键修复：添加 index_path（结构匹配执行必需）
                "index_path": us.index_path.clone(),
                
                // 🔥 子元素文本列表（解决父容器+子文本模式）
                "children_texts": us.children_texts.clone(),
                
                // 数据完整性标记
                "data_integrity": {
                    "has_original_xml": !request.ui_xml_content.is_empty(),
                    "has_user_xpath": !us.selected_xpath.is_empty(),
                    "has_children_texts": !us.children_texts.is_empty(),
                    "has_index_path": us.index_path.is_some(),
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
                "mode": "traditional"
            });
            
            if let Some(ref original_data) = original_data_from_request {
                exec_params["original_data"] = original_data.clone();
            }
            
            StrategyCandidate {
                strategy: score.variant,
                confidence: score.confidence as f64,
                reasoning: format!("Model: {:.2}, Locator: {:.2}", score.evidence.model, score.evidence.locator),
                element_info: ElementInfo {
                    bounds: analysis_context.bounds.clone(),
                    text: analysis_context.element_text.clone(),
                    resource_id: analysis_context.resource_id.clone(),
                    class_name: analysis_context.class_name.clone(),
                    click_point: None,
                },
                execution_params: exec_params,
            }
        })
        .collect();
        
    candidates.extend(traditional_candidates);
    
    // 🎯 最终候选排序与过滤
    let mut final_candidates = candidates;
    final_candidates.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap());
    
    // 🔥 Bounds 补全与重排序
    if let Some(ref user_selection) = request.user_selection {
        if let Some(ref bounds_str) = user_selection.bounds {
            if !bounds_str.is_empty() {
                // 尝试补全缺失 bounds 的候选
                for candidate in &mut final_candidates {
                    let xpath = candidate.execution_params["xpath"].as_str().unwrap_or("");
                    if candidate.element_info.bounds.is_none() && !xpath.is_empty() {
                        // 尝试通过 XPath 查找 bounds
                        if let Some(bounds) = find_element_bounds_by_xpath(&request.ui_xml_content, xpath) {
                            tracing::info!("✅ [Bounds补全] 通过 XPath 找到 bounds: {}", bounds);
                            candidate.element_info.bounds = Some(bounds);
                        }
                    }
                }
                
                // 使用原有的bounds重排序逻辑
                final_candidates = crate::exec::helpers::strategy_generation::rerank_candidates_by_bounds(
                    final_candidates,
                    Some(bounds_str)
                );
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
#[allow(dead_code)]
fn extract_resource_id_from_hint(hint: &str) -> Option<String> {
    if hint.contains("resource-id") {
        if let Some(start) = hint.find("resource-id=\"") {
            let value_start = start + 13;
            if let Some(end) = hint[value_start..].find('"') {
                return Some(hint[value_start..value_start + end].to_string());
            }
        }
    }
    None
}

/// 辅助函数：计算字符串相似度
fn calculate_string_similarity(s1: &str, s2: &str) -> f32 {
    if s1 == s2 {
        return 1.0;
    }
    let len1 = s1.chars().count();
    let len2 = s2.chars().count();
    if len1 == 0 || len2 == 0 {
        return 0.0;
    }
    if s1.contains(s2) || s2.contains(s1) {
        return 0.8;
    }
    0.0
}

/// 辅助函数：通过 XPath 查找元素 Bounds
fn find_element_bounds_by_xpath(xml_content: &str, xpath: &str) -> Option<String> {
    if let Ok(indexer) = XmlIndexer::build_from_xml(xml_content) {
        if let Some(node) = indexer.all_nodes.iter().find(|n| n.xpath == xpath) {
             return Some(format!("[{},{}][{},{}]", 
                node.bounds.0, node.bounds.1, node.bounds.2, node.bounds.3));
        }
    }
    None
}

/// 辅助函数：执行回退分析策略
async fn perform_fallback_analysis(
    request: &IntelligentAnalysisRequest,
    ui_elements: &[UIElement],
) -> Result<IntelligentAnalysisResult> {
    tracing::warn!("⚠️ 执行回退分析策略");
    Ok(IntelligentAnalysisResult {
        analysis_id: request.analysis_id.clone(),
        success: false,
        candidates: vec![],
        analysis_time_ms: 0,
        step_details: vec![],
        recommendations: vec!["建议手动重新选择元素".to_string()],
        metadata: AnalysisMetadata {
            xml_hash: String::new(),
            xml_element_count: ui_elements.len(),
            device_info: request.device_id.clone(),
            analysis_timestamp: chrono::Utc::now().to_rfc3339(),
            engine_version: "fallback".to_string(),
        },
    })
}