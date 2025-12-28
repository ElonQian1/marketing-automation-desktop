# 测试 Android Agent ANALYZE 命令
$port = 11451
$host_addr = "127.0.0.1"

try {
    $client = New-Object System.Net.Sockets.TcpClient($host_addr, $port)
    $stream = $client.GetStream()
    $writer = New-Object System.IO.StreamWriter($stream)
    $reader = New-Object System.IO.StreamReader($stream)
    
    # 发送 ANALYZE 命令
    Write-Host "发送 ANALYZE 命令..."
    $writer.WriteLine("ANALYZE")
    $writer.Flush()
    
    # 等待响应
    Start-Sleep -Milliseconds 3000
    
    # 读取响应
    $response = ""
    $buffer = New-Object char[] 65536
    while ($stream.DataAvailable) {
        $count = $reader.Read($buffer, 0, $buffer.Length)
        $response += [String]::new($buffer, 0, $count)
    }
    
    $client.Close()
    
    Write-Host "=== 响应 (前 3000 字符) ==="
    if ($response.Length -gt 3000) {
        Write-Host $response.Substring(0, 3000)
        Write-Host "... (还有更多)"
    } else {
        Write-Host $response
    }
    
} catch {
    Write-Host "错误: $_"
}
