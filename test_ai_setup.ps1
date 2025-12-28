# 测试 Android Agent AI 自主执行功能
$port = 11451
$host_addr = "127.0.0.1"

# 1. 检查状态
Write-Host "=== 1. 检查服务状态 ===" -ForegroundColor Cyan
try {
    $client = New-Object System.Net.Sockets.TcpClient($host_addr, $port)
    $stream = $client.GetStream()
    $writer = New-Object System.IO.StreamWriter($stream)
    $reader = New-Object System.IO.StreamReader($stream)
    
    $writer.WriteLine("STATUS")
    $writer.Flush()
    Start-Sleep -Milliseconds 1000
    
    $buffer = New-Object char[] 4096
    $count = $reader.Read($buffer, 0, $buffer.Length)
    $response = [String]::new($buffer, 0, $count)
    Write-Host $response
    $client.Close()
} catch {
    Write-Host "错误: $_" -ForegroundColor Red
    exit
}

# 2. 设置 API Key (腾讯混元)
Write-Host "`n=== 2. 设置 API Key ===" -ForegroundColor Cyan
$apiKey = "sk-QDhYLPS4UPEmAMNPtysycBLEjOiMef9pgZwtzhXS7nOtQInF"
try {
    $client = New-Object System.Net.Sockets.TcpClient($host_addr, $port)
    $stream = $client.GetStream()
    $writer = New-Object System.IO.StreamWriter($stream)
    $reader = New-Object System.IO.StreamReader($stream)
    
    $writer.WriteLine("SET_API_KEY:$apiKey")
    $writer.Flush()
    Start-Sleep -Milliseconds 1000
    
    $buffer = New-Object char[] 4096
    $count = $reader.Read($buffer, 0, $buffer.Length)
    $response = [String]::new($buffer, 0, $count)
    Write-Host $response
    $client.Close()
} catch {
    Write-Host "错误: $_" -ForegroundColor Red
    exit
}

# 3. 再次检查状态，确认 AI 已启用
Write-Host "`n=== 3. 再次检查状态 ===" -ForegroundColor Cyan
try {
    $client = New-Object System.Net.Sockets.TcpClient($host_addr, $port)
    $stream = $client.GetStream()
    $writer = New-Object System.IO.StreamWriter($stream)
    $reader = New-Object System.IO.StreamReader($stream)
    
    $writer.WriteLine("STATUS")
    $writer.Flush()
    Start-Sleep -Milliseconds 1000
    
    $buffer = New-Object char[] 4096
    $count = $reader.Read($buffer, 0, $buffer.Length)
    $response = [String]::new($buffer, 0, $count)
    Write-Host $response
    $client.Close()
} catch {
    Write-Host "错误: $_" -ForegroundColor Red
}

Write-Host "`n=== 准备就绪！===" -ForegroundColor Green
Write-Host "现在可以运行 test_ai_run.ps1 来测试 AI 自主执行"
