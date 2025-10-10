pub mod common;
pub mod txt_import_records_repo;
pub mod contact_numbers;       // 新的模块化结构  
pub mod vcf_batches;          // VCF批次模块化架构

// 模块化仓储类
pub mod contact_numbers_repo;
pub mod vcf_batches_repo;
pub mod import_sessions_repo;
pub mod statistics_repo;
pub mod database_repo;


// 重新导出仓储类
 // 新模块化接口
pub use database_repo::DatabaseRepository;