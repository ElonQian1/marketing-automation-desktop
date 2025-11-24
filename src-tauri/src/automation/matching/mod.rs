pub mod text;
pub mod xpath;
pub mod scorer;
pub mod strategy;
pub mod legacy;
pub mod structural;
pub mod recovery;
pub mod utils;

// Re-export common types
pub use scorer::{MatchCandidate, MultiCandidateEvaluator, EvaluationCriteria};
pub use strategy::{collect_candidate_elements, evaluate_best_candidate};
pub use recovery::attempt_element_recovery;
pub use utils::{ensure_clickable_element, calculate_center};
