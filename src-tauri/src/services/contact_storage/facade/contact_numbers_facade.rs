use rusqlite::{Connection, Result as SqliteResult};
use tauri::AppHandle;

use super::super::repositories::contact_numbers_repo::ContactNumberRepository;
use super::super::models::{ContactNumberDto, ContactNumberList, AllocationResultDto};
use super::common::db_connector::with_db_connection;

/// 联系人号码管理门面
/// 
/// 负责所有联系人号码相关的操作，委托给 contact_numbers_repo
pub struct ContactNumbersFacade;

impl ContactNumbersFacade {

    /// 统一的数据库连接方法
    fn with_db_connection<T, F>(app_handle: &AppHandle, operation: F) -> Result<T, String>
    where
        F: FnOnce(&Connection) -> SqliteResult<T>,
    {
        with_db_connection(app_handle, operation)
    }

    /// 插入联系人号码
    pub fn insert_numbers(
        app_handle: &AppHandle,
        numbers: &[(String, String)],
        source_file: &str,
    ) -> Result<(i64, i64, Vec<String>), String> {
        Self::with_db_connection(app_handle, |conn| {
            Ok(ContactNumberRepository::insert_numbers(conn, numbers, source_file))
        })
    }

    /// 获取联系人号码统计信息
    pub fn get_contact_number_stats(app_handle: &AppHandle) -> Result<serde_json::Value, String> {
        with_db_connection(app_handle, |conn| {
            // 转换为JSON格式
            let stats = ContactNumberRepository::get_contact_number_stats(conn)?;
            Ok(serde_json::to_value(stats).unwrap_or(serde_json::json!({})))
        })
    }

    /// 分页查询联系人号码
    pub fn list_numbers(
        app_handle: &AppHandle,
        limit: i64,
        offset: i64,
    ) -> Result<ContactNumberList, String> {
        Self::with_db_connection(app_handle, |conn| {
            ContactNumberRepository::list_numbers(conn, limit, offset, None)
        })
    }

    /// 使用过滤条件查询联系人号码
    pub fn list_numbers_filtered(
        app_handle: &AppHandle,
        limit: i64,
        offset: i64,
        search_phone: Option<String>,
        filter_industry: Option<String>,
        filter_used: Option<bool>,
    ) -> Result<ContactNumberList, String> {
        Self::with_db_connection(app_handle, |conn| {
            let status_filter = filter_used.map(|used| if used { "imported".to_string() } else { "available".to_string() });
            ContactNumberRepository::list_numbers_filtered(
                conn, limit, offset, search_phone, filter_industry, status_filter
            )
        })
    }

    /// 按ID批量删除联系人号码
    pub fn delete_numbers_by_ids(app_handle: &AppHandle, number_ids: &[i64]) -> Result<i64, String> {
        Self::with_db_connection(app_handle, |conn| {
            ContactNumberRepository::delete_numbers_by_ids(conn, number_ids)
        })
    }

    /// 获取所有联系人号码ID
    pub fn list_all_contact_number_ids(
        app_handle: &AppHandle,
        search: Option<String>,
        industry: Option<String>, 
        status: Option<String>,
    ) -> Result<Vec<i64>, String> {
        Self::with_db_connection(app_handle, |conn| {
            ContactNumberRepository::list_all_contact_number_ids(conn)
        })
    }

    /// 设置指定ID区间号码的行业标签
    pub fn set_industry_by_id_range(
        app_handle: &AppHandle,
        start_id: i64,
        end_id: i64,
        industry: &str,
    ) -> Result<i64, String> {
        Self::with_db_connection(app_handle, |conn| {
            ContactNumberRepository::set_numbers_industry_by_id_range(conn, start_id, end_id, industry)
        })
    }

    /// 获取所有不同的行业分类
    pub fn get_distinct_industries(app_handle: &AppHandle) -> Result<Vec<String>, String> {
        Self::with_db_connection(app_handle, |conn| {
            ContactNumberRepository::get_distinct_industries(conn)
        })
    }

    /// 查询未分配批次的号码
    pub fn list_numbers_without_batch(
        app_handle: &AppHandle,
        limit: i64,
        offset: i64,
    ) -> Result<ContactNumberList, String> {
        Self::with_db_connection(app_handle, |conn| {
            ContactNumberRepository::list_numbers_without_batch(conn, limit, offset)
        })
    }

    /// 使用过滤条件查询未分配批次的号码
    pub fn list_numbers_without_batch_filtered(
        app_handle: &AppHandle,
        limit: i64,
        offset: i64,
        search_phone: Option<String>,
        filter_industry: Option<String>,
    ) -> Result<ContactNumberList, String> {
        Self::with_db_connection(app_handle, |conn| {
            ContactNumberRepository::list_numbers_without_batch_filtered(
                conn, limit, offset, search_phone, filter_industry, None
            )
        })
    }

    /// 根据ID获取号码详情
    pub fn get_number_by_id(app_handle: &AppHandle, id: i64) -> Result<Option<ContactNumberDto>, String> {
        Self::with_db_connection(app_handle, |conn| {
            ContactNumberRepository::get_number_by_id(conn, id)
        })
    }

    /// 为设备分配号码
    pub fn allocate_numbers_to_device(
        app_handle: &AppHandle,
        device_id: &str,
        count: i64,
        industry_filter: Option<String>,
        batch_id: &str,
    ) -> Result<AllocationResultDto, String> {
        Self::with_db_connection(app_handle, |conn| {
            let allocated_numbers = ContactNumberRepository::allocate_numbers_to_device(
                conn, device_id, count, batch_id, industry_filter.as_deref()
            )?;
            
            // 转换为 AllocationResultDto
            Ok(super::super::models::AllocationResultDto {
                device_id: device_id.to_string(),
                batch_id: batch_id.to_string(),
                vcf_file_path: format!("./vcf/{}_batch.vcf", device_id),
                number_count: allocated_numbers.len() as i64,
                number_ids: allocated_numbers.iter().map(|n| n.id).collect(),
                session_id: 0, // 暂时使用0，应该创建会话
                allocated_numbers,
            })
        })
    }

    /// 获取号码
    pub fn fetch_numbers(app_handle: &AppHandle, count: i64) -> Result<Vec<ContactNumberDto>, String> {
        Self::with_db_connection(app_handle, |conn| {
            ContactNumberRepository::fetch_numbers(conn, count)
        })
    }

    /// 获取未分类号码
    pub fn fetch_unclassified_numbers(
        app_handle: &AppHandle,
        count: i64,
        industry: &str,
    ) -> Result<Vec<ContactNumberDto>, String> {
        Self::with_db_connection(app_handle, |conn| {
            ContactNumberRepository::fetch_unclassified_numbers(conn, count)
        })
    }

    /// 标记指定ID区间的号码为已使用
    pub fn mark_numbers_used_by_id_range(
        app_handle: &AppHandle,
        start_id: i64,
        end_id: i64,
        batch_id: &str,
        status: &str,
    ) -> Result<i64, String> {
        Self::with_db_connection(app_handle, |conn| {
            ContactNumberRepository::mark_numbers_used_by_id_range(conn, start_id, end_id, batch_id, status)
        })
    }

    /// 标记号码为已导入
    pub fn mark_numbers_imported(
        app_handle: &AppHandle,
        start_id: i64,
        end_id: i64,
        device_id: &str,
    ) -> Result<i64, String> {
        with_db_connection(app_handle, |conn| {
            ContactNumberRepository::mark_numbers_imported(conn, start_id, end_id, device_id)
        })
    }

    /// 通过ID列表标记号码为未导入
    pub fn mark_numbers_as_not_imported_by_ids(
        app_handle: &AppHandle,
        number_ids: &[i64],
    ) -> Result<i64, String> {
        with_db_connection(app_handle, |conn| {
            ContactNumberRepository::mark_numbers_as_not_imported_by_ids(conn, number_ids)
        })
    }

    /// 通过ID范围获取号码
    pub fn fetch_numbers_by_id_range(
        app_handle: &AppHandle,
        start_id: i64,
        end_id: i64,
    ) -> Result<Vec<ContactNumberDto>, String> {
        with_db_connection(app_handle, |conn| {
            ContactNumberRepository::fetch_numbers_by_id_range(conn, start_id, end_id)
        })
    }

    /// 通过ID范围获取未消费号码
    pub fn fetch_numbers_by_id_range_unconsumed(
        app_handle: &AppHandle,
        start_id: i64,
        end_id: i64,
    ) -> Result<Vec<ContactNumberDto>, String> {
        with_db_connection(app_handle, |conn| {
            ContactNumberRepository::fetch_numbers_by_id_range_unconsumed(conn, start_id, end_id)
        })
    }

    /// 按批次列出号码
    pub fn list_numbers_by_batch(
        app_handle: &AppHandle,
        batch_id: &str,
        limit: i64,
        offset: i64,
    ) -> Result<ContactNumberList, String> {
        with_db_connection(app_handle, |conn| {
            ContactNumberRepository::list_numbers_by_batch(conn, batch_id, limit, offset)
        })
    }

    /// 按批次列出号码（带过滤）
    pub fn list_numbers_by_batch_filtered(
        app_handle: &AppHandle,
        batch_id: &str,
        limit: i64,
        offset: i64,
        show_used_only: bool,
    ) -> Result<ContactNumberList, String> {
        with_db_connection(app_handle, |conn| {
            ContactNumberRepository::list_numbers_by_batch_filtered(
                conn, batch_id, limit, offset, show_used_only
            )
        })
    }

    /// 为VCF批次列出号码
    pub fn list_numbers_for_vcf_batch(
        app_handle: &AppHandle,
        batch_id: &str,
        limit: i64,
        offset: i64,
    ) -> Result<ContactNumberList, String> {
        with_db_connection(app_handle, |conn| {
            ContactNumberRepository::list_numbers_for_vcf_batch(conn, batch_id, limit, offset)
        })
    }

    /// 按VCF批次标记号码行业
    pub fn tag_numbers_industry_by_vcf_batch(
        app_handle: &AppHandle,
        batch_id: &str,
        industry: &str,
    ) -> Result<i64, String> {
        with_db_connection(app_handle, |conn| {
            ContactNumberRepository::tag_numbers_industry_by_vcf_batch(conn, batch_id, industry)
        })
    }

    /// 获取已导入的文件列表及统计信息
    pub fn get_imported_file_list(
        app_handle: &AppHandle,
    ) -> Result<Vec<super::super::models::FileInfoDto>, String> {
        with_db_connection(app_handle, |conn| {
            ContactNumberRepository::get_imported_file_list(conn)
        })
    }

    /// 根据文件路径列表获取联系人号码
    pub fn get_numbers_by_files(
        app_handle: &AppHandle,
        file_paths: &[String],
        only_available: bool,
    ) -> Result<Vec<ContactNumberDto>, String> {
        with_db_connection(app_handle, |conn| {
            ContactNumberRepository::get_numbers_by_files(conn, file_paths, only_available)
        })
    }

    /// 检查文件是否已导入
    pub fn check_file_imported(
        app_handle: &AppHandle,
        file_path: &str,
    ) -> Result<bool, String> {
        with_db_connection(app_handle, |conn| {
            ContactNumberRepository::check_file_imported(conn, file_path)
        })
    }

    /// 获取指定文件的统计信息
    pub fn get_file_stats(
        app_handle: &AppHandle,
        file_path: &str,
    ) -> Result<Option<super::super::models::FileInfoDto>, String> {
        Self::with_db_connection(app_handle, |conn| {
            ContactNumberRepository::get_file_stats(conn, file_path)
        })
    }
}