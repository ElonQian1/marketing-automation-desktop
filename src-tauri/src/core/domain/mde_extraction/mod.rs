// src-tauri/src/core/domain/mde_extraction/mod.rs
// module: core/domain/mde_extraction | layer: domain | role: module-entry
// summary: MDE 数据提取模块 - 统一导出接口

//! # MDE 数据提取模块 (MCP Data Extraction)
//!
//! 本模块提供通用的移动端APP数据提取能力，设计目标：
//!
//! - **跨APP通用**：支持抖音、小红书、快手等任意APP
//! - **规则驱动**：通过 JSON 配置定义提取规则，无需修改代码
//! - **智能降级**：规则匹配失败时可调用 AI 视觉分析
//!
//! ## 核心类型
//!
//! - [`MdeDataType`] - 数据类型枚举（评论/商品/用户等）
//! - [`MdeExtractedItem`] - 单条提取结果
//! - [`MdeExtractionResult`] - 完整提取结果
//!
//! ## 选择器系统
//!
//! - [`MdeSelector`] - 元素选择器（支持精确/模糊/组合匹配）
//! - [`MdeSelectorMatcher`] - 选择器匹配器
//! - [`MdeSelectorCandidates`] - 候选选择器列表
//!
//! ## 规则系统
//!
//! - [`MdeFieldRule`] - 字段提取规则
//! - [`MdePageRule`] - 页面提取规则
//! - [`MdeAppRule`] - APP 级别规则
//! - [`MdeRuleRepository`] - 规则仓库
//!
//! ## 示例
//!
//! ```rust,ignore
//! use mde_extraction::*;
//!
//! // 创建抖音评论规则
//! let rule = MdeAppRule::new("com.ss.android.ugc.aweme", "抖音")
//!     .with_page_rule(MdePageRule {
//!         page_type: MdePageType::CommentSection,
//!         data_type: MdeDataType::Comments,
//!         // ... 其他配置
//!     });
//! ```

// === 子模块 ===
mod mde_data_types;
mod mde_selector;
mod mde_rule;

// === 数据类型导出 ===
pub use mde_data_types::{
    MdeDataType,
    MdeFieldValue,
    MdeExtractedItem,
    MdeExtractionMethod,
    MdeAppInfo,
    MdePageType,
    MdeExtractionResult,
    MdePageDetectionResult,
};

// === 选择器导出 ===
pub use mde_selector::{
    MdeSelector,
    MdeNodeAttributes,
    MdeSelectorMatcher,
    MdeSelectorCandidates,
    MdeSelectorWithWeight,
};

// === 规则导出 ===
pub use mde_rule::{
    MdeFieldRule,
    MdeExtractSource,
    MdePostProcess,
    MdePageRule,
    MdePaginationRule,
    MdeScrollDirection,
    MdeAppRule,
    MdeVersionRange,
    MdeRuleRepository,
};
