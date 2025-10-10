use std::sync::Arc;

use crate::automation::domain::{
    AiRecommendation, Comment, CommentId, TaskAction, TaskId, TaskPriority, TaskStatus,
};
use crate::automation::services::{
    AiDispatcher, AiRequest, CommentIngestService, IngestCommand, TaskLifecycleService,
};
use chrono::Utc;
use tracing::{info, instrument};

/// Coordinates ingestion, AI enrichment and task creation.
pub struct TaskScheduler<I, L, A>
where
    I: CommentIngestService + 'static,
    L: TaskLifecycleService + 'static,
    A: AiDispatcher + 'static,
{
    ingest_service: Arc<I>,
    lifecycle_service: Arc<L>,
    ai_dispatcher: Arc<A>,
}

impl<I, L, A> TaskScheduler<I, L, A>
where
    I: CommentIngestService + 'static,
    L: TaskLifecycleService + 'static,
    A: AiDispatcher + 'static,
{
    pub fn new(
        ingest_service: Arc<I>,
        lifecycle_service: Arc<L>,
        ai_dispatcher: Arc<A>,
    ) -> Self {
        Self {
            ingest_service,
            lifecycle_service,
            ai_dispatcher,
        }
    }

    #[instrument(skip(self, comments))]
    pub async fn process_comment_batch(
        &self,
        batch_id: String,
        comments: Vec<Comment>,
    ) -> anyhow::Result<Vec<CommentId>> {
        let command = IngestCommand {
            batch_id: batch_id.clone(),
            comments,
            deduplicate: true,
            source: "keyword-monitor".to_string(),
        };

        let outcome = self.ingest_service.ingest(command).await?;
        info!(
            accepted = outcome.accepted.len(),
            rejected = outcome.rejected.len(),
            batch_id = batch_id.as_str(),
            "Ingested comment batch"
        );
        Ok(outcome.accepted)
    }

    #[instrument(skip(self, recommendation))]
    pub async fn attach_recommendation(
        &self,
        task_id: &TaskId,
        recommendation: AiRecommendation,
    ) -> anyhow::Result<()> {
        self.lifecycle_service
            .attach_ai_recommendation(task_id, recommendation)
            .await
    }

    #[instrument(skip(self, comment))]
    pub async fn enrich_task_with_ai(
        &self,
        task_id: TaskId,
        comment: Comment,
    ) -> anyhow::Result<AiRecommendation> {
        let request = AiRequest {
            task_id: task_id.clone(),
            comment,
            knowledge_snippets: Vec::new(),
        };

        let response = self.ai_dispatcher.process(request).await?;
        self.lifecycle_service
            .update_status(&task_id, TaskStatus::AiEnriched, None)
            .await?;
        Ok(response.recommendation)
    }

    #[instrument(skip(self))]
    pub async fn create_task_for_comment(
        &self,
        comment_id: CommentId,
        action: TaskAction,
    ) -> anyhow::Result<TaskId> {
        let task_id = self
            .lifecycle_service
            .create_from_comment(comment_id, action)
            .await?;
        self.lifecycle_service
            .update_status(&task_id, TaskStatus::Queued, None)
            .await?;
        Ok(task_id)
    }

    pub async fn mark_priority(
        &self,
        task_id: &TaskId,
        priority: TaskPriority,
    ) -> anyhow::Result<()> {
        self.lifecycle_service
            .attach_ai_recommendation(
                task_id,
                AiRecommendation {
                    classification: crate::automation::domain::AiClassification {
                        intent: crate::automation::domain::AiIntent::Other,
                        sentiment: 0,
                        needs_follow_up: false,
                        language: None,
                    },
                    priority: crate::automation::domain::AiPriority {
                        score: match priority {
                            TaskPriority::P0 => 100,
                            TaskPriority::P1 => 80,
                            TaskPriority::P2 => 50,
                            TaskPriority::P3 => 20,
                        },
                        reason: Some("Manual override".into()),
                    },
                    action: "manual".into(),
                    confidence: Some(1.0),
                    reply_options: Vec::new(),
                    alerts: Vec::new(),
                    model: "manual".into(),
                },
            )
            .await
    }

    /// Placeholder scheduler loop to be wired with a background task.
    pub async fn run_once(&self) -> anyhow::Result<()> {
        info!("TaskScheduler::run_once executed at {}", Utc::now());
        Ok(())
    }
}
