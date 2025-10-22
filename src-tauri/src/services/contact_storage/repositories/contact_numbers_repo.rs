use rusqlite::{Connection, Result as SqliteResult};
use super::common::database::log_database_error;

use crate::services::contact_storage::models::{ContactNumberDto, ContactNumberList, ContactNumberStats};

// 引入子模块化功能
use super::contact_numbers::{
    basic_operations,
    advanced_queries,
    statistics,
    batch_management,
    status_management,
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
        match basic_operations::insert_numbers(conn, numbers, source_file) {
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
        basic_operations::list_numbers(conn, limit, offset)
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
        // 转换 String 参数为 &str 参数
        let search_ref = search.as_deref();
        let industry_ref = industry.as_deref();
        let status_ref = status.as_deref();

        // 调用子模块，但返回的是 Vec<ContactNumberDto>，需要构造 ContactNumberList
        let numbers = advanced_queries::search_contact_numbers(
            conn, search_ref, industry_ref, status_ref, limit, offset
        )?;

        // 获取总数量用于分页
        let total = advanced_queries::count_search_results(conn, search_ref, industry_ref, status_ref)?;

        Ok(ContactNumberList {
            items: numbers,
            total,
            limit,
            offset,
        })
    }

    /// 获取联系人号码统计
    /// 委托给 statistics 子模块
    pub fn get_contact_number_stats(
        conn: &Connection,
    ) -> SqliteResult<ContactNumberStats> {
        let raw_stats = statistics::get_contact_number_stats(conn)?;
        
        // 转换 ContactNumberStatsRaw 到 ContactNumberStats
        Ok(ContactNumberStats {
            total: raw_stats.total,
            available: raw_stats.available,
            imported: raw_stats.imported,
            failed: 0,  // 暂时硬编码为0，后续可改进
            used: raw_stats.assigned + raw_stats.imported,
            unused: raw_stats.available,
        })
    }

    /// 获取不同行业列表
    /// 委托给 statistics 子模块
    pub fn get_distinct_industries(conn: &Connection) -> SqliteResult<Vec<String>> {
        statistics::get_distinct_industries(conn)
    }

    /// 根据ID范围获取联系人号码
    /// 委托给 basic_operations 子模块
    pub fn fetch_numbers_by_id_range(
        conn: &Connection,
        start_id: i64,
        end_id: i64,
    ) -> SqliteResult<Vec<ContactNumberDto>> {
        basic_operations::fetch_numbers_by_id_range(conn, start_id, end_id)
    }

    /// 获取单个联系人号码
    /// 委托给 basic_operations 子模块
    pub fn get_number_by_id(conn: &Connection, id: i64) -> SqliteResult<Option<ContactNumberDto>> {
        basic_operations::get_number_by_id(conn, id)
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
        // 注意：子模块的函数不需要 device_id 参数，我们忽略它以保持兼容性
        batch_management::mark_numbers_used_by_id_range(conn, start_id, end_id, batch_id)
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
        // 注意：子模块的函数不需要 batch_id 参数，我们只使用 device_id、count 和 industry
        batch_management::allocate_numbers_to_device(conn, device_id, count, industry)
    }

    /// 设置号码行业
    /// 委托给 batch_management 子模块
    pub fn set_industry_by_id_range(
        conn: &Connection,
        start_id: i64,
        end_id: i64,
        industry: &str,
    ) -> SqliteResult<i64> {
        batch_management::set_industry_by_id_range(conn, start_id, end_id, industry)
    }

    /// 按VCF批次标记行业
    /// 委托给 batch_management 子模块
    pub fn tag_numbers_industry_by_vcf_batch(
        conn: &Connection,
        batch_id: &str,
        industry: &str,
    ) -> SqliteResult<i64> {
        batch_management::tag_numbers_industry_by_vcf_batch(conn, batch_id, industry)
    }

    /// 恢复号码为未导入状态
    /// 委托给 status_management 子模块
    pub fn mark_numbers_as_not_imported_by_ids(
        conn: &Connection,
        number_ids: &[i64],
    ) -> SqliteResult<i64> {
        status_management::mark_numbers_as_not_imported_by_ids(conn, number_ids)
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
        // 转换 String 参数为 &str 参数
        let search_ref = search.as_deref();
        let industry_ref = industry.as_deref();
        let status_ref = status.as_deref();

        // 调用子模块
        let numbers = advanced_queries::search_contact_numbers(
            conn, search_ref, industry_ref, status_ref, limit, offset
        )?;

        // 获取总数量用于分页
        let total = advanced_queries::count_search_results(conn, search_ref, industry_ref, status_ref)?;

        Ok(ContactNumberList {
            items: numbers,
            total,
            limit,
            offset,
        })
    }

    /// 统计搜索结果数量
    /// 委托给 advanced_queries 子模块
    pub fn count_search_results(
        conn: &Connection,
        search: Option<String>,
        industry: Option<String>,
        status: Option<String>,
    ) -> SqliteResult<i64> {
        let search_ref = search.as_deref();
        let industry_ref = industry.as_deref();
        let status_ref = status.as_deref();
        
        advanced_queries::count_search_results(conn, search_ref, industry_ref, status_ref)
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
        
        if let Some(kw) = keyword.as_ref() {
            search_conditions.push(format!("(phone LIKE '%{}%' OR source_file LIKE '%{}%')", 
                kw.replace("'", "''"), kw.replace("'", "''")));
        }
        
        if let Some(ind) = industry.as_ref() {
            if ind == "未分类" {
                search_conditions.push("(industry IS NULL OR industry = '')".to_string());
            } else {
                search_conditions.push(format!("industry = '{}'", ind.replace("'", "''")));
            }
        }
        
        if let Some(st) = status.as_ref() {
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
        
        let numbers = advanced_queries::search_contact_numbers(
            conn, combined_search.as_deref(), None, None, limit, offset
        )?;

        let total = advanced_queries::count_search_results(conn, combined_search.as_deref(), None, None)?;

        Ok(ContactNumberList {
            items: numbers,
            total,
            limit,
            offset,
        })
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
        
        let numbers = advanced_queries::search_contact_numbers(
            conn, Some(&batch_condition), None, None, limit, offset
        )?;

        let total = advanced_queries::count_search_results(conn, Some(&batch_condition), None, None)?;

        Ok(ContactNumberList {
            items: numbers,
            total,
            limit,
            offset,
        })
    }

    /// 获取未消费的号码（按ID范围）
    /// 委托给 status_management 子模块
    pub fn fetch_numbers_by_id_range_unconsumed(
        conn: &Connection,
        start_id: i64,
        end_id: i64,
    ) -> SqliteResult<Vec<ContactNumberDto>> {
        status_management::fetch_numbers_by_id_range_unconsumed(conn, start_id, end_id)
    }

    // 为了兼容性，添加一些可能缺失的方法

    /// 删除号码（按ID列表）
    pub fn delete_numbers_by_ids(
        conn: &Connection,
        number_ids: &[i64],
    ) -> SqliteResult<i64> {
        let placeholders = vec!["?"; number_ids.len()].join(",");
        let sql = format!("DELETE FROM contact_numbers WHERE id IN ({})", placeholders);
        
        let params: Vec<&dyn rusqlite::ToSql> = number_ids.iter()
            .map(|id| id as &dyn rusqlite::ToSql)
            .collect();
        
        let affected = conn.execute(&sql, &params[..])?;
        Ok(affected as i64)
    }

    /// 获取所有联系人号码ID
    pub fn list_all_contact_number_ids(conn: &Connection) -> SqliteResult<Vec<i64>> {
        let mut stmt = conn.prepare("SELECT id FROM contact_numbers ORDER BY id")?;
        let rows = stmt.query_map([], |row| {
            Ok(row.get::<_, i64>(0)?)
        })?;

        let mut ids = Vec::new();
        for row_result in rows {
            ids.push(row_result?);
        }
        Ok(ids)
    }

    /// 设置号码行业（兼容性方法，映射到 set_industry_by_id_range）
    pub fn set_numbers_industry_by_id_range(
        conn: &Connection,
        start_id: i64,
        end_id: i64,
        industry: &str,
    ) -> SqliteResult<i64> {
        Self::set_industry_by_id_range(conn, start_id, end_id, industry)
    }

    /// 获取号码（简单版本，不带过滤）
    pub fn fetch_numbers(conn: &Connection, count: i64) -> SqliteResult<Vec<ContactNumberDto>> {
        let mut stmt = conn.prepare(
            "SELECT id, phone, name, source_file, created_at, industry, status, assigned_at, assigned_batch_id, imported_session_id, imported_device_id 
             FROM contact_numbers 
             ORDER BY id 
             LIMIT ?"
        )?;
        
        let rows = stmt.query_map([count], |row| {
            Ok(ContactNumberDto {
                id: row.get(0)?,
                phone: row.get(1)?,
                name: row.get(2)?,
                source_file: row.get(3)?,
                created_at: row.get(4)?,
                industry: row.get(5)?,
                status: row.get(6)?,
                assigned_at: row.get(7)?,
                assigned_batch_id: row.get(8)?,
                imported_session_id: row.get(9)?,
                imported_device_id: row.get(10)?,
            })
        })?;

        let mut numbers = Vec::new();
        for row_result in rows {
            numbers.push(row_result?);
        }
        Ok(numbers)
    }

    /// 获取未分类号码
    pub fn fetch_unclassified_numbers(
        conn: &Connection, 
        count: i64
    ) -> SqliteResult<Vec<ContactNumberDto>> {
        let mut stmt = conn.prepare(
            "SELECT id, phone, name, source_file, created_at, industry, status, assigned_at, assigned_batch_id, imported_session_id, imported_device_id 
             FROM contact_numbers 
             WHERE industry IS NULL OR industry = ''
             ORDER BY id 
             LIMIT ?"
        )?;
        
        let rows = stmt.query_map([count], |row| {
            Ok(ContactNumberDto {
                id: row.get(0)?,
                phone: row.get(1)?,
                name: row.get(2)?,
                source_file: row.get(3)?,
                created_at: row.get(4)?,
                industry: row.get(5)?,
                status: row.get(6)?,
                assigned_at: row.get(7)?,
                assigned_batch_id: row.get(8)?,
                imported_session_id: row.get(9)?,
                imported_device_id: row.get(10)?,
            })
        })?;

        let mut numbers = Vec::new();
        for row_result in rows {
            numbers.push(row_result?);
        }
        Ok(numbers)
    }

    /// 简单版本的无批次号码查询
    pub fn list_numbers_without_batch(
        conn: &Connection,
        limit: i64,
        offset: i64,
    ) -> SqliteResult<ContactNumberList> {
        Self::list_numbers_without_batch_filtered(conn, limit, offset, None, None, None)
    }

    // ===== 新增缺失的方法 =====

    /// 标记号码为已导入
    pub fn mark_numbers_imported(
        conn: &Connection,
        start_id: i64,
        end_id: i64,
        device_id: &str,
    ) -> SqliteResult<i64> {
        // 委托给status_management子模块
        status_management::mark_numbers_imported(conn, start_id, end_id, device_id)
    }

    /// 按批次过滤列出号码
    pub fn list_numbers_by_batch_filtered(
        conn: &Connection,
        batch_id: &str,
        limit: i64,
        offset: i64,
        used_only: bool,
    ) -> SqliteResult<ContactNumberList> {
        // 委托给batch_management子模块
        batch_management::list_numbers_by_batch_filtered(conn, batch_id, limit, offset, used_only)
    }

    /// 列出VCF批次的号码
    pub fn list_numbers_for_vcf_batch(
        conn: &Connection,
        batch_id: &str,
        limit: i64,
        offset: i64,
    ) -> SqliteResult<ContactNumberList> {
        // 委托给batch_management子模块
        batch_management::list_numbers_for_vcf_batch(conn, batch_id, limit, offset)
    }

    // ===== 文件相关查询 =====

    /// 获取所有已导入的文件列表
    pub fn get_imported_file_list(
        conn: &Connection,
    ) -> SqliteResult<Vec<super::super::models::FileInfoDto>> {
        super::contact_numbers::file_queries::get_imported_file_list(conn)
    }

    /// 根据文件路径列表获取号码
    pub fn get_numbers_by_files(
        conn: &Connection,
        file_paths: &[String],
        only_available: bool,
    ) -> SqliteResult<Vec<ContactNumberDto>> {
        super::contact_numbers::file_queries::get_numbers_by_files(conn, file_paths, only_available)
    }

    /// 检查文件是否已导入
    pub fn check_file_imported(
        conn: &Connection,
        file_path: &str,
    ) -> SqliteResult<bool> {
        super::contact_numbers::file_queries::check_file_imported(conn, file_path)
    }

    /// 获取指定文件的统计信息
    pub fn get_file_stats(
        conn: &Connection,
        file_path: &str,
    ) -> SqliteResult<Option<super::super::models::FileInfoDto>> {
        super::contact_numbers::file_queries::get_file_stats(conn, file_path)
    }
}