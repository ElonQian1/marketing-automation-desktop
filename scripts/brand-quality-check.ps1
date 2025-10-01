#!/usr/bin/env pwsh
# 品牌化组件质量检查脚本
# 验证BrandShowcase页面和现代化组件的代码质量

Write-Host "🧪 品牌化组件质量检查开始..." -ForegroundColor Cyan

# 检查文件大小
Write-Host "`n📏 文件大小检查..." -ForegroundColor Yellow
$showcaseFile = "src\pages\brand-showcase\BrandShowcasePage.tsx"
$showcaseLines = (Get-Content $showcaseFile).Count
Write-Host "BrandShowcase页面: $showcaseLines 行 $(if ($showcaseLines -le 500) { '✅' } else { '❌ 超过500行限制' })"

# 检查核心现代化组件文件大小
$components = @{
    "Input.tsx" = "src\components\ui\forms\Input.tsx"
    "Select.tsx" = "src\components\ui\forms\Select.tsx"
    "Button.tsx" = "src\components\ui\button\Button.tsx"
    "Card.tsx" = "src\components\ui\card\Card.tsx"
    "TagPill.tsx" = "src\components\ui\tag-pill\TagPill.tsx"
    "TableAdapter.tsx" = "src\components\adapters\table\TableAdapter.tsx"
}

foreach ($name in $components.Keys) {
    $path = $components[$name]
    if (Test-Path $path) {
        $lines = (Get-Content $path).Count
        Write-Host "$name`: $lines 行 $(if ($lines -le 500) { '✅' } else { '❌' })"
    } else {
        Write-Host "$name`: ❌ 文件不存在"
    }
}

# 检查现代化组件在Showcase中的使用
Write-Host "`n🔍 组件集成检查..." -ForegroundColor Yellow
$showcaseContent = Get-Content $showcaseFile -Raw

$modernComponents = @("Input", "Select", "TagPill", "Button", "Card")
foreach ($component in $modernComponents) {
    if ($showcaseContent -match "import.*$component.*from") {
        Write-Host "$component 组件导入: ✅"
        if ($showcaseContent -match "<$component[\s>]") {
            Write-Host "$component 组件使用: ✅"
        } else {
            Write-Host "$component 组件使用: ❌ 已导入但未使用"
        }
    } else {
        Write-Host "$component 组件导入: ❌"
    }
}

# 检查Design Tokens使用
Write-Host "`n🎨 Design Tokens检查..." -ForegroundColor Yellow
$tokensFile = "src\styles\tokens.css"
if (Test-Path $tokensFile) {
    $tokensContent = Get-Content $tokensFile -Raw
    $tokensLines = (Get-Content $tokensFile).Count
    Write-Host "tokens.css: $tokensLines 行"
    
    # 检查商业化变量
    $brandVariables = @(
        "--brand-gradient-glass",
        "--brand-gradient-mesh", 
        "--shadow-brand-glow",
        "--bg-glass-light",
        "--backdrop-blur"
    )
    
    foreach ($variable in $brandVariables) {
        if ($tokensContent -match [regex]::Escape($variable)) {
            Write-Host "商业化变量 $variable`: ✅"
        } else {
            Write-Host "商业化变量 $variable`: ❌"
        }
    }
} else {
    Write-Host "tokens.css: ❌ 文件不存在"
}

# 检查样式违规
Write-Host "`n🚫 样式违规检查..." -ForegroundColor Yellow
try {
    $scanResult = npm run scan:overrides 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "样式违规扫描: ✅ 通过"
    } else {
        Write-Host "样式违规扫描: ⚠️ 有警告或错误"
        Write-Host $scanResult
    }
} catch {
    Write-Host "样式违规扫描: ❌ 扫描失败"
}

Write-Host "`n🎯 质量检查完成！" -ForegroundColor Green
Write-Host "📋 请查看上述结果，确保所有项目都显示 ✅" -ForegroundColor Cyan