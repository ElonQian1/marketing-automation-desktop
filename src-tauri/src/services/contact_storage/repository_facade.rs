use rusqlite::{Connection, Result as SqliteResult};
use tauri::AppHandle;

// 引入新的 facade 子模块
use super::facade::{
    ContactNumbersFacade,
    VcfBatchesFacade,
    ImportSessionsFacade,
    TxtImportFacade,
    DatabaseFacade,
};

// 引入模型类
use super::models::{
    AllocationResultDto, ContactNumberDto, VcfBatchDto, VcfBatchList, 
    VcfBatchStatsDto, VcfBatchCreationResult, ImportSessionDto, 
    ImportSessionList, ContactNumberList, TxtImportRecordDto, 
    TxtImportRecordList
};

/// 联系人存储服务统一门面
/// 
/// 重构后的轻量级门面，委托给专门的 facade 子模块
/// 消除代码重复，提升可维护性
/// 
/// 架构模式：Facade Pattern + Delegation Pattern
pub struct ContactStorageFacade {
    app_handle: tauri::AppHandle,
}

impl ContactStorageFacade {
    /// 创建新的 Facade 实例
    pub fn new(app_handle: &tauri::AppHandle) -> Self {
        Self {
            app_handle: app_handle.clone(),
        }
    }

    // ==================== 数据库管理方法 ====================

    /// 获取联系人数据库路径
    pub fn get_contacts_db_path() -> SqliteResult<std::path::PathBuf> {
        // 使用与database.rs中相同的逻辑
        let db_dir = if cfg!(debug_assertions) {
            let manifest_dir = std::env::var("CARGO_MANIFEST_DIR")
                .expect("CARGO_MANIFEST_DIR not set");
            std::path::PathBuf::from(manifest_dir).join("data")
        } else {
            std::path::PathBuf::from("data") // 简化版本
        };
        
        std::fs::create_dir_all(&db_dir).expect("failed to create data dir");
        let db_path = db_dir.join("contacts.db");
        Ok(db_path)
    }
    
    /// 初始化数据库
    pub fn init_db() -> SqliteResult<Connection> {
        use super::repositories::common::database::get_connection;
        // 这里需要一个临时的AppHandle，实际使用中应该从外部传入
        // 这个方法主要用于测试和初始化场景
        unimplemented!("init_db should be called with app_handle parameter")
    }

    /// 获取数据库统计信息
    pub fn get_database_statistics(&self) -> Result<serde_json::Value, String> {
        DatabaseFacade::get_database_statistics(&self.app_handle)
    }

    /// 执行数据库维护
    pub fn perform_database_maintenance(&self, vacuum: bool, analyze: bool) -> Result<serde_json::Value, String> {
        DatabaseFacade::perform_database_maintenance(&self.app_handle, vacuum, analyze)
    }

    /// 检查数据库完整性
    pub fn check_database_integrity(&self) -> Result<serde_json::Value, String> {
        DatabaseFacade::check_database_integrity(&self.app_handle)
    }

    /// 清理未使用的号码
    pub fn cleanup_unused_numbers(&self, days_threshold: i64) -> Result<i64, String> {
        DatabaseFacade::cleanup_unused_numbers(&self.app_handle, days_threshold)
    }

    /// 重置所有号码为未使用状态
    pub fn reset_all_numbers_to_unused(&self) -> Result<i64, String> {
        DatabaseFacade::reset_all_numbers_to_unused(&self.app_handle)
    }

    // ==================== 联系人号码管理方法 ====================

    /// 插入联系人号码
    pub fn insert_numbers(
        &self,
        numbers: &[(String, String)],
        source_file: &str,
    ) -> Result<(i64, i64, Vec<String>), String> {
        ContactNumbersFacade::insert_numbers(&self.app_handle, numbers, source_file)
    }

    /// 获取联系人号码统计
    pub fn get_contact_number_stats(&self) -> Result<serde_json::Value, String> {
        ContactNumbersFacade::get_contact_number_stats(&self.app_handle)
    }

    /// 分页查询联系人号码
    pub fn list_numbers(&self, limit: i64, offset: i64) -> Result<ContactNumberList, String> {
        ContactNumbersFacade::list_numbers(&self.app_handle, limit, offset)
    }

    /// 使用过滤条件查询联系人号码
    pub fn list_numbers_filtered(
        &self,
        limit: i64,
        offset: i64,
        filter_used: Option<bool>,
        filter_industry: Option<String>,
        search_phone: Option<String>,
    ) -> Result<ContactNumberList, String> {
        ContactNumbersFacade::list_numbers_filtered(
            &self.app_handle, limit, offset, search_phone, filter_industry, filter_used
        )
    }

    /// 使用过滤条件查询联系人号码（兼容旧接口）
    pub fn list_numbers_with_filters(
        &self,
        limit: i64,
        offset: i64,
        search: Option<String>,
        industry: Option<String>,
        status: Option<String>,
    ) -> Result<ContactNumberList, String> {
        let filter_used = match status.as_deref() {
            Some("available") => Some(false),
            Some("imported") => Some(true),
            _ => None,
        };
        self.list_numbers_filtered(limit, offset, filter_used, industry, search)
    }

    /// 按ID批量删除联系人号码
    pub fn delete_numbers_by_ids(&self, number_ids: &[i64]) -> Result<i64, String> {
        ContactNumbersFacade::delete_numbers_by_ids(&self.app_handle, number_ids)
    }

    /// 获取满足筛选条件的所有号码ID
    pub fn list_all_contact_number_ids(
        &self,
        search: Option<String>,
        industry: Option<String>,
        status: Option<String>,
    ) -> Result<Vec<i64>, String> {
        ContactNumbersFacade::list_all_contact_number_ids(&self.app_handle, search, industry, status)
    }

    /// 设置指定ID区间号码的行业标签
    pub fn set_industry_by_id_range(&self, start_id: i64, end_id: i64, industry: &str) -> Result<i64, String> {
        ContactNumbersFacade::set_industry_by_id_range(&self.app_handle, start_id, end_id, industry)
    }

    /// 获取所有不同的行业分类
    pub fn get_distinct_industries(&self) -> Result<Vec<String>, String> {
        ContactNumbersFacade::get_distinct_industries(&self.app_handle)
    }

    /// 查询未分配批次的号码
    pub fn list_numbers_without_batch(&self, limit: i64, offset: i64) -> Result<ContactNumberList, String> {
        ContactNumbersFacade::list_numbers_without_batch(&self.app_handle, limit, offset)
    }

    /// 使用过滤条件查询未分配批次的号码
    pub fn list_numbers_without_batch_filtered(
        &self,
        limit: i64,
        offset: i64,
        search_phone: Option<String>,
        filter_industry: Option<String>,
    ) -> Result<ContactNumberList, String> {
        ContactNumbersFacade::list_numbers_without_batch_filtered(
            &self.app_handle, limit, offset, search_phone, filter_industry
        )
    }

    /// 根据ID获取号码详情
    pub fn get_number_by_id(&self, id: i64) -> Result<Option<ContactNumberDto>, String> {
        ContactNumbersFacade::get_number_by_id(&self.app_handle, id)
    }

    /// 为设备分配号码
    pub fn allocate_numbers_to_device(
        &self,
        device_id: &str,
        count: i64,
        industry_filter: Option<String>,
    ) -> Result<AllocationResultDto, String> {
        ContactNumbersFacade::allocate_numbers_to_device(&self.app_handle, device_id, count, industry_filter, "")
    }

    /// 获取号码
    pub fn fetch_numbers(&self, count: i64) -> Result<Vec<ContactNumberDto>, String> {
        ContactNumbersFacade::fetch_numbers(&self.app_handle, count)
    }

    /// 获取未分类号码
    pub fn fetch_unclassified_numbers(&self, count: i64, industry: &str) -> Result<Vec<ContactNumberDto>, String> {
        ContactNumbersFacade::fetch_unclassified_numbers(&self.app_handle, count, industry)
    }

    /// 标记指定ID区间的号码为已使用
    pub fn mark_numbers_used_by_id_range(&self, start_id: i64, end_id: i64, batch_id: &str) -> Result<i64, String> {
        ContactNumbersFacade::mark_numbers_used_by_id_range(&self.app_handle, start_id, end_id, batch_id, "")
    }

    /// 设置号码状态为已导入
    pub fn mark_numbers_imported(&self, start_id: i64, end_id: i64, device_id: &str) -> Result<i64, String> {
        ContactNumbersFacade::mark_numbers_imported(&self.app_handle, start_id, end_id, device_id)
    }

    // ==================== VCF 批次管理方法 ====================

    /// 创建VCF批次
    pub fn create_vcf_batch(
        &self,
        batch_id: &str,
        vcf_file_path: &str,
        source_start_id: i64,
        source_end_id: i64,
    ) -> Result<VcfBatchCreationResult, String> {
        VcfBatchesFacade::create_vcf_batch(&self.app_handle, batch_id, vcf_file_path, source_start_id, source_end_id)
    }

    /// 列出VCF批次
    pub fn list_vcf_batches(&self, limit: i64, offset: i64) -> Result<VcfBatchList, String> {
        VcfBatchesFacade::list_vcf_batches(&self.app_handle, limit, offset)
    }

    /// 按批次ID删除VCF
    pub fn delete_vcf_batch(&self, batch_id: &str) -> Result<i64, String> {
        VcfBatchesFacade::delete_vcf_batch(&self.app_handle, batch_id)
    }

    /// 获取VCF批次统计
    pub fn get_vcf_batch_stats(&self) -> Result<VcfBatchStatsDto, String> {
        VcfBatchesFacade::get_vcf_batch_stats(&self.app_handle, None, None, None, None)
    }

    /// 根据批次ID获取VCF详情
    pub fn get_vcf_batch_by_id(&self, batch_id: &str) -> Result<Option<VcfBatchDto>, String> {
        VcfBatchesFacade::get_vcf_batch_by_id(&self.app_handle, batch_id)
    }

    /// 更新VCF批次信息
    pub fn update_vcf_batch(
        &self,
        batch_id: &str,
        batch_name: Option<&str>,
        description: Option<&str>,
        status: Option<&str>,
    ) -> Result<i64, String> {
        VcfBatchesFacade::update_vcf_batch(&self.app_handle, batch_id, batch_name, description, status)
    }

    /// 更新VCF批次导入结果
    pub fn update_vcf_batch_import_result(&self, batch_id: &str, import_result: &str) -> Result<i64, String> {
        VcfBatchesFacade::update_vcf_batch_import_result(&self.app_handle, batch_id, import_result)
    }

    // ==================== 导入会话管理方法 ====================

    /// 创建导入会话
    pub fn create_import_session(
        &self,
        device_id: &str,
        batch_id: &str,
        total_contacts: i64,
        session_type: &str,
    ) -> Result<i64, String> {
        ImportSessionsFacade::create_import_session(&self.app_handle, device_id, batch_id, total_contacts, session_type)
    }

    /// 更新导入会话状态
    pub fn update_import_session_status(
        &self,
        session_id: i64,
        status: &str,
        imported_count: Option<i64>,
        error_message: Option<&str>,
    ) -> Result<i64, String> {
        ImportSessionsFacade::update_import_session_status(&self.app_handle, session_id, status, imported_count, error_message)
    }

    /// 列出导入会话
    pub fn list_import_sessions(&self, limit: i64, offset: i64) -> Result<ImportSessionList, String> {
        ImportSessionsFacade::list_import_sessions(&self.app_handle, limit, offset, None, None, None)
    }

    /// 根据设备ID查询导入会话
    pub fn list_import_sessions_by_device(&self, device_id: &str, limit: i64, offset: i64) -> Result<ImportSessionList, String> {
        ImportSessionsFacade::list_import_sessions_by_device(&self.app_handle, device_id, limit, offset)
    }

    /// 根据批次ID查询导入会话
    pub fn list_import_sessions_by_batch(&self, batch_id: &str, limit: i64, offset: i64) -> Result<ImportSessionList, String> {
        ImportSessionsFacade::list_import_sessions_by_batch(&self.app_handle, batch_id, limit, offset)
    }

    /// 获取导入会话详情
    pub fn get_import_session_by_id(&self, session_id: i64) -> Result<Option<ImportSessionDto>, String> {
        ImportSessionsFacade::get_import_session_by_id(&self.app_handle, session_id)
    }

    /// 删除导入会话
    pub fn delete_import_session(&self, session_id: i64) -> Result<i64, String> {
        ImportSessionsFacade::delete_import_session(&self.app_handle, session_id)
    }

    /// 更新导入会话行业信息
    pub fn update_import_session_industry(&self, session_id: i64, industry: Option<&str>) -> Result<i64, String> {
        ImportSessionsFacade::update_import_session_industry(&self.app_handle, session_id, industry)
    }

    /// 回滚导入会话为失败状态
    pub fn revert_import_session_to_failed(&self, session_id: i64, reason: &str) -> Result<i64, String> {
        ImportSessionsFacade::revert_import_session_to_failed(&self.app_handle, session_id, reason)
    }

    // ==================== TXT 导入记录管理方法 ====================

    /// 创建TXT导入记录
    pub fn create_txt_import_record(
        &self,
        file_path: &str,
        total_lines: i64,
        valid_numbers: i64,
        source_info: Option<&str>,
        batch_id: Option<&str>,
    ) -> Result<TxtImportRecordDto, String> {
        TxtImportFacade::create_txt_import_record(&self.app_handle, file_path, total_lines, valid_numbers, source_info, batch_id)
    }

    /// 列出TXT导入记录
    pub fn list_txt_import_records(
        &self,
        limit: i64,
        offset: i64,
        search_path: Option<&str>,
    ) -> Result<TxtImportRecordList, String> {
        TxtImportFacade::list_txt_import_records(&self.app_handle, limit, offset, search_path)
    }

    /// 删除TXT导入记录
    pub fn delete_txt_import_record(&self, record_id: i64, archive_numbers: bool) -> Result<i64, String> {
        TxtImportFacade::delete_txt_import_record(&self.app_handle, record_id, archive_numbers)
    }

    /// 根据路径查找TXT导入记录
    pub fn find_txt_import_record_by_path(&self, file_path: &str) -> Result<Option<TxtImportRecordDto>, String> {
        TxtImportFacade::find_txt_import_record_by_path(&self.app_handle, file_path)
    }

    /// 更新TXT导入统计
    pub fn update_txt_import_stats(
        &self,
        record_id: i64,
        processed_lines: i64,
        valid_numbers: i64,
        error_count: i64,
        status: &str,
    ) -> Result<i64, String> {
        TxtImportFacade::update_txt_import_stats(&self.app_handle, record_id, processed_lines, valid_numbers, error_count, status)
    }

    /// 获取TXT导入统计信息
    pub fn get_txt_import_stats(&self) -> Result<serde_json::Value, String> {
        TxtImportFacade::get_txt_import_stats(&self.app_handle)
    }

    // ===== 新增的缺失方法 =====

    /// 通过ID列表标记号码为未导入
    pub fn mark_numbers_as_not_imported_by_ids(&self, number_ids: &[i64]) -> Result<i64, String> {
        ContactNumbersFacade::mark_numbers_as_not_imported_by_ids(&self.app_handle, number_ids)
    }

    /// 通过ID范围获取号码
    pub fn fetch_numbers_by_id_range(&self, start_id: i64, end_id: i64) -> Result<Vec<ContactNumberDto>, String> {
        ContactNumbersFacade::fetch_numbers_by_id_range(&self.app_handle, start_id, end_id)
    }

    /// 通过ID范围获取未消费的号码
    pub fn fetch_numbers_by_id_range_unconsumed(&self, start_id: i64, end_id: i64) -> Result<Vec<ContactNumberDto>, String> {
        ContactNumbersFacade::fetch_numbers_by_id_range_unconsumed(&self.app_handle, start_id, end_id)
    }

    /// 按批次列出号码
    pub fn list_numbers_by_batch(&self, batch_id: &str, limit: i64, offset: i64) -> Result<ContactNumberList, String> {
        ContactNumbersFacade::list_numbers_by_batch(&self.app_handle, batch_id, limit, offset)
    }

    /// 按批次过滤列出号码
    pub fn list_numbers_by_batch_filtered(&self, batch_id: &str, limit: i64, offset: i64, used_only: bool) -> Result<ContactNumberList, String> {
        ContactNumbersFacade::list_numbers_by_batch_filtered(&self.app_handle, batch_id, limit, offset, used_only)
    }

    /// 列出VCF批次的号码
    pub fn list_numbers_for_vcf_batch(&self, batch_id: &str, limit: i64, offset: i64) -> Result<ContactNumberList, String> {
        ContactNumbersFacade::list_numbers_for_vcf_batch(&self.app_handle, batch_id, limit, offset)
    }

    /// 为VCF批次标记号码行业
    pub fn tag_numbers_industry_by_vcf_batch(&self, batch_id: &str, industry: &str) -> Result<i64, String> {
        ContactNumbersFacade::tag_numbers_industry_by_vcf_batch(&self.app_handle, batch_id, industry)
    }

    // VCF 批次相关缺失方法
    /// 创建VCF批次（包含号码）
    pub fn create_vcf_batch_with_numbers(&self, batch_name: &str, number_count: i64, industry: &str, device_id: &str) -> Result<VcfBatchCreationResult, String> {
        VcfBatchesFacade::create_vcf_batch_with_numbers(&self.app_handle, batch_name, number_count, industry, device_id)
    }

    /// 搜索VCF批次（按名称）
    pub fn search_vcf_batches_by_name(&self, search_term: &str, limit: i64, offset: i64) -> Result<VcfBatchList, String> {
        VcfBatchesFacade::search_vcf_batches_by_name(&self.app_handle, search_term, limit, offset)
    }

    /// 获取VCF批次
    pub fn get_vcf_batch(&self, batch_id: &str) -> Result<Option<VcfBatchDto>, String> {
        VcfBatchesFacade::get_vcf_batch(&self.app_handle, batch_id)
    }

    /// 获取最近的VCF批次
    pub fn get_recent_vcf_batches(&self, limit: i64) -> Result<VcfBatchList, String> {
        VcfBatchesFacade::get_recent_vcf_batches(&self.app_handle, limit)
    }

    /// 设置VCF批次文件路径
    pub fn set_vcf_batch_file_path(&self, batch_id: &str, file_path: &str) -> Result<bool, String> {
        let result = VcfBatchesFacade::set_vcf_batch_file_path(&self.app_handle, batch_id, file_path)?;
        Ok(result > 0)
    }

    /// 批量删除VCF批次
    pub fn batch_delete_vcf_batches(&self, batch_ids: &[String]) -> Result<i64, String> {
        VcfBatchesFacade::batch_delete_vcf_batches(&self.app_handle, batch_ids)
    }

    /// 获取VCF批次号码计数
    pub fn get_vcf_batch_number_count(&self, batch_id: &str) -> Result<i64, String> {
        VcfBatchesFacade::get_vcf_batch_number_count(&self.app_handle, batch_id)
    }

    /// 标记VCF批次完成实例
    pub fn mark_vcf_batch_completed_instance(&self, batch_id: &str, success_count: i64, failure_count: i64) -> Result<bool, String> {
        let result = VcfBatchesFacade::mark_vcf_batch_completed_instance(&self.app_handle, batch_id, success_count, failure_count)?;
        Ok(result > 0)
    }

    /// 按设备获取最近的VCF批次
    pub fn get_recent_vcf_batches_by_device(&self, device_id: &str, limit: i64) -> Result<VcfBatchList, String> {
        VcfBatchesFacade::get_recent_vcf_batches_by_device(&self.app_handle, device_id, limit)
    }

    // 数据库管理相关缺失方法
    /// 清理所有数据
    pub fn cleanup_all_data(&self) -> Result<String, String> {
        DatabaseFacade::cleanup_all_data(&self.app_handle)
    }

    /// 维护数据库
    pub fn maintain_database(&self) -> Result<String, String> {
        DatabaseFacade::maintain_database(&self.app_handle)
    }

    /// 备份数据库
    pub fn backup_database(&self, backup_path: &str) -> Result<String, String> {
        DatabaseFacade::backup_database(&self.app_handle, backup_path)
    }

    /// 恢复数据库
    pub fn restore_database(&self, backup_path: &str) -> Result<String, String> {
        DatabaseFacade::restore_database(&self.app_handle, backup_path)
    }
}