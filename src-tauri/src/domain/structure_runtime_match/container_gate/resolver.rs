// src-tauri/src/domain/structure_runtime_match/container_gate/resolver.rs
// module: structure_runtime_match | layer: domain | role: 容器限域核心解析器
// summary: 统一入口：resolve_container_scope()

use anyhow::{Result, anyhow};
use super::types::{UiTree, NodeId, ContainerHints, ContainerScope, ContainerConfig, HeuristicResult};
use super::heuristics::{scrollable, semantic, geometry, exclusion, popup, vote};
use super::providers::{xpath_hint, element_id_hint, bounds_hint, ancestor_chain};

pub fn resolve_container_scope<T: UiTree>(
    tree: &T,
    anchor: NodeId,
    hints: &ContainerHints,
    cfg: &ContainerConfig,
) -> Result<ContainerScope> {

    let mut cand: Vec<HeuristicResult> = Vec::new();
    let mut trail: Vec<String> = Vec::new();

    // 0) 强提示（优先）
    cand.extend(xpath_hint::propose(tree, hints, anchor));
    cand.extend(element_id_hint::propose(tree, hints, anchor));  // ✅ 最优先: 元素ID精确定位
    cand.extend(bounds_hint::propose(tree, hints, anchor));
    cand.extend(ancestor_chain::propose(tree, hints, anchor));

    // 1) 弹层优先（如开启）
    if cfg.enable_popup_priority {
        cand.extend(popup::propose(tree, anchor));
    }

    // 2) 常规启发式
    cand.extend(scrollable::propose(tree, anchor));
    cand.extend(semantic::propose(tree, anchor));
    cand.extend(geometry::propose(tree, anchor));

    // 3) 排除明显不合格的
    cand.retain(|c| !exclusion::should_exclude(tree, cfg.max_fullscreen_ratio, c.node));

    // 4) 聚合 + 排序
    let picked = vote::aggregate_and_pick(tree, cand, anchor, cfg);

    // 5) 择优，必要时兜底
    let chosen = picked.ranked.get(0).cloned().or_else(|| {
        // 兜底：最近滚动祖先 or 根内容区
        if let Some(n) = scrollable::propose(tree, anchor).get(0).map(|h| (h.node, h.score, h.note.clone())) {
            Some((n.0, n.1, n.2))
        } else {
            Some((tree.root_id(), 0.1, "fallback_root".into()))
        }
    }).ok_or_else(|| anyhow!("no container candidate"))?;

    // 6) 审计轨迹（前 5 名）
    for (id, s, note) in picked.ranked.iter().take(5) {
        trail.push(format!("#cand id={} score={:.2} {}", id, s, note));
    }

    Ok(ContainerScope {
        root_id: chosen.0,
        reason: format!("picked score={:.2} {}", chosen.1, chosen.2),
        confidence: (chosen.1 / 2.0).clamp(0.0, 1.0), // 简单归一
        profile_used: cfg.profile,
        trail,
    })
}