#!/usr/bin/env pwsh
# 文档系统健康状态检查脚本
# 快速检查失联员工沟通机制的运行状况

$DocsPath = "d:\rust\active-projects\小红书\employeeGUI\docs\DDD架构清晰问题"

function Show-SystemHealth {
    Write-Host "🏥 文档系统健康检查" -ForegroundColor Cyan
    Write-Host "时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm')" -ForegroundColor Gray
    Write-Host ""
    
    # 检查核心目录结构
    $CoreDirs = @("_ACTIVE", "_STREAMS", "_REPORTS", "_ARCHIVE", "_TEMPLATES")
    Write-Host "📁 目录结构检查:" -ForegroundColor Green
    foreach ($Dir in $CoreDirs) {
        $Path = "$DocsPath\$Dir"
        if (Test-Path $Path) {
            $FileCount = (Get-ChildItem -Path $Path -File -Recurse).Count
            Write-Host "  ✅ $Dir ($FileCount 个文件)" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $Dir (缺失)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    
    # 检查员工状态文档
    Write-Host "👥 员工状态检查:" -ForegroundColor Blue
    $ActivePath = "$DocsPath\_ACTIVE"
    $Employees = @("A", "B", "C")
    
    foreach ($Emp in $Employees) {
        $StatusFile = "$ActivePath\员工${Emp}_当前状态.md"
        if (Test-Path $StatusFile) {
            $LastWrite = (Get-Item $StatusFile).LastWriteTime
            $HoursAgo = [math]::Round(((Get-Date) - $LastWrite).TotalHours, 1)
            
            if ($HoursAgo -lt 2) {
                Write-Host "  ✅ 员工$Emp : 最近更新 ($HoursAgo 小时前)" -ForegroundColor Green
            } elseif ($HoursAgo -lt 24) {
                Write-Host "  ⚠️  员工$Emp : 较久未更新 ($HoursAgo 小时前)" -ForegroundColor Yellow
            } else {
                Write-Host "  ❌ 员工$Emp : 长时间未更新 ($HoursAgo 小时前)" -ForegroundColor Red
            }
        } else {
            Write-Host "  ❌ 员工$Emp : 状态文档缺失" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    
    # 检查工作流水记录
    Write-Host "📊 流水记录检查:" -ForegroundColor Magenta
    $StreamPath = "$DocsPath\_STREAMS"
    foreach ($Emp in $Employees) {
        $StreamFile = "$StreamPath\stream_$($Emp.ToLower()).md"
        if (Test-Path $StreamFile) {
            $Content = Get-Content $StreamFile -Raw
            $TodayEntries = ($Content | Select-String "\[$(Get-Date -Format 'HH:mm')\]").Count
            if ($TodayEntries -gt 0) {
                Write-Host "  ✅ 员工$Emp : 今日有 $TodayEntries 条记录" -ForegroundColor Green
            } else {
                Write-Host "  ⚠️  员工$Emp : 今日暂无记录" -ForegroundColor Yellow
            }
        } else {
            Write-Host "  ❌ 员工$Emp : 流水文件缺失" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    
    # 检查架构导航文档
    Write-Host "📚 架构文档检查:" -ForegroundColor Cyan
    $ArchDocs = @("架构导航指南.md", "架构快速参考.md")
    foreach ($Doc in $ArchDocs) {
        $DocPath = "$DocsPath\$Doc"
        if (Test-Path $DocPath) {
            Write-Host "  ✅ $Doc 存在" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $Doc 缺失" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    
    # 检查归档情况
    Write-Host "📦 归档状态检查:" -ForegroundColor DarkCyan
    $ArchivePath = "$DocsPath\_ARCHIVE"
    if (Test-Path $ArchivePath) {
        $ArchiveCount = (Get-ChildItem -Path $ArchivePath -File -Recurse).Count
        Write-Host "  📚 归档文件总数: $ArchiveCount" -ForegroundColor Gray
        
        $SubDirs = Get-ChildItem -Path $ArchivePath -Directory
        foreach ($SubDir in $SubDirs) {
            $Count = (Get-ChildItem -Path $SubDir.FullName -File).Count
            Write-Host "    - $($SubDir.Name): $Count 个文件" -ForegroundColor Gray
        }
    }
    
    Write-Host ""
    
    # 系统健康评分
    Write-Host "🎯 系统健康评分:" -ForegroundColor Yellow
    
    $Score = 0
    $MaxScore = 100
    
    # 结构完整性 (40分)
    $StructureScore = ($CoreDirs | Where-Object { Test-Path "$DocsPath\$_" }).Count * 8
    $Score += $StructureScore
    
    # 员工活跃度 (40分) 
    $ActiveEmployees = 0
    foreach ($Emp in $Employees) {
        $StatusFile = "$DocsPath\_ACTIVE\员工${Emp}_当前状态.md"
        if (Test-Path $StatusFile) {
            $HoursAgo = ((Get-Date) - (Get-Item $StatusFile).LastWriteTime).TotalHours
            if ($HoursAgo -lt 24) { $ActiveEmployees++ }
        }
    }
    $ActivityScore = $ActiveEmployees * 13.3
    $Score += $ActivityScore
    
    # 文档规范性 (20分)
    $ComplianceScore = 20 # 假设基本合规，可以根据实际检查调整
    $Score += $ComplianceScore
    
    $Score = [math]::Round($Score)
    
    if ($Score -ge 80) {
        Write-Host "  🟢 优秀: $Score/100" -ForegroundColor Green
    } elseif ($Score -ge 60) {
        Write-Host "  🟡 良好: $Score/100" -ForegroundColor Yellow
    } else {
        Write-Host "  🔴 需要改进: $Score/100" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "💡 建议操作:" -ForegroundColor Cyan
    if ($Score -lt 80) {
        Write-Host "  - 督促失联员工更新状态文档" -ForegroundColor White
        Write-Host "  - 检查并修复缺失的目录结构" -ForegroundColor White
    }
    Write-Host "  - 定期运行此健康检查 (建议每日)" -ForegroundColor White
    Write-Host "  - 使用模板保持文档格式一致性" -ForegroundColor White
}

# 执行健康检查
try {
    Show-SystemHealth
} catch {
    Write-Host "❌ 健康检查过程中发生错误: $($_.Exception.Message)" -ForegroundColor Red
}