// src-tauri/src/services/prospecting/storage.rs
use anyhow::Result;
use rusqlite::{Connection, params};
use serde_json;
use std::path::PathBuf;
// use chrono::Utc;

use super::types::*;

/// 精准获客数据存储服务
pub struct ProspectingStorage {
    db_path: PathBuf,
}

impl ProspectingStorage {
    /// 创建新的存储服务实例
    pub fn new(data_dir: PathBuf) -> Result<Self> {
        let db_path = data_dir.join("prospecting.db");
        let storage = Self { db_path };
        storage.init_database()?;
        Ok(storage)
    }

    /// 初始化数据库表结构
    pub fn init_database(&self) -> Result<()> {
        let conn = Connection::open(&self.db_path)?;
        
        // 创建评论表
        conn.execute(
            r#"
            CREATE TABLE IF NOT EXISTS comments (
                id TEXT PRIMARY KEY,
                platform TEXT NOT NULL,
                video_url TEXT,
                author TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp INTEGER,
                avatar_url TEXT,
                like_count INTEGER,
                metadata TEXT,
                created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
            )
            "#,
            [],
        )?;

        // 创建分析结果表
        conn.execute(
            r#"
            CREATE TABLE IF NOT EXISTS analysis_results (
                comment_id TEXT PRIMARY KEY,
                intent TEXT NOT NULL,
                confidence REAL NOT NULL,
                entities TEXT NOT NULL,
                suggested_reply TEXT NOT NULL,
                tags TEXT NOT NULL,
                analyzed_at INTEGER NOT NULL,
                FOREIGN KEY (comment_id) REFERENCES comments (id) ON DELETE CASCADE
            )
            "#,
            [],
        )?;

        // 创建回复计划表
        conn.execute(
            r#"
            CREATE TABLE IF NOT EXISTS reply_plans (
                id TEXT PRIMARY KEY,
                comment_id TEXT NOT NULL,
                platform TEXT NOT NULL,
                video_url TEXT NOT NULL,
                target_author TEXT NOT NULL,
                target_comment TEXT NOT NULL,
                reply_content TEXT NOT NULL,
                steps TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                executed_at INTEGER,
                completed_at INTEGER,
                error TEXT,
                is_simulation BOOLEAN NOT NULL DEFAULT 1,
                FOREIGN KEY (comment_id) REFERENCES comments (id) ON DELETE CASCADE
            )
            "#,
            [],
        )?;

        // 创建回复记录表
        conn.execute(
            r#"
            CREATE TABLE IF NOT EXISTS reply_records (
                comment_id TEXT PRIMARY KEY,
                replied_at INTEGER NOT NULL,
                actual_reply TEXT NOT NULL,
                plan_id TEXT,
                FOREIGN KEY (comment_id) REFERENCES comments (id) ON DELETE CASCADE,
                FOREIGN KEY (plan_id) REFERENCES reply_plans (id) ON DELETE SET NULL
            )
            "#,
            [],
        )?;

        Ok(())
    }

    /// 保存评论
    pub fn save_comment(&self, comment: &RawComment) -> Result<()> {
        let conn = Connection::open(&self.db_path)?;
        
        let metadata_json = comment.metadata.as_ref()
            .map(|m| serde_json::to_string(m).unwrap_or_default())
            .unwrap_or_default();

        conn.execute(
            r#"
            INSERT OR REPLACE INTO comments 
            (id, platform, video_url, author, content, timestamp, avatar_url, like_count, metadata)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
            "#,
            params![
                comment.id,
                serde_json::to_string(&comment.platform)?,
                comment.video_url,
                comment.author,
                comment.content,
                comment.timestamp,
                comment.avatar_url,
                comment.like_count,
                metadata_json,
            ],
        )?;

        Ok(())
    }

    /// 保存分析结果
    pub fn save_analysis(&self, analysis: &AnalysisResult) -> Result<()> {
        let conn = Connection::open(&self.db_path)?;
        
        conn.execute(
            r#"
            INSERT OR REPLACE INTO analysis_results 
            (comment_id, intent, confidence, entities, suggested_reply, tags, analyzed_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
            "#,
            params![
                analysis.comment_id,
                serde_json::to_string(&analysis.intent)?,
                analysis.confidence,
                serde_json::to_string(&analysis.entities)?,
                analysis.suggested_reply,
                serde_json::to_string(&analysis.tags)?,
                analysis.analyzed_at,
            ],
        )?;

        Ok(())
    }

    /// 获取评论列表
    pub fn get_comments(&self, filter: &CommentFilter) -> Result<Vec<Comment>> {
        let conn = Connection::open(&self.db_path)?;
        
        let mut sql = r#"
            SELECT 
                c.id, c.platform, c.video_url, c.author, c.content, c.timestamp, 
                c.avatar_url, c.like_count, c.metadata,
                a.intent, a.confidence, a.entities, a.suggested_reply, a.tags, a.analyzed_at,
                r.replied_at, r.actual_reply
            FROM comments c
            LEFT JOIN analysis_results a ON c.id = a.comment_id
            LEFT JOIN reply_records r ON c.id = r.comment_id
            WHERE 1=1
        "#.to_string();
        
        // 直接构建带参数的查询
        if let Some(platform) = &filter.platform {
            sql.push_str(" AND c.platform = '");
            sql.push_str(&serde_json::to_string(platform)?);
            sql.push_str("'");
        }
        
        if let Some(intent) = &filter.intent {
            sql.push_str(" AND a.intent = '");
            sql.push_str(&serde_json::to_string(intent)?);
            sql.push_str("'");
        }
        
        if let Some(has_analysis) = filter.has_analysis {
            if has_analysis {
                sql.push_str(" AND a.comment_id IS NOT NULL");
            } else {
                sql.push_str(" AND a.comment_id IS NULL");
            }
        }
        
        sql.push_str(" ORDER BY c.timestamp DESC");
        
        let mut stmt = conn.prepare(&sql)?;
        let comment_iter = stmt.query_map([], |row| {
            let metadata_str: String = row.get(8).unwrap_or_default();
            let metadata = if metadata_str.is_empty() {
                None
            } else {
                serde_json::from_str(&metadata_str).ok()
            };

            let analysis = if let Ok(intent_str) = row.get::<_, String>(9) {
                let entities_str: String = row.get(11)?;
                let tags_str: String = row.get(13)?;
                
                Some(AnalysisResult {
                    comment_id: row.get(0)?,
                    intent: serde_json::from_str(&intent_str).unwrap_or(IntentType::Invalid),
                    confidence: row.get(10)?,
                    entities: serde_json::from_str(&entities_str).unwrap_or_default(),
                    suggested_reply: row.get(12)?,
                    tags: serde_json::from_str(&tags_str).unwrap_or_default(),
                    analyzed_at: row.get(14)?,
                })
            } else {
                None
            };

            let (is_replied, replied_at, actual_reply) = if let Ok(replied_at) = row.get::<_, i64>(15) {
                (Some(true), Some(replied_at), row.get(16).ok())
            } else {
                (Some(false), None, None)
            };

            Ok(Comment {
                raw: RawComment {
                    id: row.get(0)?,
                    platform: serde_json::from_str(&row.get::<_, String>(1)?).unwrap_or(SocialPlatform::Douyin),
                    video_url: row.get(2)?,
                    author: row.get(3)?,
                    content: row.get(4)?,
                    timestamp: row.get(5)?,
                    avatar_url: row.get(6)?,
                    like_count: row.get(7)?,
                    metadata,
                },
                analysis,
                is_replied,
                replied_at,
                actual_reply,
            })
        })?;

        let mut comments = Vec::new();
        for comment in comment_iter {
            comments.push(comment?);
        }

        Ok(comments)
    }

    /// 根据ID获取评论
    pub fn get_comments_by_ids(&self, ids: &[String]) -> Result<Vec<Comment>> {
        if ids.is_empty() {
            return Ok(Vec::new());
        }

        let conn = Connection::open(&self.db_path)?;
        
        // 直接在 SQL 中插入 ID 值，避免参数绑定问题
        let id_list = ids.iter()
            .map(|id| format!("'{}'", id.replace("'", "''"))) // 防 SQL 注入
            .collect::<Vec<_>>()
            .join(",");
            
        let sql = format!(
            r#"
            SELECT 
                c.id, c.platform, c.video_url, c.author, c.content, c.timestamp, 
                c.avatar_url, c.like_count, c.metadata,
                a.intent, a.confidence, a.entities, a.suggested_reply, a.tags, a.analyzed_at,
                r.replied_at, r.actual_reply
            FROM comments c
            LEFT JOIN analysis_results a ON c.id = a.comment_id
            LEFT JOIN reply_records r ON c.id = r.comment_id
            WHERE c.id IN ({})
            ORDER BY c.timestamp DESC
            "#,
            id_list
        );
        
        let mut stmt = conn.prepare(&sql)?;
        let comment_iter = stmt.query_map([], |row| {
            // 同上面的解析逻辑...
            let metadata_str: String = row.get(8).unwrap_or_default();
            let metadata = if metadata_str.is_empty() {
                None
            } else {
                serde_json::from_str(&metadata_str).ok()
            };

            let analysis = if let Ok(intent_str) = row.get::<_, String>(9) {
                let entities_str: String = row.get(11)?;
                let tags_str: String = row.get(13)?;
                
                Some(AnalysisResult {
                    comment_id: row.get(0)?,
                    intent: serde_json::from_str(&intent_str).unwrap_or(IntentType::Invalid),
                    confidence: row.get(10)?,
                    entities: serde_json::from_str(&entities_str).unwrap_or_default(),
                    suggested_reply: row.get(12)?,
                    tags: serde_json::from_str(&tags_str).unwrap_or_default(),
                    analyzed_at: row.get(14)?,
                })
            } else {
                None
            };

            let (is_replied, replied_at, actual_reply) = if let Ok(replied_at) = row.get::<_, i64>(15) {
                (Some(true), Some(replied_at), row.get(16).ok())
            } else {
                (Some(false), None, None)
            };

            Ok(Comment {
                raw: RawComment {
                    id: row.get(0)?,
                    platform: serde_json::from_str(&row.get::<_, String>(1)?).unwrap_or(SocialPlatform::Douyin),
                    video_url: row.get(2)?,
                    author: row.get(3)?,
                    content: row.get(4)?,
                    timestamp: row.get(5)?,
                    avatar_url: row.get(6)?,
                    like_count: row.get(7)?,
                    metadata,
                },
                analysis,
                is_replied,
                replied_at,
                actual_reply,
            })
        })?;

        let mut comments = Vec::new();
        for comment in comment_iter {
            comments.push(comment?);
        }

        Ok(comments)
    }

    /// 保存回复计划
    pub fn save_reply_plan(&self, plan: &ReplyPlan) -> Result<()> {
        let conn = Connection::open(&self.db_path)?;
        
        conn.execute(
            r#"
            INSERT OR REPLACE INTO reply_plans 
            (id, comment_id, platform, video_url, target_author, target_comment, 
             reply_content, steps, status, created_at, updated_at, executed_at, 
             completed_at, error, is_simulation)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)
            "#,
            params![
                plan.id,
                plan.comment_id,
                serde_json::to_string(&plan.platform)?,
                plan.video_url,
                plan.target_author,
                plan.target_comment,
                plan.reply_content,
                serde_json::to_string(&plan.steps)?,
                serde_json::to_string(&plan.status)?,
                plan.created_at,
                plan.updated_at,
                plan.executed_at,
                plan.completed_at,
                plan.error,
                plan.is_simulation,
            ],
        )?;

        Ok(())
    }

    /// 获取统计信息
    pub fn get_statistics(&self) -> Result<Statistics> {
        let conn = Connection::open(&self.db_path)?;
        
        // 总评论数
        let total_comments: i64 = conn.query_row(
            "SELECT COUNT(*) FROM comments",
            [],
            |row| row.get(0),
        )?;
        
        // 已分析评论数
        let analyzed_comments: i64 = conn.query_row(
            "SELECT COUNT(*) FROM analysis_results",
            [],
            |row| row.get(0),
        )?;
        
        // 意图分布
        let mut intent_distribution = std::collections::HashMap::new();
        let mut stmt = conn.prepare("SELECT intent, COUNT(*) FROM analysis_results GROUP BY intent")?;
        let intent_iter = stmt.query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
        })?;
        
        for result in intent_iter {
            let (intent, count) = result?;
            // 解析JSON中的意图名称
            if let Ok(intent_type) = serde_json::from_str::<IntentType>(&intent) {
                let intent_name = match intent_type {
                    IntentType::Inquiry => "询价",
                    IntentType::Location => "询地址",
                    IntentType::AfterSales => "售后",
                    IntentType::Consultation => "咨询",
                    IntentType::Purchase => "购买",
                    IntentType::Comparison => "比较",
                    IntentType::Invalid => "无效",
                };
                intent_distribution.insert(intent_name.to_string(), count);
            }
        }
        
        // 平台分布
        let mut platform_distribution = std::collections::HashMap::new();
        let mut stmt = conn.prepare("SELECT platform, COUNT(*) FROM comments GROUP BY platform")?;
        let platform_iter = stmt.query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
        })?;
        
        for result in platform_iter {
            let (platform, count) = result?;
            if let Ok(platform_type) = serde_json::from_str::<SocialPlatform>(&platform) {
                let platform_name = match platform_type {
                    SocialPlatform::Douyin => "抖音",
                    SocialPlatform::Xhs => "小红书",
                    SocialPlatform::Weibo => "微博",
                    SocialPlatform::Kuaishou => "快手",
                };
                platform_distribution.insert(platform_name.to_string(), count);
            }
        }
        
        // 回复计划统计
        let total_plans: i64 = conn.query_row("SELECT COUNT(*) FROM reply_plans", [], |row| row.get(0))?;
        let completed_plans: i64 = conn.query_row(
            "SELECT COUNT(*) FROM reply_plans WHERE status = ?", 
            [serde_json::to_string(&ReplyPlanStatus::Completed)?], 
            |row| row.get(0)
        )?;
        let failed_plans: i64 = conn.query_row(
            "SELECT COUNT(*) FROM reply_plans WHERE status = ?", 
            [serde_json::to_string(&ReplyPlanStatus::Failed)?], 
            |row| row.get(0)
        )?;
        let pending_plans: i64 = conn.query_row(
            "SELECT COUNT(*) FROM reply_plans WHERE status = ?", 
            [serde_json::to_string(&ReplyPlanStatus::Pending)?], 
            |row| row.get(0)
        )?;
        
        Ok(Statistics {
            total_comments,
            analyzed_comments,
            intent_distribution,
            platform_distribution,
            reply_plans: ReplyPlanStats {
                total: total_plans,
                completed: completed_plans,
                failed: failed_plans,
                pending: pending_plans,
            },
        })
    }

    /// 根据评论ID列表获取回复计划
    pub fn get_reply_plans(&self, comment_ids: &[String]) -> Result<Vec<ReplyPlan>> {
        if comment_ids.is_empty() {
            return Ok(vec![]);
        }

        let conn = Connection::open(&self.db_path)?;
        let placeholders = comment_ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");
        let sql = format!("SELECT * FROM reply_plans WHERE comment_id IN ({})", placeholders);
        
        let mut stmt = conn.prepare(&sql)?;
        let params: Vec<&dyn rusqlite::ToSql> = comment_ids.iter().map(|s| s as &dyn rusqlite::ToSql).collect();
        
        let plan_iter = stmt.query_map(&params[..], |row| {
            let steps_json: String = row.get(9)?;
            let steps: Vec<ReplyStep> = serde_json::from_str(&steps_json).unwrap_or_default();
            
            Ok(ReplyPlan {
                id: row.get(0)?,
                comment_id: row.get(1)?,
                platform: serde_json::from_str(&row.get::<_, String>(2)?).unwrap(),
                video_url: row.get(3)?,
                target_author: row.get(4)?,
                target_comment: row.get(5)?,
                reply_content: row.get(6)?,
                steps,
                status: serde_json::from_str(&row.get::<_, String>(7)?).unwrap(),
                created_at: row.get(8)?,
                updated_at: row.get(10)?,
                executed_at: row.get(11)?,
                completed_at: row.get(12)?,
                error: row.get(13)?,
                is_simulation: row.get(14)?,
            })
        })?;

        plan_iter.collect::<Result<Vec<_>, _>>().map_err(|e| anyhow::anyhow!(e))
    }

    /// 根据计划ID列表获取回复计划
    pub fn get_reply_plans_by_ids(&self, ids: &[String]) -> Result<Vec<ReplyPlan>> {
        if ids.is_empty() {
            return Ok(vec![]);
        }

        let conn = Connection::open(&self.db_path)?;
        let placeholders = ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");
        let sql = format!("SELECT * FROM reply_plans WHERE id IN ({})", placeholders);
        
        let mut stmt = conn.prepare(&sql)?;
        let params: Vec<&dyn rusqlite::ToSql> = ids.iter().map(|s| s as &dyn rusqlite::ToSql).collect();
        
        let plan_iter = stmt.query_map(&params[..], |row| {
            let steps_json: String = row.get(9)?;
            let steps: Vec<ReplyStep> = serde_json::from_str(&steps_json).unwrap_or_default();
            
            Ok(ReplyPlan {
                id: row.get(0)?,
                comment_id: row.get(1)?,
                platform: serde_json::from_str(&row.get::<_, String>(2)?).unwrap(),
                video_url: row.get(3)?,
                target_author: row.get(4)?,
                target_comment: row.get(5)?,
                reply_content: row.get(6)?,
                steps,
                status: serde_json::from_str(&row.get::<_, String>(7)?).unwrap(),
                created_at: row.get(8)?,
                updated_at: row.get(10)?,
                executed_at: row.get(11)?,
                completed_at: row.get(12)?,
                error: row.get(13)?,
                is_simulation: row.get(14)?,
            })
        })?;

        plan_iter.collect::<Result<Vec<_>, _>>().map_err(|e| anyhow::anyhow!(e))
    }
}