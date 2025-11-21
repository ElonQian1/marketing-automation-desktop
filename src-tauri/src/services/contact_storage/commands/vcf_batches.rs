/// VCF 批次命令
/// 
/// 提供 VCF 批次相关的 Tauri 命令处理函数

use tauri::{command, AppHandle};
use super::super::repository_facade::ContactStorageFacade;
use super::super::models;

/// 创建 VCF 批次
#[command]
pub async fn create_vcf_batch_cmd(
    app_handle: AppHandle,
    batch_name: String,
    _source_type: String,
    _generation_method: String,
    _description: Option<String>,
) -> Result<models::VcfBatchCreationResult, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    // 创建基础VCF批次，使用默认值
    facade.create_vcf_batch(&batch_name, "", 0, 0)
}

/// 列出 VCF 批次
#[command]
pub async fn list_vcf_batches_cmd(
    app_handle: AppHandle,
    limit: i64,
    offset: i64,
    search: Option<String>,
) -> Result<models::VcfBatchList, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    if let Some(search_term) = search {
        facade.search_vcf_batches_by_name(&search_term, limit, offset)
    } else {
        facade.list_vcf_batches(limit, offset)
    }
}

/// 列出 VCF 批次记录（兼容前端调用）
#[command]
pub async fn list_vcf_batch_records_cmd(
    app_handle: AppHandle,
    limit: i64,
    offset: i64,
) -> Result<models::VcfBatchList, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.list_vcf_batches(limit, offset)
}

/// 获取 VCF 批次详情
#[command]
pub async fn get_vcf_batch_cmd(
    app_handle: AppHandle,
    batch_id: String,
) -> Result<Option<models::VcfBatchDto>, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.get_vcf_batch(&batch_id)
}

/// 更新 VCF 批次
#[command]
pub async fn update_vcf_batch_cmd(
    app_handle: AppHandle,
    batch_id: String,
    vcf_file_path: Option<String>,
    _description: Option<String>,
) -> Result<i64, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.update_vcf_batch(&batch_id, vcf_file_path.as_deref(), _description.as_deref(), None)
}

/// 删除 VCF 批次
#[command]
pub async fn delete_vcf_batch_cmd(
    app_handle: AppHandle,
    _batch_id: String,
) -> Result<i64, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.delete_vcf_batch(&_batch_id)
}

/// 获取最近的 VCF 批次
#[command]
pub async fn get_recent_vcf_batches_cmd(
    app_handle: AppHandle,
    limit: i64,
) -> Result<models::VcfBatchList, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.get_recent_vcf_batches(limit)
}

/// 创建 VCF 批次并关联号码
#[command]
pub async fn create_vcf_batch_with_numbers_cmd(
    app_handle: AppHandle,
    batch_name: String,
    source_type: String,
    generation_method: String,
    _description: Option<String>,
    number_ids: Vec<i64>,
) -> Result<models::VcfBatchCreationResult, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.create_vcf_batch_with_numbers(&batch_name, number_ids.len() as i64, &source_type, &generation_method)
}

/// 获取 VCF 批次统计信息
#[command]
pub async fn get_vcf_batch_stats_cmd(
    app_handle: AppHandle,
    batch_id: String,
) -> Result<models::VcfBatchStatsDto, String> {
    let _ = batch_id;
    let facade = ContactStorageFacade::new(&app_handle);
    facade.get_vcf_batch_stats()
}

/// 设置 VCF 批次文件路径
#[command]
pub async fn set_vcf_batch_file_path_cmd(
    app_handle: AppHandle,
    batch_id: String,
    file_path: String,
) -> Result<bool, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.set_vcf_batch_file_path(&batch_id, &file_path)
}

/// 批量删除 VCF 批次
#[command]
pub async fn batch_delete_vcf_batches_cmd(
    app_handle: AppHandle,
    batch_ids: Vec<String>,
) -> Result<i64, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.batch_delete_vcf_batches(&batch_ids)
}

/// 按名称搜索 VCF 批次
#[command]
pub async fn search_vcf_batches_by_name_cmd(
    app_handle: AppHandle,
    name_pattern: String,
    limit: i64,
    offset: i64,
) -> Result<models::VcfBatchList, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.search_vcf_batches_by_name(&name_pattern, limit, offset)
}

/// 获取批次号码计数
#[command]
pub async fn get_vcf_batch_number_count_cmd(
    app_handle: AppHandle,
    batch_id: String,
) -> Result<i64, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.get_vcf_batch_number_count(&batch_id)
}

/// 标记 VCF 批次已完成
#[command]
pub async fn mark_vcf_batch_completed_cmd(
    app_handle: AppHandle,
    batch_id: String,
    _file_path: Option<String>,
) -> Result<bool, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.mark_vcf_batch_completed_instance(&batch_id, 0, 0)
}

/// 按设备获取最近使用的批次
#[command]
pub async fn get_recent_vcf_batches_by_device_cmd(
    app_handle: AppHandle,
    device_id: String,
    limit: i64,
) -> Result<models::VcfBatchList, String> {
    let facade = ContactStorageFacade::new(&app_handle);
    facade.get_recent_vcf_batches_by_device(&device_id, limit)
}

/// 获取批次的所有行业分类（需要在 ContactStorageFacade 中添加此方法）
#[command]
pub async fn get_industries_for_vcf_batch_cmd(
    app_handle: AppHandle,
    _batch_id: String,
) -> Result<Vec<String>, String> {
    // 临时实现，返回空列表
    // 后续需要在 VcfBatchRepository 和 ContactStorageFacade 中添加此方法
    let _facade = ContactStorageFacade::new(&app_handle);
    Ok(vec![])
}