# stop_ai.ps1
$client = New-Object System.Net.Sockets.TcpClient("127.0.0.1", 11451)
$writer = New-Object System.IO.StreamWriter($client.GetStream())
$writer.WriteLine("STOP_AI")
$writer.Flush()
Start-Sleep -Seconds 1
$client.Close()
Write-Host "AI stopped"
