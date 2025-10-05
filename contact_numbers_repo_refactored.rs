use rusqlite::{Connection, Result as SqliteResult};
use super::common::database::log_database_error;

use crate::services::contact_storage::models::{ContactNumberDto, ContactNumberList};

// 引入子模块化功能
pub use super::contact_numbers::{
    insert_numbers as insert_numbers_submodule,
    list_numbers as list_numbers_submodule,
    get_number_by_id as get_number_by_id_submodule,
    fetch_numbers_by_id_range as fetch_numbers_by_id_range_submodule,
    get_contact_number_stats as get_contact_number_stats_submodule,
    get_distinct_industries as get_distinct_industries_submodule,
    mark_numbers_used_by_id_range as mark_numbers_used_by_id_range_submodule,
    allocate_numbers_to_device as allocate_numbers_to_device_submodule,
    set_industry_by_id_range as set_industry_by_id_range_submodule,
    tag_numbers_industry_by_vcf_batch as tag_numbers_industry_by_vcf_batch_submodule,
    mark_numbers_as_not_imported_by_ids as mark_numbers_as_not_imported_by_ids_submodule,
    fetch_numbers_by_id_range_unconsumed as fetch_numbers_by_id_range_unconsumed_submodule,
    search_contact_numbers as search_contact_numbers_submodule,
    count_search_results as count_search_results_submodule,
};

/// 联系人号码仓储类 - 重构为模块化架构
/// 
/// 本类现在作为子模块的统一门面，所有实际逻辑都委托给专门的子模块。
/// 这样既保持了向后兼容性，又实现了模块化架构。
/// 
/// 职责分工：
/// - basic_operations: 基础CRUD操作
/// - advanced_queries: 高级查询和搜索
/// - status_management: 状态管理  
/// - batch_management: 批次和分配管理
/// - statistics: 统计信息
pub struct ContactNumberRepository;

impl ContactNumberRepository {
    /// 批量插入联系人号码
    /// 委托给 basic_operations 子模块
    pub fn insert_numbers(
        conn: &Connection,
        numbers: &[(String, String)],
        source_file: &str,
    ) -> (i64, i64, Vec<String>) {
        match insert_numbers_submodule(conn, numbers, source_file) {
            Ok((inserted, duplicates, errors)) => (inserted, duplicates, errors),
            Err(e) => {
                log_database_error("insert_numbers", &e);
                (0, 0, vec![format!("插入失败: {}", e)])
            }
        }
    }

    /// 分页查询联系人号码  
    /// 委托给 basic_operations 子模块
    pub fn list_numbers(
        conn: &Connection,
        limit: i64,
        offset: i64,
        _search: Option<String>, // 暂时忽略搜索参数，保持兼容性
    ) -> SqliteResult<ContactNumberList> {
        list_numbers_submodule(conn, limit, offset)
    }

    /// 高级过滤查询联系人号码
    /// 委托给 advanced_queries 子模块
    pub fn list_numbers_filtered(
        conn: &Connection,
        limit: i64,
        offset: i64,
        search: Option<String>,
        industry: Option<String>,
        status: Option<String>,
    ) -> SqliteResult<ContactNumberList> {
        search_contact_numbers_submodule(conn, limit, offset, search, industry, status)
    }

    /// 获取联系人号码统计
    /// 委托给 statistics 子模块
    pub fn get_contact_number_stats(
        conn: &Connection,
    ) -> SqliteResult<crate::services::contact_storage::models::ContactNumberStats> {
        get_contact_number_stats_submodule(conn)
    }

    /// 获取不同行业列表
    /// 委托给 statistics 子模块
    pub fn get_distinct_industries(conn: &Connection) -> SqliteResult<Vec<String>> {
        get_distinct_industries_submodule(conn)
    }

    /// 根据ID范围获取联系人号码
    /// 委托给 basic_operations 子模块
    pub fn fetch_numbers_by_id_range(
        conn: &Connection,
        start_id: i64,
        end_id: i64,
    ) -> SqliteResult<Vec<ContactNumberDto>> {
        fetch_numbers_by_id_range_submodule(conn, start_id, end_id)
    }

    /// 获取单个联系人号码
    /// 委托给 basic_operations 子模块
    pub fn get_number_by_id(conn: &Connection, id: i64) -> SqliteResult<Option<ContactNumberDto>> {
        get_number_by_id_submodule(conn, id)
    }

    /// 标记号码为已使用
    /// 委托给 batch_management 子模块
    pub fn mark_numbers_used_by_id_range(
        conn: &Connection,
        start_id: i64,
        end_id: i64,
        batch_id: &str,
        device_id: &str,
    ) -> SqliteResult<i64> {
        mark_numbers_used_by_id_range_submodule(conn, start_id, end_id, batch_id, device_id)
    }

    /// 为设备分配号码
    /// 委托给 batch_management 子模块
    pub fn allocate_numbers_to_device(
        conn: &Connection,
        device_id: &str,
        count: i64,
        batch_id: &str,
        industry: Option<&str>,
    ) -> SqliteResult<Vec<ContactNumberDto>> {
        allocate_numbers_to_device_submodule(conn, device_id, count, batch_id, industry)
    }

    /// 设置号码行业
    /// 委托给 batch_management 子模块
    pub fn set_industry_by_id_range(
        conn: &Connection,
        start_id: i64,
        end_id: i64,
        industry: &str,
    ) -> SqliteResult<i64> {
        set_industry_by_id_range_submodule(conn, start_id, end_id, industry)
    }

    /// 按VCF批次标记行业
    /// 委托给 batch_management 子模块
    pub fn tag_numbers_industry_by_vcf_batch(
        conn: &Connection,
        batch_id: &str,
        industry: &str,
    ) -> SqliteResult<i64> {
        tag_numbers_industry_by_vcf_batch_submodule(conn, batch_id, industry)
    }

    /// 恢复号码为未导入状态
    /// 委托给 status_management 子模块
    pub fn mark_numbers_as_not_imported_by_ids(
        conn: &Connection,
        number_ids: &[i64],
    ) -> SqliteResult<i64> {
        mark_numbers_as_not_imported_by_ids_submodule(conn, number_ids)
    }

    /// 搜索联系人号码
    /// 委托给 advanced_queries 子模块 
    pub fn search_contact_numbers(
        conn: &Connection,
        limit: i64,
        offset: i64,
        search: Option<String>,
        industry: Option<String>,
        status: Option<String>,
    ) -> SqliteResult<ContactNumberList> {
        search_contact_numbers_submodule(conn, limit, offset, search, industry, status)
    }

    /// 统计搜索结果数量
    /// 委托给 advanced_queries 子模块
    pub fn count_search_results(
        conn: &Connection,
        search: Option<String>,
        industry: Option<String>,
        status: Option<String>,
    ) -> SqliteResult<i64> {
        count_search_results_submodule(conn, search, industry, status)
    }

    /// 获取未分类的号码（批量获取，包含过滤条件）
    /// 委托给 basic_operations 子模块  
    pub fn list_numbers_without_batch_filtered(
        conn: &Connection,
        limit: i64,
        offset: i64,
        keyword: Option<String>,
        industry: Option<String>,
        status: Option<String>,
    ) -> SqliteResult<ContactNumberList> {
        // 委托给高级查询，添加"无批次"条件
        let mut search_conditions = vec![];
        
        if let Some(kw) = keyword {
            search_conditions.push(format!("(phone LIKE '%{}%' OR source_file LIKE '%{}%')", 
                kw.replace("'", "''"), kw.replace("'", "''")));
        }
        
        if let Some(ind) = industry {
            if ind == "未分类" {
                search_conditions.push("(industry IS NULL OR industry = '')".to_string());
            } else {
                search_conditions.push(format!("industry = '{}'", ind.replace("'", "''")));
            }
        }
        
        if let Some(st) = status {
            search_conditions.push(format!("status = '{}'", st.replace("'", "''")));
        }
        
        // 添加"无批次"条件
        search_conditions.push("(assigned_batch_id IS NULL OR assigned_batch_id = '')".to_string());
        
        // 组合查询条件并使用高级查询
        let combined_search = if search_conditions.is_empty() {
            None
        } else {
            Some(search_conditions.join(" AND "))
        };
        
        search_contact_numbers_submodule(conn, limit, offset, combined_search, None, None)
    }

    /// 按批次查询号码
    /// 委托给 advanced_queries 子模块
    pub fn list_numbers_by_batch(
        conn: &Connection,
        batch_id: &str,
        limit: i64,
        offset: i64,
    ) -> SqliteResult<ContactNumberList> {
        // 使用高级查询，添加批次过滤条件
        let batch_condition = format!("assigned_batch_id = '{}'", batch_id.replace("'", "''"));
        search_contact_numbers_submodule(conn, limit, offset, Some(batch_condition), None, None)
    }

    /// 获取未消费的号码（按ID范围）
    /// 委托给 status_management 子模块
    pub fn fetch_numbers_by_id_range_unconsumed(
        conn: &Connection,
        start_id: i64,
        end_id: i64,
    ) -> SqliteResult<Vec<ContactNumberDto>> {
        fetch_numbers_by_id_range_unconsumed_submodule(conn, start_id, end_id)
    }
}