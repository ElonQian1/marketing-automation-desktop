/// 命令处理基础设施
/// 
/// 提供统一的数据库连接管理和错误处理模式，
/// 消除各个命令函数中的重复代码

use rusqlite::{Connection, Result as SqlResult};
use tauri::AppHandle;
use super::database::get_connection;

/// 带数据库连接的命令执行器
/// 
/// 统一处理数据库连接获取和错误转换
pub fn with_db_connection<F, R>(app_handle: &AppHandle, f: F) -> Result<R, String>
where
    F: FnOnce(&Connection) -> SqlResult<R>,
{
    let conn = get_connection(app_handle)
        .map_err(|e| format!("数据库连接失败: {}", e))?;
    
    f(&conn).map_err(|e| format!("操作失败: {}", e))
}

/// 异步命令执行器 (为未来扩展保留)
/// 
/// 当需要在命令中执行异步操作时使用
pub async fn with_db_connection_async<F, Fut, R>(
    app_handle: &AppHandle, 
    f: F
) -> Result<R, String>
where
    F: FnOnce(&Connection) -> Fut,
    Fut: std::future::Future<Output = SqlResult<R>>,
{
    let conn = get_connection(app_handle)
        .map_err(|e| format!("数据库连接失败: {}", e))?;
    
    f(&conn).await.map_err(|e| format!("操作失败: {}", e))
}

/// 错误处理辅助函数
/// 
/// 统一错误消息格式
pub fn format_db_error(context: &str, error: rusqlite::Error) -> String {
    format!("{}: {}", context, error)
}

/// 标准成功响应构建器
pub struct ResponseBuilder;

impl ResponseBuilder {
    /// 构建查询成功响应
    pub fn query_success<T>(data: T) -> Result<T, String> {
        Ok(data)
    }
    
    /// 构建操作成功响应
    pub fn operation_success(message: &str) -> Result<String, String> {
        Ok(message.to_string())
    }
    
    /// 构建标准错误响应
    pub fn error(context: &str, error: impl std::fmt::Display) -> Result<(), String> {
        Err(format!("{}: {}", context, error))
    }
}

/// 命令执行宏 - 简化常见模式
#[macro_export]
macro_rules! execute_db_command {
    ($app_handle:expr, $operation:expr) => {
        $crate::services::contact_storage::repositories::common::command_base::with_db_connection(
            &$app_handle, 
            |conn| $operation(conn)
        )
    };
    
    ($app_handle:expr, $operation:expr, $context:expr) => {
        $crate::services::contact_storage::repositories::common::command_base::with_db_connection(
            &$app_handle, 
            |conn| $operation(conn)
        ).map_err(|e| format!("{}: {}", $context, e))
    };
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_error_formatting() {
        let formatted = format_db_error(
            "测试操作", 
            rusqlite::Error::InvalidColumnName("test".to_string())
        );
        assert!(formatted.contains("测试操作"));
        assert!(formatted.contains("test"));
    }
}