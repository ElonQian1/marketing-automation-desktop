# 模块识别脚本
function Identify-Module {
    param([string])
    
     = Get-Content  -Raw -ErrorAction SilentlyContinue
    if (-not ) { return "未知" }
    
    # ADB模块关键词
    if ( -match "useAdb|AdbStore|AdbConnection|AdbDevice|adbPath|device.*connect") {
        return "🔌 ADB模块"
    }
    
    # 联系人导入模块关键词  
    if ( -match "contact.*import|vcf|contact.*pool|UnifiedAdbDeviceManager") {
        return "📇 联系人导入模块"
    }
    
    # 精准获客模块关键词
    if ( -match "precise.*acquisition|watch.*target|monitoring|PreciseAcquisitionService") {
        return "🎯 精准获客模块"
    }
    
    # 智能脚本构建器关键词
    if ( -match "smart.*script|script.*builder|step.*card|SmartScriptBuilder") {
        return "⚡ 智能脚本构建器"
    }
    
    return "🔧 通用/基础设施"
}

# 测试几个文件
 = @(
    "src\application\hooks\useAdb.ts",
    "src\modules\contact-import\adapters\UnifiedAdbDeviceManager.ts", 
    "src\pages\SmartScriptBuilderPage\SmartScriptBuilderPage.tsx"
)

foreach ( in ) {
    if (Test-Path ) {
         = Identify-Module 
        Write-Host " -> " -ForegroundColor Green
    }
}
