// src-tauri/src/services/smart_selection_engine.rs
// module: services | layer: application | role: 智能选择引擎核心实现
// summary: 实现智能选择系统的核心算法，包括指纹匹配、策略执行等

use std::time::{Duration, Instant};
use anyhow::{Result, anyhow};
use tracing::{info, debug, warn, error};
use crate::types::smart_selection::*;
use crate::services::ui_reader_service::{get_ui_dump, UIElement};
use crate::infra::adb::input_helper::tap_injector_first;

/// 简化的边界坐标结构
#[derive(Debug, Clone)]
pub struct ElementBounds {
    pub left: i32,
    pub top: i32,
    pub right: i32,
    pub bottom: i32,
}

impl ElementBounds {
    /// 从字符串解析边界坐标 "[left,top][right,bottom]"
    pub fn from_bounds_string(bounds_str: &str) -> Option<Self> {
        // 解析格式: "[0,0][1080,1920]"
        if let Some(coords) = Self::parse_coordinates(bounds_str) {
            Some(Self {
                left: coords[0],
                top: coords[1],
                right: coords[2],
                bottom: coords[3],
            })
        } else {
            None
        }
    }
    
    fn parse_coordinates(bounds_str: &str) -> Option<[i32; 4]> {
        // 使用正则表达式或简单字符串解析
        let clean = bounds_str.replace("[", "").replace("]", "");
        let parts: Vec<&str> = clean.split(',').collect();
        
        if parts.len() >= 4 {
            if let (Ok(left), Ok(top), Ok(right), Ok(bottom)) = (
                parts[0].parse::<i32>(),
                parts[1].parse::<i32>(),
                parts[2].parse::<i32>(),
                parts[3].parse::<i32>(),
            ) {
                return Some([left, top, right, bottom]);
            }
        }
        
        None
    }
}

/// 智能选择引擎
pub struct SmartSelectionEngine;

impl SmartSelectionEngine {
    /// 执行智能选择
    pub async fn execute_smart_selection(
        device_id: &str,
        protocol: &SmartSelectionProtocol,
    ) -> Result<SmartSelectionResult> {
        let start_time = Instant::now();
        let mut debug_logs = Vec::new();
        
        info!("🎯 开始智能选择执行，设备: {}", device_id);
        debug_logs.push(format!("开始智能选择，模式: {:?}", protocol.selection.mode));
        
        // 1. 获取当前UI状态
        let ui_xml = get_ui_dump(device_id).await
            .map_err(|e| anyhow!("获取UI dump失败: {}", e))?;
        
        // 2. 解析XML并构建候选元素
        let candidates = Self::parse_xml_and_find_candidates(&ui_xml, protocol)?;
        debug_logs.push(format!("找到 {} 个候选元素", candidates.len()));
        
        if candidates.is_empty() {
            return Ok(SmartSelectionResult {
                success: false,
                message: "未找到匹配的候选元素".to_string(),
                matched_elements: MatchedElementsInfo {
                    total_found: 0,
                    filtered_count: 0,
                    selected_count: 0,
                    confidence_scores: Vec::new(),
                },
                execution_info: None,
                debug_info: Some(DebugInfo {
                    candidate_analysis: debug_logs,
                    strategy_attempts: Vec::new(),
                    error_details: Some("无候选元素".to_string()),
                }),
            });
        }
        
        // 3. 根据选择模式执行策略
        let selected_elements = match &protocol.selection.mode {
            SelectionMode::MatchOriginal { min_confidence, fallback_to_first } => {
                Self::execute_match_original_strategy(&candidates, &protocol.anchor.fingerprint, &mut debug_logs)?
            }
            SelectionMode::First => {
                Self::execute_positional_strategy(&candidates, 0, &mut debug_logs)?
            }
            SelectionMode::Last => {
                let last_index = candidates.len().saturating_sub(1);
                Self::execute_positional_strategy(&candidates, last_index, &mut debug_logs)?
            }
            SelectionMode::Random { seed, ensure_stable_sort } => {
                Self::execute_random_strategy(&candidates, Some(*seed), &mut debug_logs)?
            }
            SelectionMode::All { batch_config } => {
                // 🔧 处理可选的batch_config，提供默认值
                debug_logs.push(format!("批量模式，配置: {:?}", batch_config));
                Self::execute_batch_strategy(&candidates, &mut debug_logs)?
            }
        };
        
        // 4. 执行点击操作
        let execution_result = Self::execute_clicks(device_id, &selected_elements, &protocol.selection).await?;
        
        let total_time = start_time.elapsed();
        debug_logs.push(format!("总执行时间: {}ms", total_time.as_millis()));
        
        Ok(SmartSelectionResult {
            success: execution_result.success,
            message: if execution_result.success {
                format!("成功执行 {} 次点击", execution_result.successful_clicks)
            } else {
                "执行失败".to_string()
            },
            matched_elements: MatchedElementsInfo {
                total_found: candidates.len() as u32,
                filtered_count: candidates.len() as u32, // 简化实现
                selected_count: selected_elements.len() as u32,
                confidence_scores: selected_elements.iter().map(|e| e.confidence).collect(),
            },
            execution_info: Some(ExecutionInfo {
                used_strategy: StrategyVariant::RegionTextToParent, // 简化实现
                fallback_used: false,
                execution_time_ms: total_time.as_millis() as u64,
                click_coordinates: Some(execution_result.click_results.iter()
                    .map(|r| r.coordinates.clone())
                    .collect()),
            }),
            debug_info: Some(DebugInfo {
                candidate_analysis: debug_logs,
                strategy_attempts: Vec::new(),
                error_details: None,
            }),
        })
    }
    
    /// 解析XML并找到候选元素
    pub fn parse_xml_and_find_candidates(
        xml_content: &str,
        protocol: &SmartSelectionProtocol,
    ) -> Result<Vec<CandidateElement>> {
        let mut candidates = Vec::new();
        
        // 简化的XML解析 - 在实际实现中应该使用更完善的XML解析器
        let ui_elements = Self::parse_ui_elements(xml_content)?;
        
        // 应用容器限制
        let search_elements = if let Some(container_xpath) = &protocol.matching_context
            .as_ref()
            .and_then(|ctx| ctx.container_xpath.as_ref()) {
            Self::filter_by_container(&ui_elements, container_xpath)?
        } else {
            ui_elements
        };
        
        // 应用文本过滤并构建候选元素
        for element in search_elements {
            if Self::matches_text_criteria(&element, protocol) {
                let confidence = Self::calculate_element_confidence(&element, &protocol.anchor.fingerprint);
                candidates.push(CandidateElement {
                    element,
                    confidence,
                    fingerprint_match: None, // 将在后续填充
                });
            }
        }
        
        // 按视觉位置排序（Y轴优先，然后X轴）
        candidates.sort_by(|a, b| {
            let a_bounds = a.element.bounds.as_ref()
                .and_then(|b| ElementBounds::from_bounds_string(b));
            let b_bounds = b.element.bounds.as_ref()
                .and_then(|b| ElementBounds::from_bounds_string(b));
            
            match (a_bounds, b_bounds) {
                (Some(a_bounds), Some(b_bounds)) => {
                    let a_y = (a_bounds.top + a_bounds.bottom) / 2;
                    let b_y = (b_bounds.top + b_bounds.bottom) / 2;
                    let a_x = (a_bounds.left + a_bounds.right) / 2;
                    let b_x = (b_bounds.left + b_bounds.right) / 2;
                    
                    a_y.cmp(&b_y).then(a_x.cmp(&b_x))
                }
                (Some(_), None) => std::cmp::Ordering::Less,
                (None, Some(_)) => std::cmp::Ordering::Greater,
                (None, None) => std::cmp::Ordering::Equal,
            }
        });
        
        Ok(candidates)
    }
    
    /// match-original策略执行
    fn execute_match_original_strategy(
        candidates: &[CandidateElement],
        target_fingerprint: &ElementFingerprint,
        debug_logs: &mut Vec<String>,
    ) -> Result<Vec<CandidateElement>> {
        debug_logs.push("执行match-original策略".to_string());
        
        let mut best_match: Option<CandidateElement> = None;
        let mut best_similarity = 0.0f32;
        
        for candidate in candidates {
            let similarity = Self::calculate_fingerprint_similarity(&candidate.element, target_fingerprint);
            
            debug_logs.push(format!(
                "候选元素相似度: {:.2}, 文本: {:?}",
                similarity,
                candidate.element.text
            ));
            
            if similarity > best_similarity {
                best_similarity = similarity;
                best_match = Some(candidate.clone());
            }
        }
        
        if let Some(match_result) = best_match {
            if best_similarity >= 0.7 { // 最低置信度阈值
                debug_logs.push(format!("找到最佳匹配，相似度: {:.2}", best_similarity));
                Ok(vec![match_result])
            } else {
                debug_logs.push(format!("最佳匹配相似度过低: {:.2}", best_similarity));
                Err(anyhow!("未找到足够相似的元素"))
            }
        } else {
            Err(anyhow!("未找到任何匹配的元素"))
        }
    }
    
    /// 位置策略执行（first/last）
    fn execute_positional_strategy(
        candidates: &[CandidateElement],
        index: usize,
        debug_logs: &mut Vec<String>,
    ) -> Result<Vec<CandidateElement>> {
        debug_logs.push(format!("执行位置策略，索引: {}", index));
        
        if index < candidates.len() {
            Ok(vec![candidates[index].clone()])
        } else {
            Err(anyhow!("索引超出范围: {}", index))
        }
    }
    
    /// 随机策略执行
    fn execute_random_strategy(
        candidates: &[CandidateElement],
        seed: Option<u64>,
        debug_logs: &mut Vec<String>,
    ) -> Result<Vec<CandidateElement>> {
        debug_logs.push(format!("执行随机策略，种子: {:?}", seed));
        
        if candidates.is_empty() {
            return Err(anyhow!("无候选元素可随机选择"));
        }
        
        // 简单的伪随机实现
        let index = if let Some(seed_val) = seed {
            (seed_val as usize) % candidates.len()
        } else {
            use std::collections::hash_map::DefaultHasher;
            use std::hash::{Hash, Hasher};
            
            let mut hasher = DefaultHasher::new();
            std::time::SystemTime::now().hash(&mut hasher);
            (hasher.finish() as usize) % candidates.len()
        };
        
        debug_logs.push(format!("随机选择索引: {}", index));
        Ok(vec![candidates[index].clone()])
    }
    
    /// 批量策略执行
    fn execute_batch_strategy(
        candidates: &[CandidateElement],
        debug_logs: &mut Vec<String>,
    ) -> Result<Vec<CandidateElement>> {
        debug_logs.push(format!("执行批量策略，目标数量: {}", candidates.len()));
        Ok(candidates.to_vec())
    }
    
    /// 执行点击操作
    async fn execute_clicks(
        device_id: &str,
        elements: &[CandidateElement],
        selection_config: &SelectionConfig,
    ) -> Result<BatchExecutionResult> {
        let mut click_results = Vec::new();
        let start_time = Instant::now();
        
        for (index, element) in elements.iter().enumerate() {
            let click_start = Instant::now();
            
            // 计算点击坐标（元素中心点）
            let (x, y) = if let Some(bounds_str) = &element.element.bounds {
                if let Some(bounds) = ElementBounds::from_bounds_string(bounds_str) {
                    ((bounds.left + bounds.right) / 2, (bounds.top + bounds.bottom) / 2)
                } else {
                    warn!("无法解析元素边界坐标: {}", bounds_str);
                    (100, 100) // 默认坐标
                }
            } else {
                warn!("元素缺少边界坐标信息");
                (100, 100) // 默认坐标
            };
            
            // 执行点击
            let click_success = match tap_injector_first(
                &crate::utils::adb_utils::get_adb_path(),
                device_id, 
                x, 
                y, 
                None
            ).await {
                Ok(_) => {
                    info!("✅ 成功点击元素 {}: ({}, {})", index, x, y);
                    true
                }
                Err(e) => {
                    warn!("❌ 点击元素 {} 失败: {}", index, e);
                    false
                }
            };
            
            let click_time = click_start.elapsed();
            click_results.push(ClickResult {
                index: index as u32,
                success: click_success,
                coordinates: ClickCoordinate { x, y },
                error_message: if click_success { None } else { Some(format!("点击失败")) },
                time_ms: click_time.as_millis() as u64,
            });
            
            // 如果不是最后一个元素，等待间隔时间
            if index < elements.len() - 1 {
                // 🔧 提供默认的批量配置
                let default_interval = Duration::from_millis(2000); // 默认2秒间隔
                let default_jitter = Duration::from_millis(500);    // 默认500ms抖动
                
                if let Some(batch_config) = &selection_config.batch_config {
                    let interval = Duration::from_millis(batch_config.interval_ms);
                    let jitter = if let Some(jitter_ms) = batch_config.jitter_ms {
                        Duration::from_millis(jitter_ms / 2)
                    } else {
                        Duration::from_millis(0)
                    };
                    tokio::time::sleep(interval + jitter).await;
                } else {
                    // 没有配置时使用默认值
                    tokio::time::sleep(default_interval + default_jitter).await;
                }
            }
            
            // 检查是否需要在错误时停止
            if !click_success {
                let continue_on_error = if let Some(batch_config) = &selection_config.batch_config {
                    batch_config.continue_on_error
                } else {
                    true // 默认遇错继续
                };
                
                if !continue_on_error {
                    break;
                }
            }
        }
        
        let successful_clicks = click_results.iter().filter(|r| r.success).count() as u32;
        let failed_clicks = click_results.iter().filter(|r| !r.success).count() as u32;
        
        Ok(BatchExecutionResult {
            total_targets: elements.len() as u32,
            successful_clicks,
            failed_clicks,
            skipped_clicks: 0,
            total_time_ms: start_time.elapsed().as_millis() as u64,
            success: failed_clicks == 0,  // 新增字段：只有全部成功才算成功
            click_results,
            progress_logs: Vec::new(),
        })
    }
    
    /// 解析UI元素（集成现有XML解析逻辑）
    fn parse_ui_elements(xml_content: &str) -> Result<Vec<UIElement>> {
        // 调用现有的XML解析服务
        use crate::services::ui_reader_service::parse_ui_elements;
        
        match parse_ui_elements(xml_content) {
            Ok(elements) => Ok(elements),
            Err(e) => {
                warn!("XML解析失败: {}, 返回空列表", e);
                Ok(Vec::new())
            }
        }
    }
    
    /// 容器过滤
    fn filter_by_container(elements: &[UIElement], container_xpath: &str) -> Result<Vec<UIElement>> {
        // 简化实现 - 实际应该根据XPath过滤
        Ok(elements.to_vec())
    }
    
    /// 文本条件匹配
    fn matches_text_criteria(element: &UIElement, protocol: &SmartSelectionProtocol) -> bool {
        // 检查多语言别名
        if let Some(context) = &protocol.matching_context {
            if let Some(aliases) = &context.i18n_aliases {
                if let Some(element_text) = &element.text {
                    return aliases.iter().any(|alias| element_text.contains(alias));
                }
            }
        }
        
        // 简化实现 - 实际应该更复杂的文本匹配
        true
    }
    
    /// 计算元素置信度
    fn calculate_element_confidence(element: &UIElement, fingerprint: &ElementFingerprint) -> f32 {
        let mut confidence = 0.5f32;
        
        // 文本匹配
        if let (Some(element_text), Some(target_text)) = (&element.text, &fingerprint.text_content) {
            if element_text == target_text {
                confidence += 0.3;
            }
        }
        
        // 资源ID匹配
        if let (Some(element_id), Some(target_id)) = (&element.resource_id, &fingerprint.resource_id) {
            if element_id == target_id {
                confidence += 0.2;
            }
        }
        
        confidence.min(1.0)
    }
    
    /// 计算指纹相似度
    fn calculate_fingerprint_similarity(element: &UIElement, target_fingerprint: &ElementFingerprint) -> f32 {
        let mut similarity = 0.0f32;
        let mut weight_sum = 0.0f32;
        
        // 文本相似度 (权重: 0.4)
        if let (Some(element_text), Some(target_text)) = (&element.text, &target_fingerprint.text_content) {
            let text_sim = if element_text == target_text { 1.0 } else { 0.0 };
            similarity += text_sim * 0.4;
            weight_sum += 0.4;
        }
        
        // 资源ID相似度 (权重: 0.3)
        if let (Some(element_id), Some(target_id)) = (&element.resource_id, &target_fingerprint.resource_id) {
            let id_sim = if element_id == target_id { 1.0 } else { 0.0 };
            similarity += id_sim * 0.3;
            weight_sum += 0.3;
        }
        
        // 类名相似度 (权重: 0.2)
        if let (Some(element_class), Some(target_chain)) = (&element.class, &target_fingerprint.class_chain) {
            if !target_chain.is_empty() && target_chain.contains(element_class) {
                similarity += 0.2;
                weight_sum += 0.2;
            }
        }
        
        // 位置相似度 (权重: 0.1)
        if let Some(target_bounds) = &target_fingerprint.bounds_signature {
            // 简化的位置比较
            similarity += 0.1;
            weight_sum += 0.1;
        }
        
        if weight_sum > 0.0 {
            similarity / weight_sum
        } else {
            0.0
        }
    }
}

/// 候选元素结构
#[derive(Debug, Clone)]
pub struct CandidateElement {
    pub element: UIElement,
    pub confidence: f32,
    pub fingerprint_match: Option<FingerprintMatchResult>,
}

/// 批量执行成功性
#[derive(Debug)]
struct BatchExecutionSuccess {
    success: bool,
    successful_clicks: u32,
    click_results: Vec<ClickResult>,
}