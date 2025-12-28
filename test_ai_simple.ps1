# 简单测试 - 发送命令并等待结果
$port = 11451
$goal = "打开小红书"

Write-Host "🎯 目标: $goal" -ForegroundColor Cyan

try {
    $client = New-Object System.Net.Sockets.TcpClient("127.0.0.1", $port)
    $client.ReceiveTimeout = 180000  # 3分钟
    $stream = $client.GetStream()
    $stream.ReadTimeout = 180000
    $writer = New-Object System.IO.StreamWriter($stream)
    $reader = New-Object System.IO.StreamReader($stream)
    
    $writer.WriteLine("RUN_AI_GOAL:$goal")
    $writer.Flush()
    
    Write-Host "⏳ 等待 AI 执行..." -ForegroundColor Gray
    
    # 读取所有响应
    $allResponse = ""
    try {
        while ($true) {
            $line = $reader.ReadLine()
            if ($null -eq $line) { break }
            Write-Host "📥 $line" -ForegroundColor Yellow
            $allResponse += $line + "`n"
            
            if ($line.Contains('"status":"completed"') -or $line.Contains('"status":"error"')) {
                Write-Host "✅ 执行结束" -ForegroundColor Green
                break
            }
        }
    } catch {
        Write-Host "读取结束: $_" -ForegroundColor Gray
    }
    
    $client.Close()
    
} catch {
    Write-Host "❌ 错误: $_" -ForegroundColor Red
}
