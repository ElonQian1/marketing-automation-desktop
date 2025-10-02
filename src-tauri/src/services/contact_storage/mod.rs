pub mod commands;
pub mod models;
pub mod parser;
pub mod repo;
pub mod queries;

// 新增：模块化架构
pub mod repositories;

// 向后兼容：重新导出新模块的功能
pub use repositories::txt_import_records_repo;
pub use commands::txt_import_records;

// 统一从 commands 模块导入所有命令函数
pub use commands::{
    allocate_numbers_to_device_cmd,
    create_import_session_record,
    // 新增的批次和导入会话相关函数
    create_vcf_batch_record,
    // VCF批次会话映射相关
    create_vcf_batch_with_numbers_cmd,
    fetch_contact_numbers,
    fetch_contact_numbers_by_id_range,
    fetch_contact_numbers_by_id_range_unconsumed,
    fetch_unclassified_contact_numbers,
    finish_import_session_record,
    // 统计与行业设置
    get_contact_number_stats_cmd,
    get_distinct_industries_cmd,
    get_vcf_batch_record,
    import_contact_numbers_from_file,
    import_contact_numbers_from_folder,
    list_contact_numbers,
    list_import_session_records,
    list_numbers_by_vcf_batch,
    list_numbers_by_vcf_batch_filtered,
    list_numbers_for_vcf_batch_cmd,
    list_numbers_without_vcf_batch,
    list_vcf_batch_records,
    mark_contact_numbers_used_by_id_range,
    mark_contact_numbers_as_not_imported,
    set_contact_numbers_industry_by_id_range,
    tag_numbers_industry_by_vcf_batch_cmd,
    list_import_session_events_cmd,
    list_all_contact_number_ids,
    // TXT导入记录管理命令（新模块化接口）
    list_txt_import_records_cmd,
    delete_txt_import_record_cmd,
    // 会话管理增强命令
    update_import_session_industry_cmd,
    revert_import_session_to_failed_cmd,
    delete_import_session_cmd,
};

