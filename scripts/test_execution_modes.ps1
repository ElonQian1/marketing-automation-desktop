# 执行模式测试脚本
# 用于验证四种执行模式的 Socket 命令

$agentPort = 11451
$agentHost = "127.0.0.1"

function Send-AgentCommand {
    param([string]$command)
    
    try {
        $client = New-Object System.Net.Sockets.TcpClient($agentHost, $agentPort)
        $stream = $client.GetStream()
        $stream.ReadTimeout = 5000
        $stream.WriteTimeout = 5000
        
        $writer = New-Object System.IO.StreamWriter($stream)
        $reader = New-Object System.IO.StreamReader($stream)
        
        $writer.WriteLine($command)
        $writer.Flush()
        
        Start-Sleep -Milliseconds 1000
        
        $response = $reader.ReadLine()
        $client.Close()
        
        return $response
    } catch {
        return "ERROR: $_"
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Android Agent 执行模式测试" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 检查状态
Write-Host "[1] 检查服务状态..." -ForegroundColor Yellow
$status = Send-AgentCommand "STATUS"
Write-Host $status
Write-Host ""

# 2. 获取当前执行模式
Write-Host "[2] 获取当前执行模式..." -ForegroundColor Yellow
$currentMode = Send-AgentCommand "GET_EXECUTION_MODE"
Write-Host $currentMode
Write-Host ""

# 3. 列出所有可用模式
Write-Host "[3] 列出所有可用模式..." -ForegroundColor Yellow
$modes = Send-AgentCommand "LIST_EXECUTION_MODES"
Write-Host $modes
Write-Host ""

# 4. 切换到极速模式
Write-Host "[4] 切换到极速模式 (FAST)..." -ForegroundColor Yellow
$setFast = Send-AgentCommand "SET_EXECUTION_MODE:FAST"
Write-Host $setFast
Write-Host ""

# 5. 确认切换成功
Write-Host "[5] 确认当前模式..." -ForegroundColor Yellow
$verify1 = Send-AgentCommand "GET_EXECUTION_MODE"
Write-Host $verify1
Write-Host ""

# 6. 切换到监控模式
Write-Host "[6] 切换到监控模式 (MONITOR)..." -ForegroundColor Yellow
$setMonitor = Send-AgentCommand "SET_EXECUTION_MODE:MONITOR"
Write-Host $setMonitor
Write-Host ""

# 7. 切换到代理模式
Write-Host "[7] 切换到代理模式 (AGENT)..." -ForegroundColor Yellow
$setAgent = Send-AgentCommand "SET_EXECUTION_MODE:AGENT"
Write-Host $setAgent
Write-Host ""

# 8. 切换回智能模式
Write-Host "[8] 切换回智能模式 (SMART)..." -ForegroundColor Yellow
$setSmart = Send-AgentCommand "SET_EXECUTION_MODE:SMART"
Write-Host $setSmart
Write-Host ""

# 9. 测试弹窗检测
Write-Host "[9] 测试弹窗检测..." -ForegroundColor Yellow
$popupTest = Send-AgentCommand "TEST_POPUP_DISMISS"
Write-Host $popupTest
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "  测试完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
