// src-tauri/src/domain/structure_runtime_match/skeleton/mod.rs
// module: structure_runtime_match | layer: domain | role: 骨架规则模块
// summary: DSL规则定义/骨架检查器/谓词系统

pub mod dsl;
pub mod checker;
pub mod checker_v2;  // 🎯 新增：基于谓词的V2评估器
pub mod predicates;
