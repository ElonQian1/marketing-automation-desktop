//! Service layer traits orchestrating the automation pipeline.

pub mod ingest;
pub mod task;
pub mod ai;
pub mod reporting;

pub use ingest::{CommentIngestService, IngestCommand, IngestOutcome};
pub use task::{TaskAssignmentService, TaskLifecycleService, TaskQueryService};
pub use ai::{AiDispatcher, AiRequest, AiResponse};
pub use reporting::{ReportingService, ReportRequest, ReportType};
