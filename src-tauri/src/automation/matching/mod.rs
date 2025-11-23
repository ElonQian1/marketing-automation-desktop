pub mod text;
pub mod xpath;
pub mod scorer;
pub mod strategy;

// Re-export common types
pub use scorer::{MatchCandidate, MultiCandidateEvaluator, EvaluationCriteria};
pub use strategy::{collect_candidate_elements, evaluate_best_candidate};
