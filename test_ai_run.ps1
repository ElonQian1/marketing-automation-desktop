# 测试 Android Agent AI 自主执行
# 这个测试会让 AI 自主执行一个目标，并实时输出执行日志

$port = 11451
$host_addr = "127.0.0.1"
$goal = "打开小红书，在首页找到一个点赞数多的笔记"

Write-Host "============================================" -ForegroundColor Yellow
Write-Host "   🤖 AI 自主执行测试" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "目标: $goal" -ForegroundColor Cyan
Write-Host ""
Write-Host "⏳ 开始执行... (可能需要 30-60 秒)" -ForegroundColor Gray
Write-Host ""

try {
    $client = New-Object System.Net.Sockets.TcpClient($host_addr, $port)
    $client.ReceiveTimeout = 120000  # 2分钟超时
    $stream = $client.GetStream()
    $writer = New-Object System.IO.StreamWriter($stream)
    $reader = New-Object System.IO.StreamReader($stream)
    
    # 发送 RUN_AI_GOAL 命令
    $writer.WriteLine("RUN_AI_GOAL:$goal")
    $writer.Flush()
    
    # 读取响应 (AI 执行完成后才会返回)
    $response = ""
    $buffer = New-Object char[] 65536
    
    # 等待数据
    $maxWait = 120  # 最多等120秒
    $waited = 0
    while ($waited -lt $maxWait) {
        if ($stream.DataAvailable) {
            $count = $reader.Read($buffer, 0, $buffer.Length)
            $response += [String]::new($buffer, 0, $count)
            
            # 如果收到 completed 或 error，说明执行结束
            if ($response.Contains('"status":"completed"') -or $response.Contains('"status":"error"')) {
                break
            }
        }
        Start-Sleep -Milliseconds 1000
        $waited++
        
        # 每5秒显示进度
        if ($waited % 5 -eq 0) {
            Write-Host "." -NoNewline -ForegroundColor Gray
        }
    }
    
    Write-Host ""
    $client.Close()
    
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "   📋 执行结果" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    
    # 尝试解析并美化输出
    try {
        $lines = $response -split "`n"
        foreach ($line in $lines) {
            if ($line.Trim().Length -gt 0) {
                $json = $line | ConvertFrom-Json
                
                if ($json.status -eq "started") {
                    Write-Host "🚀 任务开始: $($json.goal)" -ForegroundColor Cyan
                }
                elseif ($json.status -eq "completed") {
                    if ($json.success) {
                        Write-Host "✅ 成功!" -ForegroundColor Green
                    } else {
                        Write-Host "❌ 失败" -ForegroundColor Red
                    }
                    Write-Host "📝 消息: $($json.message)" -ForegroundColor White
                    Write-Host "📊 执行步数: $($json.steps_executed)" -ForegroundColor Gray
                    
                    Write-Host "`n--- 执行日志 ---" -ForegroundColor Yellow
                    foreach ($log in $json.logs) {
                        $icon = switch ($log.type) {
                            "THINK" { "🧠" }
                            "ACTION" { "▶️" }
                            "OBSERVE" { "👁️" }
                            "ERROR" { "❌" }
                            "SUCCESS" { "✅" }
                            default { "📌" }
                        }
                        $color = switch ($log.type) {
                            "ERROR" { "Red" }
                            "SUCCESS" { "Green" }
                            "ACTION" { "Cyan" }
                            default { "White" }
                        }
                        Write-Host "$icon $($log.content)" -ForegroundColor $color
                    }
                }
                elseif ($json.status -eq "error") {
                    Write-Host "💥 错误: $($json.message)" -ForegroundColor Red
                }
            }
        }
    } catch {
        # 如果解析失败，直接输出原始响应
        Write-Host "原始响应:" -ForegroundColor Gray
        Write-Host $response
    }
    
} catch {
    Write-Host "❌ 连接错误: $_" -ForegroundColor Red
}
