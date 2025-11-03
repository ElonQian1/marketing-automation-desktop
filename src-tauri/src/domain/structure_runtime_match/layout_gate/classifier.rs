// src-tauri/src/domain/structure_runtime_match/layout_gate/classifier.rs
// module: structure_runtime_match | layer: domain | role: 布局分类器
// summary: 根据几何特征判断布局类型（瀑布流/网格/列表等）

use crate::domain::structure_runtime_match::ports::xml_view::SmXmlView;
use crate::domain::structure_runtime_match::types::{SmBounds, SmLayoutType, SmNodeId};

pub fn classify<V: SmXmlView>(view: &V, container: SmNodeId) -> SmLayoutType {
    // 极简规则：看 container 直接子元素的列数与高度差（可逐步替换）
    let mut items: Vec<SmBounds> = view
        .children(container)
        .into_iter()
        .map(|n| view.bounds(n))
        .filter(|b| b.width() > 20 && b.height() > 20)
        .collect();

    if items.len() < 3 {
        return SmLayoutType::Unknown;
    }

    // 粗略判断：按 left 聚类（±12px）
    items.sort_by_key(|b| b.left);
    let mut cols: Vec<Vec<SmBounds>> = vec![];
    for b in items {
        if let Some(last) = cols.last_mut() {
            let mean_left = last.iter().map(|x| x.left).sum::<i32>() as f32 / last.len() as f32;
            if (b.left as f32 - mean_left).abs() <= 12.0 {
                last.push(b);
            } else {
                cols.push(vec![b]);
            }
        } else {
            cols.push(vec![b]);
        }
    }

    if cols.len() >= 2 {
        // 多列：看同列高度差是否显著
        let mut var_sum = 0.0f32;
        for col in &cols {
            if col.len() < 2 {
                continue;
            }
            let hs: Vec<f32> = col.iter().map(|b| b.height() as f32).collect();
            let m = hs.iter().sum::<f32>() / hs.len() as f32;
            let v = hs.iter().map(|h| (h - m) * (h - m)).sum::<f32>() / hs.len() as f32;
            var_sum += v;
        }
        if var_sum > 10_000.0 {
            SmLayoutType::WaterfallMulti
        } else {
            SmLayoutType::UniformGrid
        }
    } else {
        // 单列：看高度差
        let col = &cols[0];
        let (min_h, max_h) = col
            .iter()
            .map(|b| b.height())
            .fold((i32::MAX, i32::MIN), |(mn, mx), h| (mn.min(h), mx.max(h)));
        if max_h > min_h + 60 {
            SmLayoutType::MasonrySingle
        } else {
            SmLayoutType::List
        }
    }
}

pub fn geom_score_for(layout: SmLayoutType) -> f32 {
    match layout {
        SmLayoutType::WaterfallMulti => 0.9,
        SmLayoutType::MasonrySingle => 0.85,
        SmLayoutType::UniformGrid => 0.8,
        SmLayoutType::List => 0.75,
        _ => 0.5,
    }
}
