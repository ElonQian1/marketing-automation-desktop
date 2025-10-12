#!/usr/bin/env pwsh
# 失联员工文档自动清理脚本 v1.0
# 功能: 将混乱的历史文档整理到新的结构化文件夹中

param(
    [switch]$DryRun = $false,  # 预览模式，不实际移动文件
    [switch]$Force = $false    # 强制模式，覆盖已存在文件
)

$DocsPath = "d:\rust\active-projects\小红书\employeeGUI\docs\DDD架构清晰问题"
$ArchivePath = "$DocsPath\_ARCHIVE"
$TempArchivePath = "$ArchivePath\临时文档"
$OldStatusPath = "$ArchivePath\旧版状态报告"

# 创建归档子目录
function New-ArchiveDirectories {
    $Dirs = @(
        "$ArchivePath\旧版状态报告",
        "$ArchivePath\废弃计划", 
        "$ArchivePath\临时文档",
        "$ArchivePath\重复文档"
    )
    
    foreach ($Dir in $Dirs) {
        if (-not (Test-Path $Dir)) {
            if (-not $DryRun) {
                New-Item -ItemType Directory -Path $Dir -Force | Out-Null
            }
            Write-Host "📁 创建目录: $Dir" -ForegroundColor Green
        }
    }
}

# 识别和分类文档的函数
function Get-DocumentCategory {
    param([string]$FileName)
    
    # 保护重要入口文件 (不应被分类移动)
    if ($FileName -in @("员工a.md", "员工b.md", "README.md")) {
        return "PROTECTED"
    }
    
    # 员工状态文档 (各种变体)
    if ($FileName -match "员工[ABC]" -and $FileName -match "(状态|报告|工作)") {
        return "旧版状态报告"
    }
    
    # 临时和测试文档
    if ($FileName -match "(temp|test|临时|测试)") {
        return "临时文档"
    }
    
    # 计划类文档
    if ($FileName -match "(计划|plan|规划)") {
        return "废弃计划"
    }
    
    # 重复文档 (带数字后缀的)
    if ($FileName -match "\d+\.md$" -or $FileName -match "副本|copy") {
        return "重复文档"
    }
    
    # 默认归类为临时文档
    return "临时文档"
}

# 主清理函数
function Start-DocumentCleanup {
    Write-Host "🧹 开始文档清理..." -ForegroundColor Cyan
    Write-Host "📂 工作目录: $DocsPath" -ForegroundColor Gray
    
    if ($DryRun) {
        Write-Host "🔍 预览模式 - 不会实际移动文件" -ForegroundColor Yellow
    }
    
    # 创建归档目录结构
    New-ArchiveDirectories
    
    # 获取所有.md文件 (排除新结构中的文件)
    $ExcludePaths = @("_ACTIVE", "_STREAMS", "_REPORTS", "_ARCHIVE", "_TEMPLATES")
    $AllMdFiles = Get-ChildItem -Path $DocsPath -Filter "*.md" -File | 
                  Where-Object { $ExcludePaths -notcontains $_.Directory.Name }
    
    $MoveCount = 0
    $SkipCount = 0
    
    foreach ($File in $AllMdFiles) {
        # 跳过重要的入口文件
        if ($File.Name -in @("README.md", "员工a.md", "员工b.md")) {
            Write-Host "🔒 保护文件: $($File.Name)" -ForegroundColor Blue
            continue
        }
        
        $Category = Get-DocumentCategory $File.Name
        $TargetDir = "$ArchivePath\$Category"
        $TargetPath = "$TargetDir\$($File.Name)"
        
        # 检查目标文件是否已存在
        if ((Test-Path $TargetPath) -and -not $Force) {
            Write-Host "⚠️  跳过 (已存在): $($File.Name)" -ForegroundColor Yellow
            $SkipCount++
            continue
        }
        
        if ($DryRun) {
            Write-Host "📋 [预览] $($File.Name) → $Category" -ForegroundColor Cyan
        } else {
            try {
                Move-Item -Path $File.FullName -Destination $TargetPath -Force:$Force
                Write-Host "✅ 移动: $($File.Name) → $Category" -ForegroundColor Green
                $MoveCount++
            } catch {
                Write-Host "❌ 错误: 无法移动 $($File.Name) - $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
    
    # 生成清理报告
    Write-Host "`n📊 清理报告:" -ForegroundColor Cyan
    Write-Host "  📦 移动文件数: $MoveCount" -ForegroundColor Green
    Write-Host "  ⏭️  跳过文件数: $SkipCount" -ForegroundColor Yellow
    
    if ($DryRun) {
        Write-Host "`n💡 要实际执行清理，请运行: .\cleanup.ps1" -ForegroundColor Magenta
    } else {
        Write-Host "`n🎉 文档清理完成！" -ForegroundColor Green
        Write-Host "📂 查看归档文件: $ArchivePath" -ForegroundColor Gray
    }
}

# 生成清理后的目录结构报告
function Show-NewStructure {
    if (-not $DryRun) {
        Write-Host "`n📁 新的文档结构:" -ForegroundColor Cyan
        Get-ChildItem -Path $DocsPath -Directory | ForEach-Object {
            $FileCount = (Get-ChildItem -Path $_.FullName -File -Recurse).Count
            Write-Host "  📂 $($_.Name) ($FileCount 个文件)" -ForegroundColor Gray
        }
    }
}

# 执行清理
try {
    Start-DocumentCleanup
    Show-NewStructure
    
    Write-Host "`n📝 下一步建议:" -ForegroundColor Magenta
    Write-Host "  1. 检查 _ARCHIVE 中的文件是否正确分类" -ForegroundColor White
    Write-Host "  2. 让其他员工使用模板创建新的状态文档" -ForegroundColor White
    Write-Host "  3. 定期运行此脚本维护文档整洁性" -ForegroundColor White
    
} catch {
    Write-Host "❌ 清理过程中发生错误: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}