use anyhow::Result;
use std::path::PathBuf;
use std::sync::Arc;

use super::repository::ProspectingRepository;
use super::types::*;

/// 精准获客服务
pub struct ProspectingService {
    repo: Arc<ProspectingRepository>,
}

impl ProspectingService {
    /// 创建新的服务实例
    pub fn new(data_dir: PathBuf) -> Result<Self> {
        let repo = Arc::new(ProspectingRepository::new(data_dir)?);
        Ok(Self { repo })
    }

    /// 初始化数据库
    pub fn init(&self) -> Result<()> {
        self.repo.init_database()
    }

    /// 保存评论
    pub fn save_comment(&self, comment: &RawComment) -> Result<()> {
        self.repo.save_comment(comment)
    }

    /// 保存分析结果
    pub fn save_analysis(&self, analysis: &AnalysisResult) -> Result<()> {
        self.repo.save_analysis(analysis)
    }

    /// 获取评论列表
    pub fn get_comments(&self, filter: &CommentFilter) -> Result<Vec<Comment>> {
        self.repo.get_comments(filter)
    }

    /// 根据ID获取评论
    pub fn get_comments_by_ids(&self, ids: &[String]) -> Result<Vec<Comment>> {
        self.repo.get_comments_by_ids(ids)
    }

    /// 保存回复计划
    pub fn save_reply_plan(&self, plan: &ReplyPlan) -> Result<()> {
        self.repo.save_reply_plan(plan)
    }

    /// 获取统计信息
    pub fn get_statistics(&self) -> Result<Statistics> {
        self.repo.get_statistics()
    }

    /// 根据评论ID列表获取回复计划
    pub fn get_reply_plans(&self, comment_ids: &[String]) -> Result<Vec<ReplyPlan>> {
        self.repo.get_reply_plans(comment_ids)
    }

    /// 根据计划ID列表获取回复计划
    pub fn get_reply_plans_by_ids(&self, ids: &[String]) -> Result<Vec<ReplyPlan>> {
        self.repo.get_reply_plans_by_ids(ids)
    }
}
