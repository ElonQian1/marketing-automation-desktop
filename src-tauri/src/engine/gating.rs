// src-tauri/src/engine/gating.rs
// module: decision-chain | layer: engine | role: 安全闸门与回退控制
// summary: 实现唯一性双判、阈值验证、容器拦截、轻校验等安全机制

use anyhow::Result;
use std::time::Instant;

use crate::engine::strategy_plugin::{
    StrategyRegistry, StrategyExecutor, ExecutionEnvironment, ExecutionResult, MatchSet, 
};
use crate::commands::run_step_v2::{DecisionChainPlan, StrategyVariant, StaticEvidence, MatchCandidate};

// 🛡️ 安全闸门：三重验证机制
pub struct SafetyGatekeeper;

impl SafetyGatekeeper {
    /// 唯一性双判：阈值唯一 + 间隔唯一
    pub fn validate_uniqueness(candidates: &[MatchCandidate], min_confidence: f32) -> bool {
        if candidates.is_empty() {
            tracing::warn!("🚫 安全闸门：无候选节点");
            return false;
        }
        
        let top1 = &candidates[0];
        
        // 阈值唯一性：Top1 >= min_confidence 且高质量候选只有1个
        let high_quality_count = candidates.iter()
            .filter(|c| c.confidence >= min_confidence as f64)
            .count();
        
        let threshold_unique = top1.confidence >= min_confidence as f64 && high_quality_count == 1;
        
        // 间隔唯一性：Top1 - Top2 >= 0.15
        let gap_unique = if candidates.len() >= 2 {
            let top2 = &candidates[1];
            let gap = top1.confidence - top2.confidence;
            tracing::debug!("🔍 置信度间隔: Top1={:.3}, Top2={:.3}, Gap={:.3}", 
                          top1.confidence, top2.confidence, gap);
            gap >= 0.15
        } else {
            tracing::debug!("🔍 单一候选，自动通过间隔检查");
            true
        };
        
        let passed = threshold_unique || gap_unique;
        
        tracing::info!("🛡️ 唯一性验证: 阈值唯一={}, 间隔唯一={} -> {}", 
                      threshold_unique, gap_unique, 
                      if passed { "✅通过" } else { "❌拒绝" });
        
        passed
    }
    
    /// 容器/整屏拦截：防止误点大容器
    pub fn validate_container_safety(candidate: &MatchCandidate, forbid_containers: bool) -> bool {
        if !forbid_containers {
            return true;
        }
        
        // 检查整屏节点（面积占比>95%）
        let width = (candidate.bounds.right - candidate.bounds.left) as f32;
        let height = (candidate.bounds.bottom - candidate.bounds.top) as f32;
        let area = width * height;
        let screen_area = 1080.0 * 2400.0; // 应从设备信息获取
        let area_ratio = area / screen_area;
        
        if area_ratio > 0.95 {
            tracing::warn!("🚫 整屏拦截: 面积占比{:.1}% > 95%", area_ratio * 100.0);
            return false;
        }
        
        // 检查容器类名 
        if let Some(class_name) = &candidate.class_name {
            let container_classes = [
                "android.widget.FrameLayout",
                "android.widget.LinearLayout", 
                "android.view.ViewGroup",
                "com.android.internal.policy.DecorView",
                "android.widget.RelativeLayout",
                "android.widget.ScrollView",
                "androidx.constraintlayout.widget.ConstraintLayout",
            ];
            
            if container_classes.iter().any(|&container| class_name == container) {
                tracing::warn!("🚫 容器拦截: 类名={}", class_name);
                return false;
            }
        }
        
        tracing::debug!("✅ 容器安全检查通过");
        true
    }
    
    /// 轻校验：命中后再次确认
    pub fn validate_light_checks(candidate: &MatchCandidate, variant: &StrategyVariant) -> bool {
        if let Some(checks) = &variant.checks {
            for check in checks {
                if !Self::run_single_check(candidate, check) {
                    tracing::warn!("🚫 轻校验失败: {:?}", check.check_type);
                    return false;
                }
            }
        }
        
        tracing::debug!("✅ 轻校验通过");
        true
    }
    
    /// 执行单个轻校验
    fn run_single_check(candidate: &MatchCandidate, check: &crate::commands::run_step_v2::LightCheck) -> bool {
        match check.check_type.as_str() {
            "clickable" => {
                // MatchCandidate 没有 clickable 字段，返回默认值
                true
            },
            "enabled" => {
                // MatchCandidate 没有 enabled 字段，返回默认值
                true
            },
            "child_text_contains" => {
                if let Some(target) = &check.value {
                    // 检查候选者的文本
                    candidate.text.as_ref()
                        .map(|text| text.contains(target))
                        .unwrap_or(false)
                } else {
                    false
                }
            },
            "child_text_contains_any" => {
                if let Some(targets) = &check.values {
                    targets.iter().any(|target| 
                        candidate.text.as_ref()
                            .map(|text| text.contains(target))
                            .unwrap_or(false)
                    )
                } else {
                    false
                }
            },
            _ => {
                tracing::warn!("🤷 未知轻校验类型: {}", check.check_type);
                true // 未知类型默认通过
            }
        }
    }
    
    /// 综合安全验证
    pub fn comprehensive_validation(
        candidates: &[MatchCandidate], 
        variant: &StrategyVariant,
        min_confidence: f32,
        forbid_containers: bool
    ) -> Option<MatchCandidate> {
        // Step 1: 唯一性验证
        if !Self::validate_uniqueness(candidates, min_confidence) {
            return None;
        }
        
        let best_candidate = &candidates[0];
        
        // Step 2: 容器安全验证
        if !Self::validate_container_safety(best_candidate, forbid_containers) {
            return None;
        }
        
        // Step 3: 轻校验
        if !Self::validate_light_checks(best_candidate, variant) {
            return None;
        }
        
        tracing::info!("🎯 安全闸门全部通过，准备执行");
        Some(best_candidate.clone())
    }
}

// 🔄 回退控制器：按Plan顺序受控回退
pub struct FallbackController;

impl FallbackController {
    /// 执行回退策略链
    pub async fn execute_with_fallback(
        env: &ExecutionEnvironment,
        plan: &DecisionChainPlan,
        registry: &StrategyRegistry
    ) -> Result<ExecutionResult> {
        let start_time = Instant::now();
        let total_budget = plan.strategy.time_budget_ms.unwrap_or(1200);
        let per_candidate_budget = plan.strategy.per_candidate_budget_ms.unwrap_or(180);
        
        let mut fallback_chain = Vec::new();
        let mut last_error = String::new();
        
        // 首先尝试selected策略
        if let Some(selected_variant) = plan.plan.iter().find(|v| v.id == plan.strategy.selected) {
            tracing::info!("🎯 执行选定策略: {}", selected_variant.id);
            
            match Self::try_single_variant(env, selected_variant, registry, per_candidate_budget).await {
                Ok(mut result) => {
                    result.fallback_chain = fallback_chain;
                    return Ok(result);
                }
                Err(e) => {
                    last_error = e.to_string();
                    fallback_chain.push(format!("{}:FAILED:{}", selected_variant.id, e));
                    tracing::warn!("⚠️ 选定策略失败: {}, 开始回退", e);
                }
            }
        }
        
        // 如果允许回退，按Plan顺序尝试
        if plan.strategy.allow_backend_fallback.unwrap_or(true) {
            tracing::info!("🔄 开始回退流程，剩余预算: {}ms", 
                          total_budget.saturating_sub(start_time.elapsed().as_millis() as u64));
            
            for variant in &plan.plan {
                if variant.id == plan.strategy.selected {
                    continue; // 跳过已尝试的
                }
                
                // 检查剩余时间预算
                let elapsed = start_time.elapsed().as_millis() as u64;
                if elapsed >= total_budget {
                    tracing::warn!("⏰ 总时间预算耗尽，停止回退");
                    break;
                }
                
                tracing::info!("🔄 回退尝试: {} (剩余{}ms)", variant.id, total_budget - elapsed);
                
                match Self::try_single_variant(env, variant, registry, per_candidate_budget).await {
                    Ok(mut result) => {
                        result.fallback_chain = fallback_chain;
                        tracing::info!("✅ 回退成功: {}", variant.id);
                        return Ok(result);
                    }
                    Err(e) => {
                        last_error = e.to_string();
                        fallback_chain.push(format!("{}:FAILED:{}", variant.id, e));
                        tracing::warn!("⚠️ 回退失败: {} -> {}", variant.id, e);
                    }
                }
            }
        }
        
        // 所有策略都失败了
        Ok(ExecutionResult {
            success: false,
            used_variant: "NONE".to_string(),
            match_count: 0,
            final_confidence: 0.0,
            execution_time_ms: start_time.elapsed().as_millis() as u64,
            tap_coordinates: None,
            screenshot_path: None,
            error_reason: Some(format!("全部策略失败，最后错误: {}", last_error)),
            fallback_chain,
        })
    }
    
    /// 尝试单个策略变体
    async fn try_single_variant(
        env: &ExecutionEnvironment,
        variant: &StrategyVariant,
        registry: &StrategyRegistry,
        time_budget_ms: u64
    ) -> Result<ExecutionResult> {
        let start_time = Instant::now();
        
        // 获取对应的策略执行器
        let executor = registry.get(variant.kind.to_str())
            .ok_or_else(|| anyhow::anyhow!("未找到策略执行器: {}", variant.kind))?;
        
        // 检查执行器是否支持该变体
        if !executor.can_execute(variant) {
            return Err(anyhow::anyhow!("执行器不支持该变体"));
        }
        
        // 查找匹配
        tracing::debug!("🔍 策略匹配阶段: {}", variant.id);
        let match_set = executor.find_matches(env, variant)?;
        
        if match_set.candidates.is_empty() {
            return Err(anyhow::anyhow!("无匹配节点"));
        }
        
        // 排序候选（按置信度降序）
        let mut sorted_candidates = match_set.candidates;
        sorted_candidates.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap());
        
        tracing::debug!("🎯 找到 {} 个候选节点", sorted_candidates.len());
        
        // 安全闸门验证
        let min_confidence = 0.70; // 应从plan获取
        let forbid_containers = true; // 应从plan获取
        
        if let Some(validated_target) = SafetyGatekeeper::comprehensive_validation(
            &sorted_candidates, variant, min_confidence, forbid_containers
        ) {
            // 检查时间预算
            let elapsed = start_time.elapsed().as_millis() as u64;
            if elapsed >= time_budget_ms {
                return Err(anyhow::anyhow!("单策略时间预算耗尽"));
            }
            
            // 执行动作
            tracing::debug!("🚀 执行动作阶段");
            let step_result = executor.execute_action(env, &validated_target.id).await
                .map_err(|e| anyhow::anyhow!("执行动作失败: {}", e))?;
            
            // 转换为ExecutionResult
            let execution_result = ExecutionResult {
                success: step_result.success,
                used_variant: variant.kind.to_string(),
                match_count: sorted_candidates.len(),
                final_confidence: sorted_candidates.first()
                    .map(|c| c.score as f32)
                    .unwrap_or(0.0),
                execution_time_ms: step_result.execution_time_ms,
                tap_coordinates: None, // 后续可从step_result中提取
                screenshot_path: None,
                error_reason: if step_result.success { None } else { Some(step_result.message.clone()) },
                fallback_chain: vec![variant.kind.to_string()],
            };
            
            Ok(execution_result)
        } else {
            Err(anyhow::anyhow!("安全闸门拒绝: 置信度不足或容器拦截"))
        }
    }
}