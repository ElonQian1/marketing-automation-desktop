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
pub use request::{
    StepExecRequest,
    StepExecMode,
    BatchConfig,
    VerificationConfig,
};

// Response 类型
pub use response::{
    StepExecResponse,
    MatchResult,
    Bounds,
    ExecutionInfo,
    MatchInfo,
    StepExecutionResult,
};

// Strategy 类型
pub use strategy::{
    DecisionChainPlan,
    StrategyConfig,
    StaticAnalysisContext,
    StrategyVariant,
    VariantKind,
    ChildAnchor,
    StructuralSignatures,
    BoundsSignature,
    StructureHint,
    IndexHint,
    LightCheck,
};

// Selector 类型
pub use selector::{
    ElementSelector,
    VariantSelectors,
    ParentSelector,
    ChildSelector,
    SelfSelector,
    TextMatcher,
    ElementSelectors,
    GeometricAids,
    ValidationAndFallback,
    ActionSpec,
    SafetyThresholds,
    StructuredSelector,
    ScreenInfo,
    ContainerAnchor,
    ClickableParentHint,
};

// Evidence 类型
pub use evidence::{
    StaticEvidence,
};
