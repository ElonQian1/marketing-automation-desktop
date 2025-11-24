pub mod text;
pub mod xpath;
pub mod scorer;
pub mod strategy;
pub mod legacy;
pub mod structural;
pub mod recovery;
pub mod utils;
pub mod evaluator;
pub mod element_matching;

// Re-export common types
pub use scorer::{MatchCandidate, MultiCandidateEvaluator, EvaluationCriteria};
pub use strategy::{collect_candidate_elements, evaluate_best_candidate};
pub use recovery::{attempt_element_recovery, RecoveryResult, RecoveryContext};
pub use utils::{ensure_clickable_element, calculate_center};
pub use evaluator::{XPathEvaluationResult, EvaluationContext, evaluate_xpath_candidates};
