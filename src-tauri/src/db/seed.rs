// src-tauri/src/db/seed.rs
// module: lead-hunt | layer: infrastructure | role: 测试数据种子
// summary: 提供测试用的种子数据

use super::lead_comments::{self, LeadComment};
use super::lead_analyses::{self, LeadAnalysis};
use super::replay_plans::{self, ReplayPlan};
use rusqlite::Connection;
use std::time::{SystemTime, UNIX_EPOCH};

/// 生成测试评论数据
pub fn seed_comments(conn: &Connection) -> anyhow::Result<()> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)?
        .as_secs() as i64;
    
    let comments = vec![
        LeadComment {
            id: "seed_001".to_string(),
            platform: "douyin".to_string(),
            video_url: Some("https://v.douyin.com/test1".to_string()),
            author: "用户A".to_string(),
            content: "这个产品多少钱？看起来不错".to_string(),
            ts: Some(now - 3600),
            created_at: now - 3600,
        },
        LeadComment {
            id: "seed_002".to_string(),
            platform: "xhs".to_string(),
            video_url: Some("https://www.xiaohongshu.com/test2".to_string()),
            author: "小红薯B".to_string(),
            content: "地址在哪里？我想去实体店看看".to_string(),
            ts: Some(now - 7200),
            created_at: now - 7200,
        },
        LeadComment {
            id: "seed_003".to_string(),
            platform: "douyin".to_string(),
            video_url: Some("https://v.douyin.com/test3".to_string()),
            author: "用户C".to_string(),
            content: "之前买的有点问题，怎么退货？".to_string(),
            ts: Some(now - 1800),
            created_at: now - 1800,
        },
        LeadComment {
            id: "seed_004".to_string(),
            platform: "xhs".to_string(),
            video_url: Some("https://www.xiaohongshu.com/test4".to_string()),
            author: "小红薯D".to_string(),
            content: "这个产品有什么功能？适合什么人用？".to_string(),
            ts: Some(now - 900),
            created_at: now - 900,
        },
        LeadComment {
            id: "seed_005".to_string(),
            platform: "douyin".to_string(),
            video_url: Some("https://v.douyin.com/test5".to_string()),
            author: "用户E".to_string(),
            content: "广告勿扰，纯属浪费时间".to_string(),
            ts: Some(now - 300),
            created_at: now - 300,
        },
    ];
    
    lead_comments::insert_batch(conn, &comments)?;
    println!("[Seed] Inserted {} test comments", comments.len());
    
    Ok(())
}

/// 生成测试分析数据
pub fn seed_analyses(conn: &Connection) -> anyhow::Result<()> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)?
        .as_secs() as i64;
    
    let analyses = vec![
        LeadAnalysis {
            id: None,
            comment_id: "seed_001".to_string(),
            intent: "询价".to_string(),
            confidence: 0.95,
            entities_json: Some(r#"{"product": "产品"}"#.to_string()),
            reply_suggestion: Some("您好！这款产品目前优惠价299元，还有买二送一活动哦～".to_string()),
            tags_json: Some(r#"["高意向","价格敏感"]"#.to_string()),
            created_at: now - 3500,
        },
        LeadAnalysis {
            id: None,
            comment_id: "seed_002".to_string(),
            intent: "询地址".to_string(),
            confidence: 0.92,
            entities_json: Some(r#"{"location": "实体店"}"#.to_string()),
            reply_suggestion: Some("您好！我们在市中心有3家实体店，具体地址可以私信告诉您～".to_string()),
            tags_json: Some(r#"["本地客户","线下意向"]"#.to_string()),
            created_at: now - 7100,
        },
        LeadAnalysis {
            id: None,
            comment_id: "seed_003".to_string(),
            intent: "售后".to_string(),
            confidence: 0.88,
            entities_json: Some(r#"{}"#.to_string()),
            reply_suggestion: Some("您好，非常抱歉给您带来不便。请私信提供订单号，我们会尽快处理退货事宜。".to_string()),
            tags_json: Some(r#"["售后问题","需跟进"]"#.to_string()),
            created_at: now - 1700,
        },
        LeadAnalysis {
            id: None,
            comment_id: "seed_004".to_string(),
            intent: "咨询".to_string(),
            confidence: 0.90,
            entities_json: Some(r#"{"product": "产品功能"}"#.to_string()),
            reply_suggestion: Some("您好！这款产品主要有三大功能...适合各年龄段使用。详情可以私信了解～".to_string()),
            tags_json: Some(r#"["功能咨询","潜在客户"]"#.to_string()),
            created_at: now - 800,
        },
        LeadAnalysis {
            id: None,
            comment_id: "seed_005".to_string(),
            intent: "无效".to_string(),
            confidence: 0.98,
            entities_json: Some(r#"{}"#.to_string()),
            reply_suggestion: Some("感谢您的关注，祝您生活愉快！".to_string()),
            tags_json: Some(r#"["无效评论"]"#.to_string()),
            created_at: now - 200,
        },
    ];
    
    lead_analyses::insert_batch(conn, &analyses)?;
    println!("[Seed] Inserted {} test analyses", analyses.len());
    
    Ok(())
}

/// 生成测试回放计划
pub fn seed_replay_plans(conn: &Connection) -> anyhow::Result<()> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)?
        .as_secs() as i64;
    
    let plans = vec![
        ReplayPlan {
            id: "plan_001".to_string(),
            comment_id: "seed_001".to_string(),
            platform: "douyin".to_string(),
            video_url: "https://v.douyin.com/test1".to_string(),
            author: "用户A".to_string(),
            comment: "这个产品多少钱？看起来不错".to_string(),
            suggested_reply: Some("您好！这款产品目前优惠价299元，还有买二送一活动哦～".to_string()),
            status: "pending".to_string(),
            attempts: 0,
            error_message: None,
            created_at: now - 3400,
            updated_at: now - 3400,
        },
        ReplayPlan {
            id: "plan_002".to_string(),
            comment_id: "seed_002".to_string(),
            platform: "xhs".to_string(),
            video_url: "https://www.xiaohongshu.com/test2".to_string(),
            author: "小红薯B".to_string(),
            comment: "地址在哪里？我想去实体店看看".to_string(),
            suggested_reply: Some("您好！我们在市中心有3家实体店，具体地址可以私信告诉您～".to_string()),
            status: "done".to_string(),
            attempts: 1,
            error_message: None,
            created_at: now - 7000,
            updated_at: now - 6500,
        },
    ];
    
    replay_plans::insert(conn, &plans[0])?;
    replay_plans::insert(conn, &plans[1])?;
    println!("[Seed] Inserted {} test replay plans", plans.len());
    
    Ok(())
}

/// 运行所有种子数据
pub fn run_all(conn: &Connection) -> anyhow::Result<()> {
    println!("[Seed] Starting database seeding...");
    seed_comments(conn)?;
    seed_analyses(conn)?;
    seed_replay_plans(conn)?;
    println!("[Seed] Database seeding completed successfully");
    Ok(())
}
