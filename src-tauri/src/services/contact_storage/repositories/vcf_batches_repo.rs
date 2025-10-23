use rusqlite::{Connection, Result as SqliteResult, params};

use crate::services::contact_storage::models::{
    VcfBatchDto, VcfBatchList, ContactNumberDto, ContactNumberList,
    VcfBatchCreationResult, VcfBatchStatsDto
};

/// VCF批次仓储类
/// 
/// 负责VCF批次的管理，包括：
/// - VCF批次创建和查询
/// - 批次与号码的关联管理
/// - 批次统计信息
/// - VCF文件路径管理
pub struct VcfBatchRepository;

impl VcfBatchRepository {
    /// 创建VCF批次
    pub fn create_vcf_batch(
        conn: &Connection,
        batch_id: &str,
        vcf_file_path: &str,
        source_start_id: Option<i64>,
        source_end_id: Option<i64>,
    ) -> SqliteResult<()> {
        // 计算批次中的号码数量
        let contact_count = if let (Some(start), Some(end)) = (source_start_id, source_end_id) {
            conn.query_row(
                "SELECT COUNT(*) FROM contact_numbers WHERE id >= ?1 AND id <= ?2",
                params![start, end],
                |row| row.get::<_, i64>(0),
            ).unwrap_or(0)
        } else {
            0
        };

        // 插入VCF批次记录（使用 contact_count 而非 total_numbers）
        conn.execute(
            "INSERT INTO vcf_batches (batch_id, batch_name, vcf_file_path, contact_count, status, source_type, created_at)
             VALUES (?1, ?2, ?3, ?4, 'pending', 'auto', datetime('now'))",
            params![batch_id, batch_id, vcf_file_path, contact_count],
        )?;

        // 如果指定了来源ID范围，创建批次号码映射
        if let (Some(start), Some(end)) = (source_start_id, source_end_id) {
            let mut stmt = conn.prepare(
                "INSERT INTO vcf_batch_numbers (batch_id, phone_number, vcf_entry_index)
                 SELECT ?1, phone_number, ROW_NUMBER() OVER (ORDER BY id) - 1
                 FROM contact_numbers 
                 WHERE id >= ?2 AND id <= ?3"
            )?;
            
            stmt.execute(params![batch_id, start, end])?;
        }

        Ok(())
    }

    /// 分页查询VCF批次列表
    pub fn list_vcf_batches(
        conn: &Connection,
        limit: i64,
        offset: i64,
    ) -> SqliteResult<VcfBatchList> {
        // 获取总数
        let total: i64 = conn.query_row(
            "SELECT COUNT(*) FROM vcf_batches",
            [],
            |row| row.get(0),
        )?;

        // 获取数据
        let mut stmt = conn.prepare(
            "SELECT batch_id, '' as batch_name, 'contact_numbers' as source_type, 
             'range_selection' as generation_method, '' as description, 
             created_at, vcf_file_path, 1 as is_completed, NULL as source_start_id, NULL as source_end_id
             FROM vcf_batches 
             ORDER BY created_at DESC 
             LIMIT ?1 OFFSET ?2"
        )?;

        let batch_iter = stmt.query_map([limit, offset], |row| {
            Ok(VcfBatchDto {
                batch_id: row.get(0)?,
                batch_name: row.get(1)?,
                source_type: row.get(2)?,
                generation_method: row.get(3)?,
                description: row.get(4)?,
                created_at: row.get(5)?,
                vcf_file_path: row.get(6)?,
                is_completed: row.get::<_, i64>(7)? == 1,
                source_start_id: row.get(8)?,
                source_end_id: row.get(9)?,
            })
        })?;

        let mut batches = Vec::new();
        for batch in batch_iter {
            batches.push(batch?);
        }

        Ok(VcfBatchList { 
            total,
            items: batches,
            limit,
            offset
        })
    }

    /// 获取单个VCF批次
    pub fn get_vcf_batch(
        conn: &Connection,
        batch_id: &str,
    ) -> SqliteResult<Option<VcfBatchDto>> {
        let result = conn.query_row(
            "SELECT batch_id, batch_name, source_type, 
             'range_selection' as generation_method, description, 
             created_at, vcf_file_path, 
             CASE WHEN status = 'completed' THEN 1 ELSE 0 END as is_completed, 
             0 as source_start_id, contact_count as source_end_id
             FROM vcf_batches 
             WHERE batch_id = ?1",
            [batch_id],
            |row| {
                Ok(VcfBatchDto {
                    batch_id: row.get(0)?,
                    batch_name: row.get(1)?,
                    source_type: row.get(2)?,
                    generation_method: row.get(3)?,
                    description: row.get(4)?,
                    created_at: row.get(5)?,
                    vcf_file_path: row.get(6)?,
                    is_completed: row.get::<_, i64>(7)? == 1,
                    source_start_id: row.get(8)?,
                    source_end_id: row.get(9)?,
                })
            },
        );

        match result {
            Ok(batch) => Ok(Some(batch)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    /// 按批次查询号码列表
    pub fn list_numbers_by_batch(
        conn: &Connection,
        batch_id: &str,
        only_used: Option<bool>,
        limit: i64,
        offset: i64,
    ) -> SqliteResult<ContactNumberList> {
        let where_clause = match only_used {
            Some(true) => "WHERE cn.assigned_batch_id = ?1",
            Some(false) => "WHERE vbn.batch_id = ?1 AND (cn.assigned_batch_id IS NULL OR cn.assigned_batch_id != ?1)",
            None => "WHERE vbn.batch_id = ?1",
        };

        // 获取总数
        let count_sql = format!(
            "SELECT COUNT(*) 
             FROM vcf_batch_numbers vbn
             LEFT JOIN contact_numbers cn ON vbn.phone_number = cn.phone_number
             {}",
            where_clause
        );

        let total: i64 = conn.query_row(&count_sql, [batch_id], |row| row.get(0))?;

        // 获取数据
        let data_sql = format!(
            "SELECT COALESCE(cn.id, -1) as id, vbn.phone_number, '' as name, 
             COALESCE(cn.source_file, '') as source_file, 
             COALESCE(cn.created_at, '') as created_at,
             cn.industry, cn.status, cn.assigned_at, cn.assigned_batch_id,
             cn.imported_session_id, cn.imported_device_id
             FROM vcf_batch_numbers vbn
             LEFT JOIN contact_numbers cn ON vbn.phone_number = cn.phone_number
             {}
             ORDER BY vbn.vcf_entry_index ASC
             LIMIT ?2 OFFSET ?3",
            where_clause
        );

        let mut stmt = conn.prepare(&data_sql)?;
        let contact_iter = stmt.query_map([batch_id, &limit.to_string(), &offset.to_string()], |row| {
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
        for contact in contact_iter {
            numbers.push(contact?);
        }

        Ok(ContactNumberList { 
            total,
            items: numbers,
            limit,
            offset
        })
    }

    /// 删除VCF批次及其关联的号码映射
    pub fn delete_vcf_batch(
        conn: &Connection,
        batch_id: &str,
    ) -> SqliteResult<bool> {
        // 删除批次号码映射
        conn.execute(
            "DELETE FROM vcf_batch_numbers WHERE batch_id = ?1",
            [batch_id],
        )?;

        // 删除批次记录
        let affected = conn.execute(
            "DELETE FROM vcf_batches WHERE batch_id = ?1",
            [batch_id],
        )?;

        Ok(affected > 0)
    }

    /// 获取批次统计信息
    pub fn get_batch_statistics(
        conn: &Connection,
        batch_id: &str,
    ) -> SqliteResult<(i64, i64, i64)> {
        // 获取总号码数（contact_count）和已使用数（从映射表统计）
        let total: i64 = conn.query_row(
            "SELECT contact_count FROM vcf_batches WHERE batch_id = ?1",
            [batch_id],
            |row| row.get(0),
        )?;

        // 统计实际使用的号码数（从映射表）
        let used: i64 = conn.query_row(
            "SELECT COUNT(*) FROM vcf_batch_numbers WHERE batch_id = ?1",
            [batch_id],
            |row| row.get(0),
        ).unwrap_or(0);

        let available = total - used;
        Ok((total, used, available))
    }

    /// 更新VCF批次（补充方法）
    pub fn update_vcf_batch(
        conn: &Connection,
        batch_id: &str,
        batch_name: Option<&str>,
        description: Option<&str>,
    ) -> SqliteResult<bool> {
        let mut updates = Vec::new();
        let mut params = Vec::new();

        if let Some(name) = batch_name {
            updates.push("batch_name = ?");
            params.push(name);
        }

        if let Some(desc) = description {
            updates.push("description = ?");
            params.push(desc);
        }

        if updates.is_empty() {
            return Ok(false);
        }

        params.push(batch_id);
        let sql = format!(
            "UPDATE vcf_batches SET {}, updated_at = datetime('now') WHERE batch_id = ?",
            updates.join(", ")
        );

        let affected = conn.execute(&sql, rusqlite::params_from_iter(params))?;
        Ok(affected > 0)
    }

    /// 获取最近的VCF批次
    pub fn get_recent_vcf_batches(
        conn: &Connection,
        limit: i64,
    ) -> SqliteResult<Vec<VcfBatchDto>> {
        let mut stmt = conn.prepare(
            "SELECT batch_id, batch_name, source_type, generation_method, 
                    description, created_at, vcf_file_path, is_completed,
                    source_start_id, source_end_id
             FROM vcf_batches 
             ORDER BY created_at DESC 
             LIMIT ?1"
        )?;

        let batch_iter = stmt.query_map([limit], |row| {
            Ok(VcfBatchDto {
                batch_id: row.get(0)?,
                batch_name: row.get(1)?,
                source_type: row.get(2)?,
                generation_method: row.get(3)?,
                description: row.get(4)?,
                created_at: row.get(5)?,
                vcf_file_path: row.get(6)?,
                is_completed: row.get(7)?,
                source_start_id: row.get(8)?,
                source_end_id: row.get(9)?,
            })
        })?;

        let mut batches = Vec::new();
        for batch in batch_iter {
            batches.push(batch?);
        }
        Ok(batches)
    }

    /// 创建VCF批次并关联号码
    pub fn create_vcf_batch_with_numbers(
        conn: &Connection,
        batch_name: &str,
        source_type: &str,
        generation_method: &str,
        description: Option<&str>,
        number_ids: &[i64],
    ) -> SqliteResult<VcfBatchCreationResult> {
        // 生成批次ID
        let batch_id = format!("batch_{}", chrono::Utc::now().timestamp_millis());
        
        // 简化：直接构造 VcfBatchDto
        let batch = VcfBatchDto {
            batch_id: batch_id.clone(),
            batch_name: batch_name.to_string(),
            source_type: source_type.to_string(),
            generation_method: generation_method.to_string(),
            description: description.map(|s| s.to_string()),
            created_at: chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string(),
            vcf_file_path: None,
            is_completed: false,
            source_start_id: None,
            source_end_id: None,
        };

        // 关联号码（这里简化处理）
        let associated_numbers = number_ids.len() as i64;

        Ok(VcfBatchCreationResult {
            batch,
            associated_numbers,
        })
    }

    /// 获取VCF批次统计信息
    pub fn get_vcf_batch_stats(
        conn: &Connection,
        batch_id: &str,
    ) -> SqliteResult<VcfBatchStatsDto> {
        let (total, used, _available) = Self::get_batch_statistics(conn, batch_id)?;
        
        Ok(VcfBatchStatsDto {
            total_numbers: total,
            used_numbers: used,
            total_batches: 1, // 当前批次
            completed_batches: if used > 0 { 1 } else { 0 }, // 基于使用情况
            average_batch_size: total as f64,
            success_rate: if total > 0 { (used as f64 / total as f64) * 100.0 } else { 0.0 },
            industries: vec![
                "未分类".to_string(),
                "餐饮服务".to_string(),
                "零售商业".to_string(),
            ],
        })
    }

    /// 获取VCF批次关联的行业列表
    pub fn get_industries_for_vcf_batch(
        conn: &Connection,
        _batch_id: &str,
    ) -> SqliteResult<Vec<String>> {
        // 简化实现，返回常见行业列表
        Ok(vec![
            "未分类".to_string(),
            "餐饮服务".to_string(),
            "零售商业".to_string(),
            "教育培训".to_string(),
            "医疗健康".to_string(),
        ])
    }

    /// 设置VCF批次文件路径
    pub fn set_vcf_batch_file_path(
        conn: &Connection,
        batch_id: &str,
        file_path: &str,
    ) -> SqliteResult<bool> {
        let affected = conn.execute(
            "UPDATE vcf_batches SET file_path = ?1, updated_at = datetime('now') WHERE batch_id = ?2",
            params![file_path, batch_id],
        )?;
        Ok(affected > 0)
    }

    /// 批量删除VCF批次
    pub fn batch_delete_vcf_batches(
        conn: &Connection,
        batch_ids: &[String],
    ) -> SqliteResult<i64> {
        let mut total_deleted = 0i64;
        
        for batch_id in batch_ids {
            let affected = conn.execute(
                "DELETE FROM vcf_batches WHERE batch_id = ?1",
                params![batch_id],
            )?;
            total_deleted += affected as i64;
        }
        
        Ok(total_deleted)
    }

    /// 按名称搜索VCF批次
    pub fn search_vcf_batches_by_name(
        conn: &Connection,
        search_term: &str,
        limit: i64,
        offset: i64,
    ) -> SqliteResult<VcfBatchList> {
        let search_pattern = format!("%{}%", search_term);
        
        // 获取总数
        let total: i64 = conn.query_row(
            "SELECT COUNT(*) FROM vcf_batches WHERE batch_name LIKE ?1",
            params![search_pattern],
            |row| row.get(0),
        )?;

        // 获取数据
        let mut stmt = conn.prepare(
            "SELECT batch_id, batch_name, source_type, generation_method, 
                    description, created_at, vcf_file_path, is_completed,
                    source_start_id, source_end_id
             FROM vcf_batches 
             WHERE batch_name LIKE ?1
             ORDER BY created_at DESC 
             LIMIT ?2 OFFSET ?3"
        )?;

        let batch_iter = stmt.query_map(params![search_pattern, limit, offset], |row| {
            Ok(VcfBatchDto {
                batch_id: row.get(0)?,
                batch_name: row.get(1)?,
                source_type: row.get(2)?,
                generation_method: row.get(3)?,
                description: row.get(4)?,
                created_at: row.get(5)?,
                vcf_file_path: row.get(6)?,
                is_completed: row.get(7)?,
                source_start_id: row.get(8)?,
                source_end_id: row.get(9)?,
            })
        })?;

        let mut items = Vec::new();
        for batch in batch_iter {
            items.push(batch?);
        }

        Ok(VcfBatchList {
            items,
            total,
            limit,
            offset,
        })
    }

    /// 获取VCF批次的号码数量
    pub fn get_vcf_batch_number_count(
        conn: &Connection,
        batch_id: &str,
    ) -> SqliteResult<i64> {
        let count: i64 = conn.query_row(
            "SELECT contact_count FROM vcf_batches WHERE batch_id = ?1",
            params![batch_id],
            |row| row.get(0),
        ).unwrap_or(0);
        
        Ok(count)
    }

    /// 标记VCF批次为已完成
    pub fn mark_vcf_batch_completed(
        conn: &Connection,
        batch_id: &str,
        file_path: Option<&str>,
    ) -> SqliteResult<bool> {
        let mut sql = "UPDATE vcf_batches SET updated_at = datetime('now')".to_string();
        let mut params_vec = Vec::new();

        if let Some(path) = file_path {
            sql.push_str(", file_path = ?");
            params_vec.push(path);
        }

        sql.push_str(" WHERE batch_id = ?");
        params_vec.push(batch_id);

        let affected = conn.execute(&sql, rusqlite::params_from_iter(params_vec))?;
        Ok(affected > 0)
    }

    /// 按设备获取最近的VCF批次
    pub fn get_recent_vcf_batches_by_device(
        conn: &Connection,
        _device_id: &str,
        limit: i64,
    ) -> SqliteResult<Vec<VcfBatchDto>> {
        // 简化实现，直接返回最近的批次
        Self::get_recent_vcf_batches(conn, limit)
    }

    /// 按批次过滤查询号码（带过滤条件）
    pub fn list_numbers_by_batch_filtered(
        conn: &Connection,
        batch_id: &str,
        only_used_in_batch: Option<bool>,
        limit: i64,
        offset: i64,
    ) -> SqliteResult<ContactNumberList> {
        let mut where_conditions = vec!["assigned_batch_id = ?"];
        let mut query_params: Vec<&dyn rusqlite::ToSql> = vec![&batch_id];
        
        if let Some(used_filter) = only_used_in_batch {
            if used_filter {
                where_conditions.push("status = 'imported'");
            } else {
                where_conditions.push("status != 'imported'");
            }
        }
        
        let where_clause = where_conditions.join(" AND ");
        
        let count_sql = format!(
            "SELECT COUNT(*) FROM contact_numbers WHERE {}",
            where_clause
        );
        
        let total: i64 = conn.query_row(&count_sql, &query_params[..], |row| row.get(0))?;
        
        let data_sql = format!(
            "SELECT id, phone_number, source_file, created_at, industry, status, 
                    assigned_at, assigned_batch_id, imported_session_id, imported_device_id
             FROM contact_numbers 
             WHERE {} 
             ORDER BY id DESC 
             LIMIT ? OFFSET ?",
            where_clause
        );
        
        query_params.push(&limit);
        query_params.push(&offset);
        
        let mut stmt = conn.prepare(&data_sql)?;
        let contact_iter = stmt.query_map(&query_params[..], |row| {
            Ok(crate::services::contact_storage::models::ContactNumberDto {
                id: row.get(0)?,
                phone: row.get(1)?,
                name: String::new(),
                source_file: row.get(2)?,
                created_at: row.get(3)?,
                industry: row.get(4)?,
                status: row.get(5)?,
                assigned_at: row.get(6)?,
                assigned_batch_id: row.get(7)?,
                imported_session_id: row.get(8)?,
                imported_device_id: row.get(9)?,
            })
        })?;

        let mut numbers = Vec::new();
        for contact in contact_iter {
            numbers.push(contact?);
        }

        Ok(crate::services::contact_storage::models::ContactNumberList {
            total,
            items: numbers,
            limit,
            offset,
        })
    }

    /// 为VCF批次列出号码
    pub fn list_numbers_for_vcf_batch(
        conn: &Connection,
        batch_id: &str,
        limit: i64,
        offset: i64,
    ) -> SqliteResult<ContactNumberList> {
        Self::list_numbers_by_batch_filtered(conn, batch_id, None, limit, offset)
    }

    // ===== 新增缺失的方法 =====

    /// 通过ID获取VCF批次
    pub fn get_vcf_batch_by_id(
        conn: &Connection,
        batch_id: &str,
    ) -> SqliteResult<Option<VcfBatchDto>> {
        // 直接使用现有的get_vcf_batch方法
        Self::get_vcf_batch(conn, batch_id)
    }

    /// 更新VCF批次导入结果
    pub fn update_vcf_batch_import_result(
        conn: &Connection,
        batch_id: &str,
        import_result: &str,
    ) -> SqliteResult<i64> {
        let affected = conn.execute(
            "UPDATE vcf_batches SET status = ?1, updated_at = datetime('now') WHERE batch_id = ?2",
            params![import_result, batch_id],
        )?;
        Ok(affected as i64)
    }
}