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

pub use common::*;
pub use txt_import_records_repo::*;

// 重新导出仓储类
pub use contact_numbers_repo::ContactNumberRepository;
pub use vcf_batches_repo::VcfBatchRepository;
pub use vcf_batches::VcfBatchesRepository; // 新模块化接口
pub use import_sessions_repo::ImportSessionRepository;
pub use statistics_repo::StatisticsRepository;
pub use database_repo::DatabaseRepository;