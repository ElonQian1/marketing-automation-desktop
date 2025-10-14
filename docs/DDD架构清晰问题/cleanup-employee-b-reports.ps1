# 清理员工B旧工作报告脚本
# 保留核心文件，移动旧报告到_ARCHIVE目录

$workDir = "D:\rust\active-projects\小红书\employeeGUI\docs\DDD架构清晰问题"
$archiveDir = Join-Path $workDir "_ARCHIVE\employee_b_old_reports"

# 确保归档目录存在
if (!(Test-Path $archiveDir)) {
    New-Item -ItemType Directory -Path $archiveDir -Force
    Write-Host "创建归档目录: $archiveDir" -ForegroundColor Green
}

# 要保留的核心文件（不移动）
$keepFiles = @(
    "员工b.md",  # 核心工作指南
    "员工B_最终工作报告_20251013.md",  # 最终工作报告
    "员工B_继续工作可行性分析.md"  # 刚创建的分析报告
)

# 要移动到归档的旧报告文件模式
$oldReportPatterns = @(
    "员工B_*进度*.md",
    "员工B_*工作状态*.md", 
    "员工B_*工作进度*.md",
    "员工b_*progress*.md",
    "员工B_*突破*.md",
    "员工B_*总结*.md",
    "员工b_*失联*.md",
    "员工B_*typescript*.md",
    "Employee_B_*.md",
    "员工B工作进度_*.md",
    "员工b_模块前缀化*.md"
)

Write-Host "开始清理员工B旧工作报告..." -ForegroundColor Yellow

$movedCount = 0
$skippedCount = 0

foreach ($pattern in $oldReportPatterns) {
    $files = Get-ChildItem -Path $workDir -Name $pattern -ErrorAction SilentlyContinue
    
    foreach ($file in $files) {
        if ($keepFiles -contains $file) {
            Write-Host "保留核心文件: $file" -ForegroundColor Green
            $skippedCount++
            continue
        }
        
        $sourcePath = Join-Path $workDir $file
        $destPath = Join-Path $archiveDir $file
        
        if (Test-Path $sourcePath) {
            try {
                Move-Item -Path $sourcePath -Destination $destPath -Force
                Write-Host "已移动: $file → _ARCHIVE/employee_b_old_reports/" -ForegroundColor Cyan
                $movedCount++
            }
            catch {
                Write-Host "移动失败: $file - $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
}

# 额外清理一些特定的旧文件
$specificOldFiles = @(
    "2025-10-12_员工B继续工作状态.md",
    "2025-10-12_阶段性修复成果报告.md"
)

foreach ($file in $specificOldFiles) {
    $sourcePath = Join-Path $workDir $file
    if (Test-Path $sourcePath) {
        $destPath = Join-Path $archiveDir $file
        try {
            Move-Item -Path $sourcePath -Destination $destPath -Force
            Write-Host "已移动特定文件: $file" -ForegroundColor Cyan
            $movedCount++
        }
        catch {
            Write-Host "移动失败: $file - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host "`n清理完成!" -ForegroundColor Green
Write-Host "移动文件数: $movedCount" -ForegroundColor Yellow
Write-Host "保留文件数: $skippedCount" -ForegroundColor Yellow
Write-Host "归档位置: $archiveDir" -ForegroundColor Cyan

# 显示保留的核心员工B文件
Write-Host "`n保留的员工B核心文件:" -ForegroundColor Green
foreach ($file in $keepFiles) {
    $filePath = Join-Path $workDir $file
    if (Test-Path $filePath) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file (文件不存在)" -ForegroundColor Red
    }
}