pub mod commands;
pub mod models;
pub mod parser;
pub mod queries;

// 新增：模块化架构
pub mod repositories;

// 向后兼容：重新导出新模块的功能
pub use repositories::txt_import_records_repo;
pub use commands::txt_import_records;

// 统一从 commands 模块导入所有命令函数
pub use commands::{
    // 基本命令
    list_contact_numbers,
    get_contact_number_stats_cmd,
    get_distinct_industries_cmd,
    
    // 管理命令
    import_contact_numbers_from_file,
    import_contact_numbers_from_folder,
    init_contact_storage_cmd,
    get_database_info_cmd,
    cleanup_database_cmd,
    
    // contact_numbers 命令
    fetch_contact_numbers,
    fetch_unclassified_contact_numbers,
    fetch_contact_numbers_by_id_range,
    fetch_contact_numbers_by_id_range_unconsumed,
    mark_contact_numbers_used_by_id_range,
    mark_contact_numbers_as_not_imported,
    set_contact_numbers_industry_by_id_range,
    list_contact_numbers_by_batch_filtered,
    list_contact_numbers_without_batch,
    tag_contact_numbers_industry_by_vcf_batch,
    allocate_contact_numbers_to_device,
    
    // vcf_batches 命令
    create_vcf_batch_cmd,
    list_vcf_batches_cmd,
    get_vcf_batch_cmd,
    create_vcf_batch_with_numbers_cmd,
    get_industries_for_vcf_batch_cmd,
    get_vcf_batch_stats_cmd,
    
    // import_sessions 命令
    create_import_session_cmd,
    finish_import_session_cmd,
    list_import_sessions_cmd,
    get_import_session_cmd,
    delete_import_session_cmd,
    get_recent_import_sessions_cmd,
    get_import_sessions_by_device_cmd,
    get_import_sessions_by_batch_cmd,
    get_import_session_stats_cmd,
    update_import_session_industry_cmd,
    revert_import_session_to_failed_cmd,
    batch_delete_import_sessions_cmd,
    get_failed_import_sessions_cmd,
    get_successful_import_sessions_cmd,
    update_import_session_status_cmd,
    get_import_session_events_cmd,
    add_import_session_event_cmd,
    get_import_sessions_by_date_range_cmd,
    get_distinct_session_industries_cmd,
};

