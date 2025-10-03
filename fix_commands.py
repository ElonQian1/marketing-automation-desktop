#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""修复 commands.rs 中的结构体字段缺失"""

import re

commands_file = r"src-tauri\src\services\contact_storage\commands.rs"

with open(commands_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 修复 1: allocate_numbers_to_device_cmd - 添加 allocated_numbers 字段
old_pattern_1 = r'''(/// 为设备分配号码，创建批次与待导入会话
\[tauri::command\]
pub async fn allocate_numbers_to_device_cmd\(device_id: String, count: i64, industry: Option<String>\) -> Result<AllocationResultDto, String> \{
    let db_path = get_contacts_db_path\(\);
    let conn = Connection::open\(&db_path\)\.map_err\(\|e\| format!\("打开数据库失败: \{\}", e\)\)\?;
    init_db\(&conn\)\.map_err\(\|e\| format!\("初始化数据库失败: \{\}", e\)\)\?;
    match allocate_numbers_to_device\(&conn, &device_id, count, industry\.as_deref\(\)\) \{
        Ok\(\(batch_id, vcf_file_path, number_ids, session_id\)\) => Ok\(AllocationResultDto \{
            device_id,
            batch_id,
            vcf_file_path,
            number_count: number_ids\.len\(\) as i64,
            number_ids,
            session_id,
        \}\),)'''

new_text_1 = r'''/// 为设备分配号码，创建批次与待导入会话
[tauri::command]
pub async fn allocate_numbers_to_device_cmd(device_id: String, count: i64, industry: Option<String>) -> Result<AllocationResultDto, String> {
    let db_path = get_contacts_db_path();
    let conn = Connection::open(&db_path).map_err(|e| format!("打开数据库失败: {}", e))?;
    init_db(&conn).map_err(|e| format!("初始化数据库失败: {}", e))?;
    match allocate_numbers_to_device(&conn, &device_id, count, industry.as_deref()) {
        Ok((batch_id, vcf_file_path, number_ids, session_id)) => {
            // 查询分配的号码详情
            let allocated_numbers: Vec<ContactNumberDto> = number_ids
                .iter()
                .filter_map(|&id| get_number_by_id(&conn, id).ok().flatten())
                .collect();
            
            Ok(AllocationResultDto {
                device_id,
                batch_id,
                vcf_file_path,
                number_count: number_ids.len() as i64,
                number_ids,
                session_id,
                allocated_numbers,
            })
        },'''

content = re.sub(old_pattern_1, new_text_1, content, flags=re.MULTILINE)

# 修复 2: get_contact_number_stats_cmd - 添加 used, unused, vcf_generated, imported 字段
old_pattern_2 = r'''(\[tauri::command\]
pub async fn get_contact_number_stats_cmd\(\) -> Result<ContactNumberStatsDto, String> \{
    let db_path = get_contacts_db_path\(\);
    let conn = Connection::open\(&db_path\)\.map_err\(\|e\| format!\("打开数据库失败: \{\}", e\)\)\?;
    init_db\(&conn\)\.map_err\(\|e\| format!\("初始化数据库失败: \{\}", e\)\)\?;
    let raw = get_contact_number_stats\(&conn\)\.map_err\(\|e\| e\.to_string\(\)\)\?;
    Ok\(ContactNumberStatsDto \{
        total: raw\.total,
        unclassified: raw\.unclassified,
        not_imported: raw\.not_imported,)'''

new_text_2 = r'''[tauri::command]
pub async fn get_contact_number_stats_cmd() -> Result<ContactNumberStatsDto, String> {
    let db_path = get_contacts_db_path();
    let conn = Connection::open(&db_path).map_err(|e| format!("打开数据库失败: {}", e))?;
    init_db(&conn).map_err(|e| format!("初始化数据库失败: {}", e))?;
    let raw = get_contact_number_stats(&conn).map_err(|e| e.to_string())?;
    Ok(ContactNumberStatsDto {
        total: raw.total,
        used: raw.used,
        unused: raw.unused,
        vcf_generated: raw.vcf_generated,
        imported: raw.imported,
        unclassified: raw.unclassified,
        not_imported: raw.not_imported,'''

content = re.sub(old_pattern_2, new_text_2, content, flags=re.MULTILINE)

with open(commands.file, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ commands.rs 修复完成")
