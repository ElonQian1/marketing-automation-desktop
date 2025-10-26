# 按钮识别修复 - 防混淆文件重命名脚本
# 🎯 目的：重命名容易混淆的文件，添加明确的语义前缀

# PowerShell脚本：rename-confusing-files.ps1

Write-Host "🔧 开始按钮识别修复文件重命名..." -ForegroundColor Green

# 1. 重命名测试文件，添加语义前缀
$oldTestFile = "src/test/button-recognition-fix-test.tsx"
$newTestFile = "src/test/button-semantic-recognition-fix-test.tsx"

if (Test-Path $oldTestFile) {
    Write-Host "📝 重命名测试文件: $oldTestFile -> $newTestFile" -ForegroundColor Yellow
    # Rename-Item $oldTestFile $newTestFile -Force
    Write-Host "   注意：请手动重命名以避免破坏现有引用" -ForegroundColor Red
}

# 2. 重命名验证页面，添加明确描述
$oldValidationPage = "src/pages/button-fix-validation.tsx" 
$newValidationPage = "src/pages/button-semantic-confusion-fix-validation.tsx"

if (Test-Path $oldValidationPage) {
    Write-Host "📝 建议重命名验证页面: $oldValidationPage -> $newValidationPage" -ForegroundColor Yellow
    Write-Host "   注意：需要同时更新路由配置" -ForegroundColor Red
}

# 3. 检查容易混淆的Rust文件
$legacyEngineFile = "src-tauri/src/services/legacy_simple_selection_engine.rs"
$v3ChainEngineFile = "src-tauri/src/exec/v3/chain_engine.rs"

Write-Host "🔍 检查容易混淆的Rust文件:" -ForegroundColor Cyan

if (Test-Path $legacyEngineFile) {
    Write-Host "   ❌ 发现 legacy_simple_selection_engine.rs (已弃用)" -ForegroundColor Red
    Write-Host "      → 确认文件头部有明确的弃用警告" -ForegroundColor Yellow
}

if (Test-Path $v3ChainEngineFile) {
    Write-Host "   ✅ 发现 v3/chain_engine.rs (当前使用)" -ForegroundColor Green
    Write-Host "      → 确认这是正确的V3执行引擎" -ForegroundColor Yellow  
}

# 4. 检查功能标志配置
$featureFlagsFile = "src/config/feature-flags.ts"

if (Test-Path $featureFlagsFile) {
    Write-Host "🎛️ 检查功能标志配置..." -ForegroundColor Cyan
    
    $content = Get-Content $featureFlagsFile -Raw
    
    if ($content -match "USE_V3_EXECUTION.*true") {
        Write-Host "   ✅ V3执行引擎已启用" -ForegroundColor Green
    } else {
        Write-Host "   ❌ V3执行引擎未启用" -ForegroundColor Red
        Write-Host "      → 需要设置 USE_V3_EXECUTION: true" -ForegroundColor Yellow
    }
    
    if ($content -match "USE_V3_CHAIN.*true") {
        Write-Host "   ✅ V3智能自动链已启用" -ForegroundColor Green
    } else {
        Write-Host "   ❌ V3智能自动链未启用" -ForegroundColor Red
        Write-Host "      → 需要设置 USE_V3_CHAIN: true" -ForegroundColor Yellow
    }
}

# 5. 生成防混淆检查报告
$reportFile = "BUTTON_FIX_CONFUSION_CHECK_REPORT.md"

@"
# 按钮识别修复 - 防混淆检查报告

生成时间: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## 🔍 文件状态检查

### 核心修复文件
- [ ] feature-flags.ts - V3系统开关配置
- [ ] useIntelligentStepCardIntegration.ts - 智能元素转换逻辑
- [ ] button-semantic-recognition-fix-test.tsx - 语义识别测试
- [ ] button-semantic-confusion-fix-validation.tsx - 验证页面

### 易混淆文件标识
- [ ] legacy_simple_selection_engine.rs - ⚠️ 已弃用，包含明确警告
- [ ] v3/chain_engine.rs - ✅ 当前V3引擎，包含Step 0-6分析
- [ ] strategy_engine.rs - ✅ 策略分析核心实现

## 🎯 关键配置验证
- [ ] USE_V3_EXECUTION: true
- [ ] USE_V3_CHAIN: true 
- [ ] USE_V3_SMART_MATCHING: true

## 🧪 测试验证状态
- [ ] 所有按钮语义识别测试通过
- [ ] 排除规则正确应用
- [ ] V3智能分析系统正常运行
- [ ] 批量操作保持识别准确性

## 🚨 防混淆措施
- [ ] 文件名包含明确语义前缀
- [ ] 代码注释说明核心修复目标
- [ ] 类型定义明确区分按钮状态
- [ ] 测试用例覆盖混淆场景

## 📋 下一步行动
1. 运行完整测试套件
2. 验证生产环境配置
3. 更新相关文档
4. 确保团队成员理解修复内容
"@ | Out-File -FilePath $reportFile -Encoding UTF8

Write-Host "📋 生成防混淆检查报告: $reportFile" -ForegroundColor Green

Write-Host "`n🎉 防混淆文件重命名检查完成！" -ForegroundColor Green
Write-Host "📖 请查看生成的报告文件获取详细信息" -ForegroundColor Cyan