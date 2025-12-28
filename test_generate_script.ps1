# 测试 Android Agent GENERATE_SCRIPT 命令
$port = 11451
$host_addr = "127.0.0.1"
$goal = "找到点赞上万的笔记"

try {
    $client = New-Object System.Net.Sockets.TcpClient($host_addr, $port)
    $stream = $client.GetStream()
    $writer = New-Object System.IO.StreamWriter($stream)
    $reader = New-Object System.IO.StreamReader($stream)
    
    # 发送 GENERATE_SCRIPT 命令
    Write-Host "发送 GENERATE_SCRIPT 命令: $goal"
    $writer.WriteLine("GENERATE_SCRIPT:$goal")
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
    
    Write-Host "=== 响应 ==="
    Write-Host $response
    
} catch {
    Write-Host "错误: $_"
}
