/// Facade 子模块架构
/// 
/// 按业务职责拆分 repository_facade.rs (687行) 巨型文件
/// 提升可维护性和可扩展性

// 公共基础设施模块
pub mod common;

// 联系人号码管理门面
pub mod contact_numbers_facade;

// VCF 批次管理门面  
pub mod vcf_batches_facade;

// 导入会话管理门面
pub mod import_sessions_facade;

// TXT 导入记录管理门面
pub mod txt_import_facade;

// 数据库管理门面
pub mod database_facade;

// 重新导出所有门面，提供统一访问接口
pub use contact_numbers_facade::ContactNumbersFacade;
pub use vcf_batches_facade::VcfBatchesFacade;
pub use import_sessions_facade::ImportSessionsFacade;
pub use txt_import_facade::TxtImportFacade;
pub use database_facade::DatabaseFacade;