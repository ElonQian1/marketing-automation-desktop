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
    import_contact_numbers_from_txt_cmd,
    init_contact_storage_cmd,
    get_database_info_cmd,
    cleanup_database_cmd,
};

