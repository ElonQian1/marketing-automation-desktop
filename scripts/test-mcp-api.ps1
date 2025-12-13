# MCP API 测试脚本
# 使用方法: .\scripts\test-mcp-api.ps1
# 前提: 应用已通过 npm run tauri dev 启动

$baseUrl = "http://127.0.0.1:3100"

function Invoke-McpTool {
    param(
        [string]$ToolName,
        [hashtable]$Params = @{}
    )
    
    $body = @{
        jsonrpc = "2.0"
        id = 1
        method = "tools/call"
        params = @{
            name = $ToolName
            arguments = $Params
        }
    } | ConvertTo-Json -Depth 10 -Compress
    
    Write-Host "`n📤 调用工具: $ToolName" -ForegroundColor Cyan
    Write-Host "   参数: $($Params | ConvertTo-Json -Compress)" -ForegroundColor Gray
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/mcp" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 10
        Write-Host "📥 响应:" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 10 | Write-Host
        return $response
    }
    catch {
        Write-Host "❌ 错误: $_" -ForegroundColor Red
        return $null
    }
}

Write-Host "=============================================" -ForegroundColor Yellow
Write-Host "  MCP API 测试脚本 - 精准获客系统" -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Yellow

# 1. 检查服务健康状态
Write-Host "`n🔍 检查 MCP 服务健康状态..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get -TimeoutSec 3
    Write-Host "✅ MCP 服务运行中: $health" -ForegroundColor Green
}
catch {
    Write-Host "❌ MCP 服务未运行，请先启动 npm run tauri dev" -ForegroundColor Red
    exit 1
}

# 2. 列出所有可用工具
Write-Host "`n🔧 获取可用工具列表..." -ForegroundColor Cyan
try {
    $tools = Invoke-RestMethod -Uri "$baseUrl/tools" -Method Get -TimeoutSec 5
    Write-Host "可用工具: $($tools.tools.Count) 个" -ForegroundColor Green
    foreach ($tool in $tools.tools) {
        Write-Host "   - $($tool.name): $($tool.description)" -ForegroundColor Gray
    }
}
catch {
    Write-Host "❌ 获取工具列表失败: $_" -ForegroundColor Red
}

# 3. 列出现有脚本
Write-Host "`n📋 列出现有脚本..." -ForegroundColor Cyan
$scripts = Invoke-McpTool -ToolName "list_scripts"

# 4. 创建新脚本（类似"小红书关注好友"）
Write-Host "`n✨ 创建新脚本: 小红书浏览首页" -ForegroundColor Cyan
$newScript = Invoke-McpTool -ToolName "create_script" -Params @{
    name = "小红书浏览首页"
    description = "自动浏览小红书首页，由AI代理通过MCP创建"
}

if ($newScript -and $newScript.result -and $newScript.result.content) {
    $content = $newScript.result.content | ConvertFrom-Json
    $scriptId = $content.script_id
    Write-Host "🆔 新脚本ID: $scriptId" -ForegroundColor Green
    
    # 5. 添加步骤1: 点击首页
    Write-Host "`n➕ 添加步骤1: 点击首页" -ForegroundColor Cyan
    Invoke-McpTool -ToolName "add_step" -Params @{
        script_id = $scriptId
        step_name = "点击首页"
        action_type = "click"
        target_text = "首页"
    }
    
    # 6. 添加步骤2: 等待加载
    Write-Host "`n➕ 添加步骤2: 等待页面加载" -ForegroundColor Cyan
    Invoke-McpTool -ToolName "add_step" -Params @{
        script_id = $scriptId
        step_name = "等待页面加载"
        action_type = "wait"
        wait_ms = 2000
    }
    
    # 7. 添加步骤3: 上滑浏览
    Write-Host "`n➕ 添加步骤3: 上滑浏览内容" -ForegroundColor Cyan
    Invoke-McpTool -ToolName "add_step" -Params @{
        script_id = $scriptId
        step_name = "上滑浏览"
        action_type = "swipe"
        swipe_direction = "up"
    }
    
    # 8. 获取完整脚本
    Write-Host "`n📖 获取完整脚本内容..." -ForegroundColor Cyan
    Invoke-McpTool -ToolName "get_script" -Params @{
        script_id = $scriptId
    }
    
    # 9. 列出设备
    Write-Host "`n📱 列出已连接设备..." -ForegroundColor Cyan
    Invoke-McpTool -ToolName "list_devices"
    
    Write-Host "`n=============================================" -ForegroundColor Yellow
    Write-Host "  测试完成！脚本已通过 MCP 创建" -ForegroundColor Green
    Write-Host "  脚本ID: $scriptId" -ForegroundColor Green
    Write-Host "=============================================" -ForegroundColor Yellow
}
else {
    Write-Host "❌ 创建脚本失败，无法继续添加步骤" -ForegroundColor Red
}
