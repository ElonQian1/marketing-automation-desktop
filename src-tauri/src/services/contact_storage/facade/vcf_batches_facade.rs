use rusqlite::{Connection, Result as SqliteResult};
use tauri::AppHandle;

use super::super::repositories::vcf_batches_repo::VcfBatchRepository;
use super::super::models::{VcfBatchDto, VcfBatchList, VcfBatchStatsDto, VcfBatchCreationResult};
use super::common::db_connector::with_db_connection;

/// VCF 批次管理门面
/// 
/// 负责所有 VCF 批次相关的操作，委托给 vcf_batches_repo
pub struct VcfBatchesFacade;

impl VcfBatchesFacade {
    
    /// 数据库连接辅助方法
    fn with_db_connection<T, F>(app_handle: &AppHandle, func: F) -> Result<T, String>
    where
        F: FnOnce(&Connection) -> SqliteResult<T>,
    {
        with_db_connection(app_handle, func)
    }

    /// 创建VCF批次
    pub fn create_vcf_batch(
        app_handle: &AppHandle,
        batch_id: &str,
        vcf_file_path: &str,
        source_start_id: i64,
        source_end_id: i64,
    ) -> Result<VcfBatchCreationResult, String> {
        with_db_connection(app_handle, |conn| {
            VcfBatchRepository::create_vcf_batch(
                conn, 
                batch_id, 
                vcf_file_path, 
                Some(source_start_id), 
                Some(source_end_id)
            )
        })
    }

    /// 列出VCF批次
    pub fn list_vcf_batches(app_handle: &AppHandle, limit: i64, offset: i64) -> Result<VcfBatchList, String> {
        Self::with_db_connection(app_handle, |conn| {
            VcfBatchRepository::list_vcf_batches(conn, limit, offset)
        })
    }

    /// 按批次ID删除VCF
    pub fn delete_vcf_batch(app_handle: &AppHandle, batch_id: &str) -> Result<i64, String> {
        Self::with_db_connection(app_handle, |conn| {
            VcfBatchRepository::delete_vcf_batch(conn, batch_id)
        })
    }

    /// 获取VCF批次统计
    pub fn get_vcf_batch_stats(
        app_handle: &AppHandle,
        start_date: Option<&str>,
        end_date: Option<&str>,
        batch_type: Option<&str>,
        status_filter: Option<&str>,
    ) -> Result<VcfBatchStatsDto, String> {
        Self::with_db_connection(app_handle, |conn| {
            VcfBatchRepository::get_vcf_batch_stats(conn, start_date, end_date, batch_type, status_filter)
        })
    }

    /// 根据批次ID获取VCF详情
    pub fn get_vcf_batch_by_id(app_handle: &AppHandle, batch_id: &str) -> Result<Option<VcfBatchDto>, String> {
        Self::with_db_connection(app_handle, |conn| {
            VcfBatchRepository::get_vcf_batch_by_id(conn, batch_id)
        })
    }

    /// 更新VCF批次信息
    pub fn update_vcf_batch(
        app_handle: &AppHandle,
        batch_id: &str,
        batch_name: Option<&str>,
        description: Option<&str>,
        status: Option<&str>,
    ) -> Result<i64, String> {
        Self::with_db_connection(app_handle, |conn| {
            VcfBatchRepository::update_vcf_batch(conn, batch_id, batch_name, description, status)
        })
    }

    /// 更新VCF批次导入结果
    pub fn update_vcf_batch_import_result(app_handle: &AppHandle, batch_id: &str, import_result: &str) -> Result<i64, String> {
        Self::with_db_connection(app_handle, |conn| {
            VcfBatchRepository::update_vcf_batch_import_result(conn, batch_id, import_result)
        })
    }
}