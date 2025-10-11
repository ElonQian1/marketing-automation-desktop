#!/usr/bin/env pwsh

<#
.SYNOPSIS
    清理过时的技术文档，移动到 deprecated 目录

.DESCRIPTION
    检测项目中过时的技术文档和报告，将它们移动到 deprecated 目录
    以保持项目根目录的整洁，同时保留历史记录。

.NOTES
    执行时间: 2025年10月11日
    作者: AI Assistant
    目的: 模块化重构后的文档清理
#>

param(
    [switch]$DryRun = $false,
    [switch]$Verbose = $false
)

# 定义颜色函数
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    
    $colorMap = @{
        "Red" = [ConsoleColor]::Red
        "Green" = [ConsoleColor]::Green
        "Yellow" = [ConsoleColor]::Yellow
        "Blue" = [ConsoleColor]::Blue
        "Cyan" = [ConsoleColor]::Cyan
        "Magenta" = [ConsoleColor]::Magenta
        "White" = [ConsoleColor]::White
    }
    
    Write-Host $Message -ForegroundColor $colorMap[$Color]
}

# 获取项目根目录
$projectRoot = Get-Location
$deprecatedDir = Join-Path $projectRoot "deprecated"

Write-ColorOutput "🧹 开始清理过时的技术文档..." "Cyan"
Write-ColorOutput "📁 项目根目录: $projectRoot" "Blue"

# 确保 deprecated 目录存在
if (-not (Test-Path $deprecatedDir)) {
    if (-not $DryRun) {
        New-Item -ItemType Directory -Path $deprecatedDir -Force | Out-Null
        Write-ColorOutput "📁 创建 deprecated 目录: $deprecatedDir" "Green"
    } else {
        Write-ColorOutput "📁 [DRY-RUN] 将创建 deprecated 目录: $deprecatedDir" "Yellow"
    }
}

# 定义需要移动的过时文档模式
$outdatedPatterns = @(
    # 过时的架构报告（保留最新的MODULE_REFACTOR_COMPLETION_REPORT.md）
    "*ARCHITECTURE_ANALYSIS*.md",
    "*ARCHITECTURE_REFACTOR*.md", 
    "*ARCHITECTURE_FRAGMENTATION*.md",
    "*ARCHITECTURE_OPTIMIZATION*.md",
    "*ARCHITECTURE_INTEGRATION*.md",
    "*BACKEND_MODULAR_REFACTOR*.md",
    
    # 过时的功能实现报告（已重构的功能）
    "*PRECISE_ACQUISITION_ENHANCEMENT*.md",
    "*PRECISE_ACQUISITION_INTEGRATION*.md",
    
    # 过时的UI组件报告（已合并到新架构）
    "*POPOVER_*.md",
    "*TABLE_DRAG_*.md",
    "*STRATEGY_SELECTOR_*.md",
    "*STRATEGY_SCORING_*.md",
    "*UI_COMPONENT_LIBRARY*.md",
    "*UNIVERSAL_SOCIAL_BUTTON*.md",
    
    # XPath相关的阶段性报告（保留最新的总结）
    "*XPATH_STAGE*.md",
    "*XPATH_FEATURES_IMPLEMENTATION*.md",
    "*XPATH_ENHANCEMENT*.md",
    "*XPATH_OPTIMIZATION*.md",
    
    # XML解析相关的详细报告（已整合）
    "*XML_PARSING_*.md",
    "*XML_ELEMENT_*.md",
    "*XML_SCREENSHOT_*.md",
    
    # TXT导入相关的详细报告（功能已稳定）
    "*TXT_IMPORT_*.md",
    
    # 通用UI实现的详细报告（已整合）
    "*UNIVERSAL_UI_*.md",
    
    # 任务引擎架构的详细报告（已重构）
    "*TASK_ENGINE_ARCHITECTURE*.md"
)

# 定义需要保留的重要文档（不移动）
$keepPatterns = @(
    "README.md",
    "MODULE_REFACTOR_COMPLETION_REPORT.md",
    "ADB_ARCHITECTURE_UNIFICATION_REPORT.md",
    "ADB_GLOBAL_MIGRATION_GUIDE.md",
    ".github\*",
    "docs\*",
    "src\*",
    "src-tauri\*"
)

$movedCount = 0
$skippedCount = 0

# 扫描根目录下的.md文件
Write-ColorOutput "`n🔍 扫描过时文档..." "Blue"

Get-ChildItem -Path $projectRoot -Filter "*.md" | ForEach-Object {
    $file = $_
    $fileName = $file.Name
    $shouldMove = $false
    
    # 检查是否匹配过时模式
    foreach ($pattern in $outdatedPatterns) {
        if ($fileName -like $pattern) {
            $shouldMove = $true
            break
        }
    }
    
    # 检查是否是需要保留的文件
    if ($shouldMove) {
        foreach ($keepPattern in $keepPatterns) {
            if ($fileName -like $keepPattern) {
                $shouldMove = $false
                Write-ColorOutput "  📌 保留重要文档: $fileName" "Green"
                $skippedCount++
                break
            }
        }
    }
    
    # 执行移动操作
    if ($shouldMove) {
        $targetPath = Join-Path $deprecatedDir $fileName
        
        if ($DryRun) {
            Write-ColorOutput "  📦 [DRY-RUN] 将移动: $fileName" "Yellow"
        } else {
            try {
                Move-Item -Path $file.FullName -Destination $targetPath -Force
                Write-ColorOutput "  ✅ 已移动: $fileName" "Green"
                $movedCount++
            } catch {
                Write-ColorOutput "  ❌ 移动失败: $fileName - $($_.Exception.Message)" "Red"
            }
        }
    }
}

# 创建 deprecated 目录的说明文件
$readmePath = Join-Path $deprecatedDir "README.md"
$readmeContent = @"
# Deprecated Documentation Archive

## 📋 Archive Purpose

This directory contains outdated technical documentation that has been superseded by newer implementations but is preserved for historical reference.

## 📅 Archive Date

**Archived on**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
**Reason**: Module refactoring and architecture unification completed

## 📚 Document Categories

### Architecture Reports
- Various architecture analysis and refactoring reports from different phases
- Superseded by: `MODULE_REFACTOR_COMPLETION_REPORT.md`

### Feature Implementation Reports  
- Detailed implementation reports for specific features
- Most functionality has been integrated into unified services

### UI Component Reports
- Individual component implementation reports
- Components have been integrated into unified UI architecture

### XPath & XML Processing Reports
- Stage-by-stage implementation reports
- Functionality is now stable and integrated

## ⚠️ Important Note

**These documents should not be used as current reference.**

For up-to-date documentation, please refer to:
- [MODULE_REFACTOR_COMPLETION_REPORT.md](../MODULE_REFACTOR_COMPLETION_REPORT.md)
- [ADB_ARCHITECTURE_UNIFICATION_REPORT.md](../ADB_ARCHITECTURE_UNIFICATION_REPORT.md)  
- [README.md](../README.md)
- [docs/](../docs/)

## 🔍 Finding Current Documentation

If you're looking for current documentation on a specific feature, please check:

1. **Main README**: `../README.md`
2. **Docs Directory**: `../docs/`
3. **Latest Reports**: Files not in this deprecated directory
4. **In-Code Documentation**: Comments and JSDoc in source files

---

*This archive was created automatically during the module refactoring process.*
"@

if (-not $DryRun) {
    $readmeContent | Out-File -FilePath $readmePath -Encoding UTF8 -Force
    Write-ColorOutput "📄 创建说明文件: deprecated/README.md" "Blue"
}

# 输出总结
Write-ColorOutput "`n📊 清理总结:" "Cyan"
Write-ColorOutput "  📦 移动的文档: $movedCount 个" "Green"
Write-ColorOutput "  📌 保留的文档: $skippedCount 个" "Blue"

if ($DryRun) {
    Write-ColorOutput "`n💡 提示: 这是预览模式，实际未执行任何移动操作" "Yellow"
    Write-ColorOutput "   要执行实际移动，请运行: .\clean-outdated-docs.ps1" "Yellow"
} else {
    Write-ColorOutput "`n✅ 文档清理完成！" "Green"
    Write-ColorOutput "   过时文档已移动到: $deprecatedDir" "Green"
}

Write-ColorOutput "`n🎯 推荐后续操作:" "Cyan"
Write-ColorOutput "  1. 检查 deprecated 目录确认移动结果" "White"
Write-ColorOutput "  2. 提交清理后的项目结构到Git" "White"  
Write-ColorOutput "  3. 更新团队成员关于新文档结构的信息" "White"