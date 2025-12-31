// server/src/db/mod.rs
// module: lead-server | layer: infrastructure | role: 数据库模块入口
// summary: 数据库连接池和迁移管理

pub mod schema;
pub mod device_configs;
pub mod comments;
pub mod users;

use anyhow::Result;
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;

pub type DbPool = PgPool;

/// 创建数据库连接池
pub async fn create_pool(database_url: &str) -> Result<DbPool> {
    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(database_url)
        .await?;
    
    Ok(pool)
}

/// 运行数据库迁移
pub async fn run_migrations(pool: &DbPool) -> Result<()> {
    // 创建用户表（必须先创建，因为其他表依赖它）
    sqlx::query(schema::CREATE_USERS)
        .execute(pool)
        .await?;
    
    // 创建设备配置表
    sqlx::query(schema::CREATE_DEVICE_CONFIGS)
        .execute(pool)
        .await?;
    
    // 创建评论表
    sqlx::query(schema::CREATE_LEAD_COMMENTS)
        .execute(pool)
        .await?;
    
    // 创建分析结果表
    sqlx::query(schema::CREATE_LEAD_ANALYSES)
        .execute(pool)
        .await?;
    
    // 创建服务器配置表
    sqlx::query(schema::CREATE_SERVER_CONFIGS)
        .execute(pool)
        .await?;
    
    // 创建索引
    for index_sql in schema::INDICES {
        sqlx::query(index_sql).execute(pool).await?;
    }
    
    Ok(())
}
