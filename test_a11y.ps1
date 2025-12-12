# test_a11y.ps1 - 测试 Android App A11y 连接

Write-Host "=== A11y 连接测试 ===" -ForegroundColor Cyan

$client = $null
try {
    Write-Host "1. 连接到 127.0.0.1:11451..."
    $client = New-Object System.Net.Sockets.TcpClient("127.0.0.1", 11451)
    $stream = $client.GetStream()
    $stream.ReadTimeout = 5000
    $stream.WriteTimeout = 2000
    Write-Host "   连接成功!" -ForegroundColor Green
    
    Write-Host "2. 发送 DUMP 命令..."
    $writer = New-Object System.IO.StreamWriter($stream)
    $writer.AutoFlush = $true
    $writer.WriteLine("DUMP")
    Write-Host "   命令已发送" -ForegroundColor Green
    
    Write-Host "3. 等待响应..."
    $reader = New-Object System.IO.StreamReader($stream)
    $response = $reader.ReadLine()
    
    if ($response) {
        Write-Host "   收到响应，长度: $($response.Length) 字符" -ForegroundColor Green
        
        # 保存响应到文件
        $response | Out-File -FilePath "a11y_response.json" -Encoding UTF8
        Write-Host "   响应已保存到 a11y_response.json" -ForegroundColor Cyan
        
        # 显示前500字符
        $preview = $response.Substring(0, [Math]::Min(500, $response.Length))
        Write-Host "`n响应预览:" -ForegroundColor Yellow
        Write-Host $preview
        
        if ($response.Length -gt 500) {
            Write-Host "... (还有 $($response.Length - 500) 字符)" -ForegroundColor Gray
        }
    } else {
        Write-Host "   未收到响应" -ForegroundColor Red
    }
} catch {
    Write-Host "错误: $_" -ForegroundColor Red
} finally {
    if ($client) { 
        $client.Close() 
        Write-Host "`n连接已关闭" -ForegroundColor Gray
    }
}
