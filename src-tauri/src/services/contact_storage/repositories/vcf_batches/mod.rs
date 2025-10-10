/// VCF批次仓储模块聚合
/// 
/// 提供统一的模块访问接口，将分散的功能模块组织成一个内聚的单元

pub mod basic_operations;
pub mod batch_management;
pub mod statistics;
pub mod file_operations;

// 重新导出核心功能
pub use basic_operations::BasicOperations;
pub use batch_management::BatchManagement;
pub use statistics::Statistics;
pub use file_operations::FileOperations;

// 导入需要的类型
use rusqlite::Connection;
use crate::services::contact_storage::models::VcfBatchList;

/// VCF批次仓储统一接口
/// 
/// 将各个子模块的功能聚合到一个统一的接口中，
/// 保持与原始仓储接口的兼容性
pub struct VcfBatchesRepository;

impl VcfBatchesRepository {
    /// 获取基础操作接口
    pub fn basic_operations() -> &'static BasicOperations {
        &BasicOperations
    }

    /// 获取批次管理接口
    pub fn batch_management() -> &'static BatchManagement {
        &BatchManagement
    }

    /// 获取统计分析接口
    pub fn statistics() -> &'static Statistics {
        &Statistics
    }

    /// 获取文件操作接口
    pub fn file_operations() -> &'static FileOperations {
        &FileOperations
    }
}

// 为了向后兼容，重新导出常用方法
impl VcfBatchesRepository {
    /// 创建VCF批次（委托给基础操作模块）
    pub fn create_vcf_batch(
        conn: &Connection,
        batch_id: &str,
        description: Option<&str>,
    ) -> rusqlite::Result<bool> {
        // 调用基础操作模块，提供默认值
        BasicOperations::create_vcf_batch(conn, batch_id, "", None, None)
            .map(|_| true)
    }

    /// 获取VCF批次列表（委托给基础操作模块）
    pub fn list_vcf_batches(
        conn: &Connection,
    ) -> rusqlite::Result<VcfBatchList> {
        BasicOperations::list_vcf_batches(conn, 100, 0)
    }

    /// 获取批次统计信息（委托给统计模块）
    pub fn get_vcf_batch_stats(
        conn: &rusqlite::Connection,
        batch_id: &str,
    ) -> rusqlite::Result<crate::services::contact_storage::models::VcfBatchStatsDto> {
        Statistics::get_vcf_batch_stats(conn, batch_id)
    }

    /// 设置VCF文件路径（委托给文件操作模块）
    pub fn set_vcf_batch_file_path(
        conn: &rusqlite::Connection,
        batch_id: &str,
        file_path: &str,
    ) -> rusqlite::Result<bool> {
        FileOperations::set_vcf_batch_file_path(conn, batch_id, file_path)
    }

    /// 创建批次-号码映射（委托给批次管理模块）
    pub fn create_batch_number_mapping(
        conn: &Connection,
        batch_id: &str,
        number: &str,
    ) -> rusqlite::Result<bool> {
        BatchManagement::create_batch_number_mapping(conn, batch_id, 0, 0)
            .map(|_| true)
    }
}