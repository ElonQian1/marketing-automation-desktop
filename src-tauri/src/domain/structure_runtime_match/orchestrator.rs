// src-tauri/src/domain/structure_runtime_match/orchestrator.rs
// module: structure_runtime_match | layer: domain | role: 流程编排器
// summary: 结构匹配的唯一入口函数 - 编排容器限域/几何/模板/骨架/字段/评分全流程

use super::config::{SkeletonRules, SmConfig};
use super::container_gate::detector::pick_container;
use super::field_refine::scorer::score_fields;
use super::layout_gate::classifier::{classify, geom_score_for};
use super::ports::cache::SmCache;
use super::ports::xml_view::SmXmlView;
use super::scoring::combiner::combine;
use super::scoring::gates::{retain_passed, sort_desc};
use super::scoring::weights::weights_for;
use super::signature::learner::learn_or_load;
use super::signature::matcher::score_tpl;
// use super::skeleton::checker::score_skeleton;  // 🔴 旧版本
use super::skeleton::checker_v2::score_skeleton_v2;  // 🎯 新版本：基于谓词评估
use super::skeleton::dsl::SmSkeletonRulesDsl;
use super::types::{SmItemHit, SmLayoutType, SmResult};

pub fn sm_run_once<V: SmXmlView, C: SmCache>(
    view: &V,
    _cache: &mut C,
    cfg: &SmConfig,
    want_all: bool,
) -> SmResult {
    // 1) 容器限域
    let container = match pick_container(view) {
        Some(c) => c,
        None => {
            return SmResult {
                container: None,
                items: vec![],
            }
        }
    };

    // 早停3：只跑骨架
    if cfg.strict_skeleton_only {
        let mut items = propose_item_roots(view, container.node);
        score_skeleton_v2(view, &mut items);  // 🎯 使用 V2 谓词评估
        score_fields(view, &cfg.field_rules, &mut items);
        let w = weights_for(&cfg.mode);
        combine(&mut items, &w);
        let mut passed = retain_passed(items, cfg.min_confidence);
        sort_desc(&mut passed);
        if !want_all {
            passed.truncate(1);
        }
        return SmResult {
            container: Some(container),
            items: passed,
        };
    }

    // 2) 几何（可跳过）
    let layout = if cfg.skip_geometry {
        SmLayoutType::Unknown
    } else {
        classify(view, container.node)
    };

    // 3) 模板签名（仅"取一个"可跳过）
    let templates = if want_all || !cfg.skip_template_when_single {
        learn_or_load(view, container.node, layout)
    } else {
        vec![]
    };

    let mut items = propose_item_roots(view, container.node);

    if !templates.is_empty() {
        score_tpl(view, container.node, &templates, &mut items);
        items.retain(|it| it.scores.tpl >= 0.1);
    }

    // 4) 骨架 + 字段 + 几何分
    score_skeleton_v2(view, &mut items);  // 🎯 使用 V2 谓词评估
    score_fields(view, &cfg.field_rules, &mut items);
    for it in items.iter_mut() {
        it.scores.geom = geom_score_for(layout);
    }

    // 5) 合成 + 闸门 + 选择
    let w = weights_for(&cfg.mode);
    combine(&mut items, &w);
    let mut passed = retain_passed(items, cfg.min_confidence);
    sort_desc(&mut passed);
    if !want_all {
        passed.truncate(1);
    }

    SmResult {
        container: Some(container),
        items: passed,
    }
}

/// 候选卡片根（简化版：直接取 container 的 children）
fn propose_item_roots<V: SmXmlView>(view: &V, container: u32) -> Vec<SmItemHit> {
    view.children(container)
        .into_iter()
        .map(|n| SmItemHit {
            node: n,
            bounds: view.bounds(n),
            scores: Default::default(),
        })
        .collect()
}
