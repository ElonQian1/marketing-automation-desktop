// src-tauri/src/engine/strategy_plugin_v2.rs
// module: decision-chain | layer: engine | role: 策略执行器枚举系统
// summary: 实现基于枚举的可插拔策略系统，避免异步trait对象问题，还有其他

use anyhow::Result;
use crate::commands::run_step_v2::{StrategyVariant, StaticEvidence, ExecutionResult, MatchCandidate, MatchSet, Bounds};
use crate::services::ui_reader_service::UIElement;

// 🔧 执行环境（真机上下文）
#[derive(Debug, Clone)]
pub struct ExecutionEnvironment {
    pub ui_xml: String,
    pub xml_hash: String,
    pub package: Option<String>,
    pub activity: Option<String>,
    pub screen_width: i32,
    pub screen_height: i32,
    pub container_xpath: Option<String>,
    pub adb_path: String,
    pub serial: String,
}

// 🔌 策略执行器枚举（替代trait objects）
#[derive(Debug, Clone)]
pub enum StrategyExecutor {
    SelfId,
    SelfDesc,
    ChildToParent,
    RegionTextToParent,
    RegionLocalIndexWithCheck,
    NeighborRelative,
    GlobalIndexWithStrongChecks,
    BoundsTap,
}

impl StrategyExecutor {
    /// 获取策略名称
    pub fn name(&self) -> &'static str {
        match self {
            Self::SelfId => "SelfId",
            Self::SelfDesc => "SelfDesc",
            Self::ChildToParent => "ChildToParent",
            Self::RegionTextToParent => "RegionTextToParent",
            Self::RegionLocalIndexWithCheck => "RegionLocalIndexWithCheck",
            Self::NeighborRelative => "NeighborRelative",
            Self::GlobalIndexWithStrongChecks => "GlobalIndexWithStrongChecks",
            Self::BoundsTap => "BoundsTap",
        }
    }

    /// 检查是否支持该策略变体
    pub fn can_execute(&self, variant: &StrategyVariant) -> bool {
        match (self, &variant.kind) {
            (Self::SelfId, crate::commands::run_step_v2::VariantKind::SelfId) => true,
            (Self::SelfDesc, crate::commands::run_step_v2::VariantKind::SelfDesc) => true,
            (Self::ChildToParent, crate::commands::run_step_v2::VariantKind::ChildToParent) => true,
            (Self::RegionTextToParent, crate::commands::run_step_v2::VariantKind::RegionTextToParent) => true,
            (Self::RegionLocalIndexWithCheck, crate::commands::run_step_v2::VariantKind::RegionLocalIndexWithCheck) => true,
            (Self::NeighborRelative, crate::commands::run_step_v2::VariantKind::NeighborRelative) => true,
            (Self::GlobalIndexWithStrongChecks, crate::commands::run_step_v2::VariantKind::GlobalIndexWithStrongChecks) => true,
            (Self::BoundsTap, crate::commands::run_step_v2::VariantKind::BoundsTap) => true,
            _ => false,
        }
    }

    /// 查找匹配节点
    pub fn find_matches(&self, env: &ExecutionEnvironment, variant: &StrategyVariant) -> Result<MatchSet> {
        match self {
            Self::SelfId => self.find_by_self_id(env, variant),
            Self::SelfDesc => self.find_by_self_desc(env, variant),
            _ => {
                // 其他策略暂未实现
                Ok(MatchSet { 
                    candidates: vec![], 
                    total_searched: 0, 
                    container_limited: false 
                })
            }
        }
    }

    /// 评分计算
    pub fn score_match(&self, evidence: &StaticEvidence, candidate: &UIElement) -> f32 {
        // 使用统一评分算法
        crate::commands::run_step_v2::UnifiedScoringCore::calculate_tristate_score(evidence, candidate)
    }

    /// 执行动作（点击等）
    pub async fn execute_action(&self, target: &MatchCandidate, variant: &StrategyVariant, env: &ExecutionEnvironment) -> Result<ExecutionResult> {
        match self {
            Self::SelfId => self.execute_self_id_action(target, variant, env).await,
            Self::SelfDesc => self.execute_self_desc_action(target, variant, env).await,
            _ => {
                // 其他策略暂未实现
                Ok(ExecutionResult {
                    success: false,
                    used_variant: self.name().to_string(),
                    match_count: 0,
                    final_confidence: 0.0,
                    execution_time_ms: 0,
                    tap_coordinates: None,
                    screenshot_path: None,
                    error_reason: Some(format!("{} 策略暂未实现", self.name())),
                    fallback_chain: vec![],
                })
            }
        }
    }

    /// SelfId 策略的查找实现
    fn find_by_self_id(&self, env: &ExecutionEnvironment, variant: &StrategyVariant) -> Result<MatchSet> {
        // 实现基于resource_id的查找
        let mut candidates = Vec::new();
        
        if let Some(resource_id) = &variant.resources {
            if let Some(target_resource_id) = resource_id.get("resource_id").and_then(|v| v.as_str()) {
                candidates = self.search_by_resource_id(env, target_resource_id)?;
            }
        }
        
        Ok(MatchSet {
            candidates,
            total_searched: 1, // 简化实现
            container_limited: false,
        })
    }

    /// SelfDesc 策略的查找实现
    fn find_by_self_desc(&self, env: &ExecutionEnvironment, variant: &StrategyVariant) -> Result<MatchSet> {
        let mut candidates = Vec::new();
        
        if let Some(resources) = &variant.resources {
            if let Some(target_content_desc) = resources.get("content_desc").and_then(|v| v.as_str()) {
                // 🎯 智能解析 content-desc（"我，按钮" -> "我"）
                let core_text = Self::extract_core_content_desc(target_content_desc);
                tracing::info!("🔍 SelfDesc 策略: 原始='{}', 核心='{}'", target_content_desc, core_text);
                
                candidates = self.search_by_content_desc_with_hierarchy(env, &core_text, target_content_desc)?;
            }
        }
        
        Ok(MatchSet {
            candidates,
            total_searched: 1,
            container_limited: false,
        })
    }

    /// 通过resource_id搜索节点（增强版，处理重复ID）
    fn search_by_resource_id(&self, env: &ExecutionEnvironment, resource_id: &str) -> Result<Vec<MatchCandidate>> {
        use crate::services::ui_reader_service::parse_ui_elements;
        
        // 解析UI元素
        let ui_elements = parse_ui_elements(&env.ui_xml)?;
        let mut candidates = Vec::new();
        
        // 🎯 查找所有匹配的resource_id元素
        let matching_elements: Vec<&crate::services::ui_reader_service::UIElement> = ui_elements
            .iter()
            .filter(|elem| {
                elem.resource_id.as_ref().map_or(false, |rid| rid == resource_id)
            })
            .collect();
        
        tracing::info!("🔍 找到 {} 个匹配 resource_id='{}' 的元素", matching_elements.len(), resource_id);
        
        // 🎯 智能去重：基于位置和上下文区分重复ID
        for (index, elem) in matching_elements.iter().enumerate() {
            let clickable_target = Self::find_clickable_target(elem, &ui_elements);
            
            let bounds = Self::parse_bounds(&clickable_target.bounds.clone().unwrap_or_default())?;
            let confidence = Self::calculate_resource_id_confidence(elem, index, matching_elements.len(), &env);
            
            candidates.push(MatchCandidate {
                id: format!("{}[{}]", resource_id, index + 1),
                score: confidence as f64,
                confidence: confidence as f64,
                bounds: Bounds {
                    left: bounds.0,
                    top: bounds.1,
                    right: bounds.2,
                    bottom: bounds.3,
                },
                text: clickable_target.text.clone(),
                class_name: clickable_target.class.clone(),
                package_name: clickable_target.package.clone(),
            });
        }
        
        // 按置信度排序
        candidates.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap_or(std::cmp::Ordering::Equal));
        
        Ok(candidates)
    }

    /// SelfId 策略的执行动作
    async fn execute_self_id_action(&self, target: &MatchCandidate, _variant: &StrategyVariant, env: &ExecutionEnvironment) -> Result<ExecutionResult> {
        let start_time = std::time::Instant::now();
        
        // 计算点击坐标
        let tap_x = (target.bounds.left + target.bounds.right) / 2;
        let tap_y = (target.bounds.top + target.bounds.bottom) / 2;
        
        // 执行点击
        crate::infra::adb::input_helper::tap_injector_first(&env.adb_path, &env.serial, tap_x, tap_y, None).await
            .map_err(|e| anyhow::anyhow!("点击失败: {}", e))?;
        
        let elapsed = start_time.elapsed();
        
        Ok(ExecutionResult {
            success: true,
            used_variant: "SelfId".to_string(),
            match_count: 1,
            final_confidence: target.confidence,
            execution_time_ms: elapsed.as_millis() as u64,
            tap_coordinates: Some((tap_x, tap_y)),
            screenshot_path: None,
            error_reason: None,
            fallback_chain: vec![],
        })
    }

    /// SelfDesc 策略的执行动作
    async fn execute_self_desc_action(&self, target: &MatchCandidate, _variant: &StrategyVariant, env: &ExecutionEnvironment) -> Result<ExecutionResult> {
        let start_time = std::time::Instant::now();
        
        // 计算点击坐标
        let tap_x = (target.bounds.left + target.bounds.right) / 2;
        let tap_y = (target.bounds.top + target.bounds.bottom) / 2;
        
        tracing::info!("🎯 SelfDesc 策略执行点击: ({},{}) text={:?}", 
                      tap_x, tap_y, target.text);
        
        // 执行点击
        crate::infra::adb::input_helper::tap_injector_first(&env.adb_path, &env.serial, tap_x, tap_y, None).await
            .map_err(|e| anyhow::anyhow!("SelfDesc点击失败: {}", e))?;
        
        let elapsed = start_time.elapsed();
        
        Ok(ExecutionResult {
            success: true,
            used_variant: "SelfDesc".to_string(),
            match_count: 1,
            final_confidence: target.confidence,
            execution_time_ms: elapsed.as_millis() as u64,
            tap_coordinates: Some((tap_x, tap_y)),
            screenshot_path: None,
            error_reason: None,
            fallback_chain: vec![],
        })
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🧠 智能层级识别和content-desc处理核心算法
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    /// 🎯 核心算法：智能解析content-desc，提取核心文本
    fn extract_core_content_desc(content_desc: &str) -> String {
        // 处理常见格式："我，按钮" -> "我"
        if let Some(comma_pos) = content_desc.find('，') {
            content_desc[..comma_pos].trim().to_string()
        } else if let Some(comma_pos) = content_desc.find(',') {
            content_desc[..comma_pos].trim().to_string()
        } else if let Some(comma_pos) = content_desc.find('、') {
            content_desc[..comma_pos].trim().to_string()
        } else {
            // 移除常见后缀词
            content_desc
                .replace("按钮", "")
                .replace("，双击激活", "")
                .replace("，双击打开", "")
                .replace("编辑框", "")
                .replace("输入框", "")
                .trim()
                .to_string()
        }
    }
    
    /// 🎯 核心算法：智能层级点击目标识别
    /// 解决"TextView有文本但不可点击，需要点击父容器"问题
    fn find_clickable_target(
        element: &crate::services::ui_reader_service::UIElement,
        all_elements: &[crate::services::ui_reader_service::UIElement]
    ) -> &crate::services::ui_reader_service::UIElement {
        
        // 如果元素本身可点击，直接返回
        if element.clickable.unwrap_or(false) {
            return element;
        }
        
        // 🎯 向上查找可点击的父容器（最多向上3层）
        let element_bounds = Self::parse_bounds(&element.bounds.clone().unwrap_or_default()).ok();
        
        if let Some(target_bounds) = element_bounds {
            // 查找包含当前元素且可点击的父容器
            let mut best_parent = element;
            let mut min_area_diff = f64::MAX;
            
            for candidate in all_elements {
                if !candidate.clickable.unwrap_or(false) {
                    continue;
                }
                
                if let Ok(candidate_bounds) = Self::parse_bounds(&candidate.bounds.clone().unwrap_or_default()) {
                    // 检查是否包含目标元素
                    if Self::bounds_contains(candidate_bounds, target_bounds) {
                        // 计算面积差异，选择最小的包含容器
                        let candidate_area = (candidate_bounds.2 - candidate_bounds.0) * (candidate_bounds.3 - candidate_bounds.1);
                        let target_area = (target_bounds.2 - target_bounds.0) * (target_bounds.3 - target_bounds.1);
                        let area_diff = (candidate_area - target_area) as f64;
                        
                        if area_diff < min_area_diff && area_diff >= 0.0 {
                            min_area_diff = area_diff;
                            best_parent = candidate;
                        }
                    }
                }
            }
            
            if best_parent != element {
                tracing::info!("🎯 层级智能识别: 从不可点击元素 {:?} 上溯到可点击父容器 {:?}", 
                              element.text, best_parent.resource_id);
            }
            
            return best_parent;
        }
        
        // 回退到原元素
        element
    }
    
    /// 🎯 计算resource-id置信度（处理重复ID）
    fn calculate_resource_id_confidence(
        element: &crate::services::ui_reader_service::UIElement,
        index: usize,
        total_matches: usize,
        env: &ExecutionEnvironment
    ) -> f32 {
        let mut confidence = 0.8; // 基础置信度
        
        // 🎯 重复ID惩罚
        if total_matches > 1 {
            confidence -= 0.2; // 每有重复ID，降低20%置信度
            
            // 🎯 位置权重：底部导航栏元素权重更高
            if let Ok(bounds) = Self::parse_bounds(&element.bounds.clone().unwrap_or_default()) {
                let y_position = bounds.1; // top坐标
                let screen_height = env.screen_height as i32;
                
                // 底部区域（占屏幕下20%）权重提升
                if y_position > screen_height * 4 / 5 {
                    confidence += 0.3;
                    tracing::info!("🎯 底部导航栏元素权重提升: y={}, 置信度={:.3}", y_position, confidence);
                }
            }
        }
        
        // 🎯 索引权重：第一个匹配通常是目标
        if index == 0 {
            confidence += 0.1;
        }
        
        // 🎯 文本内容权重
        if element.text.is_some() || element.content_desc.is_some() {
            confidence += 0.1;
        }
        
        confidence.max(0.0).min(1.0)
    }
    
    /// 通过content-desc搜索（增强版，支持层级识别）
    fn search_by_content_desc_with_hierarchy(
        &self, 
        env: &ExecutionEnvironment, 
        core_text: &str, 
        original_desc: &str
    ) -> Result<Vec<MatchCandidate>> {
        use crate::services::ui_reader_service::parse_ui_elements;
        
        let ui_elements = parse_ui_elements(&env.ui_xml)?;
        let mut candidates = Vec::new();
        
        // 🎯 多种匹配策略
        let search_patterns = vec![
            original_desc,  // 原始完整匹配
            core_text,      // 核心文本匹配
        ];
        
        for pattern in search_patterns {
            let matching_elements: Vec<&crate::services::ui_reader_service::UIElement> = ui_elements
                .iter()
                .filter(|elem| {
                    // content-desc 匹配
                    if let Some(desc) = &elem.content_desc {
                        return desc == pattern || desc.contains(pattern);
                    }
                    // text 属性作为备用匹配
                    if let Some(text) = &elem.text {
                        return text == pattern;
                    }
                    false
                })
                .collect();
            
            for (index, elem) in matching_elements.iter().enumerate() {
                let clickable_target = Self::find_clickable_target(elem, &ui_elements);
                
                let bounds = Self::parse_bounds(&clickable_target.bounds.clone().unwrap_or_default())?;
                let confidence = if pattern == original_desc { 0.95 } else { 0.85 }; // 原始匹配置信度更高
                
                candidates.push(MatchCandidate {
                    id: if pattern == original_desc {
                        format!("content-desc='{}'", pattern)
                    } else {
                        format!("contains-content-desc='{}'", pattern)
                    },
                    score: confidence,
                    confidence,
                    bounds: Bounds {
                        left: bounds.0,
                        top: bounds.1,
                        right: bounds.2,
                        bottom: bounds.3,
                    },
                    text: clickable_target.text.clone(),
                    class_name: clickable_target.class.clone(),
                    package_name: clickable_target.package.clone(),
                });
            }
        }
        
        // 去重和排序
        candidates.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap_or(std::cmp::Ordering::Equal));
        candidates.dedup_by(|a, b| a.bounds == b.bounds);
        
        Ok(candidates)
    }
    
    /// 解析bounds字符串 "[x1,y1][x2,y2]" -> (x1,y1,x2,y2)
    fn parse_bounds(bounds_str: &str) -> Result<(i32, i32, i32, i32)> {
        // 移除方括号并分割
        let cleaned = bounds_str.replace("[", "").replace("]", "");
        let parts: Vec<&str> = cleaned.split(',').collect();
        
        if parts.len() >= 4 {
            let x1 = parts[0].parse::<i32>()?;
            let y1 = parts[1].parse::<i32>()?;
            let x2 = parts[2].parse::<i32>()?;
            let y2 = parts[3].parse::<i32>()?;
            Ok((x1, y1, x2, y2))
        } else {
            Err(anyhow::anyhow!("无效的bounds格式: {}", bounds_str))
        }
    }
    
    /// 检查bounds1是否包含bounds2
    fn bounds_contains(container: (i32, i32, i32, i32), target: (i32, i32, i32, i32)) -> bool {
        container.0 <= target.0 && // left
        container.1 <= target.1 && // top
        container.2 >= target.2 && // right
        container.3 >= target.3    // bottom
    }
}

// 🏗️ 策略注册表（基于枚举）
#[derive(Debug)]
pub struct StrategyRegistry {
    executors: Vec<StrategyExecutor>,
}

impl StrategyRegistry {
    /// 创建新的注册表并注册所有策略
    pub fn new() -> Self {
        Self {
            executors: vec![
                StrategyExecutor::SelfId,
                StrategyExecutor::SelfDesc,
                StrategyExecutor::ChildToParent,
                StrategyExecutor::RegionTextToParent,
                StrategyExecutor::RegionLocalIndexWithCheck,
                StrategyExecutor::NeighborRelative,
                StrategyExecutor::GlobalIndexWithStrongChecks,
                StrategyExecutor::BoundsTap,
            ],
        }
    }

    /// 根据策略类型获取执行器
    pub fn get_executor(&self, kind: &str) -> Option<&StrategyExecutor> {
        self.executors.iter().find(|e| e.name() == kind)
    }

    /// 获取所有可用策略名称
    pub fn list_strategies(&self) -> Vec<&'static str> {
        self.executors.iter().map(|e| e.name()).collect()
    }
}

// 全局策略注册表实例
lazy_static::lazy_static! {
    pub static ref STRATEGY_REGISTRY: std::sync::RwLock<StrategyRegistry> = {
        std::sync::RwLock::new(StrategyRegistry::new())
    };
}