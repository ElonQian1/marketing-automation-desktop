//! Domain aggregates for the marketing automation pipeline.

pub mod comment;
pub mod task;
pub mod ai;
pub mod device;
pub mod report;

pub use comment::{Comment, CommentId, CommentQuery, VideoContext};
pub use task::{Task, TaskId, TaskStatus, TaskAction, TaskPriority};
pub use ai::{AiClassification, AiPriority, AiRecommendation, AiReplyOption, AiIntent};
pub use device::{DeviceAccount, DeviceCapability, DeviceLoad};
pub use report::{FollowLogEntry, ReplyLogEntry, DailySummary};
