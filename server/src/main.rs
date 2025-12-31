// server/src/main.rs
// module: lead-server | layer: entry | role: 服务入口
// summary: Axum Web 服务器主入口

mod config;
mod db;
mod api;

use axum::{
    routing::{get, post, put},
    Router,
};
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // 初始化日志
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "lead_server=debug,tower_http=debug".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // 加载配置
    let config = config::Config::from_env()?;
    tracing::info!("Starting lead-server on {}", config.server_addr);

    // 连接数据库
    let pool = db::create_pool(&config.database_url).await?;
    
    // 运行迁移
    db::run_migrations(&pool).await?;
    tracing::info!("Database migrations completed");

    // 构建路由
    let app = Router::new()
        // 健康检查
        .route("/health", get(|| async { "OK" }))
        // 认证 API
        .route("/api/auth/register", post(api::auth::register))
        .route("/api/auth/login", post(api::auth::login))
        .route("/api/auth/me", get(api::auth::get_current_user))
        // 设备配置 API
        .route("/api/device/:device_id/config", get(api::device::get_config))
        .route("/api/device/:device_id/config", put(api::device::update_config))
        // 评论 API
        .route("/api/comments/batch", post(api::comments::batch_upload))
        .route("/api/comments", get(api::comments::list_comments))
        // AI 配置 API
        .route("/api/ai-config/fallback", get(api::ai_config::get_fallback))
        // 统计 API
        .route("/api/stats", get(api::stats::get_stats))
        // 导出 API
        .route("/api/export/csv", get(api::stats::export_csv))
        // 共享状态
        .with_state(pool)
        // CORS
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        );

    // 启动服务器
    let listener = tokio::net::TcpListener::bind(&config.server_addr).await?;
    tracing::info!("Server listening on {}", config.server_addr);
    
    axum::serve(listener, app).await?;

    Ok(())
}
