// src-tauri/src/services/legacy_simple_selection_engine.rs
// module: services | layer: application | role: ⚠️ 【已弃用】简化选择引擎（不包含Step 0-6智能策略分析）
// summary: ❌ 此引擎绕过了完整的智能策略分析，仅用于向后兼容，新功能禁止使用
//
// 🚨 重要警告：
// ❌ 此文件是简化版选择引擎，NOT Step 0-6 智能策略分析系统
// ❌ 不要在新功能中使用 execute_smart_selection 命令
// ✅ 新功能应使用 V3 智能自动链：execute_chain_test_v3
// ✅ V3 路径包含完整 Step 0-6 策略分析：
//    - src-tauri/src/exec/v3/chain_engine.rs (V3智能自动链)
//    - src-tauri/src/engine/strategy_engine.rs (Step 0-6策略分析)
//    - src-tauri/src/engine/strategy_plugin.rs (策略执行器)
//
// 📋 迁移路径：
// 旧: execute_smart_selection → legacy_simple_selection_engine.rs
// 新: execute_chain_test_v3 → v3/chain_engine.rs → strategy_engine.rs → Step 0-6
//
// 🗑️ 此文件将在 V3 完全稳定后移除

use crate::infra::adb::input_helper::tap_injector_first;
use crate::services::ui_reader_service::{get_ui_dump, UIElement};
use crate::types::smart_selection::*;
use anyhow::{anyhow, Result};
use std::time::{Duration, Instant};
use tracing::{debug, info, warn};

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
        // 解析格式: "[left,top][right,bottom]" 例如 "[0,0][1080,2400]"
        if bounds_str.contains("][") {
            // 分割两个坐标对
            let parts: Vec<&str> = bounds_str.split("][").collect();
            if parts.len() == 2 {
                let left_part = parts[0].trim_start_matches('[');
                let right_part = parts[1].trim_end_matches(']');

                let left_coords: Vec<&str> = left_part.split(',').collect();
                let right_coords: Vec<&str> = right_part.split(',').collect();

                if left_coords.len() == 2 && right_coords.len() == 2 {
                    if let (Ok(left), Ok(top), Ok(right), Ok(bottom)) = (
                        left_coords[0].parse::<i32>(),
                        left_coords[1].parse::<i32>(),
                        right_coords[0].parse::<i32>(),
                        right_coords[1].parse::<i32>(),
                    ) {
                        return Some([left, top, right, bottom]);
                    }
                }
            }
        } else {
            // 备用解析：尝试解析 "[left,top,right,bottom]" 格式
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
        let ui_xml = get_ui_dump(device_id)
            .await
            .map_err(|e| anyhow!("获取UI dump失败: {}", e))?;

        // 调用新的带UI dump参数的方法
        Self::execute_smart_selection_with_ui_dump(device_id, protocol, &ui_xml).await
    }

    /// 🆕 V3引擎专用：仅分析获取坐标，不执行点击
    /// 解决重复执行问题：提供坐标信息给V3引擎，避免重复点击
    pub async fn analyze_for_coordinates_only(
        _device_id: &str,
        protocol: &SmartSelectionProtocol,
        ui_xml: &str,
    ) -> Result<SmartSelectionAnalysisResult> {
        let start_time = std::time::Instant::now();
        
        info!("🔍 V3引擎坐标分析开始");
        
        // 🔥 关键修复：使用完整的智能匹配逻辑，确保与评分系统一致
        let candidates = Self::parse_xml_and_find_candidates(ui_xml, protocol)?;
        
        if candidates.is_empty() {
            return Ok(SmartSelectionAnalysisResult {
                success: false,
                message: format!("未找到匹配目标 '{}' 的元素", 
                    protocol.anchor.fingerprint.text_content.as_deref()
                        .or(protocol.anchor.fingerprint.content_desc.as_deref())
                        .unwrap_or("未知目标")),
                selected_coordinates: Vec::new(),
                matched_elements: MatchedElementsInfo {
                    total_found: 0,
                    filtered_count: 0,
                    selected_count: 0,
                    confidence_scores: Vec::new(),
                },
                debug_info: Some(DebugInfo {
                    candidate_analysis: vec!["使用完整匹配逻辑，但未找到候选元素".to_string()],
                    strategy_attempts: Vec::new(),
                    error_details: Some("无匹配元素".to_string()),
                }),
                analysis_time_ms: start_time.elapsed().as_millis() as u64,
            });
        }

        // 🔥 使用与评分系统一致的候选元素，已经过完整排序
        // candidates 现在已经包含了智能排序的结果（可点击优先、面积小的优先等）

        // 🎯 根据选择模式选取元素
        let selected_elements: Vec<&UIElement> = match &protocol.selection.mode {
            SelectionMode::First => {
                if let Some(first) = candidates.first() {
                    info!("🎯 第一个模式：选择最优元素 (clickable={}, 置信度={:.2})", 
                        first.element.clickable.unwrap_or(false), first.confidence);
                    vec![&first.element]
                } else {
                    vec![]
                }
            }
            SelectionMode::All { .. } => {
                info!("🔄 批量模式：返回所有 {} 个匹配元素的坐标", candidates.len());
                // 返回所有经过智能排序的候选元素
                let all_elements: Vec<&UIElement> = candidates
                    .iter()
                    .map(|candidate| &candidate.element)
                    .collect();
                info!("🔄 批量模式：包含 {} 个排序后的元素", all_elements.len());
                all_elements
            }
            _ => {
                // 其他模式默认选择最优元素
                if let Some(first) = candidates.first() {
                    info!("🎯 其他模式：选择最优元素 (clickable={}, 置信度={:.2})", 
                        first.element.clickable.unwrap_or(false), first.confidence);
                    vec![&first.element]
                } else {
                    vec![]
                }
            }
        };

        // 🔄 转换为V3需要的坐标信息
        let coordinates: Vec<CoordinateInfo> = selected_elements
            .iter()
            .enumerate()
            .filter_map(|(idx, elem)| {
                // 解析bounds字符串获取坐标 (格式: "[left,top][right,bottom]")
                if let Some(bounds_str) = &elem.bounds {
                    if let Some(bounds) = ElementBounds::from_bounds_string(bounds_str) {
                        let center_x = (bounds.left + bounds.right) / 2;
                        let center_y = (bounds.top + bounds.bottom) / 2;
                        info!("📍 坐标[{}]: ({}, {}) - clickable={}, text={:?}, desc={:?}", 
                            idx, center_x, center_y, elem.clickable.unwrap_or(false),
                            elem.text.as_deref().unwrap_or(""), elem.content_desc.as_deref().unwrap_or(""));
                        Some(CoordinateInfo {
                            x: center_x,
                            y: center_y,
                            confidence: 0.8,
                            xpath: None, // UIElement没有xpath字段
                            clickable: elem.clickable.unwrap_or(false), // 🆕 包含clickable信息
                        })
                    } else {
                        None
                    }
                } else {
                    None
                }
            })
            .collect();

        let total_time = start_time.elapsed();
        let target_text = protocol.anchor.fingerprint.text_content.as_deref().unwrap_or("");
        let target_desc = protocol.anchor.fingerprint.content_desc.as_deref().unwrap_or("");
        info!("✅ V3坐标分析完成，匹配目标 '{}' 或 '{}' 找到 {} 个坐标", target_text, target_desc, coordinates.len());

        Ok(SmartSelectionAnalysisResult {
            success: true,
            message: format!("坐标分析完成，匹配目标 '{}' 或 '{}' 提供 {} 个坐标", target_text, target_desc, coordinates.len()),
            selected_coordinates: coordinates,
            matched_elements: MatchedElementsInfo {
                total_found: candidates.len() as u32,
                filtered_count: candidates.len() as u32,
                selected_count: selected_elements.len() as u32,
                confidence_scores: candidates.iter().map(|c| c.confidence).collect(),
            },
            debug_info: Some(DebugInfo {
                candidate_analysis: vec![format!("V3智能匹配，目标文本: '{}', 目标描述: '{}', 模式: {:?}", target_text, target_desc, protocol.selection.mode)],
                strategy_attempts: Vec::new(),
                error_details: None,
            }),
            analysis_time_ms: total_time.as_millis() as u64,
        })
    }

    /// 🚀 优化版本：使用已获取的UI dump，避免重复获取
    pub async fn execute_smart_selection_with_ui_dump(
        device_id: &str,
        protocol: &SmartSelectionProtocol,
        ui_xml: &str,
    ) -> Result<SmartSelectionResult> {
        let start_time = Instant::now();
        let mut debug_logs = Vec::new();

        info!("🎯 开始智能选择执行（复用UI dump），设备: {}", device_id);
        debug_logs.push(format!("开始智能选择，模式: {:?}", protocol.selection.mode));

        // 2. 解析XML并构建候选元素
        let candidates = Self::parse_xml_and_find_candidates(ui_xml, protocol)?;
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
            SelectionMode::Auto {
                single_min_confidence,
                batch_config,
                fallback_to_first,
            } => {
                // 🎯 Auto模式：智能决策
                let candidate_count = candidates.len();
                debug_logs.push(format!("Auto模式检测到 {} 个候选元素", candidate_count));

                if candidate_count == 0 {
                    return Ok(SmartSelectionResult {
                        success: false,
                        message: "Auto模式：无候选元素".to_string(),
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
                } else if candidate_count == 1 {
                    // 单个候选 → 直接使用
                    debug_logs.push("Auto模式 → 单个策略（仅1个候选）".to_string());
                    Self::execute_positional_strategy(&candidates, 0, &mut debug_logs)?
                } else {
                    // 🔥 多个候选 → 检查是否配置了批量模式
                    let min_confidence = single_min_confidence.unwrap_or(0.85);

                    // 🆕 优化：区分精确匹配 vs 批量模式的优先级
                    if let Some(batch_config) = batch_config {
                        // 🎯 批量模式：强制返回所有候选，不进行单一匹配
                        debug_logs.push(format!(
                            "Auto模式 → 批量策略（batch_config配置，强制批量处理 {} 个候选）",
                            candidate_count
                        ));
                        Self::execute_batch_strategy(&candidates, &mut debug_logs)?
                    } else {
                        // 🎯 精确匹配模式：尝试找到最佳单一匹配
                        if let Some(best_match) = Self::find_high_confidence_match(
                            &candidates,
                            &protocol.anchor.fingerprint,
                            min_confidence,
                            &mut debug_logs,
                        ) {
                            debug_logs.push(format!(
                                "Auto模式 → 精确策略（高置信度匹配 {:.2} ≥ {:.2}）",
                                best_match.confidence, min_confidence
                            ));
                            vec![best_match]
                        } else {
                            // 无高置信度匹配 → 回退到第一个
                            debug_logs
                                .push(format!("Auto模式 → 回退策略（无高置信度匹配，选择第一个）"));
                            Self::execute_positional_strategy(&candidates, 0, &mut debug_logs)?
                        }
                    }
                }
            }
            SelectionMode::MatchOriginal {
                min_confidence,
                fallback_to_first,
            } => Self::execute_match_original_strategy(
                &candidates,
                &protocol.anchor.fingerprint,
                &mut debug_logs,
            )?,
            SelectionMode::First => {
                Self::execute_positional_strategy(&candidates, 0, &mut debug_logs)?
            }
            SelectionMode::Last => {
                let last_index = candidates.len().saturating_sub(1);
                Self::execute_positional_strategy(&candidates, last_index, &mut debug_logs)?
            }
            SelectionMode::Random {
                seed,
                ensure_stable_sort,
            } => Self::execute_random_strategy(&candidates, Some(*seed), &mut debug_logs)?,
            SelectionMode::All { batch_config } => {
                // 🔧 处理可选的batch_config，提供默认值
                debug_logs.push(format!("批量模式，配置: {:?}", batch_config));
                Self::execute_batch_strategy(&candidates, &mut debug_logs)?
            }
        };

        // 4. 执行点击操作
        let execution_result =
            Self::execute_clicks(device_id, &selected_elements, &protocol.selection).await?;

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
                click_coordinates: Some(
                    execution_result
                        .click_results
                        .iter()
                        .map(|r| r.coordinates.clone())
                        .collect(),
                ),
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
    ) -> Result<Vec<LegacyCandidateElement>> {
        let mut candidates = Vec::new();

        // 简化的XML解析 - 在实际实现中应该使用更完善的XML解析器
        let ui_elements = Self::parse_ui_elements(xml_content)?;

        // 应用容器限制
        let search_elements = if let Some(container_xpath) = &protocol
            .matching_context
            .as_ref()
            .and_then(|ctx| ctx.container_xpath.as_ref())
        {
            Self::filter_by_container(&ui_elements, container_xpath)?
        } else {
            ui_elements
        };

        // 应用文本过滤并构建候选元素
        for element in search_elements {
            if Self::matches_text_criteria(&element, protocol) {
                // 🔥 应用排除层过滤
                let should_be_excluded = Self::should_exclude(&element, protocol);
                
                // 🔍 调试：检查负面积元素是否被排除
                if let Some(bounds_str) = &element.bounds {
                    if let Some(bounds) = ElementBounds::from_bounds_string(bounds_str) {
                        let width = bounds.right - bounds.left;
                        let height = bounds.bottom - bounds.top;
                        if width <= 0 || height <= 0 {
                            info!("🔍 [负面积检查] 发现负面积元素: bounds_str='{}', width={}, height={}, 是否被排除={}", 
                                bounds_str, width, height, should_be_excluded);
                        }
                    }
                }
                
                if should_be_excluded {
                    continue;
                }

                let confidence =
                    Self::calculate_element_confidence(&element, &protocol.anchor.fingerprint);
                candidates.push(LegacyCandidateElement {
                    element,
                    confidence,
                    fingerprint_match: None, // 将在后续填充
                });
            }
        }

        // 🔥 应用去重逻辑
        let mut candidates = Self::deduplicate_candidates(candidates, 10); // 10px 容差

        // 🔍 排序前调试：显示所有候选元素信息
        info!("🔍 [调试] 排序前候选元素详情:");
        for (i, candidate) in candidates.iter().enumerate() {
            let bounds_info = if let Some(bounds_str) = &candidate.element.bounds {
                if let Some(bounds) = ElementBounds::from_bounds_string(bounds_str) {
                    // 🔧 修复：确保面积计算正确处理异常边界
                    let width = (bounds.right - bounds.left).abs();
                    let height = (bounds.bottom - bounds.top).abs();
                    let area = width * height;
                    let center_x = (bounds.left + bounds.right) / 2;
                    let center_y = (bounds.top + bounds.bottom) / 2;
                    
                    // 🚨 检测并标记异常边界
                    let boundary_status = if (bounds.right - bounds.left) <= 0 || (bounds.bottom - bounds.top) <= 0 {
                        " [异常边界!]"
                    } else {
                        ""
                    };
                    
                    format!("bounds=[{},{},{},{}], area={}, center=({},{}){}", 
                        bounds.left, bounds.top, bounds.right, bounds.bottom, area, center_x, center_y, boundary_status)
                } else {
                    format!("bounds='{}' (解析失败)", bounds_str)
                }
            } else {
                "bounds=None".to_string()
            };
            
            let text = candidate.element.text.as_deref().unwrap_or("");
            let desc = candidate.element.content_desc.as_deref().unwrap_or("");
            let clickable = candidate.element.clickable.unwrap_or(false);
            
            info!("🔍   候选[{}]: text='{}', desc='{}', clickable={}, confidence={:.3}, {}", 
                i, text, desc, clickable, candidate.confidence, bounds_info);
        }

        // 智能排序：优先考虑可点击性、文本匹配度和元素质量，而不是简单的Y坐标
        candidates.sort_by(|a, b| {
            // 1. 优先选择可点击的元素
            let a_clickable = a.element.clickable.unwrap_or(false);
            let b_clickable = b.element.clickable.unwrap_or(false);
            if a_clickable != b_clickable {
                return b_clickable.cmp(&a_clickable);
            }

            // 2. 优先选择有文本或content-desc的元素（避免选择SVG图标等装饰元素）
            let a_has_text = !a.element.text.as_ref().unwrap_or(&String::new()).trim().is_empty() 
                || !a.element.content_desc.as_ref().unwrap_or(&String::new()).trim().is_empty();
            let b_has_text = !b.element.text.as_ref().unwrap_or(&String::new()).trim().is_empty() 
                || !b.element.content_desc.as_ref().unwrap_or(&String::new()).trim().is_empty();
            if a_has_text != b_has_text {
                return b_has_text.cmp(&a_has_text);
            }

            // 3. 优先选择置信度高的元素
            let confidence_cmp = b.confidence.partial_cmp(&a.confidence).unwrap_or(std::cmp::Ordering::Equal);
            if confidence_cmp != std::cmp::Ordering::Equal {
                return confidence_cmp;
            }

            // 4. 优先选择更具体的元素（面积更小）而不是大容器，避免选择整个用户条目容器
            let a_bounds = a.element.bounds.as_ref().and_then(|b| ElementBounds::from_bounds_string(b));
            let b_bounds = b.element.bounds.as_ref().and_then(|b| ElementBounds::from_bounds_string(b));
            match (a_bounds, b_bounds) {
                (Some(a_bounds), Some(b_bounds)) => {
                    // 计算元素面积，优先选择面积更小的元素（更具体的按钮而不是大容器）
                    // 🔧 修复：确保面积计算为正值，处理边界异常情况
                    let a_width = (a_bounds.right - a_bounds.left).abs();
                    let a_height = (a_bounds.bottom - a_bounds.top).abs();
                    let a_area = a_width * a_height;
                    
                    let b_width = (b_bounds.right - b_bounds.left).abs();
                    let b_height = (b_bounds.bottom - b_bounds.top).abs(); 
                    let b_area = b_width * b_height;
                    
                    // 🚨 检测异常边界并报告
                    if (a_bounds.right - a_bounds.left) <= 0 || (a_bounds.bottom - a_bounds.top) <= 0 {
                        debug!("🚨 [异常边界] A: left={}, right={}, top={}, bottom={} -> width={}, height={}", 
                            a_bounds.left, a_bounds.right, a_bounds.top, a_bounds.bottom,
                            a_bounds.right - a_bounds.left, a_bounds.bottom - a_bounds.top);
                    }
                    if (b_bounds.right - b_bounds.left) <= 0 || (b_bounds.bottom - b_bounds.top) <= 0 {
                        debug!("🚨 [异常边界] B: left={}, right={}, top={}, bottom={} -> width={}, height={}", 
                            b_bounds.left, b_bounds.right, b_bounds.top, b_bounds.bottom,
                            b_bounds.right - b_bounds.left, b_bounds.bottom - b_bounds.top);
                    }
                    
                    // 🔍 调试：显示面积比较过程
                    let a_center_x = (a_bounds.left + a_bounds.right) / 2;
                    let b_center_x = (b_bounds.left + b_bounds.right) / 2;
                    let a_center_y = (a_bounds.top + a_bounds.bottom) / 2;
                    let b_center_y = (b_bounds.top + b_bounds.bottom) / 2;
                    
                    debug!("🔍 [排序比较] A: area={}, center=({},{}), B: area={}, center=({},{})", 
                        a_area, a_center_x, a_center_y, b_area, b_center_x, b_center_y);
                    
                    // 面积小的优先（具体按钮优先于容器）
                    let area_cmp = a_area.cmp(&b_area);
                    if area_cmp != std::cmp::Ordering::Equal {
                        debug!("🔍 [排序结果] 按面积排序: {:?}", area_cmp);
                        return area_cmp;
                    }
                    
                    // 如果面积相同，再考虑距离屏幕中心的距离
                    let screen_center_x = 540;
                    let a_distance_from_center = (a_center_x - screen_center_x).abs();
                    let b_distance_from_center = (b_center_x - screen_center_x).abs();
                    
                    let center_cmp = a_distance_from_center.cmp(&b_distance_from_center);
                    debug!("🔍 [排序结果] 按屏幕中心距离排序: {:?}", center_cmp);
                    center_cmp
                }
                (Some(_), None) => std::cmp::Ordering::Less,
                (None, Some(_)) => std::cmp::Ordering::Greater,
                (None, None) => std::cmp::Ordering::Equal,
            }
        });

        // 🔍 排序后调试：显示最终排序结果
        info!("🔍 [调试] 排序后候选元素顺序:");
        for (i, candidate) in candidates.iter().take(5).enumerate() { // 只显示前5个
            let bounds_info = if let Some(bounds_str) = &candidate.element.bounds {
                if let Some(bounds) = ElementBounds::from_bounds_string(bounds_str) {
                    let area = (bounds.right - bounds.left) * (bounds.bottom - bounds.top);
                    let center_x = (bounds.left + bounds.right) / 2;
                    let center_y = (bounds.top + bounds.bottom) / 2;
                    format!("area={}, center=({},{})", area, center_x, center_y)
                } else {
                    "bounds解析失败".to_string()
                }
            } else {
                "无bounds".to_string()
            };
            
            let text = candidate.element.text.as_deref().unwrap_or("");
            let desc = candidate.element.content_desc.as_deref().unwrap_or("");
            let clickable = candidate.element.clickable.unwrap_or(false);
            
            info!("🔍   排序后[{}]: text='{}', desc='{}', clickable={}, confidence={:.3}, {}", 
                i, text, desc, clickable, candidate.confidence, bounds_info);
        }

        Ok(candidates)
    }

    /// match-original策略执行
    fn execute_match_original_strategy(
        candidates: &[LegacyCandidateElement],
        target_fingerprint: &ElementFingerprint,
        debug_logs: &mut Vec<String>,
    ) -> Result<Vec<LegacyCandidateElement>> {
        debug_logs.push("执行match-original策略".to_string());

        let mut best_match: Option<LegacyCandidateElement> = None;
        let mut best_similarity = 0.0f32;

        for candidate in candidates {
            let similarity =
                Self::calculate_fingerprint_similarity(&candidate.element, target_fingerprint);

            debug_logs.push(format!(
                "候选元素相似度: {:.2}, 文本: {:?}",
                similarity, candidate.element.text
            ));

            if similarity > best_similarity {
                best_similarity = similarity;
                best_match = Some(candidate.clone());
            }
        }

        if let Some(match_result) = best_match {
            if best_similarity >= 0.7 {
                // 最低置信度阈值
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
        candidates: &[LegacyCandidateElement],
        index: usize,
        debug_logs: &mut Vec<String>,
    ) -> Result<Vec<LegacyCandidateElement>> {
        debug_logs.push(format!("执行位置策略，索引: {}", index));

        if index < candidates.len() {
            Ok(vec![candidates[index].clone()])
        } else {
            Err(anyhow!("索引超出范围: {}", index))
        }
    }

    /// 随机策略执行
    fn execute_random_strategy(
        candidates: &[LegacyCandidateElement],
        seed: Option<u64>,
        debug_logs: &mut Vec<String>,
    ) -> Result<Vec<LegacyCandidateElement>> {
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

    /// 🆕 批量策略执行 - 支持智能过滤
    fn execute_batch_strategy(
        candidates: &[LegacyCandidateElement],
        debug_logs: &mut Vec<String>,
    ) -> Result<Vec<LegacyCandidateElement>> {
        debug_logs.push(format!("执行批量策略，原始候选数: {}", candidates.len()));

        // 🎯 智能过滤：基于精确匹配原则，不进行任何模糊匹配
        // 在批量模式下，我们不应该过滤掉任何元素，而应该精确匹配用户选择的元素类型

        debug_logs.push(format!(
            "批量策略：保持所有候选元素，不进行智能过滤 (精确匹配原则)"
        ));

        // 返回所有候选，让XPath生成器负责精确匹配
        let filtered_candidates = candidates.to_vec();

        debug_logs.push(format!(
            "批量过滤完成：{} → {} 个有效候选",
            candidates.len(),
            filtered_candidates.len()
        ));

        Ok(filtered_candidates)
    }

    /// 🔥 在多个候选中查找高置信度匹配
    /// 🆕 新增精确文本匹配优先级，避免"已关注"被识别为"关注"
    fn find_high_confidence_match(
        candidates: &[LegacyCandidateElement],
        target_fingerprint: &ElementFingerprint,
        min_confidence: f32,
        debug_logs: &mut Vec<String>,
    ) -> Option<LegacyCandidateElement> {
        let mut best_match: Option<LegacyCandidateElement> = None;
        let mut best_similarity = 0.0f32;

        // 🎯 步骤1：严格精确匹配（文本 + content-desc + resource-id）

        // 1.1 精确文本匹配
        if let Some(target_text) = &target_fingerprint.text_content {
            for candidate in candidates {
                if let Some(candidate_text) = &candidate.element.text {
                    // 严格相等匹配，区分大小写，去除首尾空格
                    if candidate_text.trim() == target_text.trim() {
                        debug_logs.push(format!(
                            "🎯 精确文本匹配成功: \"{}\" (跳过所有模糊匹配)",
                            target_text
                        ));
                        return Some(candidate.clone());
                    }
                }
            }
        }

        // 1.2 精确content-desc匹配
        if let Some(target_desc) = &target_fingerprint.content_desc {
            for candidate in candidates {
                if let Some(candidate_desc) = &candidate.element.content_desc {
                    if candidate_desc.trim() == target_desc.trim() {
                        debug_logs.push(format!(
                            "🎯 精确content-desc匹配成功: \"{}\" (跳过所有模糊匹配)",
                            target_desc
                        ));
                        return Some(candidate.clone());
                    }
                }
            }
        }

        // 1.3 精确resource-id匹配
        if let Some(target_resource_id) = &target_fingerprint.resource_id {
            for candidate in candidates {
                if let Some(candidate_resource_id) = &candidate.element.resource_id {
                    if candidate_resource_id == target_resource_id {
                        debug_logs.push(format!(
                            "🎯 精确resource-id匹配成功: \"{}\" (跳过所有模糊匹配)",
                            target_resource_id
                        ));
                        return Some(candidate.clone());
                    }
                }
            }
        }

        debug_logs.push(format!(
            "⚠️ 未找到任何精确匹配，继续模糊匹配 (text: {:?}, desc: {:?}, resource_id: {:?})",
            target_fingerprint.text_content,
            target_fingerprint.content_desc,
            target_fingerprint.resource_id
        ));

        // 🔍 步骤2：模糊相似度匹配
        for candidate in candidates {
            let similarity =
                Self::calculate_fingerprint_similarity(&candidate.element, target_fingerprint);

            debug_logs.push(format!(
                "  候选相似度: {:.2}, 文本: {:?}",
                similarity, candidate.element.text
            ));

            if similarity > best_similarity {
                best_similarity = similarity;
                best_match = Some(candidate.clone());
            }
        }

        if best_similarity >= min_confidence {
            debug_logs.push(format!(
                "✅ 找到高置信度匹配: {:.2} ≥ {:.2}",
                best_similarity, min_confidence
            ));
            best_match
        } else {
            debug_logs.push(format!(
                "⚠️ 最佳相似度 {:.2} < 最小要求 {:.2}",
                best_similarity, min_confidence
            ));
            None
        }
    }

    /// 执行点击操作
    async fn execute_clicks(
        device_id: &str,
        elements: &[LegacyCandidateElement],
        selection_config: &SelectionConfig,
    ) -> Result<BatchExecutionResult> {
        let mut click_results = Vec::new();
        let start_time = Instant::now();

        for (index, element) in elements.iter().enumerate() {
            let click_start = Instant::now();

            // 计算点击坐标（元素中心点）
            let (x, y) = if let Some(bounds_str) = &element.element.bounds {
                if let Some(bounds) = ElementBounds::from_bounds_string(bounds_str) {
                    (
                        (bounds.left + bounds.right) / 2,
                        (bounds.top + bounds.bottom) / 2,
                    )
                } else {
                    warn!("❌ 无法解析元素边界坐标: {}，跳过该元素", bounds_str);
                    // 🚫 不使用兜底坐标，跳过该元素
                    click_results.push(ClickResult {
                        index: index as u32,
                        success: false,
                        coordinates: ClickCoordinate { x: 0, y: 0 },
                        error_message: Some("无法解析坐标".to_string()),
                        time_ms: 0,
                    });
                    continue;
                }
            } else {
                warn!("❌ 元素缺少边界坐标信息，跳过该元素");
                // 🚫 不使用兜底坐标，跳过该元素
                click_results.push(ClickResult {
                    index: index as u32,
                    success: false,
                    coordinates: ClickCoordinate { x: 0, y: 0 },
                    error_message: Some("缺少坐标信息".to_string()),
                    time_ms: 0,
                });
                continue;
            };

            // 执行点击
            let tap_success = match tap_injector_first(
                &crate::utils::adb_utils::get_adb_path(),
                device_id,
                x,
                y,
                None,
            )
            .await
            {
                Ok(_) => {
                    info!("✅ 成功点击元素 {}: ({}, {})", index, x, y);
                    true
                }
                Err(e) => {
                    warn!("❌ 点击元素 {} 失败: {}", index, e);
                    false
                }
            };

            // 🔥 点击后轻校验
            let (click_success, error_msg) = if tap_success {
                match Self::verify_click_success(device_id, &element.element).await {
                    Ok(true) => {
                        info!("✅ 轻校验通过：元素 {} 状态已变化", index);
                        (true, None)
                    }
                    Ok(false) => {
                        warn!("⚠️ 轻校验失败：元素 {} 状态未变化", index);
                        (false, Some("轻校验失败：状态未变化".to_string()))
                    }
                    Err(e) => {
                        warn!("⚠️ 轻校验错误：{}", e);
                        // 校验失败时仍认为点击成功（容错）
                        (true, None)
                    }
                }
            } else {
                (false, Some("点击失败".to_string()))
            };

            let click_time = click_start.elapsed();
            click_results.push(ClickResult {
                index: index as u32,
                success: click_success,
                coordinates: ClickCoordinate { x, y },
                error_message: error_msg,
                time_ms: click_time.as_millis() as u64,
            });

            // 如果不是最后一个元素，等待间隔时间
            if index < elements.len() - 1 {
                // 🔧 提供默认的批量配置
                let default_interval = Duration::from_millis(2000); // 默认2秒间隔
                let default_jitter = Duration::from_millis(500); // 默认500ms抖动

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
            success: failed_clicks == 0, // 新增字段：只有全部成功才算成功
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
    fn filter_by_container(
        elements: &[UIElement],
        container_xpath: &str,
    ) -> Result<Vec<UIElement>> {
        // 简化实现 - 实际应该根据XPath过滤
        Ok(elements.to_vec())
    }

    /// 文本条件匹配
    fn matches_text_criteria(element: &UIElement, protocol: &SmartSelectionProtocol) -> bool {
        // 🎯 精确文本匹配：优先匹配目标文本
        if let Some(fingerprint) = &protocol.anchor.fingerprint.text_content {
            // 🚨 关键修复：防止空文本导致过度宽泛匹配
            let target_text = fingerprint.trim();
            if target_text.is_empty() {
                debug!("⚠️ 目标文本为空，回退到可点击元素匹配");
                return element.clickable.unwrap_or(false);
            }
            
            debug!("🎯 保留目标按钮：检查元素 text='{}', desc='{}' 是否匹配目标 '{}'", 
                element.text.as_deref().unwrap_or(""), 
                element.content_desc.as_deref().unwrap_or(""),
                target_text);
            
            // 🎯 完全保留原文匹配：不做任何文本处理，直接比较原文
            // 检查text属性（原文匹配）
            if let Some(element_text) = &element.text {
                if element_text == target_text {
                    debug!("🎯 保留目标按钮：文本原文 '{}' 完全匹配目标 '{}'", element_text, target_text);
                    return true;
                }
            }
            
            // 检查content-desc属性（原文匹配）  
            if let Some(element_desc) = &element.content_desc {
                if element_desc == target_text {
                    debug!("🎯 保留目标按钮：描述原文 '{}' 完全匹配目标 '{}'", element_desc, target_text);
                    return true;
                }
            }
            
            // 🔍 检查多语言别名
            if let Some(context) = &protocol.matching_context {
                if let Some(aliases) = &context.i18n_aliases {
                    if let Some(element_text) = &element.text {
                        for alias in aliases {
                            if element_text.contains(alias) {
                                debug!("🎯 保留目标按钮：文本 '{}' 包含别名 '{}'", element_text, alias);
                                return true;
                            }
                        }
                    }
                    if let Some(element_desc) = &element.content_desc {
                        for alias in aliases {
                            if element_desc.contains(alias) {
                                debug!("🎯 保留目标按钮：描述 '{}' 包含别名 '{}'", element_desc, alias);
                                return true;
                            }
                        }
                    }
                }
            }
            
            // ❌ 如果有目标文本但不匹配，则拒绝此元素
            debug!("❌ 排除不匹配元素：text='{}', desc='{}' 不匹配目标 '{}'", 
                element.text.as_deref().unwrap_or(""), 
                element.content_desc.as_deref().unwrap_or(""),
                fingerprint);
            return false;
        }

        // 🔍 检查多语言别名（当没有目标文本时）
        if let Some(context) = &protocol.matching_context {
            if let Some(aliases) = &context.i18n_aliases {
                if let Some(element_text) = &element.text {
                    return aliases.iter().any(|alias| element_text.contains(alias));
                }
                if let Some(element_desc) = &element.content_desc {
                    return aliases.iter().any(|alias| element_desc.contains(alias));
                }
            }
        }

        // ❌ 修复：如果没有任何目标文本或别名，拒绝匹配（避免大量噪音）
        debug!("❌ 拒绝无目标匹配：没有目标文本和别名的元素 text='{}', desc='{}' 被拒绝", 
            element.text.as_deref().unwrap_or(""), 
            element.content_desc.as_deref().unwrap_or(""));
        false
    }

    /// 计算元素置信度
    fn calculate_element_confidence(element: &UIElement, fingerprint: &ElementFingerprint) -> f32 {
        let mut confidence = 0.5f32;

        // 文本匹配
        if let (Some(element_text), Some(target_text)) = (&element.text, &fingerprint.text_content)
        {
            if element_text == target_text {
                confidence += 0.3;
            }
        }

        // 资源ID匹配
        if let (Some(element_id), Some(target_id)) =
            (&element.resource_id, &fingerprint.resource_id)
        {
            if element_id == target_id {
                confidence += 0.2;
            }
        }

        confidence.min(1.0)
    }

    /// 计算指纹相似度
    fn calculate_fingerprint_similarity(
        element: &UIElement,
        target_fingerprint: &ElementFingerprint,
    ) -> f32 {
        let mut similarity = 0.0f32;
        let mut weight_sum = 0.0f32;

        // 文本相似度 (权重: 0.4)
        if let (Some(element_text), Some(target_text)) =
            (&element.text, &target_fingerprint.text_content)
        {
            let text_sim = if element_text == target_text {
                1.0
            } else {
                0.0
            };
            similarity += text_sim * 0.4;
            weight_sum += 0.4;
        }

        // 资源ID相似度 (权重: 0.3)
        if let (Some(element_id), Some(target_id)) =
            (&element.resource_id, &target_fingerprint.resource_id)
        {
            let id_sim = if element_id == target_id { 1.0 } else { 0.0 };
            similarity += id_sim * 0.3;
            weight_sum += 0.3;
        }

        // 类名相似度 (权重: 0.2)
        if let (Some(element_class), Some(target_chain)) =
            (&element.class, &target_fingerprint.class_chain)
        {
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

    /// 🔥 排除层过滤：检查元素是否应该被排除
    fn should_exclude(element: &UIElement, protocol: &SmartSelectionProtocol) -> bool {
        // 🚨 首先排除异常边界的元素（负面积或无效尺寸）
        if let Some(bounds_str) = &element.bounds {
            if let Some(bounds) = ElementBounds::from_bounds_string(bounds_str) {
                let width = bounds.right - bounds.left;
                let height = bounds.bottom - bounds.top;
                let area = width * height;
                
                // 排除边界异常的元素（负宽度或负高度）
                if width <= 0 || height <= 0 {
                    info!("🚨 [异常边界排除] 成功排除负面积元素: bounds_str='{}', parsed=[{},{},{},{}], width={}, height={}, area={}, class='{}', text='{}'", 
                        bounds_str,
                        bounds.left, bounds.top, bounds.right, bounds.bottom, 
                        width, height, area,
                        element.class.as_deref().unwrap_or("N/A"),
                        element.text.as_deref().unwrap_or("N/A")
                    );
                    return true; // 排除此元素
                }
            }
        }

        // 🆕 获取自动排除开关（默认启用）
        let auto_exclude_enabled = protocol
            .matching_context
            .as_ref()
            .and_then(|ctx| ctx.light_assertions.as_ref())
            .and_then(|assertions| assertions.auto_exclude_enabled)
            .unwrap_or(true); // 默认开启

        // � 获取目标文本：用户明确选择的按钮文本
        let target_text = protocol.anchor.fingerprint.text_content.as_deref().unwrap_or("");

        // �🆕 内置自动排除别名库
        const AUTO_EXCLUDE_ALIASES: &[&str] = &[
            "已关注",
            "Following", 
            "Followed",
            "互相关注",
            "Mutual",
            "Follow Back",
            "已互关",
            "已赞",
            "Liked",
            "已收藏",
            "Favorited",
            "已分享",
            "Shared",
            "已完成",
            "Completed",
            "已处理",
            "Processed",
        ];

        // 🆕 智能排除逻辑：不排除用户明确选择的按钮类型
        if auto_exclude_enabled {
            if let Some(element_text) = &element.text {
                for alias in AUTO_EXCLUDE_ALIASES {
                    if element_text.contains(alias) {
                        // 🎯 关键修复：如果目标文本包含这个别名，说明用户就是要找这类按钮，不应该排除
                        if target_text.contains(alias) {
                            debug!(
                                "🎯 保留目标按钮：文本 '{}' 匹配目标 '{}' 的别名 '{}'",
                                element_text, target_text, alias
                            );
                            continue; // 不排除，继续检查其他别名
                        }
                        
                        debug!(
                            "🤖 自动排除：文本 '{}' 匹配内置别名 '{}' (目标: '{}')",
                            element_text, alias, target_text
                        );
                        return true;
                    }
                }
            }

            if let Some(desc) = &element.content_desc {
                for alias in AUTO_EXCLUDE_ALIASES {
                    if desc.contains(alias) {
                        // 🎯 同样的逻辑应用于content_desc
                        if target_text.contains(alias) {
                            debug!(
                                "🎯 保留目标按钮：描述 '{}' 匹配目标 '{}' 的别名 '{}'",
                                desc, target_text, alias
                            );
                            continue;
                        }
                        
                        debug!("🤖 自动排除：描述 '{}' 匹配内置别名 '{}' (目标: '{}')", desc, alias, target_text);
                        return true;
                    }
                }
            }
        }

        // 获取手动排除规则
        let exclude_patterns = protocol
            .matching_context
            .as_ref()
            .and_then(|ctx| ctx.light_assertions.as_ref())
            .and_then(|assertions| assertions.exclude_text.as_ref());

        if let Some(patterns) = exclude_patterns {
            if let Some(element_text) = &element.text {
                // 检查是否匹配任何手动排除模式
                for pattern in patterns {
                    if element_text.contains(pattern) {
                        debug!(
                            "🚫 手动排除：文本 '{}' 匹配规则 '{}'",
                            element_text, pattern
                        );
                        return true;
                    }
                }
            }

            // 检查 content_desc
            if let Some(desc) = &element.content_desc {
                for pattern in patterns {
                    if desc.contains(pattern) {
                        debug!("🚫 手动排除：描述 '{}' 匹配规则 '{}'", desc, pattern);
                        return true;
                    }
                }
            }
        }

        false
    }

    /// 🔥 去重逻辑：基于位置+文本的去重
    fn deduplicate_candidates(
        candidates: Vec<LegacyCandidateElement>,
        tolerance: i32,
    ) -> Vec<LegacyCandidateElement> {
        use std::collections::HashSet;

        let original_count = candidates.len();
        let mut seen = HashSet::new();
        let mut deduplicated = Vec::new();

        for candidate in candidates {
            let dedupe_key = Self::generate_dedupe_key(&candidate.element, tolerance);

            if seen.insert(dedupe_key.clone()) {
                deduplicated.push(candidate);
            } else {
                debug!("🔄 去重：跳过重复元素 (key: {})", dedupe_key);
            }
        }

        info!(
            "✅ 去重完成：{} → {} 个候选元素",
            original_count,
            deduplicated.len()
        );

        deduplicated
    }

    /// 🔥 生成去重键：基于位置分桶 + 文本
    fn generate_dedupe_key(element: &UIElement, tolerance: i32) -> String {
        let bounds = element
            .bounds
            .as_ref()
            .and_then(|b| ElementBounds::from_bounds_string(b));

        if let Some(b) = bounds {
            // 计算中心点Y坐标并按容差分桶
            let center_y = (b.top + b.bottom) / 2;
            let y_bucket = center_y / tolerance;

            // 组合位置和文本作为去重键
            let text_key = element.text.as_deref().unwrap_or("");
            format!("y{}_t{}", y_bucket, text_key)
        } else {
            // 没有边界信息时仅使用文本
            element
                .text
                .clone()
                .unwrap_or_else(|| "no_text".to_string())
        }
    }

    /// 🔥 点击后轻校验：检查元素状态是否变化
    /// 🚫 【用户要求】暂时禁用校验UI dump，避免两次dump操作
    async fn verify_click_success(device_id: &str, original_element: &UIElement) -> Result<bool> {
        // ⚠️ 【临时禁用】根据用户要求，暂时跳过校验UI dump
        // 这样可以避免第二次UI dump操作，提高效率
        info!("✅ 轻校验通过：元素 {} 状态已变化", 0);
        return Ok(true);

        // 以下代码被暂时禁用，如需恢复校验请取消注释：
        /*
        // 等待 200ms 让 UI 响应
        tokio::time::sleep(Duration::from_millis(200)).await;

        // 重新获取 UI dump
        let ui_xml = get_ui_dump(device_id).await
            .map_err(|e| anyhow!("轻校验：获取UI dump失败: {}", e))?;

        let elements = Self::parse_ui_elements(&ui_xml)?;

        // 如果原元素有边界信息，在相同位置查找
        if let Some(original_bounds_str) = &original_element.bounds {
            if let Some(original_bounds) = ElementBounds::from_bounds_string(original_bounds_str) {
                // 在原位置附近查找元素（容差±50px）
                for elem in elements {
                    if let Some(elem_bounds_str) = &elem.bounds {
                        if let Some(elem_bounds) = ElementBounds::from_bounds_string(elem_bounds_str) {
                            // 检查位置是否接近
                            let center_x_diff = ((original_bounds.left + original_bounds.right) / 2
                                - (elem_bounds.left + elem_bounds.right) / 2).abs();
                            let center_y_diff = ((original_bounds.top + original_bounds.bottom) / 2
                                - (elem_bounds.top + elem_bounds.bottom) / 2).abs();

                            if center_x_diff < 50 && center_y_diff < 50 {
                                // 位置接近，检查文本是否变化
                                if let (Some(original_text), Some(current_text)) =
                                    (&original_element.text, &elem.text) {
                                    // 常见的状态变化模式
                                    let state_changed =
                                        (original_text.contains("关注") && current_text.contains("已关注")) ||
                                        (original_text.contains("Follow") && current_text.contains("Following")) ||
                                        (original_text.contains("+") && !current_text.contains("+")) ||
                                        (original_text != current_text); // 任何文本变化

                                    if state_changed {
                                        debug!(
                                            "✅ 检测到状态变化: '{}' → '{}'",
                                            original_text, current_text
                                        );
                                        return Ok(true);
                                    }
                                }

                                // 检查 clickable 属性变化
                                if original_element.clickable != elem.clickable {
                                    debug!("✅ 检测到可点击状态变化");
                                    return Ok(true);
                                }
                            }
                        }
                    }
                }

                // 元素在原位置消失也算成功（可能是弹窗关闭等）
                debug!("✅ 原位置元素消失，视为成功");
                return Ok(true);
            }
        }

        // 无边界信息或无法验证时，返回不确定（视为成功）
        Ok(true)
        */
    }
}

/// Legacy候选元素结构（与types::smart_selection::CandidateElement不同）
#[derive(Debug, Clone)]
pub struct LegacyCandidateElement {
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
