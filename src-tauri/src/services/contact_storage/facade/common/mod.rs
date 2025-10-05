/// 公共基础设施模块
/// 
/// 为facade子模块提供共享的基础功能和工具

pub mod db_connector;

// 重新导出常用功能
pub use db_connector::{with_db_connection, convert_sqlite_error, with_transaction};