// server/src/db/users.rs
// module: lead-server | layer: infrastructure | role: 用户数据库操作
// summary: 用户注册、登录、查询

use sqlx::PgPool;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: i32,
    pub username: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub nickname: Option<String>,
    pub role: Option<String>,
    pub created_at: Option<chrono::DateTime<chrono::Utc>>,
    pub updated_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewUser {
    pub username: String,
    pub password: String,
    pub nickname: Option<String>,
}

/// 创建用户
pub async fn create_user(
    pool: &PgPool,
    username: &str,
    password_hash: &str,
    nickname: Option<&str>,
) -> Result<User, sqlx::Error> {
    let user = sqlx::query_as::<_, User>(
        r#"
        INSERT INTO users (username, password_hash, nickname)
        VALUES ($1, $2, $3)
        RETURNING id, username, password_hash, nickname, role, created_at, updated_at
        "#
    )
    .bind(username)
    .bind(password_hash)
    .bind(nickname)
    .fetch_one(pool)
    .await?;
    
    Ok(user)
}

/// 根据用户名查找用户
pub async fn find_by_username(pool: &PgPool, username: &str) -> Result<Option<User>, sqlx::Error> {
    let user = sqlx::query_as::<_, User>(
        r#"
        SELECT id, username, password_hash, nickname, role, created_at, updated_at
        FROM users WHERE username = $1
        "#
    )
    .bind(username)
    .fetch_optional(pool)
    .await?;
    
    Ok(user)
}

/// 根据ID查找用户
pub async fn find_by_id(pool: &PgPool, id: i32) -> Result<Option<User>, sqlx::Error> {
    let user = sqlx::query_as::<_, User>(
        r#"
        SELECT id, username, password_hash, nickname, role, created_at, updated_at
        FROM users WHERE id = $1
        "#
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;
    
    Ok(user)
}

/// 更新用户昵称
pub async fn update_nickname(pool: &PgPool, id: i32, nickname: &str) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE users SET nickname = $1, updated_at = NOW() WHERE id = $2")
        .bind(nickname)
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

/// 检查用户名是否已存在
pub async fn username_exists(pool: &PgPool, username: &str) -> Result<bool, sqlx::Error> {
    let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users WHERE username = $1")
        .bind(username)
        .fetch_one(pool)
        .await?;
    Ok(count.0 > 0)
}
