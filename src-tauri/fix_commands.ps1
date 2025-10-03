$file = "src\services\contact_storage\commands.rs"
$content = Get-Content $file -Raw

# 修复 1: 添加 allocated_numbers 字段
$old1 = @"
        Ok((batch_id, vcf_file_path, number_ids, session_id)) => Ok(AllocationResultDto {
            device_id,
            batch_id,
            vcf_file_path,
            number_count: number_ids.len() as i64,
            number_ids,
            session_id,
        }),
"@

$new1 = @"
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
        },
"@

$content = $content.Replace($old1, $new1)

# 修复 2: 添加 used, unused, vcf_generated, imported 字段
$old2 = @"
    Ok(ContactNumberStatsDto {
        total: raw.total,
        unclassified: raw.unclassified,
        not_imported: raw.not_imported,
"@

$new2 = @"
    Ok(ContactNumberStatsDto {
        total: raw.total,
        used: raw.used,
        unused: raw.unused,
        vcf_generated: raw.vcf_generated,
        imported: raw.imported,
        unclassified: raw.unclassified,
        not_imported: raw.not_imported,
"@

$content = $content.Replace($old2, $new2)

# 写回文件
$content | Set-Content $file -NoNewline

Write-Host "✅ commands.rs 修复完成"
