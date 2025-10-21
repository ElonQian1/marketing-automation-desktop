// src-tauri/src/services/lead_hunt.rs
// module: lead-hunt | layer: services | role: 精准获客数据管理服务
// summary: 管理评论导入、存储、回放计划生成等核心业务逻辑

use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{fs, path::PathBuf, time::{SystemTime, UNIX_EPOCH}};
use tauri::{AppHandle, Manager};
use crate::db;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RawComment {
    pub id: String,
    pub platform: String,              // "douyin" | "xhs"
    pub video_url: Option<String>,
    pub author: String,
    pub content: String,
    pub ts: Option<i64>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ReplayPlan {
    pub id: String,
    pub platform: String,
    pub video_url: String,
    pub author: String,
    pub comment: String,
    pub suggested_reply: Option<String>,
}

fn data_dir(app_handle: &AppHandle) -> anyhow::Result<PathBuf> {
    let dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| anyhow::anyhow!("Failed to get app data dir: {}", e))?;
    let p = dir.join("lead_hunt");
    fs::create_dir_all(&p)?;
    Ok(p)
}

/// 将前端 RawComment 转换为数据库 LeadComment
fn raw_comment_to_db(raw: &RawComment) -> db::lead_comments::LeadComment {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;
    
    db::lead_comments::LeadComment {
        id: raw.id.clone(),
        platform: raw.platform.clone(),
        video_url: raw.video_url.clone(),
        author: raw.author.clone(),
        content: raw.content.clone(),
        ts: raw.ts,
        created_at: now,
    }
}

/// 将数据库 LeadComment 转换为前端 RawComment
fn db_comment_to_raw(db: &db::lead_comments::LeadComment) -> RawComment {
    RawComment {
        id: db.id.clone(),
        platform: db.platform.clone(),
        video_url: db.video_url.clone(),
        author: db.author.clone(),
        content: db.content.clone(),
        ts: db.ts,
    }
}

pub fn save_comments(app_handle: &AppHandle, items: Vec<RawComment>) -> anyhow::Result<()> {
    let conn = db::get_connection(app_handle)?;
    let db_comments: Vec<_> = items.iter().map(raw_comment_to_db).collect();
    db::lead_comments::insert_batch(&conn, &db_comments)?;
    Ok(())
}

pub fn list_comments(app_handle: &AppHandle) -> anyhow::Result<Vec<RawComment>> {
    let conn = db::get_connection(app_handle)?;
    let db_comments = db::lead_comments::list_all(&conn)?;
    let raw_comments: Vec<_> = db_comments.iter().map(db_comment_to_raw).collect();
    Ok(raw_comments)
}

/// 将前端 ReplayPlan 转换为数据库 ReplayPlan
fn raw_plan_to_db(raw: &ReplayPlan) -> db::replay_plans::ReplayPlan {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;
    
    db::replay_plans::ReplayPlan {
        id: raw.id.clone(),
        comment_id: raw.id.clone(), // 临时使用相同ID，后续需要关联实际评论ID
        platform: raw.platform.clone(),
        video_url: raw.video_url.clone(),
        author: raw.author.clone(),
        comment: raw.comment.clone(),
        suggested_reply: raw.suggested_reply.clone(),
        status: "pending".to_string(),
        attempts: 0,
        error_message: None,
        created_at: now,
        updated_at: now,
    }
}

/// 将数据库 ReplayPlan 转换为前端 ReplayPlan
fn db_plan_to_raw(db: &db::replay_plans::ReplayPlan) -> ReplayPlan {
    ReplayPlan {
        id: db.id.clone(),
        platform: db.platform.clone(),
        video_url: db.video_url.clone(),
        author: db.author.clone(),
        comment: db.comment.clone(),
        suggested_reply: db.suggested_reply.clone(),
    }
}

pub fn write_replay_plan(app_handle: &AppHandle, plan: ReplayPlan) -> anyhow::Result<()> {
    let conn = db::get_connection(app_handle)?;
    let db_plan = raw_plan_to_db(&plan);
    db::replay_plans::insert(&conn, &db_plan)?;
    Ok(())
}

pub fn get_replay_plan(app_handle: &AppHandle, plan_id: &str) -> anyhow::Result<ReplayPlan> {
    let conn = db::get_connection(app_handle)?;
    let db_plan = db::replay_plans::find_by_id(&conn, plan_id)?
        .ok_or_else(|| anyhow::anyhow!("找不到计划: {}", plan_id))?;
    Ok(db_plan_to_raw(&db_plan))
}
