// src-tauri/src/services/lead_hunt.rs
// module: lead-hunt | layer: services | role: 精准获客数据管理服务
// summary: 管理评论导入、存储、回放计划生成等核心业务逻辑

use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{fs, path::PathBuf};
use tauri::{AppHandle, Manager};

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

pub fn save_comments(app_handle: &AppHandle, items: Vec<RawComment>) -> anyhow::Result<()> {
    let p = data_dir(app_handle)?.join("comments.json");
    let mut all: Vec<RawComment> = if p.exists() {
        serde_json::from_slice(&fs::read(&p)?)?
    } else {
        vec![]
    };
    all.extend(items);
    fs::write(p, serde_json::to_vec_pretty(&all)?)?;
    Ok(())
}

pub fn list_comments(app_handle: &AppHandle) -> anyhow::Result<Vec<RawComment>> {
    let p = data_dir(app_handle)?.join("comments.json");
    if p.exists() {
        let v: Vec<RawComment> = serde_json::from_slice(&fs::read(&p)?)?;
        Ok(v)
    } else {
        Ok(vec![])
    }
}

pub fn write_replay_plan(app_handle: &AppHandle, plan: ReplayPlan) -> anyhow::Result<()> {
    let outbox = data_dir(app_handle)?.join("../../debug/outbox");
    fs::create_dir_all(&outbox)?;
    let file = outbox.join("replay_plans.json");
    let mut arr: Vec<Value> = if file.exists() {
        serde_json::from_slice(&fs::read(&file)?)?
    } else {
        vec![]
    };
    arr.push(serde_json::to_value(&plan)?);
    fs::write(file, serde_json::to_vec_pretty(&arr)?)?;
    Ok(())
}
