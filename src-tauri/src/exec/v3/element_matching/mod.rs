// src-tauri/src/exec/v3/element_matching/mod.rs
// module: v3-execution | layer: matching | role: 元素匹配核心模块
// summary: 多候选评估、XPath匹配、空间距离计算、Bounds模糊匹配、XPath相似度

pub mod multi_candidate_evaluator;
pub mod xpath_matcher;
pub mod spatial_distance;
pub mod text_comparator;
pub mod bounds_matcher;
pub mod xpath_similarity_matcher;

pub use multi_candidate_evaluator::{MultiCandidateEvaluator, EvaluationCriteria};
