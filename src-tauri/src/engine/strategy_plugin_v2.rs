// src-tauri/src/engine/strategy_plugin_v2.rs
// module: decision-chain | layer: engine | role: 策略执行器枚举系统
// summary: 实现基于枚举的可插拔策略系统，避免异步trait对象问题

use anyhow::Result;
use crate::commands::run_step_v2::{StrategyVariant, StaticEvidence, ExecutionResult, MatchCandidate, MatchSet};
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
    fn find_by_self_desc(&self, _env: &ExecutionEnvironment, _variant: &StrategyVariant) -> Result<MatchSet> {
        // 暂未实现
        Ok(MatchSet { candidates: vec![], total_searched: 0, container_limited: false })
    }

    /// 通过resource_id搜索节点
    fn search_by_resource_id(&self, env: &ExecutionEnvironment, resource_id: &str) -> Result<Vec<MatchCandidate>> {
        // 解析XML并查找匹配的resource_id
        // 这里使用简化实现
        let mut candidates = Vec::new();
        
        // TODO: 实现XML解析和搜索逻辑
        // 当前返回空结果
        
        Ok(candidates)
    }

    /// SelfId 策略的执行动作
    async fn execute_self_id_action(&self, target: &MatchCandidate, _variant: &StrategyVariant, env: &ExecutionEnvironment) -> Result<ExecutionResult> {
        let start_time = std::time::Instant::now();
        
        // 计算点击坐标
        let (left, top, right, bottom) = target.bounds;
        let tap_x = (left + right) / 2;
        let tap_y = (top + bottom) / 2;
        
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