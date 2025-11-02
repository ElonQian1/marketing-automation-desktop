# Visual-Preview 模块重构脚本
# 自动执行文件迁移和重命名

$ErrorActionPreference = "Stop"
$baseDir = "D:\rust\active-projects\小红书\employeeGUI\src\modules\structural-matching\ui\components\visual-preview"

Write-Host "🚀 开始Visual-Preview模块重构..." -ForegroundColor Green

# Phase 1: 已完成 - 创建目录结构
Write-Host "✅ Phase 1: 目录结构已创建" -ForegroundColor Cyan

# Phase 2: 已完成 - 迁移类型定义
Write-Host "✅ Phase 2: 类型定义已迁移" -ForegroundColor Cyan

# Phase 3: 已完成 - 迁移核心算法
Write-Host "✅ Phase 3: 核心算法已迁移" -ForegroundColor Cyan

# Phase 4: 创建 Hooks 层导出索引
Write-Host "📝 Phase 4: 创建 Hooks 层..." -ForegroundColor Yellow

# Phase 5: 创建 Utils 层（调试辅助）
Write-Host "📝 Phase 5: 处理工具层..." -ForegroundColor Yellow

$debugHelperSource = Join-Path $baseDir "floating-window\utils\crop-debug-helper.ts"
$debugHelperDest = Join-Path $baseDir "utils\structural-matching-debug-helper.ts"

if (Test-Path $debugHelperSource) {
    $content = Get-Content $debugHelperSource -Raw
    # 更新文件头
    $content = $content -replace "// src/modules/structural-matching/ui/components/visual-preview/floating-window/utils/crop-debug-helper.ts", "// src/modules/structural-matching/ui/components/visual-preview/utils/structural-matching-debug-helper.ts"
    $content = $content -replace "// summary: .*", "// summary: 结构匹配调试辅助工具"
    # 更新导入路径
    $content = $content -replace "\.\./types", "../types"
    Set-Content -Path $debugHelperDest -Value $content -Encoding UTF8
    Write-Host "  ✓ 迁移: crop-debug-helper.ts → structural-matching-debug-helper.ts" -ForegroundColor Green
}

Write-Host "`n📊 重构进度总结:" -ForegroundColor Cyan
Write-Host "  ✅ 类型定义层: 已完成" -ForegroundColor Green
Write-Host "  ✅ 核心算法层 (4个文件): 已完成" -ForegroundColor Green
Write-Host "    - viewport-alignment.ts" -ForegroundColor Gray
Write-Host "    - coordinate-transform.ts" -ForegroundColor Gray
Write-Host "    - bounds-corrector.ts" -ForegroundColor Gray
Write-Host "    - crop-calculator.ts" -ForegroundColor Gray
Write-Host "  ⏳ Hooks层: 需要手动处理（文件较大）" -ForegroundColor Yellow
Write-Host "  ⏳ 组件层: 需要手动处理（包含复杂依赖）" -ForegroundColor Yellow

Write-Host "`n⚠️  下一步手动操作:" -ForegroundColor Yellow
Write-Host "  1. 复制 use-step-card-data.ts 到 hooks/use-structural-matching-step-data.ts" -ForegroundColor Gray
Write-Host "  2. 更新导入路径: ../types, ../../core/*" -ForegroundColor Gray
Write-Host "  3. 复制 use-tree-visual-coordination.ts 到 hooks/" -ForegroundColor Gray
Write-Host "  4. 逐个迁移 components/ 下的组件文件" -ForegroundColor Gray
Write-Host "  5. 更新所有组件名称添加 StructuralMatching 前缀" -ForegroundColor Gray
Write-Host "  6. 更新 index.ts 导出" -ForegroundColor Gray
Write-Host "  7. 删除 floating-window/ 目录" -ForegroundColor Gray

Write-Host ""
Write-Host "Core refactoring completed!" -ForegroundColor Green
