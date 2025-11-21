// src-tauri/src/commands/run_step_v2/types/mod.rs
// module: step-execution | layer: types | role: 模块入口
// summary: 步骤执行类型定义模块 - 请求、响应、策略、选择器等数据契约

pub mod request;
pub mod response;
pub mod strategy;
pub mod selector;
pub mod evidence;

// ========== 核心类型重导出 ==========

// Request 类型

// Response 类型

// Strategy 类型
pub use strategy::{
    DecisionChainPlan,
    StrategyVariant,
    VariantKind,
    StructuralSignatures,
    LightCheck,
};

// Selector 类型
pub use selector::{
    VariantSelectors,
    SelfSelector,
};

// Evidence 类型
pub use evidence::{
    StaticEvidence,
};
