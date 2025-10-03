/// 联系人号码仓储模块
/// 
/// 按业务职责拆分原有的单体仓储文件，提升可维护性和可扩展性

// 基础CRUD操作
pub mod basic_operations;

// 统计和查询
pub mod statistics;

// 批次管理
pub mod batch_management;

// 状态管理
pub mod status_management;

// 复杂查询和过滤
pub mod advanced_queries;

// 对外统一接口（保持向后兼容）
pub use basic_operations::*;
pub use statistics::*;
pub use batch_management::*;
pub use status_management::*;
pub use advanced_queries::*;