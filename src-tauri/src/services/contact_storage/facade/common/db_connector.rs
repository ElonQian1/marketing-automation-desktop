/// 公共数据库连接管理模块
/// 
/// 提供统一的数据库连接管理逻辑，消除facade模块间的代码重复
use tauri::AppHandle;

/// 统一的数据库连接执行器
/// 
/// 为所有facade模块提供统一的数据库连接和错误处理逻辑
/// 消除重复代码，提升维护性
pub fn with_db_connection<F, R>(app_handle: &AppHandle, operation: F) -> Result<R, String>
where
    F: FnOnce(&rusqlite::Connection) -> rusqlite::Result<R>,
{
    use crate::services::contact_storage::repositories::common::command_base::with_db_connection as base_connection;
    base_connection(app_handle, operation)
}

/// 简化的数据库操作宏
/// 
/// 进一步简化facade中的数据库操作代码
#[macro_export]
macro_rules! db_operation {
    ($app_handle:expr, $op:expr) => {
        crate::services::contact_storage::facade::common::db_connector::with_db_connection(
            $app_handle, 
            $op
        )
    };
}

/// 统一的错误转换工具
/// 
/// 将SQLite错误转换为字符串错误，提供一致的错误处理
pub fn convert_sqlite_error<T>(result: rusqlite::Result<T>) -> Result<T, String> {
    result.map_err(|e| format!("Database error: {}", e))
}

/// 批量操作执行器
/// 
/// 为批量数据库操作提供事务支持
pub fn with_transaction<F, R>(app_handle: &AppHandle, operation: F) -> Result<R, String>
where
    F: FnOnce(&rusqlite::Transaction) -> rusqlite::Result<R>,
{
    use crate::services::contact_storage::repositories::common::command_base::with_db_connection;
    
    with_db_connection(app_handle, |conn| {
        let tx = conn.unchecked_transaction()?;
        let result = operation(&tx)?;
        tx.commit()?;
        Ok(result)
    })
}