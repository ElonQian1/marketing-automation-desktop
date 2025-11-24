// src-tauri/src/exec/v3/helpers/mod.rs
// module: exec/v3/helpers | layer: infrastructure | role: 子模块聚合
// summary: 统一导出所有辅助功能模块


pub use crate::automation::analysis::intelligent as intelligent_analysis;
pub use crate::automation::pipeline::protocol as protocol_builders;
pub use crate::automation::analysis::strategy_gen as strategy_generation;
pub use crate::automation::analysis::optimization as step_optimization;
pub use crate::automation::pipeline::tracker as execution_tracker;
pub use crate::automation::adapters::device as device_manager;
pub use crate::automation::analysis::utils as analysis_helpers;
pub use crate::automation::analysis::scoring as step_scoring;
pub use crate::automation::pipeline::phases as phase_handlers;
pub use crate::automation::analysis::preprocessing as intelligent_preprocessing;
pub use crate::automation::analysis::hierarchy as element_hierarchy_analyzer;
pub use crate::automation::pipeline::batch as batch_executor;  // 🆕 批量执行引擎
pub use crate::automation::adapters::xml_source as xml_source_resolver;  // 🎯 XML数据源三级降级解析器

// 统一导出常用类型和函数
pub use element_hierarchy_analyzer::*;
  // 🆕 批量执行引擎
  // 🎯 XML数据源解析器


