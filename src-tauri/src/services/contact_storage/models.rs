use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ImportNumbersResult {
    pub success: bool,
    pub total_files: i64,
    pub total_numbers: i64,
    pub inserted: i64,
    pub duplicates: i64,
    pub errors: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ContactNumberDto {
    pub id: i64,
    pub phone: String,
    pub name: String,
    pub source_file: String,
    pub created_at: String,
    // 可选的业务元数据（可能为NULL）
    pub industry: Option<String>,
    pub used: Option<i64>,
    pub used_at: Option<String>,
    pub used_batch: Option<String>,
    pub status: Option<String>,
    pub imported_device_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ContactNumberList {
    pub total: i64,
    pub items: Vec<ContactNumberDto>,
    pub limit: i64,
    pub offset: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct IndustryCountDto {
    pub industry: String,
    pub count: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ContactNumberStatsDto {
    pub total: i64,
    pub used: i64,
    pub unused: i64,
    pub vcf_generated: i64,
    pub imported: i64,
    pub unclassified: i64,
    pub not_imported: i64,
    pub per_industry: Vec<IndustryCountDto>,
}

/// 数据库原始统计数据结构（用于 repository 层）
#[derive(Debug, Clone)]
pub struct ContactNumberStatsRaw {
    pub total: i64,
    pub unclassified: i64,
    pub not_imported: i64,
    pub per_industry: std::collections::HashMap<String, i64>,
}

// TXT文件导入结果
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ImportResultDto {
    pub total_lines: i64,
    pub valid_numbers: i64,
    pub inserted_count: i64,
    pub invalid_lines: Vec<usize>,
    pub file_path: String,
}

// 数据库信息
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DatabaseInfoDto {
    pub contact_numbers_count: i64,
    pub vcf_batches_count: i64,
    pub import_sessions_count: i64,
    pub database_size_bytes: i64,
}

// 数据库维护结果
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MaintenanceResultDto {
    pub operations: Vec<String>,
    pub timestamp: String,
}

// ----- TXT文件导入记录模型 -----

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TxtImportRecordDto {
    pub id: i64,
    pub file_path: String,
    pub file_name: String,
    pub total_numbers: i64,
    pub imported_numbers: i64,
    pub duplicate_numbers: i64,
    pub status: String,  // 'success' | 'failed' | 'partial'
    pub error_message: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TxtImportRecordList {
    pub total: i64,
    pub items: Vec<TxtImportRecordDto>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DeleteTxtImportRecordResult {
    pub record_id: i64,
    pub archived_number_count: i64,
    pub success: bool,
}

// ----- 批次与导入追踪模型 -----

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VcfBatchDto {
    pub batch_id: String,
    pub batch_name: String,
    pub source_type: String,
    pub generation_method: String,
    pub description: Option<String>,
    pub created_at: String,
    pub vcf_file_path: Option<String>,
    pub is_completed: bool,
    pub source_start_id: Option<i64>,
    pub source_end_id: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VcfBatchList {
    pub total: i64,
    pub items: Vec<VcfBatchDto>,
    pub limit: i64,
    pub offset: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VcfBatchCreationResult {
    pub batch: VcfBatchDto,
    pub associated_numbers: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VcfBatchStatsDto {
    pub total_numbers: i64,
    pub used_numbers: i64,
    pub industries: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ImportSessionDto {
    pub id: i64,
    pub session_id: String,
    pub device_id: String,
    pub batch_id: String,
    pub target_app: String,
    pub session_description: Option<String>,
    pub status: String, // pending/success/failed
    pub imported_count: i64,
    pub failed_count: i64,
    pub started_at: String,
    pub finished_at: Option<String>,
    pub created_at: String,
    pub completed_at: Option<String>,
    pub error_message: Option<String>,
    pub industry: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ImportSessionList {
    pub total: i64,
    pub items: Vec<ImportSessionDto>,
    pub limit: i64,
    pub offset: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ImportSessionStatsDto {
    pub total_sessions: i64,
    pub successful_sessions: i64,
    pub failed_sessions: i64,
    pub pending_sessions: i64,
    pub total_imported: i64,
    pub total_failed: i64,
}

// 每次导入事件（会话维度的时间序列）
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ImportEventDto {
    pub event_id: String,
    pub session_id: String,
    pub event_type: String,
    pub event_description: String,
    pub event_data: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ImportSessionEventDto {
    pub id: i64,
    pub session_id: i64,
    pub event_type: String,
    pub event_data: Option<String>,
    pub created_at: String,
    pub occurred_at: String,
    pub device_id: Option<String>,
    pub status: Option<String>,
    pub imported_count: Option<i64>,
    pub failed_count: Option<i64>,
    pub error_message: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ImportSessionEventList {
    pub total: i64,
    pub items: Vec<ImportSessionEventDto>,
    pub limit: i64,
    pub offset: i64,
}

// 分配结果（为设备分配一批号码并生成对应的 VCF 批次与待导入会话）
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AllocationResultDto {
    pub device_id: String,
    pub batch_id: String,
    pub vcf_file_path: String,
    pub number_count: i64,
    pub number_ids: Vec<i64>,
    pub session_id: i64, // 新建的 pending 会话ID
}

// 会话回滚结果
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RevertSessionResultDto {
    pub session_id: String,
    pub reverted_numbers: i64,
    pub old_status: String,
    pub new_status: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DeleteImportSessionResultDto {
    pub session_id: i64,
    pub archived_number_count: i64,
    pub removed_event_count: i64,
    pub removed_batch_link_count: i64,
    pub removed_batch_record: bool,
}
