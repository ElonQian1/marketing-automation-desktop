# 查看完整响应
$c = New-Object Net.Sockets.TcpClient("127.0.0.1", 11451)
$c.ReceiveTimeout = 5000
$s = $c.GetStream()
$w = [IO.StreamWriter]::new($s)
$r = [IO.StreamReader]::new($s)
$w.WriteLine("DUMP")
$w.Flush()
$resp = $r.ReadLine()
$c.Close()

Write-Host "原始响应 ($($resp.Length) 字节):"
Write-Host $resp
Write-Host ""
Write-Host "格式化 JSON:"
$resp | ConvertFrom-Json | ConvertTo-Json -Depth 10
