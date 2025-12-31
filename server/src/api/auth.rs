// server/src/api/auth.rs
// module: lead-server | layer: api | role: 认证接口
// summary: 注册、登录、Token 验证

use axum::{
    extract::State,
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};

use crate::db::{self, users::NewUser, DbPool};

/// 注册请求
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterRequest {
    pub username: String,
    pub password: String,
    pub nickname: Option<String>,
}

/// 登录请求
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

/// 认证响应
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthResponse {
    pub success: bool,
    pub message: Option<String>,
    pub token: Option<String>,
    pub user: Option<UserInfo>,
}

/// 用户信息（不含密码）
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserInfo {
    pub id: i32,
    pub username: String,
    pub nickname: Option<String>,
    pub role: Option<String>,
}

/// 密码哈希
fn hash_password(password: &str) -> String {
    let mut hasher = Sha256::new();
    // 添加盐值
    hasher.update(b"lead-hunt-salt-2024");
    hasher.update(password.as_bytes());
    let result = hasher.finalize();
    hex::encode(result)
}

/// 生成 Token（简化版本：用户ID + 时间戳 + 签名）
fn generate_token(user_id: i32) -> String {
    let timestamp = chrono::Utc::now().timestamp();
    let payload = format!("{}:{}", user_id, timestamp);
    
    let mut hasher = Sha256::new();
    hasher.update(b"lead-hunt-token-secret");
    hasher.update(payload.as_bytes());
    let signature = hex::encode(&hasher.finalize()[..8]);
    
    // Token 格式: base64(user_id:timestamp):signature
    let encoded = base64::Engine::encode(
        &base64::engine::general_purpose::STANDARD,
        payload.as_bytes()
    );
    format!("{}:{}", encoded, signature)
}

/// 验证 Token，返回用户ID
pub fn verify_token(token: &str) -> Option<i32> {
    let parts: Vec<&str> = token.split(':').collect();
    if parts.len() != 2 {
        return None;
    }
    
    let decoded = base64::Engine::decode(
        &base64::engine::general_purpose::STANDARD,
        parts[0]
    ).ok()?;
    
    let payload = String::from_utf8(decoded).ok()?;
    let payload_parts: Vec<&str> = payload.split(':').collect();
    if payload_parts.len() != 2 {
        return None;
    }
    
    let user_id: i32 = payload_parts[0].parse().ok()?;
    let timestamp: i64 = payload_parts[1].parse().ok()?;
    
    // 验证签名
    let mut hasher = Sha256::new();
    hasher.update(b"lead-hunt-token-secret");
    hasher.update(payload.as_bytes());
    let expected_sig = hex::encode(&hasher.finalize()[..8]);
    
    if parts[1] != expected_sig {
        return None;
    }
    
    // 检查 Token 是否过期（30天）
    let now = chrono::Utc::now().timestamp();
    if now - timestamp > 30 * 24 * 3600 {
        return None;
    }
    
    Some(user_id)
}

/// POST /api/auth/register
pub async fn register(
    State(pool): State<DbPool>,
    Json(req): Json<RegisterRequest>,
) -> Result<Json<AuthResponse>, StatusCode> {
    // 验证用户名长度
    if req.username.len() < 3 || req.username.len() > 32 {
        return Ok(Json(AuthResponse {
            success: false,
            message: Some("用户名长度需要 3-32 个字符".to_string()),
            token: None,
            user: None,
        }));
    }
    
    // 验证密码长度
    if req.password.len() < 6 {
        return Ok(Json(AuthResponse {
            success: false,
            message: Some("密码长度至少 6 个字符".to_string()),
            token: None,
            user: None,
        }));
    }
    
    // 检查用户名是否已存在
    match db::users::username_exists(&pool, &req.username).await {
        Ok(true) => {
            return Ok(Json(AuthResponse {
                success: false,
                message: Some("用户名已存在".to_string()),
                token: None,
                user: None,
            }));
        }
        Err(e) => {
            tracing::error!("Database error: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
        _ => {}
    }
    
    // 创建用户
    let password_hash = hash_password(&req.password);
    match db::users::create_user(&pool, &req.username, &password_hash, req.nickname.as_deref()).await {
        Ok(user) => {
            let token = generate_token(user.id);
            tracing::info!("User registered: {} (id={})", user.username, user.id);
            
            Ok(Json(AuthResponse {
                success: true,
                message: Some("注册成功".to_string()),
                token: Some(token),
                user: Some(UserInfo {
                    id: user.id,
                    username: user.username,
                    nickname: user.nickname,
                    role: user.role,
                }),
            }))
        }
        Err(e) => {
            tracing::error!("Failed to create user: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// POST /api/auth/login
pub async fn login(
    State(pool): State<DbPool>,
    Json(req): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, StatusCode> {
    // 查找用户
    let user = match db::users::find_by_username(&pool, &req.username).await {
        Ok(Some(u)) => u,
        Ok(None) => {
            return Ok(Json(AuthResponse {
                success: false,
                message: Some("用户名或密码错误".to_string()),
                token: None,
                user: None,
            }));
        }
        Err(e) => {
            tracing::error!("Database error: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };
    
    // 验证密码
    let password_hash = hash_password(&req.password);
    if user.password_hash != password_hash {
        return Ok(Json(AuthResponse {
            success: false,
            message: Some("用户名或密码错误".to_string()),
            token: None,
            user: None,
        }));
    }
    
    // 生成 Token
    let token = generate_token(user.id);
    tracing::info!("User logged in: {} (id={})", user.username, user.id);
    
    Ok(Json(AuthResponse {
        success: true,
        message: Some("登录成功".to_string()),
        token: Some(token),
        user: Some(UserInfo {
            id: user.id,
            username: user.username,
            nickname: user.nickname,
            role: user.role,
        }),
    }))
}

/// GET /api/auth/me（需要 Token）
pub async fn get_current_user(
    State(pool): State<DbPool>,
    headers: axum::http::HeaderMap,
) -> Result<Json<AuthResponse>, StatusCode> {
    // 从 Header 获取 Token
    let token = headers
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.strip_prefix("Bearer "));
    
    let token = match token {
        Some(t) => t,
        None => {
            return Ok(Json(AuthResponse {
                success: false,
                message: Some("未提供认证 Token".to_string()),
                token: None,
                user: None,
            }));
        }
    };
    
    // 验证 Token
    let user_id = match verify_token(token) {
        Some(id) => id,
        None => {
            return Ok(Json(AuthResponse {
                success: false,
                message: Some("Token 无效或已过期".to_string()),
                token: None,
                user: None,
            }));
        }
    };
    
    // 查找用户
    match db::users::find_by_id(&pool, user_id).await {
        Ok(Some(user)) => {
            Ok(Json(AuthResponse {
                success: true,
                message: None,
                token: None,
                user: Some(UserInfo {
                    id: user.id,
                    username: user.username,
                    nickname: user.nickname,
                    role: user.role,
                }),
            }))
        }
        Ok(None) => {
            Ok(Json(AuthResponse {
                success: false,
                message: Some("用户不存在".to_string()),
                token: None,
                user: None,
            }))
        }
        Err(e) => {
            tracing::error!("Database error: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}
