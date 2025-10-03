# 修复 commands.rs 中的两个 E0063 错误
$ErrorActionPreference = "Stop"

$file = "src\services\contact_storage\commands.rs"

Write-Host "正在读取文件: $file"
$content = Get-Content $file -Raw -Encoding UTF8

# 修复 1: 添加 allocated_numbers 字段
$old1 = @"
    match allocate_numbers_to_device(&conn, &device_id, count, industry.as_deref()) {
        Ok((batch_id, vcf_file_path, number_ids, session_id)) => Ok(AllocationResultDto {
            device_id,
            batch_id,
            vcf_file_path,
            number_count: number_ids.len() as i64,
            number_ids,
            session_id,
        }),
        Err(e) => Err(e.to_string()),
    }
"@

$new1 = @"
    match allocate_numbers_to_device(&conn, &device_id, count, industry.as_deref()) {
        Ok((batch_id, vcf_file_path, number_ids, session_id)) => {
            // 查询分配的号码详情
            let allocated_numbers = if !number_ids.is_empty() {
                let min_id = *number_ids.iter().min().unwrap();
                let max_id = *number_ids.iter().max().unwrap();
                fetch_numbers_by_id_range(&conn, min_id, max_id).unwrap_or_default()
            } else {
                Vec::new()
            };
            
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
        Err(e) => Err(e.to_string()),
    }
"@

Write-Host "修复 1: 添加 allocated_numbers 字段..."
$content = $content.Replace($old1, $new1)

# 修复 2: 添加 used, unused, vcf_generated, imported 字段
$old2 = @"
    let raw = get_contact_number_stats(&conn).map_err(|e| e.to_string())?;
    Ok(ContactNumberStatsDto {
        total: raw.total,
        unclassified: raw.unclassified,
        not_imported: raw.not_imported,
        per_industry: raw
            .per_industry
            .into_iter()
            .map(|(industry, count)| IndustryCountDto { industry, count })
            .collect(),
    })
"@

$new2 = @"
    let raw = get_contact_number_stats(&conn).map_err(|e| e.to_string())?;
    Ok(ContactNumberStatsDto {
        total: raw.total,
        used: raw.used,
        unused: raw.unused,
        vcf_generated: raw.vcf_generated,
        imported: raw.imported,
        unclassified: raw.unclassified,
        not_imported: raw.not_imported,
        per_industry: raw
            .per_industry
            .into_iter()
            .map(|(industry, count)| IndustryCountDto { industry, count })
            .collect(),
    })
"@

Write-Host "修复 2: 添加 used, unused, vcf_generated, imported 字段..."
$content = $content.Replace($old2, $new2)

# 写回文件
Write-Host "写回文件..."
$content | Out-File -FilePath $file -Encoding UTF8 -NoNewline

Write-Host "✅ 修复完成！"
Write-Host ""
Write-Host "运行 cargo check 验证..."
cargo check 2>&1 | Select-String "error\[" | Measure-Object | ForEach-Object { Write-Host "错误数: $($_.Count)" }
