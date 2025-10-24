// src-tauri/src/engine/strategy_plugin.rs
// module: decision-chain | layer: engine | role: 策略插件统一接口与注册表
// summary: 实现可插拔策略系统，前后端通过Plan契约对齐

use std::collections::HashMap;
use anyhow::Result;

use crate::services::ui_reader_service::UIElement;
use crate::commands::run_step_v2::{StrategyVariant, StaticEvidence, ExecutionResult, MatchCandidate, MatchSet};

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

// 📊 匹配结果集合
#[derive(Debug, Clone)]
pub struct MatchSet {
    pub candidates: Vec<MatchCandidate>,
    pub total_searched: usize,
    pub container_limited: bool,
}

// 🎯 单个匹配候选
#[derive(Debug, Clone, Serialize)]
pub struct MatchCandidate {
    pub id: String,
    pub confidence: f32,
    pub bounds: (i32, i32, i32, i32), // left, top, right, bottom
    pub element: UIElement,
    pub match_reason: String,
    pub risk_flags: Vec<String>,
}

// 🚀 执行结果
#[derive(Debug, Clone, Serialize)]
pub struct ExecutionResult {
    pub success: bool,
    pub used_variant: String,
    pub match_count: usize,
    pub final_confidence: f32,
    pub execution_time_ms: u64,
    pub tap_coordinates: Option<(i32, i32)>,
    pub screenshot_path: Option<String>,
    pub error_reason: Option<String>,
    pub fallback_chain: Vec<String>,
}

// 🧩 策略执行插件统一接口
pub trait StrategyExecutor: Send + Sync {
    /// 插件名称（与VariantKind对应）
    fn name(&self) -> &'static str;
    
    /// 检查是否能处理该策略变体
    fn can_execute(&self, variant: &StrategyVariant) -> bool;
    
    /// 在执行环境中匹配候选节点
    fn find_matches(&self, env: &ExecutionEnvironment, variant: &StrategyVariant) -> Result<MatchSet>;
    
    /// 使用统一评分引擎计算置信度
    fn score_match(&self, evidence: &StaticEvidence, candidate: &UIElement) -> f32;
    
    /// 执行动作（点击/输入/滑动等）
    async fn execute_action(&self, target: &MatchCandidate, variant: &StrategyVariant, env: &ExecutionEnvironment) -> Result<ExecutionResult>;
}

// 📋 策略注册表（后端核心组件）
pub struct StrategyRegistry {
    executors: HashMap<String, Box<dyn StrategyExecutor>>,
}

impl StrategyRegistry {
    pub fn new() -> Self {
        let mut registry = Self {
            executors: HashMap::new(),
        };
        
        // 注册内置策略插件
        registry.register_builtin_strategies();
        registry
    }
    
    /// 注册策略插件
    pub fn register(&mut self, executor: Box<dyn StrategyExecutor>) {
        let name = executor.name().to_string();
        tracing::info!("🔧 注册策略插件: {}", name);
        self.executors.insert(name, executor);
    }
    
    /// 获取策略执行器
    pub fn get_executor(&self, kind: &str) -> Option<&dyn StrategyExecutor> {
        self.executors.get(kind).map(|e| e.as_ref())
    }
    
    /// 列出所有已注册策略
    pub fn list_strategies(&self) -> Vec<&str> {
        self.executors.keys().map(|k| k.as_str()).collect()
    }
    
    /// 注册内置策略插件
    fn register_builtin_strategies(&mut self) {
        // 注册8种核心策略
        self.register(Box::new(SelfIdExecutor));
        self.register(Box::new(SelfDescExecutor));
        self.register(Box::new(ChildToParentExecutor));
        self.register(Box::new(RegionTextToParentExecutor));
        self.register(Box::new(RegionLocalIndexWithCheckExecutor));
        self.register(Box::new(NeighborRelativeExecutor));
        self.register(Box::new(GlobalIndexWithStrongChecksExecutor));
        self.register(Box::new(BoundsTapExecutor));
        
        tracing::info!("✅ 已注册 {} 个内置策略插件", self.executors.len());
    }
}

// 🎯 具体策略实现（插件）

/// 策略1: 直接ResourceId匹配
pub struct SelfIdExecutor;

impl StrategyExecutor for SelfIdExecutor {
    fn name(&self) -> &'static str { "SelfId" }
    
    fn can_execute(&self, variant: &StrategyVariant) -> bool {
        matches!(variant.kind, crate::commands::run_step_v2::VariantKind::SelfId)
    }
    
    fn find_matches(&self, env: &ExecutionEnvironment, variant: &StrategyVariant) -> Result<MatchSet> {
        let mut candidates = Vec::new();
        
        // 从selectors.self获取resource_id
        if let Some(self_selector) = &variant.selectors.self_ {
            if let Some(target_id) = &self_selector.resource_id {
                // 在UI XML中搜索匹配的resource-id
                candidates = self.search_by_resource_id(env, target_id)?;
            }
        }
        
        Ok(MatchSet {
            candidates,
            total_searched: 1, // SelfId是精确搜索
            container_limited: variant.scope == "regional",
        })
    }
    
    fn score_match(&self, evidence: &StaticEvidence, candidate: &UIElement) -> f32 {
        crate::commands::run_step_v2::UnifiedScoringCore::calculate_tristate_score(evidence, candidate)
    }
    
    async fn execute_action(&self, target: &MatchCandidate, _variant: &StrategyVariant, env: &ExecutionEnvironment) -> Result<ExecutionResult> {
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

impl SelfIdExecutor {
    fn search_by_resource_id(&self, env: &ExecutionEnvironment, resource_id: &str) -> Result<Vec<MatchCandidate>> {
        let mut candidates = Vec::new();
        
        // 简化的XML解析（实际应使用xml-rs）
        let resource_pattern = format!("resource-id=\"{}\"", resource_id);
        
        if env.ui_xml.contains(&resource_pattern) {
            // 这里应该解析完整的节点信息
            // 为演示简化处理
            let candidate = MatchCandidate {
                id: format!("self_id_{}", resource_id),
                confidence: 0.95, // ResourceId匹配给高分
                bounds: (100, 200, 300, 250), // 应从XML解析
                element: UIElement {
                    resource_id: Some(resource_id.to_string()),
                    text: Some("".to_string()),
                    class: Some("android.widget.Button".to_string()),
                    content_desc: Some("".to_string()),
                    bounds: Some("[100,200][300,250]".to_string()),
                    clickable: Some(true),
                    enabled: Some(true),
                    package: env.package.clone(),
                },
                match_reason: "DirectResourceIdMatch".to_string(),
                risk_flags: vec![],
            };
            candidates.push(candidate);
        }
        
        Ok(candidates)
    }
}

// 其他策略插件的基础结构（待实现）
pub struct SelfDescExecutor;
impl StrategyExecutor for SelfDescExecutor {
    fn name(&self) -> &'static str { "SelfDesc" }
    fn can_execute(&self, variant: &StrategyVariant) -> bool { 
        matches!(variant.kind, crate::commands::run_step_v2::VariantKind::SelfDesc) 
    }
    fn find_matches(&self, _env: &ExecutionEnvironment, _variant: &StrategyVariant) -> Result<MatchSet> {
        Ok(MatchSet { candidates: vec![], total_searched: 0, container_limited: false })
    }
    fn score_match(&self, evidence: &StaticEvidence, candidate: &UIElement) -> f32 {
        crate::commands::run_step_v2::UnifiedScoringCore::calculate_tristate_score(evidence, candidate)
    }
    async fn execute_action(&self, _target: &MatchCandidate, _variant: &StrategyVariant, _env: &ExecutionEnvironment) -> Result<ExecutionResult> {
        Err(anyhow::anyhow!("SelfDesc未实现"))
    }
}

pub struct ChildToParentExecutor;
impl StrategyExecutor for ChildToParentExecutor {
    fn name(&self) -> &'static str { "ChildToParent" }
    fn can_execute(&self, variant: &StrategyVariant) -> bool { 
        matches!(variant.kind, crate::commands::run_step_v2::VariantKind::ChildToParent) 
    }
    fn find_matches(&self, _env: &ExecutionEnvironment, _variant: &StrategyVariant) -> Result<MatchSet> {
        Ok(MatchSet { candidates: vec![], total_searched: 0, container_limited: false })
    }
    fn score_match(&self, evidence: &StaticEvidence, candidate: &UIElement) -> f32 {
        crate::commands::run_step_v2::UnifiedScoringCore::calculate_tristate_score(evidence, candidate)
    }
    async fn execute_action(&self, _target: &MatchCandidate, _variant: &StrategyVariant, _env: &ExecutionEnvironment) -> Result<ExecutionResult> {
        Err(anyhow::anyhow!("ChildToParent未实现"))
    }
}

pub struct RegionTextToParentExecutor;
impl StrategyExecutor for RegionTextToParentExecutor {
    fn name(&self) -> &'static str { "RegionTextToParent" }
    fn can_execute(&self, variant: &StrategyVariant) -> bool { 
        matches!(variant.kind, crate::commands::run_step_v2::VariantKind::RegionTextToParent) 
    }
    fn find_matches(&self, _env: &ExecutionEnvironment, _variant: &StrategyVariant) -> Result<MatchSet> {
        Ok(MatchSet { candidates: vec![], total_searched: 0, container_limited: false })
    }
    fn score_match(&self, evidence: &StaticEvidence, candidate: &UIElement) -> f32 {
        crate::commands::run_step_v2::UnifiedScoringCore::calculate_tristate_score(evidence, candidate)
    }
    async fn execute_action(&self, _target: &MatchCandidate, _variant: &StrategyVariant, _env: &ExecutionEnvironment) -> Result<ExecutionResult> {
        Err(anyhow::anyhow!("RegionTextToParent未实现"))
    }
}

pub struct RegionLocalIndexWithCheckExecutor;
impl StrategyExecutor for RegionLocalIndexWithCheckExecutor {
    fn name(&self) -> &'static str { "RegionLocalIndexWithCheck" }
    fn can_execute(&self, variant: &StrategyVariant) -> bool { 
        matches!(variant.kind, crate::commands::run_step_v2::VariantKind::RegionLocalIndexWithCheck) 
    }
    fn find_matches(&self, _env: &ExecutionEnvironment, _variant: &StrategyVariant) -> Result<MatchSet> {
        Ok(MatchSet { candidates: vec![], total_searched: 0, container_limited: false })
    }
    fn score_match(&self, evidence: &StaticEvidence, candidate: &UIElement) -> f32 {
        crate::commands::run_step_v2::UnifiedScoringCore::calculate_tristate_score(evidence, candidate)
    }
    async fn execute_action(&self, _target: &MatchCandidate, _variant: &StrategyVariant, _env: &ExecutionEnvironment) -> Result<ExecutionResult> {
        Err(anyhow::anyhow!("RegionLocalIndexWithCheck未实现"))
    }
}

pub struct NeighborRelativeExecutor;
impl StrategyExecutor for NeighborRelativeExecutor {
    fn name(&self) -> &'static str { "NeighborRelative" }
    fn can_execute(&self, variant: &StrategyVariant) -> bool { 
        matches!(variant.kind, crate::commands::run_step_v2::VariantKind::NeighborRelative) 
    }
    fn find_matches(&self, _env: &ExecutionEnvironment, _variant: &StrategyVariant) -> Result<MatchSet> {
        Ok(MatchSet { candidates: vec![], total_searched: 0, container_limited: false })
    }
    fn score_match(&self, evidence: &StaticEvidence, candidate: &UIElement) -> f32 {
        crate::commands::run_step_v2::UnifiedScoringCore::calculate_tristate_score(evidence, candidate)
    }
    async fn execute_action(&self, _target: &MatchCandidate, _variant: &StrategyVariant, _env: &ExecutionEnvironment) -> Result<ExecutionResult> {
        Err(anyhow::anyhow!("NeighborRelative未实现"))
    }
}

pub struct GlobalIndexWithStrongChecksExecutor;
impl StrategyExecutor for GlobalIndexWithStrongChecksExecutor {
    fn name(&self) -> &'static str { "GlobalIndexWithStrongChecks" }
    fn can_execute(&self, variant: &StrategyVariant) -> bool { 
        matches!(variant.kind, crate::commands::run_step_v2::VariantKind::GlobalIndexWithStrongChecks) 
    }
    fn find_matches(&self, _env: &ExecutionEnvironment, _variant: &StrategyVariant) -> Result<MatchSet> {
        Ok(MatchSet { candidates: vec![], total_searched: 0, container_limited: false })
    }
    fn score_match(&self, evidence: &StaticEvidence, candidate: &UIElement) -> f32 {
        crate::commands::run_step_v2::UnifiedScoringCore::calculate_tristate_score(evidence, candidate)
    }
    async fn execute_action(&self, _target: &MatchCandidate, _variant: &StrategyVariant, _env: &ExecutionEnvironment) -> Result<ExecutionResult> {
        Err(anyhow::anyhow!("GlobalIndexWithStrongChecks未实现"))
    }
}

pub struct BoundsTapExecutor;
impl StrategyExecutor for BoundsTapExecutor {
    fn name(&self) -> &'static str { "BoundsTap" }
    fn can_execute(&self, variant: &StrategyVariant) -> bool { 
        matches!(variant.kind, crate::commands::run_step_v2::VariantKind::BoundsTap) 
    }
    fn find_matches(&self, _env: &ExecutionEnvironment, _variant: &StrategyVariant) -> Result<MatchSet> {
        Ok(MatchSet { candidates: vec![], total_searched: 0, container_limited: false })
    }
    fn score_match(&self, evidence: &StaticEvidence, candidate: &UIElement) -> f32 {
        crate::commands::run_step_v2::UnifiedScoringCore::calculate_tristate_score(evidence, candidate)
    }
    async fn execute_action(&self, _target: &MatchCandidate, _variant: &StrategyVariant, _env: &ExecutionEnvironment) -> Result<ExecutionResult> {
        Err(anyhow::anyhow!("BoundsTap未实现"))
    }
}

// 全局策略注册表实例
lazy_static::lazy_static! {
    pub static ref STRATEGY_REGISTRY: std::sync::RwLock<StrategyRegistry> = {
        std::sync::RwLock::new(StrategyRegistry::new())
    };
}

/// 获取策略执行器的便捷函数
pub fn get_strategy_executor(kind: &str) -> Option<&'static dyn StrategyExecutor> {
    // 注意：这里需要处理生命周期问题，实际实现可能需要调整
    None
}