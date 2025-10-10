/// Contact Storage Module - 联系人存储模块
/// 
/// 本模块实现了基于DDD架构的联系人存储系统，使用Repository Pattern + Facade Pattern
/// 提供统一的数据访问接口

pub mod models;
pub mod parser;
pub mod queries; 
pub mod commands;
pub mod repositories;
pub mod facade;
pub mod repository_facade;

// 统一的 Facade 接口

// 统一从 commands 模块导入所有命令函数
pub use commands::{
    // 基本命令
    list_contact_numbers,
    list_all_contact_number_ids,
    
    // 管理命令
    import_contact_numbers_from_file,
    import_contact_numbers_from_folder,
    
    // 获取命令
    fetch_contact_numbers,
    fetch_unclassified_contact_numbers,
    fetch_contact_numbers_by_id_range,
    fetch_contact_numbers_by_id_range_unconsumed,
    mark_contact_numbers_used_by_id_range,
    
    // 状态管理
    mark_contact_numbers_as_not_imported,
    delete_contact_numbers,
    
    // VCF批次管理 
    create_vcf_batch_cmd,
    list_vcf_batches_cmd,
    get_vcf_batch_cmd,
    create_vcf_batch_with_numbers_cmd,
    get_vcf_batch_stats_cmd,
    
    // 高级查询命令
    list_contact_numbers_by_batch_filtered,
    list_contact_numbers_without_batch,
    tag_contact_numbers_industry_by_vcf_batch,
    allocate_contact_numbers_to_device,
};
