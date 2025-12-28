# Send single command to Agent
param([string]$cmd = "ANALYZE")

$port = 11451
Write-Host "Sending command: $cmd" -ForegroundColor Cyan

try {
    $client = New-Object System.Net.Sockets.TcpClient("127.0.0.1", $port)
    $client.ReceiveTimeout = 30000
    $stream = $client.GetStream()
    $writer = New-Object System.IO.StreamWriter($stream)
    $reader = New-Object System.IO.StreamReader($stream)
    
    $writer.WriteLine($cmd)
    $writer.Flush()
    
    Start-Sleep -Seconds 3
    
    $buffer = New-Object char[] 65536
    $count = $reader.Read($buffer, 0, $buffer.Length)
    $response = [String]::new($buffer, 0, $count)
    
    Write-Host "Response:" -ForegroundColor Yellow
    Write-Host $response
    
    $client.Close()
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
