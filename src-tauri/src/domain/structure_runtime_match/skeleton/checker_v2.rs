// src-tauri/src/domain/structure_runtime_match/skeleton/checker_v2.rs
// module: structure_runtime_match | layer: domain | role: V2骨架检查器（谓词评估）
// summary: 使用谓词系统评估字段规则，替代旧的"有图或文本"简单逻辑

use super::super::ports::xml_view::SmXmlView;
use super::super::types::{SmNodeId, SmItemHit};
use super::predicates::*;

/// 容器常见滚动类
pub const DEFAULT_SCROLL_CONTAINER_CLASSES: [&str; 6] = [
    "RecyclerView", "ListView", "GridView", "ViewPager", "ScrollView", "HorizontalScrollView"
];

/// V2 骨架评估：使用谓词系统
/// 
/// 工作流程：
/// 1. 对每个候选节点执行基础谓词（可点父 + 祖先滚容器）
/// 2. 执行字段规则谓词（resource_id, class_contains, must_be_empty）
/// 3. 硬约束不通过 → score=0.0，软约束 → 累加得分
pub fn score_skeleton_v2<V: SmXmlView>(
    view: &V,
    items: &mut [SmItemHit],
) {
    for it in items.iter_mut() {
        let mut total_score = 0.0f32;
        let mut hard_failed = false;
        
        // 基础谓词1：可点父（硬约束）
        {
            let pred = ClickableOrClickableParent {
                search_depth: 2,
                weight: 0.35,
                severity: Severity::Hard,
            };
            let result = <ClickableOrClickableParent as Predicate<V>>::evaluate(&pred, view, it.node);
            
            if !result.passed && (pred.severity == Severity::Hard) {
                hard_failed = true;
            }
            total_score += result.contribution;
            
            tracing::trace!("[skeleton] node={} clickable_parent -> passed={} contrib={:.2} {}", 
                it.node, result.passed, result.contribution, result.explain);
        }
        
        // 基础谓词2：祖先滚容器（硬约束）
        {
            let pred = AncestorScrollableOrClass {
                acceptable_classes: &DEFAULT_SCROLL_CONTAINER_CLASSES,
                weight: 0.25,
                severity: Severity::Hard,
            };
            let result = <AncestorScrollableOrClass as Predicate<V>>::evaluate(&pred, view, it.node);
            
            if !result.passed && (pred.severity == Severity::Hard) {
                hard_failed = true;
            }
            total_score += result.contribution;
            
            tracing::trace!("[skeleton] node={} ancestor_scrollable -> passed={} contrib={:.2} {}", 
                it.node, result.passed, result.contribution, result.explain);
        }
        
        // TODO: 从 structural_signatures JSON 解析字段规则并评估
        // 当前版本先实现基础谓词，字段规则留待下一步集成
        
        // 最终得分
        it.scores.skeleton = if hard_failed {
            0.0
        } else {
            total_score.clamp(0.0, 1.0)
        };
        
        tracing::debug!("[skeleton] node={} final_score={:.3} hard_failed={}", 
            it.node, it.scores.skeleton, hard_failed);
    }
}
