// src-tauri/src/domain/structure_runtime_match/scoring/weights.rs
// module: structure_runtime_match | layer: domain | role: 权重配置
// summary: 根据模式（Speed/Default/Robust）返回各维度权重

use crate::domain::structure_runtime_match::config::SmMode;

#[derive(Clone, Copy)]
pub struct SmWeights {
    pub geom: f32,
    pub tpl: f32,
    pub skeleton: f32,
    pub subtree: f32, // 🎯 新增
    pub field: f32,
}

pub fn weights_for(mode: &SmMode) -> SmWeights {
    match mode {
        SmMode::Speed => SmWeights {
            geom: 0.15,
            tpl: 0.0,
            skeleton: 0.45,
            subtree: 0.10,
            field: 0.30,
        },
        SmMode::Default => SmWeights {
            geom: 0.15,
            tpl: 0.20,
            skeleton: 0.25,
            subtree: 0.25,
            field: 0.15,
        },
        SmMode::Robust => SmWeights {
            geom: 0.15,
            tpl: 0.15,
            skeleton: 0.20,
            subtree: 0.40,
            field: 0.10,
        },
    }
}
