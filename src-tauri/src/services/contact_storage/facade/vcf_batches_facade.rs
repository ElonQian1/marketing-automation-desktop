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
            )?;
            
            // 获取刚创建的批次
            let batch = VcfBatchRepository::get_vcf_batch(conn, batch_id)?
                .ok_or_else(|| rusqlite::Error::InvalidColumnName("Failed to retrieve created batch".to_string()))?;
            
            Ok(VcfBatchCreationResult {
                batch,
                associated_numbers: 0
            })
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
            let deleted = VcfBatchRepository::delete_vcf_batch(conn, batch_id)?;
            Ok(if deleted { 1 } else { 0 })
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
            VcfBatchRepository::get_vcf_batch_stats(conn, "default")
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
            let updated = VcfBatchRepository::update_vcf_batch(conn, batch_id, batch_name, description)?;
            if updated { Ok(1) } else { Ok(0) }
        })
    }

    /// 更新VCF批次导入结果
    pub fn update_vcf_batch_import_result(app_handle: &AppHandle, batch_id: &str, import_result: &str) -> Result<i64, String> {
        Self::with_db_connection(app_handle, |conn| {
            VcfBatchRepository::update_vcf_batch_import_result(conn, batch_id, import_result)
        })
    }

    // ==================== 扩展方法（满足repository_facade调用需求） ====================

    /// 创建带号码的VCF批次
    pub fn create_vcf_batch_with_numbers(
        app_handle: &AppHandle,
        batch_name: &str,
        number_count: i64,
        industry: &str,
        device_id: &str,
    ) -> Result<VcfBatchCreationResult, String> {
        Self::with_db_connection(app_handle, |conn| {
            // 创建基础批次
            VcfBatchRepository::create_vcf_batch(conn, batch_name, "", None, None)?;
            
            // 获取刚创建的批次
            let batch = VcfBatchRepository::get_vcf_batch(conn, batch_name)?
                .ok_or_else(|| rusqlite::Error::InvalidColumnName("Failed to retrieve created batch".to_string()))?;
            
            Ok(VcfBatchCreationResult {
                batch,
                associated_numbers: number_count
            })
        })
    }

    /// 按名称搜索VCF批次
    pub fn search_vcf_batches_by_name(
        app_handle: &AppHandle,
        search_term: &str,
        limit: i64,
        offset: i64,
    ) -> Result<VcfBatchList, String> {
        Self::with_db_connection(app_handle, |conn| {
            VcfBatchRepository::search_vcf_batches_by_name(conn, search_term, limit, offset)
        })
    }

    /// 获取VCF批次详情
    pub fn get_vcf_batch(app_handle: &AppHandle, batch_id: &str) -> Result<Option<VcfBatchDto>, String> {
        Self::with_db_connection(app_handle, |conn| {
            VcfBatchRepository::get_vcf_batch(conn, batch_id)
        })
    }

    /// 获取最近的VCF批次
    pub fn get_recent_vcf_batches(app_handle: &AppHandle, limit: i64) -> Result<VcfBatchList, String> {
        Self::with_db_connection(app_handle, |conn| {
            let items = VcfBatchRepository::get_recent_vcf_batches(conn, limit)?;
            let total = items.len() as i64;
            Ok(VcfBatchList {
                items,
                total,
                limit,
                offset: 0,
            })
        })
    }

    /// 设置VCF批次文件路径
    pub fn set_vcf_batch_file_path(
        app_handle: &AppHandle,
        batch_id: &str,
        file_path: &str,
    ) -> Result<i64, String> {
        Self::with_db_connection(app_handle, |conn| {
            let updated = VcfBatchRepository::set_vcf_batch_file_path(conn, batch_id, file_path)?;
            if updated { Ok(1) } else { Ok(0) }
        })
    }

    /// 批量删除VCF批次
    pub fn batch_delete_vcf_batches(
        app_handle: &AppHandle,
        batch_ids: &[String],
    ) -> Result<i64, String> {
        Self::with_db_connection(app_handle, |conn| {
            let mut total_deleted = 0i64;
            for batch_id in batch_ids {
                let deleted = VcfBatchRepository::delete_vcf_batch(conn, batch_id)?;
                if deleted {
                    total_deleted += 1;
                }
            }
            Ok(total_deleted)
        })
    }

    /// 获取VCF批次号码数量
    pub fn get_vcf_batch_number_count(app_handle: &AppHandle, batch_id: &str) -> Result<i64, String> {
        Self::with_db_connection(app_handle, |conn| {
            VcfBatchRepository::get_vcf_batch_number_count(conn, batch_id)
        })
    }

    /// 标记VCF批次完成实例
    pub fn mark_vcf_batch_completed_instance(
        app_handle: &AppHandle,
        batch_id: &str,
        success_count: i64,
        failure_count: i64,
    ) -> Result<i64, String> {
        Self::with_db_connection(app_handle, |conn| {
            let updated = VcfBatchRepository::mark_vcf_batch_completed(
                conn, batch_id, None
            )?;
            if updated { Ok(1) } else { Ok(0) }
        })
    }

    /// 按设备获取最近的VCF批次
    pub fn get_recent_vcf_batches_by_device(
        app_handle: &AppHandle,
        device_id: &str,
        limit: i64,
    ) -> Result<VcfBatchList, String> {
        Self::with_db_connection(app_handle, |conn| {
            let items = VcfBatchRepository::get_recent_vcf_batches_by_device(conn, device_id, limit)?;
            let total = items.len() as i64;
            Ok(VcfBatchList {
                items,
                total,
                limit,
                offset: 0,
            })
        })
    }
}