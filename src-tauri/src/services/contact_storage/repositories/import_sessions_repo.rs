/// 导入会话仓储
/// 
/// 负责导入会话相关的数据操作，包括：
/// - 导入会话的创建和管理
/// - 会话状态的更新和查询
/// - 会话事件的记录和查询
/// - 会话的删除和回滚操作

use chrono::Local;
use rusqlite::{params, Connection, OptionalExtension, Result as SqlResult};
use super::super::models::{ImportSessionDto, ImportSessionList, ImportSessionEventList, ImportSessionEventDto};

/// 删除导入会话的结果
pub struct DeleteImportSessionResult {
    pub session_id: i64,
    pub archived_number_count: i64,
    pub removed_event_count: i64,
    pub removed_batch_link_count: i64,
    pub removed_batch_record: bool,
}

/// 创建导入会话
pub fn create_import_session(conn: &Connection, batch_id: &str, device_id: &str) -> SqlResult<i64> {
    let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    conn.execute(
        "INSERT INTO import_sessions (batch_id, device_id, status, created_at) VALUES (?1, ?2, 'pending', ?3)",
        params![batch_id, device_id, now],
    )?;
    Ok(conn.last_insert_rowid())
}

/// 完成导入会话
pub fn finish_import_session(
    conn: &Connection, 
    session_id: i64, 
    status: &str, 
    imported_count: i64, 
    failed_count: i64, 
    error_message: Option<&str>
) -> SqlResult<()> {
    let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    conn.execute(
        "UPDATE import_sessions SET status = ?1, imported_count = ?2, failed_count = ?3, error_message = ?4, completed_at = ?5 WHERE id = ?6",
        params![status, imported_count, failed_count, error_message, now, session_id],
    )?;

    // 记录会话完成事件
    conn.execute(
        "INSERT INTO import_session_events (session_id, event_type, event_data, created_at) VALUES (?1, ?2, ?3, ?4)",
        params![
            session_id,
            "session_completed",
            format!("{{\"status\":\"{}\",\"imported_count\":{},\"failed_count\":{}}}", status, imported_count, failed_count),
            now
        ],
    )?;

    Ok(())
}

/// 列出导入会话事件
pub fn list_import_session_events(
    conn: &Connection, 
    session_id: i64, 
    limit: i64, 
    offset: i64
) -> SqlResult<ImportSessionEventList> {
    let total: i64 = conn.query_row(
        "SELECT COUNT(*) FROM import_session_events WHERE session_id = ?1",
        params![session_id],
        |row| row.get(0),
    )?;

    let mut stmt = conn.prepare(
        "SELECT id, session_id, event_type, event_data, created_at FROM import_session_events WHERE session_id = ?1 ORDER BY created_at DESC LIMIT ?2 OFFSET ?3",
    )?;
    let rows = stmt.query_map(params![session_id, limit, offset], |row| {
        Ok(ImportSessionEventDto {
            id: row.get(0)?,
            session_id: row.get(1)?,
            event_type: row.get(2)?,
            event_data: row.get(3)?,
            created_at: row.get::<_, String>(4)?.clone(),
            occurred_at: row.get::<_, String>(4)?,
            device_id: None,
            status: None,
            imported_count: None,
            failed_count: None,
            error_message: None,
        })
    })?;

    Ok(ImportSessionEventList {
        items: rows.collect::<Result<Vec<_>, _>>()?,
        total,
        limit,
        offset,
    })
}

/// 列出导入会话
pub fn list_import_sessions(
    conn: &Connection, 
    device_id: Option<&str>, 
    batch_id: Option<&str>, 
    industry: Option<&str>, 
    limit: i64, 
    offset: i64
) -> SqlResult<ImportSessionList> {
    let mut where_conditions = Vec::new();
    let mut params_list = Vec::new();

    if let Some(did) = device_id {
        where_conditions.push("device_id = ?".to_string());
        params_list.push(did.to_string());
    }

    if let Some(bid) = batch_id {
        where_conditions.push("batch_id = ?".to_string());
        params_list.push(bid.to_string());
    }

    if let Some(ind) = industry {
        where_conditions.push("industry = ?".to_string());
        params_list.push(ind.to_string());
    }

    let where_sql = if where_conditions.is_empty() {
        String::new()
    } else {
        format!(" WHERE {}", where_conditions.join(" AND "))
    };

    let total_sql = format!("SELECT COUNT(*) FROM import_sessions{}", where_sql);
    let total: i64 = {
        let mut stmt = conn.prepare(&total_sql)?;
        let params_refs: Vec<&dyn rusqlite::ToSql> = params_list.iter().map(|s| s as &dyn rusqlite::ToSql).collect();
        stmt.query_row(&params_refs[..], |row| row.get(0))?
    };

    let list_sql = format!(
        "SELECT id, batch_id, device_id, status, success_count, failed_count, error_message, industry, created_at, finished_at \
         FROM import_sessions{} ORDER BY created_at DESC LIMIT ? OFFSET ?",
        where_sql
    );

    let mut list_params = params_list.clone();
    list_params.push(limit.to_string());
    list_params.push(offset.to_string());

    let mut stmt = conn.prepare(&list_sql)?;
    let list_params_refs: Vec<&dyn rusqlite::ToSql> = list_params.iter().map(|s| s as &dyn rusqlite::ToSql).collect();
    let rows = stmt.query_map(&list_params_refs[..], |row| {
        let id: i64 = row.get(0)?;
        Ok(ImportSessionDto {
            id,
            session_id: id.to_string(),
            batch_id: row.get(1)?,
            device_id: row.get(2)?,
            target_app: "未知".to_string(),
            session_description: None,
            status: row.get(3)?,
            success_count: row.get(4)?,
            failed_count: row.get(5)?,
            started_at: chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
            finished_at: row.get(9)?,
            created_at: row.get(8)?,
            error_message: row.get(6)?,
            industry: row.get(7)?,
        })
    })?;

    Ok(ImportSessionList {
        items: rows.collect::<Result<Vec<_>, _>>()?,
        total,
        limit,
        offset,
    })
}

/// 更新导入会话的行业分类
pub fn update_import_session_industry(
    conn: &Connection, 
    session_id: i64, 
    industry: Option<&str>
) -> SqlResult<()> {
    let affected = conn.execute(
        "UPDATE import_sessions SET industry = ?1 WHERE id = ?2",
        params![industry, session_id],
    )?;

    if affected > 0 {
        // 记录更新事件
        let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
        let event_data = if let Some(ind) = industry {
            format!("{{\"new_industry\":\"{}\"}}", ind)
        } else {
            "{\"new_industry\":null}".to_string()
        };

        conn.execute(
            "INSERT INTO import_session_events (session_id, event_type, event_data, created_at) VALUES (?1, ?2, ?3, ?4)",
            params![session_id, "industry_updated", event_data, now],
        )?;
    }

    Ok(())
}

/// 将导入会话回滚为失败状态
/// 
/// 返回恢复为可用状态的号码数量
pub fn revert_import_session_to_failed(
    conn: &Connection, 
    session_id: i64, 
    reason: Option<&str>
) -> SqlResult<i64> {
    // 获取会话信息
    let session_info: Option<(String, String)> = conn.query_row(
        "SELECT batch_id, device_id FROM import_sessions WHERE id = ?1",
        params![session_id],
        |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
    ).optional()?;

    let (batch_id, device_id) = match session_info {
        Some(info) => info,
        None => return Ok(0), // 会话不存在
    };

    // 恢复关联号码的状态
    let recovered_count = conn.execute(
        "UPDATE contact_numbers SET status = 'available', imported_device_id = NULL, assigned_batch_id = NULL, assigned_at = NULL 
         WHERE imported_device_id = ?1 AND assigned_batch_id = ?2",
        params![device_id, batch_id],
    )? as i64;

    // 更新会话状态
    let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let error_message = reason.unwrap_or("用户手动回滚");
    let full_error_message = format!("手动回滚 - {}", error_message);

    conn.execute(
        "UPDATE import_sessions SET status = 'failed', error_message = ?1, completed_at = ?2 WHERE id = ?3",
        params![full_error_message, now, session_id],
    )?;

    // 记录回滚事件
    let event_data = format!(
        "{{\"reason\":\"{}\",\"recovered_numbers\":{}}}",
        reason.unwrap_or("用户手动回滚"),
        recovered_count
    );
    conn.execute(
        "INSERT INTO import_session_events (session_id, event_type, event_data, created_at) VALUES (?1, ?2, ?3, ?4)",
        params![session_id, "session_reverted", event_data, now],
    )?;

    Ok(recovered_count)
}

/// 删除导入会话
/// 
/// archive_numbers: 是否归档关联的号码而不是删除
pub fn delete_import_session(
    conn: &Connection, 
    session_id: i64, 
    archive_numbers: bool
) -> SqlResult<DeleteImportSessionResult> {
    // 获取会话信息
    let session_info: Option<(String, String)> = conn.query_row(
        "SELECT batch_id, device_id FROM import_sessions WHERE id = ?1",
        params![session_id],
        |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
    ).optional()?;

    let (batch_id, _device_id) = match session_info {
        Some(info) => info,
        None => {
            return Ok(DeleteImportSessionResult {
                session_id,
                archived_number_count: 0,
                removed_event_count: 0,
                removed_batch_link_count: 0,
                removed_batch_record: false,
            });
        }
    };

    // 处理关联的号码
    let archived_number_count = if archive_numbers {
        // 归档号码：清除导入状态但保留号码
        conn.execute(
            "UPDATE contact_numbers SET status = 'archived', imported_device_id = NULL, assigned_batch_id = NULL, assigned_at = NULL 
             WHERE imported_device_id IN (
                 SELECT device_id FROM import_sessions WHERE id = ?1
             ) AND assigned_batch_id = ?2",
            params![session_id, batch_id],
        )? as i64
    } else {
        // 恢复号码为可用状态
        conn.execute(
            "UPDATE contact_numbers SET status = 'available', imported_device_id = NULL, assigned_batch_id = NULL, assigned_at = NULL 
             WHERE imported_device_id IN (
                 SELECT device_id FROM import_sessions WHERE id = ?1
             ) AND assigned_batch_id = ?2",
            params![session_id, batch_id],
        )? as i64
    };

    // 删除会话事件
    let removed_event_count = conn.execute(
        "DELETE FROM import_session_events WHERE session_id = ?1",
        params![session_id],
    )? as i64;

    // 删除批次与号码的关联
    let removed_batch_link_count = conn.execute(
        "DELETE FROM vcf_batch_numbers WHERE batch_id = ?1",
        params![batch_id],
    )? as i64;

    // 检查是否应该删除批次记录（如果没有其他会话使用）
    let other_sessions_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM import_sessions WHERE batch_id = ?1 AND id != ?2",
        params![batch_id, session_id],
        |row| row.get(0),
    )?;

    let removed_batch_record = if other_sessions_count == 0 {
        // 没有其他会话使用此批次，删除批次记录
        conn.execute(
            "DELETE FROM vcf_batches WHERE batch_id = ?1",
            params![batch_id],
        )? > 0
    } else {
        false
    };

    // 删除会话记录
    conn.execute(
        "DELETE FROM import_sessions WHERE id = ?1",
        params![session_id],
    )?;

    Ok(DeleteImportSessionResult {
        session_id,
        archived_number_count,
        removed_event_count,
        removed_batch_link_count,
        removed_batch_record,
    })
}

/// 获取导入会话统计信息
pub fn get_import_session_stats(conn: &Connection, device_id: Option<&str>) -> SqlResult<ImportSessionStats> {
    let (where_clause, params) = if let Some(device) = device_id {
        (" WHERE device_id = ?", vec![device])
    } else {
        ("", vec![])
    };

    let total_sessions: i64 = {
        let sql = format!("SELECT COUNT(*) FROM import_sessions{}", where_clause);
        let mut stmt = conn.prepare(&sql)?;
        if let Some(device) = device_id {
            stmt.query_row([device], |row| row.get(0))?
        } else {
            stmt.query_row([], |row| row.get(0))?
        }
    };

    let pending_sessions: i64 = {
        let sql = format!("SELECT COUNT(*) FROM import_sessions{} AND status = 'pending'", 
                         if device_id.is_some() { where_clause } else { " WHERE status = 'pending'" });
        let mut stmt = conn.prepare(&sql)?;
        if let Some(device) = device_id {
            stmt.query_row([device], |row| row.get(0))?
        } else {
            stmt.query_row([], |row| row.get(0))?
        }
    };

    let successful_sessions: i64 = {
        let sql = format!("SELECT COUNT(*) FROM import_sessions{} AND status = 'success'", 
                         if device_id.is_some() { where_clause } else { " WHERE status = 'success'" });
        let mut stmt = conn.prepare(&sql)?;
        if let Some(device) = device_id {
            stmt.query_row([device], |row| row.get(0))?
        } else {
            stmt.query_row([], |row| row.get(0))?
        }
    };

    let failed_sessions: i64 = {
        let sql = format!("SELECT COUNT(*) FROM import_sessions{} AND status = 'failed'", 
                         if device_id.is_some() { where_clause } else { " WHERE status = 'failed'" });
        let mut stmt = conn.prepare(&sql)?;
        if let Some(device) = device_id {
            stmt.query_row([device], |row| row.get(0))?
        } else {
            stmt.query_row([], |row| row.get(0))?
        }
    };

    let total_imported_numbers: i64 = {
        let sql = format!("SELECT COALESCE(SUM(success_count), 0) FROM import_sessions{}", where_clause);
        let mut stmt = conn.prepare(&sql)?;
        if let Some(device) = device_id {
            stmt.query_row([device], |row| row.get(0))?
        } else {
            stmt.query_row([], |row| row.get(0))?
        }
    };

    let total_failed_numbers: i64 = {
        let sql = format!("SELECT COALESCE(SUM(failed_count), 0) FROM import_sessions{}", where_clause);
        let mut stmt = conn.prepare(&sql)?;
        if let Some(device) = device_id {
            stmt.query_row([device], |row| row.get(0))?
        } else {
            stmt.query_row([], |row| row.get(0))?
        }
    };

    Ok(ImportSessionStats {
        total_sessions,
        pending_sessions,
        successful_sessions,
        failed_sessions,
        total_imported_numbers,
        total_failed_numbers,
    })
}

/// 导入会话统计信息
pub struct ImportSessionStats {
    pub total_sessions: i64,
    pub pending_sessions: i64,
    pub successful_sessions: i64,
    pub failed_sessions: i64,
    pub total_imported_numbers: i64,
    pub total_failed_numbers: i64,
}

/// 获取单个导入会话
pub fn get_import_session(conn: &Connection, session_id: i64) -> SqlResult<Option<ImportSessionDto>> {
    let mut stmt = conn.prepare(
        "SELECT id, batch_id, device_id, status, success_count, failed_count, error_message, created_at, finished_at 
         FROM import_sessions WHERE id = ?1"
    )?;
    
    stmt.query_row(params![session_id], |row| {
        let id: i64 = row.get(0)?;
        Ok(ImportSessionDto {
            id,
            session_id: id.to_string(),
            batch_id: row.get(1)?,
            device_id: row.get(2)?,
            status: row.get(3)?,
            success_count: row.get(4)?,
            failed_count: row.get(5)?,
            error_message: row.get(6)?,
            created_at: row.get(7)?,
            started_at: row.get::<_, Option<String>>(7)?.unwrap_or_default(),
            finished_at: row.get(8)?,
            session_description: None,
            target_app: "未知".to_string(),
            industry: None,
        })
    }).optional()
}

/// 获取最近的导入会话
pub fn get_recent_import_sessions(conn: &Connection, limit: i64) -> SqlResult<Vec<ImportSessionDto>> {
    let mut stmt = conn.prepare(
        "SELECT id, batch_id, device_id, status, success_count, failed_count, error_message, industry, created_at, finished_at 
         FROM import_sessions ORDER BY created_at DESC LIMIT ?1"
    )?;
    
    let rows = stmt.query_map(params![limit], |row| {
        let id: i64 = row.get(0)?;
        Ok(ImportSessionDto {
            id,
            session_id: id.to_string(),
            batch_id: row.get(1)?,
            device_id: row.get(2)?,
            target_app: "未知".to_string(),
            session_description: None,
            status: row.get(3)?,
            success_count: row.get(4)?,
            failed_count: row.get(5)?,
            started_at: chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
            finished_at: row.get(9)?,
            created_at: row.get(8)?,
            error_message: row.get(6)?,
            industry: row.get(7)?,
        })
    })?;
    
    rows.collect::<Result<Vec<_>, _>>()
}

/// 按设备ID获取导入会话
pub fn get_import_sessions_by_device(conn: &Connection, device_id: &str, limit: i64) -> SqlResult<Vec<ImportSessionDto>> {
    let mut stmt = conn.prepare(
        "SELECT id, batch_id, device_id, status, success_count, failed_count, error_message, industry, created_at, finished_at 
         FROM import_sessions WHERE device_id = ?1 ORDER BY created_at DESC LIMIT ?2"
    )?;
    
    let rows = stmt.query_map(params![device_id, limit], |row| {
        let id: i64 = row.get(0)?;
        Ok(ImportSessionDto {
            id,
            session_id: id.to_string(),
            batch_id: row.get(1)?,
            device_id: row.get(2)?,
            target_app: "未知".to_string(),
            session_description: None,
            status: row.get(3)?,
            success_count: row.get(4)?,
            failed_count: row.get(5)?,
            started_at: chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
            finished_at: row.get(9)?,
            created_at: row.get(8)?,
            error_message: row.get(6)?,
            industry: row.get(7)?,
        })
    })?;
    
    rows.collect::<Result<Vec<_>, _>>()
}

/// 按批次ID获取导入会话
pub fn get_import_sessions_by_batch(conn: &Connection, batch_id: &str, limit: i64) -> SqlResult<Vec<ImportSessionDto>> {
    let mut stmt = conn.prepare(
        "SELECT id, batch_id, device_id, status, success_count, failed_count, error_message, industry, created_at, finished_at 
         FROM import_sessions WHERE batch_id = ?1 ORDER BY created_at DESC LIMIT ?2"
    )?;
    
    let rows = stmt.query_map(params![batch_id, limit], |row| {
        let id: i64 = row.get(0)?;
        Ok(ImportSessionDto {
            id,
            session_id: id.to_string(),
            batch_id: row.get(1)?,
            device_id: row.get(2)?,
            target_app: "未知".to_string(),
            session_description: None,
            status: row.get(3)?,
            success_count: row.get(4)?,
            failed_count: row.get(5)?,
            started_at: chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
            finished_at: row.get(9)?,
            created_at: row.get(8)?,
            error_message: row.get(6)?,
            industry: row.get(7)?,
        })
    })?;
    
    rows.collect::<Result<Vec<_>, _>>()
}

/// 批量删除导入会话
pub fn batch_delete_import_sessions(conn: &Connection, session_ids: &[i64]) -> SqlResult<i64> {
    let mut deleted_count = 0;
    for session_id in session_ids {
        let result = delete_import_session(conn, *session_id, false)?;
        if result.session_id > 0 {
            deleted_count += 1;
        }
    }
    Ok(deleted_count)
}

/// 获取失败的导入会话
pub fn get_failed_import_sessions(conn: &Connection, limit: i64) -> SqlResult<Vec<ImportSessionDto>> {
    let mut stmt = conn.prepare(
        "SELECT id, batch_id, device_id, status, success_count, failed_count, error_message, industry, created_at, finished_at 
         FROM import_sessions WHERE status = 'failed' ORDER BY created_at DESC LIMIT ?1"
    )?;
    
    let rows = stmt.query_map(params![limit], |row| {
        let id: i64 = row.get(0)?;
        Ok(ImportSessionDto {
            id,
            session_id: id.to_string(),
            batch_id: row.get(1)?,
            device_id: row.get(2)?,
            target_app: "未知".to_string(),
            session_description: None,
            status: row.get(3)?,
            success_count: row.get(4)?,
            failed_count: row.get(5)?,
            started_at: chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
            finished_at: row.get(9)?,
            created_at: row.get(8)?,
            error_message: row.get(6)?,
            industry: row.get(7)?,
        })
    })?;
    
    rows.collect::<Result<Vec<_>, _>>()
}

/// 获取成功的导入会话
pub fn get_successful_import_sessions(conn: &Connection, limit: i64) -> SqlResult<Vec<ImportSessionDto>> {
    let mut stmt = conn.prepare(
        "SELECT id, batch_id, device_id, status, success_count, failed_count, error_message, industry, created_at, finished_at 
         FROM import_sessions WHERE status = 'completed' ORDER BY created_at DESC LIMIT ?1"
    )?;
    
    let rows = stmt.query_map(params![limit], |row| {
        let id: i64 = row.get(0)?;
        Ok(ImportSessionDto {
            id,
            session_id: id.to_string(),
            batch_id: row.get(1)?,
            device_id: row.get(2)?,
            target_app: "未知".to_string(),
            session_description: None,
            status: row.get(3)?,
            success_count: row.get(4)?,
            failed_count: row.get(5)?,
            started_at: chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
            finished_at: row.get(9)?,
            created_at: row.get(8)?,
            error_message: row.get(6)?,
            industry: row.get(7)?,
        })
    })?;
    
    rows.collect::<Result<Vec<_>, _>>()
}

/// 更新导入会话状态
pub fn update_import_session_status(conn: &Connection, session_id: i64, status: &str) -> SqlResult<()> {
    conn.execute(
        "UPDATE import_sessions SET status = ?1 WHERE id = ?2",
        params![status, session_id],
    )?;
    Ok(())
}

/// 添加导入会话事件
pub fn add_import_session_event(
    conn: &Connection, 
    session_id: i64, 
    event_type: &str, 
    event_data: &str
) -> SqlResult<i64> {
    let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    conn.execute(
        "INSERT INTO import_session_events (session_id, event_type, event_data, created_at) VALUES (?1, ?2, ?3, ?4)",
        params![session_id, event_type, event_data, now],
    )?;
    Ok(conn.last_insert_rowid())
}

/// 按日期范围获取导入会话
pub fn get_import_sessions_by_date_range(
    conn: &Connection, 
    start_date: &str, 
    end_date: &str, 
    limit: i64
) -> SqlResult<Vec<ImportSessionDto>> {
    let mut stmt = conn.prepare(
        "SELECT id, batch_id, device_id, status, success_count, failed_count, error_message, industry, created_at, finished_at 
         FROM import_sessions WHERE created_at BETWEEN ?1 AND ?2 ORDER BY created_at DESC LIMIT ?3"
    )?;
    
    let rows = stmt.query_map(params![start_date, end_date, limit], |row| {
        let id: i64 = row.get(0)?;
        Ok(ImportSessionDto {
            id,
            session_id: id.to_string(),
            batch_id: row.get(1)?,
            device_id: row.get(2)?,
            target_app: "未知".to_string(),
            session_description: None,
            status: row.get(3)?,
            success_count: row.get(4)?,
            failed_count: row.get(5)?,
            started_at: chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
            finished_at: row.get(9)?,
            created_at: row.get(8)?,
            error_message: row.get(6)?,
            industry: row.get(7)?,
        })
    })?;
    
    rows.collect::<Result<Vec<_>, _>>()
}

/// 获取会话中不同的行业列表
pub fn get_distinct_session_industries(conn: &Connection) -> SqlResult<Vec<String>> {
    let mut stmt = conn.prepare(
        "SELECT DISTINCT industry FROM contact_numbers 
         WHERE industry IS NOT NULL 
         ORDER BY industry"
    )?;
    
    let rows = stmt.query_map([], |row| row.get::<_, String>(0))?;
    rows.collect::<Result<Vec<_>, _>>()
}

/// 获取导入会话事件（别名函数，兼容旧代码）
pub fn get_import_session_events(
    conn: &Connection, 
    session_id: i64, 
    limit: i64, 
    offset: i64
) -> SqlResult<ImportSessionEventList> {
    list_import_session_events(conn, session_id, limit, offset)
}
