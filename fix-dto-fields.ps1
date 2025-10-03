# 批量替换 V1 字段名为 V2.0 camelCase 字段名
$files = Get-ChildItem -Path "src/modules/contact-import" -Recurse -Include *.ts,*.tsx

$replacements = @{
    '\.file_path' = '.filePath'
    '\.file_name' = '.fileName'
    '\.file_size' = '.fileSize'
    '\.total_numbers' = '.totalNumbers' 
    '\.successful_imports' = '.importedNumbers'
    '\.imported_numbers' = '.importedNumbers'
    '\.duplicate_numbers' = '.duplicateNumbers'
    '\.invalid_numbers' = '.invalidNumbers'
    '\.import_status' = '.status'
    '\.error_message' = '.errorMessage'
    '\.created_at' = '.createdAt'
    '\.imported_at' = '.importedAt'
    '\.updated_at' = '.updatedAt'
    '\.archived_number_count' = '.archivedNumberCount'
}

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $modified = $false
    
    foreach ($old in $replacements.Keys) {
        $new = $replacements[$old]
        if ($content -match $old) {
            $content = $content -replace $old, $new
            $modified = $true
        }
    }
    
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "`nDone! Run 'npm run type-check' to verify."
